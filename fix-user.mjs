import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// This script ensures your superadmin account is correctly set up in the database.
const USER_EMAIL = 'adonismuzataet@gmail.com';

const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function fixUser() {
    console.log(`Checking user: ${USER_EMAIL}...`);
    try {
        const userRecord = await auth.getUserByEmail(USER_EMAIL);
        const userRef = db.collection('users').doc(userRecord.uid);

        await userRef.set({
            uid: userRecord.uid,
            email: USER_EMAIL,
            displayName: userRecord.displayName || 'Super Admin',
            role: 'super_admin',
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Successfully verified and updated super_admin document for ${USER_EMAIL}`);
        console.log(`UID: ${userRecord.uid}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    } finally {
        process.exit();
    }
}

fixUser();
