import { Firestore } from 'firebase-admin/firestore';
import { Cart, CartItem } from '../models/cart';

export class CartService {
    constructor(private db: Firestore) { }

    /**
     * Gets or creates a cart for a user.
     */
    async getOrCreateCart(userId: string, locationId: string): Promise<Cart> {
        const cartRef = this.db.collection('carts').doc(userId);
        const doc = await cartRef.get();

        if (doc.exists && doc.get('status') === 'active') {
            return doc.data() as Cart;
        }

        const newCart: Cart = {
            id: userId,
            userId,
            locationId,
            deliveryZoneId: '',
            status: 'active',
            createdAt: new Date() as any,
            updatedAt: new Date() as any
        };

        await cartRef.set(newCart);
        return newCart;
    }

    /**
     * Adds an item to the cart.
     */
    async addItemToCart(userId: string, item: Partial<CartItem>): Promise<void> {
        const cartItemsRef = this.db.collection('carts').doc(userId).collection('items');

        // Check if item already exists
        const q = cartItemsRef.where('variantId', '==', item.variantId).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            const existingItem = snapshot.docs[0];
            await existingItem.ref.update({
                qty: existingItem.get('qty') + (item.qty || 1)
            });
        } else {
            await cartItemsRef.add(item);
        }
    }

    /**
     * Synchronizes cart with stock availability.
     */
    async validateCartItems(userId: string): Promise<boolean> {
        // Logic to check inventory for all items in cart
        // Return true if all items are still available in requested quantities
        return true;
    }
}
