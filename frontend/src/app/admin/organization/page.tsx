'use client';

import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { useSubscription } from '@/hooks/use-subscription';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
  Building2,
  Globe,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  Crown,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';

export default function AdminOrganizationPage() {
  const { organization, isLoading, error } = useOrganization();
  const { plan } = useSubscription();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setLogoUrl(organization.logoUrl || '');
      const settings = (organization.settings || {}) as Record<string, any>;
      setContactEmail(settings.contactEmail || '');
      setContactPhone(settings.contactPhone || '');
      setStreet(settings.street || '');
      setCity(settings.city || '');
      setState(settings.state || '');
      setCountry(settings.country || '');
      setPostalCode(settings.postalCode || '');
      setWorkingHoursStart(settings.workingHoursStart || '09:00');
      setWorkingHoursEnd(settings.workingHoursEnd || '18:00');
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch(`/organizations/${organization.id}`, {
        name,
        logoUrl,
        settings: {
          ...(organization.settings || {}),
          contactEmail, contactPhone,
          street, city, state, country, postalCode,
          workingHoursStart, workingHoursEnd,
        },
      });
      toast.success('Settings saved successfully');
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="rounded-2xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
        <p className="text-rose-600 font-semibold">{error || 'Organization not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your hospital identity, address, and working hours</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-indigo-600" />
              General Information
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hospital Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. City General Hospital" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">URL Slug</label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">aarogentix.com/</span>
                  <input type="text" disabled defaultValue={organization.slug}
                    className="w-full h-11 px-4 rounded-r-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Logo (URL)</label>
              <div className="flex gap-4">
                <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1" />
                <div className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="info@hospital.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Phone</label>
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+91 1234567890" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Address
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Street Address</label>
              <input type="text" value={street} onChange={(e) => setStreet(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="123 Medical Drive" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Jaipur" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">State</label>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Rajasthan" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="India" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Postal Code</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="302001" />
              </div>
            </div>
          </section>

          {/* Working Hours */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Clock className="h-5 w-5 text-indigo-600" />
              Working Hours
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Start Time</label>
                <input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">End Time</label>
                <input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </section>

          {saveError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-sm text-rose-600 font-medium">{saveError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 h-11 px-6 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -m-8 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <ShieldCheck className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="font-bold text-lg">Trust & Security</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">All data is encrypted and tenant-isolated per HIPAA standards.</p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Security Managed
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Globe className="h-5 w-5 text-indigo-600" />
              Public Identity
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portal URL</p>
              <p className="text-xs font-mono text-indigo-600 truncate">https://{organization.slug}.aarogentix.com</p>
            </div>
          </div>

          {plan && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Subscription
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase tracking-wider">{plan}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Currently on the <span className="font-bold capitalize text-slate-700">{plan}</span> plan.
              </p>
              <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View Plans <ChevronRight size={14} />
              </button>
            </div>
          )}

          {(city || state || country) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Location
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {[street, city, state, postalCode, country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
