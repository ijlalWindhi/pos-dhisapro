import { useState, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Edit2, Trash2, X, Plus, Minus, DollarSign, Tag, Printer } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTodayTransactions, useUpdateTransactionWithItems, useDeleteTransaction } from './hooks/useTransactions';
import { useTodayBrilinkTransactions } from '@/features/brilink/hooks/useBrilink';
import { useCategories } from '@/features/settings/hooks/useCategories';
import { useCombinedCategories } from '@/features/settings/hooks/useCombinedCategories';
import { useUsers } from '@/features/settings/hooks/useUsers';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency } from '@/utils/format';
import type { Transaction, TransactionItem } from '@/types';

type ShiftKey = 'pagi' | 'siang';

interface EditableItem extends TransactionItem {
  originalQuantity: number;
}

interface ShiftPrintRow {
  label: string;
  amount: number;
}

const getDefaultShift = (): ShiftKey => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  return (currentHour < 13 || (currentHour === 13 && currentMinute <= 30)) ? 'pagi' : 'siang';
};

const getShiftRange = (shift: ShiftKey, baseDate = new Date()) => {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  if (shift === 'pagi') {
    start.setHours(0, 0, 0, 0);
    end.setHours(13, 30, 59, 999);
  } else {
    start.setHours(13, 31, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

const getShiftName = (shift: ShiftKey) => shift === 'pagi' ? 'Pagi' : 'Siang';

const getShiftLabel = (shift: ShiftKey) => (
  shift === 'pagi' ? 'Shift Pagi (00:00-13:30)' : 'Shift Siang (13:31-23:59)'
);

const formatReceiptDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatPrintAmount = (amount: number) => (
  `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`
);

const normalizeCategoryName = (name: string) => name.trim().toLocaleLowerCase('id-ID');

export function SalesDetailPage() {
  const { data: transactions = [], isLoading } = useTodayTransactions();
  const { data: brilinkTransactions = [], isLoading: loadingBrilink } = useTodayBrilinkTransactions();
  const { data: categories = [] } = useCategories();
  const { data: combinedCategories = [] } = useCombinedCategories();
  const { data: users = [], isLoading: loadingUsers } = useUsers();
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
  const [isShiftPrintModalOpen, setIsShiftPrintModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Default shift based on current time
  const [selectedShift, setSelectedShift] = useState<ShiftKey>(getDefaultShift);

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

  const categoryKeyByName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(category => {
      map.set(normalizeCategoryName(category.name), `id:${category.id}`);
    });
    return map;
  }, [categories]);

  const activeUsers = useMemo(() => {
    const active = users.filter(userItem => userItem.isActive);
    return active.length > 0 ? active : users;
  }, [users]);

  const selectedPrintUserNames = useMemo(() => {
    const userMap = new Map(users.map(userItem => [userItem.id, userItem.name]));
    return selectedUserIds
      .map(id => userMap.get(id))
      .filter((name): name is string => !!name);
  }, [selectedUserIds, users]);

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

  // Calculate shift-based summary (Shift 1: 00:00-13:30, Shift 2: 13:31-23:59)
  const shiftSummary = useMemo(() => {
    const { start: shiftStart, end: shiftEnd } = getShiftRange(selectedShift);
    
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
      shiftLabel: getShiftLabel(selectedShift),
      shiftTransactions,
      shiftStart,
      shiftEnd,
    };
  }, [transactions, selectedShift]);

  const { todayTotal, transactionCount: shiftTransactionCount, shiftLabel, shiftTransactions, shiftStart, shiftEnd } = shiftSummary;

  const shiftBrilinkTransactions = useMemo(() =>
    brilinkTransactions.filter(tx => tx.createdAt >= shiftStart && tx.createdAt <= shiftEnd),
    [brilinkTransactions, shiftStart, shiftEnd]
  );

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

  const shiftPrintSummary = useMemo(() => {
    const categoryRowsByKey = new Map<string, ShiftPrintRow & { order: number }>();

    categories.forEach((category, index) => {
      categoryRowsByKey.set(`id:${category.id}`, {
        label: category.name,
        amount: 0,
        order: index,
      });
    });

    let dynamicOrder = categories.length;

    shiftTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const mappedCategory = productCategoryMap.get(item.productId);
        const categoryId = item.categoryId || mappedCategory?.categoryId;
        const categoryName = item.categoryName || mappedCategory?.categoryName || 'Tanpa Kategori';
        const normalizedName = normalizeCategoryName(categoryName);
        const knownKeyByName = categoryKeyByName.get(normalizedName);
        const categoryKey = categoryId && categoryRowsByKey.has(`id:${categoryId}`)
          ? `id:${categoryId}`
          : knownKeyByName || (categoryId ? `id:${categoryId}` : `name:${normalizedName || 'tanpa-kategori'}`);

        const existingRow = categoryRowsByKey.get(categoryKey);
        if (existingRow) {
          existingRow.amount += item.subtotal;
          return;
        }

        categoryRowsByKey.set(categoryKey, {
          label: categoryName,
          amount: item.subtotal,
          order: dynamicOrder,
        });
        dynamicOrder += 1;
      });
    });

    const productRows = Array.from(categoryRowsByKey.values())
      .filter(row => row.label.toLowerCase() !== 'materai')
      .sort((a, b) => a.order - b.order)
      .map(({ label, amount }) => ({ label, amount }));

    // Merge rows that belong to a combined category
    // Build a map: categoryId -> combinedCategory name
    const categoryIdToCombinedName = new Map<string, string>();
    combinedCategories.forEach(cc => {
      cc.categoryIds.forEach(catId => {
        categoryIdToCombinedName.set(catId, cc.name);
      });
    });

    // Build a set of category names that belong to any combined category
    const combinedCategoryNames = new Map<string, Set<string>>();
    combinedCategories.forEach(cc => {
      const nameSet = new Set<string>();
      cc.categoryIds.forEach(catId => {
        const cat = categories.find(c => c.id === catId);
        if (cat) nameSet.add(cat.name);
      });
      combinedCategoryNames.set(cc.name, nameSet);
    });

    // Merge product rows
    const mergedRowMap = new Map<string, ShiftPrintRow>();
    const mergedOrder: string[] = [];

    productRows.forEach(row => {
      // Check if this row's label matches a category that's part of a combined category
      let mergedInto: string | null = null;
      for (const [combinedName, memberNames] of combinedCategoryNames) {
        if (memberNames.has(row.label)) {
          mergedInto = combinedName;
          break;
        }
      }

      if (mergedInto) {
        const existing = mergedRowMap.get(mergedInto);
        if (existing) {
          existing.amount += row.amount;
        } else {
          mergedRowMap.set(mergedInto, { label: mergedInto, amount: row.amount });
          mergedOrder.push(mergedInto);
        }
      } else {
        // Not part of any combined category, keep as-is
        const key = `__standalone__${row.label}`;
        mergedRowMap.set(key, row);
        mergedOrder.push(key);
      }
    });

    const finalProductRows = mergedOrder.map(key => mergedRowMap.get(key)!);

    const adminProfit = shiftBrilinkTransactions
      .filter(tx => tx.profitCategory === 'brilink' || !tx.profitCategory)
      .reduce((sum, tx) => sum + tx.profit, 0);

    const griyaBayarProfit = shiftBrilinkTransactions
      .filter(tx => tx.profitCategory === 'griya_bayar')
      .reduce((sum, tx) => sum + tx.profit, 0);

    const propanaProfit = shiftBrilinkTransactions
      .filter(tx => tx.profitCategory === 'propana')
      .reduce((sum, tx) => sum + tx.profit, 0);

    const rows: ShiftPrintRow[] = [
      { label: 'Admin', amount: adminProfit },
      { label: 'Laba Listrik', amount: griyaBayarProfit },
      { label: 'Propana', amount: propanaProfit },
      ...finalProductRows,
    ];

    return {
      rows,
      total: rows.reduce((sum, row) => sum + row.amount, 0),
    };
  }, [categories, categoryKeyByName, combinedCategories, productCategoryMap, shiftBrilinkTransactions, shiftTransactions]);

  const openShiftPrintModal = () => {
    setSelectedUserIds(prev => {
      const selectableIds = new Set(activeUsers.map(userItem => userItem.id));
      const validPreviousSelection = prev.filter(id => selectableIds.has(id));

      if (validPreviousSelection.length > 0) {
        return validPreviousSelection;
      }

      if (user && selectableIds.has(user.id)) {
        return [user.id];
      }

      return [];
    });
    setIsShiftPrintModalOpen(true);
  };

  const togglePrintUser = (userId: string) => {
    setSelectedUserIds(prev => (
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    ));
  };

  const handlePrintShiftCalculation = () => {
    if (selectedUserIds.length === 0) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  const isPrintDataLoading = isLoading || loadingBrilink || loadingUsers;

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
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary font-medium min-w-fit">📊 {shiftLabel}</span>
        <select
          className="form-select form-select-sm py-1 px-2 text-sm w-32"
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value as ShiftKey)}
        >
          <option value="pagi">Shift Pagi</option>
          <option value="siang">Shift Siang</option>
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openShiftPrintModal}
          disabled={isPrintDataLoading}
        >
          <Printer size={16} />
          <span>Cetak Hitungan Shift</span>
        </button>
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

      {/* Shift Print Modal */}
      {isShiftPrintModalOpen && (
        <div className="modal-overlay" onClick={() => setIsShiftPrintModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cetak Hitungan Shift</h3>
              <button className="modal-close" onClick={() => setIsShiftPrintModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <div className="form-label">Nama Pegawai</div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                  {activeUsers.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-400">
                      Belum ada pengguna
                    </div>
                  ) : (
                    activeUsers.map(userItem => (
                      <label
                        key={userItem.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary-600"
                          checked={selectedUserIds.includes(userItem.id)}
                          onChange={() => togglePrintUser(userItem.id)}
                          disabled={loadingUsers}
                        />
                        <span>{userItem.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Shift</span>
                  <span className="font-semibold">{getShiftName(selectedShift)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold">{formatCurrency(shiftPrintSummary.total)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-500">Pegawai</span>
                  <span className="text-right font-semibold">
                    {selectedPrintUserNames.length > 0 ? selectedPrintUserNames.join(', ') : '-'}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsShiftPrintModalOpen(false)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintShiftCalculation}
                disabled={selectedUserIds.length === 0 || isPrintDataLoading}
              >
                <Printer size={18} />
                <span>Cetak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shift-print-area">
        <section className="shift-print-sheet">
          <h1 className="shift-print-title">UD. Cahaya</h1>
          <div className="shift-print-meta">
            <div className="shift-print-meta-row">
              <span>Tanggal</span>
              <span>:</span>
              <span>{formatReceiptDate(new Date())}</span>
            </div>
            <div className="shift-print-meta-row">
              <span>Shift</span>
              <span>:</span>
              <span>{getShiftName(selectedShift)}</span>
            </div>
            <div className="shift-print-meta-row shift-print-employee-row">
              <span>Nama Pegawai</span>
              <span>:</span>
              <span>{selectedPrintUserNames.length > 0 ? selectedPrintUserNames.join(', ') : '-'}</span>
            </div>
          </div>
          <table className="shift-print-table">
            <thead>
              <tr>
                <th className="shift-print-label">Jenis</th>
                <th className="shift-print-amount text-right!">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {shiftPrintSummary.rows.map(row => (
                <tr key={row.label}>
                  <td className="shift-print-label">{row.label}</td>
                  <td className="shift-print-amount">{formatPrintAmount(row.amount)}</td>
                </tr>
              ))}
              <tr className="shift-print-total-row">
                <td className="shift-print-label">Total</td>
                <td className="shift-print-amount">{formatPrintAmount(shiftPrintSummary.total)}</td>
              </tr>
              <tr>
                <td className="shift-print-label">Selisih</td>
                <td className="shift-print-amount">&nbsp;</td>
              </tr>
              <tr>
                <td className="shift-print-label">Uang Ada</td>
                <td className="shift-print-amount">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </section>
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
