import { createFileRoute } from '@tanstack/react-router';
import { BrilinkPage } from '@/features/brilink/BrilinkPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/brilink/')({
  component: () => (
    <ProtectedRoute permission="brilink">
      <BrilinkPage />
    </ProtectedRoute>
  ),
});
