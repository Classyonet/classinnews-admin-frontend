'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { adminApiFetch } from '@/lib/admin-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  Play,
  Plus,
  RefreshCw,
  Rss,
  Send,
  Settings,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';

type Stats = {
  sources: number;
  activeSources: number;
  stories: number;
  newStories: number;
  generated: number;
  pendingReview: number;
  published: number;
  failedLogs: number;
  scheduler?: Scheduler | null;
};

type Source = {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  defaultCategory?: string | null;
  isActive: boolean;
  trustLevel: number;
  lastCheckedAt?: string | null;
  failureCount: number;
};

type Story = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  summary?: string | null;
  status: string;
  discoveredAt: string;
};

type GeneratedArticle = {
  id: string;
  articleId?: string | null;
  title: string;
  excerpt?: string | null;
  sourceName: string;
  sourceUrl: string;
  categoryName?: string | null;
  status: string;
  qualityScore?: number | null;
  generatedAt: string;
  validationErrors?: unknown;
};

type AiSetting = {
  key: string;
  value: string;
  type: string;
  isSecret: boolean;
  configured?: boolean;
};

type Scheduler = {
  id: string;
  name: string;
  intervalMinutes: number;
  isEnabled: boolean;
  isRunning: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
};

type AiLog = {
  id: string;
  action: string;
  status: string;
  message?: string | null;
  createdAt: string;
};

const categories = ['Politics', 'Business', 'Technology', 'Sports', 'Entertainment', 'World News', 'Africa News', 'Ghana News', 'Health', 'Education'];

const statCards = [
  { key: 'activeSources', label: 'Active Sources', icon: Rss, gradient: 'from-sky-500 to-blue-600' },
  { key: 'newStories', label: 'New Stories', icon: Activity, gradient: 'from-amber-500 to-orange-600' },
  { key: 'generated', label: 'Generated', icon: Sparkles, gradient: 'from-violet-500 to-fuchsia-600' },
  { key: 'published', label: 'Published', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
] as const;

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === 'published' || status === 'success' || status === 'generated') return 'bg-emerald-100 text-emerald-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  if (status === 'pending_review') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await adminApiFetch(path, { ...init, headers }, token);
  if (init.method === 'DELETE') {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as any).message || 'Request failed');
    }
    return undefined as unknown as T;
  }
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data as T;
}

const EMPTY_EDIT = { name: '', url: '', defaultCategory: 'World News', trustLevel: '3', isActive: true };

export default function AiNewsCenterPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [generated, setGenerated] = useState<GeneratedArticle[]>([]);
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [scheduler, setScheduler] = useState<Scheduler | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState({ name: '', url: '', defaultCategory: 'World News', trustLevel: '3' });
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  // Source inline edit state
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; url: string; defaultCategory: string; trustLevel: string; isActive: boolean }>(EMPTY_EDIT);

  const settingMap = useMemo(() => {
    return settings.reduce<Record<string, AiSetting>>((acc, setting) => {
      acc[setting.key] = setting;
      return acc;
    }, {});
  }, [settings]);

  async function loadData() {
    if (!token) return;
    setLoading(true);
    try {
      const [statsData, sourcesData, storiesData, generatedData, settingsData, schedulerData, logsData] = await Promise.all([
        apiRequest<Stats>('/api/ai-news/stats', {}, token),
        apiRequest<Source[]>('/api/ai-news/sources', {}, token),
        apiRequest<Story[]>('/api/ai-news/stories?limit=40', {}, token),
        apiRequest<GeneratedArticle[]>('/api/ai-news/generated?limit=40', {}, token),
        apiRequest<AiSetting[]>('/api/ai-news/settings', {}, token),
        apiRequest<Scheduler>('/api/ai-news/scheduler', {}, token),
        apiRequest<AiLog[]>('/api/ai-news/logs?limit=50', {}, token),
      ]);

      setStats(statsData);
      setSources(sourcesData);
      setStories(storiesData);
      setGenerated(generatedData);
      setSettings(settingsData);
      setScheduler(schedulerData);
      setLogs(logsData);
      setSettingsDraft(settingsData.reduce<Record<string, string>>((acc, setting) => {
        acc[setting.key] = setting.isSecret ? '' : setting.value;
        return acc;
      }, {}));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load AI News Center');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  async function runAction(actionKey: string, action: () => Promise<void>) {
    setBusyAction(actionKey);
    try {
      await action();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddSource(event: FormEvent) {
    event.preventDefault();
    await runAction('add-source', async () => {
      await apiRequest('/api/ai-news/sources', {
        method: 'POST',
        body: JSON.stringify({
          name: sourceForm.name,
          url: sourceForm.url,
          defaultCategory: sourceForm.defaultCategory,
          trustLevel: Number(sourceForm.trustLevel) || 3,
        }),
      }, token);
      setSourceForm({ name: '', url: '', defaultCategory: 'World News', trustLevel: '3' });
      toast.success('Source added');
    });
  }

  function startEditSource(source: Source) {
    setEditingSourceId(source.id);
    setEditForm({
      name: source.name,
      url: source.url,
      defaultCategory: source.defaultCategory || 'World News',
      trustLevel: String(source.trustLevel),
      isActive: source.isActive,
    });
  }

  function cancelEditSource() {
    setEditingSourceId(null);
    setEditForm(EMPTY_EDIT);
  }

  async function saveEditSource(id: string) {
    await runAction(`edit-source-${id}`, async () => {
      await apiRequest(`/api/ai-news/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          url: editForm.url,
          defaultCategory: editForm.defaultCategory,
          trustLevel: Number(editForm.trustLevel) || 3,
          isActive: editForm.isActive,
        }),
      }, token);
      setEditingSourceId(null);
      setEditForm(EMPTY_EDIT);
      toast.success('Source updated');
    });
  }

  async function deleteSource(id: string) {
    if (!confirm('Delete this source? Discovered stories from it will remain.')) return;
    await runAction(`del-source-${id}`, async () => {
      await apiRequest(`/api/ai-news/sources/${id}`, { method: 'DELETE' }, token);
      toast.success('Source deleted');
    });
  }

  async function deleteStory(id: string) {
    if (!confirm('Delete this discovered story?')) return;
    await runAction(`del-story-${id}`, async () => {
      await apiRequest(`/api/ai-news/stories/${id}`, { method: 'DELETE' }, token);
      toast.success('Story deleted');
    });
  }

  async function deleteGenerated(id: string) {
    if (!confirm('Delete this generated article record?')) return;
    await runAction(`del-gen-${id}`, async () => {
      await apiRequest(`/api/ai-news/generated/${id}`, { method: 'DELETE' }, token);
      toast.success('Generated article deleted');
    });
  }

  async function saveSettings() {
    await runAction('settings', async () => {
      const updates = Object.entries(settingsDraft).map(([key, value]) => ({ key, value }));
      await apiRequest('/api/ai-news/settings', { method: 'PUT', body: JSON.stringify({ settings: updates }) }, token);
      toast.success('AI News settings saved');
    });
  }

  async function saveScheduler(next?: Partial<Scheduler>) {
    const nextEnabled = next?.isEnabled ?? scheduler?.isEnabled ?? false;
    const nextInterval = next?.intervalMinutes ?? scheduler?.intervalMinutes ?? (Number(settingsDraft.schedule_interval_minutes) || 60);

    await runAction('scheduler', async () => {
      await apiRequest('/api/ai-news/scheduler', {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: nextEnabled, intervalMinutes: nextInterval }),
      }, token);
      toast.success('Scheduler updated');
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-900 to-emerald-800 p-7 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI News Center</h1>
                <p className="mt-1 text-sm text-blue-100">Discovery, generation, review, publishing, and scheduling</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-white text-slate-950 hover:bg-blue-50" disabled={busyAction !== null} onClick={() => runAction('discover', async () => {
              const result = await apiRequest<{ discovered: number; duplicates: number; failed: number }>('/api/ai-news/discover', { method: 'POST' }, token);
              toast.success(`Discovery found ${result.discovered} new stories`);
            })}>
              <RefreshCw className="mr-2 h-4 w-4" /> Discover
            </Button>
            <Button className="bg-emerald-500 text-white hover:bg-emerald-600" disabled={busyAction !== null} onClick={() => runAction('run-job', async () => {
              await apiRequest('/api/ai-news/scheduler/run', { method: 'POST' }, token);
              toast.success('AI News job completed');
            })}>
              <Play className="mr-2 h-4 w-4" /> Run Job
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats?.[card.key] ?? 0}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── News Sources ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">News Sources</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{sources.length} total</span>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddSource} className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr_160px_90px_auto]">
            <Input placeholder="Source name" value={sourceForm.name} onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })} required />
            <Input placeholder="RSS URL" value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} required />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={sourceForm.defaultCategory} onChange={(event) => setSourceForm({ ...sourceForm, defaultCategory: event.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <Input type="number" min="1" max="5" placeholder="Trust" value={sourceForm.trustLevel} onChange={(event) => setSourceForm({ ...sourceForm, trustLevel: event.target.value })} />
            <Button type="submit" disabled={busyAction !== null}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </form>

          {/* Sources list */}
          <div className="overflow-hidden rounded-lg border border-slate-100">
            {sources.map((source) => (
              <div key={source.id} className="border-b border-slate-100 last:border-0">
                {editingSourceId === source.id ? (
                  /* ── Inline edit row ── */
                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr_160px_70px]">
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                      <Input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} placeholder="RSS URL" />
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={editForm.defaultCategory} onChange={(e) => setEditForm({ ...editForm, defaultCategory: e.target.value })}>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Input type="number" min="1" max="5" value={editForm.trustLevel} onChange={(e) => setEditForm({ ...editForm, trustLevel: e.target.value })} placeholder="Trust" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={cancelEditSource} disabled={busyAction !== null}>Cancel</Button>
                        <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => saveEditSource(source.id)} disabled={busyAction !== null}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1fr_150px_110px_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{source.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{source.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{source.url}</p>
                    </div>
                    <div className="text-sm text-slate-600">{source.defaultCategory || 'Unassigned'}</div>
                    <div className="text-sm text-slate-500">{formatDate(source.lastCheckedAt)}</div>
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-source-${source.id}`}
                        onClick={() => startEditSource(source)}
                        disabled={busyAction !== null}
                        title="Edit source"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-source-${source.id}`}
                        onClick={() => deleteSource(source.id)}
                        disabled={busyAction !== null}
                        title="Delete source"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Settings ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-950">Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">DeepSeek API Key</label>
              <Input type="password" placeholder={settingMap.deepseek_api_key?.configured ? 'Configured' : 'Not configured'} value={settingsDraft.deepseek_api_key || ''} onChange={(event) => setSettingsDraft({ ...settingsDraft, deepseek_api_key: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Model</label>
                <Input value={settingsDraft.deepseek_model || ''} onChange={(event) => setSettingsDraft({ ...settingsDraft, deepseek_model: event.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mode</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settingsDraft.ai_mode || 'manual'} onChange={(event) => setSettingsDraft({ ...settingsDraft, ai_mode: event.target.value })}>
                  <option value="manual">Manual Review</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-100 p-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={settingsDraft.ai_auto_generate === 'true'} onChange={(event) => setSettingsDraft({ ...settingsDraft, ai_auto_generate: String(event.target.checked) })} />
                Auto generate
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-100 p-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={settingsDraft.ai_auto_publish === 'true'} onChange={(event) => setSettingsDraft({ ...settingsDraft, ai_auto_publish: String(event.target.checked) })} />
                Auto publish
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Interval minutes</label>
                <Input type="number" min="15" value={settingsDraft.schedule_interval_minutes || '60'} onChange={(event) => setSettingsDraft({ ...settingsDraft, schedule_interval_minutes: event.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Stories per run</label>
                <Input type="number" min="1" max="25" value={settingsDraft.max_stories_per_run || '5'} onChange={(event) => setSettingsDraft({ ...settingsDraft, max_stories_per_run: event.target.value })} />
              </div>
            </div>
            <Button className="w-full" disabled={busyAction !== null} onClick={saveSettings}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Save Settings
            </Button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ── Discovered Stories ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Discovered Stories</h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{stats?.newStories || 0} new</span>
          </div>
          <div className="space-y-3">
            {stories.slice(0, 12).map((story) => (
              <div key={story.id} className="rounded-lg border border-slate-100 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(story.status)}`}>{story.status.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold text-slate-500">{story.sourceName}</span>
                </div>
                <p className="font-semibold text-slate-950">{story.title}</p>
                {story.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{story.summary}</p>}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <a className="truncate text-xs font-semibold text-blue-600" href={story.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={busyAction !== null || story.status !== 'new'} onClick={() => runAction(`generate-${story.id}`, async () => {
                      await apiRequest(`/api/ai-news/stories/${story.id}/generate`, { method: 'POST' }, token);
                      toast.success('Article generated');
                    })}>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate
                    </Button>
                    <button
                      id={`delete-story-${story.id}`}
                      onClick={() => deleteStory(story.id)}
                      disabled={busyAction !== null}
                      title="Delete story"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Generated Articles ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Generated Articles</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{generated.length} loaded</span>
          </div>
          <div className="space-y-3">
            {generated.slice(0, 12).map((article) => (
              <div key={article.id} className="rounded-lg border border-slate-100 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(article.status)}`}>{article.status.replace('_', ' ')}</span>
                  {article.qualityScore != null && <span className="text-xs font-bold text-slate-500">Score {Math.round(article.qualityScore)}</span>}
                  <span className="text-xs font-semibold text-slate-500">{article.categoryName || 'No category'}</span>
                </div>
                <p className="font-semibold text-slate-950">{article.title}</p>
                {article.excerpt && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{article.excerpt}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <a className="truncate text-xs font-semibold text-blue-600" href={article.sourceUrl} target="_blank" rel="noreferrer">{article.sourceName}</a>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={busyAction !== null || article.status !== 'generated'} onClick={() => runAction(`review-${article.id}`, async () => {
                      await apiRequest(`/api/ai-news/generated/${article.id}/publish`, { method: 'POST', body: JSON.stringify({ mode: 'manual' }) }, token);
                      toast.success('Sent to pending review');
                    })}>
                      <Send className="mr-2 h-4 w-4" /> Review
                    </Button>
                    <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={busyAction !== null || article.status !== 'generated'} onClick={() => runAction(`publish-${article.id}`, async () => {
                      await apiRequest(`/api/ai-news/generated/${article.id}/publish`, { method: 'POST', body: JSON.stringify({ mode: 'auto' }) }, token);
                      toast.success('Published');
                    })}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Publish
                    </Button>
                    <button
                      id={`delete-gen-${article.id}`}
                      onClick={() => deleteGenerated(article.id)}
                      disabled={busyAction !== null}
                      title="Delete generated article"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Scheduler ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-950">Scheduler</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span>Status</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${scheduler?.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{scheduler?.isEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span>Next run</span><span>{formatDate(scheduler?.nextRunAt)}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span>Last run</span><span>{formatDate(scheduler?.lastRunAt)}</span></div>
            {scheduler?.lastError && <div className="rounded-lg bg-red-50 p-3 text-red-700">{scheduler.lastError}</div>}
            <Button className="w-full" variant={scheduler?.isEnabled ? 'destructive' : 'success'} disabled={busyAction !== null} onClick={() => saveScheduler({ isEnabled: !scheduler?.isEnabled })}>
              {scheduler?.isEnabled ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {scheduler?.isEnabled ? 'Disable Scheduler' : 'Enable Scheduler'}
            </Button>
          </div>
        </section>

        {/* ── Publishing Logs ── */}
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-950">Publishing Logs</h2>
          </div>
          <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="grid grid-cols-1 gap-2 border-b border-slate-100 p-3 last:border-0 lg:grid-cols-[130px_90px_1fr_170px] lg:items-center">
                <span className="text-sm font-bold text-slate-800">{log.action}</span>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(log.status)}`}>{log.status}</span>
                <span className="text-sm text-slate-600">{log.message || '-'}</span>
                <span className="text-xs font-semibold text-slate-500">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
