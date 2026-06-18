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
  FileText,
  Play,
  Plus,
  RefreshCw,
  Rss,
  Send,
  Settings,
  Sparkles,
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
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data as T;
}

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
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">News Sources</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{sources.length} total</span>
          </div>
          <form onSubmit={handleAddSource} className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr_160px_90px_auto]">
            <Input placeholder="Source name" value={sourceForm.name} onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })} required />
            <Input placeholder="RSS URL" value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} required />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={sourceForm.defaultCategory} onChange={(event) => setSourceForm({ ...sourceForm, defaultCategory: event.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <Input type="number" min="1" max="5" value={sourceForm.trustLevel} onChange={(event) => setSourceForm({ ...sourceForm, trustLevel: event.target.value })} />
            <Button type="submit" disabled={busyAction !== null}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </form>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            {sources.map((source) => (
              <div key={source.id} className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1fr_150px_110px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{source.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${source.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{source.isActive ? 'Active' : 'Paused'}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{source.url}</p>
                </div>
                <div className="text-sm text-slate-600">{source.defaultCategory || 'Unassigned'}</div>
                <div className="text-sm text-slate-500">{formatDate(source.lastCheckedAt)}</div>
              </div>
            ))}
          </div>
        </section>

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
                  <Button size="sm" disabled={busyAction !== null || story.status !== 'new'} onClick={() => runAction(`generate-${story.id}`, async () => {
                    await apiRequest(`/api/ai-news/stories/${story.id}/generate`, { method: 'POST' }, token);
                    toast.success('Article generated');
                  })}>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

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
                  <div className="flex gap-2">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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

