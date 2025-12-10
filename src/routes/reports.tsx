import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/reports')({
  component: () => (
    <ProtectedRoute permission="reports">
      <ReportsPage />
    </ProtectedRoute>
  ),
});
