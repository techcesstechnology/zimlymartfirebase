// Admin User Role definitions & matrix
export type AdminRole =
    | 'super_admin'
    | 'admin'
    | 'inventory_manager'
    | 'content_manager'
    | 'dispatcher'
    | 'finance'
    | 'driver';

export interface AdminUser {
    uid: string;
    email: string;
    displayName: string;
    role: AdminRole;
    locationId?: string; // for location-scoped roles (driver)
    isActive: boolean;
    createdAt: string;
}

// Role → Permission Matrix
export const RolePermissions: Record<AdminRole, string[]> = {
    super_admin: ['*'],                                                // All
    admin: ['products.*', 'inventory.*', 'orders.*', 'deliveries.*', 'cms.*', 'promotions.*', 'bundles.*', 'users.read'],
    inventory_manager: ['products.read', 'inventory.*', 'bundles.*'],
    content_manager: ['cms.*', 'products.read', 'bundles.*'],
    dispatcher: ['deliveries.*', 'orders.read'],
    finance: ['orders.read', 'payments.read'],
    driver: ['deliveries.read.own'],
};

export const hasPermission = (role: AdminRole, permission: string): boolean => {
    const perms = RolePermissions[role];
    return perms.includes('*') || perms.includes(permission) ||
        perms.some(p => p.endsWith('.*') && permission.startsWith(p.replace('.*', '.')));
};
