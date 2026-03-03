"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellableStock = void 0;
const getSellableStock = (inventory) => {
    return Math.max(0, inventory.stockOnHand - inventory.stockReserved);
};
exports.getSellableStock = getSellableStock;
//# sourceMappingURL=inventory.js.map