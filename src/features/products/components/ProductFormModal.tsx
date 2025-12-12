import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatNumber, parseNumber } from '@/utils/format';
import type { Product, Category } from '@/types';

interface ProductFormData {
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  existingProducts: Product[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

const emptyFormData: ProductFormData = {
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

export function ProductFormModal({
  isOpen,
  product,
  categories,
  existingProducts,
  isSubmitting,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [nameError, setNameError] = useState<string | null>(null);

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
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
    } else if (isOpen) {
      setFormData(emptyFormData);
    }
    setNameError(null);
  }, [isOpen, product]);

  // Generate SKU prefix from category name
  const generateSKUPrefix = useCallback((categoryName: string, allCategories: Category[]): string => {
    const normalized = categoryName.toUpperCase().replace(/[^A-Z]/g, '');
    if (normalized.length < 3) return normalized.padEnd(3, 'X');
    
    const defaultPrefix = normalized.slice(0, 3);
    
    const conflictingCategories = allCategories.filter(cat => {
      if (cat.name.toUpperCase() === categoryName.toUpperCase()) return false;
      const catNormalized = cat.name.toUpperCase().replace(/[^A-Z]/g, '');
      return catNormalized.slice(0, 3) === defaultPrefix;
    });
    
    if (conflictingCategories.length === 0) {
      return defaultPrefix;
    }
    
    if (normalized.length >= 4) {
      return normalized.slice(0, 2) + normalized[3];
    }
    
    return defaultPrefix;
  }, []);

  // Get next sequence number for a SKU prefix
  const getNextSequence = useCallback((prefix: string): number => {
    const existing = existingProducts.filter(p => p.sku.startsWith(prefix + '-'));
    if (existing.length === 0) return 1;
    
    const sequences = existing.map(p => {
      const match = p.sku.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    });
    
    return Math.max(...sequences) + 1;
  }, [existingProducts]);

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
    if (!product) {
      const newSku = generateSKU(categoryId);
      setFormData({ ...formData, categoryId, sku: newSku });
    } else {
      setFormData({ ...formData, categoryId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate product name
    const normalizedName = formData.name.trim().toLowerCase();
    const duplicateProduct = existingProducts.find(p => {
      if (product && p.id === product.id) return false;
      return p.name.trim().toLowerCase() === normalizedName;
    });
    
    if (duplicateProduct) {
      setNameError('Nama produk sudah digunakan');
      return;
    }
    
    setNameError(null);
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h3>
          <button className="modal-close" onClick={onClose}>
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
                  className={`form-input ${nameError ? 'border-danger-500' : ''}`}
                  placeholder="Contoh: Buku Tulis Sidu"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (nameError) setNameError(null);
                  }}
                  required
                />
                {nameError && (
                  <p className="text-xs text-danger-500 mt-1">{nameError}</p>
                )}
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || !formData.sku}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
