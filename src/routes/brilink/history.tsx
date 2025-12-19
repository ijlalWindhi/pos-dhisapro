import { createFileRoute } from '@tanstack/react-router';
import { BrilinkHistoryPage } from '@/features/brilink/BrilinkHistoryPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/brilink/history')({
  component: () => (
    <ProtectedRoute permission="brilink">
      <BrilinkHistoryPage />
    </ProtectedRoute>
  ),
});
