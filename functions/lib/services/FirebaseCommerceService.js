"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseCommerceService = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const CommerceService_1 = require("./CommerceService");
const InventoryService_1 = require("./InventoryService");
const RESERVATION_MINUTES = 15;
class FirebaseCommerceService extends CommerceService_1.BaseCommerceService {
    db;
    inventoryService;
    constructor(db) {
        super();
        this.db = db;
        this.inventoryService = new InventoryService_1.InventoryService(db);
    }
    async createOrderFromCart(cart, items) {
        return this.db.runTransaction(async (transaction) => {
            await this.inventoryService.reserveStock(transaction, items.map(i => ({ inventoryRefId: i.inventoryRefId, qty: i.qty })));
            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000));
            const reservation = {
                status: 'active',
                reservedAt: now,
                expiresAt: expiresAt,
            };
            const orderRef = this.db.collection('orders').doc();
            const orderNumber = `ZM-${Date.now()}`;
            const orderData = {
                id: orderRef.id,
                orderNumber,
                userId: cart.userId,
                status: 'pending_payment',
                paymentStatus: 'pending',
                fulfillmentStatus: 'pending',
                locationId: cart.locationId,
                assignedStoreId: '',
                reservation,
                externalSource: 'firebase',
                pricing: {
                    subtotal: items.reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0),
                    deliveryFee: 0,
                    taxTotal: 0,
                    total: items.reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0),
                    currency: 'USD',
                },
                buyer: { name: '', phone: '', address: '' },
                recipient: { name: '', phone: '', address: '' },
                createdAt: now,
                updatedAt: now,
            };
            transaction.set(orderRef, orderData);
            for (const item of items) {
                const itemRef = orderRef.collection('items').doc();
                const orderItem = {
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
            transaction.update(this.db.collection('carts').doc(cart.id), {
                status: 'converted',
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            return orderData;
        });
    }
    async confirmPayment(providerRef, webhookEventId, rawPayload) {
        const paymentRef = this.db.collection('payments').doc(providerRef);
        return this.db.runTransaction(async (t) => {
            const paymentSnap = await t.get(paymentRef);
            if (paymentSnap.exists && paymentSnap.data().processedAt) {
                console.log(`[confirmPayment] Already processed: ${providerRef}`);
                return { alreadyProcessed: true };
            }
            const orderId = paymentSnap.exists
                ? paymentSnap.data().orderId
                : rawPayload?.orderId;
            if (!orderId)
                throw new Error(`Cannot resolve orderId for providerRef: ${providerRef}`);
            const orderRef = this.db.collection('orders').doc(orderId);
            const orderSnap = await t.get(orderRef);
            if (!orderSnap.exists)
                throw new Error(`Order not found: ${orderId}`);
            const order = orderSnap.data();
            if (order.paymentStatus === 'paid') {
                console.log(`[confirmPayment] Order already paid: ${orderId}`);
                return { alreadyProcessed: true };
            }
            const itemsSnap = await t.get(orderRef.collection('items'));
            const items = itemsSnap.docs.map(d => d.data());
            await this.inventoryService.confirmStockDeduction(t, items.map(i => ({
                inventoryRefId: i.inventoryRefId,
                qty: i.qty,
            })));
            t.update(orderRef, {
                status: 'paid',
                paymentStatus: 'paid',
                'reservation.status': 'converted',
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            const paymentWrite = {
                orderId,
                providerRef,
                status: 'successful',
                webhookEventId,
                rawPayload,
                processedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            if (paymentSnap.exists) {
                t.update(paymentRef, paymentWrite);
            }
            else {
                t.set(paymentRef, { ...paymentWrite, createdAt: firestore_1.FieldValue.serverTimestamp() });
            }
            return { alreadyProcessed: false };
        });
    }
    async releaseReservation(orderId) {
        await this.db.runTransaction(async (t) => {
            const orderRef = this.db.collection('orders').doc(orderId);
            const orderSnap = await t.get(orderRef);
            if (!orderSnap.exists)
                return;
            const order = orderSnap.data();
            if (order.reservation?.status !== 'active')
                return;
            const itemsSnap = await t.get(orderRef.collection('items'));
            const items = itemsSnap.docs.map(d => d.data());
            await this.inventoryService.releaseStock(t, items.map(i => ({
                inventoryRefId: i.inventoryRefId,
                qty: i.qty,
            })));
            t.update(orderRef, {
                status: 'cancelled',
                'reservation.status': 'released',
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
    }
    async updateOrderStatus(orderId, status) {
        await this.db.collection('orders').doc(orderId).update({
            status,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    async getInventoryForVariant(variantId, locationId) {
        const snap = await this.db.collection('inventory')
            .where('variantId', '==', variantId)
            .where('locationId', '==', locationId)
            .limit(1)
            .get();
        return snap.empty ? null : snap.docs[0].data();
    }
}
exports.FirebaseCommerceService = FirebaseCommerceService;
//# sourceMappingURL=FirebaseCommerceService.js.map