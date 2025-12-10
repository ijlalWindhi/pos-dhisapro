import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPage } from '@/features/settings/CategoriesPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/categories')({
  component: () => (
    <ProtectedRoute permission="categories">
      <CategoriesPage />
    </ProtectedRoute>
  ),
});
