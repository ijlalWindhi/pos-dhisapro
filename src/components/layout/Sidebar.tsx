import { Link, useLocation } from '@tanstack/react-router';
import { 
  Store, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  BarChart3,
  LogOut,
  Users,
  Shield,
  Tags,
  FileText
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MenuPermission } from '@/types';

const navItems: { 
  section: string; 
  items: { to: string; label: string; icon: typeof LayoutDashboard; permission: MenuPermission }[] 
}[] = [
  {
    section: 'Menu Utama',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { to: '/sales', label: 'Penjualan', icon: ShoppingCart, permission: 'sales' },
      { to: '/brilink', label: 'BRILink', icon: Wallet, permission: 'brilink' },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { to: '/products', label: 'Produk', icon: Package, permission: 'products' },
      { to: '/categories', label: 'Kategori', icon: Tags, permission: 'categories' },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { to: '/reports', label: 'Laporan', icon: BarChart3, permission: 'reports' },
    ],
  },
  {
    section: 'Pengaturan',
    items: [
      { to: '/users', label: 'Pengguna', icon: Users, permission: 'users' },
      { to: '/roles', label: 'Role', icon: Shield, permission: 'roles' },
      { to: '/audit-logs', label: 'Audit Log', icon: FileText, permission: 'audit_logs' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen, onClose, isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const { user, hasPermission, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filter nav items based on permissions
  const filteredNavItems = navItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasPermission(item.permission)),
    }))
    .filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-90 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 bottom-0 z-100 flex flex-col
          bg-gradient-to-b from-primary-800 to-primary-900 text-white
          transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center shrink-0">
              <Store size={20} />
            </div>
            {!isCollapsed && <span className="text-lg font-bold">DhisaPro</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {filteredNavItems.map((section) => (
            <div key={section.section} className="mb-2">
              {!isCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  {section.section}
                </div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center gap-3 py-2 text-sm font-medium text-white/80
                    transition-all duration-150 border-l-3 border-transparent
                    hover:bg-white/10 hover:text-white
                    ${isActive(item.to) ? 'bg-white/15 text-white border-l-primary-300' : ''}
                    ${isCollapsed ? 'justify-center px-3' : 'px-4'}
                  `}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center gap-2 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-white/60">{user?.roleName || 'User'}</div>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-danger w-full"
            title="Keluar"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
