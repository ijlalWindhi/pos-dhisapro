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
  Tags
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MenuPermission } from '@/types';
import '@/styles/layout.css';

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
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Store size={24} />
            </div>
            <span>DhisaPro</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((section) => (
            <div key={section.section} className="sidebar-nav-section">
              <div className="sidebar-nav-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-nav-item ${isActive(item.to) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon className="sidebar-nav-item-icon" size={22} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">
                {user?.roleName || 'User'}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-icon btn-sm"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
