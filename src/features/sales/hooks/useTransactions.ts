import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { createAuditLog } from '@/features/audit/services/auditLogService';
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
    mutationFn: async ({
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
    }) => {
      const id = await transactionService.create(cart, paymentMethod, amountPaid, discount, cashierId, cashierName);
      
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0) - discount;
      const itemsSummary = cart.map(item => `${item.product.name} x${item.quantity}`).join(', ');
      
      await createAuditLog(
        'sales',
        'create',
        id,
        `Transaksi ${itemsSummary}`,
        cashierId,
        cashierName,
        null,
        {
          id,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
          total,
          paymentMethod,
          amountPaid,
        }
      );
      
      return id;
    },
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
    mutationFn: async ({
      id,
      originalItems,
      newItems,
      paymentMethod,
      amountPaid,
      userId,
      userName,
    }: {
      id: string;
      originalItems: { productId: string; quantity: number }[];
      newItems: { productId: string; productName: string; quantity: number; price: number; buyPrice: number; subtotal: number }[];
      paymentMethod: 'cash' | 'transfer' | 'qris';
      amountPaid: number;
      userId?: string;
      userName?: string;
    }) => {
      await transactionService.updateWithItems(id, originalItems, newItems, paymentMethod, amountPaid);
      
      if (userId && userName) {
        const itemsSummary = newItems.map(item => `${item.productName} x${item.quantity}`).join(', ');
        
        await createAuditLog(
          'sales',
          'update',
          id,
          `Transaksi ${itemsSummary}`,
          userId,
          userName,
          {
            items: originalItems,
          },
          {
            items: newItems.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
            paymentMethod,
            amountPaid,
          }
        );
      }
    },
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

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      items,
      transactionName,
      userId,
      userName,
    }: {
      id: string;
      items: { productId: string; quantity: number }[];
      transactionName: string;
      userId?: string;
      userName?: string;
    }) => {
      // Get transaction data for audit log before delete
      const transactions = await transactionService.getToday();
      const transaction = transactions.find(t => t.id === id);
      
      await transactionService.delete(id, items);
      
      if (userId && userName && transaction) {
        await createAuditLog(
          'sales',
          'delete',
          id,
          transactionName,
          userId,
          userName,
          {
            items: transaction.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
            paymentMethod: transaction.paymentMethod,
            total: transaction.total,
            amountPaid: transaction.amountPaid,
          },
          null
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Transaksi berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus transaksi');
      console.error('Delete transaction error:', error);
    },
  });
}

