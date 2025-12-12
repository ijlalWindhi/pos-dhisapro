import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  category: Category | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

const emptyFormData: CategoryFormData = {
  name: '',
  description: '',
  isActive: true,
};

export function CategoryFormModal({
  isOpen,
  category,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);

  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
    } else if (isOpen) {
      setFormData(emptyFormData);
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-label-required">Nama Kategori</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Alat Tulis"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea
                className="form-textarea"
                placeholder="Deskripsi singkat kategori"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Kategori aktif</span>
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
