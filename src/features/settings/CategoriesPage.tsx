import { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tags } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
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

  const openModal = useCallback((category?: Category) => {
    setEditingCategory(category || null);
    setShowModal(true);
  }, []);

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

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nama Kategori',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: ({ row }) => (
        <span className="text-gray-400">{row.original.description || '-'}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <div className="text-center">
          <span className={`badge ${row.original.isActive ? 'badge-success' : 'badge-gray'}`}>
            {row.original.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="table-action justify-center">
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            title="Edit"
            onClick={() => openModal(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            title="Hapus"
            onClick={() => setDeleteConfirm(row.original.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [openModal]);

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
        <DataTable
          data={categories}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Belum ada kategori"
          emptyIcon={<Tags size={28} />}
        />
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
