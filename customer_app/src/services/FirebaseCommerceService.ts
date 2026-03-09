import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    limit,
    orderBy
} from "firebase/firestore";
import { db, functions } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";
import { ICommerceService } from "./ICommerceService";
import { InventoryItem, Location, Product, ProductVariant, CartItem, Order, DeliveryArea, Bundle } from "../types/commerce";

export class FirebaseCommerceService implements ICommerceService {
    async getDeliveryAreas(): Promise<DeliveryArea[]> {
        const q = query(
            collection(db, "deliveryAreas"),
            where("isActive", "==", true),
            orderBy("priority", "desc"),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryArea));
    }

    async getLocations(): Promise<Location[]> {
        const q = query(collection(db, "locations"), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    }

    async getProductsByLocation(locationId: string): Promise<InventoryItem[]> {
        // Queries the denormalized inventory collection for fast lookup
        const q = query(
            collection(db, "inventory"),
            where("locationId", "==", locationId),
            where("isActive", "==", true),
            limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
    }

    async getBundles(areaId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, "bundles"),
            where("areaId", "==", areaId),
            where("isActive", "==", true),
            orderBy("sortPriority", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
    }

    async getProductBySlug(slug: string, locationId: string): Promise<InventoryItem | null> {
        const q = query(
            collection(db, "inventory"),
            where("locationId", "==", locationId),
            where("slug", "==", slug),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as InventoryItem;
    }

    async getCart(userId: string): Promise<CartItem[]> {
        const snapshot = await getDocs(collection(db, `carts/${userId}/items`));
        return snapshot.docs.map(doc => doc.data() as CartItem);
    }

    async addToCart(userId: string, item: CartItem): Promise<void> {
        // This would typically involve a call to a safe Firebase function or direct write 
        // with security rules. For brevity, we focus on the structure.
    }

    async createOrder(userId: string, cartItems: CartItem[], locationId: string, recipient: any, areaDetails: { areaId: string, areaName: string, deliveryFee: number }, promoCode?: string): Promise<Order> {
        const reserveStock = httpsCallable(functions, 'reserveStock');

        const result = await reserveStock({
            userId,
            items: cartItems,
            locationId,
            recipient,
            city: locationId,
            areaId: areaDetails.areaId,
            areaName: areaDetails.areaName,
            deliveryFee: areaDetails.deliveryFee,
            ...(promoCode && { promoCode }),
        });

        return result.data as Order;
    }

    async validatePromo(code: string, subtotal: number): Promise<{
        valid: boolean;
        discountAmount: number;
        discountType: 'percentage' | 'fixed';
        value: number;
        error?: string;
    }> {
        const q = query(
            collection(db, 'promotions'),
            where('code', '==', code.toUpperCase().trim()),
            limit(1)
        );
        const snap = await getDocs(q);

        if (snap.empty) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: 'Invalid promo code.' };

        const promo = snap.docs[0].data();
        const now = Date.now();

        if (!promo.isActive) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: 'This code is no longer active.' };
        if (promo.endDate?.seconds && promo.endDate.seconds * 1000 < now) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: 'This code has expired.' };
        if (promo.startDate?.seconds && promo.startDate.seconds * 1000 > now) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: 'This code is not active yet.' };
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: 'This code has reached its usage limit.' };
        if (promo.minSpend && subtotal < promo.minSpend) return { valid: false, discountAmount: 0, discountType: 'fixed', value: 0, error: `Minimum spend of $${promo.minSpend.toFixed(2)} required.` };

        const discountAmount = promo.discountType === 'percentage'
            ? parseFloat(((subtotal * promo.value) / 100).toFixed(2))
            : Math.min(promo.value, subtotal);

        return { valid: true, discountAmount, discountType: promo.discountType, value: promo.value };
    }

    async getUserOrders(userId: string): Promise<Order[]> {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    }

    async getOrderById(orderId: string): Promise<Order | null> {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Order : null;
    }
}
