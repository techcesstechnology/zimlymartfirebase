import * as admin from 'firebase-admin';
import { Firestore, Transaction, FieldValue } from 'firebase-admin/firestore';
import { BaseCommerceService, CheckoutPayload } from './CommerceService';
import { InventoryService } from './InventoryService';
import { Cart, CartItem } from '../models/cart';
import { Order, OrderItem, OrderReservation } from '../models/order';

const RESERVATION_MINUTES = 15;

export class FirebaseCommerceService extends BaseCommerceService {
    private inventoryService: InventoryService;

    constructor(private db: Firestore) {
        super();
        this.inventoryService = new InventoryService(db);
    }

    /**
     * Creates an order with a 15-minute reservation window.
     * Transaction-safe — stock, order, and reservation are committed atomically.
     */
    async createOrder(payload: CheckoutPayload): Promise<Order> {
        return this.db.runTransaction(async (transaction): Promise<Order> => {
            const { userId, items, locationId, recipient, city, areaId, areaName, deliveryFee } = payload;

            // 1. Reserve stock (validates sellable qty inside transaction)
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c: any) => ({
                        inventoryRefId: c.inventoryRefId,
                        qty: c.qty * i.qty
                    }));
                }
                return [{ inventoryRefId: i.inventoryRefId, qty: i.qty }];
            });

            await this.inventoryService.reserveStock(
                transaction,
                flattenedItems
            );

            // 2. Build reservation timestamps
            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000));

            const reservation: OrderReservation = {
                status: 'active',
                reservedAt: now,
                expiresAt: expiresAt,
            };

            // 3. Create Order
            const orderRef = this.db.collection('orders').doc();
            const orderNumber = `ZM-${Date.now()}`;

            // Recompute subtotal using frontend snapshot (must be identical)
            const subtotal = items.reduce((sum, i) => sum + (i.priceSnapshot || 0) * (i.quantity || i.qty || 1), 0);
            const total = subtotal + deliveryFee;

            const orderData: Order = {
                id: orderRef.id,
                orderNumber,
                userId,
                status: 'pending_payment',
                paymentStatus: 'pending',
                fulfillmentStatus: 'pending',
                locationId,
                assignedStoreId: '', // Default or from cart
                reservation,
                externalSource: 'firebase',
                pricing: {
                    subtotal,
                    deliveryFee,
                    taxTotal: 0,
                    total,
                    currency: 'USD',
                },
                buyer: { name: '', phone: '', address: '' },
                recipient,
                createdAt: now,
                updatedAt: now,
                // Add area details (which aren't fully modeled in models.ts but are needed)
            } as Order;

            // Since we expanded the model with city/area implicitly in usage:
            (orderData as any).city = city;
            (orderData as any).areaId = areaId;
            (orderData as any).areaName = areaName;

            transaction.set(orderRef, orderData);

            // 4. Create Order Items (snapshots)
            for (const item of items) {
                const itemRef = orderRef.collection('items').doc();
                const itemQty = item.quantity || item.qty || 1;
                const orderItem: OrderItem = {
                    id: itemRef.id,
                    orderId: orderRef.id,
                    type: item.type,
                    productId: item.productId || item.bundleId || '',
                    variantId: item.variantId || '',
                    locationId,
                    inventoryRefId: item.inventoryRefId || '',
                    qty: itemQty,
                    snapshot: {
                        name: item.nameSnapshot,
                        sku: '',
                        price: item.priceSnapshot,
                        image: item.imageSnapshot,
                        description: '',
                        attributes: {},
                    },
                    bundleId: item.bundleId,
                    components: item.components
                };
                transaction.set(itemRef, orderItem);
            }

            return orderData as Order;
        });
    }

    /**
     * Idempotent payment confirmation.
     * Uses providerRef as the payment doc ID and processedAt as a one-time flag.
     * Safe against duplicate webhook calls.
     */
    async confirmPayment(
        providerRef: string,
        webhookEventId: string,
        rawPayload: any
    ): Promise<{ alreadyProcessed: boolean }> {
        const paymentRef = this.db.collection('payments').doc(providerRef);

        return this.db.runTransaction(async (t): Promise<{ alreadyProcessed: boolean }> => {
            const paymentSnap = await t.get(paymentRef);

            // ── Idempotency guard (payment already fully processed) ───────────
            if (paymentSnap.exists && paymentSnap.data()!.processedAt) {
                console.log(`[confirmPayment] Already processed: ${providerRef}`);
                return { alreadyProcessed: true };
            }

            // Payment doc may not exist yet if provider sends webhook before
            // we create the payment record — derive orderId from the passed payload.
            const orderId = paymentSnap.exists
                ? (paymentSnap.data() as any).orderId
                : rawPayload?.orderId as string | undefined;

            if (!orderId) throw new Error(`Cannot resolve orderId for providerRef: ${providerRef}`);

            const orderRef = this.db.collection('orders').doc(orderId);
            const orderSnap = await t.get(orderRef);

            if (!orderSnap.exists) throw new Error(`Order not found: ${orderId}`);

            const order = orderSnap.data() as Order;

            // ── Order-level idempotency guard ─────────────────────────────────
            if (order.paymentStatus === 'paid') {
                console.log(`[confirmPayment] Order already paid: ${orderId}`);
                return { alreadyProcessed: true };
            }

            // ── FIX A: use t.get() — reads inside a transaction must go through t ──
            const itemsSnap = await t.get(orderRef.collection('items'));
            const items = itemsSnap.docs.map(d => d.data() as OrderItem);

            // Flatten for stock deduction confirmation
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c: any) => ({
                        inventoryRefId: c.inventoryRefId,
                        qty: c.qty * i.qty,
                    }));
                }
                return [{ inventoryRefId: i.inventoryRefId, qty: i.qty }];
            });

            await this.inventoryService.confirmStockDeduction(t, flattenedItems);

            // ── Mark order as paid ────────────────────────────────────────────
            t.update(orderRef, {
                status: 'paid',
                paymentStatus: 'paid',
                'reservation.status': 'converted',
                updatedAt: FieldValue.serverTimestamp(),
            });

            // ── Upsert payment doc (handles missing doc case) + idempotency lock
            const paymentWrite = {
                orderId,
                providerRef,
                status: 'successful',
                webhookEventId,
                rawPayload,
                processedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            if (paymentSnap.exists) {
                t.update(paymentRef, paymentWrite);
            } else {
                t.set(paymentRef, { ...paymentWrite, createdAt: FieldValue.serverTimestamp() });
            }

            return { alreadyProcessed: false };
        });
    }

    /**
     * Releases reservation after expiry or payment failure.
     */
    async releaseReservation(orderId: string): Promise<void> {
        await this.db.runTransaction(async (t) => {
            const orderRef = this.db.collection('orders').doc(orderId);
            const orderSnap = await t.get(orderRef);
            if (!orderSnap.exists) return;

            const order = orderSnap.data() as Order;
            if (order.reservation?.status !== 'active') return; // already released

            const itemsSnap = await t.get(orderRef.collection('items'));
            const items = itemsSnap.docs.map(d => d.data() as OrderItem);

            // Flatten for stock release
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c: any) => ({
                        inventoryRefId: c.inventoryRefId,
                        qty: c.qty * i.qty,
                    }));
                }
                return [{ inventoryRefId: i.inventoryRefId, qty: i.qty }];
            });

            await this.inventoryService.releaseStock(t, flattenedItems);

            t.update(orderRef, {
                status: 'cancelled',
                'reservation.status': 'released',
                updatedAt: FieldValue.serverTimestamp(),
            });
        });
    }

    async updateOrderStatus(orderId: string, status: any): Promise<void> {
        await this.db.collection('orders').doc(orderId).update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    async getInventoryForVariant(variantId: string, locationId: string): Promise<any> {
        const snap = await this.db.collection('inventory')
            .where('variantId', '==', variantId)
            .where('locationId', '==', locationId)
            .limit(1)
            .get();
        return snap.empty ? null : snap.docs[0].data();
    }
}
