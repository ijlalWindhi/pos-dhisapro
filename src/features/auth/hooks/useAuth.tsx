import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { roleService } from '@/features/settings/services/roleService';
import { getFirstAccessibleRoute } from '@/utils/navigation';
import type { User, Role, MenuPermission } from '@/types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: MenuPermission[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: MenuPermission) => boolean;
  getDefaultRoute: () => string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserRole = async (userRoleId: string) => {
    try {
      const roleData = await roleService.getById(userRoleId);
      if (roleData) {
        setRole(roleData);
        setPermissions(roleData.permissions);
      }
    } catch (error) {
      console.error('Error loading role:', error);
      // Default to all permissions if role loading fails
      setPermissions(['dashboard', 'products', 'categories', 'sales', 'brilink', 'reports', 'users', 'roles']);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to get user data from Firestore
          const userData = await authService.getUserData(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            await loadUserRole(userData.roleId);
          } else {
            // Fallback: use Firebase Auth data directly
            const fallbackUser = authService.getUserFromFirebaseAuth(firebaseUser);
            setUser(fallbackUser);
            // Default permissions for fallback user
            setPermissions(['dashboard', 'products', 'categories', 'sales', 'brilink', 'reports', 'users', 'roles']);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback: use Firebase Auth data directly
          const fallbackUser = authService.getUserFromFirebaseAuth(firebaseUser);
          setUser(fallbackUser);
          setPermissions(['dashboard', 'products', 'categories', 'sales', 'brilink', 'reports', 'users', 'roles']);
        }
      } else {
        setUser(null);
        setRole(null);
        setPermissions([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await authService.signIn(email, password);
      setUser(userData);
      await loadUserRole(userData.roleId);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = (permission: MenuPermission): boolean => {
    return permissions.includes(permission);
  };

  const getDefaultRoute = (): string => {
    return getFirstAccessibleRoute(permissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isLoading,
        isAuthenticated: !!user,
        hasPermission,
        getDefaultRoute,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
