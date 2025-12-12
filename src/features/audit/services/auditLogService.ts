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
    // Fetch all logs in date range, filter by module client-side
    // This avoids needing a composite index in Firestore
    const q = query(
      collection(db, COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
    
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AuditLog[];
    
    // Filter by module client-side if specified
    if (moduleFilter) {
      logs = logs.filter(log => log.module === moduleFilter);
    }
    
    return logs;
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
    // Validate required fields
    if (!module || !action || !entityId || !entityName) {
      console.warn('Audit log skipped: missing required fields', { module, action, entityId, entityName });
      return;
    }
    
    // Use fallback for missing user info
    const safeUserId = userId || 'unknown';
    const safeUserName = userName || 'Unknown User';
    
    if (!userId || !userName) {
      console.warn('Audit log: missing user info, using fallback', { userId, userName });
    }
    
    const logId = await auditLogService.log(
      module,
      action,
      entityId,
      entityName,
      safeUserId,
      safeUserName,
      beforeData,
      afterData
    );
    
    console.log(`Audit log created: ${action} ${module} - ${entityName} (ID: ${logId})`);
  } catch (error) {
    // Log the error with details for debugging
    console.error('Failed to create audit log:', {
      error,
      module,
      action,
      entityId,
      entityName,
      userId,
      userName,
    });
    // Don't throw - audit logging should not break the main operation
  }
}

