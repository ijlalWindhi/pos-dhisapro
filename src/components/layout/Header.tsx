import { Menu } from 'lucide-react';
import '@/styles/layout.css';
import '@/styles/button.css';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        <button
          className="btn btn-ghost btn-icon header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
    </header>
  );
}
