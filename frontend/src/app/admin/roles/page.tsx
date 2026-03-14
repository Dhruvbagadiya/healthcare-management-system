'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  Lock,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: Permission[];
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/rbac/roles'),
        apiClient.get('/rbac/permissions'),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    const cat = perm.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormPermissions([]);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormPermissions(role.permissions.map((p) => p.name));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await apiClient.patch(`/rbac/roles/${editingRole.id}`, {
          name: formName,
          description: formDescription,
          permissionNames: formPermissions,
        });
        toast.success('Role updated successfully');
      } else {
        await apiClient.post('/rbac/roles', {
          name: formName,
          description: formDescription,
          permissionNames: formPermissions,
        });
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystemRole) { toast.error('System roles cannot be deleted'); return; }
    if (!confirm(`Delete role "${role.name}"? Users with this role will lose associated permissions.`)) return;
    try {
      await apiClient.delete(`/rbac/roles/${role.id}`);
      toast.success('Role deleted');
      fetchData();
    } catch {
    }
  };

  const togglePermission = (name: string) => {
    setFormPermissions((prev) => prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]);
  };

  const toggleCategory = (category: string) => {
    const perms = permissionsByCategory[category].map((p) => p.name);
    const allSelected = perms.every((p) => formPermissions.includes(p));
    setFormPermissions((prev) => allSelected ? prev.filter((p) => !perms.includes(p)) : [...new Set([...prev, ...perms])]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">Define roles and assign granular permissions ({roles.length} roles, {allPermissions.length} permissions)</p>
        </div>
        <button onClick={openCreateModal} className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 justify-center">
          <Plus size={18} />
          Create Role
        </button>
      </div>

      {/* Roles List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-pulse">
                <div className="h-5 w-40 bg-slate-100 rounded mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded" />
              </div>
            ))
          : roles.map((role) => {
              const isExpanded = expandedRole === role.id;
              return (
                <div key={role.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="flex items-center gap-3 flex-1 text-left">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${role.isSystemRole ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {role.isSystemRole ? <Lock size={18} /> : <ShieldCheck size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 capitalize">{role.name}</p>
                          {role.isSystemRole && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">System</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{role.description || `${role.permissions.length} permissions`}</p>
                      </div>
                      {isExpanded ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => openEditModal(role)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Pencil size={16} />
                      </button>
                      {!role.isSystemRole && (
                        <button onClick={() => handleDelete(role)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                      {role.permissions.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No permissions assigned</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(
                            role.permissions.reduce((acc, p) => {
                              const cat = p.category || 'Other';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(p);
                              return acc;
                            }, {} as Record<string, Permission[]>),
                          ).map(([category, perms]) => (
                            <div key={category}>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{category}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {perms.map((p) => (
                                  <span key={p.id} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">{p.name}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                <p className="text-sm text-slate-500">{editingRole ? 'Update permissions for this role' : 'Define a new role with specific permissions'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role Name</label>
                  <input required className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., lab_manager" value={formName} onChange={(e) => setFormName(e.target.value)} disabled={editingRole?.isSystemRole} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <input className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">Permissions ({formPermissions.length} selected)</h3>
                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const allSelected = perms.every((p) => formPermissions.includes(p.name));
                  const someSelected = !allSelected && perms.some((p) => formPermissions.includes(p.name));
                  return (
                    <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-bold text-slate-700">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{perms.filter((p) => formPermissions.includes(p.name)).length}/{perms.length}</span>
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-indigo-600 border-indigo-600' : someSelected ? 'bg-indigo-200 border-indigo-400' : 'border-slate-300 bg-white'}`}>
                            {(allSelected || someSelected) && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      </button>
                      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isChecked = formPermissions.includes(perm.name);
                          return (
                            <button key={perm.id} type="button" onClick={() => togglePermission(perm.name)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${isChecked ? 'bg-indigo-50 border border-indigo-200' : 'border border-transparent hover:bg-slate-50'}`}>
                              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                {isChecked && <Check size={10} className="text-white" />}
                              </div>
                              <span className={`text-xs font-semibold ${isChecked ? 'text-indigo-700' : 'text-slate-600'}`}>{perm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
