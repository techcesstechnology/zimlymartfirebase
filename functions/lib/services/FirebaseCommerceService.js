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
    async createOrder(payload) {
        return this.db.runTransaction(async (transaction) => {
            const { userId, items, locationId, recipient, city, areaId, areaName, deliveryFee, promoCode } = payload;
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c) => ({
                        inventoryRefId: c.inventoryRefId,
                        qty: c.qty * i.qty
                    }));
                }
                return [{ inventoryRefId: i.inventoryRefId, qty: i.qty }];
            });
            await this.inventoryService.reserveStock(transaction, flattenedItems);
            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000));
            const reservation = {
                status: 'active',
                reservedAt: now,
                expiresAt: expiresAt,
            };
            let discountAmount = 0;
            let validatedPromoCode;
            let promoRef;
            if (promoCode) {
                const promoSnap = await this.db.collection('promotions')
                    .where('code', '==', promoCode.toUpperCase().trim())
                    .limit(1)
                    .get();
                if (!promoSnap.empty) {
                    const promoDoc = promoSnap.docs[0];
                    const promo = promoDoc.data();
                    const now_ms = Date.now();
                    const startOk = !promo.startDate || promo.startDate.seconds * 1000 <= now_ms;
                    const endOk = !promo.endDate || promo.endDate.seconds * 1000 >= now_ms;
                    const activeOk = promo.isActive === true;
                    const limitOk = !promo.usageLimit || promo.usageCount < promo.usageLimit;
                    const subtotalForCheck = items.reduce((sum, i) => sum + (i.priceSnapshot || 0) * (i.quantity || i.qty || 1), 0);
                    const minSpendOk = !promo.minSpend || subtotalForCheck >= promo.minSpend;
                    if (startOk && endOk && activeOk && limitOk && minSpendOk) {
                        if (promo.discountType === 'percentage') {
                            discountAmount = parseFloat(((subtotalForCheck * promo.value) / 100).toFixed(2));
                        }
                        else {
                            discountAmount = Math.min(promo.value, subtotalForCheck);
                        }
                        validatedPromoCode = promoCode.toUpperCase().trim();
                        promoRef = promoDoc.ref;
                    }
                }
            }
            const orderRef = this.db.collection('orders').doc();
            const orderNumber = `ZM-${Date.now()}`;
            const subtotal = items.reduce((sum, i) => sum + (i.priceSnapshot || 0) * (i.quantity || i.qty || 1), 0);
            const total = Math.max(0, subtotal + deliveryFee - discountAmount);
            const orderData = {
                id: orderRef.id,
                orderNumber,
                userId,
                status: 'pending_payment',
                paymentStatus: 'pending',
                fulfillmentStatus: 'pending',
                locationId,
                assignedStoreId: '',
                reservation,
                externalSource: 'firebase',
                pricing: {
                    subtotal,
                    deliveryFee,
                    taxTotal: 0,
                    discountAmount,
                    total,
                    currency: 'USD',
                    ...(validatedPromoCode && { promoCode: validatedPromoCode }),
                },
                buyer: { name: '', phone: '', address: '' },
                recipient,
                createdAt: now,
                updatedAt: now,
            };
            orderData.city = city;
            orderData.areaId = areaId;
            orderData.areaName = areaName;
            transaction.set(orderRef, orderData);
            if (promoRef) {
                transaction.update(promoRef, { usageCount: firestore_1.FieldValue.increment(1) });
            }
            for (const item of items) {
                const itemRef = orderRef.collection('items').doc();
                const itemQty = item.quantity || item.qty || 1;
                const orderItem = {
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
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c) => ({
                        inventoryRefId: c.inventoryRefId,
                        qty: c.qty * i.qty,
                    }));
                }
                return [{ inventoryRefId: i.inventoryRefId, qty: i.qty }];
            });
            await this.inventoryService.confirmStockDeduction(t, flattenedItems);
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
            const flattenedItems = items.flatMap(i => {
                if (i.type === 'bundle' && i.components) {
                    return i.components.map((c) => ({
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