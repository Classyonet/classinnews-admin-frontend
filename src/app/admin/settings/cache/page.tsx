'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Database,
  RefreshCw,
  Clock,
  Globe,
  FileText,
  Layout,
  Image,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Zap,
  Settings
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com'

interface CacheSetting {
  key: string
  value: string
  label: string
  description: string
  type: 'number' | 'boolean'
  unit?: string
  icon: React.ReactNode
  min?: number
  max?: number
}

const DEFAULT_CACHE_SETTINGS: CacheSetting[] = [
  {
    key: 'cache_enabled',
    value: 'true',
    label: 'Enable Page Caching',
    description: 'Master switch to enable or disable all client-side caching across the news portal',
    type: 'boolean',
    icon: <Database className="w-5 h-5" />
  },
  {
    key: 'cache_ttl_homepage',
    value: '300',
    label: 'Homepage Cache Duration',
    description: 'How long the homepage content stays cached before refreshing (in seconds)',
    type: 'number',
    unit: 'seconds',
    icon: <Layout className="w-5 h-5" />,
    min: 0,
    max: 86400
  },
  {
    key: 'cache_ttl_articles',
    value: '600',
    label: 'Articles List Cache Duration',
    description: 'Cache duration for article listing pages, categories, and search results',
    type: 'number',
    unit: 'seconds',
    icon: <FileText className="w-5 h-5" />,
    min: 0,
    max: 86400
  },
  {
    key: 'cache_ttl_article_detail',
    value: '900',
    label: 'Article Detail Cache Duration',
    description: 'Cache duration for individual article pages including comments and reactions',
    type: 'number',
    unit: 'seconds',
    icon: <Globe className="w-5 h-5" />,
    min: 0,
    max: 86400
  },
  {
    key: 'cache_ttl_categories',
    value: '1800',
    label: 'Categories Cache Duration',
    description: 'Cache duration for the categories listing page',
    type: 'number',
    unit: 'seconds',
    icon: <Database className="w-5 h-5" />,
    min: 0,
    max: 86400
  },
  {
    key: 'cache_ttl_media',
    value: '3600',
    label: 'Media/Images Cache Duration',
    description: 'Cache duration for media assets and image references',
    type: 'number',
    unit: 'seconds',
    icon: <Image className="w-5 h-5" />,
    min: 0,
    max: 604800
  },
  {
    key: 'cache_ttl_settings',
    value: '1800',
    label: 'Settings/Branding Cache Duration',
    description: 'Cache duration for site branding, layout settings, and ad configurations',
    type: 'number',
    unit: 'seconds',
    icon: <Settings className="w-5 h-5" />,
    min: 0,
    max: 86400
  },
  {
    key: 'cache_version',
    value: '1',
    label: 'Cache Version',
    description: 'Increment this number to force all users to refresh their cached content immediately',
    type: 'number',
    unit: '',
    icon: <Zap className="w-5 h-5" />,
    min: 1,
    max: 99999
  }
]

function formatDuration(seconds: number): string {
  if (seconds === 0) return 'No caching'
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
  return `${Math.floor(seconds / 86400)} days`
}

export default function CacheSettingsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purging, setPurging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || authLoading) return
    if (token) {
      fetchSettings()
    } else {
      setLoading(false)
      setError('Please login to access cache settings')
    }
  }, [mounted, authLoading, token])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_URL}/api/settings?category=cache`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const settingsMap: Record<string, string> = {}
        data.data.forEach((s: any) => { settingsMap[s.key] = s.value })
        // Fill defaults for missing settings
        DEFAULT_CACHE_SETTINGS.forEach(d => {
          if (!settingsMap[d.key]) settingsMap[d.key] = d.value
        })
        setSettings(settingsMap)
      }
    } catch (err) {
      setError('Failed to load cache settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      for (const def of DEFAULT_CACHE_SETTINGS) {
        const value = settings[def.key] ?? def.value
        await fetch(`${API_URL}/api/settings/${def.key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            value: String(value),
            type: def.type === 'boolean' ? 'boolean' : 'number',
            category: 'cache'
          })
        })
      }
      setSuccess('Cache settings saved successfully!')
      setHasChanges(false)
    } catch (err) {
      setError('Failed to save cache settings')
    } finally {
      setSaving(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('This will clear ALL newsportal page caches instantly. All users will load fresh content on their next visit. Continue?')) return
    setPurging(true)
    setError(null)
    setSuccess(null)
    try {
      // Bump cache version to invalidate all existing caches
      const currentVersion = parseInt(settings.cache_version || '1')
      const newVersion = currentVersion + 1
      
      // Also set a cache_cleared_at timestamp so newsportal knows to clear localStorage
      await Promise.all([
        fetch(`${API_URL}/api/settings/cache_version`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ value: String(newVersion), type: 'number', category: 'cache' })
        }),
        fetch(`${API_URL}/api/settings/cache_cleared_at`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ value: new Date().toISOString(), type: 'string', category: 'cache' })
        })
      ])
      
      setSettings(prev => ({ ...prev, cache_version: String(newVersion) }))
      setSuccess(`Cache cleared successfully! Version bumped to v${newVersion}. All newsportal users will load fresh content immediately.`)
    } catch (err) {
      setError('Failed to clear cache')
    } finally {
      setPurging(false)
    }
  }

  const handlePurgeCache = async () => {
    if (!confirm('This will increment the cache version, forcing all newsportal users to reload fresh content. Continue?')) return
    setPurging(true)
    setError(null)
    setSuccess(null)
    try {
      const currentVersion = parseInt(settings.cache_version || '1')
      const newVersion = currentVersion + 1
      await fetch(`${API_URL}/api/settings/cache_version`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          value: String(newVersion),
          type: 'number',
          category: 'cache'
        })
      })
      setSettings(prev => ({ ...prev, cache_version: String(newVersion) }))
      setSuccess(`Cache purged! Version bumped to ${newVersion}. Newsportal users will receive fresh content.`)
    } catch (err) {
      setError('Failed to purge cache')
    } finally {
      setPurging(false)
    }
  }

  const handleResetDefaults = () => {
    if (!confirm('Reset all cache settings to defaults?')) return
    const defaults: Record<string, string> = {}
    DEFAULT_CACHE_SETTINGS.forEach(d => { defaults[d.key] = d.value })
    setSettings(defaults)
    setHasChanges(true)
    setSuccess(null)
  }

  if (!mounted || authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading cache settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-600">Please login to access cache settings</p>
      </div>
    )
  }

  const cacheEnabled = settings.cache_enabled === 'true'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-600" />
            Cache Control
          </h1>
          <p className="text-gray-500 mt-1">
            Manage page caching for the news portal to control content freshness and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Quick Actions Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Clear Cache - Instant */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Clear Cache
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Instantly clear all newsportal page cache files. Users will load completely fresh content on their next visit.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={purging}
              className="w-full px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {purging ? 'Clearing...' : 'Clear All Cache Now'}
            </button>
          </div>
        </div>

        {/* Purge Cache - Version Bump */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                Bump Cache Version
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Increment cache version to invalidate old caches. Current version: <span className="font-bold text-orange-700">v{settings.cache_version || '1'}</span>
              </p>
            </div>
            <button
              onClick={handlePurgeCache}
              disabled={purging}
              className="w-full px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {purging ? 'Bumping...' : 'Bump Version'}
            </button>
          </div>
        </div>
      </div>

      {/* Cache Settings Grid */}
      <div className="grid gap-4">
        {DEFAULT_CACHE_SETTINGS.map((def) => {
          const value = settings[def.key] ?? def.value

          if (def.type === 'boolean') {
            return (
              <div key={def.key} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${cacheEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {def.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{def.label}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{def.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      onChange={(e) => handleChange(def.key, e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )
          }

          if (def.key === 'cache_version') {
            return (
              <div key={def.key} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600">
                    {def.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{def.label}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{def.description}</p>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">v{value}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          const numValue = parseInt(value) || 0

          return (
            <div key={def.key} className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${!cacheEnabled ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                  {def.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{def.label}</h3>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {formatDuration(numValue)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{def.description}</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={def.min || 0}
                      max={def.max || 86400}
                      step={def.max && def.max > 3600 ? 300 : 60}
                      value={numValue}
                      onChange={(e) => handleChange(def.key, e.target.value)}
                      disabled={!cacheEnabled}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={numValue}
                        onChange={(e) => handleChange(def.key, e.target.value)}
                        disabled={!cacheEnabled}
                        min={def.min || 0}
                        max={def.max || 86400}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      {def.unit && <span className="text-xs text-gray-400">{def.unit}</span>}
                    </div>
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-2 mt-3">
                    {[
                      { label: 'Off', val: 0 },
                      { label: '1 min', val: 60 },
                      { label: '5 min', val: 300 },
                      { label: '15 min', val: 900 },
                      { label: '1 hr', val: 3600 },
                      ...(def.max && def.max > 3600 ? [{ label: '24 hr', val: 86400 }] : [])
                    ].map(preset => (
                      <button
                        key={preset.val}
                        onClick={() => handleChange(def.key, String(preset.val))}
                        disabled={!cacheEnabled}
                        className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                          numValue === preset.val
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5" />
          How Cache Control Works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Cache Duration</strong> determines how long content is stored locally in users' browsers before fetching fresh data from the server.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Setting a value to 0</strong> disables caching for that section — every page visit will fetch fresh content.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Purge All Caches</strong> increments the cache version number. The newsportal checks this version and automatically discards outdated cached data.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Higher cache durations</strong> improve performance but delay content updates. Lower values keep content fresher but increase server load.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
