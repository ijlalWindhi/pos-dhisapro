import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { productService } from '@/features/products/services/productService';
import type { Transaction, TransactionItem, CartItem } from '@/types';

const COLLECTION = 'transactions';

export const transactionService = {
  // Get all transactions
  async getAll(): Promise<Transaction[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Transaction[];
  },

  // Get transactions by date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Transaction[];
  },

  // Get today's transactions
  async getToday(): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getByDateRange(today, tomorrow);
  },

  // Create transaction and update stock
  async create(
    cart: CartItem[],
    paymentMethod: 'cash' | 'transfer' | 'qris',
    amountPaid: number,
    discount: number,
    cashierId: string,
    cashierName: string
  ): Promise<string> {
    const items: TransactionItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      buyPrice: item.product.buyPrice,
      subtotal: item.subtotal,
    }));

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - discount;

    // Create transaction
    const docRef = await addDoc(collection(db, COLLECTION), {
      type: 'sale',
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
      amountPaid,
      change: amountPaid - total,
      cashierId,
      cashierName,
      createdAt: serverTimestamp(),
    });

    // Update stock for each product
    for (const item of cart) {
      await productService.updateStock(item.product.id, -item.quantity);
    }

    return docRef.id;
  },

  // Get sales summary
  async getSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
  }> {
    const transactions = await this.getByDateRange(startDate, endDate);
    return {
      totalSales: transactions.reduce((sum, tx) => sum + tx.total, 0),
      totalTransactions: transactions.length,
    };
  },
};
