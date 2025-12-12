import { 
  collection, 
  getDocs, 
  addDoc,
  doc,
  updateDoc, 
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

  // Update transaction (simple edits - payment method, amount paid)
  async update(
    id: string,
    data: {
      paymentMethod?: 'cash' | 'transfer' | 'qris';
      amountPaid?: number;
    }
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    const updateData: Record<string, unknown> = {};
    
    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }
    if (data.amountPaid !== undefined) {
      updateData.amountPaid = data.amountPaid;
      // Recalculate change if amountPaid is provided
      // Note: This requires getting the current total, which we handle in the component
    }
    
    await updateDoc(docRef, updateData);
  },

  // Update transaction with items (handles stock changes)
  async updateWithItems(
    id: string,
    originalItems: { productId: string; quantity: number }[],
    newItems: { productId: string; productName: string; quantity: number; price: number; buyPrice: number; subtotal: number }[],
    paymentMethod: 'cash' | 'transfer' | 'qris',
    amountPaid: number
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    
    // Calculate stock differences and update product stock
    for (const originalItem of originalItems) {
      const newItem = newItems.find(ni => ni.productId === originalItem.productId);
      const newQty = newItem ? newItem.quantity : 0;
      const qtyDiff = originalItem.quantity - newQty;
      
      // qtyDiff > 0 means we're returning stock (quantity decreased)
      // qtyDiff < 0 means we're taking more stock (quantity increased)
      if (qtyDiff !== 0) {
        await productService.updateStock(originalItem.productId, qtyDiff);
      }
    }
    
    // Check for new products that weren't in original (shouldn't happen but safety check)
    for (const newItem of newItems) {
      const originalItem = originalItems.find(oi => oi.productId === newItem.productId);
      if (!originalItem && newItem.quantity > 0) {
        // New product added - decrease stock
        await productService.updateStock(newItem.productId, -newItem.quantity);
      }
    }
    
    // Calculate new totals
    const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal; // No discount
    const change = amountPaid - total;
    
    await updateDoc(docRef, {
      items: newItems,
      subtotal,
      total,
      paymentMethod,
      amountPaid,
      change,
    });
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
