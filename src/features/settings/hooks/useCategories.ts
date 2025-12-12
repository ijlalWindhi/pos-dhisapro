import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
import type { CategoryFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'categories';

export function useCategories() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => categoryService.getAll(),
  });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: [QUERY_KEY, 'active'],
    queryFn: () => categoryService.getActive(),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      data, 
      userId, 
      userName 
    }: { 
      data: CategoryFormData; 
      userId: string; 
      userName: string;
    }) => {
      const id = await categoryService.create(data);
      
      await createAuditLog(
        'categories',
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
      toast.success('Kategori berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan kategori');
      console.error('Create category error:', error);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data, 
      userId, 
      userName 
    }: { 
      id: string; 
      data: Partial<CategoryFormData>; 
      userId: string; 
      userName: string;
    }) => {
      const beforeCategory = await categoryService.getById(id);
      
      await categoryService.update(id, data);
      
      if (beforeCategory) {
        await createAuditLog(
          'categories',
          'update',
          id,
          beforeCategory.name,
          userId,
          userName,
          beforeCategory as unknown as Record<string, unknown>,
          { ...beforeCategory, ...data } as unknown as Record<string, unknown>
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kategori berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui kategori');
      console.error('Update category error:', error);
    },
  });
}

export function useDeleteCategory() {
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
      const beforeCategory = await categoryService.getById(id);
      
      await categoryService.delete(id);
      
      await createAuditLog(
        'categories',
        'delete',
        id,
        categoryName,
        userId,
        userName,
        beforeCategory as unknown as Record<string, unknown>,
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kategori berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus kategori');
      console.error('Delete category error:', error);
    },
  });
}
