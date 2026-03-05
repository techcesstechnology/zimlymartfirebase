import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account
const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const areas = [
    // High Density
    { name: "Budiriro", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Highfield", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Mufakose", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Glen View", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Glen Norah", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Kuwadzana", zoneGroup: "high_density", fee: 3, priority: 20 },
    { name: "Warren Park", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Dzivarasekwa", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Hopley", zoneGroup: "high_density", fee: 3, priority: 10 },
    { name: "Hatcliffe", zoneGroup: "high_density", fee: 3, priority: 10 },

    // Central
    { name: "Harare CBD", zoneGroup: "central", fee: 4, priority: 50 },
    { name: "Avenues", zoneGroup: "central", fee: 4, priority: 40 },
    { name: "Eastlea", zoneGroup: "central", fee: 4, priority: 30 },
    { name: "Belvedere", zoneGroup: "central", fee: 4, priority: 30 },
    { name: "Avondale", zoneGroup: "central", fee: 4, priority: 50 },
    { name: "Milton Park", zoneGroup: "central", fee: 4, priority: 30 },
    { name: "Workington", zoneGroup: "central", fee: 4, priority: 30 },
    { name: "Southerton", zoneGroup: "central", fee: 4, priority: 30 },

    // North
    { name: "Borrowdale", zoneGroup: "north", fee: 5, priority: 50 },
    { name: "Borrowdale Brooke", zoneGroup: "north", fee: 5, priority: 45 },
    { name: "Mount Pleasant", zoneGroup: "north", fee: 5, priority: 40 },
    { name: "Greendale", zoneGroup: "north", fee: 5, priority: 30 },
    { name: "Highlands", zoneGroup: "north", fee: 5, priority: 30 },
    { name: "Newlands", zoneGroup: "north", fee: 5, priority: 35 },
    { name: "Alexandra Park", zoneGroup: "north", fee: 5, priority: 30 },
    { name: "Marlborough", zoneGroup: "north", fee: 5, priority: 30 },
    { name: "Bluff Hill", zoneGroup: "north", fee: 5, priority: 30 },
    { name: "Westgate", zoneGroup: "north", fee: 5, priority: 40 },
];

async function seed() {
    console.log('--- SEEDING DELIVERY AREAS ---');
    const batch = db.batch();
    const collectionRef = db.collection('deliveryAreas');

    for (const area of areas) {
        const slug = area.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const docRef = collectionRef.doc(slug);

        batch.set(docRef, {
            city: "Harare",
            name: area.name,
            slug: slug,
            isActive: true,
            zoneGroup: area.zoneGroup,
            fee: area.fee,
            etaText: "Same day / Next day",
            priority: area.priority,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Prepared area: ${area.name}`);
    }

    try {
        await batch.commit();
        console.log('✅ All delivery areas seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding delivery areas:', error);
    } finally {
        process.exit();
    }
}

seed();
