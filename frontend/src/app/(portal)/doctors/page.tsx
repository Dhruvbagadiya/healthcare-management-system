'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { UserCheck, Star, Mail, Phone, MoreVertical, Search, Filter } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 6; // Using 6 for grid layout 2x3 or 3x2

  const fetchDoctors = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/doctors', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setDoctors(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDoctors(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchDoctors]);

  useEffect(() => {
    if (page > 1) {
      fetchDoctors(search, page);
    }
  }, [page, fetchDoctors]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Doctors</h1>
          <p className="mt-1 text-slate-500">Manage medical staff and specialists</p>
        </div>
        <button className="btn btn-primary gap-2">
          <UserCheck size={18} />
          Add Doctor
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search doctors by name or specialization..."
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-slate-50 border-slate-100" />
          ))
        ) : (
          doctors.map((doctor) => (
            <div key={doctor.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm">
                    {doctor.user?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{doctor.specialization}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold border border-amber-100 shadow-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400 mr-1.5" />
                  {doctor.rating}
                </div>
                <div className="font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700">
                  {doctor.yearsOfExperience} years exp.
                </div>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-slate-50">
                <div className="flex items-center text-sm text-slate-500">
                  <Mail size={16} className="mr-3 text-slate-400" />
                  <span className="truncate">{doctor.user?.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Phone size={16} className="mr-3 text-slate-400" />
                  <span>{doctor.user?.phoneNumber || '+1 (555) 000-0000'}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="btn btn-secondary flex-1 py-2 text-sm">Profile</button>
                <button className="btn btn-primary flex-1 py-2 text-sm shadow-indigo-100">Schedule</button>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && doctors.length === 0 && (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">No doctors found matches your search.</p>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="card !p-0 overflow-hidden shadow-sm border-slate-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={totalItems}
            limit={limit}
          />
        </div>
      )}
    </div>
  );
}
