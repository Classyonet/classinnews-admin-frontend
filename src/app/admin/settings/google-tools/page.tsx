'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getApiUrl } from '@/lib/api-config';
import { adminApiFetch } from '@/lib/admin-session';
import {
  Save, ArrowLeft, BarChart3, Search, Tag, Code2, Rss,
  Map, ExternalLink, CheckCircle, Info, Copy, Globe
} from 'lucide-react';

const API_URL = getApiUrl();
const SITE_URL = 'https://classinnews.com';

interface GoogleToolsSettings {
  ga_measurement_id: string;
  gtm_container_id: string;
  google_site_verification: string;
  google_publisher_center_url: string;
  default_seo_description: string;
  default_og_image: string;
}

const DEFAULT_SETTINGS: GoogleToolsSettings = {
  ga_measurement_id: '',
  gtm_container_id: '',
  google_site_verification: '',
  google_publisher_center_url: '',
  default_seo_description: '',
  default_og_image: '',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function QuickLinkCard({ label, url, description }: { label: string; url: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="flex items-center gap-1 mt-1">
          <code className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono truncate">{url}</code>
          <CopyButton text={url} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function GoogleToolsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<GoogleToolsSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics');

  useEffect(() => {
    if (token) loadSettings();
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApiFetch(`${API_URL}/api/settings?category=google_tools`, {
        headers: { 'Content-Type': 'application/json' }
      }, token);
      if (res.ok) {
        const { data } = await res.json();
        if (Array.isArray(data)) {
          const loaded: any = { ...DEFAULT_SETTINGS };
          data.forEach((s: any) => { if (s.key in loaded) loaded[s.key] = s.value || ''; });
          setSettings(loaded);
        }
      }
    } catch (err) {
      console.error('Failed to load Google tools settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key, value, type: 'string', category: 'google_tools'
      }));
      const res = await adminApiFetch(`${API_URL}/api/settings/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      }, token);
      if (res.ok) {
        alert('Google Tools settings saved successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'analytics', label: 'Analytics & Tags', icon: BarChart3 },
    { id: 'search', label: 'Search Console', icon: Search },
    { id: 'seo', label: 'SEO Defaults', icon: Globe },
    { id: 'feeds', label: 'RSS & Sitemap', icon: Rss },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/admin/settings" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </a>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Google Build Tools</h1>
              <p className="text-gray-600">Configure Google Analytics, Search Console, SEO, RSS feeds and sitemap</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Nav */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              {sections.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-100 last:border-0 ${
                      activeSection === s.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">

            {/* Analytics & Tags */}
            {activeSection === 'analytics' && (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Analytics & Tag Manager</h2>
                    <p className="text-sm text-gray-500">Track visitors and manage marketing tags</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google Analytics 4 Measurement ID
                    </label>
                    <input
                      type="text"
                      value={settings.ga_measurement_id}
                      onChange={e => setSettings({ ...settings, ga_measurement_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Google Analytics → Admin → Data Streams → your stream</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google Tag Manager Container ID
                    </label>
                    <input
                      type="text"
                      value={settings.gtm_container_id}
                      onChange={e => setSettings({ ...settings, gtm_container_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="GTM-XXXXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Google Tag Manager → your container. Used if you want to manage tags through GTM instead.</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>Tip:</strong> Use either GA4 OR GTM — not both. If you use GTM, configure GA4 inside the Tag Manager container instead. Both scripts are injected into the Newsportal automatically once saved.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Links to Google */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Google Analytics', href: 'https://analytics.google.com' },
                      { label: 'Tag Manager', href: 'https://tagmanager.google.com' },
                    ].map(link => (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        {link.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search Console */}
            {activeSection === 'search' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Search className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Google Search Console</h2>
                      <p className="text-sm text-gray-500">Verify ownership and monitor search performance</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Code (meta tag content value)
                      </label>
                      <input
                        type="text"
                        value={settings.google_site_verification}
                        onChange={e => setSettings({ ...settings, google_site_verification: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. uXnhIeDrxf525zBlM6AI-0Z..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        In Google Search Console, choose "HTML tag" method and copy only the content=&quot;...&quot; value here. Already hardcoded: <code className="bg-gray-100 px-1 rounded text-xs">uXnhIeDrxf525zBlM6AI-0ZbeU610PtFY_3ek_BNwvs</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sitemap & Indexing */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Map className="w-4 h-4 text-gray-600" /> Sitemap & Indexing
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Submit these URLs in Google Search Console → Sitemaps:</p>
                  <div className="space-y-3">
                    <QuickLinkCard
                      label="Sitemap XML"
                      url={`${SITE_URL}/sitemap.xml`}
                      description="Auto-generated sitemap including all articles, categories and static pages. Refreshes every hour."
                    />
                    <QuickLinkCard
                      label="RSS Feed"
                      url={`${SITE_URL}/feed.xml`}
                      description="RSS 2.0 feed for the latest 50 articles. Submit to Google Publisher Center for News indexing."
                    />
                  </div>

                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">How to submit:</h4>
                    <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                      <li>Open <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline">Google Search Console</a></li>
                      <li>Select your property (classinnews.com)</li>
                      <li>Click <strong>Sitemaps</strong> in the left sidebar</li>
                      <li>Enter <code className="bg-green-100 px-1 rounded">sitemap.xml</code> and click Submit</li>
                    </ol>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { label: 'Search Console', href: 'https://search.google.com/search-console' },
                      { label: 'Publisher Center', href: 'https://publishercenter.google.com' },
                      { label: 'Rich Results Test', href: 'https://search.google.com/test/rich-results' },
                      { label: 'URL Inspection', href: 'https://search.google.com/search-console/inspect' },
                    ].map(link => (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        {link.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Defaults */}
            {activeSection === 'seo' && (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">SEO Defaults</h2>
                    <p className="text-sm text-gray-500">Global fallback values used when article-specific values are missing</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Meta Description (Fallback)
                    </label>
                    <textarea
                      value={settings.default_seo_description}
                      onChange={e => setSettings({ ...settings, default_seo_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Classy News – Your source for breaking news, politics, sports, entertainment and more."
                    />
                    <p className="text-xs text-gray-500 mt-1">Keep between 120–160 characters. Currently: {settings.default_seo_description.length} chars</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Open Graph / Social Share Image URL
                    </label>
                    <input
                      type="text"
                      value={settings.default_og_image}
                      onChange={e => setSettings({ ...settings, default_og_image: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://classinnews.com/og-image.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used when sharing pages that don't have a featured image. Recommended size: 1200×630px.</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">What's Already Active</h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>✅ <strong>Article Open Graph Tags</strong> — each article automatically gets og:title, og:description, og:image</li>
                      <li>✅ <strong>Article Canonical URL</strong> — each article has a canonical URL set to prevent duplicate content</li>
                      <li>✅ <strong>JSON-LD Article Schema</strong> — structured data for Google Rich Snippets &amp; Top Stories carousel</li>
                      <li>✅ <strong>Twitter Card</strong> — articles support Twitter summary_large_image cards</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* RSS & Sitemap Info */}
            {activeSection === 'feeds' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Rss className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">RSS Feed</h2>
                      <p className="text-sm text-gray-500">Auto-generated RSS 2.0 feed for news aggregators and Google Publisher Center</p>
                    </div>
                  </div>

                  <QuickLinkCard
                    label="RSS Feed URL"
                    url={`${SITE_URL}/feed.xml`}
                    description="Contains your latest 50 published articles with full metadata, categories, and images. Updates every 15 minutes."
                  />

                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">Submit to Google Publisher Center:</h4>
                    <ol className="text-xs text-orange-700 space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://publishercenter.google.com" target="_blank" rel="noopener noreferrer" className="underline">publishercenter.google.com</a></li>
                      <li>Add your publication → enter your site URL</li>
                      <li>Under <strong>Content</strong> → add RSS Feed URL: <code className="bg-orange-100 px-1 rounded">{SITE_URL}/feed.xml</code></li>
                      <li>Verify site ownership via Search Console</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Map className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Sitemap</h2>
                      <p className="text-sm text-gray-500">Auto-generated XML sitemap for Google Search indexing</p>
                    </div>
                  </div>

                  <QuickLinkCard
                    label="Sitemap XML"
                    url={`${SITE_URL}/sitemap.xml`}
                    description="Includes all static pages, category pages, and up to 1,000 latest articles. Revalidates every hour."
                  />

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="font-medium">What's included in the sitemap:</p>
                    <ul className="text-xs text-gray-500 space-y-1 ml-4">
                      <li>• Homepage, Articles, Latest, Trending, Categories (priority 0.8–1.0)</li>
                      <li>• All active category pages (priority 0.8)</li>
                      <li>• Latest 1,000 published articles (priority 0.7)</li>
                      <li>• Static pages: About, Contact, Privacy Policy, Terms (priority 0.3–0.4)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
