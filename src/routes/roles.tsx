import { createFileRoute } from '@tanstack/react-router';
import { RolesPage } from '@/features/settings/RolesPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/roles')({
  component: () => (
    <ProtectedRoute permission="roles">
      <RolesPage />
    </ProtectedRoute>
  ),
});
