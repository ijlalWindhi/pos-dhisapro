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

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        paymentMethod?: 'cash' | 'transfer' | 'qris';
        amountPaid?: number;
      };
    }) => transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Transaksi berhasil diupdate');
    },
    onError: (error) => {
      toast.error('Gagal mengupdate transaksi');
      console.error('Update transaction error:', error);
    },
  });
}

export function useUpdateTransactionWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      originalItems,
      newItems,
      paymentMethod,
      amountPaid,
    }: {
      id: string;
      originalItems: { productId: string; quantity: number }[];
      newItems: { productId: string; productName: string; quantity: number; price: number; buyPrice: number; subtotal: number }[];
      paymentMethod: 'cash' | 'transfer' | 'qris';
      amountPaid: number;
    }) => transactionService.updateWithItems(id, originalItems, newItems, paymentMethod, amountPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Transaksi berhasil diupdate');
    },
    onError: (error) => {
      toast.error('Gagal mengupdate transaksi');
      console.error('Update transaction with items error:', error);
    },
  });
}
