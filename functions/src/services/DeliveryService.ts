import * as admin from 'firebase-admin';
import { Firestore, FieldValue, Transaction } from 'firebase-admin/firestore';
import { Delivery, DeliveryPublicView, DeliveryStatus, DeliveryTimelineEvent } from '../models/delivery';
import { Order } from '../models/order';

export class DeliveryService {
    constructor(private db: Firestore) { }

    /**
     * Creates a delivery for a paid order.
     *
     * ✅ IDEMPOTENCY GUARD:
     * Checks order.deliveryId first. If already set, does nothing.
     * Uses a transaction so the deliveryId write and delivery creation are atomic.
     */
    async createDelivery(order: Order): Promise<string | null> {
        const orderRef = this.db.collection('orders').doc(order.id);

        return this.db.runTransaction(async (t): Promise<string | null> => {
            const orderSnap = await t.get(orderRef);
            if (!orderSnap.exists) throw new Error(`Order not found: ${order.id}`);

            const freshOrder = orderSnap.data() as Order;

            // ── Idempotency guard ─────────────────────────────────────────────
            if (freshOrder.deliveryId) {
                console.log(`[createDelivery] Delivery already exists for order ${order.id}: ${freshOrder.deliveryId}`);
                return freshOrder.deliveryId;
            }

            const now = admin.firestore.Timestamp.now();
            const deliveryRef = this.db.collection('deliveries').doc();

            const delivery: Delivery = {
                id: deliveryRef.id,
                orderId: order.id,
                locationId: order.locationId,
                status: 'queued',
                pickup: {
                    storeId: order.assignedStoreId ?? '',
                    address: '',
                    scheduledAt: now,
                },
                dropoff: {
                    address: order.recipient?.address ?? '',
                    recipientName: order.recipient?.name ?? '',
                    recipientPhone: order.recipient?.phone ?? '',
                },
                timeline: [{
                    status: 'queued',
                    timestamp: now,
                    note: 'Order paid — delivery queued',
                }],
                createdAt: now,
                updatedAt: now,
            };

            // Write delivery
            t.set(deliveryRef, delivery);

            // Stamp deliveryId back on the order (prevents duplicate creation)
            t.update(orderRef, {
                deliveryId: deliveryRef.id,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Write customer-safe public view
            const publicRef = this.db.collection('delivery_public').doc(order.id);
            t.set(publicRef, this._buildPublicView(delivery));

            return deliveryRef.id;
        });
    }

    /**
     * Assigns a driver to a delivery.
     */
    async assignDriver(
        deliveryId: string,
        driver: { uid: string; name: string; phone: string },
        note?: string
    ): Promise<void> {
        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);

        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists) throw new Error(`Delivery not found: ${deliveryId}`);

            const timeline: DeliveryTimelineEvent[] = snap.get('timeline') ?? [];
            const event: DeliveryTimelineEvent = {
                status: 'assigned',
                timestamp: admin.firestore.Timestamp.now(),
                note: note ?? `Assigned to driver: ${driver.name}`,
            };

            t.update(deliveryRef, {
                assignedDriver: driver,
                status: 'assigned',
                timeline: [...timeline, event],
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Sync public view
            const orderId = snap.get('orderId') as string;
            await this._syncPublicView(t, orderId, 'assigned', event);
        });
    }

    /**
     * Updates delivery status and syncs the public view.
     * Validates allowed status transitions server-side.
     */
    async updateStatus(
        deliveryId: string,
        newStatus: DeliveryStatus,
        note?: string
    ): Promise<void> {
        const TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
            queued: ['assigned'],
            assigned: ['picked_up', 'queued'],
            picked_up: ['in_transit'],
            in_transit: ['delivered', 'failed'],
            delivered: [],
            failed: ['returned'],
            returned: [],
        };

        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);

        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists) throw new Error(`Delivery not found: ${deliveryId}`);

            const delivery = snap.data() as Delivery;
            const allowed = TRANSITIONS[delivery.status];

            if (!allowed.includes(newStatus)) {
                throw new Error(`Invalid transition: ${delivery.status} → ${newStatus}`);
            }

            const event: DeliveryTimelineEvent = {
                status: newStatus,
                timestamp: admin.firestore.Timestamp.now(),
                note,
            };

            const update: any = {
                status: newStatus,
                timeline: [...(delivery.timeline ?? []), event],
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (newStatus === 'delivered') {
                update.deliveredAt = FieldValue.serverTimestamp();
            }

            t.update(deliveryRef, update);

            // Sync customer-safe public view — pass orderId from already-read delivery snap
            await this._syncPublicView(t, delivery.orderId, newStatus, event, delivery.proof);
        });
    }

    /**
     * Records proof of delivery (OTP verified, photo uploaded).
     * Does NOT store the raw storagePath publicly.
     */
    async recordProof(
        deliveryId: string,
        storagePath: string,
        otpVerified: boolean
    ): Promise<void> {
        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);

        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists) throw new Error(`Delivery not found: ${deliveryId}`);

            t.update(deliveryRef, {
                proof: { storagePath, otpVerified, signedAt: FieldValue.serverTimestamp() },
                updatedAt: FieldValue.serverTimestamp(),
            } as any);

            // Update public proof summary (boolean flags only)
            const orderId = snap.get('orderId') as string;
            const publicRef = this.db.collection('delivery_public').doc(orderId);
            t.update(publicRef, {
                'proofSummary.photoUploaded': true,
                'proofSummary.otpVerified': otpVerified,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private _buildPublicView(d: Delivery): DeliveryPublicView {
        return {
            orderId: d.orderId,
            status: d.status,
            timeline: d.timeline.map(e => ({ status: e.status, timestamp: e.timestamp })),
            proofSummary: {
                otpVerified: d.proof?.otpVerified ?? false,
                photoUploaded: !!d.proof?.storagePath,
            },
            deliveredAt: d.deliveredAt,
            updatedAt: d.updatedAt,
        };
    }

    private async _syncPublicView(
        t: Transaction,
        orderId: string,            // FIX B: accept orderId directly — no extra read needed
        status: DeliveryStatus,
        event: DeliveryTimelineEvent,
        proof?: Delivery['proof']
    ): Promise<void> {
        if (!orderId) return;

        const publicRef = this.db.collection('delivery_public').doc(orderId);
        const publicSnap = await t.get(publicRef);
        if (!publicSnap.exists) return;

        const existingTimeline: any[] = publicSnap.get('timeline') ?? [];

        const update: Record<string, any> = {
            status,
            timeline: [...existingTimeline, { status: event.status, timestamp: event.timestamp }],
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (proof) {
            update['proofSummary.otpVerified'] = proof.otpVerified ?? false;
            update['proofSummary.photoUploaded'] = !!proof.storagePath;
        }

        t.update(publicRef, update);
    }
}
