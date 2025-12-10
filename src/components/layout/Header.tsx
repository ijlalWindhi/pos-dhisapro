import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import '@/styles/layout.css';
import '@/styles/button.css';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function Header({ title, onMenuClick, onToggleCollapse, isCollapsed }: HeaderProps) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
        {/* Mobile menu button */}
        <button
          className="btn btn-ghost btn-icon btn-sm header-menu-btn-mobile"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Desktop collapse button */}
        {onToggleCollapse && (
          <button
            className="btn btn-ghost btn-icon btn-sm header-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}
        
        <h1 className="header-title">{title}</h1>
      </div>
    </header>
  );
}
