"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const firestore_1 = require("firebase-admin/firestore");
class InventoryService {
    db;
    constructor(db) {
        this.db = db;
    }
    async reserveStock(transaction, items) {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);
            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }
            const inventory = inventoryDoc.data();
            const sellableStock = inventory.stockOnHand - inventory.stockReserved;
            if (sellableStock < item.qty) {
                throw new Error(`Insufficient stock for inventory ${item.inventoryRefId}. Available: ${sellableStock}, Requested: ${item.qty}`);
            }
            transaction.update(inventoryRef, {
                stockReserved: inventory.stockReserved + item.qty,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
        }
    }
    async confirmStockDeduction(transaction, items) {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);
            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }
            const inventory = inventoryDoc.data();
            transaction.update(inventoryRef, {
                stockOnHand: inventory.stockOnHand - item.qty,
                stockReserved: inventory.stockReserved - item.qty,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
        }
    }
    async releaseStock(transaction, items) {
        for (const item of items) {
            const inventoryRef = this.db.collection('inventory').doc(item.inventoryRefId);
            const inventoryDoc = await transaction.get(inventoryRef);
            if (!inventoryDoc.exists) {
                throw new Error(`Inventory not found: ${item.inventoryRefId}`);
            }
            const inventory = inventoryDoc.data();
            transaction.update(inventoryRef, {
                stockReserved: Math.max(0, inventory.stockReserved - item.qty),
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
        }
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=InventoryService.js.map