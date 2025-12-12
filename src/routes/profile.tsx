import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/profile')({
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});
