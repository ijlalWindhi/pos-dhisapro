import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import type { RoleFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'roles';

export function useRoles() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => roleService.getAll(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoleFormData) => roleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan role');
      console.error('Create role error:', error);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleFormData> }) =>
      roleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui role');
      console.error('Update role error:', error);
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus role');
      console.error('Delete role error:', error);
    },
  });
}
