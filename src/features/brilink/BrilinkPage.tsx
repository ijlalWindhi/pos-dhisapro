import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Wallet, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Smartphone, CreditCard, X, Edit2, Home, Flame, Save, Search, ClipboardList, Database, Printer } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { useTodayBrilinkTransactions, useCreateBrilinkTransaction, useUpdateBrilinkTransaction, useSavedBrilinkAccounts, useBrilinkBanks } from './hooks/useBrilink';
import { SearchableBankSelect } from './components/SearchableBankSelect';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatNumber, parseNumber, formatCurrency } from '@/utils/format';
import type { BRILinkTransactionType, BRILinkFormData, BRILinkTransaction, BRILinkProfitCategory, SavedBRILinkAccount } from '@/types';
import {
  findDuplicateSavedAccount,
  normalizeAccountName,
  normalizeAccountNumber,
  normalizeBankName,
  sanitizeAccountNameInput,
} from './utils/account';

const baseTransactionTypes: { value: BRILinkTransactionType; label: string; icon: typeof Wallet; profitCategory: BRILinkProfitCategory }[] = [
  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft, profitCategory: 'brilink' },
  { value: 'cash_withdrawal', label: 'Tarik Tunai', icon: ArrowUpFromLine, profitCategory: 'brilink' },
  { value: 'topup', label: 'Top Up', icon: Smartphone, profitCategory: 'brilink' },
  { value: 'griya_bayar', label: 'Griya Bayar', icon: Home, profitCategory: 'griya_bayar' },
  { value: 'propana', label: 'Propana', icon: Flame, profitCategory: 'propana' },
];

const legacyTransactionTypes: { value: BRILinkTransactionType; label: string; icon: typeof Wallet; profitCategory: BRILinkProfitCategory }[] = [
  { value: 'cash_deposit', label: 'Setor Tunai', icon: ArrowDownToLine, profitCategory: 'brilink' },
  { value: 'payment', label: 'Pembayaran', icon: CreditCard, profitCategory: 'brilink' },
];

const allTransactionTypes = [...baseTransactionTypes, ...legacyTransactionTypes];

const allowedWithdrawalAccountNames = new Set(['ARISTA TRISNANTARI', 'HARTOYO']);

const toTitleCase = (value: string) =>
  value.replace(/\S+/g, (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`);

const toUpperBank = normalizeBankName;

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
}: Readonly<{
  savedAccounts: SavedBRILinkAccount[];
  selectedAccount: string;
  onSelect: (accountNumber: string) => void;
}>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputId = 'saved-account-search';

  // Filter accounts based on search term
  const filteredAccounts = savedAccounts.filter(
    (acc) =>
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.bankName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected account display name
  const selectedAccountData = savedAccounts.find((acc) => acc.accountNumber === selectedAccount);
  const selectedBankSuffix = selectedAccountData?.bankName
    ? ` (${toUpperBank(selectedAccountData.bankName)})`
    : '';
  const displayValue = selectedAccountData
    ? `${toTitleCase(selectedAccountData.accountName)} - ${selectedAccountData.accountNumber}${selectedBankSuffix}`
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
      <label className="form-label" htmlFor={searchInputId}>Pilih Rekening Tersimpan</label>
      <div style={{ position: 'relative' }}>
        {/* Selected value or search input */}
        {selectedAccount && !isOpen ? (
          <div
            className="form-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-gray-50)',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              style={{
                flex: 1,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span>{displayValue}</span>
            </button>
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
              id={searchInputId}
              type="text"
              className="form-input"
              placeholder="Cari nama, nomor rekening, atau bank..."
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
            <button
              type="button"
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
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
            </button>

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
                <button
                  type="button"
                  key={acc.id}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-gray-50)',
                  }}
                  onClick={() => handleSelect(acc.accountNumber)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gray-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 500 }}>{toTitleCase(acc.accountName)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                    {acc.accountNumber}
                  </div>
                  {acc.bankName && (
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>
                      {toUpperBank(acc.bankName)}
                    </div>
                  )}
                </button>
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
  bankName: '',
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
  const { data: banks = [] } = useBrilinkBanks();
  const createTransaction = useCreateBrilinkTransaction();
  const updateTransaction = useUpdateBrilinkTransaction();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BRILinkTransaction | null>(null);
  const [formData, setFormData] = useState<BRILinkFormData>(emptyFormData);
  const [selectedSavedAccount, setSelectedSavedAccount] = useState('');
  const [printingTransaction, setPrintingTransaction] = useState<BRILinkTransaction | null>(null);

  const formTransactionTypes = useMemo(() => {
    if (!editingTransaction) return baseTransactionTypes;
    const legacyType = legacyTransactionTypes.find((t) => t.value === editingTransaction.transactionType);
    if (!legacyType) return baseTransactionTypes;
    return [...baseTransactionTypes, legacyType];
  }, [editingTransaction]);

  const filteredSavedAccounts = useMemo(() => {
    if (formData.transactionType !== 'cash_withdrawal') return savedAccounts;
    return savedAccounts.filter((acc) =>
      allowedWithdrawalAccountNames.has(acc.accountName.trim().toUpperCase())
    );
  }, [savedAccounts, formData.transactionType]);

  const isAccountSaved = useMemo(() => {
    const accountName = formData.accountName;
    const accountNumber = formData.accountNumber;

    if (!accountName || !accountNumber) return false;
    return !!findDuplicateSavedAccount(savedAccounts, { accountName, accountNumber });
  }, [formData.accountName, formData.accountNumber, savedAccounts]);

  const resetForm = () => {
    setFormData(emptyFormData);
    setShowForm(false);
    setEditingTransaction(null);
    setSelectedSavedAccount('');
  };

  const openForm = (type?: BRILinkTransactionType) => {
    setEditingTransaction(null);
    const typeInfo = allTransactionTypes.find(t => t.value === (type || 'transfer'));
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
    const accountName = tx.accountName || tx.description?.split(' - ')[0] || '';
    setFormData({
      transactionType: tx.transactionType,
      profitCategory: tx.profitCategory || 'brilink',
      accountName: sanitizeAccountNameInput(accountName),
      accountNumber: normalizeAccountNumber(tx.accountNumber || tx.description?.split(' - ')[1] || ''),
      bankName: tx.bankName ? toUpperBank(tx.bankName) : '',
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
    const typeInfo = allTransactionTypes.find(t => t.value === formData.transactionType);
    if (typeInfo && formData.profitCategory !== typeInfo.profitCategory) {
      setFormData(prev => ({ ...prev, profitCategory: typeInfo.profitCategory }));
    }
  }, [formData.transactionType, formData.profitCategory]);

  // Handle saved account selection
  const handleSavedAccountChange = (accountNumber: string) => {
    setSelectedSavedAccount(accountNumber);
    if (!accountNumber) {
      setFormData(prev => ({
        ...prev,
        accountName: '',
        accountNumber: '',
        bankName: '',
      }));
      return;
    }
    const account = savedAccounts.find(a => a.accountNumber === accountNumber);
    if (account) {
      setFormData(prev => ({
        ...prev,
        accountName: sanitizeAccountNameInput(account.accountName),
        accountNumber: normalizeAccountNumber(account.accountNumber),
        bankName: account.bankName ? toUpperBank(account.bankName) : '',
        saveAccount: false,
      }));
    }
  };

  useEffect(() => {
    if (isAccountSaved && formData.saveAccount) {
      setFormData(prev => ({ ...prev, saveAccount: false }));
    }
  }, [isAccountSaved, formData.saveAccount]);

  useEffect(() => {
    if (formData.transactionType !== 'cash_withdrawal' || !selectedSavedAccount) return;
    const selectedAccount = savedAccounts.find((acc) => acc.accountNumber === selectedSavedAccount);
    if (!selectedAccount) return;
    if (!allowedWithdrawalAccountNames.has(selectedAccount.accountName.trim().toUpperCase())) {
      setSelectedSavedAccount('');
      setFormData(prev => ({ ...prev, accountName: '', accountNumber: '', bankName: '' }));
    }
  }, [formData.transactionType, selectedSavedAccount, savedAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave: BRILinkFormData = {
        ...formData,
        accountName: normalizeAccountName(formData.accountName),
        accountNumber: normalizeAccountNumber(formData.accountNumber),
        bankName: normalizeBankName(formData.bankName),
        saveAccount: isAccountSaved ? false : formData.saveAccount,
      };

      if (editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          data: dataToSave,
          userId: user.id,
          userName: user.name,
        });
      } else {
        await createTransaction.mutateAsync({
          data: dataToSave,
          operatorId: user.id,
          operatorName: user.name,
        });
      }
      resetForm();
    } catch (error) {
      console.error('BRILink transaction error:', error);
    }
  };

  // Calculate shift-based summary (Shift 1: 00:00-13:30, Shift 2: 13:31-23:59)
  const shiftSummary = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Determine current shift start time
    // Shift 1: 00:00-13:30 (inclusive of 13:30)
    // Shift 2: 13:31-23:59
    const isShift1 = currentHour < 13 || (currentHour === 13 && currentMinute <= 30);
    
    const shiftStart = new Date(now);
    const shiftEnd = new Date(now);
    
    if (isShift1) {
      shiftStart.setHours(0, 0, 0, 0);
      shiftEnd.setHours(13, 30, 59, 999); // End of 13:30
    } else {
      shiftStart.setHours(13, 31, 0, 0);
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
      shiftLabel: isShift1 ? 'Shift Pagi (00:00-13:30)' : 'Shift Siang (13:31-23:59)',
    };
  }, [transactions]);

  const { brilinkProfit, griyaBayarProfit, propanaProfit, totalTransactions: todayCount, shiftLabel } = shiftSummary;
  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;
  const isPropana = formData.transactionType === 'propana';
  const isGriyaBayar = formData.transactionType === 'griya_bayar';
  const requiresEndingBalance = ['transfer', 'cash_withdrawal', 'topup'].includes(formData.transactionType);

  const handlePrintReceipt = (tx: BRILinkTransaction) => {
    setPrintingTransaction(tx);
    const styleEl = document.createElement('style');
    styleEl.id = 'brilink-thermal-print-style';
    styleEl.textContent = `
      @media print {
        @page {
          size: 58mm auto !important;
          margin: 0 !important;
        }
        html, body {
          width: 58mm !important;
          min-height: 0 !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        body > #root {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        const cleanup = () => {
          const el = document.getElementById('brilink-thermal-print-style');
          if (el) el.remove();
          setPrintingTransaction(null);
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(cleanup, 2000);
      });
    });
  };

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
        const typeInfo = allTransactionTypes.find((t) => t.value === row.original.transactionType);
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
      header: 'Nama / No Rek',
    },
    {
      accessorKey: 'bankName',
      header: 'Bank',
      cell: ({ row }) => row.original.bankName ? toUpperBank(row.original.bankName) : '-',
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
        <div className="flex items-center justify-center gap-1">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Edit"
            onClick={() => openEditForm(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Cetak Struk"
            onClick={() => handlePrintReceipt(row.original)}
          >
            <Printer size={16} />
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
          <Link to="/brilink/data" className="btn btn-secondary">
            <Database size={18} />
            <span>Data</span>
          </Link>
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
            {baseTransactionTypes.map((type) => (
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
          <div className="modal modal-xl">
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
                  <label className="form-label form-label-required" htmlFor="brilink-transaction-type">
                    Tipe Transaksi
                  </label>
                  <select
                    id="brilink-transaction-type"
                    className="form-select"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as BRILinkTransactionType })}
                  >
                    {formTransactionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Saved Accounts (only for non-Propana) */}
                {!isPropana && savedAccounts.length > 0 && !editingTransaction && (
                  <SearchableAccountSelect
                    savedAccounts={filteredSavedAccounts}
                    selectedAccount={selectedSavedAccount}
                    onSelect={handleSavedAccountChange}
                  />
                )}

                {/* Propana Fields */}
                {isPropana ? (
                  <>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label form-label-required" htmlFor="brilink-phone">
                          No. Telepon
                        </label>
                        <input
                          id="brilink-phone"
                          type="text"
                          className="form-input"
                          placeholder="08xxxxxxxxxx"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="brilink-propana-customer-name">
                          Nama Pelanggan (Opsional)
                        </label>
                        <input
                          id="brilink-propana-customer-name"
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
                        <label className="form-label form-label-required" htmlFor="brilink-propana-amount">
                          Nominal
                        </label>
                        <input
                          id="brilink-propana-amount"
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
                        <label className="form-label form-label-required" htmlFor="brilink-propana-profit">
                          Profit
                        </label>
                        <input
                          id="brilink-propana-profit"
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
                      <label className="form-label" htmlFor="brilink-propana-ending-balance">Saldo Akhir</label>
                      <input
                        id="brilink-propana-ending-balance"
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
                        <label className="form-label form-label-required" htmlFor="brilink-account-number">
                          No Rekening
                        </label>
                        <input
                          id="brilink-account-number"
                          type="text"
                          className="form-input"
                          placeholder="Contoh: 1234567890"
                          inputMode="numeric"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: normalizeAccountNumber(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required" htmlFor="brilink-account-name">
                          Nama Rekening
                        </label>
                        <input
                          id="brilink-account-name"
                          type="text"
                          className="form-input"
                          placeholder="Contoh: JOHN DOE"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: sanitizeAccountNameInput(e.target.value) })}
                          required
                        />
                      </div>
                      <SearchableBankSelect
                        id="brilink-bank-select"
                        label="Bank"
                        banks={banks}
                        value={formData.bankName}
                        required
                        onChange={(bankName) => setFormData({ ...formData, bankName })}
                      />
                    </div>
                    <div className="grid grid-4">
                      <div className="form-group">
                        <label className="form-label form-label-required" htmlFor="brilink-amount">
                          Nominal
                        </label>
                        <input
                          id="brilink-amount"
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
                        <label className="form-label" htmlFor="brilink-admin-fee">
                          Biaya Admin (Opsional)
                        </label>
                        <input
                          id="brilink-admin-fee"
                          type="text"
                          className="form-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={formatNumber(formData.adminFee)}
                          onChange={(e) => setFormData({ ...formData, adminFee: parseNumber(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          className={`form-label ${!isGriyaBayar ? 'form-label-required' : ''}`}
                          htmlFor="brilink-profit"
                        >
                          Profit {isGriyaBayar && '(Opsional)'}
                        </label>
                        <input
                          id="brilink-profit"
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
                        <label className={`form-label ${requiresEndingBalance ? 'form-label-required' : ''}`} htmlFor="brilink-ending-balance">
                          Saldo Akhir
                        </label>
                        <input
                          id="brilink-ending-balance"
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
                    <div className="form-group">
                      <label className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.saveAccount || false}
                          disabled={isAccountSaved}
                          onChange={(e) => setFormData({ ...formData, saveAccount: e.target.checked })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!isAccountSaved) {
                                setFormData((prev) => ({ ...prev, saveAccount: !prev.saveAccount }));
                              }
                            }
                          }}
                        />
                        <Save size={16} className="mr-1" />
                        <span>Simpan no rekening untuk transaksi berikutnya</span>
                      </label>
                      {isAccountSaved && (
                        <div className="text-xs text-gray-500 mt-1">
                          Rekening sudah tersimpan.
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="brilink-customer-name">
                        Nama Pelanggan (Opsional)
                      </label>
                      <input
                        id="brilink-customer-name"
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
                  disabled={isSubmitting || (!isPropana && !formData.bankName)}
                >
                  {isSubmitting ? 'Menyimpan...' : (editingTransaction ? 'Update Transaksi' : 'Simpan Transaksi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printingTransaction && createPortal(
        <div className="brilink-receipt-area">
          <div className="brilink-receipt">
            <div className="brilink-receipt-header">
              <div className="brilink-receipt-store">UD. Cahaya</div>
              <div className="brilink-receipt-subtitle">Struk Transaksi</div>
              <div className="brilink-receipt-subtitle">
                {profitCategoryLabels[printingTransaction.profitCategory] || 'BRILink'}
              </div>
            </div>
            <div className="brilink-receipt-divider">============================</div>
            <div className="brilink-receipt-row">
              <span>Tanggal</span>
              <span>
                {printingTransaction.createdAt.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="brilink-receipt-row">
              <span>Jam</span>
              <span>
                {printingTransaction.createdAt.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
            <div className="brilink-receipt-row">
              <span>No Ref</span>
              <span className="brilink-receipt-ref">{printingTransaction.id.slice(-10).toUpperCase()}</span>
            </div>
            <div className="brilink-receipt-row">
              <span>Jenis</span>
              <span>
                {allTransactionTypes.find((t) => t.value === printingTransaction.transactionType)?.label ||
                  printingTransaction.transactionType}
              </span>
            </div>
            <div className="brilink-receipt-divider">----------------------------</div>
            {printingTransaction.profitCategory === 'propana' ? (
              <>
                <div className="brilink-receipt-row">
                  <span>No HP</span>
                  <span>{printingTransaction.accountNumber || '-'}</span>
                </div>
                {printingTransaction.customerName && (
                  <div className="brilink-receipt-row">
                    <span>Pelanggan</span>
                    <span>{toTitleCase(printingTransaction.customerName)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="brilink-receipt-row">
                  <span>Nama</span>
                  <span>
                    {printingTransaction.accountName
                      ? toTitleCase(printingTransaction.accountName)
                      : '-'}
                  </span>
                </div>
                <div className="brilink-receipt-row">
                  <span>No Rek</span>
                  <span>{printingTransaction.accountNumber || '-'}</span>
                </div>
                {printingTransaction.bankName && (
                  <div className="brilink-receipt-row">
                    <span>Bank</span>
                    <span>{toUpperBank(printingTransaction.bankName)}</span>
                  </div>
                )}
                {printingTransaction.customerName && (
                  <div className="brilink-receipt-row">
                    <span>Pelanggan</span>
                    <span>{toTitleCase(printingTransaction.customerName)}</span>
                  </div>
                )}
              </>
            )}
            <div className="brilink-receipt-divider">----------------------------</div>
            <div className="brilink-receipt-row">
              <span>Nominal</span>
              <span>{formatCurrency(printingTransaction.amount)}</span>
            </div>
            <div className="brilink-receipt-row">
              <span>Biaya Admin</span>
              <span>{formatCurrency(printingTransaction.adminFee)}</span>
            </div>
            <div className="brilink-receipt-divider">----------------------------</div>
            <div className="brilink-receipt-row brilink-receipt-total">
              <span>TOTAL</span>
              <span>{formatCurrency(printingTransaction.amount + printingTransaction.adminFee)}</span>
            </div>
            <div className="brilink-receipt-divider">============================</div>
            <div className="brilink-receipt-row">
              <span>Operator</span>
              <span>{printingTransaction.operatorName}</span>
            </div>
            <div className="brilink-receipt-footer">
              <div>Terima Kasih</div>
              <div>atas kunjungan Anda</div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </MainLayout>
  );
}
