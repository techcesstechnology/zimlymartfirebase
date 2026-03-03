import { Timestamp } from 'firebase-admin/firestore';

export interface Inventory {
    id: string; // Typically variantId_locationId
    variantId: string;
    productId: string;
    locationId: string;
    stockOnHand: number;
    stockReserved: number;
    reorderLevel: number;
    availability: 'in_stock' | 'out_of_stock' | 'low_stock';
    leadTimeDays: number;
    isActive: boolean;
    updatedAt: Timestamp;
}

/**
 * Sellable stock formula:
 * sellable = stockOnHand - stockReserved
 */
export const getSellableStock = (inventory: Inventory): number => {
    return Math.max(0, inventory.stockOnHand - inventory.stockReserved);
};
