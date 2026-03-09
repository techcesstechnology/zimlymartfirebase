import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
    await readFile('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateBundles() {
    console.log('Migrating existing bundles to use city and areaId...');

    // 1. Fetch a default area to assign to existing bundles (e.g., Mount Pleasant or Borrowdale)
    const areasSnap = await db.collection('deliveryAreas')
        .where('city', 'in', ['Harare', 'harare'])
        .limit(1)
        .get();

    if (areasSnap.empty) {
        console.error('No delivery areas found for Harare. Cannot migrate bundles.');
        process.exit(1);
    }

    const defaultArea = { id: areasSnap.docs[0].id, ...areasSnap.docs[0].data() };
    console.log(`Using default area: ${defaultArea.name} (${defaultArea.id})`);

    // 2. Fetch existing bundles
    const bundlesSnap = await db.collection('bundles').get();

    if (bundlesSnap.empty) {
        console.log('No bundles found to migrate.');
        process.exit(0);
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of bundlesSnap.docs) {
        const data = doc.data();

        // Skip if already migrated (has city and areaId)
        if (data.city && data.areaId) {
            continue;
        }

        const bundleRef = db.collection('bundles').doc(doc.id);

        batch.update(bundleRef, {
            city: 'harare', // Assuming all existing are in harare
            areaId: defaultArea.id,
            areaName: defaultArea.name,
            locationId: admin.firestore.FieldValue.delete(), // Remove old field
            areaIds: admin.firestore.FieldValue.delete() // Remove old field
        });

        count++;
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${count} bundles!`);
    } else {
        console.log('All bundles are already migrated.');
    }

    process.exit(0);
}

migrateBundles().catch(console.error);
