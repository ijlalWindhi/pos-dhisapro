import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RoleFormModal } from './components/RoleFormModal';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from './hooks/useRoles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ALL_MENU_PERMISSIONS, type Role, type MenuPermission } from '@/types';

export function RolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: roles = [], isLoading } = useRoles();
  const { user } = useAuth();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const openModal = (role?: Role) => {
    setEditingRole(role || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleSubmit = async (formData: {
    name: string;
    description: string;
    permissions: MenuPermission[];
  }) => {
    if (editingRole) {
      await updateRole.mutateAsync({ 
        id: editingRole.id, 
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createRole.mutateAsync({
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const role = roles.find(r => r.id === deleteConfirm);
    await deleteRole.mutateAsync({
      id: deleteConfirm,
      roleName: role?.name || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
    setDeleteConfirm(null);
  };

  return (
    <MainLayout title="Role">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manajemen Role</h2>
          <p className="page-subtitle">Atur role dan hak akses pengguna</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Tambah Role</span>
        </button>
      </div>

      <div className="card">
        <div className="p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Role</th>
                  <th>Deskripsi</th>
                  <th>Hak Akses</th>
                  <th className="text-center">Tipe</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Shield size={28} />
                        </div>
                        <div className="empty-state-title">Belum ada role</div>
                        <p className="empty-state-description">Tambahkan role untuk mengatur hak akses</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id}>
                      <td className="font-semibold">{role.name}</td>
                      <td className="text-gray-400">{role.description || '-'}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map(p => (
                            <span key={p} className="badge badge-gray text-xs">
                              {ALL_MENU_PERMISSIONS.find(m => m.key === p)?.label || p}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="badge badge-gray text-xs">
                              +{role.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${role.isSystem ? 'badge-warning' : 'badge-gray'}`}>
                          {role.isSystem ? 'Sistem' : 'Custom'}
                        </span>
                      </td>
                      <td>
                        <div className="table-action justify-center">
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Edit"
                            onClick={() => openModal(role)}
                          >
                            <Edit2 size={16} />
                          </button>
                          {!role.isSystem && (
                            <button 
                              className="btn btn-ghost btn-icon btn-sm" 
                              title="Hapus"
                              onClick={() => setDeleteConfirm(role.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <RoleFormModal
        isOpen={showModal}
        role={editingRole}
        isSubmitting={createRole.isPending || updateRole.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Role"
        message="Apakah Anda yakin ingin menghapus role ini? Pastikan tidak ada pengguna yang menggunakan role ini."
        confirmLabel="Ya, Hapus"
        isLoading={deleteRole.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
