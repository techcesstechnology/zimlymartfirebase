import { Order, OrderStatus } from '../models/order';
import { Cart, CartItem } from '../models/cart';
import { Payment } from '../models/payment';

/**
 * Interface to unify commerce operations.
 * Allows switching between Firestore and Saleor.
 */
export interface ICommerceService {
    createOrderFromCart(cart: Cart, items: CartItem[]): Promise<Order>;
    confirmPayment(paymentId: string): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    getInventoryForVariant(variantId: string, locationId: string): Promise<any>;
}

export abstract class BaseCommerceService implements ICommerceService {
    abstract createOrderFromCart(cart: Cart, items: CartItem[]): Promise<Order>;
    abstract confirmPayment(paymentId: string): Promise<void>;
    abstract updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    abstract getInventoryForVariant(variantId: string, locationId: string): Promise<any>;
}
