import { createFileRoute } from '@tanstack/react-router';
import { ReportDetailPage } from '@/features/reports/ReportDetailPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/reports/$date')({
  component: () => (
    <ProtectedRoute permission="reports">
      <ReportDetailPage />
    </ProtectedRoute>
  ),
});
