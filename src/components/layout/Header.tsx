import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function Header({ title, onMenuClick, onToggleCollapse, isCollapsed }: HeaderProps) {
  return (
    <header className="sticky top-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          className="btn btn-ghost btn-icon btn-sm lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Desktop collapse button */}
        {onToggleCollapse && (
          <button
            className="btn btn-ghost btn-icon btn-sm hidden lg:flex"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}
        
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}
