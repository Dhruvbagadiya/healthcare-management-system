'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus, User, UserCheck, Pill, MoreHorizontal, Search, Filter } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  const fetchPrescriptions = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/prescriptions', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setPrescriptions(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch prescriptions', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPrescriptions(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPrescriptions]);

  useEffect(() => {
    if (page > 1) {
      fetchPrescriptions(search, page);
    }
  }, [page, fetchPrescriptions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Prescriptions</h1>
          <p className="mt-1 text-slate-500">Manage digital prescriptions and history</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search prescriptions..."
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

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-50 border-slate-100" />
          ))
        ) : (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                      Prescription #{prescription.prescriptionNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Standard Medical Prescription • {new Date(prescription.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${prescription.status === 'active' ? 'badge-success' : 'badge-primary'
                    }`}>
                    {prescription.status}
                  </span>
                  <button className="p-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                    <p className="text-sm font-bold text-slate-900">
                      {prescription.patient?.user?.firstName} {prescription.patient?.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                    <p className="text-sm font-bold text-slate-900">
                      Dr. {prescription.doctor?.user?.firstName} {prescription.doctor?.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:justify-end">
                  <button className="btn btn-secondary text-xs py-1.5 px-3">View Details</button>
                  <button className="btn btn-primary text-xs py-1.5 px-3 shadow-indigo-100">Download PDF</button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                {prescription.medicines?.map((med: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                    <Pill size={14} className="text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">{med.medicineName}</span>
                    <span className="text-xs text-slate-500 font-medium">({med.dosage})</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && prescriptions.length === 0 && (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">No prescriptions found matches your search.</p>
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
