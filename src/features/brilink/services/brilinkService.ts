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
import type { BRILinkTransaction, BRILinkFormData, SavedBRILinkAccount } from '@/types';

const COLLECTION = 'brilink_transactions';
const SAVED_ACCOUNTS_COLLECTION = 'brilink_saved_accounts';

// Helper function to get start of day in local timezone
function getStartOfDay(date: Date = new Date()): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

// Helper function to get end of day in local timezone (23:59:59.999)
function getEndOfDay(date: Date = new Date()): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export const brilinkService = {
  // Get all transactions
  async getAll(): Promise<BRILinkTransaction[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      profitCategory: doc.data().profitCategory || 'brilink', // default for backward compat
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
      profitCategory: doc.data().profitCategory || 'brilink', // default for backward compat
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as BRILinkTransaction[];
  },

  // Get today's transactions
  async getToday(): Promise<BRILinkTransaction[]> {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();
    return this.getByDateRange(startOfDay, endOfDay);
  },

  // Create transaction
  async create(
    data: BRILinkFormData,
    operatorId: string,
    operatorName: string
  ): Promise<string> {
    // Save account if requested
    if (data.saveAccount && data.accountName && data.accountNumber) {
      await this.saveAccount(data.accountName, data.accountNumber);
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      transactionType: data.transactionType,
      profitCategory: data.profitCategory,
      description: data.transactionType === 'propana' 
        ? `${data.customerName || 'Pelanggan'} - ${data.accountNumber}`
        : `${data.accountName} - ${data.accountNumber}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      adminFee: data.adminFee,
      profit: data.profit,
      endingBalance: data.endingBalance || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      operatorId,
      operatorName,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Get profit summary with category breakdown
  async getSummary(startDate: Date, endDate: Date): Promise<{
    totalProfit: number;
    totalTransactions: number;
    brilinkProfit: number;
    griyaBayarProfit: number;
    propanaProfit: number;
  }> {
    const transactions = await this.getByDateRange(startDate, endDate);
    return {
      totalProfit: transactions.reduce((sum, tx) => sum + tx.profit, 0),
      totalTransactions: transactions.length,
      brilinkProfit: transactions
        .filter(tx => tx.profitCategory === 'brilink' || !tx.profitCategory)
        .reduce((sum, tx) => sum + tx.profit, 0),
      griyaBayarProfit: transactions
        .filter(tx => tx.profitCategory === 'griya_bayar')
        .reduce((sum, tx) => sum + tx.profit, 0),
      propanaProfit: transactions
        .filter(tx => tx.profitCategory === 'propana')
        .reduce((sum, tx) => sum + tx.profit, 0),
    };
  },

  // Get today's profit
  async getTodaySummary(): Promise<{ 
    totalProfit: number; 
    totalTransactions: number;
    brilinkProfit: number;
    griyaBayarProfit: number;
    propanaProfit: number;
  }> {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();
    return this.getSummary(startOfDay, endOfDay);
  },

  // Update transaction
  async update(id: string, data: BRILinkFormData): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      transactionType: data.transactionType,
      profitCategory: data.profitCategory,
      description: data.transactionType === 'propana' 
        ? `${data.customerName || 'Pelanggan'} - ${data.accountNumber}`
        : `${data.accountName} - ${data.accountNumber}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      adminFee: data.adminFee,
      profit: data.profit,
      endingBalance: data.endingBalance || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
    });
  },

  // Search transactions by text (name, account number, phone) - ignores date
  async search(searchTerm: string): Promise<BRILinkTransaction[]> {
    if (!searchTerm.trim()) return [];
    
    // Firestore doesn't support full-text search, so we fetch all and filter
    const allTransactions = await this.getAll();
    const term = searchTerm.toLowerCase().trim();
    
    return allTransactions.filter(tx => 
      tx.accountName?.toLowerCase().includes(term) ||
      tx.accountNumber?.toLowerCase().includes(term) ||
      tx.customerName?.toLowerCase().includes(term) ||
      tx.customerPhone?.toLowerCase().includes(term) ||
      tx.description?.toLowerCase().includes(term)
    );
  },

  // === Saved Accounts ===
  async getSavedAccounts(): Promise<SavedBRILinkAccount[]> {
    const q = query(collection(db, SAVED_ACCOUNTS_COLLECTION), orderBy('accountName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as SavedBRILinkAccount[];
  },

  async saveAccount(accountName: string, accountNumber: string): Promise<string> {
    // Check if already exists
    const existing = await this.getSavedAccounts();
    const found = existing.find(acc => acc.accountNumber === accountNumber);
    if (found) return found.id;

    const docRef = await addDoc(collection(db, SAVED_ACCOUNTS_COLLECTION), {
      accountName,
      accountNumber,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },
};

