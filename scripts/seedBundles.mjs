import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account - assuming it exists in the root as per seed-db.mjs
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));
} catch (e) {
    console.error("❌ Could not find firebase-service-account.json. Please ensure it's in the root directory.");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedBundles() {
    console.log('--- STARTING BUNDLE SEED PROCESS ---');

    try {
        // Find some inventory for Harare
        // Based on seed-db.mjs, Harare might be 'store_01' or 'harare'
        // We'll search for inventory items where locationId is 'harare' or 'store_01'
        const inventorySnapshot = await db.collection('inventory')
            .where('isActive', '==', true)
            .limit(10)
            .get();

        if (inventorySnapshot.empty) {
            console.error('❌ No inventory items found to create bundles. Please seed inventory first.');
            return;
        }

        const items = inventorySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().productName || doc.data().name,
            price: doc.data().price,
            locationId: doc.data().locationId
        }));

        const harareItems = items.filter(it => it.locationId === 'harare' || it.locationId === 'store_01');
        const targetLocationId = harareItems.length > 0 ? harareItems[0].locationId : 'harare';

        console.log(`📍 Using locationId: ${targetLocationId}`);

        const bundles = [
            {
                name: "Breakfast Essentials Pack",
                slug: "breakfast-essentials-pack",
                description: "Start your day right with our curated selection of morning must-haves. Includes fresh milk, flour, and more.",
                imageUrls: ["https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800"],
                locationId: targetLocationId,
                isActive: true,
                tags: ["Breakfast", "Essentials"],
                sortPriority: 100,
                pricing: {
                    price: 15.00,
                    currency: "USD",
                    compareAtPrice: 18.50
                },
                items: harareItems.slice(0, 3).map(it => ({
                    inventoryRefId: it.id,
                    qty: 1,
                    required: true
                }))
            },
            {
                name: "Weekend Braai Master Bundle",
                slug: "weekend-braai-master",
                description: "Everything you need for the perfect Zimbabwean braai. Premium selections for your grill.",
                imageUrls: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800"],
                locationId: targetLocationId,
                isActive: true,
                tags: ["Braai", "Weekend", "Meat"],
                sortPriority: 90,
                pricing: {
                    price: 25.00,
                    currency: "USD",
                    compareAtPrice: 30.00
                },
                items: harareItems.slice(1, 4).map(it => ({
                    inventoryRefId: it.id,
                    qty: 1,
                    required: true
                }))
            },
            {
                name: "Family Pantry Restock",
                slug: "family-pantry-restock",
                description: "Top up the essentials with this bulk savings bundle. Great for keeping the kitchen running smoothly.",
                imageUrls: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"],
                locationId: targetLocationId,
                isActive: true,
                tags: ["Pantry", "Family", "Savings"],
                sortPriority: 80,
                pricing: {
                    price: 45.00,
                    currency: "USD",
                    compareAtPrice: 55.00
                },
                items: harareItems.slice(0, 4).map(it => ({
                    inventoryRefId: it.id,
                    qty: 2,
                    required: true
                }))
            }
        ];

        for (const b of bundles) {
            console.log(`📦 Seeding bundle: ${b.name}...`);
            const bundleRef = db.collection('bundles').doc(b.slug);
            await bundleRef.set({
                ...b,
                bundleItems: b.items,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            delete b.items; // cleanup for set
        }

        console.log('✅ Bundles seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding bundles:', error);
    } finally {
        process.exit();
    }
}

seedBundles();
