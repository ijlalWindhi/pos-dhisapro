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
import type { BRILinkTransaction, BRILinkFormData } from '@/types';

const COLLECTION = 'brilink_transactions';

export const brilinkService = {
  // Get all transactions
  async getAll(): Promise<BRILinkTransaction[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as BRILinkTransaction[];
  },

  // Get transactions by date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<BRILinkTransaction[]> {
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
    })) as BRILinkTransaction[];
  },

  // Get today's transactions
  async getToday(): Promise<BRILinkTransaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getByDateRange(today, tomorrow);
  },

  // Create transaction
  async create(
    data: BRILinkFormData,
    operatorId: string,
    operatorName: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      transactionType: data.transactionType,
      description: `${data.accountName} - ${data.accountNumber}`, // for backward compat
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      adminFee: data.adminFee,
      profit: data.profit,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      operatorId,
      operatorName,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Get profit summary
  async getSummary(startDate: Date, endDate: Date): Promise<{
    totalProfit: number;
    totalTransactions: number;
  }> {
    const transactions = await this.getByDateRange(startDate, endDate);
    return {
      totalProfit: transactions.reduce((sum, tx) => sum + tx.profit, 0),
      totalTransactions: transactions.length,
    };
  },

  // Get today's profit
  async getTodaySummary(): Promise<{ totalProfit: number; totalTransactions: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getSummary(today, tomorrow);
  },

  // Update transaction
  async update(id: string, data: BRILinkFormData): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      transactionType: data.transactionType,
      description: `${data.accountName} - ${data.accountNumber}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      adminFee: data.adminFee,
      profit: data.profit,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
    });
  },
};
