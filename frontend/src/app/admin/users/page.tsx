'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import {
  Search,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  Check,
  Ban,
  Clock,
} from 'lucide-react';

interface UserRole {
  id: string;
  name: string;
  isSystemRole: boolean;
}

interface OrgUser {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
}

interface OrgRole {
  id: string;
  name: string;
  isSystemRole: boolean;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending_verification', label: 'Pending' },
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  pending_verification: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [orgRoles, setOrgRoles] = useState<OrgRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Modal state
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [modalType, setModalType] = useState<'roles' | 'status' | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (searchQuery = '', statusQ = '', pageNumber = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = { page: pageNumber, limit };
        if (searchQuery) params.search = searchQuery;
        if (statusQ) params.status = statusQ;
        const res = await apiClient.get('/admin/users', { params });
        setUsers(res.data.data);
        setTotalPages(res.data.meta?.totalPages || 1);
        setTotalItems(res.data.meta?.total || 0);
      } catch {
        // handled by global interceptor
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    apiClient.get('/rbac/roles').then((res) => setOrgRoles(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(search, statusFilter, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchUsers]);

  useEffect(() => {
    if (page > 1) fetchUsers(search, statusFilter, page);
  }, [page, fetchUsers]);

  const openRolesModal = (user: OrgUser) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map((r) => r.id));
    setModalType('roles');
  };

  const openStatusModal = (user: OrgUser) => {
    setSelectedUser(user);
    setSelectedStatus(user.status);
    setModalType('status');
  };

  const handleSaveRoles = async () => {
    if (!selectedUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}/roles`, { roleIds: selectedRoleIds });
      toast.success('Roles updated successfully');
      setModalType(null);
      fetchUsers(search, statusFilter, page);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}/status`, { status: selectedStatus });
      toast.success('Status updated successfully');
      setModalType(null);
      fetchUsers(search, statusFilter, page);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: OrgUser) => {
    if (!confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName}? This action cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      toast.success('User removed');
      fetchUsers(search, statusFilter, page);
    } catch {
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          View all users, assign roles, and manage access ({totalItems} users total)
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="hidden md:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Roles</th>
                <th className="hidden sm:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="hidden lg:table-cell px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Login</th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                      <td className="hidden md:table-cell px-5 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="hidden sm:table-cell px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="hidden lg:table-cell px-5 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                      <td className="px-5 py-4" />
                    </tr>
                  ))
                : users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm border border-indigo-100">
                            {user.firstName?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.userId}</p>
                            <div className="md:hidden flex flex-wrap gap-1 mt-1">
                              {user.roles.map((r) => (
                                <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold">{r.name}</span>
                              ))}
                            </div>
                            <div className="sm:hidden mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${STATUS_STYLES[user.status] || ''}`}>
                                {user.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span key={r.id} className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">{r.name}</span>
                          ))}
                          {user.roles.length === 0 && <span className="text-xs text-slate-400 italic">No roles</span>}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-bold capitalize ${STATUS_STYLES[user.status] || ''}`}>
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-5 py-4 text-sm text-slate-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Never'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openRolesModal(user)} title="Manage Roles" className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                            <ShieldCheck size={16} />
                          </button>
                          <button onClick={() => openStatusModal(user)} title="Change Status" className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                            <UserCheck size={16} />
                          </button>
                          <button onClick={() => handleDelete(user)} title="Delete User" className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && users.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <UserX size={32} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No users found</p>
              <p className="text-sm text-slate-500">{search ? `No results for "${search}".` : 'No users match the current filters.'}</p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={totalItems} limit={limit} />
          </div>
        )}
      </div>

      {/* Roles Modal */}
      {modalType === 'roles' && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manage Roles</h2>
                <p className="text-sm text-slate-500">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {orgRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{role.name}</p>
                        {role.isSystemRole && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Role</p>}
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setModalType(null)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSaveRoles} disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Roles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modalType === 'status' && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Change Status</h2>
                <p className="text-sm text-slate-500">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {[
                { value: 'active', label: 'Active', desc: 'Full access to the system', icon: UserCheck, styles: 'border-emerald-500 bg-emerald-50' },
                { value: 'inactive', label: 'Inactive', desc: 'Account deactivated', icon: UserX, styles: 'border-slate-500 bg-slate-50' },
                { value: 'suspended', label: 'Suspended', desc: 'Temporarily blocked', icon: Ban, styles: 'border-rose-500 bg-rose-50' },
                { value: 'pending_verification', label: 'Pending Verification', desc: 'Awaiting email verification', icon: Clock, styles: 'border-amber-500 bg-amber-50' },
              ].map((opt) => {
                const isSelected = selectedStatus === opt.value;
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => setSelectedStatus(opt.value)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border-2 transition-all text-left ${isSelected ? opt.styles : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <Icon size={18} className={isSelected ? 'text-slate-700' : 'text-slate-400'} />
                    <div>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setModalType(null)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSaveStatus} disabled={isSubmitting || selectedStatus === selectedUser.status}
                className="flex-1 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
