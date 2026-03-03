import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)) });
}
const adminDb = getFirestore();

export async function POST(req: Request) {
    try {
        const { inventoryId, delta, reason, adminUid, adminName } = await req.json();

        if (!inventoryId || typeof delta !== 'number' || !reason || !adminUid) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const invRef = adminDb.collection('inventory').doc(inventoryId);

        await adminDb.runTransaction(async (t) => {
            const snap = await t.get(invRef);
            if (!snap.exists) throw new Error('Inventory doc not found');

            const current = snap.data()!.stockOnHand as number;
            const newStock = current + delta;
            if (newStock < 0) throw new Error('Cannot reduce stock below 0');

            t.update(invRef, {
                stockOnHand: newStock,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Audit log
            const logRef = adminDb.collection('stock_adjustments').doc();
            t.set(logRef, {
                inventoryId, delta, reason, adminUid, adminName,
                previousStock: current,
                newStock,
                timestamp: FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
