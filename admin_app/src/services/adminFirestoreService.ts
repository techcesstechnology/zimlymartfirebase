import {
    collection, query, where, orderBy, limit,
    getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc,
    serverTimestamp, QueryConstraint, writeBatch, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Product, ProductVariant, InventoryDoc, Order, Delivery, Promotion, CmsBanner, StockAdjustment, Bundle, Location, DeliveryArea, Brand, Category } from '@/types/models';

export type ProductCreateInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string };
export type BrandCreateInput = Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string };
export type CategoryCreateInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string };
export type BundleCreateInput = Omit<Bundle, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string };

// ── Products ─────────────────────────────────────────────────────────────────
export const productsService = {
    async list(): Promise<Product[]> {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    },

    async get(id: string): Promise<Product | null> {
        const snap = await getDoc(doc(db, 'products', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null;
    },

    async create(data: ProductCreateInput): Promise<string> {
        const ref = await addDoc(collection(db, 'products'), {
            ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Product>): Promise<void> {
        await updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() });
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await updateDoc(doc(db, 'products', id), { isActive, updatedAt: serverTimestamp() });
    },

    /** Soft delete */
    async archive(id: string): Promise<void> {
        await updateDoc(doc(db, 'products', id), { isActive: false, updatedAt: serverTimestamp() });
    },

    async saveSpreadsheetRows(rows: ProductCreateInput[]): Promise<void> {
        const batch = writeBatch(db);
        rows.forEach(row => {
            const newDoc = doc(collection(db, 'products'));
            batch.set(newDoc, {
                ...row,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });
        await batch.commit();
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

// ── Brands ───────────────────────────────────────────────────────────────────
export const brandsService = {
    async list(): Promise<Brand[]> {
        const snap = await getDocs(query(collection(db, 'brands'), orderBy('name', 'asc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
    },

    async create(data: BrandCreateInput): Promise<string> {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const ref = await addDoc(collection(db, 'brands'), {
            ...data, slug, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Brand>): Promise<void> {
        await updateDoc(doc(db, 'brands', id), { ...data, updatedAt: serverTimestamp() });
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await updateDoc(doc(db, 'brands', id), { isActive, updatedAt: serverTimestamp() });
    },
};

// ── Categories ───────────────────────────────────────────────────────────────
export const categoriesService = {
    async list(): Promise<Category[]> {
        const snap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    },

    async create(data: CategoryCreateInput): Promise<string> {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const ref = await addDoc(collection(db, 'categories'), {
            ...data, slug, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Category>): Promise<void> {
        await updateDoc(doc(db, 'categories', id), { ...data, updatedAt: serverTimestamp() });
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await updateDoc(doc(db, 'categories', id), { isActive, updatedAt: serverTimestamp() });
    },
};

// ── Storage / Uploads ────────────────────────────────────────────────────────
export const storageService = {
    async uploadProductImage(file: File): Promise<string> {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `products/${fileName}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }
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
    async list(filters: { status?: string; city?: string; areaId?: string } = {}): Promise<Order[]> {
        const ordersRef = collection(db, 'orders');
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(100)];
        if (filters.status) constraints.unshift(where('status', '==', filters.status));
        if (filters.city) constraints.unshift(where('city', '==', filters.city));
        if (filters.areaId) constraints.unshift(where('areaId', '==', filters.areaId));
        const snap = await getDocs(query(ordersRef, ...constraints));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    },

    async get(id: string): Promise<Order | null> {
        const snap = await getDoc(doc(db, 'orders', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Order : null;
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
    async listByCityArea(city: string, areaId?: string): Promise<Delivery[]> {
        const constraints: QueryConstraint[] = [
            where('city', '==', city),
            where('status', 'in', ['queued', 'assigned', 'picked_up', 'in_transit']),
            orderBy('createdAt', 'asc'),
        ];
        if (areaId) constraints.push(where('areaId', '==', areaId));
        const q = query(collection(db, 'deliveries'), ...constraints);
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

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'promotions', id));
    },
};

// ── Bundles ──────────────────────────────────────────────────────────────────
export const bundlesService = {
    async listByArea(areaId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, 'bundles'),
            where('areaId', '==', areaId),
            orderBy('sortPriority', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));
    },

    async get(id: string): Promise<Bundle | null> {
        const snap = await getDoc(doc(db, 'bundles', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Bundle : null;
    },

    async save(id: string | null, data: BundleCreateInput): Promise<string> {
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

// ── Locations & Areas ────────────────────────────────────────────────────────
export const locationsService = {
    async list(): Promise<Location[]> {
        const snap = await getDocs(query(collection(db, 'locations'), where('isActive', '==', true)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Location));
    },

    async listAreas(cityName?: string): Promise<DeliveryArea[]> {
        const constraints = cityName
            ? [where('isActive', '==', true), where('city', '==', cityName), orderBy('priority', 'desc')]
            : [where('isActive', '==', true), orderBy('priority', 'desc')];
        const q = query(collection(db, 'deliveryAreas'), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryArea));
    },
};
