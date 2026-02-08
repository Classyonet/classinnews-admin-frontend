'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Search, Plus, Power, PowerOff, Save, Eye, Code2, BarChart3, Trash2, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com';

const POSITION_LABELS: Record<string, string> = {
  top: 'Top Banner',
  sidebar_top: 'Sidebar Top',
  sidebar_middle: 'Sidebar Middle',
  sidebar_bottom: 'Sidebar Bottom',
  content_top: 'Content Top',
  content_bottom: 'Content Bottom',
  inline_1: 'Inline 1',
  inline_2: 'Inline 2',
  bottom: 'Bottom Banner',
};

interface AdPlacement {
  id: string;
  placement_name: string;
  display_name: string;
  page_type: string;
  position: string;
  is_active: boolean;
  ad_code: string | null;
  width: string | null;
  height: string | null;
  ad_type?: string;
  image_url?: string | null;
  link_url?: string | null;
  custom_position?: string | null;
  show_on_pages?: string | null;
  created_at: string;
  updated_at: string;
}

interface AdStats {
  total: number;
  active: number;
  homepage_ads: number;
  article_ads: number;
}

export default function AdsSettingsPage() {
  const { token } = useAuth();
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [stats, setStats] = useState<AdStats>({ total: 0, active: 0, homepage_ads: 0, article_ads: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'homepage' | 'article'>('all');
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAd, setNewAd] = useState({
    placement_name: '',
    display_name: '',
    page_type: 'homepage',
    position: 'top',
    width: '728px',
    height: '90px',
    ad_type: 'code',
    is_active: false
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const headers = getHeaders();
      const [adsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/ads`, { headers }),
        fetch(`${API_URL}/api/ads/stats/summary`, { headers })
      ]);
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        const adsList = adsData.data && Array.isArray(adsData.data) ? adsData.data :
                        Array.isArray(adsData) ? adsData : [];
        setAds(adsList);
      } else {
        const text = await adsRes.text();
        console.error('Ads fetch failed:', adsRes.status, text);
        try {
          const errData = JSON.parse(text);
          setError(`Failed to load ads (${adsRes.status}): ${errData.details || errData.error || text}`);
        } catch {
          setError(`Failed to load ads (${adsRes.status}): ${text}`);
        }
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        } else if (typeof statsData.total !== 'undefined') {
          setStats(statsData);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdStatus = async (ad: AdPlacement) => {
    try {
      const response = await fetch(`${API_URL}/api/ads/${ad.id}/toggle`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (response.ok) {
        loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to toggle ad status');
      }
    } catch (err) {
      console.error('Error toggling ad:', err);
      alert('Failed to toggle ad status');
    }
  };

  const saveAd = async () => {
    if (!editingAd) return;
    try {
      const response = await fetch(`${API_URL}/api/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          is_active: editingAd.is_active,
          ad_code: editingAd.ad_code,
          width: editingAd.width,
          height: editingAd.height,
          ad_type: editingAd.ad_type || 'code',
          image_url: editingAd.image_url,
          link_url: editingAd.link_url,
          custom_position: editingAd.custom_position,
          show_on_pages: editingAd.show_on_pages || 'all',
        }),
      });
      if (response.ok) {
        setEditingAd(null);
        loadData();
        alert('Ad updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save ad');
      }
    } catch (err) {
      console.error('Error saving ad:', err);
      alert('Failed to save ad');
    }
  };

  const createAd = async () => {
    if (!newAd.placement_name || !newAd.display_name) {
      alert('Placement name and display name are required');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/ads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newAd),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowCreateModal(false);
        setNewAd({
          placement_name: '',
          display_name: '',
          page_type: 'homepage',
          position: 'top',
          width: '728px',
          height: '90px',
          ad_type: 'code',
          is_active: false
        });
        loadData();
        alert('Ad placement created successfully!');
      } else {
        alert(result.error || result.message || 'Failed to create ad placement');
      }
    } catch (err) {
      console.error('Error creating ad:', err);
      alert('Failed to create ad placement');
    } finally {
      setCreating(false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad placement?')) return;
    try {
      const response = await fetch(`${API_URL}/api/ads/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.ok) {
        loadData();
        alert('Ad placement deleted!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete ad placement');
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
      alert('Failed to delete ad placement');
    }
  };

  const clearAllAds = async () => {
    if (!confirm('Are you sure you want to DELETE ALL ad placements? This cannot be undone.')) return;
    if (!confirm('This will permanently remove all ad data. Continue?')) return;
    try {
      const response = await fetch(`${API_URL}/api/ads/clear-all`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await response.json();
      if (response.ok) {
        loadData();
        alert(result.message || 'All ads cleared');
      } else {
        alert(result.error || 'Failed to clear ads');
      }
    } catch (err) {
      console.error('Error clearing ads:', err);
      alert('Failed to clear ads');
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ad.placement_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || ad.page_type === selectedTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ads settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <a href="/admin/settings" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </a>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
              <p className="text-gray-600">Manage ad placements for homepage and article pages</p>
            </div>
            <div className="flex gap-3">
              {ads.length > 0 && (
                <button onClick={clearAllAds}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4" /> Clear All Ads
                </button>
              )}
              <button onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New Ad Placement
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button onClick={loadData} className="mt-2 text-red-600 underline text-sm">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Ad Slots</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Ads</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Power className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Homepage Ads</p>
                <p className="text-3xl font-bold text-purple-600">{stats.homepage_ads}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">H</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Article Ads</p>
                <p className="text-3xl font-bold text-orange-600">{stats.article_ads}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">A</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search ad placements..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex gap-2">
              {(['all', 'homepage', 'article'] as const).map(tab => (
                <button key={tab} onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedTab === tab
                      ? tab === 'homepage' ? 'bg-purple-600 text-white'
                        : tab === 'article' ? 'bg-orange-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {tab === 'all' ? 'All Ads' : tab === 'homepage' ? 'Homepage' : 'Article Page'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAds.map((ad) => (
            <div key={ad.id}
              className={`bg-white rounded-lg shadow overflow-hidden transition-all ${editingAd?.id === ad.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{ad.display_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ad.page_type === 'homepage' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {ad.page_type === 'homepage' ? 'Homepage' : 'Article Page'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {POSITION_LABELS[ad.position] || ad.position}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Size: {ad.width || 'Auto'} x {ad.height || 'Auto'} | ID: {ad.placement_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAdStatus(ad)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={ad.is_active ? 'Deactivate' : 'Activate'}>
                      {ad.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setEditingAd(editingAd?.id === ad.id ? null : ad)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> {editingAd?.id === ad.id ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={() => deleteAd(ad.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {editingAd?.id === ad.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="ad_type" value="code"
                            checked={(editingAd.ad_type || 'code') === 'code'}
                            onChange={(e) => setEditingAd({ ...editingAd, ad_type: e.target.value })}
                            className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">HTML/JavaScript Code</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="ad_type" value="image"
                            checked={editingAd.ad_type === 'image'}
                            onChange={(e) => setEditingAd({ ...editingAd, ad_type: e.target.value })}
                            className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">Image Banner</span>
                        </label>
                      </div>
                    </div>
                    {editingAd.ad_type === 'image' && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                          <input type="text" value={editingAd.image_url || ''}
                            onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/banner.jpg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Click URL (optional)</label>
                          <input type="text" value={editingAd.link_url || ''}
                            onChange={(e) => setEditingAd({ ...editingAd, link_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://advertiser.com/landing" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display On Pages</label>
                      <select value={editingAd.show_on_pages || 'all'}
                        onChange={(e) => setEditingAd({ ...editingAd, show_on_pages: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Pages</option>
                        <option value="homepage">Homepage Only</option>
                        <option value="article">Article Pages Only</option>
                      </select>
                    </div>
                    {(editingAd.ad_type || 'code') === 'code' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Code (HTML/JavaScript)</label>
                        <textarea value={editingAd.ad_code || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, ad_code: e.target.value })}
                          rows={8}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Paste your ad code here..." />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                        <input type="text" value={editingAd.width || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, width: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 300px, 100%, auto" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                        <input type="text" value={editingAd.height || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, height: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 250px, auto" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={saveAd}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button onClick={() => setShowPreview(!showPreview)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> {showPreview ? 'Hide' : 'Show'} Preview
                      </button>
                      <button onClick={() => setEditingAd(null)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                    {showPreview && (editingAd.ad_code || editingAd.image_url) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                        <div className="bg-white p-4 rounded-lg border border-gray-300 overflow-auto">
                          {editingAd.ad_type === 'image' && editingAd.image_url ? (
                            <div style={{ width: editingAd.width || 'auto', height: editingAd.height || 'auto' }}>
                              <img src={editingAd.image_url} alt="Ad Banner"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              Ad code preview is disabled for security. The code will render on your news portal.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`px-6 py-3 flex items-center justify-between text-sm ${
                ad.is_active ? 'bg-green-50 border-t border-green-200' : 'bg-gray-50 border-t border-gray-200'
              }`}>
                <span className={ad.is_active ? 'text-green-700 font-medium' : 'text-gray-500'}>
                  {ad.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-gray-400">
                  Updated: {new Date(ad.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {filteredAds.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ad Placements Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No ads match your search.' : 'Get started by creating your first ad placement.'}
              </p>
              {!searchTerm && (
                <button onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-5 h-5 inline mr-2" /> Create Ad Placement
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Ad Placement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement Name (internal ID)</label>
                <input type="text" value={newAd.placement_name}
                  onChange={(e) => setNewAd({ ...newAd, placement_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., homepage_top_banner" />
                <p className="text-xs text-gray-500 mt-1">Lowercase, underscores only. Used internally.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input type="text" value={newAd.display_name}
                  onChange={(e) => setNewAd({ ...newAd, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Homepage Top Banner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Type</label>
                  <select value={newAd.page_type}
                    onChange={(e) => setNewAd({ ...newAd, page_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="homepage">Homepage</option>
                    <option value="article">Article Page</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select value={newAd.position}
                    onChange={(e) => setNewAd({ ...newAd, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="top">Top Banner</option>
                    <option value="sidebar_top">Sidebar Top</option>
                    <option value="sidebar_middle">Sidebar Middle</option>
                    <option value="sidebar_bottom">Sidebar Bottom</option>
                    <option value="content_top">Content Top</option>
                    <option value="content_bottom">Content Bottom</option>
                    <option value="inline_1">Inline 1</option>
                    <option value="inline_2">Inline 2</option>
                    <option value="bottom">Bottom Banner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input type="text" value={newAd.width}
                    onChange={(e) => setNewAd({ ...newAd, width: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 728px" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input type="text" value={newAd.height}
                    onChange={(e) => setNewAd({ ...newAd, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 90px" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
                <select value={newAd.ad_type}
                  onChange={(e) => setNewAd({ ...newAd, ad_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="code">HTML/JS Code</option>
                  <option value="image">Image Banner</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={createAd}
                disabled={!newAd.placement_name || !newAd.display_name || creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {creating ? 'Creating...' : 'Create Ad Placement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
