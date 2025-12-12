import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, X } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from './hooks/useRoles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ALL_MENU_PERMISSIONS, type Role, type MenuPermission } from '@/types';

const emptyFormData = {
  name: '',
  description: '',
  permissions: [] as MenuPermission[],
};

export function RolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: roles = [], isLoading } = useRoles();
  const { user } = useAuth();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: [...role.permissions],
      });
    } else {
      setEditingRole(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData(emptyFormData);
  };

  const togglePermission = (permission: MenuPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const handleDelete = async (id: string) => {
    const role = roles.find(r => r.id === id);
    await deleteRole.mutateAsync({
      id,
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
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">Nama Role</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Manager"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={editingRole?.isSystem}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Deskripsi singkat role ini"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Hak Akses Menu</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ALL_MENU_PERMISSIONS.map((menu) => (
                      <label 
                        key={menu.key} 
                        className={`
                          form-checkbox p-3 rounded-lg cursor-pointer border-2 transition-all
                          ${formData.permissions.includes(menu.key) 
                            ? 'bg-primary-50 border-primary-500' 
                            : 'bg-gray-50 border-transparent'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(menu.key)}
                          onChange={() => togglePermission(menu.key)}
                        />
                        <span>{menu.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createRole.isPending || updateRole.isPending || formData.permissions.length === 0}
                >
                  {createRole.isPending || updateRole.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hapus Role</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus role ini? Pastikan tidak ada pengguna yang menggunakan role ini.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Batal
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteRole.isPending}
              >
                {deleteRole.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
