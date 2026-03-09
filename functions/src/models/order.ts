import { Timestamp } from 'firebase-admin/firestore';

export type OrderStatus =
    | 'pending_payment'
    | 'paid'
    | 'processing'
    | 'packed'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'failed';

// ─── Reservation block ────────────────────────────────────────────────────────
export interface OrderReservation {
    status: 'active' | 'released' | 'converted';
    reservedAt: Timestamp;
    expiresAt: Timestamp;   // reservedAt + 15 minutes
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered';

    pricing: OrderPricing;
    buyer: OrderParty;
    recipient: OrderParty;

    /** Replaces old inventoryReservation — now has expiry status */
    reservation: OrderReservation;

    /** ID of the delivery created for this order (set by onOrderPaid trigger) */
    deliveryId?: string;

    assignedStoreId: string;
    locationId: string;

    externalSource: 'firebase' | 'saleor';
    externalOrderId?: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrderPricing {
    subtotal: number;
    deliveryFee: number;
    taxTotal: number;
    discountAmount: number;
    total: number;
    currency: string;
    promoCode?: string;
}

export interface OrderParty {
    name: string;
    phone: string;
    address: string;
    email?: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    type: 'product' | 'bundle';
    productId: string;
    variantId: string;
    locationId: string;
    inventoryRefId: string;
    qty: number;

    snapshot: {
        name: string;
        sku: string;
        price: number;
        image: string;
        description: string;
        attributes: Record<string, any>;
    };

    // Bundle specific
    bundleId?: string;
    components?: Array<{
        inventoryRefId: string;
        qty: number;
        name: string;
    }>;
}
