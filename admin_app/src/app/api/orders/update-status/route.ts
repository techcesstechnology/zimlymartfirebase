import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialise Admin SDK (server-only, never in client bundle)
if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)) });
}
const adminDb = getFirestore();

const VALID_TRANSITIONS: Record<string, string[]> = {
    pending_payment: ['paid', 'cancelled', 'failed'],
    paid: ['processing'],
    processing: ['packed'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'failed'],
    delivered: [],
    cancelled: [],
    failed: [],
};

export async function POST(req: Request) {
    try {
        const { orderId, status, adminName } = await req.json();

        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const currentStatus = orderDoc.data()!.status;
        const allowed = VALID_TRANSITIONS[currentStatus];

        if (!allowed.includes(status)) {
            return NextResponse.json(
                { error: `Cannot transition from ${currentStatus} to ${status}` },
                { status: 400 }
            );
        }

        const batch = adminDb.batch();

        // Update order
        batch.update(orderRef, { status, updatedAt: FieldValue.serverTimestamp() });

        // Append event log
        const eventRef = adminDb.collection('orders').doc(orderId).collection('events').doc();
        batch.set(eventRef, {
            from: currentStatus,
            to: status,
            changedBy: adminName,
            timestamp: FieldValue.serverTimestamp(),
        });

        await batch.commit();
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
