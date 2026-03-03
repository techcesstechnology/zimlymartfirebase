import { Timestamp } from 'firebase-admin/firestore';

// Stored in payments/{providerRef}  (providerRef = provider's unique event ID)
export interface Payment {
    id: string;                 // = providerRef — used as doc ID for uniqueness
    orderId: string;
    userId: string;
    provider: 'paynow' | 'stripe' | 'manual';
    providerRef: string;        // provider's unique payment/event ID
    status: 'pending' | 'successful' | 'failed' | 'refunded';
    amount: number;
    currency: string;

    // ── Idempotency fields ─────────────────────────────────────
    webhookEventId?: string;    // provider's webhook event ID (for dedup)
    processedAt?: Timestamp;    // set once webhook is fully actioned
    rawPayload?: any;           // stored for audit / debugging

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
