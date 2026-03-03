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
    productId: string;
    variantId: string;
    inventoryRefId: string; // Reference to the specific inventory doc
    qty: number;

    // Snapshots for UI performance and consistency
    nameSnapshot: string;
    priceSnapshot: number;
    imageSnapshot: string;
}
