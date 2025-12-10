import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brilinkService } from '../services/brilinkService';
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
    mutationFn: ({
      data,
      operatorId,
      operatorName,
    }: {
      data: BRILinkFormData;
      operatorId: string;
      operatorName: string;
    }) => brilinkService.create(data, operatorId, operatorName),
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
