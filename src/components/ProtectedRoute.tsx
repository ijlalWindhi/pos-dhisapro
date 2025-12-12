import { type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ForbiddenPage } from './ForbiddenPage';
import type { MenuPermission } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: MenuPermission; // Optional - if not provided, only requires authentication
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
  // If logged in but no permission (when permission is required), show 403
  if (user && permission && !hasPermission(permission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
