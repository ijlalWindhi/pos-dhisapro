import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Package,
  Wallet
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useLowStockProducts } from '@/features/products/hooks/useProducts';
import { useTodayTransactions } from '@/features/sales/hooks/useTransactions';
import { useTodayBrilinkTransactions, useTodayBrilinkSummary } from '@/features/brilink/hooks/useBrilink';
import { formatCurrency } from '@/utils/format';

export function DashboardPage() {
  const { data: todayTransactions = [], isLoading: loadingTx } = useTodayTransactions();
  const { data: lowStockProducts = [], isLoading: loadingStock } = useLowStockProducts();
  const { data: brilinkTransactions = [], isLoading: loadingBrilink } = useTodayBrilinkTransactions();
  const { data: brilinkSummary } = useTodayBrilinkSummary();

  // Omzet ATK = total penjualan (harga jual x qty)
  const omzetATK = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);
  
  // HPP (Harga Pokok Penjualan) = harga beli x qty
  const hpp = todayTransactions.reduce((sum, tx) => 
    sum + tx.items.reduce((itemSum, item) => itemSum + ((item.buyPrice || 0) * item.quantity), 0), 0
  );
  
  // Laba Kotor ATK = Omzet - HPP
  const labaKotorATK = omzetATK - hpp;
  
  // Profit BRILink
  const profitBrilink = brilinkSummary?.totalProfit || 0;
  
  // Total Laba = Laba Kotor ATK + Profit BRILink
  const totalLaba = labaKotorATK + profitBrilink;

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
      label: 'Omzet ATK', 
      value: formatCurrency(omzetATK), 
      icon: ShoppingCart, 
      color: 'primary' as const 
    },
    { 
      label: 'Laba Kotor ATK', 
      value: formatCurrency(labaKotorATK), 
      icon: TrendingUp, 
      color: 'warning' as const 
    },
    { 
      label: 'Profit BRILink', 
      value: formatCurrency(profitBrilink), 
      icon: Wallet, 
      color: 'warning' as const 
    },
    { 
      label: 'Total Laba', 
      value: formatCurrency(totalLaba), 
      icon: DollarSign, 
      color: 'success' as const 
    },
  ];

  return (
    <MainLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card stats-card">
            <div className={`stats-card-icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="stats-card-value">{isLoading ? '...' : stat.value}</div>
            <div className="stats-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transaksi Terbaru</h3>
          </div>
          <div className="p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Tipe</th>
                    <th>Keterangan</th>
                    <th className="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6">
                        <div className="spinner mx-auto"></div>
                      </td>
                    </tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">
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
                        <td className="text-right font-semibold">{formatCurrency(tx.amount)}</td>
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
          <div className="card-header flex items-center justify-between">
            <h3 className="card-title">Stok Menipis</h3>
            {lowStockProducts.length > 0 && (
              <span className="badge badge-danger">{lowStockProducts.length} Produk</span>
            )}
          </div>
          <div className="p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className="text-center">Stok</th>
                    <th className="text-center">Min</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStock ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6">
                        <div className="spinner mx-auto"></div>
                      </td>
                    </tr>
                  ) : lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state py-6">
                          <div className="empty-state-icon w-12 h-12">
                            <Package size={20} />
                          </div>
                          <div className="empty-state-title text-sm">Semua stok aman</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.slice(0, 5).map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td className="text-center font-semibold">{product.stock}</td>
                        <td className="text-center text-gray-400">{product.minStock}</td>
                        <td className="text-center">
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
