import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, ChevronUp, ChevronDown, ClipboardList } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { MainLayout } from '@/components/layout';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCreateTransaction } from './hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Product, CartItem } from '@/types';

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
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
        {/* Product Selection */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="card mb-3 min-h-16 p-3">
            <div className="flex items-center gap-3">
              <div className="form-input-wrapper flex-1">
                <Search className="form-input-icon" size={20} />
                <input
                  type="text"
                  className="form-input form-input-md"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link
                to="/sales/today"
                className="btn btn-secondary"
                title="Lihat transaksi hari ini"
              >
                <ClipboardList size={18} />
                <span className="hidden sm:inline">Riwayat</span>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <ShoppingCart size={28} />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 p-3 text-left hover:border-primary-400 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <div className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{product.name}</div>
                  <div className="text-primary-600 font-bold text-sm mb-1">{formatCurrency(product.price)}</div>
                  <div className="text-xs text-gray-400">Stok: {product.stock}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Cart Toggle Button */}
        {cart.length > 0 && (
          <button 
            className="fixed bottom-4 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center lg:hidden z-[100]"
            onClick={() => setCartExpanded(!cartExpanded)}
          >
            <ShoppingCart size={24} />
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}

        {/* Cart */}
        <div className={`
          fixed lg:static bottom-0 left-0 right-0 lg:w-96 bg-white lg:rounded-lg shadow-lg lg:shadow-sm
          transition-transform duration-300 z-[90] lg:z-auto flex flex-col max-h-[45vh] md:max-h-[50vh] lg:max-h-[70vh] lg:max-h-none lg:h-full
          ${cartExpanded ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}>
          <div className="card h-full flex flex-col">
            <div 
              className="card-header cursor-pointer"
              onClick={() => setCartExpanded(!cartExpanded)}
            >
              <h3 className="card-title flex items-center gap-2">
                <ShoppingCart size={18} />
                <span>Keranjang ({cartCount})</span>
                {cartExpanded ? <ChevronDown size={16} className="lg:hidden" /> : <ChevronUp size={16} className="lg:hidden" />}
              </h3>
              {cart.length > 0 && (
                <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="empty-state py-6">
                  <div className="empty-state-icon w-12 h-12">
                    <ShoppingCart size={20} />
                  </div>
                  <div className="empty-state-title text-sm">Keranjang Kosong</div>
                  <p className="empty-state-description text-xs">Tap produk untuk menambahkan</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{item.product.name}</div>
                        <div className="text-xs text-gray-400">{formatCurrency(item.product.price)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm text-danger-500"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="font-bold text-primary-600 text-sm min-w-16 text-right">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
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
                  <div className="flex flex-col gap-2">
                    <div className="form-group mb-0">
                      <label className="form-label text-sm">Metode Pembayaran</label>
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
                    <div className="form-group mb-0">
                      <label className="form-label text-sm">Jumlah Dibayar</label>
                      <input
                        type="text"
                        className="form-input"
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
                      <div className="flex justify-between items-center p-2 bg-success-50 rounded-lg">
                        <span className="text-sm">Kembalian</span>
                        <span className="font-bold text-success-600">{formatCurrency(change)}</span>
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
