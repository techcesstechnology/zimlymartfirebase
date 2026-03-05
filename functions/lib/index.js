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
exports.getDeliveryProofUrl = exports.expireReservations = exports.onOrderPaid = exports.paymentWebhook = exports.capturePayPalOrder = exports.createPayPalOrder = exports.reserveStock = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const crypto_1 = require("crypto");
const FirebaseCommerceService_1 = require("./services/FirebaseCommerceService");
const DeliveryService_1 = require("./services/DeliveryService");
const PayPalService_1 = require("./services/PayPalService");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const commerceService = new FirebaseCommerceService_1.FirebaseCommerceService(db);
const deliveryService = new DeliveryService_1.DeliveryService(db);
const paypalService = new PayPalService_1.PayPalService();
exports.reserveStock = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    const { userId, items, locationId, recipient, city, areaId, areaName, deliveryFee } = data;
    if (!userId || !items || !locationId || !recipient) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required checkout fields');
    }
    if (userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot create order for another user');
    }
    if (items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Cart is empty');
    }
    try {
        const order = await commerceService.createOrder({
            userId, items, locationId, recipient, city, areaId, areaName, deliveryFee
        });
        return { success: true, orderId: order.id, orderNumber: order.orderNumber };
    }
    catch (err) {
        console.error('[reserveStock] failed:', err.message);
        throw new functions.https.HttpsError('internal', err.message);
    }
});
exports.createPayPalOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    const { orderId } = data;
    if (!orderId)
        throw new functions.https.HttpsError('invalid-argument', 'orderId required');
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Order not found');
    const order = orderSnap.data();
    if (order.userId !== context.auth.uid)
        throw new functions.https.HttpsError('permission-denied', 'Not your order');
    try {
        const paypalOrderId = await paypalService.createOrder(order.id, order.pricing.total, order.pricing.currency);
        await db.collection('orders').doc(orderId).update({
            paymentProvider: 'paypal',
            paymentProviderOrderId: paypalOrderId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { paypalOrderId };
    }
    catch (err) {
        console.error('[createPayPalOrder] failed:', err.message);
        throw new functions.https.HttpsError('internal', err.message);
    }
});
exports.capturePayPalOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    const { paypalOrderId, orderId } = data;
    if (!paypalOrderId || !orderId)
        throw new functions.https.HttpsError('invalid-argument', 'paypalOrderId and orderId required');
    try {
        const captureData = await paypalService.captureOrder(paypalOrderId);
        if (captureData.status === 'COMPLETED') {
            const captureId = captureData.purchase_units[0].payments.captures[0].id;
            await commerceService.confirmPayment(captureId, paypalOrderId, captureData);
            return { success: true, captureId };
        }
        else {
            return { success: false, status: captureData.status };
        }
    }
    catch (err) {
        console.error('[capturePayPalOrder] failed:', err.message);
        throw new functions.https.HttpsError('internal', err.message);
    }
});
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? '';
    const signature = req.headers['x-provider-signature'];
    if (secret && signature) {
        const expected = (0, crypto_1.createHmac)('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        if (signature !== expected) {
            console.warn('[paymentWebhook] Invalid signature — rejected');
            res.status(401).send('Invalid signature');
            return;
        }
    }
    const { providerRef, webhookEventId, status, orderId } = req.body;
    if (!providerRef || !webhookEventId || !status) {
        res.status(400).send('Missing required fields: providerRef, webhookEventId, status');
        return;
    }
    try {
        if (status === 'success' || status === 'paid') {
            const { alreadyProcessed } = await commerceService.confirmPayment(providerRef, webhookEventId, req.body);
            if (alreadyProcessed) {
                console.log(`[paymentWebhook] Duplicate event ${webhookEventId} — acknowledged`);
            }
            res.status(200).send('OK');
        }
        else if (status === 'failed' || status === 'cancelled') {
            if (orderId) {
                await commerceService.releaseReservation(orderId);
            }
            await db.collection('payments').doc(providerRef).update({
                status: 'failed',
                webhookEventId,
                rawPayload: req.body,
                processedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            res.status(200).send('OK');
        }
        else {
            res.status(400).send(`Unknown status: ${status}`);
        }
    }
    catch (err) {
        console.error('[paymentWebhook] error:', err.message);
        res.status(500).send(err.message);
    }
});
exports.onOrderPaid = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    if (newData.status !== 'paid' || oldData.status === 'paid')
        return;
    const deliveryId = await deliveryService.createDelivery(newData);
    console.log(`[onOrderPaid] Delivery ${deliveryId} created for order ${newData.id}`);
});
exports.expireReservations = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const expiredSnap = await db.collection('orders')
        .where('reservation.status', '==', 'active')
        .where('reservation.expiresAt', '<', now)
        .where('paymentStatus', '==', 'pending')
        .get();
    if (expiredSnap.empty) {
        console.log('[expireReservations] Nothing to expire');
        return;
    }
    console.log(`[expireReservations] Processing ${expiredSnap.size} expired reservations`);
    for (const doc of expiredSnap.docs) {
        try {
            await commerceService.releaseReservation(doc.id);
            console.log(`[expireReservations] Released order ${doc.id}`);
        }
        catch (err) {
            console.error(`[expireReservations] Failed for ${doc.id}:`, err.message);
        }
    }
});
exports.getDeliveryProofUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    const { orderId } = data;
    if (!orderId)
        throw new functions.https.HttpsError('invalid-argument', 'orderId required');
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Order not found');
    const order = orderSnap.data();
    if (order.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your order');
    }
    if (!order.deliveryId) {
        throw new functions.https.HttpsError('not-found', 'No delivery found for this order');
    }
    const deliverySnap = await db.collection('deliveries').doc(order.deliveryId).get();
    if (!deliverySnap.exists)
        throw new functions.https.HttpsError('not-found', 'Delivery not found');
    const storagePath = deliverySnap.data()?.proof?.storagePath;
    if (!storagePath) {
        throw new functions.https.HttpsError('not-found', 'Proof photo not yet uploaded');
    }
    const expiresMs = Date.now() + 2 * 60 * 1000;
    const [signedUrl] = await storage
        .bucket()
        .file(storagePath)
        .getSignedUrl({ action: 'read', expires: expiresMs });
    return { signedUrl, expiresAt: new Date(expiresMs).toISOString() };
});
//# sourceMappingURL=index.js.map