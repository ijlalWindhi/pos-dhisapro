import { useState } from 'react';
import { Plus, Wallet, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Smartphone, CreditCard, X } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useTodayBrilinkTransactions, useTodayBrilinkSummary, useCreateBrilinkTransaction } from './hooks/useBrilink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatNumber, parseNumber, formatCurrency } from '@/utils/format';
import type { BRILinkTransactionType, BRILinkFormData } from '@/types';

const transactionTypes: { value: BRILinkTransactionType; label: string; icon: typeof Wallet }[] = [
  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  { value: 'cash_deposit', label: 'Setor Tunai', icon: ArrowDownToLine },
  { value: 'cash_withdrawal', label: 'Tarik Tunai', icon: ArrowUpFromLine },
  { value: 'payment', label: 'Pembayaran', icon: CreditCard },
  { value: 'topup', label: 'Top Up', icon: Smartphone },
];


const emptyFormData: BRILinkFormData = {
  transactionType: 'transfer',
  description: '',
  amount: 0,
  adminFee: 0,
  profit: 0,
  customerName: '',
  referenceNo: '',
};

export function BrilinkPage() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useTodayBrilinkTransactions();
  const { data: summary } = useTodayBrilinkSummary();
  const createTransaction = useCreateBrilinkTransaction();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BRILinkFormData>(emptyFormData);

  const resetForm = () => {
    setFormData(emptyFormData);
    setShowForm(false);
  };

  const openForm = (type?: BRILinkTransactionType) => {
    setFormData({ ...emptyFormData, transactionType: type || 'transfer' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createTransaction.mutateAsync({
        data: formData,
        operatorId: user.id,
        operatorName: user.name,
      });
      resetForm();
    } catch (error) {
      console.error('BRILink transaction error:', error);
    }
  };

  const todayProfit = summary?.totalProfit || 0;
  const todayCount = summary?.totalTransactions || 0;

  return (
    <MainLayout title="BRILink">
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaksi BRILink</h2>
          <p className="page-subtitle">Catat transaksi BRILink Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} />
          <span>Input Transaksi</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={24} />
          </div>
          <div className="stats-card-value">{formatCurrency(todayProfit)}</div>
          <div className="stats-card-label">Profit Hari Ini</div>
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
          <div className="flex gap-3 flex-wrap">
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                className="btn btn-secondary btn-lg flex-1 min-w-[140px]"
                onClick={() => openForm(type.value)}
              >
                <type.icon size={20} />
                <span>{type.label}</span>
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
        <div className="p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Tipe</th>
                  <th>Keterangan</th>
                  <th className="text-right">Nominal</th>
                  <th className="text-right">Admin</th>
                  <th className="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Wallet size={28} />
                        </div>
                        <div className="empty-state-title">Belum ada transaksi</div>
                        <p className="empty-state-description">Klik tombol diatas untuk input transaksi BRILink</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const typeInfo = transactionTypes.find((t) => t.value === tx.transactionType);
                    return (
                      <tr key={tx.id}>
                        <td>{tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className="badge badge-warning">{typeInfo?.label || tx.transactionType}</span>
                        </td>
                        <td>{tx.description}</td>
                        <td className="text-right">{formatCurrency(tx.amount)}</td>
                        <td className="text-right">{formatCurrency(tx.adminFee)}</td>
                        <td className="text-right font-semibold text-success-600">
                          +{formatCurrency(tx.profit)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Input Transaksi BRILink</h3>
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
                <div className="form-group">
                  <label className="form-label form-label-required">Keterangan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Transfer ke BCA"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-3">
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
                    <label className="form-label form-label-required">Biaya Admin</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0"
                      inputMode="numeric"
                      value={formatNumber(formData.adminFee)}
                      onChange={(e) => setFormData({ ...formData, adminFee: parseNumber(e.target.value) })}
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
                <div className="grid grid-2">
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
                  <div className="form-group">
                    <label className="form-label">No. Referensi (Opsional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="No. referensi"
                      value={formData.referenceNo || ''}
                      onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createTransaction.isPending}
                >
                  {createTransaction.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
