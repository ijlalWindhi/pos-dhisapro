import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
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
    mutationFn: async ({ 
      data, 
      userId, 
      userName 
    }: { 
      data: RoleFormData; 
      userId: string; 
      userName: string;
    }) => {
      const id = await roleService.create(data);
      
      await createAuditLog(
        'roles',
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
    mutationFn: async ({ 
      id, 
      data, 
      userId, 
      userName 
    }: { 
      id: string; 
      data: Partial<RoleFormData>; 
      userId: string; 
      userName: string;
    }) => {
      const beforeRole = await roleService.getById(id);
      
      await roleService.update(id, data);
      
      if (beforeRole) {
        await createAuditLog(
          'roles',
          'update',
          id,
          beforeRole.name,
          userId,
          userName,
          beforeRole as unknown as Record<string, unknown>,
          { ...beforeRole, ...data } as unknown as Record<string, unknown>
        );
      }
    },
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
    mutationFn: async ({ 
      id, 
      roleName,
      userId, 
      userName 
    }: { 
      id: string; 
      roleName: string;
      userId: string; 
      userName: string;
    }) => {
      const beforeRole = await roleService.getById(id);
      
      await roleService.delete(id);
      
      await createAuditLog(
        'roles',
        'delete',
        id,
        roleName,
        userId,
        userName,
        beforeRole as unknown as Record<string, unknown>,
        null
      );
    },
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
