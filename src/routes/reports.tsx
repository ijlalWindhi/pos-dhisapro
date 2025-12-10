import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/reports')({
  component: () => (
    <ProtectedRoute permission="reports">
      <Outlet />
    </ProtectedRoute>
  ),
});
