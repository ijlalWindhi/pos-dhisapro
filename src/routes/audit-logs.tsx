import { createFileRoute } from '@tanstack/react-router';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/audit-logs')({
  component: () => (
    <ProtectedRoute permission="audit_logs">
      <AuditLogsPage />
    </ProtectedRoute>
  ),
});
