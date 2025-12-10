import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Package
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useLowStockProducts } from '@/features/products/hooks/useProducts';
import { useTodayTransactions } from '@/features/sales/hooks/useTransactions';
import { useTodayBrilinkTransactions, useTodayBrilinkSummary } from '@/features/brilink/hooks/useBrilink';
import '@/styles/card.css';
import '@/styles/components.css';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function DashboardPage() {
  const { data: todayTransactions = [], isLoading: loadingTx } = useTodayTransactions();
  const { data: lowStockProducts = [], isLoading: loadingStock } = useLowStockProducts();
  const { data: brilinkTransactions = [], isLoading: loadingBrilink } = useTodayBrilinkTransactions();
  const { data: brilinkSummary } = useTodayBrilinkSummary();

  const todaySales = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const todayBrilinkProfit = brilinkSummary?.totalProfit || 0;

  // Combine all transactions for recent activity
  const recentTransactions = [
    ...todayTransactions.map(tx => ({ 
      id: tx.id, 
      type: 'Penjualan' as const, 
      amount: tx.total, 
      time: tx.createdAt,
      description: tx.paymentMethod === 'cash' ? 'Tunai' : tx.paymentMethod === 'transfer' ? 'Transfer' : 'QRIS'
    })),
    ...brilinkTransactions.map(tx => ({ 
      id: tx.id, 
      type: 'BRILink' as const, 
      amount: tx.amount, 
      time: tx.createdAt,
      description: tx.description
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

  const isLoading = loadingTx || loadingStock || loadingBrilink;

  const stats = [
    { 
      label: 'Penjualan Hari Ini', 
      value: formatCurrency(todaySales), 
      icon: DollarSign, 
      color: 'success' as const 
    },
    { 
      label: 'Total Transaksi', 
      value: String(todayTransactions.length), 
      icon: ShoppingCart, 
      color: 'primary' as const 
    },
    { 
      label: 'Profit BRILink', 
      value: formatCurrency(todayBrilinkProfit), 
      icon: TrendingUp, 
      color: 'warning' as const 
    },
    { 
      label: 'Stok Menipis', 
      value: `${lowStockProducts.length} Produk`, 
      icon: AlertTriangle, 
      color: 'danger' as const 
    },
  ];

  return (
    <MainLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-6)' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card stats-card">
            <div className={`stats-card-icon ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div className="stats-card-value">{isLoading ? '...' : stat.value}</div>
            <div className="stats-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transaksi Terbaru</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Tipe</th>
                    <th>Keterangan</th>
                    <th style={{ textAlign: 'right' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                      </td>
                    </tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-6)', color: 'var(--text-muted)' }}>
                        Belum ada transaksi hari ini
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={`badge ${tx.type === 'BRILink' ? 'badge-warning' : 'badge-primary'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stok Menipis</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th style={{ textAlign: 'center' }}>Stok</th>
                    <th style={{ textAlign: 'center' }}>Min</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStock ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                      </td>
                    </tr>
                  ) : lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state" style={{ padding: 'var(--spacing-6)' }}>
                          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                            <Package size={24} />
                          </div>
                          <div className="empty-state-title" style={{ fontSize: 'var(--font-size-sm)' }}>
                            Semua stok aman
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.slice(0, 5).map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{product.stock}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{product.minStock}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${product.stock <= product.minStock / 2 ? 'badge-danger' : 'badge-warning'}`}>
                            {product.stock <= product.minStock / 2 ? 'Kritis' : 'Hampir Habis'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
