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
    id: string;
    name: string;
    slug: string;
    province: string;
    country: string;
    isActive: boolean;
}

export interface CartItem {
    variantId: string;
    productId: string;
    quantity: number;
    nameSnapshot: string;
    priceSnapshot: number;
    imageSnapshot: string;
    inventoryRefId: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    items: CartItem[];
    createdAt: any;
}
