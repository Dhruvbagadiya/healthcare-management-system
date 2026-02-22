'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Pill, Search, Filter, MoreHorizontal, Plus, AlertCircle, ShoppingBag } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function PharmacyPage() {
    const [medicines, setMedicines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 12;

    const fetchMedicines = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/pharmacy/medicines', {
                params: {
                    search: searchQuery,
                    page: pageNumber,
                    limit
                }
            });
            setMedicines(res.data.data);
            setTotalPages(res.data.meta.totalPages);
            setTotalItems(res.data.meta.total);
        } catch (error) {
            console.error('Failed to fetch medicines', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchMedicines(search, 1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchMedicines]);

    useEffect(() => {
        if (page > 1) {
            fetchMedicines(search, page);
        }
    }, [page, fetchMedicines]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Pharmacy</h1>
                    <p className="mt-1 text-slate-500">Manage medicine inventory and dispensing</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary gap-2">
                        <ShoppingBag size={18} />
                        Procurement
                    </button>
                    <button className="btn btn-primary gap-2">
                        <Plus size={18} />
                        Add Medicine
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search medicines by name or generic name..."
                        className="input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-secondary gap-2 text-sm font-medium">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="card h-48 animate-pulse bg-slate-50 border-slate-100" />
                    ))
                ) : (
                    medicines.map((medicine) => (
                        <div key={medicine.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                        <Pill size={20} />
                                    </div>
                                    <button className="p-1 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                                        {medicine.name}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                                        {medicine.genericName || 'Generic'}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="text-slate-500">Stock: </span>
                                        <span className={`font-bold ${medicine.quantity < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                                            {medicine.quantity} {medicine.unit || 'units'}
                                        </span>
                                    </div>
                                    {medicine.quantity < 20 && (
                                        <AlertCircle size={16} className="text-red-500 animate-pulse" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-lg font-bold text-indigo-600">${medicine.price || '0.00'}</span>
                                <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                    Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isLoading && medicines.length === 0 && (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                    <p className="text-slate-500 font-medium font-display">No medicines found matches your search.</p>
                    <button className="mt-4 text-indigo-600 font-bold hover:underline" onClick={() => setSearch('')}>
                        Clear Search
                    </button>
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="card !p-0 overflow-hidden shadow-sm border-slate-200 mt-8">
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
