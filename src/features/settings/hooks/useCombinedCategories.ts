import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { combinedCategoryService } from '../services/combinedCategoryService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
import type { CombinedCategoryFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'combined_categories';

export function useCombinedCategories() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => combinedCategoryService.getAll(),
  });
}

export function useCreateCombinedCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      data, 
      userId, 
      userName 
    }: { 
      data: CombinedCategoryFormData; 
      userId: string; 
      userName: string;
    }) => {
      const id = await combinedCategoryService.create(data);
      
      await createAuditLog(
        'combined_categories',
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
      toast.success('Kategori gabungan berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan kategori gabungan');
      console.error('Create combined category error:', error);
    },
  });
}

export function useUpdateCombinedCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      userId, 
      userName 
    }: { 
      id: string; 
      data: Partial<CombinedCategoryFormData>; 
      userId: string; 
      userName: string;
    }) => {
      const before = await combinedCategoryService.getById(id);
      
      await combinedCategoryService.update(id, data);
      
      if (before) {
        await createAuditLog(
          'combined_categories',
          'update',
          id,
          before.name,
          userId,
          userName,
          before as unknown as Record<string, unknown>,
          { ...before, ...data } as unknown as Record<string, unknown>
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kategori gabungan berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui kategori gabungan');
      console.error('Update combined category error:', error);
    },
  });
}

export function useDeleteCombinedCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      categoryName,
      userId, 
      userName 
    }: { 
      id: string; 
      categoryName: string;
      userId: string; 
      userName: string;
    }) => {
      const before = await combinedCategoryService.getById(id);
      
      await combinedCategoryService.delete(id);
      
      await createAuditLog(
        'combined_categories',
        'delete',
        id,
        categoryName,
        userId,
        userName,
        before as unknown as Record<string, unknown>,
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kategori gabungan berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus kategori gabungan');
      console.error('Delete combined category error:', error);
    },
  });
}
