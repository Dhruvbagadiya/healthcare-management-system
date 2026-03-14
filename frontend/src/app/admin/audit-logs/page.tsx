'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, Activity, Shield, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  status: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  const fetchLogs = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/compliance/access-logs', {
        params: { page: pageNum, limit },
      });
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.entityType.toLowerCase().includes(search.toLowerCase()) ||
          log.userId.toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track all system activity and data access events ({total} entries)</p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 justify-center"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Filter by action, entity type, or user..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="hidden sm:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="hidden md:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User ID</th>
                <th className="hidden lg:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-5 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="hidden lg:table-cell px-5 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                : filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Activity size={14} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{log.action}</p>
                            <p className="sm:hidden text-[10px] text-slate-400">
                              {log.entityType} · {log.entityId !== 'N/A' ? log.entityId : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5">
                        <p className="text-sm text-slate-700 font-medium">{log.entityType}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.entityId !== 'N/A' ? log.entityId : '-'}</p>
                      </td>
                      <td className="hidden md:table-cell px-5 py-3.5">
                        <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{log.userId}</p>
                      </td>
                      <td className="hidden lg:table-cell px-5 py-3.5">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && filteredLogs.length === 0 && (
            <div className="py-20 text-center">
              <Shield size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No audit logs found</p>
              <p className="text-sm text-slate-500 mt-1">
                {search ? `No logs matching "${search}"` : 'Activity logs will appear here as the system is used'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
