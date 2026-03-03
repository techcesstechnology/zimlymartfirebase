import { Firestore, Transaction, FieldValue } from 'firebase-admin/firestore';
import { Inventory } from '../models/inventory';

export class InventoryService {
    constructor(private db: Firestore) { }

    /**
     * Reserves stock for a list of items within a transaction.
     * Throws an error if any item has insufficient stock.
     */
    async reserveStock(
        transaction: Transaction,
        items: { inventoryRefId: string; qty: number }[]
    ): Promise<void> {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);

            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }

            const inventory = inventoryDoc.data() as Inventory;
            const sellableStock = inventory.stockOnHand - inventory.stockReserved;

            if (sellableStock < item.qty) {
                throw new Error(`Insufficient stock for inventory ${item.inventoryRefId}. Available: ${sellableStock}, Requested: ${item.qty}`);
            }

            // Update reserved stock
            transaction.update(inventoryRef, {
                stockReserved: inventory.stockReserved + item.qty,
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }

    /**
     * Confirms reservation (payment success).
     * Decreases both stockOnHand and stockReserved.
     */
    async confirmStockDeduction(
        transaction: Transaction,
        items: { inventoryRefId: string; qty: number }[]
    ): Promise<void> {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);

            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }

            const inventory = inventoryDoc.data() as Inventory;

            transaction.update(inventoryRef, {
                stockOnHand: inventory.stockOnHand - item.qty,
                stockReserved: inventory.stockReserved - item.qty,
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }

    /**
     * Releases reserved stock (payment failure or cancellation).
     * Decreases stockReserved back.
     */
    async releaseStock(
        transaction: Transaction,
        items: { inventoryRefId: string; qty: number }[]
    ): Promise<void> {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);

            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }

            const inventory = inventoryDoc.data() as Inventory;

            transaction.update(inventoryRef, {
                stockReserved: Math.max(0, inventory.stockReserved - item.qty),
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }
}
