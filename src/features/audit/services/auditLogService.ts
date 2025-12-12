import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AuditLog, AuditModule, AuditAction } from '@/types';

const COLLECTION = 'audit_logs';

export const auditLogService = {
  // Log an action
  async log(
    module: AuditModule,
    action: AuditAction,
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    beforeData: Record<string, unknown> | null,
    afterData: Record<string, unknown> | null
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      module,
      action,
      entityId,
      entityName,
      userId,
      userName,
      beforeData,
      afterData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Get logs by date range and optional module filter
  async getByDateRange(
    startDate: Date,
    endDate: Date,
    moduleFilter?: AuditModule
  ): Promise<AuditLog[]> {
    let q;
    
    if (moduleFilter) {
      q = query(
        collection(db, COLLECTION),
        where('module', '==', moduleFilter),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AuditLog[];
  },

  // Get recent logs
  async getRecent(count: number = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AuditLog[];
  },
};

// Helper function to create audit log easily
export async function createAuditLog(
  module: AuditModule,
  action: AuditAction,
  entityId: string,
  entityName: string,
  userId: string,
  userName: string,
  beforeData: Record<string, unknown> | null = null,
  afterData: Record<string, unknown> | null = null
): Promise<void> {
  try {
    await auditLogService.log(
      module,
      action,
      entityId,
      entityName,
      userId,
      userName,
      beforeData,
      afterData
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}
