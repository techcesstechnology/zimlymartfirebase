import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeliveryArea } from '../types/commerce';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface LocationState {
    city: "Harare";
    area: DeliveryArea | null;
    setArea: (area: DeliveryArea) => Promise<void>;
    setAreaLocal: (area: DeliveryArea) => void;
    clearArea: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            city: "Harare",
            area: null,
            setAreaLocal: (area) => set({ area }),
            setArea: async (area) => {
                set({ area });

                // Sync to Firestore if user is logged in
                const user = auth.currentUser;
                if (user) {
                    try {
                        await updateDoc(doc(db, 'users', user.uid), {
                            "preferences.city": "Harare",
                            "preferences.areaId": area.id,
                            "preferences.areaName": area.name,
                            "preferences.areaSlug": area.slug,
                            "preferences.updatedAt": serverTimestamp()
                        });
                    } catch (error) {
                        console.error("Error syncing location to user profile:", error);
                    }
                }
            },
            clearArea: () => set({ area: null }),
        }),
        {
            name: 'zimlymart-location-storage',
        }
    )
);
