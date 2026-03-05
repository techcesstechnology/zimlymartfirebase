import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load service account
const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const locationId = 'store_01';

async function seed() {
    console.log('--- STARTING REMOTE SEED PROCESS (ADMIN SDK) ---');

    try {
        // 0. Create default Location
        const locRef = db.collection('locations').doc(locationId);
        const locSnap = await locRef.get();
        if (!locSnap.exists) {
            console.log(`📦 Setting up location: Harare (store_01)...`);
            await locRef.set({
                id: locationId,
                name: 'Harare',
                slug: 'harare',
                province: 'Harare Metropolitan',
                country: 'Zimbabwe',
                isActive: true
            });
            console.log('✅ Location seeded');
        }

        // 1. Create sample Products
        const products = [
            { name: 'Pure Daily Milk 2L', category: 'Dairy', price: 3.50, stock: 50 },
            { name: 'Red Seal Roller Meal 10kg', category: 'Grains', price: 8.90, stock: 120 },
            { name: 'Gloria Self Raising Flour 2kg', category: 'Baking', price: 2.75, stock: 15 },
            { name: 'Mazoe Orange Crush 2L', category: 'Beverages', price: 4.20, stock: 8 },
        ];

        for (const p of products) {
            // Check if exists
            const snapshot = await db.collection('products').where('name', '==', p.name).get();
            if (!snapshot.empty) {
                console.log(`⏭️ Product "${p.name}" already exists, skipping...`);
                continue;
            }

            console.log(`📦 Creating product: ${p.name}...`);
            const prodRef = await db.collection('products').add({
                name: p.name,
                slug: p.name.toLowerCase().replace(/ /g, '-'),
                description: `Fresh ${p.name} for your daily needs.`,
                brand: 'ZimlyBrand',
                categoryId: p.category.toLowerCase(),
                tags: [p.category.toLowerCase(), 'fresh'],
                imageUrls: ['https://placehold.co/400x400?text=' + encodeURIComponent(p.name)],
                isActive: true,
                externalSource: 'firebase',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Add variant
            const variantRef = await prodRef.collection('variants').add({
                productId: prodRef.id,
                sku: `SKU-${prodRef.id.slice(0, 5).toUpperCase()}`,
                attributes: { size: 'Standard' },
                price: p.price,
                currency: 'USD',
                weight: 1,
                isActive: true
            });

            // Add inventory
            const invId = `${variantRef.id}_${locationId}`;
            await db.collection('inventory').doc(invId).set({
                id: invId,
                variantId: variantRef.id,
                productId: prodRef.id,
                locationId: locationId,
                productName: p.name,
                slug: p.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                variantSku: `SKU-${prodRef.id.slice(0, 5).toUpperCase()}`,
                imageUrls: ['https://placehold.co/400x400?text=' + encodeURIComponent(p.name)],
                price: p.price,
                stockOnHand: p.stock,
                stockReserved: 0,
                reorderLevel: 20,
                availability: p.stock > 20 ? 'in_stock' : 'low_stock',
                leadTimeDays: 2,
                isActive: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Seeded ${p.name} + Inventory`);
        }

        // 2. Create sample Orders
        const orders = [
            { num: 'ZM-1001', total: 45.50, status: 'paid', pStatus: 'paid' },
            { num: 'ZM-1002', total: 12.00, status: 'processing', pStatus: 'paid' },
            { num: 'ZM-1003', total: 125.75, status: 'pending_payment', pStatus: 'pending' },
            { num: 'ZM-1004', total: 32.20, status: 'delivered', pStatus: 'paid' },
        ];

        for (const o of orders) {
            const snapshot = await db.collection('orders').where('orderNumber', '==', o.num).get();
            if (!snapshot.empty) continue;

            await db.collection('orders').add({
                orderNumber: o.num,
                userId: 'sample_user_01',
                locationId: locationId,
                status: o.status,
                paymentStatus: o.pStatus,
                total: o.total,
                currency: 'USD',
                externalSource: 'firebase',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        console.log('✅ Sample orders seeded');
        console.log('--- SEED PROCESS FINISHED SUCCESSFULLY ---');
    } catch (error) {
        console.error('❌ SEED ERROR:', error);
    } finally {
        process.exit();
    }
}

seed();
