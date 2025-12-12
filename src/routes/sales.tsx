import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/sales')({
  component: () => (
    <ProtectedRoute permission="sales">
      <Outlet />
    </ProtectedRoute>
  ),
});
