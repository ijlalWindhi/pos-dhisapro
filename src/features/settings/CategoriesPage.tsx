import { useState } from 'react';
import { Plus, Edit2, Trash2, Tags } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CategoryFormModal } from './components/CategoryFormModal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './hooks/useCategories';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Category } from '@/types';

export function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const { user } = useAuth();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const openModal = (category?: Category) => {
    setEditingCategory(category || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (formData: { name: string; description: string; isActive: boolean }) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ 
        id: editingCategory.id, 
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createCategory.mutateAsync({
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const category = categories.find(c => c.id === deleteConfirm);
    await deleteCategory.mutateAsync({
      id: deleteConfirm,
      categoryName: category?.name || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
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
          <Plus size={18} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="card">
        <div className="p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Tags size={28} />
                        </div>
                        <div className="empty-state-title">Belum ada kategori</div>
                        <p className="empty-state-description">Tambahkan kategori untuk mengelompokkan produk</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td className="font-semibold">{category.name}</td>
                      <td className="text-gray-400">{category.description || '-'}</td>
                      <td className="text-center">
                        <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                          {category.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="table-action justify-center">
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Edit"
                            onClick={() => openModal(category)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Hapus"
                            onClick={() => setDeleteConfirm(category.id)}
                          >
                            <Trash2 size={16} />
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
      <CategoryFormModal
        isOpen={showModal}
        category={editingCategory}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini? Produk yang menggunakan kategori ini tidak akan terpengaruh."
        confirmLabel="Ya, Hapus"
        isLoading={deleteCategory.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
