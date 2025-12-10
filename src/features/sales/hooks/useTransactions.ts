import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import type { CartItem } from '@/types';
import toast from 'react-hot-toast';

const QUERY_KEY = 'transactions';

export function useTransactions() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => transactionService.getAll(),
  });
}

export function useTodayTransactions() {
  return useQuery({
    queryKey: [QUERY_KEY, 'today'],
    queryFn: () => transactionService.getToday(),
  });
}

export function useTransactionsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, 'range', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => transactionService.getByDateRange(startDate, endDate),
  });
}

export function useTransactionSummary(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, 'summary', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => transactionService.getSummary(startDate, endDate),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cart,
      paymentMethod,
      amountPaid,
      discount,
      cashierId,
      cashierName,
    }: {
      cart: CartItem[];
      paymentMethod: 'cash' | 'transfer' | 'qris';
      amountPaid: number;
      discount: number;
      cashierId: string;
      cashierName: string;
    }) =>
      transactionService.create(cart, paymentMethod, amountPaid, discount, cashierId, cashierName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Transaksi berhasil!');
    },
    onError: (error) => {
      toast.error('Gagal memproses transaksi');
      console.error('Create transaction error:', error);
    },
  });
}
