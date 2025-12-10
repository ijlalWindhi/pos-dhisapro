import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { UserFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'users';

export function useUsers() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => userService.getAll(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormData & { password: string }) => 
      userService.create({
        email: data.email,
        password: data.password,
        name: data.name,
        roleId: data.roleId,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pengguna berhasil ditambahkan');
    },
    onError: (error: Error) => {
      if (error.message.includes('email-already-in-use')) {
        toast.error('Email sudah terdaftar');
      } else {
        toast.error('Gagal menambahkan pengguna');
      }
      console.error('Create user error:', error);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; roleId: string; isActive: boolean }> }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pengguna berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui pengguna');
      console.error('Update user error:', error);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Pengguna berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus pengguna');
      console.error('Delete user error:', error);
    },
  });
}
