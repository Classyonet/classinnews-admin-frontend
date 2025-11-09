'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Power, PowerOff, Save, Eye, Code2, BarChart3 } from 'lucide-react';

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
  ad_type?: string; // 'code' or 'image'
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
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'homepage' | 'article'>('all');
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/ads');
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/ads/stats/summary');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleAdStatus = async (ad: AdPlacement) => {
    try {
      const response = await fetch(`http://localhost:3002/api/ads/${ad.id}/toggle`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        fetchAds();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
    }
  };

  const saveAd = async () => {
    if (!editingAd) return;

    try {
      const response = await fetch(`http://localhost:3002/api/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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

      if (response.ok) {
        setEditingAd(null);
        fetchAds();
        fetchStats();
        alert('Ad updated successfully!');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Failed to save ad');
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || ad.page_type === selectedTab;
    return matchesSearch && matchesTab;
  });

  const getPositionLabel = (position: string) => {
    const labels: { [key: string]: string } = {
      'top': 'Top Banner',
      'sidebar_top': 'Sidebar Top',
      'sidebar_middle': 'Sidebar Middle',
      'sidebar_bottom': 'Sidebar Bottom',
      'content_top': 'Content Top',
      'content_bottom': 'Content Bottom',
      'inline_1': 'Inline 1',
      'inline_2': 'Inline 2',
      'bottom': 'Bottom Banner',
    };
    return labels[position] || position;
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Settings</h1>
          <p className="text-gray-600">Manage ad placements for homepage and article pages</p>
        </div>

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
            {/* Search */}
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

            {/* Tabs */}
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

                      {/* Preview */}
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
                                dangerouslySetInnerHTML={{ __html: editingAd.ad_code || '' }}
                                style={{
                                  width: editingAd.width || 'auto',
                                  height: editingAd.height || 'auto',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div
                className={`px-6 py-3 text-xs flex items-center justify-between ${
                  ad.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                }`}
              >
                <span className="font-medium">
                  {ad.is_active ? '✓ Active - Displaying on website' : '○ Inactive - Not displaying'}
                </span>
                <span className="text-gray-500">
                  Last updated: {new Date(ad.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No ad placements found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
