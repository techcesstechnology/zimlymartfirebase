'use client';

import { useEffect, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GrantAdminPage() {
    const [status, setStatus] = useState('Granting super_admin role...');

    useEffect(() => {
        const uid = 'KVr9ocTPHJhmznHDdkz2HXBAKq42';
        setDoc(doc(db, 'users', uid), {
            uid: uid,
            displayName: 'Adonis Muzata',
            email: 'adonismuzataet@gmail.com',
            role: 'super_admin',
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        }, { merge: true })
            .then(() => setStatus('✅ Successfully granted super_admin role to Adonis Muzata (adonismuzataet@gmail.com)'))
            .catch(err => setStatus('❌ Error granting role: ' + err.message));
    }, []);

    return <div className="p-20 text-center font-mono text-xl">{status}</div>;
}
