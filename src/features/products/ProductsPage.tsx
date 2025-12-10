import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts';
import { useActiveCategories } from '@/features/settings/hooks/useCategories';
import type { Product } from '@/types';
import '@/styles/button.css';
import '@/styles/form.css';
import '@/styles/card.css';
import '@/styles/components.css';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateSKU = () => {
    const prefix = 'PRD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp.slice(-4)}${random}`;
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
      setFormData({
        ...emptyFormData,
        sku: generateSKU(),
      });
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

  return (
    <MainLayout title="Produk">
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Produk</h2>
          <p className="page-subtitle">Kelola produk dan stok toko Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
          <div className="form-input-wrapper">
            <Search className="form-input-icon" size={20} />
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
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Harga Jual</th>
                  <th style={{ textAlign: 'center' }}>Stok</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Package size={32} />
                        </div>
                        <div className="empty-state-title">Tidak ada produk</div>
                        <p className="empty-state-description">
                          {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Mulai tambahkan produk baru'}
                        </p>
                        {!searchQuery && (
                          <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={18} /> Tambah Produk
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{product.sku}</td>
                      <td>
                        <span className="badge badge-gray">{product.categoryName || 'Tidak ada'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${product.stock <= product.minStock ? 'badge-danger' : 'badge-success'}`}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-gray'}`}>
                          {product.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="table-action" style={{ justifyContent: 'center' }}>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Edit"
                            onClick={() => openModal(product)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon btn-sm" 
                            title="Hapus"
                            onClick={() => setDeleteConfirm(product.id)}
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
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
                      className="form-input"
                      placeholder="Contoh: BTK-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Kategori</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                      <option value="pcs">Pcs</option>
                      <option value="box">Box</option>
                      <option value="rim">Rim</option>
                      <option value="lusin">Lusin</option>
                      <option value="pack">Pack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Harga Beli</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.buyPrice || ''}
                      onChange={(e) => setFormData({ ...formData, buyPrice: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Harga Jual</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Stok Awal</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.stock || ''}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stok Minimum</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.minStock || ''}
                      onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    />
                    <p className="form-help">Akan muncul peringatan jika stok dibawah nilai ini</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Produk aktif (tampil di penjualan)</span>
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
                  disabled={createProduct.isPending || updateProduct.isPending}
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
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hapus Produk</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>
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
