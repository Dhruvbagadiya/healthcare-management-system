'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CompliancePage() {
  const [compliance, setCompliance] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ nonCompliant: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [compRes, logsRes, nonCompRes] = await Promise.all([
          apiClient.get('/compliance/records'),
          apiClient.get('/compliance/access-logs'),
          apiClient.get('/compliance/non-compliant'),
        ]);
        setCompliance(compRes.data.data || []);
        setLogs(logsRes.data.data || []);
        setStats({ nonCompliant: (nonCompRes.data || []).length, pending: 0 });
      } catch (error) {
        console.error('Failed to fetch compliance data', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Compliance & Audit</h1>
        <p className="mt-1 text-slate-500">Monitor HIPAA, data security, and regulatory compliance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Compliance Items</p>
              <p className="text-2xl font-bold text-slate-900">{compliance.length}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Non-Compliant</p>
              <p className="text-2xl font-bold text-slate-900">{stats.nonCompliant}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Audit Logs</p>
              <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900">Compliance Records</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {compliance.slice(0, 5).map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-slate-50">
                  <p className="font-medium text-slate-900">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.complianceType}</p>
                  <span className={`badge mt-2 ${item.status === 'compliant' ? 'badge-success' : item.status === 'non_compliant' ? 'badge-error' : 'badge-warning'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900">Recent Audit Logs</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="px-6 py-3 hover:bg-slate-50 text-sm border-l-2 border-blue-500">
                  <p className="font-medium text-slate-900">{log.action.toUpperCase()} - {log.entityType}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
