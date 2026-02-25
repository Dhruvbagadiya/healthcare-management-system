'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Calendar as CalendarIcon, Clock, MoreHorizontal, Plus, Search, Filter } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchAppointments = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/appointments', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setAppointments(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch appointments', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAppointments(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchAppointments]);

  useEffect(() => {
    if (page > 1) {
      fetchAppointments(search, page);
    }
  }, [page, fetchAppointments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Appointments</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Schedule and manage patient consultations</p>
        </div>
        <button className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11">
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search appointments..."
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

      <div className="grid gap-6">
        <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
                            {app.patient?.user?.firstName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {app.patient?.user?.firstName} {app.patient?.user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{app.patient?.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 truncate">
                          Dr. {app.doctor?.user?.firstName} {app.doctor?.user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{app.doctor?.specialization}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-700 font-medium">
                            <CalendarIcon size={14} className="mr-1.5 text-indigo-400" />
                            {new Date(app.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-slate-500">
                            <Clock size={14} className="mr-1.5 text-slate-400" />
                            {app.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${app.status === 'completed' ? 'badge-success' :
                          app.status === 'scheduled' ? 'badge-primary' : 'badge-warning'
                          }`}>
                          {app.status}
                        </span>
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
            {!isLoading && appointments.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-slate-500 font-medium">No appointments scheduled.</p>
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
    </div>
  );
}
