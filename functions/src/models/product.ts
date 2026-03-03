import { Timestamp } from 'firebase-admin/firestore';

export interface Product {
    id: string;
    name: string;
    slug: string;
    brand: string;
    categoryId: string;
    description: string;
    imageUrls: string[];
    tags: string[];
    isActive: boolean;
    taxClass: string;
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
    attributes: Record<string, any>; // e.g., { size: '1kg', pack: 'single' }
    pricing: Pricing;
    weight: number; // in grams or kg
    isActive: boolean;
    externalVariantId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Pricing {
    price: number;
    currency: string;
    compareAtPrice?: number;
    costPrice?: number;
}
