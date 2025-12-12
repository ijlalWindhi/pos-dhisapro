import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
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
    mutationFn: async ({ 
      data, 
      userId, 
      userName 
    }: { 
      data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; 
      userId: string; 
      userName: string;
    }) => {
      const id = await productService.create(data);
      
      // Log audit
      await createAuditLog(
        'products',
        'create',
        id,
        data.name,
        userId,
        userName,
        null,
        { ...data, id }
      );
      
      return id;
    },
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
    mutationFn: async ({ 
      id, 
      data, 
      userId, 
      userName 
    }: { 
      id: string; 
      data: Partial<Omit<Product, 'id' | 'createdAt'>>; 
      userId: string; 
      userName: string;
    }) => {
      // Get before data
      const beforeProduct = await productService.getById(id);
      
      await productService.update(id, data);
      
      // Log audit
      if (beforeProduct) {
        await createAuditLog(
          'products',
          'update',
          id,
          beforeProduct.name,
          userId,
          userName,
          beforeProduct as unknown as Record<string, unknown>,
          { ...beforeProduct, ...data } as unknown as Record<string, unknown>
        );
      }
    },
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
    mutationFn: async ({ 
      id, 
      productName,
      userId, 
      userName 
    }: { 
      id: string; 
      productName: string;
      userId: string; 
      userName: string;
    }) => {
      // Get before data
      const beforeProduct = await productService.getById(id);
      
      await productService.delete(id);
      
      // Log audit
      await createAuditLog(
        'products',
        'delete',
        id,
        productName,
        userId,
        userName,
        beforeProduct as unknown as Record<string, unknown>,
        null
      );
    },
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
