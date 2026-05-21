'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';

type Feed = {
  name: string;
  url: string;
  enabled: boolean;
  limit: number;
};

const API_URL = getApiUrl();

export default function NewsFlashSettingsPage() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApiFetch(`${API_URL}/api/news-flash-settings`, {}, token);
        const json = await res.json();
        if (res.ok && json.success) {
          setEnabled(json.data.enabled);
          setFeeds(Array.isArray(json.data.feeds) ? json.data.feeds : []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const updateFeed = (index: number, patch: Partial<Feed>) => {
    setFeeds((current) => current.map((feed, i) => i === index ? { ...feed, ...patch } : feed));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminApiFetch(`${API_URL}/api/news-flash-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, feeds }),
      }, token);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');
      alert('News flash settings saved');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/settings" className="rounded-lg border border-slate-200 bg-white p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">News Flash Feeds</h1>
              <p className="text-sm text-slate-500">Control the mobile app crawler below the homepage slider.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold text-slate-900">Enable news flash crawler</span>
              <span className="text-sm text-slate-500">When disabled, the mobile app hides the crawler.</span>
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-5 w-5"
            />
          </label>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading...</div>
          ) : feeds.map((feed, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_2fr_90px_90px_44px]">
              <input
                value={feed.name}
                onChange={(event) => updateFeed(index, { name: event.target.value })}
                placeholder="Source name"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={feed.url}
                onChange={(event) => updateFeed(index, { url: event.target.value })}
                placeholder="RSS feed URL"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                max={10}
                value={feed.limit}
                onChange={(event) => updateFeed(index, { limit: Number(event.target.value) || 3 })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <label className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={(event) => updateFeed(index, { enabled: event.target.checked })}
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => setFeeds((current) => current.filter((_, i) => i !== index))}
                className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFeeds((current) => [...current, { name: '', url: '', enabled: true, limit: 3 }])}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
        >
          <Plus className="h-4 w-4" />
          Add feed
        </button>
      </div>
    </div>
  );
}
