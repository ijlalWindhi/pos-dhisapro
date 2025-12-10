import { createFileRoute } from '@tanstack/react-router';
import { SalesPage } from '@/features/sales/SalesPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/sales')({
  component: () => (
    <ProtectedRoute permission="sales">
      <SalesPage />
    </ProtectedRoute>
  ),
});
