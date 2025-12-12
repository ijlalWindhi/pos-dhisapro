import { useState, useMemo } from 'react';
import { FileText, Search, Calendar, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { useAuditLogs } from './hooks/useAuditLogs';
import type { AuditLog, AuditModule, AuditAction } from '@/types';

const moduleLabels: Record<AuditModule, string> = {
  products: 'Produk',
  categories: 'Kategori',
  sales: 'Penjualan',
  brilink: 'BRILink',
  users: 'Pengguna',
  roles: 'Role',
};

const actionLabels: Record<AuditAction, string> = {
  create: 'Buat',
  update: 'Ubah',
  delete: 'Hapus',
};

const actionColors: Record<AuditAction, string> = {
  create: 'badge-success',
  update: 'badge-warning',
  delete: 'badge-danger',
};

// Get changed fields between before and after data
function getChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string[] {
  if (!before || !after) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    // Skip createdAt and updatedAt fields
    if (key === 'createdAt' || key === 'updatedAt') continue;
    
    const beforeVal = JSON.stringify(before[key]);
    const afterVal = JSON.stringify(after[key]);
    
    if (beforeVal !== afterVal) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

export function AuditLogsPage() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [moduleFilter, setModuleFilter] = useState<AuditModule | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Convert dates for query
  const startDateTime = useMemo(() => {
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDate]);

  const endDateTime = useMemo(() => {
    const d = new Date(endDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [endDate]);

  const { data: logs = [], isLoading } = useAuditLogs(
    startDateTime,
    endDateTime,
    moduleFilter || undefined
  );

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.entityName.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <MainLayout title="Audit Log">
      <div className="page-header">
        <div>
          <h2 className="page-title">Audit Log</h2>
          <p className="page-subtitle">Riwayat aktivitas pengguna</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Calendar size={14} className="inline mr-1" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                <Calendar size={14} className="inline mr-1" />
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Module Filter */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Filter size={14} className="inline mr-1" />
                Modul
              </label>
              <select
                className="form-select"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as AuditModule | '')}
              >
                <option value="">Semua Modul</option>
                {Object.entries(moduleLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="form-group mb-0">
              <label className="form-label">
                <Search size={14} className="inline mr-1" />
                Cari
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Log Aktivitas ({filteredLogs.length})
          </h3>
        </div>
        <div className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={28} />
              </div>
              <div className="empty-state-title">Tidak ada log</div>
              <p className="empty-state-description">Tidak ditemukan aktivitas pada rentang waktu yang dipilih</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const changedFields = getChangedFields(log.beforeData, log.afterData);
                
                return (
                  <div key={log.id} className="hover:bg-gray-50">
                    {/* Log Summary Row */}
                    <div 
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {log.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          {' '}
                          {log.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className={`badge ${actionColors[log.action]}`}>
                          {actionLabels[log.action]}
                        </span>
                        <span className="badge badge-secondary">
                          {moduleLabels[log.module]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{log.entityName}</span>
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          oleh <span className="font-medium">{log.userName}</span>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm ml-2">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Before Data */}
                            <div>
                              <div className="text-sm font-semibold text-gray-600 mb-2">
                                Data Sebelum {log.action === 'create' ? '(N/A)' : ''}
                              </div>
                              {log.beforeData ? (
                                <pre className="bg-white border rounded-lg p-3 text-xs overflow-auto max-h-64">
                                  <code>
                                    {JSON.stringify(log.beforeData, null, 2).split('\n').map((line, i) => {
                                      const fieldMatch = line.match(/"([^"]+)":/);
                                      const fieldName = fieldMatch ? fieldMatch[1] : null;
                                      const isChanged = fieldName && changedFields.includes(fieldName);
                                      return (
                                        <span key={i} className={isChanged ? 'bg-red-100 block' : ''}>
                                          {line}
                                          {'\n'}
                                        </span>
                                      );
                                    })}
                                  </code>
                                </pre>
                              ) : (
                                <div className="bg-white border rounded-lg p-3 text-sm text-gray-400 italic">
                                  Tidak ada data (baru dibuat)
                                </div>
                              )}
                            </div>

                            {/* After Data */}
                            <div>
                              <div className="text-sm font-semibold text-gray-600 mb-2">
                                Data Sesudah {log.action === 'delete' ? '(N/A)' : ''}
                              </div>
                              {log.afterData ? (
                                <pre className="bg-white border rounded-lg p-3 text-xs overflow-auto max-h-64">
                                  <code>
                                    {JSON.stringify(log.afterData, null, 2).split('\n').map((line, i) => {
                                      const fieldMatch = line.match(/"([^"]+)":/);
                                      const fieldName = fieldMatch ? fieldMatch[1] : null;
                                      const isChanged = fieldName && changedFields.includes(fieldName);
                                      return (
                                        <span key={i} className={isChanged ? 'bg-green-100 block' : ''}>
                                          {line}
                                          {'\n'}
                                        </span>
                                      );
                                    })}
                                  </code>
                                </pre>
                              ) : (
                                <div className="bg-white border rounded-lg p-3 text-sm text-gray-400 italic">
                                  Data dihapus
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Changed Fields Summary */}
                          {changedFields.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-xs text-gray-500">
                                <span className="font-semibold">Field yang berubah:</span>{' '}
                                {changedFields.map((field, i) => (
                                  <span key={field}>
                                    <code className="bg-yellow-100 px-1 rounded">{field}</code>
                                    {i < changedFields.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Log</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {/* Content is inline now in expandable rows */}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
