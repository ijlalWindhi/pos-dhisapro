import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'products';

export function useProducts() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => productService.getAll(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: [QUERY_KEY, 'lowStock'],
    queryFn: () => productService.getLowStock(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Produk berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan produk');
      console.error('Create product error:', error);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Product, 'id' | 'createdAt'>> }) =>
      productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Produk berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui produk');
      console.error('Update product error:', error);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Produk berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus produk');
      console.error('Delete product error:', error);
    },
  });
}
