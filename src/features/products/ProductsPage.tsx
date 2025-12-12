import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProductFormModal } from './components/ProductFormModal';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts';
import { useActiveCategories } from '@/features/settings/hooks/useCategories';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useActiveCategories();
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (formData: {
    name: string;
    sku: string;
    categoryId: string;
    price: number;
    buyPrice: number;
    stock: number;
    minStock: number;
    unit: string;
    isActive: boolean;
  }) => {
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name || '';
    
    if (editingProduct) {
      await updateProduct.mutateAsync({ 
        id: editingProduct.id, 
        data: { ...formData, categoryName },
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createProduct.mutateAsync({ 
        data: { ...formData, categoryName },
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const product = products.find(p => p.id === deleteConfirm);
    await deleteProduct.mutateAsync({
      id: deleteConfirm,
      productName: product?.name || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
    setDeleteConfirm(null);
  };

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Produk',
      cell: ({ getValue }) => (
        <span className="font-semibold">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ getValue }) => (
        <span className="text-gray-400 text-xs">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Kategori',
      cell: ({ getValue }) => (
        <span className="badge badge-gray">{(getValue() as string) || 'Tidak ada'}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Harga',
      cell: ({ getValue }) => (
        <span className="font-semibold">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stok',
      cell: ({ row }) => {
        const stock = row.original.stock;
        const minStock = row.original.minStock;
        const unit = row.original.unit;
        return (
          <span className={`badge ${stock <= minStock ? 'badge-danger' : 'badge-success'}`}>
            {stock} {unit}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <span className={`badge ${isActive ? 'badge-success' : 'badge-gray'}`}>
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
          <button
            className="btn btn-ghost btn-icon btn-sm text-danger-500"
            title="Hapus"
            onClick={() => setDeleteConfirm(row.original.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <MainLayout title="Produk">
      <div className="page-header">
        <div>
          <h2 className="page-title">Produk</h2>
          <p className="page-subtitle">Kelola daftar produk toko</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <DataTable
          data={filteredProducts}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          emptyIcon={<Package size={28} />}
        />
      </div>

      {/* Add/Edit Modal */}
      <ProductFormModal
        isOpen={showModal}
        product={editingProduct}
        categories={categories}
        existingProducts={products}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini?"
        confirmLabel="Ya, Hapus"
        isLoading={deleteProduct.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
