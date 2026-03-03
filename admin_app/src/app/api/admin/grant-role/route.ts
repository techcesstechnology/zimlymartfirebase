import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)) });
}
const adminDb = getFirestore();

export async function POST(req: Request) {
    try {
        const { uid, displayName, email, role } = await req.json();

        if (!uid || !role) {
            return NextResponse.json({ error: 'UID and Role are required' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(uid);

        await userRef.set({
            uid,
            displayName: displayName || 'Admin User',
            email: email || '',
            role,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp() // Simple approach for now
        }, { merge: true });

        return NextResponse.json({ success: true, message: `Role ${role} granted to ${displayName || uid}` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
