import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brilinkService } from '../services/brilinkService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
import { DUPLICATE_SAVED_ACCOUNT_MESSAGE } from '../utils/account';
import type { BRILinkFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'brilink';

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message === DUPLICATE_SAVED_ACCOUNT_MESSAGE) {
    return error.message;
  }

  return fallback;
};

export function useBrilinkTransactions() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => brilinkService.getAll(),
  });
}

export function useTodayBrilinkTransactions() {
  return useQuery({
    queryKey: [QUERY_KEY, 'today'],
    queryFn: () => brilinkService.getToday(),
  });
}

export function useBrilinkByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, 'range', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => brilinkService.getByDateRange(startDate, endDate),
  });
}

export function useBrilinkSummary(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, 'summary', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => brilinkService.getSummary(startDate, endDate),
  });
}

export function useTodayBrilinkSummary() {
  return useQuery({
    queryKey: [QUERY_KEY, 'todaySummary'],
    queryFn: () => brilinkService.getTodaySummary(),
  });
}

export function useBrilinkSearch(searchTerm: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'search', searchTerm],
    queryFn: () => brilinkService.search(searchTerm),
    enabled: !!searchTerm.trim(),
  });
}

export function useCreateBrilinkTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      operatorId,
      operatorName,
    }: {
      data: BRILinkFormData;
      operatorId: string;
      operatorName: string;
    }) => {
      const id = await brilinkService.create(data, operatorId, operatorName);
      
      await createAuditLog(
        'brilink',
        'create',
        id,
        `${data.transactionType} - ${data.accountName}`,
        operatorId,
        operatorName,
        null,
        { ...data, id }
      );
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Transaksi BRILink berhasil disimpan');
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, 'Gagal menyimpan transaksi'));
      console.error('Create brilink transaction error:', error);
    },
  });
}

export function useUpdateBrilinkTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data,
      userId,
      userName,
    }: { 
      id: string; 
      data: BRILinkFormData;
      userId?: string;
      userName?: string;
    }) => {
      // Get before data
      const transactions = await brilinkService.getToday();
      const beforeData = transactions.find(t => t.id === id);
      
      await brilinkService.update(id, data);
      
      if (userId && userName) {
        await createAuditLog(
          'brilink',
          'update',
          id,
          `${data.transactionType} - ${data.accountName}`,
          userId,
          userName,
          beforeData as unknown as Record<string, unknown>,
          { ...data, id }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Transaksi BRILink berhasil diupdate');
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, 'Gagal mengupdate transaksi'));
      console.error('Update brilink transaction error:', error);
    },
  });
}

export function useSavedBrilinkAccounts() {
  return useQuery({
    queryKey: [QUERY_KEY, 'savedAccounts'],
    queryFn: () => brilinkService.getSavedAccounts(),
  });
}

export function useCreateSavedBrilinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      userId,
      userName,
    }: {
      data: { accountName: string; accountNumber: string; bankName: string };
      userId: string;
      userName: string;
    }) => {
      const id = await brilinkService.createSavedAccount(data);

      await createAuditLog(
        'brilink',
        'create',
        id,
        `${data.accountName} - ${data.accountNumber}`,
        userId,
        userName,
        null,
        { ...data, id }
      );

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'savedAccounts'] });
      toast.success('Rekening berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, 'Gagal menambahkan rekening'));
      console.error('Create saved account error:', error);
    },
  });
}

export function useUpdateSavedBrilinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      userId,
      userName,
    }: {
      id: string;
      data: { accountName: string; accountNumber: string; bankName: string };
      userId: string;
      userName: string;
    }) => {
      const beforeData = (await brilinkService.getSavedAccounts()).find(acc => acc.id === id);

      await brilinkService.updateSavedAccount(id, data);

      await createAuditLog(
        'brilink',
        'update',
        id,
        `${data.accountName} - ${data.accountNumber}`,
        userId,
        userName,
        beforeData as unknown as Record<string, unknown>,
        { ...beforeData, ...data, id } as unknown as Record<string, unknown>
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'savedAccounts'] });
      toast.success('Rekening berhasil diperbarui');
    },
    onError: (error) => {
      toast.error(getMutationErrorMessage(error, 'Gagal memperbarui rekening'));
      console.error('Update saved account error:', error);
    },
  });
}

export function useDeleteSavedBrilinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      accountName,
      userId,
      userName,
    }: {
      id: string;
      accountName: string;
      userId: string;
      userName: string;
    }) => {
      const beforeData = (await brilinkService.getSavedAccounts()).find(acc => acc.id === id);

      await brilinkService.deleteSavedAccount(id);

      await createAuditLog(
        'brilink',
        'delete',
        id,
        accountName,
        userId,
        userName,
        beforeData as unknown as Record<string, unknown>,
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'savedAccounts'] });
      toast.success('Rekening berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus rekening');
      console.error('Delete saved account error:', error);
    },
  });
}

export function useBrilinkBanks() {
  return useQuery({
    queryKey: [QUERY_KEY, 'banks'],
    queryFn: () => brilinkService.getBanks(),
  });
}

export function useCreateBrilinkBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      userId,
      userName,
    }: {
      name: string;
      userId: string;
      userName: string;
    }) => {
      const id = await brilinkService.createBank(name);

      await createAuditLog(
        'brilink',
        'create',
        id,
        `Bank: ${name}`,
        userId,
        userName,
        null,
        { id, name }
      );

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'banks'] });
      toast.success('Bank berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan bank');
      console.error('Create bank error:', error);
    },
  });
}

export function useUpdateBrilinkBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      userId,
      userName,
    }: {
      id: string;
      name: string;
      userId: string;
      userName: string;
    }) => {
      const beforeData = (await brilinkService.getBanks()).find(bank => bank.id === id);

      await brilinkService.updateBank(id, name);

      await createAuditLog(
        'brilink',
        'update',
        id,
        `Bank: ${name}`,
        userId,
        userName,
        beforeData as unknown as Record<string, unknown>,
        { ...beforeData, name } as unknown as Record<string, unknown>
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'banks'] });
      toast.success('Bank berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui bank');
      console.error('Update bank error:', error);
    },
  });
}

export function useDeleteBrilinkBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      bankName,
      userId,
      userName,
    }: {
      id: string;
      bankName: string;
      userId: string;
      userName: string;
    }) => {
      const beforeData = (await brilinkService.getBanks()).find(bank => bank.id === id);

      await brilinkService.deleteBank(id);

      await createAuditLog(
        'brilink',
        'delete',
        id,
        `Bank: ${bankName}`,
        userId,
        userName,
        beforeData as unknown as Record<string, unknown>,
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'banks'] });
      toast.success('Bank berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus bank');
      console.error('Delete bank error:', error);
    },
  });
}
