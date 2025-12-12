import { createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/')(({
  component: () => (
    <ProtectedRoute permission="dashboard">
      <DashboardPage />
    </ProtectedRoute>
  ),
}));
