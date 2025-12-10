import { useState } from 'react';
import { Plus, Wallet, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Smartphone, CreditCard, X } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useTodayBrilinkTransactions, useTodayBrilinkSummary, useCreateBrilinkTransaction } from './hooks/useBrilink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BRILinkTransactionType, BRILinkFormData } from '@/types';
import '@/styles/button.css';
import '@/styles/form.css';
import '@/styles/card.css';
import '@/styles/components.css';

const transactionTypes: { value: BRILinkTransactionType; label: string; icon: typeof Wallet }[] = [
  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  { value: 'cash_deposit', label: 'Setor Tunai', icon: ArrowDownToLine },
  { value: 'cash_withdrawal', label: 'Tarik Tunai', icon: ArrowUpFromLine },
  { value: 'payment', label: 'Pembayaran', icon: CreditCard },
  { value: 'topup', label: 'Top Up', icon: Smartphone },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

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
          <Plus size={20} />
          <span>Input Transaksi</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div className="card stats-card">
          <div className="stats-card-icon warning">
            <Wallet size={28} />
          </div>
          <div className="stats-card-value">{formatCurrency(todayProfit)}</div>
          <div className="stats-card-label">Profit Hari Ini</div>
        </div>
        <div className="card stats-card">
          <div className="stats-card-icon primary">
            <ArrowRightLeft size={28} />
          </div>
          <div className="stats-card-value">{todayCount}</div>
          <div className="stats-card-label">Total Transaksi</div>
        </div>
      </div>

      {/* Transaction Types (Quick Add) */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div className="card-header">
          <h3 className="card-title">Tambah Cepat</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                className="btn btn-secondary btn-lg"
                onClick={() => openForm(type.value)}
                style={{ flex: '1 1 150px' }}
              >
                <type.icon size={22} />
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
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Tipe</th>
                  <th>Keterangan</th>
                  <th style={{ textAlign: 'right' }}>Nominal</th>
                  <th style={{ textAlign: 'right' }}>Admin</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Wallet size={32} />
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
                        <td style={{ textAlign: 'right' }}>{formatCurrency(tx.amount)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(tx.adminFee)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success-600)' }}>
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
                <X size={20} />
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
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Biaya Admin</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.adminFee || ''}
                      onChange={(e) => setFormData({ ...formData, adminFee: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-required">Profit</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.profit || ''}
                      onChange={(e) => setFormData({ ...formData, profit: parseInt(e.target.value) || 0 })}
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
