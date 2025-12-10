import { type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MenuPermission } from '@/types';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  permission: MenuPermission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { hasPermission, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !hasPermission(permission)) {
      navigate({ to: '/' });
    }
  }, [hasPermission, permission, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}
