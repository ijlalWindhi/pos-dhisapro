import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
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
    mutationFn: async ({ 
      data, 
      userId, 
      userName 
    }: { 
      data: UserFormData & { password: string }; 
      userId: string; 
      userName: string;
    }) => {
      const id = await userService.create({
        email: data.email,
        password: data.password,
        name: data.name,
        roleId: data.roleId,
        isActive: data.isActive,
      });
      
      // Don't log password in audit
      const auditData = { 
        email: data.email, 
        name: data.name, 
        roleId: data.roleId, 
        isActive: data.isActive,
        id 
      };
      
      await createAuditLog(
        'users',
        'create',
        id,
        data.name,
        userId,
        userName,
        null,
        auditData
      );
      
      return id;
    },
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
    mutationFn: async ({ 
      id, 
      data, 
      userId, 
      userName 
    }: { 
      id: string; 
      data: Partial<{ name: string; roleId: string; isActive: boolean }>; 
      userId: string; 
      userName: string;
    }) => {
      const beforeUser = await userService.getById(id);
      
      await userService.update(id, data);
      
      if (beforeUser) {
        await createAuditLog(
          'users',
          'update',
          id,
          beforeUser.name,
          userId,
          userName,
          beforeUser as unknown as Record<string, unknown>,
          { ...beforeUser, ...data } as unknown as Record<string, unknown>
        );
      }
    },
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
    mutationFn: async ({ 
      id, 
      userNameToDelete,
      userId, 
      userName 
    }: { 
      id: string; 
      userNameToDelete: string;
      userId: string; 
      userName: string;
    }) => {
      const beforeUser = await userService.getById(id);
      
      await userService.delete(id);
      
      await createAuditLog(
        'users',
        'delete',
        id,
        userNameToDelete,
        userId,
        userName,
        beforeUser as unknown as Record<string, unknown>,
        null
      );
    },
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
