'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import { ArrowLeft, Plus, Power, Radio, Trash2, Tv } from 'lucide-react';
import Link from 'next/link';

const API_URL = getApiUrl();

interface ChannelRow {
  id: string;
  channel_type: string;
  name: string;
  stream_url: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function MediaChannelsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'tv' | 'radio'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCreateLogo, setUploadingCreateLogo] = useState(false);
  const [createLogoNotice, setCreateLogoNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    channel_type: 'tv' as 'tv' | 'radio',
    name: '',
    stream_url: '',
    logo_url: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  const load = async () => {
    if (!token) return;
    try {
      setError(null);
      setLoading(true);
      const q = filter === 'all' ? '' : `?type=${filter}`;
      const res = await adminApiFetch(`${API_URL}/api/media-channels${q}`, {}, token);
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
  }, [token, filter]);

  const uploadChannelLogo = async (file: File) => {
    const body = new FormData();
    body.append('logo', file);

    const res = await adminApiFetch(
      `${API_URL}/api/upload/media-channel-logo`,
      {
        method: 'POST',
        body,
      },
      token
    );
    const j = await res.json();
    if (!res.ok || !j.success || !j?.data?.url) {
      throw new Error(j.message || j.error || 'Logo upload failed');
    }
    return String(j.data.url);
  };

  const handleCreateLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingCreateLogo(true);
    setCreateLogoNotice(null);
    try {
      const uploadedUrl = await uploadChannelLogo(file);
      setForm((current) => ({ ...current, logo_url: uploadedUrl }));
      setCreateLogoNotice('Logo uploaded and attached to this new channel.');
    } catch (e) {
      setCreateLogoNotice(e instanceof Error ? e.message : 'Failed to upload logo');
    } finally {
      setUploadingCreateLogo(false);
    }
  };

  const toggle = async (id: string) => {
    const res = await adminApiFetch(`${API_URL}/api/media-channels/${id}/toggle`, { method: 'PATCH' }, token);
    if (res.ok) load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this channel?')) return;
    const res = await adminApiFetch(`${API_URL}/api/media-channels/${id}`, { method: 'DELETE' }, token);
    if (res.ok) load();
  };

  const saveRow = async (row: ChannelRow) => {
    const res = await adminApiFetch(`${API_URL}/api/media-channels/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_type: row.channel_type,
        name: row.name,
        stream_url: row.stream_url,
        logo_url: row.logo_url || null,
        description: row.description || null,
        sort_order: row.sort_order,
        is_active: row.is_active,
      }),
    }, token);
    if (res.ok) load();
    else alert((await res.json()).error || 'Save failed');
  };

  const create = async () => {
    if (!form.name.trim() || !form.stream_url.trim()) {
      alert('Name and stream URL are required');
      return;
    }
    setCreating(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/media-channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: form.channel_type,
          name: form.name.trim(),
          stream_url: form.stream_url.trim(),
          logo_url: form.logo_url.trim() || null,
          description: form.description.trim() || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }),
      }, token);
      const j = await res.json();
      if (res.ok && j.success) {
        setForm({
          channel_type: 'radio',
          name: '',
          stream_url: '',
          logo_url: '',
          description: '',
          sort_order: 0,
          is_active: true,
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
            <h1 className="text-2xl font-bold text-slate-900">TV & Radio (app)</h1>
            <p className="text-sm text-slate-600 mt-1">
              Links appear in the Classynews mobile app. Streams open in the device browser.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'tv', 'radio'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add channel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={form.channel_type}
              onChange={(e) => setForm({ ...form, channel_type: e.target.value as 'tv' | 'radio' })}
            >
              <option value="tv">TV</option>
              <option value="radio">Radio</option>
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
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="Stream / page URL (https://...)"
              value={form.stream_url}
              onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="Logo URL (optional)"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            />
            <div className="md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingCreateLogo}
                    onChange={handleCreateLogoUpload}
                  />
                  {uploadingCreateLogo ? 'Uploading logo...' : 'Upload / change logo'}
                </label>
                {form.logo_url && (
                  <a
                    href={form.logo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    Preview current logo
                  </a>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                You can paste a logo URL above or upload an image directly here.
              </p>
              {createLogoNotice && (
                <p
                  className={`mt-2 text-sm ${
                    createLogoNotice.toLowerCase().includes('failed')
                      ? 'text-red-600'
                      : 'text-green-700'
                  }`}
                >
                  {createLogoNotice}
                </p>
              )}
            </div>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm md:col-span-2 min-h-[72px]"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            Create
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Channels</div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No channels yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <ChannelEditor
                  key={row.id}
                  row={row}
                  onChange={(r) =>
                    setRows((current) => current.map((x) => (x.id === r.id ? r : x)))
                  }
                  onSave={() => saveRow(row)}
                  onToggle={() => toggle(row.id)}
                  onDelete={() => remove(row.id)}
                  onUploadLogo={uploadChannelLogo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelEditor({
  row,
  onChange,
  onSave,
  onToggle,
  onDelete,
  onUploadLogo,
}: {
  row: ChannelRow;
  onChange: (r: ChannelRow) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onUploadLogo: (file: File) => Promise<string>;
}) {
  const Icon = row.channel_type === 'radio' ? Radio : Tv;
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const handleRowLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingLogo(true);
    setUploadNotice(null);
    try {
      const uploadedUrl = await onUploadLogo(file);
      onChange({ ...row, logo_url: uploadedUrl });
      setUploadNotice('Logo uploaded. Click Save to publish this change.');
    } catch (e) {
      setUploadNotice(e instanceof Error ? e.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
          <Icon className="w-4 h-4" />
          {row.channel_type.toUpperCase()}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <Power className={`w-4 h-4 ${row.is_active ? 'text-green-600' : 'text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={row.name}
        onChange={(e) => onChange({ ...row, name: e.target.value })}
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        value={row.stream_url}
        onChange={(e) => onChange({ ...row, stream_url: e.target.value })}
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Logo URL"
        value={row.logo_url || ''}
        onChange={(e) => onChange({ ...row, logo_url: e.target.value || null })}
      />
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={handleRowLogoUpload}
            />
            {uploadingLogo ? 'Uploading logo...' : 'Upload / change logo'}
          </label>
          {row.logo_url && (
            <a
              href={row.logo_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Preview current logo
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Upload a logo file or keep using a direct image URL.
        </p>
        {uploadNotice && (
          <p
            className={`mt-2 text-sm ${
              uploadNotice.toLowerCase().includes('failed')
                ? 'text-red-600'
                : 'text-green-700'
            }`}
          >
            {uploadNotice}
          </p>
        )}
      </div>
      <textarea
        className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
        placeholder="Description"
        value={row.description || ''}
        onChange={(e) => onChange({ ...row, description: e.target.value || null })}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded-lg px-2 py-1 text-sm"
          value={row.channel_type}
          onChange={(e) => onChange({ ...row, channel_type: e.target.value })}
        >
          <option value="tv">tv</option>
          <option value="radio">radio</option>
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
