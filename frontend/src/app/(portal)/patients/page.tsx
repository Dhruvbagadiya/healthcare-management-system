'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, UserPlus, Filter, MoreHorizontal } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchPatients = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/patients', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      // The backend now returns { data: T[], meta: { total, page, limit, totalPages } }
      setPatients(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchPatients(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPatients]);

  useEffect(() => {
    if (page > 1) {
      fetchPatients(search, page);
    }
  }, [page, fetchPatients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Patients</h1>
          <p className="mt-1 text-slate-500">Manage patient records and medical history</p>
        </div>
        <button className="btn btn-primary gap-2">
          <UserPlus size={18} />
          Add Patient
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shadow-sm">
                          {patient.user?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {patient.user?.firstName} {patient.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{patient.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{patient.patientId}</td>
                    <td className="px-6 py-4">
                      <span className="badge badge-primary">{patient.bloodType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && patients.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 font-medium">No patients found matches your search.</p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={totalItems}
            limit={limit}
          />
        )}
      </div>
    </div>
  );
}
