"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
class CartService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getOrCreateCart(userId, locationId) {
        const cartRef = this.db.collection('carts').doc(userId);
        const doc = await cartRef.get();
        if (doc.exists && doc.get('status') === 'active') {
            return doc.data();
        }
        const newCart = {
            id: userId,
            userId,
            locationId,
            deliveryZoneId: '',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await cartRef.set(newCart);
        return newCart;
    }
    async addItemToCart(userId, item) {
        const cartItemsRef = this.db.collection('carts').doc(userId).collection('items');
        const q = cartItemsRef.where('variantId', '==', item.variantId).limit(1);
        const snapshot = await q.get();
        if (!snapshot.empty) {
            const existingItem = snapshot.docs[0];
            await existingItem.ref.update({
                qty: existingItem.get('qty') + (item.qty || 1)
            });
        }
        else {
            await cartItemsRef.add(item);
        }
    }
    async validateCartItems(userId) {
        return true;
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map