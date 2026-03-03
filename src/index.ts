import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createHmac } from 'crypto';
import { FirebaseCommerceService } from './services/FirebaseCommerceService';
import { DeliveryService } from './services/DeliveryService';
import { Order } from './models/order';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const commerceService = new FirebaseCommerceService(db);
const deliveryService = new DeliveryService(db);

// ═══════════════════════════════════════════════════════════════════════════════
// 1️⃣  RESERVE STOCK — callable (client-initiated checkout)
// ═══════════════════════════════════════════════════════════════════════════════
export const reserveStock = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { cartId, locationId } = data;
    if (!cartId || !locationId) {
        throw new functions.https.HttpsError('invalid-argument', 'cartId and locationId are required');
    }

    const cartRef = db.collection('carts').doc(cartId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Cart not found');
    }

    // Security: ensure the cart belongs to the calling user
    if (cartDoc.data()!.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Cart does not belong to this user');
    }

    const itemsSnap = await cartRef.collection('items').get();
    const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    if (items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Cart is empty');
    }

    try {
        const order = await commerceService.createOrderFromCart(cartDoc.data() as any, items);
        return { success: true, orderId: order.id, orderNumber: order.orderNumber };
    } catch (err: any) {
        console.error('[reserveStock] failed:', err.message);
        throw new functions.https.HttpsError('internal', err.message);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2️⃣  PAYMENT WEBHOOK — idempotent (payment provider → Firebase)
// ═══════════════════════════════════════════════════════════════════════════════
export const paymentWebhook = functions.https.onRequest(async (req, res) => {
    // ── Signature verification (Paynow / Stripe pattern) ─────────────────────
    const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? '';
    const signature = req.headers['x-provider-signature'] as string | undefined;

    if (secret && signature) {
        const expected = createHmac('sha256', secret)
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
            // ── Idempotent confirmation ───────────────────────────────────────
            const { alreadyProcessed } = await commerceService.confirmPayment(
                providerRef,
                webhookEventId,
                req.body
            );

            if (alreadyProcessed) {
                console.log(`[paymentWebhook] Duplicate event ${webhookEventId} — acknowledged`);
            }

            res.status(200).send('OK');
        } else if (status === 'failed' || status === 'cancelled') {
            // ── Release reservation on payment failure ────────────────────────
            if (orderId) {
                await commerceService.releaseReservation(orderId);
            }
            // Mark payment as failed
            await db.collection('payments').doc(providerRef).update({
                status: 'failed',
                webhookEventId,
                rawPayload: req.body,
                processedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            res.status(200).send('OK');
        } else {
            res.status(400).send(`Unknown status: ${status}`);
        }
    } catch (err: any) {
        console.error('[paymentWebhook] error:', err.message);
        res.status(500).send(err.message);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3️⃣  ON ORDER PAID — Firestore trigger → create delivery (idempotent)
// ═══════════════════════════════════════════════════════════════════════════════
export const onOrderPaid = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change) => {
        const newData = change.after.data() as Order;
        const oldData = change.before.data() as Order;

        // Only react to the specific transition paid
        if (newData.status !== 'paid' || oldData.status === 'paid') return;

        // Idempotency is enforced INSIDE createDelivery via order.deliveryId check
        const deliveryId = await deliveryService.createDelivery(newData);
        console.log(`[onOrderPaid] Delivery ${deliveryId} created for order ${newData.id}`);
    });

// ═══════════════════════════════════════════════════════════════════════════════
// 4️⃣  RESERVATION EXPIRY — scheduled, every 5 minutes
// ═══════════════════════════════════════════════════════════════════════════════
export const expireReservations = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async () => {
        const now = admin.firestore.Timestamp.now();

        // Find all active reservations that have expired
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

        // Process serially to avoid transaction contention
        for (const doc of expiredSnap.docs) {
            try {
                await commerceService.releaseReservation(doc.id);
                console.log(`[expireReservations] Released order ${doc.id}`);
            } catch (err: any) {
                console.error(`[expireReservations] Failed for ${doc.id}:`, err.message);
            }
        }
    });

// ═══════════════════════════════════════════════════════════════════════════════
// 5️⃣  SIGNED PROOF URL — customer requests proof photo (2-min signed URL)
// ═══════════════════════════════════════════════════════════════════════════════
export const getDeliveryProofUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }

    const { orderId } = data;
    if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'orderId required');

    // 1. Verify caller owns the order
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found');

    const order = orderSnap.data() as Order;
    if (order.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your order');
    }

    // 2. Get delivery to find storage path
    if (!order.deliveryId) {
        throw new functions.https.HttpsError('not-found', 'No delivery found for this order');
    }

    const deliverySnap = await db.collection('deliveries').doc(order.deliveryId).get();
    if (!deliverySnap.exists) throw new functions.https.HttpsError('not-found', 'Delivery not found');

    const storagePath = deliverySnap.data()?.proof?.storagePath as string | undefined;
    if (!storagePath) {
        throw new functions.https.HttpsError('not-found', 'Proof photo not yet uploaded');
    }

    // 3. Generate 2-minute signed URL
    const expiresMs = Date.now() + 2 * 60 * 1000;
    const [signedUrl] = await storage
        .bucket()
        .file(storagePath)
        .getSignedUrl({ action: 'read', expires: expiresMs });

    return { signedUrl, expiresAt: new Date(expiresMs).toISOString() };
});
