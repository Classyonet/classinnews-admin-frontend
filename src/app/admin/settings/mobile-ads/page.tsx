'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import { ArrowLeft, Plus, Power, Smartphone, Trash2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = getApiUrl();

interface MobilePlacement {
  id: string;
  placement_key: string;
  display_name: string;
  format: string;
  android_unit_id: string | null;
  ios_unit_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function MobileAdsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<MobilePlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    placement_key: 'app_home_banner',
    display_name: 'App home banner',
    format: 'banner',
    android_unit_id: '',
    ios_unit_id: '',
    is_active: false,
    sort_order: 0,
  });

  const load = async () => {
    if (!token) return;
    try {
      setError(null);
      setLoading(true);
      const res = await adminApiFetch(`${API_URL}/api/mobile-ads`, {}, token);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const toggle = async (id: string) => {
    const res = await adminApiFetch(`${API_URL}/api/mobile-ads/${id}/toggle`, { method: 'PATCH' }, token);
    if (res.ok) load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this placement?')) return;
    const res = await adminApiFetch(`${API_URL}/api/mobile-ads/${id}`, { method: 'DELETE' }, token);
    if (res.ok) load();
  };

  const saveRow = async (row: MobilePlacement) => {
    const res = await adminApiFetch(`${API_URL}/api/mobile-ads/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: row.display_name,
        format: row.format,
        android_unit_id: row.android_unit_id || null,
        ios_unit_id: row.ios_unit_id || null,
        sort_order: row.sort_order,
        is_active: row.is_active,
      }),
    }, token);
    if (res.ok) load();
    else alert((await res.json()).error || 'Save failed');
  };

  const create = async () => {
    if (!form.placement_key.trim() || !form.display_name.trim()) {
      alert('placement_key and display_name are required');
      return;
    }
    setCreating(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/mobile-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_key: form.placement_key.trim(),
          display_name: form.display_name.trim(),
          format: form.format,
          android_unit_id: form.android_unit_id.trim() || null,
          ios_unit_id: form.ios_unit_id.trim() || null,
          is_active: form.is_active,
          sort_order: form.sort_order,
        }),
      }, token);
      const j = await res.json();
      if (res.ok && j.success) {
        setForm({
          placement_key: 'app_article_banner',
          display_name: 'App article banner',
          format: 'banner',
          android_unit_id: '',
          ios_unit_id: '',
          is_active: false,
          sort_order: 1,
        });
        load();
      } else alert(j.error || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-7 h-7" />
              Mobile AdMob
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Unit IDs from AdMob (banner). The app reads{' '}
              <code className="bg-slate-200 px-1 rounded">app_home_banner</code> and{' '}
              <code className="bg-slate-200 px-1 rounded">app_article_banner</code> by default.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Add placement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="placement_key"
              value={form.placement_key}
              onChange={(e) => setForm({ ...form, placement_key: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="display_name"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              <option value="banner">banner</option>
              <option value="interstitial">interstitial (reserved)</option>
            </select>
            <input
              type="number"
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="sort_order"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="Android ad unit ID"
              value={form.android_unit_id}
              onChange={(e) => setForm({ ...form, android_unit_id: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="iOS ad unit ID"
              value={form.ios_unit_id}
              onChange={(e) => setForm({ ...form, ios_unit_id: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Placements</div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No rows yet. Create placements above.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <MobileRow
                  key={row.id}
                  row={row}
                  onChange={(r) => setRows(rows.map((x) => (x.id === r.id ? r : x)))}
                  onSave={() => saveRow(row)}
                  onToggle={() => toggle(row.id)}
                  onDelete={() => remove(row.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileRow({
  row,
  onChange,
  onSave,
  onToggle,
  onDelete,
}: {
  row: MobilePlacement;
  onChange: (r: MobilePlacement) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{row.placement_key}</code>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            title="Toggle active"
          >
            <Power className={`w-4 h-4 ${row.is_active ? 'text-green-600' : 'text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={row.display_name}
        onChange={(e) => onChange({ ...row, display_name: e.target.value })}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Android unit ID"
          value={row.android_unit_id || ''}
          onChange={(e) => onChange({ ...row, android_unit_id: e.target.value || null })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="iOS unit ID"
          value={row.ios_unit_id || ''}
          onChange={(e) => onChange({ ...row, ios_unit_id: e.target.value || null })}
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded-lg px-2 py-1 text-sm"
          value={row.format}
          onChange={(e) => onChange({ ...row, format: e.target.value })}
        >
          <option value="banner">banner</option>
          <option value="interstitial">interstitial</option>
        </select>
        <input
          type="number"
          className="border rounded-lg px-2 py-1 text-sm w-24"
          value={row.sort_order}
          onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={row.is_active}
            onChange={(e) => onChange({ ...row, is_active: e.target.checked })}
          />
          active
        </label>
        <button
          type="button"
          onClick={onSave}
          className="ml-auto text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  );
}
