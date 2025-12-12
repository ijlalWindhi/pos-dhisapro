import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ALL_MENU_PERMISSIONS, type Role, type MenuPermission } from '@/types';

interface RoleFormData {
  name: string;
  description: string;
  permissions: MenuPermission[];
}

interface RoleFormModalProps {
  isOpen: boolean;
  role: Role | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
}

const emptyFormData: RoleFormData = {
  name: '',
  description: '',
  permissions: [],
};

export function RoleFormModal({
  isOpen,
  role,
  isSubmitting,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState<RoleFormData>(emptyFormData);

  useEffect(() => {
    if (isOpen && role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: [...role.permissions],
      });
    } else if (isOpen) {
      setFormData(emptyFormData);
    }
  }, [isOpen, role]);

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
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {role ? 'Edit Role' : 'Tambah Role Baru'}
          </h3>
          <button className="modal-close" onClick={onClose}>
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
                disabled={role?.isSystem}
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || formData.permissions.length === 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
