import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bundle } from '@/types/models';

export const bundlesService = {
    async listActiveByLocation(locationId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, 'bundles'),
            where('locationId', '==', locationId),
            where('isActive', '==', true),
            orderBy('sortPriority', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));
    },

    async get(id: string): Promise<Bundle | null> {
        const snap = await getDocs(query(collection(db, 'bundles'), where('id', '==', id)));
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Bundle;
    }
};
