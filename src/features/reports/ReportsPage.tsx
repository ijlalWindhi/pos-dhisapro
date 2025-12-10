import { useMemo, useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Wallet, DollarSign, Eye } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { MainLayout } from '@/components/layout';
import { useTransactionsByDateRange } from '@/features/sales/hooks/useTransactions';
import { useBrilinkByDateRange } from '@/features/brilink/hooks/useBrilink';
import { formatCurrency } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Period = 'today' | 'week' | 'month' | 'custom';

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format date for input
const formatDateForInput = (date: Date) => getLocalDateStr(date);

// Helper to parse date from input
const parseDateFromInput = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date;
};

function getDateRange(period: Period, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  if (period === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  if (period === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (period === 'month') {
    start.setDate(start.getDate() - 29);
  }
  
  return { start, end };
}

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);
  
  const { start, end } = useMemo(() => 
    getDateRange(period, customStartDate, customEndDate), 
    [period, customStartDate, customEndDate]
  );
  
  const { data: transactions = [], isLoading: loadingTx } = useTransactionsByDateRange(start, end);
  const { data: brilinkTx = [], isLoading: loadingBrilink } = useBrilinkByDateRange(start, end);
  
  const isLoading = loadingTx || loadingBrilink;

  // Omzet ATK = total penjualan (harga jual x qty)
  const omzetATK = transactions.reduce((sum, tx) => sum + tx.total, 0);
  
  // HPP (Harga Pokok Penjualan) = harga beli x qty
  const hpp = transactions.reduce((sum, tx) => 
    sum + tx.items.reduce((itemSum, item) => itemSum + ((item.buyPrice || 0) * item.quantity), 0), 0
  );
  
  // Laba Kotor ATK = Omzet - HPP
  const labaKotorATK = omzetATK - hpp;
  
  // Profit BRILink
  const profitBrilink = brilinkTx.reduce((sum, tx) => sum + tx.profit, 0);
  
  // Total Laba = Laba Kotor ATK + Profit BRILink
  const totalLaba = labaKotorATK + profitBrilink;

  // Calculate number of days between start and end
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Group by date for daily breakdown (newest first)
  const dailyData = useMemo(() => {
    const dateMap = new Map<string, { 
      date: Date; 
      omzet: number; 
      hpp: number;
      labaKotor: number;
      brilink: number; 
      salesCount: number; 
      brilinkCount: number;
    }>();
    
    // Generate all days in range
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = getLocalDateStr(date);
      dateMap.set(dateStr, { date, omzet: 0, hpp: 0, labaKotor: 0, brilink: 0, salesCount: 0, brilinkCount: 0 });
    }
    
    transactions.forEach((tx) => {
      const dateStr = getLocalDateStr(tx.createdAt);
      const current = dateMap.get(dateStr);
      if (current) {
        const txHpp = tx.items.reduce((sum, item) => sum + ((item.buyPrice || 0) * item.quantity), 0);
        const txLabaKotor = tx.total - txHpp;
        dateMap.set(dateStr, { 
          ...current, 
          omzet: current.omzet + tx.total,
          hpp: current.hpp + txHpp,
          labaKotor: current.labaKotor + txLabaKotor,
          salesCount: current.salesCount + 1
        });
      }
    });
    
    brilinkTx.forEach((tx) => {
      const dateStr = getLocalDateStr(tx.createdAt);
      const current = dateMap.get(dateStr);
      if (current) {
        dateMap.set(dateStr, { 
          ...current, 
          brilink: current.brilink + tx.profit,
          brilinkCount: current.brilinkCount + 1
        });
      }
    });
    
    // Sort by date descending (today first)
    return Array.from(dateMap.entries())
      .map(([dateStr, data]) => ({ 
        dateStr,
        dateDisplay: data.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        shortDate: data.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        ...data 
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, brilinkTx, end, daysDiff]);

  // Chart data (reversed for chronological order)
  const chartData = useMemo(() => 
    [...dailyData].reverse().map(d => ({
      name: d.shortDate,
      omzet: d.omzet,
      labaKotor: d.labaKotor,
      brilink: d.brilink,
      totalLaba: d.labaKotor + d.brilink
    }))
  , [dailyData]);

  // Period label for export
  const getPeriodLabel = () => {
    if (period === 'today') return 'Hari Ini';
    if (period === 'week') return '7 Hari';
    if (period === 'month') return '30 Hari';
    return `${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`;
  };

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      // Summary sheet data
      const summaryData = [
        ['LAPORAN KEUANGAN POS DHISAPRO'],
        [`Periode: ${getPeriodLabel()}`],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
        [],
        ['RINGKASAN'],
        ['Omzet ATK', omzetATK],
        ['HPP (Harga Beli)', hpp],
        ['Laba Kotor ATK', labaKotorATK],
        ['Profit BRILink', profitBrilink],
        ['Total Laba', totalLaba],
        [],
        ['STATISTIK TRANSAKSI'],
        ['Jumlah Transaksi ATK', transactions.length],
        ['Jumlah Transaksi BRILink', brilinkTx.length],
        ['Total Transaksi', transactions.length + brilinkTx.length],
      ];

      // Daily breakdown data
      const dailyHeaders = ['Tanggal', 'Omzet ATK', 'HPP', 'Laba Kotor', 'BRILink', 'Total Laba', 'Jml Tx'];
      const dailyRows = dailyData.map(d => [
        d.dateDisplay,
        d.omzet,
        d.hpp,
        d.labaKotor,
        d.brilink,
        d.labaKotor + d.brilink,
        d.salesCount + d.brilinkCount
      ]);

      // Sales detail data
      const salesHeaders = ['Waktu', 'Items', 'Metode Bayar', 'Total', 'HPP', 'Laba'];
      const salesRows = transactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(tx => {
          const txHpp = tx.items.reduce((sum, item) => sum + ((item.buyPrice || 0) * item.quantity), 0);
          return [
            tx.createdAt.toLocaleString('id-ID'),
            tx.items.map(i => `${i.productName} x${i.quantity}`).join(', '),
            tx.paymentMethod,
            tx.total,
            txHpp,
            tx.total - txHpp
          ];
        });

      // BRILink detail data  
      const brilinkHeaders = ['Waktu', 'Tipe', 'Keterangan', 'Nominal', 'Admin', 'Profit'];
      const brilinkRows = brilinkTx
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(tx => [
          tx.createdAt.toLocaleString('id-ID'),
          tx.transactionType,
          tx.description,
          tx.amount,
          tx.adminFee,
          tx.profit
        ]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Daily breakdown sheet
      const wsDaily = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Rekap Harian');

      // Sales detail sheet
      if (salesRows.length > 0) {
        const wsSales = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Detail Penjualan');
      }

      // BRILink detail sheet
      if (brilinkRows.length > 0) {
        const wsBrilink = XLSX.utils.aoa_to_sheet([brilinkHeaders, ...brilinkRows]);
        XLSX.utils.book_append_sheet(wb, wsBrilink, 'Detail BRILink');
      }

      // Generate file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const filename = `Laporan_POS_DhisaPro_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      // Reset custom dates when switching to preset
      setCustomStartDate(new Date());
      setCustomEndDate(new Date());
    }
  };

  return (
    <MainLayout title="Laporan">
      <div className="page-header">
        <div>
          <h2 className="page-title">Laporan Keuangan</h2>
          <p className="page-subtitle">Ringkasan penjualan dan transaksi BRILink</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExport}
          disabled={exporting || isLoading}
        >
          <Download size={18} />
          <span>{exporting ? 'Mengexport...' : 'Export Excel'}</span>
        </button>
      </div>

      {/* Period Filter */}
      <div className="card mb-4">
        <div className="p-4">
          <div className="flex gap-3 flex-wrap items-end">
            <button
              className={`btn ${period === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePeriodChange('today')}
            >
              <Calendar size={16} />
              <span>Hari Ini</span>
            </button>
            <button
              className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePeriodChange('week')}
            >
              <Calendar size={16} />
              <span>7 Hari</span>
            </button>
            <button
              className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePeriodChange('month')}
            >
              <Calendar size={16} />
              <span>30 Hari</span>
            </button>
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="form-group mb-0">
                <label className="text-xs text-gray-500 mb-1 block">Dari</label>
                <input
                  type="date"
                  className="form-input py-2 text-sm"
                  value={formatDateForInput(customStartDate)}
                  onChange={(e) => {
                    setCustomStartDate(parseDateFromInput(e.target.value));
                    setPeriod('custom');
                  }}
                  max={formatDateForInput(customEndDate)}
                />
              </div>
              <div className="form-group mb-0">
                <label className="text-xs text-gray-500 mb-1 block">Sampai</label>
                <input
                  type="date"
                  className="form-input py-2 text-sm"
                  value={formatDateForInput(customEndDate)}
                  onChange={(e) => {
                    setCustomEndDate(parseDateFromInput(e.target.value));
                    setPeriod('custom');
                  }}
                  min={formatDateForInput(customStartDate)}
                  max={formatDateForInput(new Date())}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="card stats-card">
          <div className="stats-card-icon primary">
            <ShoppingCart size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(omzetATK)}</div>
          <div className="stats-card-label">Omzet ATK ({transactions.length} tx)</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <TrendingUp size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(labaKotorATK)}</div>
          <div className="stats-card-label">Laba Kotor ATK</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(profitBrilink)}</div>
          <div className="stats-card-label">Profit BRILink ({brilinkTx.length} tx)</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(totalLaba)}</div>
          <div className="stats-card-label">Total Laba</div>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Omzet Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Grafik Omzet & Laba Kotor ATK</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="omzet" 
                    stroke="#3b82f6" 
                    fill="#93c5fd" 
                    name="Omzet"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="labaKotor" 
                    stroke="#f59e0b" 
                    fill="#fcd34d" 
                    name="Laba Kotor"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Comparison Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Perbandingan Laba Harian</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="labaKotor" fill="#f59e0b" name="Laba Kotor ATK" />
                  <Bar dataKey="brilink" fill="#3b82f6" name="Profit BRILink" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Rekap Harian</h3>
          <span className="text-sm text-gray-500">{daysDiff} hari</span>
        </div>
        <div className="p-0">
          <div className="table-container" style={{ maxHeight: '400px' }}>
            <table className="table">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th>Tanggal</th>
                  <th className="text-right">Omzet ATK</th>
                  <th className="text-right">Laba Kotor</th>
                  <th className="text-right">BRILink</th>
                  <th className="text-right">Total Laba</th>
                  <th className="text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  dailyData.map((day) => {
                    const isToday = getLocalDateStr(day.date) === getLocalDateStr(new Date());
                    const hasData = day.salesCount > 0 || day.brilinkCount > 0;
                    return (
                      <tr key={day.dateStr} className={isToday ? 'bg-primary-50' : ''}>
                        <td className={isToday ? 'font-bold' : 'font-semibold'}>
                          {day.dateDisplay}
                          {isToday && <span className="badge badge-primary ml-2">Hari Ini</span>}
                        </td>
                        <td className="text-right">{formatCurrency(day.omzet)}</td>
                        <td className="text-right text-warning-600">{formatCurrency(day.labaKotor)}</td>
                        <td className="text-right text-primary-600">{formatCurrency(day.brilink)}</td>
                        <td className="text-right font-semibold text-success-600">
                          {formatCurrency(day.labaKotor + day.brilink)}
                        </td>
                        <td className="text-center">
                          {hasData ? (
                            <Link
                              to="/reports/$date"
                              params={{ date: day.dateStr }}
                              className="btn btn-ghost btn-sm"
                              title="Lihat Detail"
                            >
                              <Eye size={16} className="text-primary-600" />
                            </Link>
                          ) : (
                            <span className="btn btn-ghost btn-sm text-gray-300">
                              <Eye size={16} />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-100">
                <tr className="font-semibold">
                  <td>Total</td>
                  <td className="text-right">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.omzet, 0))}
                  </td>
                  <td className="text-right text-warning-600">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.labaKotor, 0))}
                  </td>
                  <td className="text-right text-primary-600">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.brilink, 0))}
                  </td>
                  <td className="text-right text-success-600">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.labaKotor + d.brilink, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
