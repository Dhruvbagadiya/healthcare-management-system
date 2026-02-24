'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Building2, Bed, BarChart3 } from 'lucide-react';

export default function WardsPage() {
  const [wards, setWards] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWards: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [wardsRes, statsRes] = await Promise.all([
          apiClient.get('/wards'),
          apiClient.get('/wards/stats'),
        ]);
        setWards(wardsRes.data || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch wards', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Ward Management</h1>
        <p className="mt-1 text-slate-500">Manage hospital wards and bed allocation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Total Wards</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalWards}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Bed size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Total Beds</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalBeds}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Occupied</p>
              <p className="text-2xl font-bold text-slate-900">{stats.occupiedBeds}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Bed size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Available</p>
              <p className="text-2xl font-bold text-slate-900">{stats.availableBeds}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">Wards Overview</h3>
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
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Ward Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Total Beds</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Occupied</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wards.map((ward) => (
                  <tr key={ward.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{ward.wardName}</td>
                    <td className="px-6 py-4 text-slate-600">{ward.totalBeds}</td>
                    <td className="px-6 py-4 text-slate-600">{ward.occupiedBeds}</td>
                    <td className="px-6 py-4"><span className="badge badge-success">{ward.totalBeds - ward.occupiedBeds}</span></td>
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
