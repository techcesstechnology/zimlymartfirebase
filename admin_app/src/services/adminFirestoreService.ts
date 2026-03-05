import {
    collection, query, where, orderBy, limit,
    getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc,
    serverTimestamp, QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductVariant, InventoryDoc, Order, Delivery, Promotion, CmsBanner, StockAdjustment, Bundle } from '@/types/models';

// ── Products ─────────────────────────────────────────────────────────────────
export const productsService = {
    async list(): Promise<Product[]> {
        const snap = await getDocs(collection(db, 'products'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    },

    async get(id: string): Promise<Product | null> {
        const snap = await getDoc(doc(db, 'products', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null;
    },

    async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const ref = await addDoc(collection(db, 'products'), {
            ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Product>): Promise<void> {
        await updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() });
    },

    /** Soft delete */
    async archive(id: string): Promise<void> {
        await updateDoc(doc(db, 'products', id), { isActive: false, updatedAt: serverTimestamp() });
    },

    // Variants sub-collection
    async listVariants(productId: string): Promise<ProductVariant[]> {
        const snap = await getDocs(collection(db, `products/${productId}/variants`));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductVariant));
    },

    async createVariant(productId: string, data: Omit<ProductVariant, 'id'>): Promise<string> {
        const ref = await addDoc(collection(db, `products/${productId}/variants`), data);
        return ref.id;
    },

    async updateVariant(productId: string, variantId: string, data: Partial<ProductVariant>): Promise<void> {
        await updateDoc(doc(db, `products/${productId}/variants`, variantId), data);
    },
};

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventoryService = {
    async listByLocation(locationId: string): Promise<InventoryDoc[]> {
        const q = query(
            collection(db, 'inventory'),
            where('locationId', '==', locationId),
            where('isActive', '==', true),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryDoc));
    },

    async getLowStock(locationId: string): Promise<InventoryDoc[]> {
        const all = await this.listByLocation(locationId);
        return all.filter(i => i.stockOnHand - i.stockReserved <= i.reorderLevel);
    },

    /** All real stock changes go through the secure API route */
    async adjustStock(adjustment: StockAdjustment): Promise<void> {
        const res = await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adjustment),
        });
        if (!res.ok) throw new Error(await res.text());
    },
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersService = {
    async list(filters: { status?: string; locationId?: string } = {}): Promise<Order[]> {
        const ordersRef = collection(db, 'orders');
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(100)];
        if (filters.status) constraints.unshift(where('status', '==', filters.status));
        if (filters.locationId) constraints.unshift(where('locationId', '==', filters.locationId));
        const snap = await getDocs(query(ordersRef, ...constraints));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    },

    async updateStatus(orderId: string, status: string, adminName: string): Promise<void> {
        const res = await fetch('/api/orders/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status, adminName }),
        });
        if (!res.ok) throw new Error(await res.text());
    },
};

// ── Deliveries ───────────────────────────────────────────────────────────────
export const deliveriesService = {
    async listByLocation(locationId: string): Promise<Delivery[]> {
        const q = query(
            collection(db, 'deliveries'),
            where('locationId', '==', locationId),
            where('status', 'in', ['queued', 'assigned', 'picked_up', 'in_transit']),
            orderBy('createdAt', 'asc'),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Delivery));
    },

    async assignDriver(deliveryId: string, driver: { uid: string; name: string; phone: string }): Promise<void> {
        const res = await fetch('/api/deliveries/assign-driver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveryId, driver }),
        });
        if (!res.ok) throw new Error(await res.text());
    },
};

// ── CMS Banners ───────────────────────────────────────────────────────────────
export const cmsService = {
    async listBanners(): Promise<CmsBanner[]> {
        const q = query(collection(db, 'cms_banners'), orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as CmsBanner));
    },

    async saveBanner(id: string | null, data: Omit<CmsBanner, 'id'>): Promise<void> {
        if (id) {
            await updateDoc(doc(db, 'cms_banners', id), data);
        } else {
            await addDoc(collection(db, 'cms_banners'), data);
        }
    },

    async deleteBanner(id: string): Promise<void> {
        await deleteDoc(doc(db, 'cms_banners', id));
    },
};

// ── Promotions ───────────────────────────────────────────────────────────────
export const promotionsService = {
    async list(): Promise<Promotion[]> {
        const snap = await getDocs(collection(db, 'promotions'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion));
    },

    async save(id: string | null, data: Omit<Promotion, 'id' | 'usageCount'>): Promise<void> {
        if (id) {
            await updateDoc(doc(db, 'promotions', id), data);
        } else {
            await addDoc(collection(db, 'promotions'), { ...data, usageCount: 0 });
        }
    },

    async toggle(id: string, isActive: boolean): Promise<void> {
        await updateDoc(doc(db, 'promotions', id), { isActive });
    },
};

// ── Bundles ──────────────────────────────────────────────────────────────────
export const bundlesService = {
    async listByLocation(locationId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, 'bundles'),
            where('locationId', '==', locationId),
            orderBy('sortPriority', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));
    },

    async get(id: string): Promise<Bundle | null> {
        const snap = await getDoc(doc(db, 'bundles', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Bundle : null;
    },

    async save(id: string | null, data: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        if (id) {
            await updateDoc(doc(db, 'bundles', id), {
                ...data, updatedAt: serverTimestamp(),
            });
            return id;
        } else {
            const ref = await addDoc(collection(db, 'bundles'), {
                ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            });
            return ref.id;
        }
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await updateDoc(doc(db, 'bundles', id), { isActive, updatedAt: serverTimestamp() });
    },

    async archive(id: string): Promise<void> {
        await updateDoc(doc(db, 'bundles', id), { isActive: false, updatedAt: serverTimestamp() });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'bundles', id));
    },
};
