import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, ChevronUp, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCreateTransaction } from './hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Product, CartItem } from '@/types';
import '@/styles/button.css';
import '@/styles/form.css';
import '@/styles/card.css';
import '@/styles/components.css';
import './sales.css';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function SalesPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const createTransaction = useCreateTransaction();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [cartExpanded, setCartExpanded] = useState(false);

  // Filter only active products with stock
  const activeProducts = products.filter(p => p.isActive && p.stock > 0);
  
  const filteredProducts = activeProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        // Check stock limit
        if (existingItem.quantity >= product.stock) {
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, subtotal: product.price }];
    });
    // Auto expand cart on mobile when adding items
    if (window.innerWidth <= 768) {
      setCartExpanded(true);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            // Check stock limit
            if (newQuantity > item.product.stock) return item;
            return { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowPayment(false);
    setAmountPaid('');
    setPaymentMethod('cash');
    setCartExpanded(false);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const paidAmount = parseInt(amountPaid.replace(/\D/g, '')) || 0;
  const change = paidAmount - total;

  const handleCompleteTransaction = async () => {
    if (!user || paidAmount < total) return;
    
    try {
      await createTransaction.mutateAsync({
        cart,
        paymentMethod,
        amountPaid: paidAmount,
        discount: 0,
        cashierId: user.id,
        cashierName: user.name,
      });
      clearCart();
    } catch (error) {
      console.error('Transaction error:', error);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MainLayout title="Penjualan">
      <div className="sales-container">
        {/* Product Selection */}
        <div className="sales-products">
          <div className="card" style={{ marginBottom: 'var(--spacing-3)' }}>
            <div className="card-body" style={{ padding: 'var(--spacing-3)' }}>
              <div className="form-input-wrapper">
                <Search className="form-input-icon" size={20} />
                <input
                  type="text"
                  className="form-input form-input-lg"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
              <div className="spinner spinner-lg"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <ShoppingCart size={32} />
                </div>
                <div className="empty-state-title">
                  {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
                </div>
                <p className="empty-state-description">
                  {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan produk di menu Produk'}
                </p>
              </div>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-price">{formatCurrency(product.price)}</div>
                  <div className="product-card-stock">
                    Stok: {product.stock}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Cart Toggle Button */}
        {cart.length > 0 && (
          <button 
            className="cart-toggle" 
            onClick={() => setCartExpanded(!cartExpanded)}
          >
            <ShoppingCart size={24} />
            <span className="cart-toggle-badge">{cartCount}</span>
          </button>
        )}

        {/* Cart */}
        <div className={`sales-cart ${cartExpanded ? 'expanded' : ''}`}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div 
              className="card-header" 
              onClick={() => setCartExpanded(!cartExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <ShoppingCart size={20} />
                <span>Keranjang ({cartCount})</span>
                {cartExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </h3>
              {cart.length > 0 && (
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary-600)' }}>
                  {formatCurrency(total)}
                </span>
              )}
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--spacing-6)' }}>
                  <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                    <ShoppingCart size={24} />
                  </div>
                  <div className="empty-state-title" style={{ fontSize: 'var(--font-size-sm)' }}>Keranjang Kosong</div>
                  <p className="empty-state-description" style={{ fontSize: 'var(--font-size-xs)' }}>Tap produk untuk menambahkan</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">{formatCurrency(item.product.price)}</div>
                    </div>
                    <div className="cart-item-actions">
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="cart-item-subtotal">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-amount">{formatCurrency(total)}</span>
                </div>
                
                {!showPayment ? (
                  <button
                    className="btn btn-success btn-lg btn-full"
                    onClick={() => setShowPayment(true)}
                  >
                    <CreditCard size={20} />
                    <span>Bayar</span>
                  </button>
                ) : (
                  <div className="payment-section">
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-2)' }}>
                      <label className="form-label">Metode Pembayaran</label>
                      <select 
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer' | 'qris')}
                      >
                        <option value="cash">Tunai</option>
                        <option value="transfer">Transfer</option>
                        <option value="qris">QRIS</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-2)' }}>
                      <label className="form-label">Jumlah Dibayar</label>
                      <input
                        type="text"
                        className="form-input form-input-number"
                        placeholder="0"
                        value={amountPaid}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setAmountPaid(value ? parseInt(value).toLocaleString('id-ID') : '');
                        }}
                        inputMode="numeric"
                      />
                    </div>
                    {paidAmount >= total && paidAmount > 0 && (
                      <div className="change-display">
                        <span>Kembalian</span>
                        <span className="change-amount">{formatCurrency(change)}</span>
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-lg btn-full"
                      disabled={paidAmount < total || createTransaction.isPending}
                      onClick={handleCompleteTransaction}
                    >
                      {createTransaction.isPending ? 'Memproses...' : 'Selesaikan'}
                    </button>
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => setShowPayment(false)}
                    >
                      Kembali
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
