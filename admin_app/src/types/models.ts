import { Timestamp } from 'firebase/firestore';

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    brandId: string;
    brandName: string;
    categoryId: string;
    categoryName: string;

    unitCostPrice: number;     // buying price / source price
    markupPercent: number;     // e.g. 15
    finalPrice: number;        // auto calculated selling price

    cityId: string;            // e.g. harare
    cityName: string;
    areaIds: string[];         // list of deliveryAreas IDs under that city
    areaNames: string[];       // convenience snapshot

    sku?: string;
    imageUrl?: string;
    unitLabel?: string;        // e.g. 2L, 10kg, 1kg
    tags: string[];
    imageUrls: string[];
    isActive: boolean;
    metaTitle?: string;
    metaDescription?: string;
    externalSource: 'firebase' | 'saleor';
    externalProductId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
    updatedAt: Timestamp;
}

export type OrderStatus =
    | 'pending_payment' | 'paid' | 'processing'
    | 'packed' | 'out_for_delivery' | 'delivered'
    | 'cancelled' | 'failed';

export interface OrderLineItem {
    lineId: string;
    type: 'product' | 'bundle';
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    imageSnapshot?: string;
    // product fields
    productId?: string;
    variantId?: string;
    inventoryRefId?: string;
    // bundle fields
    bundleId?: string;
    components?: Array<{ inventoryRefId: string; qty: number; name: string }>;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    locationId: string;
    city: string;
    areaId: string;
    areaName: string;
    status: OrderStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    subtotal?: number;
    deliveryFee?: number;
    total: number;
    currency: string;
    recipientName?: string;
    recipientPhone?: string;
    deliveryAddressText?: string;
    items?: OrderLineItem[];
    assignedStoreId?: string;
    externalSource: 'firebase' | 'saleor';
    externalOrderId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type DeliveryStatus =
    | 'queued' | 'assigned' | 'picked_up'
    | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface Delivery {
    id: string;
    orderId: string;
    locationId: string;
    city?: string;
    areaId?: string;
    areaName?: string;
    status: DeliveryStatus;
    assignedDriver?: { uid: string; name: string; phone: string };
    dropoff: { address: string; recipientName: string; recipientPhone: string };
    timeline: { status: string; timestamp: Timestamp; note?: string }[];
    proof?: { imageUrl?: string; otpVerified?: boolean };
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
    city: string;
    areaId: string;
    areaName: string;
    pricing: {
        price: number;
        currency: "USD";
        compareAtPrice?: number;
    };
    items: BundleItem[];
    sortPriority: number;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
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

export interface Brand {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
