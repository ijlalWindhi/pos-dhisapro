import { createFileRoute } from '@tanstack/react-router';
import { SalesDetailPage } from '@/features/sales/SalesDetailPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/sales/today')({
  component: () => (
    <ProtectedRoute permission="sales">
      <SalesDetailPage />
    </ProtectedRoute>
  ),
});
