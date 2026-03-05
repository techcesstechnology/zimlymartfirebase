"use client";

import { useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocationStore } from '../store/useLocationStore';
import { onAuthStateChanged } from 'firebase/auth';
import { DeliveryArea } from '../types/commerce';

export function useUserSync() {
    const { setAreaLocal, area: currentArea } = useLocationStore();
    const isInitialSync = useRef(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && isInitialSync.current) {
                isInitialSync.current = false;
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const preferences = userDoc.data().preferences;
                        const areaSlug = preferences?.areaSlug;

                        if (areaSlug && (!currentArea || currentArea.slug !== areaSlug)) {
                            console.log("Syncing area from user profile:", areaSlug);
                            const areaDoc = await getDoc(doc(db, 'deliveryAreas', areaSlug));
                            if (areaDoc.exists()) {
                                const areaData = { id: areaDoc.id, ...areaDoc.data() } as DeliveryArea;
                                setAreaLocal(areaData);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error syncing user preferences:", error);
                }
            }
        });

        return () => unsubscribe();
    }, [setAreaLocal, currentArea]);
}
