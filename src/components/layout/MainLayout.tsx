import { useState, type ReactNode, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

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
      <div className="flex min-h-screen w-full">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
        />
        
        <main
          className={`
            flex-1 flex flex-col min-h-screen transition-all duration-300 w-screen
            ${isCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
          `}
        >
          <Header 
            title={title} 
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCollapse={toggleCollapsed}
            isCollapsed={isCollapsed}
          />
          <div className="flex-1 p-4 md:p-4">
            {children}
          </div>
          <footer className="py-2 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
            © {new Date().getFullYear()} Dhisa Production. All rights reserved.
          </footer>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
