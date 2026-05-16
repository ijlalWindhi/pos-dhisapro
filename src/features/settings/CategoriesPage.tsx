import { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tags, FolderTree } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CategoryFormModal } from './components/CategoryFormModal';
import { CombinedCategoryFormModal } from './components/CombinedCategoryFormModal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './hooks/useCategories';
import {
  useCombinedCategories,
  useCreateCombinedCategory,
  useUpdateCombinedCategory,
  useDeleteCombinedCategory,
} from './hooks/useCombinedCategories';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Category, CombinedCategory } from '@/types';

type TabKey = 'categories' | 'combined';

export function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('categories');

  // --- Kategori state ---
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- Kategori Gabungan state ---
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [editingCombined, setEditingCombined] = useState<CombinedCategory | null>(null);
  const [deleteCombinedConfirm, setDeleteCombinedConfirm] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const { user } = useAuth();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { data: combinedCategories = [], isLoading: isLoadingCombined } = useCombinedCategories();
  const createCombined = useCreateCombinedCategory();
  const updateCombined = useUpdateCombinedCategory();
  const deleteCombined = useDeleteCombinedCategory();

  // --- Kategori handlers ---
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

  // --- Kategori Gabungan handlers ---
  const openCombinedModal = useCallback((combined?: CombinedCategory) => {
    setEditingCombined(combined || null);
    setShowCombinedModal(true);
  }, []);

  const closeCombinedModal = () => {
    setShowCombinedModal(false);
    setEditingCombined(null);
  };

  const handleCombinedSubmit = async (formData: { name: string; categoryIds: string[]; categoryNames: string[] }) => {
    if (editingCombined) {
      await updateCombined.mutateAsync({
        id: editingCombined.id,
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createCombined.mutateAsync({
        data: formData,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeCombinedModal();
  };

  const handleDeleteCombined = async () => {
    if (!deleteCombinedConfirm) return;
    const combined = combinedCategories.find(c => c.id === deleteCombinedConfirm);
    await deleteCombined.mutateAsync({
      id: deleteCombinedConfirm,
      categoryName: combined?.name || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
    setDeleteCombinedConfirm(null);
  };

  // --- Columns ---
  const categoryColumns = useMemo<ColumnDef<Category>[]>(() => [
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

  const combinedColumns = useMemo<ColumnDef<CombinedCategory>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nama Kategori Gabungan',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.name}</span>
      ),
    },
    {
      id: 'categoryNames',
      header: 'Kategori',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.original.categoryNames.map((name, i) => (
            <span key={i} className="badge badge-primary">{name}</span>
          ))}
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
            onClick={() => openCombinedModal(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Hapus"
            onClick={() => setDeleteCombinedConfirm(row.original.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [openCombinedModal]);

  return (
    <MainLayout title="Kategori">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manajemen Kategori</h2>
          <p className="page-subtitle">Kelola kategori produk toko Anda</p>
        </div>
        {activeTab === 'categories' ? (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Tambah Kategori</span>
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => openCombinedModal()}>
            <Plus size={18} />
            <span>Tambah Kategori Gabungan</span>
          </button>
        )}
      </div>

      {/* Tab Selector */}
      <div className="card mb-4">
        <div className="card-body flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tags size={16} />
            <span>Kategori</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'combined' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('combined')}
          >
            <FolderTree size={16} />
            <span>Kategori Gabungan</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' ? (
        <div className="card">
          <DataTable
            data={categories}
            columns={categoryColumns}
            isLoading={isLoading}
            emptyMessage="Belum ada kategori"
            emptyIcon={<Tags size={28} />}
          />
        </div>
      ) : (
        <div className="card">
          <DataTable
            data={combinedCategories}
            columns={combinedColumns}
            isLoading={isLoadingCombined}
            emptyMessage="Belum ada kategori gabungan"
            emptyIcon={<FolderTree size={28} />}
          />
        </div>
      )}

      {/* Category Add/Edit Modal */}
      <CategoryFormModal
        isOpen={showModal}
        category={editingCategory}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {/* Combined Category Add/Edit Modal */}
      <CombinedCategoryFormModal
        isOpen={showCombinedModal}
        combinedCategory={editingCombined}
        categories={categories}
        isSubmitting={createCombined.isPending || updateCombined.isPending}
        onClose={closeCombinedModal}
        onSubmit={handleCombinedSubmit}
      />

      {/* Category Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini? Produk yang menggunakan kategori ini tidak akan terpengaruh."
        confirmLabel="Ya, Hapus"
        isLoading={deleteCategory.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Combined Category Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCombinedConfirm}
        title="Hapus Kategori Gabungan"
        message="Apakah Anda yakin ingin menghapus kategori gabungan ini?"
        confirmLabel="Ya, Hapus"
        isLoading={deleteCombined.isPending}
        onConfirm={handleDeleteCombined}
        onCancel={() => setDeleteCombinedConfirm(null)}
      />
    </MainLayout>
  );
}
