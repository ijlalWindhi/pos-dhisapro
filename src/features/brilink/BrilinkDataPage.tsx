import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Landmark, CreditCard, ArrowLeft, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useSavedBrilinkAccounts,
  useCreateSavedBrilinkAccount,
  useUpdateSavedBrilinkAccount,
  useDeleteSavedBrilinkAccount,
  useBrilinkBanks,
  useCreateBrilinkBank,
  useUpdateBrilinkBank,
  useDeleteBrilinkBank,
} from './hooks/useBrilink';
import type { BRILinkBank, SavedBRILinkAccount } from '@/types';

interface BankFormModalProps {
  isOpen: boolean;
  bank: BRILinkBank | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string }) => Promise<void>;
}

function BankFormModal({
  isOpen,
  bank,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<BankFormModalProps>) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen && bank) {
      setName(bank.name);
    } else if (isOpen) {
      setName('');
    }
  }, [isOpen, bank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: name.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{bank ? 'Edit Bank' : 'Tambah Bank'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="brilink-bank-name">
                Nama Bank
              </label>
              <input
                id="brilink-bank-name"
                type="text"
                className="form-input"
                placeholder="Contoh: BRI"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SavedAccountFormModalProps {
  isOpen: boolean;
  account: SavedBRILinkAccount | null;
  banks: BRILinkBank[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { accountName: string; accountNumber: string; bankName: string }) => Promise<void>;
}

function SavedAccountFormModal({
  isOpen,
  account,
  banks,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<SavedAccountFormModalProps>) {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (isOpen && account) {
      setAccountName(account.accountName);
      setAccountNumber(account.accountNumber);
      setBankName(account.bankName || '');
    } else if (isOpen) {
      setAccountName('');
      setAccountNumber('');
      setBankName('');
    }
  }, [isOpen, account]);

  const bankOptions = useMemo(() => {
    const names = new Set(banks.map((b) => b.name));
    if (account?.bankName && !names.has(account.bankName)) {
      return [{ id: 'legacy', name: account.bankName }, ...banks];
    }
    return banks;
  }, [banks, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      accountName: accountName.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      bankName,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{account ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="brilink-account-name">
                  Nama Rekening
                </label>
                <input
                  id="brilink-account-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: JOHN DOE"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="brilink-account-number">
                  No. Rekening
                </label>
                <input
                  id="brilink-account-number"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 1234567890"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replaceAll(/\D/g, ''))}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="brilink-bank-select">
                Bank
              </label>
              <select
                id="brilink-bank-select"
                className="form-select"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              >
                <option value="">{bankOptions.length === 0 ? 'Belum ada data bank' : 'Pilih bank'}</option>
                {bankOptions.map((bank) => (
                  <option key={bank.id} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {bankOptions.length === 0 && (
                <div className="text-xs text-warning-600 mt-1">
                  Tambahkan data bank terlebih dahulu.
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BrilinkDataPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'banks'>('accounts');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavedBRILinkAccount | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BRILinkBank | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteBankId, setDeleteBankId] = useState<string | null>(null);

  const { user } = useAuth();
  const { data: savedAccounts = [], isLoading: isLoadingAccounts } = useSavedBrilinkAccounts();
  const { data: banks = [], isLoading: isLoadingBanks } = useBrilinkBanks();

  const createAccount = useCreateSavedBrilinkAccount();
  const updateAccount = useUpdateSavedBrilinkAccount();
  const deleteAccount = useDeleteSavedBrilinkAccount();

  const createBank = useCreateBrilinkBank();
  const updateBank = useUpdateBrilinkBank();
  const deleteBank = useDeleteBrilinkBank();

  const openAccountModal = useCallback((account?: SavedBRILinkAccount) => {
    setEditingAccount(account || null);
    setShowAccountModal(true);
  }, []);

  const closeAccountModal = () => {
    setEditingAccount(null);
    setShowAccountModal(false);
  };

  const openBankModal = useCallback((bank?: BRILinkBank) => {
    setEditingBank(bank || null);
    setShowBankModal(true);
  }, []);

  const closeBankModal = () => {
    setEditingBank(null);
    setShowBankModal(false);
  };

  const handleSubmitAccount = async (data: { accountName: string; accountNumber: string; bankName: string }) => {
    if (editingAccount) {
      await updateAccount.mutateAsync({
        id: editingAccount.id,
        data,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createAccount.mutateAsync({
        data,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeAccountModal();
  };

  const handleSubmitBank = async (data: { name: string }) => {
    if (editingBank) {
      await updateBank.mutateAsync({
        id: editingBank.id,
        name: data.name,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    } else {
      await createBank.mutateAsync({
        name: data.name,
        userId: user?.id || '',
        userName: user?.name || '',
      });
    }
    closeBankModal();
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountId) return;
    const account = savedAccounts.find((acc) => acc.id === deleteAccountId);
    await deleteAccount.mutateAsync({
      id: deleteAccountId,
      accountName: account?.accountName || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
    setDeleteAccountId(null);
  };

  const handleDeleteBank = async () => {
    if (!deleteBankId) return;
    const bank = banks.find((item) => item.id === deleteBankId);
    await deleteBank.mutateAsync({
      id: deleteBankId,
      bankName: bank?.name || '',
      userId: user?.id || '',
      userName: user?.name || '',
    });
    setDeleteBankId(null);
  };

  const accountColumns = useMemo<ColumnDef<SavedBRILinkAccount>[]>(() => [
    {
      accessorKey: 'accountName',
      header: 'Nama Rekening',
      cell: ({ row }) => <span className="font-semibold">{row.original.accountName}</span>,
    },
    {
      accessorKey: 'accountNumber',
      header: 'No. Rekening',
    },
    {
      accessorKey: 'bankName',
      header: 'Bank',
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="table-action justify-center">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Edit"
            onClick={() => openAccountModal(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Hapus"
            onClick={() => setDeleteAccountId(row.original.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [openAccountModal]);

  const bankColumns = useMemo<ColumnDef<BRILinkBank>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nama Bank',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="table-action justify-center">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Edit"
            onClick={() => openBankModal(row.original)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Hapus"
            onClick={() => setDeleteBankId(row.original.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [openBankModal]);

  return (
    <MainLayout title="Data BRILink">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/brilink" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="page-title">Data BRILink</h2>
            <p className="page-subtitle">Kelola rekening tersimpan dan daftar bank</p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('accounts')}
          >
            <CreditCard size={16} />
            <span>Daftar Rekening</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'banks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('banks')}
          >
            <Landmark size={16} />
            <span>Daftar Bank</span>
          </button>
        </div>
      </div>

      {activeTab === 'accounts' ? (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="card-title">Daftar Rekening</h3>
            <button className="btn btn-primary" onClick={() => openAccountModal()}>
              <Plus size={18} />
              <span>Tambah Rekening</span>
            </button>
          </div>
          <DataTable
            data={savedAccounts}
            columns={accountColumns}
            isLoading={isLoadingAccounts}
            emptyMessage="Belum ada rekening tersimpan"
            emptyIcon={<CreditCard size={28} />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="card-title">Daftar Bank</h3>
            <button className="btn btn-primary" onClick={() => openBankModal()}>
              <Plus size={18} />
              <span>Tambah Bank</span>
            </button>
          </div>
          <DataTable
            data={banks}
            columns={bankColumns}
            isLoading={isLoadingBanks}
            emptyMessage="Belum ada data bank"
            emptyIcon={<Landmark size={28} />}
          />
        </div>
      )}

      <SavedAccountFormModal
        isOpen={showAccountModal}
        account={editingAccount}
        banks={banks}
        isSubmitting={createAccount.isPending || updateAccount.isPending}
        onClose={closeAccountModal}
        onSubmit={handleSubmitAccount}
      />

      <BankFormModal
        isOpen={showBankModal}
        bank={editingBank}
        isSubmitting={createBank.isPending || updateBank.isPending}
        onClose={closeBankModal}
        onSubmit={handleSubmitBank}
      />

      <ConfirmDialog
        isOpen={!!deleteAccountId}
        title="Hapus Rekening"
        message="Apakah Anda yakin ingin menghapus rekening ini?"
        confirmLabel="Ya, Hapus"
        isLoading={deleteAccount.isPending}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountId(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteBankId}
        title="Hapus Bank"
        message="Apakah Anda yakin ingin menghapus bank ini?"
        confirmLabel="Ya, Hapus"
        isLoading={deleteBank.isPending}
        onConfirm={handleDeleteBank}
        onCancel={() => setDeleteBankId(null)}
      />
    </MainLayout>
  );
}
