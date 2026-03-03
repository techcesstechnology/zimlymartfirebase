'use client';

import { useAuth } from '@/context/AuthContext';
import { AdminRole, hasPermission } from '@/types/roles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    permission?: string;        // e.g. 'products.*'
    allowedRoles?: AdminRole[]; // OR role whitelist
}

export default function RoleGuard({ children, permission, allowedRoles }: Props) {
    const { adminUser, loading } = useAuth();
    const router = useRouter();

    const allowed = adminUser && (
        (permission && hasPermission(adminUser.role, permission)) ||
        (allowedRoles && allowedRoles.includes(adminUser.role)) ||
        (!permission && !allowedRoles) // no restriction → any authenticated admin
    );

    useEffect(() => {
        if (!loading && !adminUser) router.replace('/login');
    }, [loading, adminUser]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
    );

    if (!allowed) return (
        <div className="flex h-screen items-center justify-center text-center p-8">
            <div>
                <p className="text-4xl mb-4">🚫</p>
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
            </div>
        </div>
    );

    return <>{children}</>;
}
