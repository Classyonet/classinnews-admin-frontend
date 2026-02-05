'use client'

export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  DollarSign, 
  Eye, 
  ThumbsUp,
  Share2,
  Settings,
  Save,
  Loader2,
  TrendingUp,
  CheckCircle
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com';

interface EarningSetting {
  id: number
  settingKey: string
  settingValue: number
  settingUnit: string
  description: string
  isActive: boolean
}

export default function EarningsSettingsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<EarningSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedSettings, setEditedSettings] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || authLoading) return
    
    if (token) {
      fetchSettings()
    } else {
      setLoading(false)
      setError('Please login to access earnings settings')
    }
  }, [token, mounted, authLoading])

  const fetchSettings = async () => {
    try {
      setError(null)
      const apiUrl = `${API_URL}/api/earnings-settings`
      
      console.log('[Earnings Settings] Fetching from:', apiUrl)
      console.log('[Earnings Settings] Token exists:', !!token)
      
      if (!apiUrl || apiUrl === 'undefined/api/earnings-settings') {
        throw new Error('API URL is not configured. Please check NEXT_PUBLIC_API_URL environment variable.')
      }

      if (!token) {
        throw new Error('No authentication token available. Please login again.')
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('[Earnings Settings] Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('[Earnings Settings] Response data:', result)
        const settingsData = result.data || result || []
        console.log('[Earnings Settings] Settings count:', settingsData.length)
        // Parse settingValue as number since DB stores as string
        const parsedSettings = settingsData.map((s: any) => ({
          ...s,
          settingValue: parseFloat(s.settingValue)
        }))
        setSettings(parsedSettings)
        console.log('[Earnings Settings] Parsed settings:', parsedSettings)
      } else {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorMsg
        } catch {}
        console.error('[Earnings Settings] Failed to fetch:', response.status)
        setError(errorMsg)
      }
    } catch (error: any) {
      console.error('[Earnings Settings] Error:', error)
      setError(error.message || 'Failed to load earnings settings')
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setEditedSettings({ ...editedSettings, [key]: numValue })
    }
  }

  const handleSave = async (key: string) => {
    if (editedSettings[key] === undefined) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/earnings-settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settingValue: editedSettings[key]
        })
      })

      if (response.ok) {
        await fetchSettings()
        const newEdited = { ...editedSettings }
        delete newEdited[key]
        setEditedSettings(newEdited)
        alert('Setting updated successfully!')
      } else {
        alert('Failed to update setting')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const getIcon = (key: string) => {
    if (key.includes('views')) return Eye
    if (key.includes('likes')) return ThumbsUp
    if (key.includes('shares')) return Share2
    if (key.includes('minimum')) return TrendingUp
    return DollarSign
  }

  const getGradient = (key: string) => {
    if (key.includes('views')) return 'from-blue-500 to-cyan-500'
    if (key.includes('likes')) return 'from-pink-500 to-rose-500'
    if (key.includes('shares')) return 'from-purple-500 to-indigo-500'
    if (key.includes('minimum')) return 'from-amber-500 to-orange-500'
    return 'from-emerald-500 to-teal-500'
  }

  const getShadow = (key: string) => {
    if (key.includes('views')) return 'shadow-blue-500/30'
    if (key.includes('likes')) return 'shadow-pink-500/30'
    if (key.includes('shares')) return 'shadow-purple-500/30'
    if (key.includes('minimum')) return 'shadow-amber-500/30'
    return 'shadow-emerald-500/30'
  }

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Show loading during hydration or auth loading
  if (!mounted || authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const viewsSettings = settings.filter(s => s.settingKey.includes('views'))
  const sharesSettings = settings.filter(s => s.settingKey.includes('shares'))
  const likesSettings = settings.filter(s => s.settingKey.includes('likes'))
  const otherSettings = settings.filter(s => 
    !s.settingKey.includes('views') && 
    !s.settingKey.includes('shares') && 
    !s.settingKey.includes('likes')
  )

  const renderSettingCard = (setting: EarningSetting) => {
    const Icon = getIcon(setting.settingKey)
    const gradient = getGradient(setting.settingKey)
    const shadow = getShadow(setting.settingKey)
    const currentValue = editedSettings[setting.settingKey] !== undefined 
      ? editedSettings[setting.settingKey] 
      : setting.settingValue
    const hasChanges = editedSettings[setting.settingKey] !== undefined

    return (
      <div key={setting.id} className="group relative rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:scale-[1.02]">
        <div className={`absolute -z-10 inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity`}></div>
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{formatKey(setting.settingKey)}</h3>
              <p className="text-sm text-slate-600">{setting.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Value
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={currentValue}
                onChange={(e) => handleValueChange(setting.settingKey, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600">
                {setting.settingUnit}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSave(setting.settingKey)}
            disabled={!hasChanges || saving}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${
              hasChanges && !saving
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasChanges ? (
              <Save className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {saving ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Earnings Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure publisher earning rates and thresholds</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Settings className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Info Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 p-6 shadow-2xl shadow-purple-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">How Earnings Work</h3>
            <p className="text-purple-100 leading-relaxed">
              Publishers earn money based on their article performance. Views, shares, and likes all contribute to earnings. 
              Articles must meet the minimum earnings threshold to be displayed on the revenue page.
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">Failed to Load Settings</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={fetchSettings}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {settings.length === 0 && !loading && !error && (
        <div className="rounded-2xl bg-slate-50 p-12 text-center">
          <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Earnings Settings Found</h3>
          <p className="text-slate-500">Please run the earnings settings migration to create default settings.</p>
        </div>
      )}

      {/* Views Settings */}
      {viewsSettings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Views Earnings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {viewsSettings.map(renderSettingCard)}
          </div>
        </div>
      )}

      {/* Shares Settings */}
      {sharesSettings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Shares Earnings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sharesSettings.map(renderSettingCard)}
          </div>
        </div>
      )}

      {/* Likes Settings */}
      {likesSettings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Likes Earnings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {likesSettings.map(renderSettingCard)}
          </div>
        </div>
      )}

      {/* Other Settings */}
      {otherSettings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thresholds & Limits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherSettings.map(renderSettingCard)}
          </div>
        </div>
      )}
    </div>
  )
}
