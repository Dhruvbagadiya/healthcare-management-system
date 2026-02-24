'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PieChart, DollarSign, TrendingUp } from 'lucide-react';

export default function AccountsPage() {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [_isLoading, _setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      _setIsLoading(true);
      try {
        const res = await apiClient.get('/accounts/financial-summary');
        setSummary(res.data);
      } catch (error) {
        console.error('Failed to fetch financial summary', error);
      }
      _setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Accounts & Finance</h1>
        <p className="mt-1 text-slate-500">Manage expenses, revenue, and financial reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">₹{(summary.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">₹{(summary.totalExpenses || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`card shadow-sm border-slate-200 ${summary.netProfit >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${summary.netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <PieChart size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Net Profit</p>
              <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{(summary.netProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Recent Expenses</h3>
          </div>
          <div className="p-6 text-center text-slate-500">
            Loading expenses...
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Revenue Breakdown</h3>
          </div>
          <div className="p-6 text-center text-slate-500">
            Loading revenue data...
          </div>
        </div>
      </div>
    </div>
  );
}
