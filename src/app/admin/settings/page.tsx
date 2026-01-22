'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { settingsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings as SettingsIcon, 
  Activity, 
  Save, 
  Info, 
  Globe, 
  DollarSign, 
  Palette, 
  Shield, 
  Search,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Bell,
  Users,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Layout
} from 'lucide-react';
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

interface ProhibitedWord {
  id: string;
  word: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriberStats {
  totalActive: number;
  totalUnsubscribed: number;
  subscribersToday: number;
  unsubscribersToday: number;
  currentConnections: number;
  growthTrend: Array<{ date: string; count: number }>;
}

interface Subscriber {
  id: string;
  user_id: string | null;
  device_info: string | null;
  ip_address: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  is_active: boolean;
  subscription_type: string;
  notification_count: number;
}

// Subscribers Tab Component
function SubscribersTab() {
  const { token } = useAuth();
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchSubscribers();
  }, [page]);

  const fetchStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/notifications/subscribers/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriber stats:', error);
    }
  };

  const fetchSubscribers = async () => {
    if (!token) return
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/notifications/subscribers?status=active&page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.subscribers)) {
        setSubscribers(data.data.subscribers);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setSubscribers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const parseDeviceInfo = (deviceInfo: string | null) => {
    if (!deviceInfo) return { browser: 'Unknown', os: 'Unknown' };
    try {
      const parsed = JSON.parse(deviceInfo);
      const ua = parsed.userAgent || '';
      
      // Simple browser detection
      let browser = 'Unknown';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      
      // Simple OS detection
      let os = parsed.platform || 'Unknown';
      
      return { browser, os };
    } catch {
      return { browser: 'Unknown', os: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalActive.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Total Active Subscribers</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Bell className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.subscribersToday.toLocaleString()}</p>
            <p className="text-sm text-slate-600">New Subscribers Today</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">LIVE</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.currentConnections.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Current Connections</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">+{stats.growthTrend.reduce((sum, day) => sum + day.count, 0)}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">7-Day Growth</p>
            <p className="text-sm text-slate-600">Weekly Trend</p>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Active Subscribers ({stats?.totalActive || 0})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading subscribers...</p>
          </div>
        ) : !subscribers || subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No subscribers yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Subscribed</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Notifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscribers.map((subscriber) => {
                    const device = parseDeviceInfo(subscriber.device_info);
                    return (
                      <tr key={subscriber.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {subscriber.user_id || <span className="text-slate-400 italic">Anonymous</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div>
                            <p className="font-medium">{device.browser}</p>
                            <p className="text-xs text-slate-500">{device.os}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{subscriber.ip_address}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {subscriber.subscription_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium text-center">
                          {subscriber.notification_count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Unsubscribers Tab Component
function UnsubscribersTab() {
  const { token } = useAuth();
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [unsubscribers, setUnsubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchUnsubscribers();
  }, [page]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/notifications/subscribers/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriber stats:', error);
    }
  };

  const fetchUnsubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/notifications/subscribers?status=unsubscribed&page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.subscribers)) {
        setUnsubscribers(data.data.subscribers);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setUnsubscribers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching unsubscribers:', error);
      setUnsubscribers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const parseDeviceInfo = (deviceInfo: string | null) => {
    if (!deviceInfo) return { browser: 'Unknown', os: 'Unknown' };
    try {
      const parsed = JSON.parse(deviceInfo);
      const ua = parsed.userAgent || '';
      
      // Simple browser detection
      let browser = 'Unknown';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      
      // Simple OS detection
      let os = parsed.platform || 'Unknown';
      
      return { browser, os };
    } catch {
      return { browser: 'Unknown', os: 'Unknown' };
    }
  };

  const calculateDuration = (subscribedAt: string, unsubscribedAt: string | null) => {
    if (!unsubscribedAt) return 'N/A';
    const start = new Date(subscribedAt);
    const end = new Date(unsubscribedAt);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <UserMinus className="w-8 h-8 text-red-600" />
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalUnsubscribed.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Total Unsubscribed</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.unsubscribersToday.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Unsubscribed Today</p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-slate-600" />
              <span className="text-xs font-bold text-slate-600">
                {stats.totalActive > 0 
                  ? `${((stats.totalUnsubscribed / (stats.totalActive + stats.totalUnsubscribed)) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">Churn Rate</p>
            <p className="text-sm text-slate-600">Unsubscribed vs Total</p>
          </div>
        </div>
      )}

      {/* Unsubscribers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-red-600" />
            Unsubscribed Users ({stats?.totalUnsubscribed || 0})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading unsubscribers...</p>
          </div>
        ) : !unsubscribers || unsubscribers.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No unsubscribers yet</p>
            <p className="text-sm text-slate-500 mt-2">Great! All your subscribers are still active.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Subscribed</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Unsubscribed</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unsubscribers.map((subscriber) => {
                    const device = parseDeviceInfo(subscriber.device_info);
                    return (
                      <tr key={subscriber.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {subscriber.user_id || <span className="text-slate-400 italic">Anonymous</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div>
                            <p className="font-medium">{device.browser}</p>
                            <p className="text-xs text-slate-500">{device.os}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{subscriber.ip_address}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          {subscriber.unsubscribed_at 
                            ? new Date(subscriber.unsubscribed_at).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {calculateDuration(subscriber.subscribed_at, subscriber.unsubscribed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const { token } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('site');
  const [siteSubTab, setSiteSubTab] = useState('general');
  const [themeSubTab, setThemeSubTab] = useState('carousel');
  const [pushSubTab, setPushSubTab] = useState('notification');
  
  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'ClassinNews',
    siteDescription: 'Your source for quality news',
    articlesPerPage: '10',
    moderationEnabled: 'true',
    emailNotifications: 'true',
    trending_topics_auto_delete: 'true',
    trending_topics_retention_days: '2',
    // Site branding
    site_logo_url: '',
    site_favicon_url: '',
    // homepage carousel settings
    homepage_carousel_enabled: 'false',
    homepage_carousel_interval: '5',
    homepage_carousel_effect: 'cube',
    homepage_carousel_show_title: 'true',
    // Push notification settings
    push_notifications_enabled: 'true',
    push_new_article_notification: 'true',
    push_require_user_consent: 'true',
    push_desktop_enabled: 'true',
    push_mobile_enabled: 'false',
    push_popup_reappear_days: '7',
  });

  // Prohibited Words state
  const [words, setWords] = useState<ProhibitedWord[]>([]);
  const [newWord, setNewWord] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [wordError, setWordError] = useState('');

  // Layout Settings state
  const [layoutSettings, setLayoutSettings] = useState({
    homepage_layout_style: 'sidebar-right',
    homepage_content_width: '66',
    homepage_sidebar_width: '33',
    homepage_sidebar_sticky: 'true',
    homepage_show_most_read: 'true',
    homepage_show_latest_news: 'true',
    homepage_show_categories: 'true',
    article_layout_style: 'sidebar-right',
    article_content_width: '66',
    article_sidebar_width: '33',
    article_sidebar_sticky: 'true',
    article_show_related: 'true',
    article_show_author_bio: 'true',
    article_show_share_buttons: 'true',
  });
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutSuccess, setLayoutSuccess] = useState('');
  const [layoutError, setLayoutError] = useState('');
  const [wordSuccess, setWordSuccess] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    fetchActivityLogs();
    fetchSettings();
    fetchLayoutSettings();
    if (activeTab === 'prohibited') {
      fetchProhibitedWords();
    }
  }, [token, activeTab]);

  const fetchActivityLogs = async () => {
    if (!token) return
    try {
      const response = await settingsAPI.getActivityLogs(token, { limit: 20 });
      const logs = response.data?.logs || response.data || [];
      setActivityLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const response = await settingsAPI.getAll(token);
      const settingsMap: Record<string, string> = {};
      if (Array.isArray(response.data)) {
        response.data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchProhibitedWords = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/prohibited-words', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWords(data.words);
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    }
  };

  const fetchLayoutSettings = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3002/api/layout-settings/public/all');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLayoutSettings(prev => ({ ...prev, ...data.data }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch layout settings:', error);
    }
  };

  const saveLayoutSettings = async (category: 'homepage' | 'article') => {
    if (!token) return;
    setLayoutLoading(true);
    setLayoutError('');
    setLayoutSuccess('');

    try {
      const prefix = category === 'homepage' ? 'homepage_' : 'article_';
      const settingsToSave = Object.entries(layoutSettings)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => ({ key, value }));

      const response = await fetch('http://localhost:3002/api/layout-settings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (response.ok) {
        setLayoutSuccess(`${category === 'homepage' ? 'Homepage' : 'Article'} layout settings saved successfully!`);
        setTimeout(() => setLayoutSuccess(''), 3000);
      } else {
        setLayoutError('Failed to save layout settings');
      }
    } catch (error) {
      console.error('Error saving layout settings:', error);
      setLayoutError('Failed to save layout settings');
    } finally {
      setLayoutLoading(false);
    }
  };

  const settingTypes: Record<string, { type: string; category: string }> = {
    siteName: { type: 'string', category: 'general' },
    siteDescription: { type: 'string', category: 'general' },
    articlesPerPage: { type: 'number', category: 'general' },
    moderationEnabled: { type: 'boolean', category: 'general' },
    emailNotifications: { type: 'boolean', category: 'general' },
    trending_topics_auto_delete: { type: 'boolean', category: 'general' },
    trending_topics_retention_days: { type: 'number', category: 'general' },
    site_logo_url: { type: 'string', category: 'general' },
    site_favicon_url: { type: 'string', category: 'general' },
    homepage_carousel_enabled: { type: 'boolean', category: 'homepage' },
    homepage_carousel_interval: { type: 'number', category: 'homepage' },
    homepage_carousel_effect: { type: 'string', category: 'homepage' },
    homepage_carousel_show_title: { type: 'boolean', category: 'homepage' },
  };

  const handleSaveSettings = async () => {
    if (!token) {
      alert('You must be logged in as an admin to save settings.');
      return;
    }

    try {
      const savePromises = [];
      const errors: string[] = [];

      for (const [key, value] of Object.entries(settings)) {
        const meta = settingTypes[key] ?? { type: 'string', category: 'general' };
        
        const savePromise = settingsAPI.update(token, key, { 
          value: String(value),
          type: meta.type,
          category: meta.category
        }).catch((error: any) => {
          console.error(`Failed to save setting ${key}:`, error);
          errors.push(`${key}: ${error.message || 'Unknown error'}`);
          return null;
        });
        
        savePromises.push(savePromise);
      }

      await Promise.all(savePromises);

      if (errors.length > 0) {
        alert(`Some settings failed to save:\n${errors.join('\n')}`);
      } else {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const addWord = async () => {
    if (!newWord.trim()) {
      setWordError('Please enter a word');
      return;
    }

    setWordError('');
    try {
      const res = await fetch('http://localhost:3002/api/prohibited-words', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: newWord.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setWordSuccess('Word added successfully!');
        setNewWord('');
        setShowAddForm(false);
        fetchProhibitedWords();
        setTimeout(() => setWordSuccess(''), 3000);
      } else {
        setWordError(data.error || 'Failed to add word');
      }
    } catch (err: any) {
      setWordError(err.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:3002/api/prohibited-words/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setWordSuccess(`Word ${!currentStatus ? 'activated' : 'deactivated'}!`);
        fetchProhibitedWords();
        setTimeout(() => setWordSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error toggling word:', err);
    }
  };

  const deleteWord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      const res = await fetch(`http://localhost:3002/api/prohibited-words/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setWordSuccess('Word deleted successfully!');
        fetchProhibitedWords();
        setTimeout(() => setWordSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting word:', err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('File size must be less than 5MB');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setUploadingLogo(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/upload/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSettings({ ...settings, site_logo_url: data.data.path });
        setUploadMessage('Logo uploaded successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
        
        // Refresh settings to get the new path
        fetchSettings();
      } else {
        setUploadMessage(data.message || 'Upload failed');
        setTimeout(() => setUploadMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      setUploadMessage('Failed to upload logo');
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    // Validate file size (2MB max for favicon)
    if (file.size > 2 * 1024 * 1024) {
      setUploadMessage('Favicon size must be less than 2MB');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setUploadingFavicon(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('favicon', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/upload/favicon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSettings({ ...settings, site_favicon_url: data.data.path });
        setUploadMessage('Favicon uploaded successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
        
        // Refresh settings to get the new path
        fetchSettings();
      } else {
        setUploadMessage(data.message || 'Upload failed');
        setTimeout(() => setUploadMessage(''), 5000);
      }
    } catch (error: any) {
      console.error('Favicon upload error:', error);
      setUploadMessage('Failed to upload favicon');
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setUploadingFavicon(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const activeWords = words.filter(w => w.isActive);
  const inactiveWords = words.filter(w => !w.isActive);

  const tabs = [
    { id: 'site', label: 'General Settings', icon: Globe },
    { id: 'push', label: 'Push Notifications', icon: Bell },
    { id: 'ads', label: 'Ads Settings', icon: DollarSign },
    { id: 'theme', label: 'Theme Settings', icon: Palette },
    { id: 'prohibited', label: 'Prohibited Words', icon: Shield },
    { id: 'seo', label: 'Search Engine', icon: Search },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'system', label: 'System Info', icon: Info },
  ];

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-slate-600 mt-1">Configure and manage your system preferences</p>
      </div>

      {/* Tabs Navigation */}
      <div className="rounded-2xl bg-white shadow-lg border border-slate-100 overflow-hidden">
        <div className="flex gap-0 border-b-2 border-slate-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-4 font-bold text-sm transition-all duration-300 border-b-4 relative ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-gradient-to-br from-purple-50 to-pink-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'site' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          {/* General Settings Sub-tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-slate-100">
            <button
              onClick={() => setSiteSubTab('general')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                siteSubTab === 'general'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Site Settings
            </button>
            <button
              onClick={() => setSiteSubTab('trending')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                siteSubTab === 'trending'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Topics Settings
            </button>
            <button
              onClick={() => window.location.href = '/admin/settings/earnings'}
              className="px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Earnings Settings
            </button>
            <button
              onClick={() => window.location.href = '/admin/settings/rating'}
              className="px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Rating Settings
            </button>
            <button
              onClick={() => window.location.href = '/admin/settings/commission'}
              className="px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Commission Settings
            </button>
          </div>

          {/* Site Settings Sub-tab Content */}
          {siteSubTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Site Name</label>
                <Input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Site Description</label>
                <Input
                  type="text"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Logo Settings */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Site Branding
                </h4>

                {uploadMessage && (
                  <div className={`p-3 rounded-lg ${uploadMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {uploadMessage}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Site Logo</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Upload your logo (PNG, JPG, SVG - max 5MB, recommended: 200x50px)
                      </p>
                    </div>
                    {uploadingLogo && (
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  {settings.site_logo_url && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Current Logo:</p>
                      <img 
                        src={`http://localhost:3006${settings.site_logo_url}`}
                        alt="Logo Preview" 
                        className="h-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.alt = '❌ Failed to load logo';
                          target.className = 'text-red-500 text-xs';
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">{settings.site_logo_url}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Site Favicon</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*,.ico"
                        onChange={handleFaviconUpload}
                        disabled={uploadingFavicon}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Upload favicon (ICO, PNG - max 2MB, recommended: 32x32px)
                      </p>
                    </div>
                    {uploadingFavicon && (
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  {settings.site_favicon_url && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Current Favicon:</p>
                      <img 
                        src={`http://localhost:3006${settings.site_favicon_url}`}
                        alt="Favicon Preview" 
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.alt = '❌ Failed to load favicon';
                          target.className = 'text-red-500 text-xs';
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">{settings.site_favicon_url}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Articles Per Page</label>
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
                  onChange={(e) => setSettings({ ...settings, moderationEnabled: e.target.checked.toString() })}
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
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked.toString() })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="notifications" className="text-sm font-semibold text-slate-700">
                  Enable Email Notifications
                </label>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {/* Topics Settings Sub-tab Content */}
          {siteSubTab === 'trending' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
                <input
                  type="checkbox"
                  id="trending-auto-delete"
                  checked={settings.trending_topics_auto_delete === 'true'}
                  onChange={(e) => setSettings({ ...settings, trending_topics_auto_delete: e.target.checked.toString() })}
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
                  value={settings.trending_topics_retention_days}
                  onChange={(e) => setSettings({ ...settings, trending_topics_retention_days: e.target.value })}
                  min="1"
                  max="30"
                  disabled={settings.trending_topics_auto_delete !== 'true'}
                  className="border-slate-200 focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Topics older than {settings.trending_topics_retention_days} day(s) will be deleted
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Push Notifications Tab */}
      {activeTab === 'push' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          {/* Push Notifications Sub-tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-slate-100">
            <button
              onClick={() => setPushSubTab('notification')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                pushSubTab === 'notification'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Notification Settings
            </button>
            <button
              onClick={() => setPushSubTab('mobile')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                pushSubTab === 'mobile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Mobile Notification
            </button>
            <button
              onClick={() => setPushSubTab('desktop')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                pushSubTab === 'desktop'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Desktop Notification
            </button>
            <button
              onClick={() => setPushSubTab('subscribers')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                pushSubTab === 'subscribers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscribers
            </button>
            <button
              onClick={() => setPushSubTab('unsubscribers')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                pushSubTab === 'unsubscribers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Unsubscribers
            </button>
          </div>

          {/* Notification Settings Sub-tab */}
          {pushSubTab === 'notification' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <Bell className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Push Notification System</h3>
                  <p className="text-sm text-slate-600">Notify readers instantly when new articles are published</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-300 transition-all">
                <div>
                  <label htmlFor="push_enabled" className="text-sm font-bold text-slate-700 block mb-1">
                    Enable Push Notifications
                  </label>
                  <p className="text-xs text-slate-500">Master switch for all push notifications</p>
                </div>
                <input
                  type="checkbox"
                  id="push_enabled"
                  checked={settings.push_notifications_enabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, push_notifications_enabled: e.target.checked.toString() })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-300 transition-all">
                <div>
                  <label htmlFor="push_new_article" className="text-sm font-bold text-slate-700 block mb-1">
                    New Article Notifications
                  </label>
                  <p className="text-xs text-slate-500">Notify readers when creators publish new articles</p>
                </div>
                <input
                  type="checkbox"
                  id="push_new_article"
                  checked={settings.push_new_article_notification === 'true'}
                  onChange={(e) => setSettings({ ...settings, push_new_article_notification: e.target.checked.toString() })}
                  disabled={settings.push_notifications_enabled !== 'true'}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-300 transition-all">
                <div>
                  <label htmlFor="push_consent" className="text-sm font-bold text-slate-700 block mb-1">
                    Require User Consent
                  </label>
                  <p className="text-xs text-slate-500">Ask users to accept notifications before sending (Recommended)</p>
                </div>
                <input
                  type="checkbox"
                  id="push_consent"
                  checked={settings.push_require_user_consent === 'true'}
                  onChange={(e) => setSettings({ ...settings, push_require_user_consent: e.target.checked.toString() })}
                  disabled={settings.push_notifications_enabled !== 'true'}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-300 transition-all">
                <div className="flex-1">
                  <label htmlFor="push_popup_reappear" className="text-sm font-bold text-slate-700 block mb-1">
                    Popup Reappear Time (Days)
                  </label>
                  <p className="text-xs text-slate-500">If user rejects notification, show popup again after this many days</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    id="push_popup_reappear"
                    min="1"
                    max="365"
                    value={settings.push_popup_reappear_days}
                    onChange={(e) => setSettings({ ...settings, push_popup_reappear_days: e.target.value })}
                    disabled={settings.push_notifications_enabled !== 'true'}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-slate-600 font-medium">days</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Notification Settings
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Notification Sub-tab */}
          {pushSubTab === 'mobile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200">
                <div>
                  <label htmlFor="push_mobile" className="text-sm font-bold text-slate-700 block mb-1">
                    Enable Mobile Notifications
                  </label>
                  <p className="text-xs text-slate-500">Send push notifications to mobile devices</p>
                </div>
                <input
                  type="checkbox"
                  id="push_mobile"
                  checked={settings.push_mobile_enabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, push_mobile_enabled: e.target.checked.toString() })}
                  disabled={settings.push_notifications_enabled !== 'true'}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">Mobile Notification Configuration</p>
                <p className="text-sm text-slate-500">Coming soon - Configure FCM and APNs settings</p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Mobile Settings
                </Button>
              </div>
            </div>
          )}

          {/* Desktop Notification Sub-tab */}
          {pushSubTab === 'desktop' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-slate-200">
                <div>
                  <label htmlFor="push_desktop" className="text-sm font-bold text-slate-700 block mb-1">
                    Enable Desktop Notifications
                  </label>
                  <p className="text-xs text-slate-500">Send browser push notifications to desktop users</p>
                </div>
                <input
                  type="checkbox"
                  id="push_desktop"
                  checked={settings.push_desktop_enabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, push_desktop_enabled: e.target.checked.toString() })}
                  disabled={settings.push_notifications_enabled !== 'true'}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Desktop Notification Requirements
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>User must grant browser notification permission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Works with Chrome, Firefox, Safari, and Edge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Requires HTTPS connection in production</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Desktop Settings
                </Button>
              </div>
            </div>
          )}

          {/* Subscribers Tab */}
          {pushSubTab === 'subscribers' && (
            <SubscribersTab />
          )}

          {/* Unsubscribers Tab */}
          {pushSubTab === 'unsubscribers' && (
            <UnsubscribersTab />
          )}
        </div>
      )}

      {/* Ads Settings Tab */}
      {activeTab === 'ads' && (
        <div className="rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
          {/* Redirect to dedicated ads page */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Advertisement Management</h2>
                <p className="text-green-100">Manage ad placements across your news portal</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                <div className="text-4xl font-bold text-purple-600 mb-2">13</div>
                <p className="text-slate-700 font-medium">Total Ad Placements</p>
                <p className="text-sm text-slate-500 mt-1">Homepage & Article pages</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100">
                <div className="text-4xl font-bold text-blue-600 mb-2">6</div>
                <p className="text-slate-700 font-medium">Homepage Ads</p>
                <p className="text-sm text-slate-500 mt-1">Banners & Sidebars</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-100">
                <div className="text-4xl font-bold text-orange-600 mb-2">7</div>
                <p className="text-slate-700 font-medium">Article Page Ads</p>
                <p className="text-sm text-slate-500 mt-1">Inline & Sidebar ads</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-8 border border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Toggle Activation</p>
                    <p className="text-sm text-slate-600">Enable/disable ads with one click</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Code Editor</p>
                    <p className="text-sm text-slate-600">Edit HTML/JavaScript ad code</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Live Preview</p>
                    <p className="text-sm text-slate-600">Preview ads before publishing</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Analytics Ready</p>
                    <p className="text-sm text-slate-600">Track performance & revenue</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/admin/settings/ads"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <DollarSign className="w-6 h-6" />
                Open Ad Management Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <p className="text-sm text-slate-500 mt-4">
                Manage all 13 ad placements • Edit code • Toggle activation • Preview changes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Theme Settings Tab */}
      {activeTab === 'theme' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          {/* Theme Settings Sub-tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-slate-100">
            <button
              onClick={() => setThemeSubTab('carousel')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                themeSubTab === 'carousel'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Homepage Carousel
            </button>
            <button
              onClick={() => setThemeSubTab('colors')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                themeSubTab === 'colors'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Colors & Branding
            </button>
            <button
              onClick={() => setThemeSubTab('homepage-layout')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                themeSubTab === 'homepage-layout'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Homepage Layout
            </button>
            <button
              onClick={() => setThemeSubTab('article-layout')}
              className={`px-4 py-3 font-semibold text-sm transition-all duration-300 border-b-4 ${
                themeSubTab === 'article-layout'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Article Page Layout
            </button>
          </div>

          {/* Homepage Carousel Sub-tab Content */}
          {themeSubTab === 'carousel' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 rounded-xl bg-pink-50 border border-pink-100">
                <input
                  type="checkbox"
                  id="carousel_enabled"
                  checked={settings.homepage_carousel_enabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, homepage_carousel_enabled: e.target.checked.toString() })}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="carousel_enabled" className="text-sm font-semibold text-slate-700">
                  Enable 3D Carousel on Homepage
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Autoplay Interval (seconds)
                </label>
                <Input
                  type="number"
                  value={settings.homepage_carousel_interval}
                  onChange={(e) => setSettings({ ...settings, homepage_carousel_interval: String(Number(e.target.value) || 5) })}
                  min="2"
                  max="30"
                  className="border-slate-200 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Carousel Effect
                </label>
                <select
                  value={settings.homepage_carousel_effect}
                  onChange={(e) => setSettings({ ...settings, homepage_carousel_effect: e.target.value })}
                  className="px-3 py-2 border-2 border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-medium text-slate-700"
                >
                  <option value="cube">Cube (3D Rotation)</option>
                  <option value="flip">Flip (Vertical Rotation)</option>
                  <option value="slide">Slide (Overlay)</option>
                  <option value="fade">Fade (Crossfade)</option>
                  <option value="stack">Stack (Cards Behind)</option>
                  <option value="coverflow">Coverflow (3D Flow)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-xl bg-pink-50 border border-pink-100">
                <input
                  type="checkbox"
                  id="carousel_show_title"
                  checked={settings.homepage_carousel_show_title === 'true'}
                  onChange={(e) => setSettings({ ...settings, homepage_carousel_show_title: e.target.checked.toString() })}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="carousel_show_title" className="text-sm font-semibold text-slate-700">
                  Show title overlay on carousel panels
                </label>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30 gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {/* Colors & Branding Sub-tab Content */}
          {themeSubTab === 'colors' && (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Colors & Branding customization coming soon...</p>
            </div>
          )}

          {/* Homepage Layout Sub-tab Content */}
          {themeSubTab === 'homepage-layout' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Layout className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Homepage Structure</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Control the layout and structure of your homepage including sidebar position, section visibility, and content width.
                </p>
              </div>

              {/* Success/Error Messages */}
              {layoutSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{layoutSuccess}</span>
                </div>
              )}
              {layoutError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{layoutError}</span>
                </div>
              )}

              {/* Layout Style */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Layout Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['sidebar-right', 'sidebar-left', 'full-width', 'boxed'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setLayoutSettings({...layoutSettings, homepage_layout_style: style})}
                      className={`border-2 rounded-xl p-4 text-left hover:shadow-lg transition-all ${
                        layoutSettings.homepage_layout_style === style
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 mb-1 capitalize">{style.replace('-', ' ')}</div>
                      <div className="text-xs text-slate-600">
                        {style === 'sidebar-right' && 'Content on left, sidebar on right'}
                        {style === 'sidebar-left' && 'Sidebar on left, content on right'}
                        {style === 'full-width' && 'No sidebar, full-width content'}
                        {style === 'boxed' && 'Centered with max width'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Width Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Content Width ({layoutSettings.homepage_content_width}%)
                  </label>
                  <input
                    type="range"
                    min="33"
                    max="100"
                    value={layoutSettings.homepage_content_width}
                    onChange={(e) => setLayoutSettings({...layoutSettings, homepage_content_width: e.target.value})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sidebar Width ({layoutSettings.homepage_sidebar_width}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="66"
                    value={layoutSettings.homepage_sidebar_width}
                    onChange={(e) => setLayoutSettings({...layoutSettings, homepage_sidebar_width: e.target.value})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Section Visibility */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Section Visibility
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Featured Article / Carousel</div>
                      <div className="text-xs text-slate-600">Top hero section</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Most Read Section</div>
                      <div className="text-xs text-slate-600">Popular articles grid</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Latest News Section</div>
                      <div className="text-xs text-slate-600">Recent articles</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Category Sections</div>
                      <div className="text-xs text-slate-600">Articles by category</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <input
                    type="checkbox"
                    id="homepage_sidebar_sticky"
                    defaultChecked
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="homepage_sidebar_sticky" className="text-sm font-semibold text-slate-700">
                    Make sidebar sticky on scroll
                  </label>
                </div>
              </div>

              <button
                onClick={() => saveLayoutSettings('homepage')}
                disabled={layoutLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/30 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {layoutLoading ? 'Saving...' : 'Save Homepage Layout'}
              </button>
            </div>
          )}

          {/* Article Page Layout Sub-tab Content */}
          {themeSubTab === 'article-layout' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-slate-900">Article Page Structure</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Customize the layout of article pages including sidebar position, related articles, and content width.
                </p>
              </div>

              {/* Layout Style */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Layout Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="border-2 border-purple-500 bg-purple-50 rounded-xl p-4 text-left hover:shadow-lg transition-all">
                    <div className="font-semibold text-slate-900 mb-1">Sidebar Right</div>
                    <div className="text-xs text-slate-600">Article content on left</div>
                  </button>
                  <button className="border-2 border-slate-200 bg-white rounded-xl p-4 text-left hover:border-purple-300 hover:shadow-lg transition-all">
                    <div className="font-semibold text-slate-900 mb-1">Sidebar Left</div>
                    <div className="text-xs text-slate-600">Sidebar on left side</div>
                  </button>
                  <button className="border-2 border-slate-200 bg-white rounded-xl p-4 text-left hover:border-purple-300 hover:shadow-lg transition-all">
                    <div className="font-semibold text-slate-900 mb-1">Full Width</div>
                    <div className="text-xs text-slate-600">No sidebar, full article</div>
                  </button>
                  <button className="border-2 border-slate-200 bg-white rounded-xl p-4 text-left hover:border-purple-300 hover:shadow-lg transition-all">
                    <div className="font-semibold text-slate-900 mb-1">Centered</div>
                    <div className="text-xs text-slate-600">Centered reading experience</div>
                  </button>
                </div>
              </div>

              {/* Width Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Article Content Width (%)
                  </label>
                  <input
                    type="range"
                    min="33"
                    max="100"
                    defaultValue="66"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="text-sm text-slate-600 mt-1">Current: 66%</div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sidebar Width (%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="66"
                    defaultValue="33"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="text-sm text-slate-600 mt-1">Current: 33%</div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Article Features
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Related Articles</div>
                      <div className="text-xs text-slate-600">Show related content below article</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Author Bio Section</div>
                      <div className="text-xs text-slate-600">Show author information</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-900">Social Share Buttons</div>
                      <div className="text-xs text-slate-600">Enable social sharing</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <input
                    type="checkbox"
                    id="article_sidebar_sticky"
                    defaultChecked
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="article_sidebar_sticky" className="text-sm font-semibold text-slate-700">
                    Make article sidebar sticky on scroll
                  </label>
                </div>
              </div>

              <button
                onClick={() => saveLayoutSettings('article')}
                disabled={layoutLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {layoutLoading ? 'Saving...' : 'Save Article Layout'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prohibited Words Tab */}
      {activeTab === 'prohibited' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Prohibited Words Management</h2>
          </div>

          <p className="text-slate-600 mb-6">
            Manage the list of prohibited words for comment filtering. Comments containing these words will be automatically rejected.
          </p>

          {/* Success Message */}
          {wordSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{wordSuccess}</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1 font-semibold">Total Words</p>
                  <p className="text-3xl font-bold text-slate-900">{words.length}</p>
                </div>
                <Shield className="w-12 h-12 text-purple-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1 font-semibold">Active</p>
                  <p className="text-3xl font-bold text-green-600">{activeWords.length}</p>
                </div>
                <Check className="w-12 h-12 text-green-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1 font-semibold">Inactive</p>
                  <p className="text-3xl font-bold text-slate-400">{inactiveWords.length}</p>
                </div>
                <X className="w-12 h-12 text-slate-300" />
              </div>
            </div>
          </div>

          {/* Add Word Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Prohibited Word
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Prohibited Word</h3>
              
              {wordError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{wordError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addWord()}
                  placeholder="Enter word to prohibit..."
                  className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={addWord}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg font-semibold"
                >
                  Add Word
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWord('');
                    setWordError('');
                  }}
                  className="bg-slate-300 text-slate-700 px-6 py-2 rounded-xl hover:bg-slate-400 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active Words */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-600" />
              Active Words ({activeWords.length})
            </h3>
            
            {activeWords.length === 0 ? (
              <p className="text-slate-500">No active prohibited words</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {activeWords.map((word) => (
                  <div
                    key={word.id}
                    className="bg-white border-2 border-red-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="font-bold text-slate-900">{word.word}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleActive(word.id, word.isActive)}
                        className="flex-1 bg-slate-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                        title="Deactivate"
                      >
                        <X className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={() => deleteWord(word.id)}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs hover:from-red-600 hover:to-orange-600 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Words */}
          {inactiveWords.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <X className="w-6 h-6 text-slate-400" />
                Inactive Words ({inactiveWords.length})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {inactiveWords.map((word) => (
                  <div
                    key={word.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <span className="font-bold text-slate-700">{word.word}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleActive(word.id, word.isActive)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-lg text-xs hover:from-green-600 hover:to-emerald-600 transition-all"
                        title="Activate"
                      >
                        <Check className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={() => deleteWord(word.id)}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs hover:from-red-600 hover:to-orange-600 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEO Settings Tab */}
      {activeTab === 'seo' && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Search Engine Optimization</h2>
          </div>
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">SEO settings coming soon...</p>
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
              <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No activity logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-1">By {log.user?.username || 'Unknown'}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(log.createdAt)}</p>
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
              <Info className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">System Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100">
              <p className="text-sm font-semibold text-slate-600 mb-2">Version</p>
              <p className="text-3xl font-bold text-slate-900">1.0.0</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100">
              <p className="text-sm font-semibold text-slate-600 mb-2">Environment</p>
              <p className="text-3xl font-bold text-slate-900">Production</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
              <p className="text-sm font-semibold text-slate-600 mb-2">Last Updated</p>
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
