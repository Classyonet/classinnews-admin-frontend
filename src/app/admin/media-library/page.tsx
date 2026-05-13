'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Copy, File, Image as ImageIcon, RefreshCw, Upload } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { adminAuthFetch } from '@/lib/admin-session';

const API_URL = getApiUrl();

type MediaItem = {
  id: string;
  url: string;
  file_url?: string;
  file_type: string;
  file_size: number | null;
  alt_text: string | null;
  caption: string | null;
  created_at: string;
  source: string;
};

function formatSize(size: number | null) {
  if (!size) return 'Unknown size';
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setNotice(null);
      const response = await adminAuthFetch(`${API_URL}/api/media-library`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || json.error || 'Failed to load media library');
      }
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to load media library');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.alt_text, item.caption, item.url, item.file_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [items, query]);

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    setNotice(null);

    try {
      const response = await adminAuthFetch(`${API_URL}/api/media-library/upload`, {
        method: 'POST',
        body,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || json.error || 'Upload failed');
      }
      setNotice('File uploaded to the media library.');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setNotice('Media URL copied.');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse reusable admin uploads and copy asset URLs for logos, settings, and channels.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload file'}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={uploadFile}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search media by filename, type, or URL"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {notice && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading media...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">No media found</p>
            <p className="mt-1 text-sm text-slate-500">Upload a file to start building the reusable library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isImage = item.file_type?.startsWith('image/');
              return (
                <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-44 items-center justify-center bg-slate-100">
                    {isImage ? (
                      <img src={item.url} alt={item.alt_text || 'Media'} className="h-full w-full object-cover" />
                    ) : (
                      <File className="h-12 w-12 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.alt_text || item.caption || item.url}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.file_type || 'file'} · {formatSize(item.file_size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyUrl(item.url)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
