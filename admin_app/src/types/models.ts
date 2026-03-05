export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    brand: string;
    categoryId: string;
    tags: string[];
    imageUrls: string[];
    isActive: boolean;
    metaTitle?: string;
    metaDescription?: string;
    externalSource: 'firebase' | 'saleor';
    externalProductId?: string;
    createdAt: any;
    updatedAt: any;
}

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    barcode?: string;
    attributes: Record<string, string>;
    price: number;
    currency: string;
    compareAtPrice?: number;
    weight: number;
    isActive: boolean;
    externalVariantId?: string;
}

export interface InventoryDoc {
    id: string; // variantId_locationId
    variantId: string;
    productId: string;
    locationId: string;
    // denormalised for fast reads
    productName: string;
    variantSku: string;
    imageUrl: string;
    price: number;
    // stock
    stockOnHand: number;
    stockReserved: number;
    reorderLevel: number;
    availability: 'in_stock' | 'out_of_stock' | 'low_stock';
    leadTimeDays: number;
    isActive: boolean;
    updatedAt: any;
}

export type OrderStatus =
    | 'pending_payment' | 'paid' | 'processing'
    | 'packed' | 'out_for_delivery' | 'delivered'
    | 'cancelled' | 'failed';

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    locationId: string;
    status: OrderStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    total: number;
    currency: string;
    assignedStoreId?: string;
    externalSource: 'firebase' | 'saleor';
    externalOrderId?: string;
    createdAt: any;
    updatedAt: any;
}

export type DeliveryStatus =
    | 'queued' | 'assigned' | 'picked_up'
    | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface Delivery {
    id: string;
    orderId: string;
    locationId: string;
    status: DeliveryStatus;
    assignedDriver?: { uid: string; name: string; phone: string };
    dropoff: { address: string; recipientName: string; recipientPhone: string };
    timeline: { status: string; timestamp: any; note?: string }[];
    proof?: { imageUrl?: string; otpVerified?: boolean };
    createdAt: any;
    updatedAt: any;
}

export interface Promotion {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    minSpend?: number;
    startDate: { seconds: number; nanoseconds: number };
    endDate: { seconds: number; nanoseconds: number };
    usageLimit?: number;
    usageCount: number;
    locationId?: string;
    isActive: boolean;
}

export interface CmsBanner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
    locationTargeting?: string;
    displayOrder: number;
    isActive: boolean;
}

export interface StockAdjustment {
    inventoryId: string;
    delta: number;  // positive = add, negative = remove
    reason: string;
    adminUid: string;
    adminName: string;
    timestamp: { seconds: number; nanoseconds: number };
}

export interface BundleItem {
    inventoryRefId: string; // the inventory doc ID (variantId_locationId)
    productId: string;
    productName: string;
    imageUrl?: string;
    priceSnapshot: number; // inventory price at time of bundle creation/edit
    qty: number;
    required: boolean; // v1 default true
}

export interface Bundle {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrls: string[];
    tags: string[];
    locationId: string; // "harare" for now
    areaIds?: string[]; // Optional specific delivery areas
    pricing: {
        price: number;
        currency: "USD";
        compareAtPrice?: number;
    };
    items: BundleItem[];
    sortPriority: number;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

export interface Location {
    id: string;
    name: string;
    slug: string;
    province: string;
    country: string;
    isActive: boolean;
}

export interface DeliveryArea {
    id: string;
    city: string;
    name: string;
    slug: string;
    isActive: boolean;
    zoneGroup: 'high_density' | 'central' | 'north';
    fee: number;
    etaText: string;
    priority: number;
}
