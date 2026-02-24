'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Stethoscope, Clock, CheckCircle } from 'lucide-react';

export default function OperationTheaterPage() {
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSurgeries = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/operation-theater/surgeries');
        setSurgeries(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch surgeries', error);
      }
      setIsLoading(false);
    };
    fetchSurgeries();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Operation Theater</h1>
          <p className="mt-1 text-slate-500">Schedule and manage surgical procedures</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Surgeries</p>
              <p className="text-2xl font-bold text-slate-900">{surgeries.length}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{surgeries.filter(s => s.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{surgeries.filter(s => s.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">Scheduled Surgeries</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Surgery Type</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Surgeon</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surgeries.slice(0, 10).map((surgery) => (
                  <tr key={surgery.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{surgery.surgeryType}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(surgery.scheduledDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">Dr. {surgery.surgeonId}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${surgery.status === 'completed' ? 'badge-success' : surgery.status === 'in_progress' ? 'badge-warning' : 'badge-primary'}`}>
                        {surgery.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
