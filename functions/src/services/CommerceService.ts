import { Order, OrderStatus } from '../models/order';
import { Cart, CartItem } from '../models/cart';
import { Payment } from '../models/payment';

export interface CheckoutPayload {
    userId: string;
    items: any[];
    locationId: string;
    recipient: { name: string; phone: string; address: string };
    city: string;
    areaId: string;
    areaName: string;
    deliveryFee: number;
}

/**
 * Interface to unify commerce operations.
 * Allows switching between Firestore and Saleor.
 */
export interface ICommerceService {
    createOrder(payload: CheckoutPayload): Promise<Order>;
    confirmPayment(paymentId: string, webhookEventId?: string, rawPayload?: any): Promise<{ alreadyProcessed: boolean } | void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    getInventoryForVariant(variantId: string, locationId: string): Promise<any>;
}

export abstract class BaseCommerceService implements ICommerceService {
    abstract createOrder(payload: CheckoutPayload): Promise<Order>;
    abstract confirmPayment(paymentId: string, webhookEventId?: string, rawPayload?: any): Promise<{ alreadyProcessed: boolean } | void>;
    abstract updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    abstract getInventoryForVariant(variantId: string, locationId: string): Promise<any>;
}
