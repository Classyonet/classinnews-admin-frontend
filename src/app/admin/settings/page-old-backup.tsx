'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { settingsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings as SettingsIcon, Activity, Save, LayoutDashboard, Info } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  user: {
    username: string;
  };
  createdAt: string;
}

export default function SettingsPage() {
  const { token } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'ClassyNews',
    siteDescription: 'Your source for quality news',
    articlesPerPage: '10',
    moderationEnabled: 'true',
    emailNotifications: 'true',
    // homepage carousel settings
    homepage_carousel_enabled: 'false',
    homepage_carousel_interval: '5',
    homepage_carousel_effect: 'cube',
    homepage_carousel_show_title: 'true',
    // trending topics auto-deletion
    trending_topics_auto_delete: 'true',
    trending_topics_retention_days: '2'
  });

  useEffect(() => {
    fetchActivityLogs();
    // Load existing settings only if admin is authenticated
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await settingsAPI.getAll(token);
        const settingsMap: Record<string, string> = {};
        if (Array.isArray(response.data)) {
          response.data.forEach((setting: any) => {
            settingsMap[setting.key] = setting.value;
          });
          // Update state with existing settings, keeping defaults for missing values
          setSettings(prev => ({
            ...prev,
            ...settingsMap
          }));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, [token]);

  const fetchActivityLogs = async () => {
    try {
      const response = await settingsAPI.getActivityLogs(token!, { limit: 20 });
      // The API returns { data: { logs: [...], pagination: {...} } }
      const logs = response.data?.logs || response.data || [];
      setActivityLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const settingTypes: Record<string, { type: string; category: string }> = {
    siteName: { type: 'string', category: 'general' },
    siteDescription: { type: 'string', category: 'general' },
    articlesPerPage: { type: 'number', category: 'general' },
    moderationEnabled: { type: 'boolean', category: 'general' },
    emailNotifications: { type: 'boolean', category: 'general' },
    homepage_carousel_enabled: { type: 'boolean', category: 'homepage' },
    homepage_carousel_interval: { type: 'number', category: 'homepage' },
    homepage_carousel_effect: { type: 'string', category: 'homepage' },
    homepage_carousel_show_title: { type: 'boolean', category: 'homepage' },
    trending_topics_auto_delete: { type: 'boolean', category: 'general' },
    trending_topics_retention_days: { type: 'number', category: 'general' },
  };

  const handleSaveSettings = async () => {
    if (!token) {
      alert('You must be logged in as an admin to save settings.');
      return;
    }

    try {
      const savePromises = [];
      const errors: string[] = [];

      // Save each setting with its type and category
      for (const [key, value] of Object.entries(settings)) {
        const meta = settingTypes[key] ?? { type: 'string', category: 'general' };
        
        const savePromise = settingsAPI.update(token!, key, { 
          value: String(value),
          type: meta.type,
          category: meta.category
        }).catch((error: any) => {
          console.error(`Failed to save setting ${key}:`, error);
          errors.push(`${key}: ${error.message || 'Unknown error'}`);
          return null; // Continue with other settings
        });
        
        savePromises.push(savePromise);
      }

      await Promise.all(savePromises);

      if (errors.length > 0) {
        alert(`Some settings failed to save:\n${errors.join('\n')}\n\nPlease check the console for details.`);
      } else {
        console.log('All settings saved successfully!');
        alert('Settings saved successfully! Please refresh the news portal to see changes.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log('Settings error details:', { message, error });
      alert('Failed to save settings: ' + message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-slate-600 mt-1">Manage system settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl bg-white shadow-lg border border-slate-100 overflow-hidden">
        <div className="flex gap-0 border-b-2 border-slate-100">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-8 py-5 font-bold text-base transition-all duration-300 border-b-4 relative ${
              activeTab === 'general'
                ? 'border-purple-600 text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              <span>General Settings</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex-1 px-8 py-5 font-bold text-base transition-all duration-300 border-b-4 relative ${
              activeTab === 'homepage'
                ? 'border-purple-600 text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LayoutDashboard className="w-5 h-5" />
              <span>Homepage Carousel</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-8 py-5 font-bold text-base transition-all duration-300 border-b-4 relative ${
              activeTab === 'activity'
                ? 'border-purple-600 text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-5 h-5" />
              <span>Activity Logs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-8 py-5 font-bold text-base transition-all duration-300 border-b-4 relative ${
              activeTab === 'system'
                ? 'border-purple-600 text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Info className="w-5 h-5" />
              <span>System Info</span>
            </div>
          </button>
        </div>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Site Name
              </label>
              <Input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Site Description
              </label>
              <Input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Articles Per Page
              </label>
              <Input
                type="number"
                value={settings.articlesPerPage}
                onChange={(e) => setSettings({ ...settings, articlesPerPage: e.target.value })}
                min="5"
                max="50"
                className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <input
                type="checkbox"
                id="moderation"
                checked={settings.moderationEnabled === 'true'}
                onChange={(e) =>
                  setSettings({ ...settings, moderationEnabled: e.target.checked.toString() })
                }
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="moderation" className="text-sm font-semibold text-slate-700">
                Enable Content Moderation
              </label>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.emailNotifications === 'true'}
                onChange={(e) =>
                  setSettings({ ...settings, emailNotifications: e.target.checked.toString() })
                }
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="notifications" className="text-sm font-semibold text-slate-700">
                Enable Email Notifications
              </label>
            </div>

            {/* Trending Topics Settings */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-purple-600">Trending Topics</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <input
                    type="checkbox"
                    id="trending-auto-delete"
                    checked={settings.trending_topics_auto_delete === 'true'}
                    onChange={(e) =>
                      setSettings({ ...settings, trending_topics_auto_delete: e.target.checked.toString() })
                    }
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="trending-auto-delete" className="text-sm font-semibold text-slate-700">
                    Auto-delete old trending topics
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Retention Days (topics older than this will be deleted)
                  </label>
                  <Input
                    type="number"
                    value={settings.trending_topics_retention_days}
                    onChange={(e) => setSettings({ ...settings, trending_topics_retention_days: e.target.value })}
                    min="1"
                    max="30"
                    disabled={settings.trending_topics_auto_delete !== 'true'}
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Topics will be automatically deleted after {settings.trending_topics_retention_days} day(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Homepage Settings Tab */}
      {activeTab === 'homepage' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Homepage Carousel</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <input
                id="carousel_enabled"
                type="checkbox"
                checked={settings.homepage_carousel_enabled === 'true'}
                onChange={(e) => setSettings({ ...settings, homepage_carousel_enabled: e.target.checked.toString() })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="carousel_enabled" className="text-sm font-semibold text-slate-700">
                Enable 3D Carousel on Homepage
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Autoplay interval (seconds)
              </label>
              <Input
                type="number"
                value={settings.homepage_carousel_interval}
                onChange={(e) => setSettings({ ...settings, homepage_carousel_interval: String(Number(e.target.value) || 5) })}
                min="2"
                max="30"
                className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Effect
              </label>
              <select
                value={settings.homepage_carousel_effect}
                onChange={(e) => setSettings({ ...settings, homepage_carousel_effect: e.target.value })}
                className="px-3 py-2 border-2 border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-slate-700"
              >
                <option value="cube">Cube (3D Rotation)</option>
                <option value="flip">Flip (Vertical Rotation)</option>
                <option value="slide">Slide (Overlay)</option>
                <option value="fade">Fade (Crossfade)</option>
                <option value="stack">Stack (Cards Behind)</option>
                <option value="coverflow">Coverflow (3D Flow)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <input
                id="carousel_show_title"
                type="checkbox"
                checked={settings.homepage_carousel_show_title === 'true'}
                onChange={(e) => setSettings({ ...settings, homepage_carousel_show_title: e.target.checked.toString() })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="carousel_show_title" className="text-sm font-semibold text-slate-700">
                Show title overlay on carousel panels
              </label>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          </div>
          {activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-600 font-medium">No activity logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    By {log.user?.username || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* System Info Tab */}
      {activeTab === 'system' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">System Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <p className="text-sm font-semibold text-slate-600">Version</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">1.0.0</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <p className="text-sm font-semibold text-slate-600">Environment</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">Production</p>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <p className="text-sm font-semibold text-slate-600">Last Updated</p>
              <p className="text-lg font-bold text-slate-900 mt-2">
                {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
