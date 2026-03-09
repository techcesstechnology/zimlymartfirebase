export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrls: string[];
    brand: string;
    categoryId: string;
    taxClass: string;
    externalSource: 'firebase' | 'saleor';
    externalProductId?: string;
}

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    price: number;
    currency: string;
    attributes: Record<string, any>;
    stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
    externalVariantId?: string;
}

export interface InventoryItem extends Product {
    variantId: string;
    sku: string;
    price: number;
    currency: string;
    stockOnHand: number;
    stockReserved: number;
    locationId: string;
    availability: string;
}

export interface Location {
    id: string; // "harare"
    name: string; // "Harare"
    slug: string; // "harare"
    province: string;
    country: string;
    isActive: boolean;
}

export interface DeliveryArea {
    id: string;
    city: "Harare";
    name: string;
    slug: string;
    isActive: boolean;
    zoneGroup: "high_density" | "central" | "north";
    fee: number;
    etaText: string;
    priority: number;
}

export interface BundleItem {
    inventoryRefId: string;
    productId: string;
    productName: string;
    imageUrl?: string;
    priceSnapshot: number;
    qty: number;
    required: boolean;
    allowSubstitution?: boolean;
}

export interface Bundle {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrls: string[];
    city: string;
    areaId: string;
    areaName: string;
    isActive: boolean;
    tags: string[];
    sortPriority: number;
    pricing: {
        price: number;
        currency: string;
        compareAtPrice?: number;
    };
    items: BundleItem[];
    createdAt: any;
    updatedAt: any;
}

export interface BaseCartItem {
    lineId: string; // unique ID for the cart line
    type: 'product' | 'bundle';
    quantity: number;
    nameSnapshot: string;
    priceSnapshot: number;
    imageSnapshot: string;
}

export interface ProductCartItem extends BaseCartItem {
    type: 'product';
    variantId: string;
    productId: string;
    inventoryRefId: string;
}

export interface BundleCartItem extends BaseCartItem {
    type: 'bundle';
    bundleId: string;
    // Snapshot of the inventory items at the time they were added to the cart
    components: Array<{
        inventoryRefId: string;
        qty: number; // The qty per bundle
        name: string;
    }>;
}

export type CartItem = ProductCartItem | BundleCartItem;

export interface Order {
    id: string;
    orderNumber: string;
    status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
    total: number;
    subtotal: number;
    deliveryFee: number;
    currency: string;
    city: string;
    areaId: string;
    areaName: string;
    recipientName: string;
    recipientPhone: string;
    deliveryAddressText: string;
    items: CartItem[];
    createdAt: any;
    updatedAt?: any;
}
