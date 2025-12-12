import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/auditLogService';
import type { AuditModule } from '@/types';

const QUERY_KEY = 'audit_logs';

export function useAuditLogs(
  startDate: Date,
  endDate: Date,
  moduleFilter?: AuditModule
) {
  return useQuery({
    queryKey: [QUERY_KEY, startDate.toISOString(), endDate.toISOString(), moduleFilter],
    queryFn: () => auditLogService.getByDateRange(startDate, endDate, moduleFilter),
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'always', // Always refetch when component mounts
  });
}

export function useRecentAuditLogs(count: number = 50) {
  return useQuery({
    queryKey: [QUERY_KEY, 'recent', count],
    queryFn: () => auditLogService.getRecent(count),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

