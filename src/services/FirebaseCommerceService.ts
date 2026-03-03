import { Firestore, Transaction, FieldValue } from 'firebase-admin/firestore';
import { BaseCommerceService } from './CommerceService';
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
    async createOrderFromCart(cart: Cart, items: CartItem[]): Promise<Order> {
        return this.db.runTransaction(async (transaction) => {
            // 1. Reserve stock (validates sellable qty inside transaction)
            await this.inventoryService.reserveStock(
                transaction,
                items.map(i => ({ inventoryRefId: i.inventoryRefId, qty: i.qty }))
            );

            // 2. Build reservation timestamps
            const now = new Date();
            const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);

            const reservation: OrderReservation = {
                status: 'active',
                reservedAt: now as any,
                expiresAt: expiresAt as any,
            };

            // 3. Create Order
            const orderRef = this.db.collection('orders').doc();
            const orderNumber = `ZM-${Date.now()}`;

            const orderData: Partial<Order> = {
                id: orderRef.id,
                orderNumber,
                userId: cart.userId,
                status: 'pending_payment',
                paymentStatus: 'pending',
                locationId: cart.locationId,
                reservation,
                externalSource: 'firebase',
                createdAt: now as any,
                updatedAt: now as any,
            };

            transaction.set(orderRef, orderData);

            // 4. Create Order Items (snapshots)
            for (const item of items) {
                const itemRef = orderRef.collection('items').doc();
                const orderItem: OrderItem = {
                    id: itemRef.id,
                    orderId: orderRef.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    locationId: cart.locationId,
                    inventoryRefId: item.inventoryRefId,
                    qty: item.qty,
                    snapshot: {
                        name: item.nameSnapshot,
                        sku: '',
                        price: item.priceSnapshot,
                        image: item.imageSnapshot,
                        description: '',
                        attributes: {},
                    },
                };
                transaction.set(itemRef, orderItem);
            }

            // 5. Mark cart as converted
            transaction.update(this.db.collection('carts').doc(cart.id), {
                status: 'converted',
                updatedAt: now,
            });

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

        return this.db.runTransaction(async (t) => {
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
            await this.inventoryService.confirmStockDeduction(t, items.map(i => ({
                inventoryRefId: i.inventoryRefId,
                qty: i.qty,
            })));

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

            // ── FIX A: use t.get() for sub-collection reads inside a transaction ──
            const itemsSnap = await t.get(orderRef.collection('items'));
            const items = itemsSnap.docs.map(d => d.data() as OrderItem);

            await this.inventoryService.releaseStock(t, items.map(i => ({
                inventoryRefId: i.inventoryRefId,
                qty: i.qty,
            })));

            t.update(orderRef, {
                status: 'cancelled',
                'reservation.status': 'released',
                updatedAt: FieldValue.serverTimestamp(),
            });
        });
    }
}
