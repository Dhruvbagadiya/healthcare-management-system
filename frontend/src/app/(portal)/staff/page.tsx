'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Users, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchStaff = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/staff', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setStaff(res.data.data);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStaff(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchStaff]);

  useEffect(() => {
    if (page > 1) {
      fetchStaff(search, page);
    }
  }, [page, fetchStaff]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Staff Management</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage doctors, nurses, and healthcare professionals</p>
        </div>
        <button className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11">
          <Users size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{member.user?.firstName} {member.user?.lastName}</p>
                      <p className="text-xs text-slate-500">{member.staffId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-primary text-xs">{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.user?.phoneNumber || 'N/A'}
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
          {!isLoading && staff.length === 0 && (
            <div className="py-20 text-center bg-white">
              <p className="text-slate-500 font-medium">No staff found.</p>
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
