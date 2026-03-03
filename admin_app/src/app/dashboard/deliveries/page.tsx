'use client';

import { useEffect, useState } from 'react';
import { deliveriesService, ordersService } from '@/services/adminFirestoreService';
import { Delivery } from '@/types/models';
import RoleGuard from '@/components/RoleGuard';
import { Truck, User, MapPin, Clock } from 'lucide-react';

const DELIVERY_STATUS_COLORS: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-600',
    assigned: 'bg-blue-50 text-blue-700',
    picked_up: 'bg-indigo-50 text-indigo-700',
    in_transit: 'bg-orange-50 text-orange-700',
    delivered: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    returned: 'bg-red-100 text-red-800',
};

export default function DeliveriesPage() {
    const [locationId, setLocationId] = useState('harare');
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    const load = (loc: string) => {
        setLoading(true);
        deliveriesService.listByLocation(loc).then(d => { setDeliveries(d); setLoading(false); });
    };

    useEffect(() => { load(locationId); }, [locationId]);

    const handleAssign = async (deliveryId: string) => {
        const driverName = prompt('Driver name?');
        const driverPhone = prompt('Driver phone?');
        const driverUid = prompt('Driver UID?');
        if (!driverName || !driverPhone || !driverUid) return;
        await deliveriesService.assignDriver(deliveryId, { uid: driverUid, name: driverName, phone: driverPhone });
        load(locationId);
    };

    return (
        <RoleGuard permission="deliveries.read">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
                    <select value={locationId} onChange={e => setLocationId(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500">
                        {['harare', 'bulawayo', 'beitbridge', 'mutare', 'gweru'].map(l => (
                            <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-4">
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 h-20 animate-pulse" />
                        ))
                        : deliveries.length === 0
                            ? <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400">No active deliveries for this location</p>
                            </div>
                            : deliveries.map(d => (
                                <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-5">
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${DELIVERY_STATUS_COLORS[d.status]}`}>
                                        {d.status.replace(/_/g, ' ')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {d.dropoff.recipientName} · {d.dropoff.recipientPhone}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {d.dropoff.address}
                                        </div>
                                        {d.assignedDriver && (
                                            <div className="flex items-center gap-2 text-xs text-green-700 mt-1">
                                                <Truck className="w-3 h-3" /> Driver: {d.assignedDriver.name}
                                            </div>
                                        )}
                                    </div>
                                    {d.status === 'queued' && (
                                        <button onClick={() => handleAssign(d.id)}
                                            className="flex-shrink-0 bg-green-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-700 transition-all font-medium">
                                            Assign Driver
                                        </button>
                                    )}
                                </div>
                            ))
                    }
                </div>
            </div>
        </RoleGuard>
    );
}
