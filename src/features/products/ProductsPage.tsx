import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts';
import { useActiveCategories } from '@/features/settings/hooks/useCategories';
import { formatNumber, parseNumber, formatCurrency } from '@/utils/format';
import type { Product, Category } from '@/types';


const emptyFormData = {
  name: '',
  sku: '',
  categoryId: '',
  price: 0,
  buyPrice: 0,
  stock: 0,
  minStock: 0,
  unit: 'pcs',
  isActive: true,
};

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useActiveCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Generate SKU prefix from category name (first 3 letters uppercase)
  // If conflict exists, use 4th letter instead of 3rd
  const generateSKUPrefix = useCallback((categoryName: string, allCategories: Category[]): string => {
    const normalized = categoryName.toUpperCase().replace(/[^A-Z]/g, '');
    if (normalized.length < 3) return normalized.padEnd(3, 'X');
    
    const defaultPrefix = normalized.slice(0, 3);
    
    // Check if other categories have the same prefix
    const conflictingCategories = allCategories.filter(cat => {
      if (cat.name.toUpperCase() === categoryName.toUpperCase()) return false;
      const catNormalized = cat.name.toUpperCase().replace(/[^A-Z]/g, '');
      return catNormalized.slice(0, 3) === defaultPrefix;
    });
    
    // If no conflict, use default prefix
    if (conflictingCategories.length === 0) {
      return defaultPrefix;
    }
    
    // If conflict exists, use first 2 letters + 4th letter
    if (normalized.length >= 4) {
      return normalized.slice(0, 2) + normalized[3];
    }
    
    return defaultPrefix;
  }, []);

  // Get next sequence number for a SKU prefix
  const getNextSequence = useCallback((prefix: string): number => {
    const existingProducts = products.filter(p => p.sku.startsWith(prefix + '-'));
    if (existingProducts.length === 0) return 1;
    
    const sequences = existingProducts.map(p => {
      const match = p.sku.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    });
    
    return Math.max(...sequences) + 1;
  }, [products]);

  // Generate full SKU for a category
  const generateSKU = useCallback((categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    const prefix = generateSKUPrefix(category.name, categories);
    const sequence = getNextSequence(prefix);
    return `${prefix}-${sequence.toString().padStart(3, '0')}`;
  }, [categories, generateSKUPrefix, getNextSequence]);

  // Handle category change - auto-generate SKU
  const handleCategoryChange = (categoryId: string) => {
    if (!editingProduct) {
      // Only auto-generate for new products
      const newSku = generateSKU(categoryId);
      setFormData({ ...formData, categoryId, sku: newSku });
    } else {
      setFormData({ ...formData, categoryId });
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId || '',
        price: product.price,
        buyPrice: product.buyPrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name || '';
    
    if (editingProduct) {
      await updateProduct.mutateAsync({ 
        id: editingProduct.id, 
        data: { ...formData, categoryName } 
      });
    } else {
      await createProduct.mutateAsync({ ...formData, categoryName });
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
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
            className="btn btn-ghost btn-icon btn-sm" 
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
          <h2 className="page-title">Daftar Produk</h2>
          <p className="page-subtitle">Kelola produk dan stok toko Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="p-3">
          <div className="form-input-wrapper">
            <Search className="form-input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Nama Produk</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Buku Tulis Sidu"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">SKU</label>
                    <input
                      type="text"
                      className="form-input bg-gray-100 cursor-not-allowed"
                      placeholder="Pilih kategori terlebih dahulu"
                      value={formData.sku}
                      disabled
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">SKU otomatis berdasarkan kategori</p>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Kategori</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="form-help">Tambahkan kategori terlebih dahulu di menu Kategori</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Satuan</label>
                    <select
                      className="form-select"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                      <option value="pak">pak</option>
                      <option value="lusin">lusin</option>
                      <option value="rim">rim</option>
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="liter">liter</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Harga Beli</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0"
                      inputMode="numeric"
                      value={formatNumber(formData.buyPrice)}
                      onChange={(e) => setFormData({ ...formData, buyPrice: parseNumber(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Harga Jual</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0"
                      inputMode="numeric"
                      value={formatNumber(formData.price)}
                      onChange={(e) => setFormData({ ...formData, price: parseNumber(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Stok Awal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0"
                      inputMode="numeric"
                      value={formatNumber(formData.stock)}
                      onChange={(e) => setFormData({ ...formData, stock: parseNumber(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Stok Minimum</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0"
                      inputMode="numeric"
                      value={formatNumber(formData.minStock)}
                      onChange={(e) => setFormData({ ...formData, minStock: parseNumber(e.target.value) })}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Peringatan jika stok di bawah ini</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Produk aktif (dapat dijual)</span>
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
                  disabled={createProduct.isPending || updateProduct.isPending || !formData.sku}
                >
                  {createProduct.isPending || updateProduct.isPending ? 'Menyimpan...' : 'Simpan'}
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
              <h3 className="modal-title">Hapus Produk</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus produk ini?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Batal
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
