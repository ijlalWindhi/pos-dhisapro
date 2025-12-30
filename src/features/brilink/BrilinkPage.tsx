import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Wallet, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Smartphone, CreditCard, X, Edit2, Home, Flame, Save, Search, ClipboardList } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { useTodayBrilinkTransactions, useCreateBrilinkTransaction, useUpdateBrilinkTransaction, useSavedBrilinkAccounts } from './hooks/useBrilink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatNumber, parseNumber, formatCurrency } from '@/utils/format';
import type { BRILinkTransactionType, BRILinkFormData, BRILinkTransaction, BRILinkProfitCategory, SavedBRILinkAccount } from '@/types';

const transactionTypes: { value: BRILinkTransactionType; label: string; icon: typeof Wallet; profitCategory: BRILinkProfitCategory }[] = [
  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft, profitCategory: 'brilink' },
  { value: 'cash_deposit', label: 'Setor Tunai', icon: ArrowDownToLine, profitCategory: 'brilink' },
  { value: 'cash_withdrawal', label: 'Tarik Tunai', icon: ArrowUpFromLine, profitCategory: 'brilink' },
  { value: 'payment', label: 'Pembayaran', icon: CreditCard, profitCategory: 'brilink' },
  { value: 'topup', label: 'Top Up', icon: Smartphone, profitCategory: 'brilink' },
  { value: 'griya_bayar', label: 'Griya Bayar', icon: Home, profitCategory: 'griya_bayar' },
  { value: 'propana', label: 'Propana', icon: Flame, profitCategory: 'propana' },
];

const profitCategoryLabels: Record<BRILinkProfitCategory, string> = {
  brilink: 'BRILink',
  griya_bayar: 'Griya Bayar',
  propana: 'Propana',
};

// Searchable Account Select Component
function SearchableAccountSelect({
  savedAccounts,
  selectedAccount,
  onSelect,
}: {
  savedAccounts: SavedBRILinkAccount[];
  selectedAccount: string;
  onSelect: (accountNumber: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter accounts based on search term
  const filteredAccounts = savedAccounts.filter(
    (acc) =>
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected account display name
  const selectedAccountData = savedAccounts.find((acc) => acc.accountNumber === selectedAccount);
  const displayValue = selectedAccountData
    ? `${selectedAccountData.accountName} - ${selectedAccountData.accountNumber}`
    : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (accountNumber: string) => {
    onSelect(accountNumber);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
  };

  return (
    <div className="form-group" ref={containerRef}>
      <label className="form-label">Pilih Rekening Tersimpan</label>
      <div style={{ position: 'relative' }}>
        {/* Selected value or search input */}
        {selectedAccount && !isOpen ? (
          <div
            className="form-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: 'var(--color-gray-50)',
            }}
            onClick={() => setIsOpen(true)}
          >
            <span>{displayValue}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-gray-400)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Cari nama atau nomor rekening..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        )}

        {/* Dropdown list */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-md)',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Manual input option */}
            <div
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-gray-100)',
                color: 'var(--color-gray-500)',
                fontSize: '14px',
              }}
              onClick={() => handleSelect('')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gray-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              -- Input manual --
            </div>

            {filteredAccounts.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: 'var(--color-gray-400)',
                  fontSize: '14px',
                }}
              >
                Tidak ada hasil
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-gray-50)',
                  }}
                  onClick={() => handleSelect(acc.accountNumber)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gray-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 500 }}>{acc.accountName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                    {acc.accountNumber}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyFormData: BRILinkFormData = {
  transactionType: 'transfer',
  profitCategory: 'brilink',
  accountName: '',
  accountNumber: '',
  amount: 0,
  adminFee: 0,
  profit: 0,
  customerName: '',
  saveAccount: false,
};

export function BrilinkPage() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useTodayBrilinkTransactions();
  const { data: savedAccounts = [] } = useSavedBrilinkAccounts();
  const createTransaction = useCreateBrilinkTransaction();
  const updateTransaction = useUpdateBrilinkTransaction();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BRILinkTransaction | null>(null);
  const [formData, setFormData] = useState<BRILinkFormData>(emptyFormData);
  const [selectedSavedAccount, setSelectedSavedAccount] = useState('');

  const resetForm = () => {
    setFormData(emptyFormData);
    setShowForm(false);
    setEditingTransaction(null);
    setSelectedSavedAccount('');
  };

  const openForm = (type?: BRILinkTransactionType) => {
    setEditingTransaction(null);
    const typeInfo = transactionTypes.find(t => t.value === (type || 'transfer'));
    setFormData({ 
      ...emptyFormData, 
      transactionType: type || 'transfer',
      profitCategory: typeInfo?.profitCategory || 'brilink',
    });
    setSelectedSavedAccount('');
    setShowForm(true);
  };

  const openEditForm = (tx: BRILinkTransaction) => {
    setEditingTransaction(tx);
    setFormData({
      transactionType: tx.transactionType,
      profitCategory: tx.profitCategory || 'brilink',
      accountName: tx.accountName || tx.description?.split(' - ')[0] || '',
      accountNumber: tx.accountNumber || tx.description?.split(' - ')[1] || '',
      amount: tx.amount,
      adminFee: tx.adminFee,
      profit: tx.profit,
      endingBalance: tx.endingBalance || 0,
      customerName: tx.customerName || '',
      saveAccount: false,
    });
    setSelectedSavedAccount('');
    setShowForm(true);
  };

  // Update profitCategory when transactionType changes
  useEffect(() => {
    const typeInfo = transactionTypes.find(t => t.value === formData.transactionType);
    if (typeInfo && formData.profitCategory !== typeInfo.profitCategory) {
      setFormData(prev => ({ ...prev, profitCategory: typeInfo.profitCategory }));
    }
  }, [formData.transactionType, formData.profitCategory]);

  // Handle saved account selection
  const handleSavedAccountChange = (accountNumber: string) => {
    setSelectedSavedAccount(accountNumber);
    if (accountNumber) {
      const account = savedAccounts.find(a => a.accountNumber === accountNumber);
      if (account) {
        setFormData(prev => ({
          ...prev,
          accountName: account.accountName,
          accountNumber: account.accountNumber,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          data: formData,
          userId: user.id,
          userName: user.name,
        });
      } else {
        await createTransaction.mutateAsync({
          data: formData,
          operatorId: user.id,
          operatorName: user.name,
        });
      }
      resetForm();
    } catch (error) {
      console.error('BRILink transaction error:', error);
    }
  };

  // Calculate shift-based summary (Shift 1: 00:00-13:00, Shift 2: 13:01-23:59)
  const shiftSummary = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Determine current shift start time
    // Shift 1: 00:00-13:00 (inclusive of 13:00)
    // Shift 2: 13:01-23:59
    const isShift1 = currentHour < 13 || (currentHour === 13 && currentMinute === 0);
    
    const shiftStart = new Date(now);
    const shiftEnd = new Date(now);
    
    if (isShift1) {
      shiftStart.setHours(0, 0, 0, 0);
      shiftEnd.setHours(13, 0, 59, 999); // End of 13:00
    } else {
      shiftStart.setHours(13, 1, 0, 0);
      shiftEnd.setHours(23, 59, 59, 999); // End of day
    }
    
    // Filter transactions for current shift (within start and end bounds)
    const shiftTransactions = transactions.filter(tx => {
      const txTime = tx.createdAt;
      return txTime >= shiftStart && txTime <= shiftEnd;
    });
    
    // Calculate profits for current shift
    const brilinkProfit = shiftTransactions
      .filter(tx => tx.profitCategory === 'brilink' || !tx.profitCategory)
      .reduce((sum, tx) => sum + tx.profit, 0);
    
    const griyaBayarProfit = shiftTransactions
      .filter(tx => tx.profitCategory === 'griya_bayar')
      .reduce((sum, tx) => sum + tx.profit, 0);
    
    const propanaProfit = shiftTransactions
      .filter(tx => tx.profitCategory === 'propana')
      .reduce((sum, tx) => sum + tx.profit, 0);
    
    return {
      brilinkProfit,
      griyaBayarProfit,
      propanaProfit,
      totalTransactions: shiftTransactions.length,
      shiftLabel: isShift1 ? 'Shift Pagi (00:00-13:00)' : 'Shift Siang (13:01-23:59)',
    };
  }, [transactions]);

  const { brilinkProfit, griyaBayarProfit, propanaProfit, totalTransactions: todayCount, shiftLabel } = shiftSummary;
  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;
  const isPropana = formData.transactionType === 'propana';
  const isGriyaBayar = formData.transactionType === 'griya_bayar';
  const requiresEndingBalance = ['transfer', 'cash_deposit', 'cash_withdrawal', 'payment', 'topup'].includes(formData.transactionType);

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<BRILinkTransaction>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ row }) => row.original.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      accessorKey: 'transactionType',
      header: 'Tipe',
      cell: ({ row }) => {
        const typeInfo = transactionTypes.find((t) => t.value === row.original.transactionType);
        return (
          <span className="badge badge-warning">{typeInfo?.label || row.original.transactionType}</span>
        );
      },
    },
    {
      accessorKey: 'profitCategory',
      header: 'Kategori',
      cell: ({ row }) => {
        const category = row.original.profitCategory;
        return (
          <span className={`badge ${
            category === 'griya_bayar' ? 'badge-success' :
            category === 'propana' ? 'badge-danger' :
            'badge-primary'
          }`}>
            {profitCategoryLabels[category] || 'BRILink'}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'No Rek / Nama',
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: ({ row }) => (
        <span className="text-right block">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: 'endingBalance',
      header: 'Saldo Akhir',
      cell: ({ row }) => (
        <span className="text-right block">
          {row.original.endingBalance != null ? formatCurrency(row.original.endingBalance) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'profit',
      header: 'Profit',
      cell: ({ row }) => (
        <span className="text-right block font-semibold text-success-600">
          +{formatCurrency(row.original.profit)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex justify-center">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Edit"
            onClick={() => openEditForm(row.original)}
          >
            <Edit2 size={16} />
          </button>
        </div>
      ),
    },
  ], [openEditForm]);

  return (
    <MainLayout title="BRILink">
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaksi BRILink</h2>
          <p className="page-subtitle">Catat transaksi BRILink, Griya Bayar & Propana</p>
        </div>
        <div className="flex gap-2">
          <Link to="/brilink/history" className="btn btn-secondary">
            <ClipboardList size={18} />
            <span>Riwayat</span>
          </Link>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={18} />
            <span>Input Transaksi</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-2 text-sm text-text-secondary font-medium">
        📊 {shiftLabel}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(brilinkProfit)}</div>
          <div className="stats-card-label">Profit BRILink</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <Home size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(griyaBayarProfit)}</div>
          <div className="stats-card-label">Profit Griya Bayar</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon danger">
            <Flame size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(propanaProfit)}</div>
          <div className="stats-card-label">Profit Propana</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon primary">
            <ArrowRightLeft size={24} />
          </div>
          <div className="stats-card-value">{todayCount}</div>
          <div className="stats-card-label">Total Transaksi</div>
        </div>
      </div>

      {/* Transaction Types (Quick Add) */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Tambah Cepat</h3>
        </div>
        <div className="card-body">
          <div className="flex gap-2 flex-wrap">
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                className="btn btn-secondary flex-1 min-w-[100px]"
                onClick={() => openForm(type.value)}
              >
                <type.icon size={18} />
                <span className='text-xs'>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Riwayat Transaksi Hari Ini</h3>
        </div>
        <DataTable
          data={transactions}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Belum ada transaksi"
          emptyIcon={<Wallet size={28} />}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTransaction ? 'Edit Transaksi' : 'Input Transaksi'}
              </h3>
              <button className="modal-close" onClick={resetForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">Tipe Transaksi</label>
                  <select
                    className="form-select"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as BRILinkTransactionType })}
                  >
                    {transactionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Saved Accounts (only for non-Propana) */}
                {!isPropana && savedAccounts.length > 0 && !editingTransaction && (
                  <SearchableAccountSelect
                    savedAccounts={savedAccounts}
                    selectedAccount={selectedSavedAccount}
                    onSelect={handleSavedAccountChange}
                  />
                )}

                {/* Propana Fields */}
                {isPropana ? (
                  <>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label form-label-required">No. Telepon</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="08xxxxxxxxxx"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nama Pelanggan (Opsional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nama pelanggan"
                          value={formData.customerName || ''}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label form-label-required">Nominal</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.amount)}
                          onChange={(e) => setFormData({ ...formData, amount: parseNumber(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Profit</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.profit)}
                          onChange={(e) => setFormData({ ...formData, profit: parseNumber(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Saldo Akhir</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="0"
                        inputMode="numeric"
                        value={formatNumber(formData.endingBalance || 0)}
                        onChange={(e) => setFormData({ ...formData, endingBalance: parseNumber(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard BRILink / Griya Bayar Fields */}
                    <div className="grid grid-3">
                      <div className="form-group">
                        <label className="form-label form-label-required">No Rekening</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: 1234567890"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Nama Rekening</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: John Doe"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Nominal</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.amount)}
                          onChange={(e) => setFormData({ ...formData, amount: parseNumber(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-3">
                      <div className="form-group">
                        <label className="form-label">Biaya Admin (Opsional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.adminFee)}
                          onChange={(e) => setFormData({ ...formData, adminFee: parseNumber(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label className={`form-label ${!isGriyaBayar ? 'form-label-required' : ''}`}>
                          Profit {isGriyaBayar && '(Opsional)'}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.profit)}
                          onChange={(e) => setFormData({ ...formData, profit: parseNumber(e.target.value) })}
                          required={!isGriyaBayar}
                        />
                      </div>
                      <div className="form-group">
                        <label className={`form-label ${requiresEndingBalance ? 'form-label-required' : ''}`}>Saldo Akhir</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.endingBalance || 0)}
                          onChange={(e) => setFormData({ ...formData, endingBalance: parseNumber(e.target.value) })}
                          required={requiresEndingBalance}
                        />
                      </div>
                    </div>

                    {/* Save Account Option */}
                    {!editingTransaction && (
                      <div className="form-group">
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.saveAccount || false}
                            onChange={(e) => setFormData({ ...formData, saveAccount: e.target.checked })}
                          />
                          <Save size={16} className="mr-1" />
                          <span>Simpan no rekening untuk transaksi berikutnya</span>
                        </label>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Nama Pelanggan (Opsional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nama pelanggan"
                        value={formData.customerName || ''}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : (editingTransaction ? 'Update Transaksi' : 'Simpan Transaksi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
