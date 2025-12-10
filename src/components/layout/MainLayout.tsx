import { useState, type ReactNode, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import '@/styles/layout.css';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleCollapsed: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed }}>
      <div className="layout">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
        />
        
        <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header 
            title={title} 
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCollapse={toggleCollapsed}
            isCollapsed={isCollapsed}
          />
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
