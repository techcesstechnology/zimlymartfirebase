'use client';

import { useEffect, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GrantAdminPage() {
    const [status, setStatus] = useState('Granting super_admin role...');

    useEffect(() => {
        const uid = 'KVr9ocTPHJhmznHDdkz2HXBAKq42';
        fetch('/api/admin/grant-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid,
                displayName: 'Adonis Muzata',
                email: 'adonismuzataet@gmail.com',
                role: 'super_admin'
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus('✅ Successfully granted super_admin role to Adonis Muzata (adonismuzataet@gmail.com)');
                } else {
                    setStatus('❌ Error: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => setStatus('❌ Error connecting to server: ' + err.message));
    }, []);

    return <div className="p-20 text-center font-mono text-xl">{status}</div>;
}
