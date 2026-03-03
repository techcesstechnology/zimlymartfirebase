'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, Warehouse, ShoppingCart,
    Truck, Image, Tag, Users, Settings, BarChart2, LogOut, ChevronRight
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/types/roles';
import clsx from 'clsx';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
    { href: '/dashboard/products', label: 'Products', icon: Package, permission: 'products.read' },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Warehouse, permission: 'inventory.read' },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, permission: 'orders.read' },
    { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck, permission: 'deliveries.read' },
    { href: '/dashboard/cms', label: 'Content', icon: Image, permission: 'cms.read' },
    { href: '/dashboard/promotions', label: 'Promotions', icon: Tag, permission: 'promotions.read' },
    { href: '/dashboard/users', label: 'Users', icon: Users, permission: 'users.read' },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2, permission: null },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { adminUser } = useAuth();

    const visibleItems = NAV_ITEMS.filter(item =>
        !item.permission || (adminUser && hasPermission(adminUser.role, item.permission))
    );

    return (
        <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
                <span className="text-xl font-bold text-white tracking-tighter">ZIMLYMART</span>
                <span className="ml-2 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
            </div>

            {/* Role Badge */}
            {adminUser && (
                <div className="px-6 pt-4 pb-2">
                    <p className="text-xs text-gray-500">Logged in as</p>
                    <p className="text-sm font-semibold text-white">{adminUser.displayName}</p>
                    <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded-full capitalize">
                        {adminUser.role.replace('_', ' ')}
                    </span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href) && href !== '/dashboard'
                        ? true : pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                                active
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{label}</span>
                            {active && <ChevronRight className="w-4 h-4 opacity-70" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Sign Out */}
            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
