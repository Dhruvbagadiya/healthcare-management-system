'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Building2, Bed, BarChart3, Search, Filter, MoreHorizontal, Plus, X, Trash2, Layers, MapPin } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function WardsPage() {
  const [wards, setWards] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWards: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    wardName: '',
    wardType: 'General',
    totalBeds: 20,
    availableBeds: 20,
    floor: '1st Floor',
    status: 'active'
  });

  const limit = 10;

  const fetchData = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const [wardsRes, statsRes] = await Promise.all([
        apiClient.get('/wards', {
          params: {
            search: searchQuery,
            page: pageNumber,
            limit
          }
        }),
        apiClient.get('/wards/stats'),
      ]);
      setWards(wardsRes.data.data || []);
      setTotalPages(wardsRes.data.meta?.totalPages || 1);
      setTotalItems(wardsRes.data.meta?.total || 0);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch wards', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchData]);

  useEffect(() => {
    if (page > 1) {
      fetchData(search, page);
    }
  }, [page, fetchData]);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/wards', {
        ...formData,
        availableBeds: formData.totalBeds // Initial available = total
      });
      setIsModalOpen(false);
      setFormData({
        wardName: '',
        wardType: 'General',
        totalBeds: 20,
        availableBeds: 20,
        floor: '1st Floor',
        status: 'active'
      });
      fetchData(search, page);
    } catch (error) {
      console.error('Failed to create ward', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ward? All bed allocations will be cleared.')) return;
    try {
      await apiClient.delete(`/wards/${id}`);
      fetchData(search, page);
    } catch (error) {
      console.error('Failed to delete ward', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Ward Management</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage hospital wards, bed allocation and occupancy</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          <span>Add Ward</span>
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Wards</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900 font-display">{stats.totalWards}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-sm">
              <Bed size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Beds</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900 font-display">{stats.totalBeds}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900 font-display">{stats.occupiedBeds}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200 p-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shadow-sm">
              <Bed size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900 font-display">{stats.availableBeds}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by ward name or type..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ward Name / Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Capacity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Occupied</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Available</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Location</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                wards.map((ward) => (
                  <tr key={ward.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                          {ward.wardName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{ward.wardType} Ward</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-700">{ward.totalBeds} <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Beds</span></p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <p className="text-sm font-bold text-slate-700">{ward.occupiedBeds}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${ward.availableBeds > 5 ? 'badge-success' : ward.availableBeds > 0 ? 'badge-warning' : 'badge-error'} font-bold text-[10px]`}>
                        {ward.availableBeds} <span className="hidden sm:inline">Available</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {ward.floor}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(ward.id)}
                          className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && wards.length === 0 && (
            <div className="py-20 text-center bg-white">
              <p className="text-slate-500 font-medium font-display text-sm">No wards found matches your search.</p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100">
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


      {/* Add Ward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add New Ward</h2>
                <p className="text-sm text-slate-500">Configure new hospital ward and bed capacity</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWard} className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ward Name</label>
                  <input required className="input h-11" placeholder="e.g. ICU-North" value={formData.wardName} onChange={e => setFormData({ ...formData, wardName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Layers size={14} /> Ward Type</label>
                  <select required className="input h-11" value={formData.wardType} onChange={e => setFormData({ ...formData, wardType: e.target.value })}>
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Total Bed Capacity</label>
                  <input type="number" required className="input h-11" value={formData.totalBeds} onChange={e => setFormData({ ...formData, totalBeds: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={14} /> Floor / Location</label>
                  <select required className="input h-11" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select required className="input h-11" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active (Operational)</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold"
                >
                  Create Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

