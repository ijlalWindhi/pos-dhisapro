import { useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Wallet, Calendar } from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
import { MainLayout } from '@/components/layout';
import { useTransactionsByDateRange } from '@/features/sales/hooks/useTransactions';
import { useBrilinkByDateRange } from '@/features/brilink/hooks/useBrilink';
import { formatCurrency } from '@/utils/format';

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse date from URL parameter
const parseDateFromParam = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getBRILinkTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'transfer': 'Transfer',
    'cash_deposit': 'Setor Tunai',
    'cash_withdrawal': 'Tarik Tunai',
    'payment': 'Pembayaran',
    'topup': 'Top Up',
  };
  return labels[type] || type;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    'cash': 'Tunai',
    'transfer': 'Transfer',
    'qris': 'QRIS',
  };
  return labels[method] || method;
};

export function ReportDetailPage() {
  const { date: dateParam } = useParams({ from: '/reports/$date' });
  
  const selectedDate = useMemo(() => parseDateFromParam(dateParam), [dateParam]);
  
  const dateDisplay = selectedDate.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Create date range for start and end of the selected day
  const start = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const end = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  const { data: allTransactions = [], isLoading: loadingTx } = useTransactionsByDateRange(start, end);
  const { data: allBrilinkTx = [], isLoading: loadingBrilink } = useBrilinkByDateRange(start, end);

  const isLoading = loadingTx || loadingBrilink;

  // Filter to only this date (should already be filtered by date range, but double check)
  const transactions = useMemo(() => 
    allTransactions.filter(tx => getLocalDateStr(tx.createdAt) === dateParam),
    [allTransactions, dateParam]
  );

  const brilinkTx = useMemo(() => 
    allBrilinkTx.filter(tx => getLocalDateStr(tx.createdAt) === dateParam),
    [allBrilinkTx, dateParam]
  );

  // Calculate totals
  const totalOmzet = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalHpp = transactions.reduce((sum, tx) => 
    sum + tx.items.reduce((s, i) => s + ((i.buyPrice || 0) * i.quantity), 0), 0);
  const totalLabaKotor = totalOmzet - totalHpp;
  const totalBrilink = brilinkTx.reduce((sum, tx) => sum + tx.profit, 0);
  const totalLaba = totalLabaKotor + totalBrilink;

  return (
    <MainLayout title="Detail Transaksi">
      <div className="page-header mb-4">
        <div className="flex items-center gap-3">
          <Link to="/reports" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="page-title">Detail Transaksi</h2>
            <p className="page-subtitle flex items-center gap-2">
              <Calendar size={14} />
              {dateDisplay}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Omzet ATK</div>
          <div className="text-lg font-bold">{isLoading ? '...' : formatCurrency(totalOmzet)}</div>
          <div className="text-xs text-gray-400">{transactions.length} transaksi</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">HPP</div>
          <div className="text-lg font-bold text-gray-500">{isLoading ? '...' : formatCurrency(totalHpp)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Laba Kotor ATK</div>
          <div className="text-lg font-bold text-warning-600">{isLoading ? '...' : formatCurrency(totalLabaKotor)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Profit BRILink</div>
          <div className="text-lg font-bold text-primary-600">{isLoading ? '...' : formatCurrency(totalBrilink)}</div>
          <div className="text-xs text-gray-400">{brilinkTx.length} transaksi</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Total Laba</div>
          <div className="text-lg font-bold text-success-600">{isLoading ? '...' : formatCurrency(totalLaba)}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat transaksi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ATK Transactions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary-600" />
                Transaksi ATK
              </h3>
              <span className="badge badge-primary">{transactions.length}</span>
            </div>
            <div className="p-0">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Tidak ada transaksi ATK
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {transactions
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map(tx => {
                      const hpp = tx.items.reduce((sum, i) => sum + ((i.buyPrice || 0) * i.quantity), 0);
                      const profit = tx.total - hpp;
                      return (
                        <div key={tx.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`badge ${tx.paymentMethod === 'cash' ? 'badge-success' : tx.paymentMethod === 'qris' ? 'badge-warning' : 'badge-primary'}`}>
                                {getPaymentMethodLabel(tx.paymentMethod)}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(tx.total)}</div>
                              <div className="text-sm text-success-600">Laba: {formatCurrency(profit)}</div>
                            </div>
                          </div>
                          
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 text-xs">
                                <th className="font-normal text-left pb-2">Item</th>
                                <th className="font-normal text-center pb-2 w-16">Qty</th>
                                <th className="font-normal text-right pb-2 w-24">Harga</th>
                                <th className="font-normal text-right pb-2 w-24">HPP</th>
                                <th className="font-normal text-right pb-2 w-24">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {tx.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-1">{item.productName}</td>
                                  <td className="text-center py-1">{item.quantity}</td>
                                  <td className="text-right py-1">{formatCurrency(item.price)}</td>
                                  <td className="text-right py-1 text-gray-400">{formatCurrency(item.buyPrice || 0)}</td>
                                  <td className="text-right py-1 font-medium">{formatCurrency(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                            <span>Kasir: {tx.cashierName}</span>
                            <span>HPP: {formatCurrency(hpp)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* BRILink Transactions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Wallet size={18} className="text-warning-600" />
                Transaksi BRILink
              </h3>
              <span className="badge badge-warning">{brilinkTx.length}</span>
            </div>
            <div className="p-0">
              {brilinkTx.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Tidak ada transaksi BRILink
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {brilinkTx
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map(tx => (
                      <div key={tx.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="badge badge-warning">
                              {getBRILinkTypeLabel(tx.transactionType)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-success-600">{formatCurrency(tx.profit)}</div>
                            <div className="text-sm text-gray-500">Profit</div>
                          </div>
                        </div>
                        
                        <div className="text-sm mb-2">{tx.description}</div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>Nominal: <span className="font-medium text-gray-700">{formatCurrency(tx.amount)}</span></div>
                          <div>Admin: <span className="font-medium text-gray-700">{formatCurrency(tx.adminFee)}</span></div>
                          {tx.customerName && (
                            <div>Pelanggan: <span className="font-medium text-gray-700">{tx.customerName}</span></div>
                          )}
                          {tx.customerPhone && (
                            <div>No. HP: <span className="font-medium text-gray-700">{tx.customerPhone}</span></div>
                          )}
                          {tx.referenceNo && (
                            <div className="col-span-2">No. Ref: <span className="font-medium text-gray-700">{tx.referenceNo}</span></div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
                          Operator: {tx.operatorName}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
