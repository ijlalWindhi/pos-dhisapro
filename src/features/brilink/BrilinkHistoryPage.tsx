import { useState, useMemo } from 'react';
import { ArrowLeft, Wallet, Home, Flame, ArrowRightLeft, Search, Calendar, Filter, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { useBrilinkByDateRange, useBrilinkSummary, useBrilinkSearch } from './hooks/useBrilink';
import { formatCurrency } from '@/utils/format';
import type { BRILinkTransaction, BRILinkProfitCategory } from '@/types';

const profitCategoryLabels: Record<BRILinkProfitCategory, string> = {
  brilink: 'BRILink',
  griya_bayar: 'Griya Bayar',
  propana: 'Propana',
};

const transactionTypeLabels: Record<string, string> = {
  transfer: 'Transfer',
  cash_deposit: 'Setor Tunai',
  cash_withdrawal: 'Tarik Tunai',
  payment: 'Pembayaran',
  topup: 'Top Up',
  griya_bayar: 'Griya Bayar',
  propana: 'Propana',
};

// Helper to get start of day
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of day
function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Format date for input (using local timezone, not UTC)
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse date string from input (YYYY-MM-DD) to local Date
function parseDateFromInput(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function BrilinkHistoryPage() {
  // Default to today
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(getStartOfDay(today));
  const [endDate, setEndDate] = useState<Date>(getEndOfDay(today));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Queries
  const { data: dateRangeTransactions = [], isLoading: isLoadingDateRange } = useBrilinkByDateRange(startDate, endDate);
  const { data: summary } = useBrilinkSummary(startDate, endDate);
  const { data: searchResults = [], isLoading: isLoadingSearch } = useBrilinkSearch(isSearchMode ? searchTerm : '');

  // Use search results or date range based on mode
  const baseTransactions = isSearchMode ? searchResults : dateRangeTransactions;
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingDateRange;

  // Filter by category (only when not in search mode)
  const transactions = useMemo(() => {
    if (categoryFilter === 'all') return baseTransactions;
    return baseTransactions.filter(tx => tx.profitCategory === categoryFilter);
  }, [baseTransactions, categoryFilter]);

  // Calculate summary from filtered transactions
  const filteredSummary = useMemo(() => {
    const brilinkProfit = transactions
      .filter(tx => tx.profitCategory === 'brilink' || !tx.profitCategory)
      .reduce((sum, tx) => sum + tx.profit, 0);
    const griyaBayarProfit = transactions
      .filter(tx => tx.profitCategory === 'griya_bayar')
      .reduce((sum, tx) => sum + tx.profit, 0);
    const propanaProfit = transactions
      .filter(tx => tx.profitCategory === 'propana')
      .reduce((sum, tx) => sum + tx.profit, 0);
    
    return {
      brilinkProfit,
      griyaBayarProfit,
      propanaProfit,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  // When search changes, enter search mode and clear filters
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setIsSearchMode(true);
      setCategoryFilter('all');
    } else {
      setIsSearchMode(false);
    }
  };

  // When date/category changes, exit search mode
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const date = parseDateFromInput(value);
    if (type === 'start') {
      setStartDate(getStartOfDay(date));
    } else {
      setEndDate(getEndOfDay(date));
    }
    setSearchTerm('');
    setIsSearchMode(false);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setSearchTerm('');
    setIsSearchMode(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchMode(false);
  };

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<BRILinkTransaction>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: 'Tanggal/Waktu',
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return (
          <div className="whitespace-nowrap">
            <div>{date.toLocaleDateString('id-ID')}</div>
            <div className="text-xs text-gray-500">
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'transactionType',
      header: 'Tipe',
      cell: ({ getValue }) => (
        <span className="badge badge-warning">
          {transactionTypeLabels[getValue() as string] || (getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'profitCategory',
      header: 'Kategori',
      cell: ({ getValue }) => {
        const category = getValue() as BRILinkProfitCategory;
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
      enableSorting: false,
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: ({ getValue }) => (
        <span className="text-right block">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'profit',
      header: 'Profit',
      cell: ({ getValue }) => (
        <span className="text-right block font-semibold text-success-600">
          +{formatCurrency(getValue() as number)}
        </span>
      ),
    },
  ], []);

  // Use filtered summary when in search mode, otherwise use API summary
  const displaySummary = isSearchMode ? filteredSummary : (summary || filteredSummary);

  return (
    <MainLayout title="Riwayat BRILink">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/brilink" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="page-title">Riwayat Transaksi BRILink</h2>
            <p className="page-subtitle">
              {isSearchMode ? `Hasil pencarian: "${searchTerm}"` : 
                `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Search size={14} className="inline mr-1" />
                Cari
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama / No Rek / No HP..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {isSearchMode && (
                <div className="text-xs text-warning-600 mt-1">
                  Pencarian mengabaikan filter tanggal & kategori
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Calendar size={14} className="inline mr-1" />
                Dari Tanggal
              </label>
              <input
                type="date"
                className="form-input"
                value={formatDateForInput(startDate)}
                onChange={(e) => handleDateChange('start', e.target.value)}
                disabled={isSearchMode}
              />
            </div>

            {/* End Date */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Calendar size={14} className="inline mr-1" />
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="form-input"
                value={formatDateForInput(endDate)}
                onChange={(e) => handleDateChange('end', e.target.value)}
                disabled={isSearchMode}
              />
            </div>

            {/* Category Filter */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Filter size={14} className="inline mr-1" />
                Kategori
              </label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                <option value="brilink">BRILink</option>
                <option value="griya_bayar">Griya Bayar</option>
                <option value="propana">Propana</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(displaySummary.brilinkProfit)}</div>
          <div className="stats-card-label">Profit BRILink</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <Home size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(displaySummary.griyaBayarProfit)}</div>
          <div className="stats-card-label">Profit Griya Bayar</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon danger">
            <Flame size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(displaySummary.propanaProfit)}</div>
          <div className="stats-card-label">Profit Propana</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon primary">
            <ArrowRightLeft size={24} />
          </div>
          <div className="stats-card-value">{displaySummary.totalTransactions}</div>
          <div className="stats-card-label">Total Transaksi</div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Daftar Transaksi 
            {categoryFilter !== 'all' && ` - ${profitCategoryLabels[categoryFilter as BRILinkProfitCategory]}`}
          </h3>
        </div>
        <DataTable
          data={transactions}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={isSearchMode ? `Tidak ditemukan transaksi dengan kata kunci "${searchTerm}"` : 'Tidak ada transaksi pada rentang tanggal ini'}
          emptyIcon={<Wallet size={28} />}
        />
      </div>
    </MainLayout>
  );
}
