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

    async getBundles(locationId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, "bundles"),
            where("locationId", "==", locationId),
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

    async createOrder(userId: string, cartItems: CartItem[], locationId: string, recipient: any, areaDetails: { areaId: string, areaName: string, deliveryFee: number }): Promise<Order> {
        // This MUST be a call to the secure backend Cloud Function (reserveStock)
        const reserveStock = httpsCallable(functions, 'reserveStock');

        // Flatten items for the reservation
        const items = cartItems.flatMap(item => {
            if (item.type === 'bundle') {
                return item.components.map(comp => ({
                    inventoryRefId: comp.inventoryRefId,
                    qty: comp.qty * item.quantity
                }));
            } else {
                return [{
                    inventoryRefId: item.inventoryRefId,
                    qty: item.quantity
                }];
            }
        });

        const result = await reserveStock({
            userId,
            items, // Use 'qty' as expected by backend
            locationId,
            recipient,
            city: "Harare",
            areaId: areaDetails.areaId,
            areaName: areaDetails.areaName,
            deliveryFee: areaDetails.deliveryFee
        });

        return result.data as Order;
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
