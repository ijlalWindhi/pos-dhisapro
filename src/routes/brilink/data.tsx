import { createFileRoute } from '@tanstack/react-router';
import { BrilinkDataPage } from '@/features/brilink/BrilinkDataPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/brilink/data')({
  component: () => (
    <ProtectedRoute permission="brilink">
      <BrilinkDataPage />
    </ProtectedRoute>
  ),
});
