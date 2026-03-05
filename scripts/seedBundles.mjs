import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Assuming firebase-service-account.json is in the root directory
const serviceAccount = JSON.parse(
    await readFile('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedBundles() {
    console.log('Seeding 6 real bundles for Harare...');

    const locationId = 'harare';

    // 1. Fetch some active inventory items for harare
    const inventorySnap = await db.collection('inventory')
        .limit(20)
        .get();

    if (inventorySnap.empty) {
        console.error('No inventory items found for Harare. Please ensure inventory is seeded first.');
        process.exit(1);
    }

    const items = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (items.length < 6) {
        console.warn(`Only found ${items.length} items. Bundles will re-use these items.`);
    }

    // Prepare 6 bundle templates
    const bundleTemplates = [
        { name: "Weekend Braai Pack", slug: "weekend-braai-pack", desc: "Everything you need for a weekend BBQ." },
        { name: "Breakfast Essentials", slug: "breakfast-essentials", desc: "Start your morning right with these essentials." },
        { name: "Healthy Snacker pack", slug: "healthy-snacker-pack", desc: "Healthy snacks for the whole family." },
        { name: "Pantry Restock Bundle", slug: "pantry-restock-bundle", desc: "Stock up on pantry staples with this bundle." },
        { name: "Family Dinner Kit", slug: "family-dinner-kit", desc: "Quick and easy family dinner ingredients." },
        { name: "Movie Night Special", slug: "movie-night-special", desc: "Snacks and drinks perfect for movie night." },
    ];

    let batch = db.batch();

    for (let i = 0; i < bundleTemplates.length; i++) {
        const bundleRef = db.collection('bundles').doc();
        const tpl = bundleTemplates[i];

        // Randomly pick 3-4 items for this bundle
        const numItems = Math.floor(Math.random() * 2) + 3;
        const bundleItems = [];
        let totalCost = 0;

        for (let j = 0; j < numItems; j++) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            const qty = Math.floor(Math.random() * 2) + 1; // 1 or 2

            // Add to bundle items
            bundleItems.push({
                inventoryRefId: randomItem.id,
                qty: qty,
                required: true,
                name: randomItem.name || 'Unknown Item'
            });

            totalCost += (randomItem.costPrice || 0) * qty;
        }

        // Set a default subtotal price simulating a 20% margin
        const simulatedPrice = totalCost * 1.25;

        batch.set(bundleRef, {
            id: bundleRef.id,
            name: tpl.name,
            slug: tpl.slug,
            description: tpl.desc,
            imageUrls: [
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" // Placeholder grocery image
            ],
            locationId: locationId,
            items: bundleItems,
            pricing: {
                totalCost: totalCost || 50,
                price: simulatedPrice || 60,
                compareAtPrice: (simulatedPrice || 60) * 1.1 // Add 10% for compare at
            },
            sortPriority: i + 1,
            isActive: true,
            tags: ["value", "bundle"],
            areaIds: [], // Available to all areas in harare by default
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    await batch.commit();
    console.log('Successfully seeded 6 bundles!');
    process.exit(0);
}

seedBundles().catch(console.error);
