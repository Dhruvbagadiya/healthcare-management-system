'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus, Search, Filter, MoreHorizontal, Download, DollarSign, CreditCard } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchInvoices = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/billing/invoices', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setInvoices(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchInvoices(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchInvoices]);

  useEffect(() => {
    if (page > 1) {
      fetchInvoices(search, page);
    }
  }, [page, fetchInvoices]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Billing</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Manage invoices, payments and financial records</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button className="btn btn-secondary gap-2 flex-1 sm:flex-none justify-center h-11">
            <Download size={18} />
            <span className="hidden xs:inline">Export</span>
            <span className="xs:hidden">Export</span>
          </button>
          <button className="btn btn-primary gap-2 flex-1 sm:flex-none justify-center h-11">
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-indigo-600 text-white border-none shadow-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Outstanding</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">$12,450.00</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
        <div className="card bg-emerald-600 text-white border-none shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Monthly Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">$45,820.00</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
        <div className="card bg-white border-slate-200 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900">18</h3>
            </div>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <FileText size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search invoices..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        INV-{invoice.invoiceNumber || '2026-001'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shadow-sm border border-slate-200/50">
                          {invoice.patient?.user?.firstName?.charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      ${invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'
                        }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
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
          {!isLoading && invoices.length === 0 && (
            <div className="py-20 text-center bg-white">
              <p className="text-slate-500 font-medium">No invoices found matches your search.</p>
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
