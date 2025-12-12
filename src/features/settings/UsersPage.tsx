import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users as UsersIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UserFormModal } from './components/UserFormModal';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './hooks/useUsers';
import { useRoles } from './hooks/useRoles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '@/types';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const openModal = (user?: User) => {
    setEditingUser(user || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (formData: {
    email: string;
    password: string;
    name: string;
    roleId: string;
    isActive: boolean;
  }, isEditing: boolean) => {
    if (isEditing && editingUser) {
      await updateUser.mutateAsync({ 
        id: editingUser.id, 
        data: {
          name: formData.name,
          roleId: formData.roleId,
          isActive: formData.isActive,
        },
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
      });
    } else {
      await createUser.mutateAsync({
        data: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          roleId: formData.roleId,
          isActive: formData.isActive,
        },
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
      });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const userToDelete = users.find(u => u.id === deleteConfirm);
    await deleteUser.mutateAsync({
      id: deleteConfirm,
      userNameToDelete: userToDelete?.name || '',
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
    });
    setDeleteConfirm(null);
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.name}
          {row.original.id === currentUser?.id && (
            <span className="badge badge-primary ml-1.5">Anda</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-gray-400">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'roleName',
      header: 'Role',
      cell: ({ getValue }) => (
        <span className="badge badge-gray">{(getValue() as string) || 'Unknown'}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="table-action">
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            title="Edit"
            onClick={() => openModal(row.original)}
          >
            <Edit2 size={16} />
          </button>
          {row.original.id !== currentUser?.id && (
            <button 
              className="btn btn-ghost btn-icon btn-sm" 
              title="Hapus"
              onClick={() => setDeleteConfirm(row.original.id)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ], [currentUser?.id]);

  return (
    <MainLayout title="Pengguna">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manajemen Pengguna</h2>
          <p className="page-subtitle">Kelola pengguna dan akses sistem</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="card">
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Belum ada pengguna"
          emptyIcon={<UsersIcon size={28} />}
        />
      </div>

      {/* Add/Edit Modal */}
      <UserFormModal
        isOpen={showModal}
        user={editingUser}
        roles={roles}
        isSubmitting={createUser.isPending || updateUser.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Akun yang dihapus tidak dapat dipulihkan."
        confirmLabel="Ya, Hapus"
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
