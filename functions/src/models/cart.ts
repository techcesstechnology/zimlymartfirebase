import { Timestamp } from 'firebase-admin/firestore';

export interface Cart {
    id: string; // Typically userId
    userId: string;
    locationId: string;
    deliveryZoneId: string;
    status: 'active' | 'converted';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CartItem {
    id: string;
    cartId: string;
    type: 'product' | 'bundle';
    productId: string;
    variantId: string;
    inventoryRefId: string; // Reference to the specific inventory doc
    qty: number;

    // Snapshots for UI performance and consistency
    nameSnapshot: string;
    priceSnapshot: number;
    imageSnapshot: string;

    // Bundle specific
    bundleId?: string;
    components?: Array<{
        inventoryRefId: string;
        qty: number;
        name: string;
    }>;
}
