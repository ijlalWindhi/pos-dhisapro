import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/features/settings/UsersPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/users')({
  component: () => (
    <ProtectedRoute permission="users">
      <UsersPage />
    </ProtectedRoute>
  ),
});
