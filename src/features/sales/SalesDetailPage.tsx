import { useState, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Edit2, Trash2, X, Plus, Minus, DollarSign, Tag } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTodayTransactions, useUpdateTransactionWithItems, useDeleteTransaction } from './hooks/useTransactions';
import { useCategories } from '@/features/settings/hooks/useCategories';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency } from '@/utils/format';
import type { Transaction, TransactionItem } from '@/types';

interface EditableItem extends TransactionItem {
  originalQuantity: number;
}

export function SalesDetailPage() {
  const { data: transactions = [], isLoading } = useTodayTransactions();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const updateTransaction = useUpdateTransactionWithItems();
  const deleteTransaction = useDeleteTransaction();
  const { user } = useAuth();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Default shift based on current time
  const [selectedShift, setSelectedShift] = useState<'pagi' | 'siang'>(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Shift Pagi: 00:00-13:00, Shift Siang: 13:01-23:59
    return (currentHour < 13 || (currentHour === 13 && currentMinute === 0)) ? 'pagi' : 'siang';
  });

  // Create product -> category mapping for items without categoryId
  const productCategoryMap = useMemo(() => {
    const map = new Map<string, { categoryId?: string; categoryName?: string }>();
    products.forEach(product => {
      map.set(product.id, {
        categoryId: product.categoryId,
        categoryName: product.categoryName,
      });
    });
    return map;
  }, [products]);

  const openEditForm = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditItems(tx.items.map(item => ({
      ...item,
      originalQuantity: item.quantity,
    })));
    setPaymentMethod(tx.paymentMethod);
    setAmountPaid(tx.amountPaid);
  };

  const closeEditForm = () => {
    setEditingTransaction(null);
    setEditItems([]);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.price,
      };
    }));
  };

  const setItemQuantity = (index: number, quantity: number) => {
    const newQty = Math.max(0, quantity);
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.price,
      };
    }));
  };

  const editTotal = useMemo(() => {
    return editItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [editItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    // Filter out items with 0 quantity
    const validItems = editItems.filter(item => item.quantity > 0);
    
    if (validItems.length === 0) {
      return; // Don't allow empty transactions
    }

    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        originalItems: editingTransaction.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        newItems: validItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          buyPrice: item.buyPrice || 0,
          subtotal: item.subtotal,
        })),
        paymentMethod,
        amountPaid,
        userId: user?.id,
        userName: user?.name,
      });
      closeEditForm();
    } catch (error) {
      console.error('Update transaction error:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    const itemsSummary = deleteConfirm.items.map(item => `${item.productName} x${item.quantity}`).join(', ');
    
    await deleteTransaction.mutateAsync({
      id: deleteConfirm.id,
      items: deleteConfirm.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      transactionName: `Transaksi ${itemsSummary}`,
      userId: user?.id,
      userName: user?.name,
    });
    setDeleteConfirm(null);
  };

  // Calculate shift-based summary (Shift 1: 00:00-13:00, Shift 2: 13:01-23:59)
  const shiftSummary = useMemo(() => {
    const now = new Date();
    
    const shiftStart = new Date(now);
    const shiftEnd = new Date(now);
    
    if (selectedShift === 'pagi') {
      shiftStart.setHours(0, 0, 0, 0);
      shiftEnd.setHours(13, 0, 59, 999); // End of 13:00
    } else {
      shiftStart.setHours(13, 1, 0, 0);
      shiftEnd.setHours(23, 59, 59, 999); // End of day
    }
    
    // Filter transactions for selected shift (within start and end bounds)
    const shiftTransactions = transactions.filter(tx => {
      const txTime = tx.createdAt;
      return txTime >= shiftStart && txTime <= shiftEnd;
    });
    
    // Calculate total for selected shift
    const shiftTotal = shiftTransactions.reduce((sum, tx) => sum + tx.total, 0);
    
    return {
      todayTotal: shiftTotal,
      transactionCount: shiftTransactions.length,
      shiftLabel: selectedShift === 'pagi' ? 'Shift Pagi (00:00-13:00)' : 'Shift Siang (13:01-23:59)',
      shiftTransactions,
    };
  }, [transactions, selectedShift]);

  const { todayTotal, transactionCount: shiftTransactionCount, shiftLabel, shiftTransactions } = shiftSummary;

  // Recalculate filtered totals and filtered transactions based on shift transactions
  const { 
    filteredTotal: shiftFilteredTotal, 
    filteredTransactionCount: shiftFilteredTransactionCount, 
    filteredItemCount: shiftFilteredItemCount,
    filteredTransactions 
  } = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        filteredTotal: todayTotal,
        filteredTransactionCount: shiftTransactions.length,
        filteredItemCount: shiftTransactions.reduce((sum, tx) => sum + tx.items.length, 0),
        filteredTransactions: shiftTransactions,
      };
    }

    let total = 0;
    let itemCount = 0;
    const transactionsWithCategory: Transaction[] = [];

    shiftTransactions.forEach(tx => {
      let hasMatchingItem = false;
      tx.items.forEach(item => {
        // Get categoryId from item or from product mapping
        const categoryId = item.categoryId || productCategoryMap.get(item.productId)?.categoryId;
        
        if (categoryId === selectedCategory) {
          total += item.subtotal;
          itemCount++;
          hasMatchingItem = true;
        }
      });
      
      if (hasMatchingItem) {
        transactionsWithCategory.push(tx);
      }
    });

    return {
      filteredTotal: total,
      filteredTransactionCount: transactionsWithCategory.length,
      filteredItemCount: itemCount,
      filteredTransactions: transactionsWithCategory,
    };
  }, [shiftTransactions, selectedCategory, productCategoryMap, todayTotal]);

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">
          {(getValue() as Date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-xs">
          {row.original.items.map((item, i) => (
            <span key={i} className="text-sm">
              {item.productName} x{item.quantity}
              {i < row.original.items.length - 1 && ', '}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Metode Bayar',
      cell: ({ getValue }) => {
        const method = getValue() as string;
        return (
          <span className={`badge ${
            method === 'cash' ? 'badge-success' :
            method === 'transfer' ? 'badge-primary' :
            'badge-warning'
          }`}>
            {method === 'cash' ? 'Tunai' :
             method === 'transfer' ? 'Transfer' : 'QRIS'}
          </span>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="text-right block font-semibold">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: 'Bayar',
      cell: ({ getValue }) => (
        <span className="text-right block">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'change',
      header: 'Kembalian',
      cell: ({ getValue }) => (
        <span className="text-right block text-success-600">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Edit"
            onClick={() => openEditForm(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm text-danger-500"
            title="Hapus"
            onClick={() => setDeleteConfirm(row.original)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <MainLayout title="Detail Transaksi">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/sales" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="page-title">Transaksi Hari Ini</h2>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Shift Filter */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-sm text-text-secondary font-medium min-w-fit">📊 {shiftLabel}</span>
        <select
          className="form-select form-select-sm py-1 px-2 text-sm w-32"
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value as 'pagi' | 'siang')}
        >
          <option value="pagi">Shift Pagi</option>
          <option value="siang">Shift Siang</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Total All Categories */}
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(todayTotal)}</div>
          <div className="stats-card-label">Total Semua Kategori ({shiftTransactionCount} Transaksi)</div>
        </div>

        {/* Filtered by Category */}
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="stats-card-icon warning">
                <Tag size={24} />
              </div>
              <div className="flex-1">
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-2xl font-bold text-warning-600">{formatCurrency(shiftFilteredTotal)}</div>
            <div className="text-sm text-gray-500">
              {selectedCategory === 'all' 
                ? `${shiftTransactionCount} Transaksi` 
                : `${shiftFilteredItemCount} Item dari ${shiftFilteredTransactionCount} Transaksi`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        <DataTable
          data={filteredTransactions}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={selectedCategory === 'all' ? "Belum ada transaksi hari ini" : "Tidak ada transaksi dengan kategori ini"}
          emptyIcon={<ShoppingCart size={28} />}
        />
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="modal-overlay">
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Transaksi</h3>
              <button className="modal-close" onClick={closeEditForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Editable Items */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Items:</div>
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        item.quantity === 0 ? 'bg-red-50 opacity-60' : 'bg-gray-50'
                      }`}>
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">@ {formatCurrency(item.price)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => updateItemQuantity(index, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            className="form-input w-16 text-center py-1"
                            value={item.quantity}
                            onChange={(e) => setItemQuantity(index, parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => updateItemQuantity(index, 1)}
                          >
                            <Plus size={14} />
                          </button>
                          <div className="w-24 text-right font-semibold">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {editItems.some(item => item.quantity !== item.originalQuantity) && (
                    <div className="mt-2 text-xs text-warning-600">
                      * Perubahan jumlah akan menyesuaikan stok produk
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(editTotal)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-group">
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

                {/* Amount Paid */}
                <div className="form-group">
                  <label className="form-label">Jumlah Bayar</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    min="0"
                  />
                </div>

                {/* Change */}
                <div className="bg-success-50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kembalian</span>
                    <span className={`font-semibold ${amountPaid >= editTotal ? 'text-success-600' : 'text-danger-600'}`}>
                      {formatCurrency(Math.max(0, amountPaid - editTotal))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeEditForm}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updateTransaction.isPending || editItems.every(item => item.quantity === 0)}
                >
                  {updateTransaction.isPending ? 'Menyimpan...' : 'Update Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi ini? Stok produk akan dikembalikan. Transaksi: ${deleteConfirm?.items.map(item => `${item.productName} x${item.quantity}`).join(', ') || ''}`}
        confirmLabel="Ya, Hapus"
        isLoading={deleteTransaction.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </MainLayout>
  );
}
