import { createFileRoute } from '@tanstack/react-router';
import { ProductsPage } from '@/features/products/ProductsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/products')({
  component: () => (
    <ProtectedRoute permission="products">
      <ProductsPage />
    </ProtectedRoute>
  ),
});
