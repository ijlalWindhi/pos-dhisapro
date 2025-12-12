import type { MenuPermission } from '@/types';

// Navigation routes configuration - single source of truth
export const navRoutes: { permission: MenuPermission; path: string; label: string }[] = [
  { permission: 'dashboard', path: '/', label: 'Dashboard' },
  { permission: 'sales', path: '/sales', label: 'Penjualan' },
  { permission: 'brilink', path: '/brilink', label: 'BRILink' },
  { permission: 'products', path: '/products', label: 'Produk' },
  { permission: 'categories', path: '/categories', label: 'Kategori' },
  { permission: 'reports', path: '/reports', label: 'Laporan' },
  { permission: 'users', path: '/users', label: 'Pengguna' },
  { permission: 'roles', path: '/roles', label: 'Role' },
];

/**
 * Get the first accessible route for a user based on their permissions
 */
export function getFirstAccessibleRoute(permissions: MenuPermission[]): string {
  for (const route of navRoutes) {
    if (permissions.includes(route.permission)) {
      return route.path;
    }
  }
  return '/'; // Fallback to root
}
