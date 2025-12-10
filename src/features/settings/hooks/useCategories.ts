import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
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
    mutationFn: (data: CategoryFormData) => categoryService.create(data),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      categoryService.update(id, data),
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
    mutationFn: (id: string) => categoryService.delete(id),
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
