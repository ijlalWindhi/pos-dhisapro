import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users as UsersIcon, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './hooks/useUsers';
import { useRoles } from './hooks/useRoles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '@/types';
import '@/styles/button.css';
import '@/styles/form.css';
import '@/styles/card.css';
import '@/styles/components.css';

const emptyFormData = {
  email: '',
  password: '',
  name: '',
  roleId: '',
  isActive: true,
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      await updateUser.mutateAsync({ 
        id: editingUser.id, 
        data: {
          name: formData.name,
          roleId: formData.roleId,
          isActive: formData.isActive,
        }
      });
    } else {
      await createUser.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        roleId: formData.roleId,
        isActive: formData.isActive,
      });
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await deleteUser.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600 }}>
          {row.original.name}
          {row.original.id === currentUser?.id && (
            <span className="badge badge-primary" style={{ marginLeft: '6px' }}>Anda</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span style={{ color: 'var(--text-muted)' }}>{getValue() as string}</span>
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
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama pengguna"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label form-label-required">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label form-label-required">Role</label>
                  <select
                    className="form-select"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    required
                  >
                    <option value="">Pilih Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Pengguna aktif</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createUser.isPending || updateUser.isPending}
                >
                  {createUser.isPending || updateUser.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hapus Pengguna</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus pengguna ini?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Batal
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
