"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
class DeliveryService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createDelivery(order) {
        const orderRef = this.db.collection('orders').doc(order.id);
        return this.db.runTransaction(async (t) => {
            const orderSnap = await t.get(orderRef);
            if (!orderSnap.exists)
                throw new Error(`Order not found: ${order.id}`);
            const freshOrder = orderSnap.data();
            if (freshOrder.deliveryId) {
                console.log(`[createDelivery] Delivery already exists for order ${order.id}: ${freshOrder.deliveryId}`);
                return freshOrder.deliveryId;
            }
            const now = admin.firestore.Timestamp.now();
            const deliveryRef = this.db.collection('deliveries').doc();
            const delivery = {
                id: deliveryRef.id,
                orderId: order.id,
                locationId: order.locationId,
                status: 'queued',
                pickup: {
                    storeId: order.assignedStoreId ?? '',
                    address: '',
                    scheduledAt: now,
                },
                dropoff: {
                    address: order.recipient?.address ?? '',
                    recipientName: order.recipient?.name ?? '',
                    recipientPhone: order.recipient?.phone ?? '',
                },
                timeline: [{
                        status: 'queued',
                        timestamp: now,
                        note: 'Order paid — delivery queued',
                    }],
                createdAt: now,
                updatedAt: now,
            };
            t.set(deliveryRef, delivery);
            t.update(orderRef, {
                deliveryId: deliveryRef.id,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            const publicRef = this.db.collection('delivery_public').doc(order.id);
            t.set(publicRef, this._buildPublicView(delivery));
            return deliveryRef.id;
        });
    }
    async assignDriver(deliveryId, driver, note) {
        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);
        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists)
                throw new Error(`Delivery not found: ${deliveryId}`);
            const timeline = snap.get('timeline') ?? [];
            const event = {
                status: 'assigned',
                timestamp: admin.firestore.Timestamp.now(),
                note: note ?? `Assigned to driver: ${driver.name}`,
            };
            t.update(deliveryRef, {
                assignedDriver: driver,
                status: 'assigned',
                timeline: [...timeline, event],
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            const orderId = snap.get('orderId');
            await this._syncPublicView(t, orderId, 'assigned', event);
        });
    }
    async updateStatus(deliveryId, newStatus, note) {
        const TRANSITIONS = {
            queued: ['assigned'],
            assigned: ['picked_up', 'queued'],
            picked_up: ['in_transit'],
            in_transit: ['delivered', 'failed'],
            delivered: [],
            failed: ['returned'],
            returned: [],
        };
        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);
        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists)
                throw new Error(`Delivery not found: ${deliveryId}`);
            const delivery = snap.data();
            const allowed = TRANSITIONS[delivery.status];
            if (!allowed.includes(newStatus)) {
                throw new Error(`Invalid transition: ${delivery.status} → ${newStatus}`);
            }
            const event = {
                status: newStatus,
                timestamp: admin.firestore.Timestamp.now(),
                note,
            };
            const update = {
                status: newStatus,
                timeline: [...(delivery.timeline ?? []), event],
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            if (newStatus === 'delivered') {
                update.deliveredAt = firestore_1.FieldValue.serverTimestamp();
            }
            t.update(deliveryRef, update);
            await this._syncPublicView(t, delivery.orderId, newStatus, event, delivery.proof);
        });
    }
    async recordProof(deliveryId, storagePath, otpVerified) {
        const deliveryRef = this.db.collection('deliveries').doc(deliveryId);
        await this.db.runTransaction(async (t) => {
            const snap = await t.get(deliveryRef);
            if (!snap.exists)
                throw new Error(`Delivery not found: ${deliveryId}`);
            t.update(deliveryRef, {
                proof: { storagePath, otpVerified, signedAt: firestore_1.FieldValue.serverTimestamp() },
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            const orderId = snap.get('orderId');
            const publicRef = this.db.collection('delivery_public').doc(orderId);
            t.update(publicRef, {
                'proofSummary.photoUploaded': true,
                'proofSummary.otpVerified': otpVerified,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
    }
    _buildPublicView(d) {
        return {
            orderId: d.orderId,
            status: d.status,
            timeline: d.timeline.map(e => ({ status: e.status, timestamp: e.timestamp })),
            proofSummary: {
                otpVerified: d.proof?.otpVerified ?? false,
                photoUploaded: !!d.proof?.storagePath,
            },
            deliveredAt: d.deliveredAt,
            updatedAt: d.updatedAt,
        };
    }
    async _syncPublicView(t, orderId, status, event, proof) {
        if (!orderId)
            return;
        const publicRef = this.db.collection('delivery_public').doc(orderId);
        const publicSnap = await t.get(publicRef);
        if (!publicSnap.exists)
            return;
        const existingTimeline = publicSnap.get('timeline') ?? [];
        const update = {
            status,
            timeline: [...existingTimeline, { status: event.status, timestamp: event.timestamp }],
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (proof) {
            update['proofSummary.otpVerified'] = proof.otpVerified ?? false;
            update['proofSummary.photoUploaded'] = !!proof.storagePath;
        }
        t.update(publicRef, update);
    }
}
exports.DeliveryService = DeliveryService;
//# sourceMappingURL=DeliveryService.js.map