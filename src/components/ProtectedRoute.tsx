import { type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ForbiddenPage } from './ForbiddenPage';
import type { MenuPermission } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  permission: MenuPermission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { hasPermission, isLoading, user } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // If not logged in, this is handled by the auth provider
  // If logged in but no permission, show 403
  if (user && !hasPermission(permission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
