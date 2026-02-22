'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Beaker, Search, Filter, MoreHorizontal, Download, FlaskConical, ClipboardList } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function LaboratoryPage() {
  const [labTests, setLabTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchLabTests = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/laboratory/lab-tests', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setLabTests(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch lab tests', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLabTests(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchLabTests]);

  useEffect(() => {
    if (page > 1) {
      fetchLabTests(search, page);
    }
  }, [page, fetchLabTests]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Laboratory</h1>
          <p className="mt-1 text-slate-500">Monitor lab tests, results and diagnostic reports</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary gap-2">
            <Beaker size={18} />
            New Lab Order
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">Pending Tests</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">24</span>
              <span className="badge badge-warning text-[10px] font-bold">+4 new</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">Completed Today</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">42</span>
              <span className="badge badge-success text-[10px] font-bold">In Target</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">Critical Results</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-red-600">3</span>
              <span className="badge badge-error text-[10px] font-bold pulse">Action Required</span>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">Turnaround Time</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-indigo-600">4.2h</span>
              <span className="text-xs text-indigo-400 font-medium">Avg this week</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search lab tests by patient or test name..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 text-sm">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : (
                labTests.map((test) => (
                  <tr key={test.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                          <FlaskConical size={18} />
                        </div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {test.testName || 'Blood Routine'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {test.patient?.user?.firstName} {test.patient?.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{test.patient?.patientId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        Dr. {test.doctor?.user?.firstName} {test.doctor?.user?.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${test.status === 'completed' ? 'badge-success' :
                        test.status === 'pending' ? 'badge-warning' : 'badge-primary'
                        }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {test.status === 'completed' && (
                          <button className="p-1.5 rounded-full hover:bg-white hover:shadow-sm text-indigo-600 transition-all" title="View Report">
                            <ClipboardList size={18} />
                          </button>
                        )}
                        <button className="p-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && labTests.length === 0 && (
            <div className="py-20 text-center bg-white">
              <p className="text-slate-500 font-medium">No lab tests found matches your search.</p>
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
