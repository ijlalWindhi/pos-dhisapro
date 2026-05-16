import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CombinedCategory, Category } from '@/types';

interface CombinedCategoryFormData {
  name: string;
  categoryIds: string[];
}

interface CombinedCategoryFormModalProps {
  isOpen: boolean;
  combinedCategory: CombinedCategory | null;
  categories: Category[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; categoryIds: string[]; categoryNames: string[] }) => Promise<void>;
}

const INITIAL_FORM: CombinedCategoryFormData = {
  name: '',
  categoryIds: ['', ''],
};

export function CombinedCategoryFormModal({
  isOpen,
  combinedCategory,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: CombinedCategoryFormModalProps) {
  const [formData, setFormData] = useState<CombinedCategoryFormData>(INITIAL_FORM);

  useEffect(() => {
    if (isOpen && combinedCategory) {
      setFormData({
        name: combinedCategory.name,
        categoryIds: combinedCategory.categoryIds.length >= 2
          ? [...combinedCategory.categoryIds]
          : [...combinedCategory.categoryIds, ...Array(2 - combinedCategory.categoryIds.length).fill('')],
      });
    } else if (isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [isOpen, combinedCategory]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // Set of currently selected category IDs (excluding empty strings)
  const selectedIds = useMemo(
    () => new Set(formData.categoryIds.filter(Boolean)),
    [formData.categoryIds]
  );

  const updateCategoryId = (index: number, value: string) => {
    setFormData(prev => {
      const next = [...prev.categoryIds];
      next[index] = value;
      return { ...prev, categoryIds: next };
    });
  };

  const addCategorySlot = () => {
    setFormData(prev => ({
      ...prev,
      categoryIds: [...prev.categoryIds, ''],
    }));
  };

  const removeCategorySlot = (index: number) => {
    if (formData.categoryIds.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((_, i) => i !== index),
    }));
  };

  const filledCategoryIds = formData.categoryIds.filter(Boolean);
  const canSubmit =
    formData.name.trim().length > 0 &&
    filledCategoryIds.length >= 2 &&
    new Set(filledCategoryIds).size === filledCategoryIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const ids = filledCategoryIds;
    const names = ids.map(id => categoryMap.get(id) || '');
    await onSubmit({ name: formData.name.trim(), categoryIds: ids, categoryNames: names });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {combinedCategory ? 'Edit Kategori Gabungan' : 'Tambah Kategori Gabungan'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name input */}
            <div className="form-group">
              <label className="form-label form-label-required">Nama Kategori Gabungan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Parfum"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Category selectors */}
            <div className="form-group">
              <label className="form-label form-label-required">Kategori yang Digabungkan</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.categoryIds.map((catId, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      className="form-select"
                      value={catId}
                      onChange={(e) => updateCategoryId(index, e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories
                        .filter(cat => cat.isActive)
                        .filter(cat => cat.id === catId || !selectedIds.has(cat.id))
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      }
                    </select>
                    {formData.categoryIds.length > 2 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm text-danger-500"
                        title="Hapus"
                        onClick={() => removeCategorySlot(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
                onClick={addCategorySlot}
              >
                <Plus size={14} />
                <span>Tambah Kategori</span>
              </button>
              {filledCategoryIds.length < 2 && (
                <p style={{ fontSize: '12px', color: 'var(--color-danger-500)', marginTop: '4px' }}>
                  Pilih minimal 2 kategori
                </p>
              )}
            </div>

            {/* Preview */}
            {filledCategoryIds.length >= 2 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-gray-50)',
                  border: '1px solid var(--color-gray-200)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginBottom: '6px' }}>
                  Preview
                </div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {formData.name.trim() || '(Belum ada nama)'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {filledCategoryIds.map(id => (
                    <span key={id} className="badge badge-primary">
                      {categoryMap.get(id) || id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
