import { Timestamp } from 'firebase-admin/firestore';

export type DeliveryStatus =
    | 'queued'
    | 'assigned'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'returned';

export interface Delivery {
    id: string;
    orderId: string;
    city: string;
    areaId: string;
    areaName: string;
    locationId?: string;
    status: DeliveryStatus;

    assignedDriver?: {
        uid: string;
        name: string;
        phone: string;             // Never exposed to customers
    };

    internalNotes?: string;        // Admin/ops only — never exposed to customers

    pickup: {
        storeId: string;
        address: string;
        scheduledAt: Timestamp;
        actualAt?: Timestamp;
    };

    dropoff: {
        address: string;
        recipientName: string;
        recipientPhone: string;   // Never exposed to customers
        actualAt?: Timestamp;
    };

    timeline: DeliveryTimelineEvent[];

    proof?: {
        /** Storage path — NOT a public URL. Access via signed URL endpoint. */
        storagePath?: string;
        otpVerified?: boolean;
        signedAt?: Timestamp;
    };

    deliveredAt?: Timestamp;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DeliveryTimelineEvent {
    status: DeliveryStatus;
    timestamp: Timestamp;
    note?: string;
    location?: { lat: number; lng: number };
}

// ─── Customer-safe public view ────────────────────────────────────────────────
/** Stored in delivery_public/{orderId}. Safe for customers to read directly. */
export interface DeliveryPublicView {
    orderId: string;
    status: DeliveryStatus;
    timeline: Array<{ status: DeliveryStatus; timestamp: Timestamp }>;
    proofSummary: {
        otpVerified: boolean;
        photoUploaded: boolean;
    };
    deliveredAt?: Timestamp;
    updatedAt: Timestamp;
}
