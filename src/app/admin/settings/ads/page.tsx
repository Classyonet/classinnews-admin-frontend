'use client';

export const runtime = 'edge';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Search, Plus, Power, PowerOff, Save, Eye, Code2, BarChart3 } from 'lucide-react';
import { API_URL } from '@/lib/api-config';
import { AD_POSITION_LABELS } from '@/lib/constants';
import DOMPurify from 'isomorphic-dompurify';

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
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'homepage' | 'article'>('all');
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const fetchAds = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${API_URL}/api/ads`, { headers });
      
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { 
          const j = JSON.parse(text); 
          msg = j.error || j.message || msg; 
        } catch {}
        throw new Error(msg);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setAds(result.data);
      } else if (Array.isArray(result)) {
        setAds(result);
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${API_URL}/api/ads/stats/summary`, { headers });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data);
      } else if (typeof result.total !== 'undefined') {
        setStats(result);
      } else {
        setStats({ total: 0, active: 0, homepage_ads: 0, article_ads: 0 });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ total: 0, active: 0, homepage_ads: 0, article_ads: 0 });
    }
  }, [token]);

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, [fetchAds, fetchStats]);

  const toggleAdStatus = async (ad: AdPlacement) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/ads/${ad.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        fetchAds();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to toggle ad status');
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
      alert('Failed to toggle ad status');
    }
  };

  const saveAd = async () => {
    if (!editingAd || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

      const result = await response.json();

      if (response.ok) {
        setEditingAd(null);
        fetchAds();
        fetchStats();
        alert('Ad updated successfully!');
      } else {
        alert(result.error || 'Failed to save ad');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Failed to save ad');
    }
  };

  const createAd = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAd),
      });

      const result = await response.json();

      if (response.ok) {
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
        fetchAds();
        fetchStats();
        alert('Ad placement created successfully!');
      } else {
        const msg = result.error || result.message || 'Failed to create ad placement';
        alert(msg);
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Failed to create ad placement');
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad placement?')) return;
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAds();
        fetchStats();
        alert('Ad placement deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete ad placement');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete ad placement');
    }
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = ad.display_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = selectedTab === 'all' || ad.page_type === selectedTab;
      return matchesSearch && matchesTab;
    });
  }, [ads, searchTerm, selectedTab]);

  const getPositionLabel = (position: string): string => {
    return AD_POSITION_LABELS[position] || position;
  };

  // Sanitize HTML before rendering
  const sanitizeAdCode = (code: string): string => {
    return DOMPurify.sanitize(code, {
      ALLOWED_TAGS: ['script', 'iframe', 'img', 'a', 'div', 'span', 'ins'],
      ALLOWED_ATTR: ['src', 'href', 'class', 'id', 'style', 'data-ad-client', 'data-ad-slot', 'width', 'height'],
      ALLOW_DATA_ATTR: true,
    });
  };

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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Settings</h1>
            <p className="text-gray-600">Manage ad placements for homepage and article pages</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Ad Placement
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
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
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                  H
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Article Ads</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.article_ads}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                  A
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search ad placements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Ads
              </button>
              <button
                onClick={() => setSelectedTab('homepage')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'homepage'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Homepage
              </button>
              <button
                onClick={() => setSelectedTab('article')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'article'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Article Page
              </button>
            </div>
          </div>
        </div>

        {/* Ads List */}
        <div className="space-y-4">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white rounded-lg shadow overflow-hidden transition-all ${
                editingAd?.id === ad.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{ad.display_name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ad.page_type === 'homepage'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {ad.page_type === 'homepage' ? 'Homepage' : 'Article Page'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {getPositionLabel(ad.position)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Size: {ad.width || 'Auto'} × {ad.height || 'Auto'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAdStatus(ad)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={ad.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ad.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => setEditingAd(editingAd?.id === ad.id ? null : ad)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Code2 className="w-4 h-4" />
                      {editingAd?.id === ad.id ? 'Close Editor' : 'Edit Ad Code'}
                    </button>

                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Ad Placement"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Editor */}
                {editingAd?.id === ad.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-4">
                      {/* Ad Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ad Type
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ad_type"
                              value="code"
                              checked={(editingAd.ad_type || 'code') === 'code'}
                              onChange={(e) => setEditingAd({ ...editingAd, ad_type: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">HTML/JavaScript Code</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ad_type"
                              value="image"
                              checked={editingAd.ad_type === 'image'}
                              onChange={(e) => setEditingAd({ ...editingAd, ad_type: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">Image Banner</span>
                          </label>
                        </div>
                      </div>

                      {/* Image Ad Fields */}
                      {editingAd.ad_type === 'image' && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image URL
                            </label>
                            <input
                              type="text"
                              value={editingAd.image_url || ''}
                              onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com/banner.jpg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Click Destination URL (optional)
                            </label>
                            <input
                              type="text"
                              value={editingAd.link_url || ''}
                              onChange={(e) => setEditingAd({ ...editingAd, link_url: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://advertiser.com/landing-page"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom Position */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Position (optional)
                        </label>
                        <input
                          type="text"
                          value={editingAd.custom_position || ''}
                          onChange={(e) => setEditingAd({ ...editingAd, custom_position: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., custom_sidebar, after_paragraph_3"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Override default position with a custom identifier for special placements
                        </p>
                      </div>

                      {/* Show On Pages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display On Pages
                        </label>
                        <select
                          value={editingAd.show_on_pages || 'all'}
                          onChange={(e) => setEditingAd({ ...editingAd, show_on_pages: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Pages</option>
                          <option value="homepage">Homepage Only</option>
                          <option value="article">Article Pages Only</option>
                          <option value="category">Category Pages Only</option>
                          <option value="custom">Custom Pages</option>
                        </select>
                      </div>

                      {/* Ad Code Editor (only for code type) */}
                      {(editingAd.ad_type || 'code') === 'code' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ad Code (HTML/JavaScript)
                          </label>
                          <textarea
                            value={editingAd.ad_code || ''}
                            onChange={(e) => setEditingAd({ ...editingAd, ad_code: e.target.value })}
                            rows={10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Paste your ad code here..."
                          />
                        </div>
                      )}

                      {/* Dimensions */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                          <input
                            type="text"
                            value={editingAd.width || ''}
                            onChange={(e) => setEditingAd({ ...editingAd, width: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 300px, 100%, auto"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                          <input
                            type="text"
                            value={editingAd.height || ''}
                            onChange={(e) => setEditingAd({ ...editingAd, height: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 250px, auto"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={saveAd}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>

                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {showPreview ? 'Hide' : 'Show'} Preview
                        </button>

                        <button
                          onClick={() => setEditingAd(null)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Preview with XSS Protection */}
                      {showPreview && (editingAd.ad_code || editingAd.image_url) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                          <div className="bg-white p-4 rounded-lg border border-gray-300 overflow-auto">
                            {editingAd.ad_type === 'image' && editingAd.image_url ? (
                              <div style={{ width: editingAd.width || 'auto', height: editingAd.height || 'auto' }}>
                                {editingAd.link_url ? (
                                  <a href={editingAd.link_url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={editingAd.image_url}
                                      alt="Ad Banner"
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                  </a>
                                ) : (
                                  <img
                                    src={editingAd.image_url}
                                    alt="Ad Banner"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                )}
                              </div>
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{ 
                                  __html: sanitizeAdCode(editingAd.ad_code || '') 
                                }}
                                style={{
                                  width: editingAd.width || 'auto',
                                  height: editingAd.height || 'auto',
                                }}
                              />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-amber-600">
                            ⚠️ Ad code is sanitized for security. Malicious scripts are removed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div
                className={`px-6 py-3 flex items-center justify-between text-sm ${
                  ad.is_active
                    ? 'bg-green-50 border-t border-green-200'
                    : 'bg-gray-50 border-t border-gray-200'
                }`}
              >
                <span className={ad.is_active ? 'text-green-700 font-medium' : 'text-gray-500'}>
                  {ad.is_active ? '● Active' : '○ Inactive'}
                </span>
                <span className="text-gray-400">
                  Updated: {new Date(ad.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {filteredAds.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ad Placements Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'No ads match your search criteria.'
                  : 'Get started by creating your first ad placement.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Create Ad Placement
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Ad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Ad Placement</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placement Name (internal identifier)
                </label>
                <input
                  type="text"
                  value={newAd.placement_name}
                  onChange={(e) => setNewAd({ ...newAd, placement_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., homepage_top_banner"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newAd.display_name}
                  onChange={(e) => setNewAd({ ...newAd, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Homepage Top Banner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Type</label>
                  <select
                    value={newAd.page_type}
                    onChange={(e) => setNewAd({ ...newAd, page_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="article">Article Page</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={newAd.position}
                    onChange={(e) => setNewAd({ ...newAd, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
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
                  <input
                    type="text"
                    value={newAd.width}
                    onChange={(e) => setNewAd({ ...newAd, width: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 728px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="text"
                    value={newAd.height}
                    onChange={(e) => setNewAd({ ...newAd, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 90px"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
                <select
                  value={newAd.ad_type}
                  onChange={(e) => setNewAd({ ...newAd, ad_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="code">HTML/JS Code</option>
                  <option value="image">Image Banner</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAd}
                disabled={!newAd.placement_name || !newAd.display_name}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Ad Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}