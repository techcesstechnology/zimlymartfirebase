import {
    collection, addDoc, doc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export async function seedInitialData() {
    console.log('Starting seed process...');

    const locationId = 'store_01';

    // 1. Create a sample Admin User
    // NOTE: This must match a real Firebase Auth UID if you want to login
    // For now, we'll create the Firestore document.
    const adminUid = 'admin_user_01';
    await setDoc(doc(db, 'users', adminUid), {
        uid: adminUid,
        displayName: 'Master Admin',
        email: 'admin@zimlysmart.co.zw',
        role: 'super_admin',
        createdAt: serverTimestamp()
    });
    console.log('✅ Admin user created');

    // 2. Create sample Products & Inventory
    const products = [
        { name: 'Pure Daily Milk 2L', category: 'Dairy', price: 3.50, stock: 50 },
        { name: 'Red Seal Roller Meal 10kg', category: 'Grains', price: 8.90, stock: 120 },
        { name: 'Gloria Self Raising Flour 2kg', category: 'Baking', price: 2.75, stock: 15 },
        { name: 'Mazoe Orange Crush 2L', category: 'Beverages', price: 4.20, stock: 8 },
    ];

    for (const p of products) {
        const prodRef = await addDoc(collection(db, 'products'), {
            name: p.name,
            slug: p.name.toLowerCase().replace(/ /g, '-'),
            description: `Fresh ${p.name} for your daily needs.`,
            brand: 'ZimlyBrand',
            categoryId: p.category.toLowerCase(),
            tags: [p.category.toLowerCase(), 'fresh'],
            imageUrls: ['https://placehold.co/400x400?text=' + encodeURIComponent(p.name)],
            isActive: true,
            externalSource: 'firebase',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Add a variant
        const variantRef = await addDoc(collection(prodRef, 'variants'), {
            productId: prodRef.id,
            sku: `SKU-${prodRef.id.slice(0, 5).toUpperCase()}`,
            attributes: { size: 'Standard' },
            price: p.price,
            currency: 'USD',
            weight: 1,
            isActive: true
        });

        // Add to inventory
        const invId = `${variantRef.id}_${locationId}`;
        await setDoc(doc(db, 'inventory', invId), {
            id: invId,
            variantId: variantRef.id,
            productId: prodRef.id,
            locationId: locationId,
            productName: p.name,
            variantSku: `SKU-${prodRef.id.slice(0, 5).toUpperCase()}`,
            imageUrl: 'https://placehold.co/400x400?text=' + encodeURIComponent(p.name),
            price: p.price,
            stockOnHand: p.stock,
            stockReserved: 0,
            reorderLevel: 20,
            availability: p.stock > 20 ? 'in_stock' : 'low_stock',
            leadTimeDays: 2,
            isActive: true,
            updatedAt: serverTimestamp()
        });
    }
    console.log('✅ Products and Inventory seeded');

    // 3. Create sample Orders
    const orders = [
        { num: 'ZM-1001', total: 45.50, status: 'paid', pStatus: 'paid' },
        { num: 'ZM-1002', total: 12.00, status: 'processing', pStatus: 'paid' },
        { num: 'ZM-1003', total: 125.75, status: 'pending_payment', pStatus: 'pending' },
        { num: 'ZM-1004', total: 32.20, status: 'delivered', pStatus: 'paid' },
    ];

    for (const o of orders) {
        await addDoc(collection(db, 'orders'), {
            orderNumber: o.num,
            userId: 'sample_user_01',
            locationId: locationId,
            status: o.status,
            paymentStatus: o.pStatus,
            total: o.total,
            currency: 'USD',
            externalSource: 'firebase',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
    console.log('✅ Sample orders seeded');
    console.log('Seed process finished successfully!');
}
