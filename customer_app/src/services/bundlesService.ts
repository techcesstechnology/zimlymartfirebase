import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bundle } from '@/types/commerce';

export const bundlesService = {
    async listActiveByArea(areaId: string): Promise<Bundle[]> {
        const q = query(
            collection(db, 'bundles'),
            where('areaId', '==', areaId),
            where('isActive', '==', true),
            orderBy('sortPriority', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));
    },

    async get(id: string): Promise<Bundle | null> {
        const snap = await getDoc(doc(db, 'bundles', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Bundle;
    }
};
