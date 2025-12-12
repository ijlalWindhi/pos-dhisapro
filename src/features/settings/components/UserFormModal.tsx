import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { User, Role } from '@/types';

interface UserFormData {
  email: string;
  password: string;
  name: string;
  roleId: string;
  isActive: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  user: User | null;
  roles: Role[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData, isEditing: boolean) => Promise<void>;
}

const emptyFormData: UserFormData = {
  email: '',
  password: '',
  name: '',
  roleId: '',
  isActive: true,
};

export function UserFormModal({
  isOpen,
  user,
  roles,
  isSubmitting,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>(emptyFormData);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
      });
    } else if (isOpen) {
      setFormData(emptyFormData);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, !!user);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
          </h3>
          <button className="modal-close" onClick={onClose}>
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
                disabled={!!user}
              />
            </div>
            {!user && (
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
                <span>Pengguna aktif (dapat login)</span>
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
