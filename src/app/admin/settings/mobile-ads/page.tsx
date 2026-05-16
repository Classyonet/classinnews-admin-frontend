'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Home,
  Layers,
  MessageCircle,
  Plus,
  Power,
  Smartphone,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const API_URL = getApiUrl();

// ─── Known placement keys with friendly metadata ──────────────────────────────
const KNOWN_PLACEMENTS: {
  key: string;
  label: string;
  description: string;
  group: 'home' | 'article' | 'comments';
}[] = [
  // Home screen
  {
    key: 'app_home_slideshow_top',
    label: 'Home – Above Slideshow',
    description: 'Banner shown above the top slideshow carousel.',
    group: 'home',
  },
  {
    key: 'app_home_banner',
    label: 'Home – Below Slideshow',
    description: 'Banner below the slideshow, above Most Read.',
    group: 'home',
  },
  {
    key: 'app_latest_top',
    label: 'Latest Articles – Top',
    description: 'Banner at the very top of the Latest News list.',
    group: 'home',
  },
  {
    key: 'app_latest_inline',
    label: 'Latest Articles – Inline (every 3)',
    description: 'Banner injected after every 3rd article in Latest News.',
    group: 'home',
  },
  {
    key: 'app_latest_bottom',
    label: 'Latest Articles – Bottom',
    description: 'Banner below the Latest News list, above Load More.',
    group: 'home',
  },
  {
    key: 'app_home_after_categories',
    label: 'Home – After Top Categories',
    description: 'Banner below the Top Categories grid.',
    group: 'home',
  },
  // Article detail
  {
    key: 'app_article_after_image',
    label: 'Article – After Featured Image',
    description: 'Banner directly below the featured image / meta header.',
    group: 'article',
  },
  {
    key: 'app_article_content_top',
    label: 'Article – Before Content',
    description: 'Banner before the first paragraph of article content.',
    group: 'article',
  },
  {
    key: 'app_article_inline',
    label: 'Article – Inline Content (every 3 paragraphs)',
    description: 'Banner injected every 3 paragraphs inside article body.',
    group: 'article',
  },
  {
    key: 'app_article_below_content',
    label: 'Article – Below Content',
    description: 'Banner below the article body, above "You might also like".',
    group: 'article',
  },
  {
    key: 'app_article_after_ymal',
    label: 'Article – After "You Might Also Like"',
    description: 'Banner below the "You might also like" articles grid.',
    group: 'article',
  },
  {
    key: 'app_article_banner',
    label: 'Article – Final Banner',
    description: 'Bottom-most banner at the very end of the article page.',
    group: 'article',
  },
  // Comments
  {
    key: 'app_article_inline_comment',
    label: 'Comments – Inline (every 3 comments)',
    description: 'Banner injected after every 3 comments in the comments thread.',
    group: 'comments',
  },
  {
    key: 'app_article_below_comments',
    label: 'Comments – Below Section',
    description: 'Banner below the entire comments section.',
    group: 'comments',
  },
];

const GROUP_META = {
  home: { label: 'Home Screen', icon: Home, color: 'blue' },
  article: { label: 'Article Detail', icon: Layers, color: 'purple' },
  comments: { label: 'Comments', icon: MessageCircle, color: 'emerald' },
} as const;

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    placement_key: '',
    display_name: '',
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

  useEffect(() => { load(); }, [token]);

  const toggle = async (id: string) => {
    const res = await adminApiFetch(`${API_URL}/api/mobile-ads/${id}/toggle`, { method: 'PATCH' }, token);
    if (res.ok) load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this ad placement?')) return;
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

  const createFromKnown = (key: string) => {
    const known = KNOWN_PLACEMENTS.find((p) => p.key === key);
    setForm({
      placement_key: key,
      display_name: known?.label ?? key,
      format: 'banner',
      android_unit_id: '',
      ios_unit_id: '',
      is_active: false,
      sort_order: KNOWN_PLACEMENTS.findIndex((p) => p.key === key),
    });
    setShowAddForm(true);
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
        setShowAddForm(false);
        setForm({ placement_key: '', display_name: '', format: 'banner', android_unit_id: '', ios_unit_id: '', is_active: false, sort_order: 0 });
        load();
      } else alert(j.error || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const configuredKeys = new Set(rows.map((r) => r.placement_key));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-7 h-7 text-blue-600" />
              Mobile AdMob Placements
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Control every ad slot in the ClassyNews mobile app. Toggle on/off per placement.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Placement Reference by Group */}
        {(['home', 'article', 'comments'] as const).map((group) => {
          const meta = GROUP_META[group];
          const Icon = meta.icon;
          const placements = KNOWN_PLACEMENTS.filter((p) => p.group === group);
          const colorMap = {
            blue: { header: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
            purple: { header: 'bg-purple-600', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200' },
            emerald: { header: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
          };
          const colors = colorMap[meta.color];

          return (
            <div key={group} className={`bg-white rounded-xl border ${colors.border} overflow-hidden shadow-sm`}>
              <div className={`${colors.header} px-5 py-3 flex items-center gap-2`}>
                <Icon className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">{meta.label} Ads</span>
                <span className="ml-auto text-white/70 text-xs">{placements.length} slots</span>
              </div>

              <div className="divide-y divide-slate-100">
                {placements.map((p) => {
                  const configured = configuredKeys.has(p.key);
                  const row = rows.find((r) => r.placement_key === p.key);

                  return (
                    <div key={p.key} className="px-5 py-4 flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm">{p.label}</span>
                          {configured ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row?.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                              {row?.is_active ? '● Active' : '○ Inactive'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Not configured</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                        <button
                          onClick={() => copyKey(p.key)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                        >
                          {copied === p.key ? <Check className="w-3 h-3 text-green-600" /> : <ClipboardCopy className="w-3 h-3" />}
                          {p.key}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {configured && row ? (
                          <>
                            <button
                              onClick={() => toggle(row.id)}
                              title={row.is_active ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-lg border transition-colors ${row.is_active ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-200 hover:bg-slate-50 text-slate-400'}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => remove(row.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => createFromKnown(p.key)}
                            className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline edit for configured rows */}
              {placements.filter((p) => configuredKeys.has(p.key)).map((p) => {
                const row = rows.find((r) => r.placement_key === p.key);
                if (!row) return null;
                return (
                  <EditRow key={row.id} row={row}
                    onChange={(r) => setRows(rows.map((x) => (x.id === r.id ? r : x)))}
                    onSave={() => saveRow(row)}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Add / Custom Placement Form */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full px-5 py-4 flex items-center justify-between font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add Custom / Missing Placement
            </span>
            {showAddForm ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showAddForm && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Placement Key *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. app_home_banner"
                    value={form.placement_key}
                    onChange={(e) => setForm({ ...form, placement_key: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Display Name *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. Home below slideshow"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Android Unit ID</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
                    value={form.android_unit_id}
                    onChange={(e) => setForm({ ...form, android_unit_id: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">iOS Unit ID</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
                    value={form.ios_unit_id}
                    onChange={(e) => setForm({ ...form, ios_unit_id: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.format}
                      onChange={(e) => setForm({ ...form, format: e.target.value })}
                    >
                      <option value="banner">Banner</option>
                      <option value="interstitial">Interstitial (reserved)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                    <input
                      type="number"
                      className="border rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    Active immediately
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={create}
                disabled={creating}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Creating…' : 'Create Placement'}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-8 text-slate-500">Loading placements…</div>
        )}
      </div>
    </div>
  );
}

// ─── Inline edit row ──────────────────────────────────────────────────────────
function EditRow({
  row,
  onChange,
  onSave,
}: {
  row: MobilePlacement;
  onChange: (r: MobilePlacement) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-dashed border-slate-100 bg-slate-50/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-2 flex items-center justify-between text-xs text-slate-500 hover:text-slate-700"
      >
        <span>Edit Unit IDs for <span className="font-mono">{row.placement_key}</span></span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          <input
            className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Android unit ID (ca-app-pub-…)"
            value={row.android_unit_id || ''}
            onChange={(e) => onChange({ ...row, android_unit_id: e.target.value || null })}
          />
          <input
            className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="iOS unit ID (ca-app-pub-…)"
            value={row.ios_unit_id || ''}
            onChange={(e) => onChange({ ...row, ios_unit_id: e.target.value || null })}
          />
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="border rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={row.sort_order}
              onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) || 0 })}
              placeholder="Sort"
            />
            <button
              type="button"
              onClick={onSave}
              className="text-sm bg-slate-900 text-white px-4 py-1.5 rounded-lg hover:bg-slate-800 font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
