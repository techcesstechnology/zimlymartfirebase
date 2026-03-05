import { Product, ProductVariant, InventoryItem, Location, CartItem, Order, Bundle } from '../types/commerce';

export interface ICommerceService {
    // Catalog
    getLocations(): Promise<Location[]>;
    getProductsByLocation(locationId: string): Promise<InventoryItem[]>;
    getBundles(locationId: string): Promise<Bundle[]>;
    getProductBySlug(slug: string, locationId: string): Promise<InventoryItem | null>;

    // Cart & Checkout
    getCart(userId: string): Promise<CartItem[]>;
    addToCart(userId: string, item: CartItem): Promise<void>;
    createOrder(userId: string, cartItems: CartItem[], locationId: string, recipient: any, areaDetails: { areaId: string, areaName: string, deliveryFee: number }): Promise<Order>;

    // Orders
    getUserOrders(userId: string): Promise<Order[]>;
    getOrderById(orderId: string): Promise<Order | null>;
}
