'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import { ArrowLeft, Image as ImageIcon, Plus, Power, Radio, Trash2, Tv, Youtube, GripVertical, Sparkles } from 'lucide-react';
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

type ChannelType = 'tv' | 'radio' | 'youtube' | 'youtube2' | 'youtube3';
type ChannelFilter = 'all' | ChannelType;
const CHANNEL_TYPES: ChannelType[] = ['tv', 'radio', 'youtube', 'youtube2', 'youtube3'];
const CHANNEL_LABELS: Record<ChannelType, string> = {
  tv: 'TV',
  radio: 'Radio',
  youtube: 'YouTube',
  youtube2: 'YouTube 2',
  youtube3: 'YouTube 3',
};
const DEFAULT_HEADINGS: Record<ChannelType, string> = {
  tv: 'TV',
  radio: 'Radio',
  youtube: 'YOUTUBE LATEST',
  youtube2: 'YOUTUBE 2',
  youtube3: 'YOUTUBE 3',
};
type MediaItem = {
  id: string;
  url: string;
  file_type: string;
  alt_text: string | null;
  caption: string | null;
};

export default function MediaChannelsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCreateLogo, setUploadingCreateLogo] = useState(false);
  const [createLogoNotice, setCreateLogoNotice] = useState<string | null>(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'create' | string>('create');
  const [form, setForm] = useState({
    channel_type: 'tv' as ChannelType,
    name: '',
    stream_url: '',
    logo_url: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [headings, setHeadings] = useState<Record<ChannelType, string>>(DEFAULT_HEADINGS);
  const [savingHeadings, setSavingHeadings] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const activeType = filter === 'all' ? 'tv' : filter;
  const createType = form.channel_type;
  const createIsVideoStream = createType === 'youtube2' || createType === 'youtube3';

  const startCreateFor = (type: ChannelType) => {
    setForm({
      channel_type: type,
      name: '',
      stream_url: '',
      logo_url: '',
      description: '',
      sort_order: 0,
      is_active: true,
    });
    setCreateLogoNotice(null);
    setFilter(type);
  };

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
      if (filter === 'all') {
        const headingsRes = await adminApiFetch(`${API_URL}/api/media-channel-headings`, {}, token);
        const headingsJson = await headingsRes.json();
        if (headingsRes.ok && headingsJson.success && headingsJson.data) {
          setHeadings({ ...DEFAULT_HEADINGS, ...headingsJson.data });
        }
      }
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

  useEffect(() => {
    if (filter !== 'all' && form.channel_type !== filter) {
      startCreateFor(filter);
    }
  }, [filter]);

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

  const saveHeadings = async () => {
    if (!token) return;
    setSavingHeadings(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/media-channel-headings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headings }),
      }, token);
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Failed to save headings');
      setHeadings({ ...DEFAULT_HEADINGS, ...j.data });
      alert('Media headings saved successfully');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save headings');
    } finally {
      setSavingHeadings(false);
    }
  };

  const openMediaLibrary = async (target: 'create' | string) => {
    setMediaTarget(target);
    setMediaLibraryOpen(true);
    setMediaLoading(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/media-library`, {}, token);
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to load media');
      setMediaItems(Array.isArray(j.data) ? j.data : []);
    } catch {
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const selectMediaUrl = (url: string) => {
    if (mediaTarget === 'create') {
      setForm((current) => ({ ...current, logo_url: url }));
      setCreateLogoNotice('Media library image attached to this new channel.');
    } else {
      setRows((current) =>
        current.map((row) => row.id === mediaTarget ? { ...row, logo_url: url } : row)
      );
    }
    setMediaLibraryOpen(false);
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
    const isVideoStream = form.channel_type === 'youtube2' || form.channel_type === 'youtube3';
    if (!form.name.trim() || !form.stream_url.trim()) {
      alert(isVideoStream ? 'Video title and YouTube video URL are required' : 'Name and stream URL are required');
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
        startCreateFor(form.channel_type);
        load();
      } else alert(j.error || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const oldIdx = rows.findIndex(r => r.id === draggedId);
    const newIdx = rows.findIndex(r => r.id === targetId);
    if (oldIdx === -1 || newIdx === -1) return;
    
    const newRows = [...rows];
    const [moved] = newRows.splice(oldIdx, 1);
    newRows.splice(newIdx, 0, moved);
    
    const updatedRows = newRows.map((r, idx) => ({ ...r, sort_order: idx }));
    setRows(updatedRows);
    
    await adminApiFetch(`${API_URL}/api/media-channels/batch-sort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: updatedRows.map(r => ({ id: r.id, sort_order: r.sort_order }))
      })
    }, token);
  };

  const channelStats = [
    { label: 'TV', icon: Tv, value: rows.filter((row) => row.channel_type === 'tv').length, color: 'text-red-200' },
    { label: 'Radio', icon: Radio, value: rows.filter((row) => row.channel_type === 'radio').length, color: 'text-blue-200' },
    { label: 'YouTube', icon: Youtube, value: rows.filter((row) => row.channel_type === 'youtube').length, color: 'text-rose-200' },
    { label: 'YouTube 2', icon: Youtube, value: rows.filter((row) => row.channel_type === 'youtube2').length, color: 'text-rose-200' },
    { label: 'YouTube 3', icon: Youtube, value: rows.filter((row) => row.channel_type === 'youtube3').length, color: 'text-rose-200' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-5 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-6 py-6 text-white">
            <div className="flex items-center gap-4">
              <Link href="/admin/settings" className="rounded-xl border border-white/15 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mobile app media hub
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">TV, Radio & YouTube</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Create, arrange, brand, and publish the media channels that appear inside the Classynews app.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {channelStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="min-w-24 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center">
                    <Icon className={`mx-auto mb-1 h-4 w-4 ${item.color}`} />
                    <div className="text-2xl font-black">{item.value}</div>
                    <div className="text-xs font-semibold text-slate-300">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {(['all', ...CHANNEL_TYPES] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                if (f !== 'all') startCreateFor(f);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                filter === f ? 'bg-slate-900 text-white shadow-lg shadow-slate-300' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'all' ? 'All' : CHANNEL_LABELS[f]}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {filter !== 'all' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">{CHANNEL_LABELS[activeType]} settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Change this section heading and manage only its {activeType === 'youtube2' || activeType === 'youtube3' ? 'videos' : 'channels'}.
            </p>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-500">Section heading</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white"
              value={headings[activeType]}
              onChange={(e) => setHeadings((current) => ({ ...current, [activeType]: e.target.value }))}
            />
          </label>
          <button
            type="button"
            onClick={saveHeadings}
            disabled={savingHeadings}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {savingHeadings ? 'Saving headings...' : 'Save headings'}
          </button>
        </div>
        )}

        {filter !== 'all' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Plus className="h-4 w-4" /></span>
              {createIsVideoStream ? `Add ${CHANNEL_LABELS[createType]} video` : `Add ${CHANNEL_LABELS[createType]} channel`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {createIsVideoStream
                ? 'Paste a YouTube video link. The app will generate only the thumbnail; the title is yours to enter.'
                : 'Paste a stream URL, attach a logo, then publish it to the app.'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="number"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white md:col-span-2"
              placeholder="sort_order"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white md:col-span-2"
              placeholder={createIsVideoStream ? 'Video title' : 'Name'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white md:col-span-2"
              placeholder={createIsVideoStream ? 'YouTube video URL (https://youtube.com/watch?v=...)' : 'Stream / page URL (https://...)'}
              value={form.stream_url}
              onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
            />
            {!createIsVideoStream && (
              <input
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white md:col-span-2"
                placeholder="Logo URL (optional)"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            )}
            {!createIsVideoStream && <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/40 px-4 py-4 md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800">
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
                <button
                  type="button"
                  onClick={() => openMediaLibrary('create')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <ImageIcon className="h-4 w-4" />
                  Browse media
                </button>
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
            </div>}
            {!createIsVideoStream && (
              <textarea
                className="min-h-[86px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white md:col-span-2"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            )}
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
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {createIsVideoStream ? 'Add video' : 'Create channel'}
          </button>
        </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-900">
                {filter === 'all' ? 'All media' : `${CHANNEL_LABELS[filter]} ${filter === 'youtube2' || filter === 'youtube3' ? 'videos' : 'channels'}`}
              </h2>
              <p className="text-sm text-slate-500">
                {filter === 'all'
                  ? 'Choose a section above to edit its heading or add a new item.'
                  : 'Drag a card to reorder this section in the app.'}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No channels yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
              {rows.map((row) => (
                <div 
                  key={row.id}
                  draggable
                  onDragStart={() => handleDragStart(row.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(row.id)}
                  className="transition"
                >
                  <ChannelEditor
                    row={row}
                    onChange={(r) =>
                      setRows((current) => current.map((x) => (x.id === r.id ? r : x)))
                    }
                    onSave={() => saveRow(row)}
                    onToggle={() => toggle(row.id)}
                    onDelete={() => remove(row.id)}
                    onUploadLogo={uploadChannelLogo}
                    onBrowseLogo={() => openMediaLibrary(row.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {mediaLibraryOpen && (
          <MediaLibraryPicker
            items={mediaItems}
            loading={mediaLoading}
            onSelect={selectMediaUrl}
            onClose={() => setMediaLibraryOpen(false)}
          />
        )}
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
  onBrowseLogo,
}: {
  row: ChannelRow;
  onChange: (r: ChannelRow) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onUploadLogo: (file: File) => Promise<string>;
  onBrowseLogo: () => void;
}) {
  const Icon = row.channel_type === 'radio' ? Radio : row.channel_type.startsWith('youtube') ? Youtube : Tv;
  const isVideoStream = row.channel_type === 'youtube2' || row.channel_type === 'youtube3';
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-grab rounded-xl bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
            <Icon className="w-4 h-4" />
            {CHANNEL_LABELS[row.channel_type as ChannelType] ?? row.channel_type.toUpperCase()}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {row.is_active ? 'Active' : 'Hidden'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
          >
            <Power className={`w-4 h-4 ${row.is_active ? 'text-green-600' : 'text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-slate-200 bg-white p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-400"
        placeholder={isVideoStream ? 'Video title' : 'Name'}
        value={row.name}
        onChange={(e) => onChange({ ...row, name: e.target.value })}
      />
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        placeholder={isVideoStream ? 'YouTube video URL' : 'Stream / page URL'}
        value={row.stream_url}
        onChange={(e) => onChange({ ...row, stream_url: e.target.value })}
      />
      {isVideoStream && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          YouTube 2 and YouTube 3 use direct video links. Enter the title manually; the app generates the thumbnail from the link.
        </p>
      )}
      {!isVideoStream && (
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          placeholder="Logo URL"
          value={row.logo_url || ''}
          onChange={(e) => onChange({ ...row, logo_url: e.target.value || null })}
        />
      )}
      {!isVideoStream && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
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
          <button
            type="button"
            onClick={onBrowseLogo}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <ImageIcon className="h-4 w-4" />
            Browse media
          </button>
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
      </div>}
      {!isVideoStream && (
        <textarea
          className="min-h-[70px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          placeholder="Description"
          value={row.description || ''}
          onChange={(e) => onChange({ ...row, description: e.target.value || null })}
        />
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
          {CHANNEL_LABELS[row.channel_type as ChannelType] ?? row.channel_type}
        </span>
        <input
          type="number"
          className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
          className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function MediaLibraryPicker({
  items,
  loading,
  onSelect,
  onClose,
}: {
  items: MediaItem[];
  loading: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const imageItems = items.filter((item) => item.file_type?.startsWith('image/'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[82vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Browse media</h3>
            <p className="text-sm text-slate-500">Select an uploaded image to reuse as the channel logo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto p-5">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading media...</div>
          ) : imageItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500">
              No uploaded images found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {imageItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <img src={item.url} alt={item.alt_text || 'Media'} className="h-28 w-full object-cover" />
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {item.alt_text || item.caption || 'Uploaded media'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
