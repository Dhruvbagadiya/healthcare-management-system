'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState({ lowStock: 0, expired: 0, stockValue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/inventory');
        setInventory(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch inventory', error);
      }

      try {
        const low = await apiClient.get('/inventory/low-stock');
        const expired = await apiClient.get('/inventory/expired');
        const value = await apiClient.get('/inventory/stock-value');
        setStats({
          lowStock: (low.data || []).length,
          expired: (expired.data || []).length,
          stockValue: value.data?.stockValue || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
      setIsLoading(false);
    };
    fetchInventory();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Inventory Management</h1>
        <p className="mt-1 text-slate-500">Track medical supplies, equipment, and medicines</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Expired Items</p>
              <p className="text-2xl font-bold text-slate-900">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">Inventory Items</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Item</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.itemName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4"><span className="text-xs font-medium text-slate-600">{item.type}</span></td>
                    <td className="px-6 py-4">
                      <span className={`badge ${item.status === 'in_stock' ? 'badge-success' : item.status === 'low_stock' ? 'badge-warning' : 'badge-error'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
