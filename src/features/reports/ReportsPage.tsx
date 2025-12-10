import { useMemo, useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Wallet, DollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useTransactionsByDateRange } from '@/features/sales/hooks/useTransactions';
import { useBrilinkByDateRange } from '@/features/brilink/hooks/useBrilink';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

type Period = 'today' | 'week' | 'month';

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'month') {
    start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [exporting, setExporting] = useState(false);
  
  const { start, end } = useMemo(() => getDateRange(period), [period]);
  
  const { data: transactions = [], isLoading: loadingTx } = useTransactionsByDateRange(start, end);
  const { data: brilinkTx = [], isLoading: loadingBrilink } = useBrilinkByDateRange(start, end);
  
  const isLoading = loadingTx || loadingBrilink;

  // Calculate summary
  const totalSales = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalBrilinkProfit = brilinkTx.reduce((sum, tx) => sum + tx.profit, 0);
  const totalRevenue = totalSales + totalBrilinkProfit;

  // Group by date for daily breakdown (newest first)
  const dailyData = useMemo(() => {
    const dateMap = new Map<string, { date: Date; sales: number; brilink: number; salesCount: number; brilinkCount: number }>();
    
    // Determine number of days based on period
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { date, sales: 0, brilink: 0, salesCount: 0, brilinkCount: 0 });
    }
    
    transactions.forEach((tx) => {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(dateStr);
      if (current) {
        dateMap.set(dateStr, { 
          ...current, 
          sales: current.sales + tx.total,
          salesCount: current.salesCount + 1
        });
      }
    });
    
    brilinkTx.forEach((tx) => {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
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
        dateDisplay: data.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        ...data 
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, brilinkTx, period]);

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const periodLabel = period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari' : '30 Hari';
      
      // Summary sheet data
      const summaryData = [
        ['LAPORAN KEUANGAN POS DHISAPRO'],
        [`Periode: ${periodLabel}`],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
        [],
        ['RINGKASAN'],
        ['Penjualan ATK', totalSales],
        ['Jumlah Transaksi ATK', transactions.length],
        ['Profit BRILink', totalBrilinkProfit],
        ['Jumlah Transaksi BRILink', brilinkTx.length],
        ['Total Pendapatan', totalRevenue],
      ];

      // Daily breakdown data
      const dailyHeaders = ['Tanggal', 'Penjualan ATK', 'Jml Tx ATK', 'Profit BRILink', 'Jml Tx BRILink', 'Total'];
      const dailyRows = dailyData.map(d => [
        d.dateDisplay,
        d.sales,
        d.salesCount,
        d.brilink,
        d.brilinkCount,
        d.sales + d.brilink
      ]);

      // Sales detail data
      const salesHeaders = ['Waktu', 'Items', 'Metode Bayar', 'Subtotal', 'Diskon', 'Total'];
      const salesRows = transactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(tx => [
          tx.createdAt.toLocaleString('id-ID'),
          tx.items.map(i => `${i.productName} x${i.quantity}`).join(', '),
          tx.paymentMethod,
          tx.subtotal,
          tx.discount,
          tx.total
        ]);

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

  return (
    <MainLayout title="Laporan">
      <div className="page-header">
        <div>
          <h2 className="page-title">Laporan Keuangan</h2>
          <p className="page-subtitle">Ringkasan penjualan dan transaksi BRILink</p>
        </div>
        <button 
          className="btn btn-secondary" 
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
          <div className="flex gap-3 flex-wrap">
            <button
              className={`btn ${period === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('today')}
            >
              <Calendar size={16} />
              <span>Hari Ini</span>
            </button>
            <button
              className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('week')}
            >
              <Calendar size={16} />
              <span>7 Hari</span>
            </button>
            <button
              className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('month')}
            >
              <Calendar size={16} />
              <span>30 Hari</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <ShoppingCart size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(totalSales)}</div>
          <div className="stats-card-label">Penjualan ATK ({transactions.length} tx)</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(totalBrilinkProfit)}</div>
          <div className="stats-card-label">Profit BRILink ({brilinkTx.length} tx)</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon primary">
            <TrendingUp size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : formatCurrency(totalRevenue)}</div>
          <div className="stats-card-label">Total Pendapatan</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stats-card-value">{isLoading ? '...' : transactions.length + brilinkTx.length}</div>
          <div className="stats-card-label">Total Transaksi</div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Rekap Harian</h3>
        </div>
        <div className="p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th className="text-right">Penjualan ATK</th>
                  <th className="text-right">Profit BRILink</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  dailyData.map((day, index) => (
                    <tr key={day.dateStr} className={index === 0 ? 'bg-primary-50' : ''}>
                      <td className={index === 0 ? 'font-bold' : 'font-semibold'}>
                        {day.dateDisplay}
                        {index === 0 && <span className="badge badge-primary ml-2">Hari Ini</span>}
                      </td>
                      <td className="text-right">{formatCurrency(day.sales)}</td>
                      <td className="text-right text-warning-600">{formatCurrency(day.brilink)}</td>
                      <td className="text-right font-semibold text-success-600">
                        {formatCurrency(day.sales + day.brilink)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td>Total</td>
                  <td className="text-right">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.sales, 0))}
                  </td>
                  <td className="text-right text-warning-600">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.brilink, 0))}
                  </td>
                  <td className="text-right text-success-600">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.sales + d.brilink, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
