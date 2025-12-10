import { useState } from 'react';
import { Plus, Edit2, Trash2, Tags, X } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './hooks/useCategories';
import type { Category } from '@/types';
import '@/styles/button.css';
import '@/styles/form.css';
import '@/styles/card.css';
import '@/styles/components.css';

const emptyFormData = {
  name: '',
  description: '',
  isActive: true,
};

export function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data: formData });
    } else {
      await createCategory.mutateAsync(formData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <MainLayout title="Kategori">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manajemen Kategori</h2>
          <p className="page-subtitle">Kelola kategori produk toko Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Tags size={32} />
                        </div>
                        <div className="empty-state-title">Belum ada kategori</div>
                        <p className="empty-state-description">Tambahkan kategori untuk mengelompokkan produk</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td style={{ fontWeight: 600 }}>{category.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{category.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                          {category.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="table-action" style={{ justifyContent: 'center' }}>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Edit"
                            onClick={() => openModal(category)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Hapus"
                            onClick={() => setDeleteConfirm(category.id)}
                          >
                            <Trash2 size={18} />
                          </button>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
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
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {createCategory.isPending || updateCategory.isPending ? 'Menyimpan...' : 'Simpan'}
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
              <h3 className="modal-title">Hapus Kategori</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus kategori ini? Produk yang menggunakan kategori ini tidak akan terpengaruh.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Batal
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
