'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AdminUser, AdminRole } from '@/types/roles';

interface AuthContextType {
    user: User | null;
    adminUser: AdminUser | null;
    role: AdminRole | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, adminUser: null, role: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Read role from Firestore user doc (custom claim is enforced server-side)
                const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (snap.exists()) setAdminUser(snap.data() as AdminUser);
            } else {
                setAdminUser(null);
            }
            setLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, adminUser, role: adminUser?.role ?? null, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
