'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Plus, X, Tag } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { adminAuthFetch } from '@/lib/admin-session';

const API_URL = getApiUrl();

const DEFAULT_TAGS = [
  "Latest News",
  "Breaking News",
  "Afternoon News",
  "Morning Brief",
  "Sports Update",
  "Entertainment"
];

export default function ArticlePageSettings() {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [perView, setPerView] = useState('10');
  const [autoDelete, setAutoDelete] = useState('false');
  const [retentionDays, setRetentionDays] = useState('7');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminAuthFetch(`${API_URL}/api/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      
      const settingsMap = new Map(data.data.map((item: any) => [item.key, item.value]));
      
      if (settingsMap.has('news_flash_tags')) {
        try {
          setTags(JSON.parse(settingsMap.get('news_flash_tags')));
        } catch {
          setTags(DEFAULT_TAGS);
        }
      } else {
        setTags(DEFAULT_TAGS);
      }
      
      if (settingsMap.has('latest_news_per_view')) setPerView(settingsMap.get('latest_news_per_view'));
      if (settingsMap.has('trending_topics_auto_delete')) setAutoDelete(settingsMap.get('trending_topics_auto_delete'));
      if (settingsMap.has('trending_topics_retention_days')) setRetentionDays(settingsMap.get('trending_topics_retention_days'));
      
    } catch (err) {
      console.error(err);
      setMessage('Error loading settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        settings: [
          { key: 'news_flash_tags', value: JSON.stringify(tags), type: 'json', category: 'article-page' },
          { key: 'latest_news_per_view', value: perView, type: 'number', category: 'article-page' },
          { key: 'trending_topics_auto_delete', value: autoDelete, type: 'boolean', category: 'article-page' },
          { key: 'trending_topics_retention_days', value: retentionDays, type: 'number', category: 'article-page' },
        ]
      };

      const res = await adminAuthFetch(`${API_URL}/api/settings/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save settings');
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (loading) return <div className="text-slate-500 animate-pulse">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      {/* News Flash Tags */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            News Flash Tags
          </h3>
          <p className="text-sm text-slate-500">
            Manage the tags available for publishers when creating articles (e.g. Breaking News, Latest News). These tags appear in push notifications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-purple-200">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:bg-purple-200 p-0.5 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {tags.length === 0 && <span className="text-sm text-slate-400 italic">No tags defined.</span>}
        </div>

        <div className="flex gap-2 pt-2">
          <Input 
            value={newTag} 
            onChange={e => setNewTag(e.target.value)} 
            placeholder="Add a new tag..." 
            onKeyDown={e => e.key === 'Enter' && addTag()}
            className="flex-1"
          />
          <Button onClick={addTag} variant="secondary" className="gap-2">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {/* Layout Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Layout & Display</h3>
          <p className="text-sm text-slate-500">Configure how articles appear on the frontend.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              "Latest News" Articles per view
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Number of articles to show in the Latest News section before displaying the "Browse More" button.
            </p>
            <Input
              type="number"
              value={perView}
              onChange={(e) => setPerView(e.target.value)}
              className="max-w-[150px]"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Old Trending Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Trending Topics Maintenance</h3>
          <p className="text-sm text-slate-500">Manage how old trending topics are handled.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
            <input
              type="checkbox"
              id="trending-auto-delete"
              checked={autoDelete === 'true'}
              onChange={(e) => setAutoDelete(e.target.checked.toString())}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="trending-auto-delete" className="text-sm font-semibold text-slate-700">
              Auto-delete old trending topics
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Retention Days
            </label>
            <Input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              min="1"
              max="30"
              disabled={autoDelete !== 'true'}
              className="max-w-[150px] disabled:bg-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Topics older than {retentionDays} day(s) will be deleted
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2 disabled:opacity-60 px-8">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
