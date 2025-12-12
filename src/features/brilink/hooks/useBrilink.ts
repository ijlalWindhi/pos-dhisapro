import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brilinkService } from '../services/brilinkService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
import type { BRILinkFormData } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'brilink';

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
      toast.error('Gagal menyimpan transaksi');
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
      toast.error('Gagal mengupdate transaksi');
      console.error('Update brilink transaction error:', error);
    },
  });
}
