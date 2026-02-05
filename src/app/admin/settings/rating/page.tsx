'use client'

export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  Star, 
  Users, 
  FileText,
  Heart,
  Share2,
  Settings,
  Save,
  Loader2,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Award,
  Zap,
  Trophy,
  Target
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com';

interface RatingSetting {
  id: number
  settingKey: string
  settingValue: number
  settingUnit: string
  description: string
  isActive: boolean
}

export default function RatingSettingsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<RatingSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
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
      setError('Please login to access rating settings')
    }
  }, [token, mounted, authLoading])

  const fetchSettings = async () => {
    try {
      setError(null)
      const apiUrl = `${API_URL}/api/rating-settings`
      
      if (!token) {
        throw new Error('No authentication token available. Please login again.')
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        const settingsData = result.data || result || []
        const parsedSettings = settingsData.map((s: any) => ({
          ...s,
          settingValue: parseFloat(s.settingValue)
        }))
        setSettings(parsedSettings)
      } else {
        const errorData = await response.json()
        setError(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('[Rating Settings] Error:', error)
      setError(error.message || 'Failed to load rating settings')
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedSettings({ ...editedSettings, [key]: numValue })
    }
  }

  const handleSave = async (key: string) => {
    if (editedSettings[key] === undefined) return

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/rating-settings/${key}`, {
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
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to save setting')
      }
    } catch (error) {
      console.error('Save setting error:', error)
      alert('Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculateAll = async () => {
    if (!confirm('This will recalculate ratings for all publishers. Continue?')) return

    setRecalculating(true)
    try {
      const response = await fetch(`${API_URL}/api/recalculate-ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'Ratings recalculated successfully')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to recalculate ratings')
      }
    } catch (error) {
      console.error('Recalculate ratings error:', error)
      alert('Failed to recalculate ratings')
    } finally {
      setRecalculating(false)
    }
  }

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.settingKey === key)
    return editedSettings[key] !== undefined ? editedSettings[key] : (setting?.settingValue || 0)
  }

  const hasChanges = (key: string) => editedSettings[key] !== undefined

  if (!mounted || authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  // Get current values for example calculation
  const pointsPerFollower = getSettingValue('points_per_follower')
  const pointsPerArticle = getSettingValue('points_per_article')
  const pointsPerLike = getSettingValue('points_per_like')
  const pointsPerShare = getSettingValue('points_per_share')
  const pointsFor1Star = getSettingValue('points_for_1_star')
  const pointsFor2Stars = getSettingValue('points_for_2_stars')
  const pointsFor3Stars = getSettingValue('points_for_3_stars')
  const pointsFor4Stars = getSettingValue('points_for_4_stars')
  const pointsFor5Stars = getSettingValue('points_for_5_stars')

  // Example calculation
  const exampleFollowers = 5
  const exampleArticles = 10
  const exampleLikes = 50
  const exampleShares = 20
  const examplePoints = (exampleFollowers * pointsPerFollower) + 
                        (exampleArticles * pointsPerArticle) + 
                        (exampleLikes * pointsPerLike) + 
                        (exampleShares * pointsPerShare)
  
  let exampleStars = 0
  let exampleTier = 'New'
  if (examplePoints >= pointsFor5Stars) { exampleStars = 5; exampleTier = 'Gold' }
  else if (examplePoints >= pointsFor4Stars) { exampleStars = 4; exampleTier = 'Platinum' }
  else if (examplePoints >= pointsFor3Stars) { exampleStars = 3; exampleTier = 'Silver' }
  else if (examplePoints >= pointsFor2Stars) { exampleStars = 2; exampleTier = 'Bronze' }
  else if (examplePoints >= pointsFor1Star) { exampleStars = 1; exampleTier = 'Starter' }

  const renderPointsField = (
    key: string, 
    label: string, 
    Icon: any, 
    gradient: string, 
    shadow: string,
    description: string
  ) => {
    const currentValue = getSettingValue(key)
    const changed = hasChanges(key)
    
    return (
      <div className="group relative rounded-2xl bg-white p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">{label}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              min="0"
              value={currentValue}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg font-semibold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
              pts
            </span>
          </div>

          <button
            onClick={() => handleSave(key)}
            disabled={!changed || saving}
            className={`px-4 py-2.5 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${
              changed && !saving
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:shadow-xl hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 
             changed ? <Save className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>
      </div>
    )
  }

  const renderStarField = (
    key: string, 
    starCount: number, 
    tierName: string, 
    tierColor: string
  ) => {
    const currentValue = getSettingValue(key)
    const changed = hasChanges(key)
    
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2 w-32">
          <div className="flex">
            {Array.from({ length: starCount }).map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColor}`}>
            {tierName}
          </span>
        </div>
        
        <div className="flex-1 flex items-center gap-3">
          <input
            type="number"
            min="0"
            value={currentValue}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center font-semibold"
          />
          <span className="text-sm text-slate-600">points required</span>
        </div>

        <button
          onClick={() => handleSave(key)}
          disabled={!changed || saving}
          className={`px-3 py-2 rounded-lg font-semibold transition-all ${
            changed && !saving
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 
           changed ? <Save className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
            Publisher Rating Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure the points-based rating system</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {recalculating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            {recalculating ? 'Recalculating...' : 'Recalculate All'}
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Trophy className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Points-Based Rating System</h3>
            <p className="text-emerald-100 leading-relaxed">
              Publishers earn <strong>points</strong> for their activities. Each follower, article, like, and share earns a specific number of points. 
              When a publisher reaches the required points threshold, they advance to the next star level and tier.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-xl rounded-lg px-3 py-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Followers</span>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-lg px-3 py-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Articles</span>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-lg px-3 py-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Likes</span>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-lg px-3 py-2 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Shares</span>
              </div>
            </div>
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

      {/* Points Per Activity */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Points Per Activity</h2>
            <p className="text-sm text-slate-600">How many points each action earns</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderPointsField('points_per_follower', 'Per Follower', Users, 'from-blue-500 to-cyan-500', 'shadow-blue-500/30', 'Points for each new follower')}
          {renderPointsField('points_per_article', 'Per Article', FileText, 'from-purple-500 to-indigo-500', 'shadow-purple-500/30', 'Points for each published article')}
          {renderPointsField('points_per_like', 'Per Like', Heart, 'from-pink-500 to-rose-500', 'shadow-pink-500/30', 'Points for each like received')}
          {renderPointsField('points_per_share', 'Per Share', Share2, 'from-emerald-500 to-teal-500', 'shadow-emerald-500/30', 'Points for each share')}
        </div>
      </div>

      {/* Star Thresholds */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <Star className="h-5 w-5 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Star Level Thresholds</h2>
            <p className="text-sm text-slate-600">Points required to reach each star level</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-lg border border-slate-100 p-4 space-y-3">
          {renderStarField('points_for_1_star', 1, 'Starter', 'bg-emerald-100 text-emerald-700')}
          {renderStarField('points_for_2_stars', 2, 'Bronze', 'bg-amber-100 text-amber-700')}
          {renderStarField('points_for_3_stars', 3, 'Silver', 'bg-slate-200 text-slate-700')}
          {renderStarField('points_for_4_stars', 4, 'Platinum', 'bg-indigo-100 text-indigo-700')}
          {renderStarField('points_for_5_stars', 5, 'Gold', 'bg-yellow-100 text-yellow-700')}
        </div>
      </div>

      {/* Example Calculation */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          Example Calculation
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-4 font-semibold text-slate-700">Activity</th>
                <th className="text-center py-2 px-4 font-semibold text-slate-700">Count</th>
                <th className="text-center py-2 px-4 font-semibold text-slate-700">×</th>
                <th className="text-center py-2 px-4 font-semibold text-slate-700">Points Each</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-700">=</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Followers
                </td>
                <td className="py-3 px-4 text-center font-mono">{exampleFollowers}</td>
                <td className="py-3 px-4 text-center text-slate-400">×</td>
                <td className="py-3 px-4 text-center font-mono">{pointsPerFollower}</td>
                <td className="py-3 px-4 text-center text-slate-400">=</td>
                <td className="py-3 px-4 text-right font-semibold text-blue-600">{exampleFollowers * pointsPerFollower}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" /> Articles
                </td>
                <td className="py-3 px-4 text-center font-mono">{exampleArticles}</td>
                <td className="py-3 px-4 text-center text-slate-400">×</td>
                <td className="py-3 px-4 text-center font-mono">{pointsPerArticle}</td>
                <td className="py-3 px-4 text-center text-slate-400">=</td>
                <td className="py-3 px-4 text-right font-semibold text-purple-600">{exampleArticles * pointsPerArticle}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" /> Likes
                </td>
                <td className="py-3 px-4 text-center font-mono">{exampleLikes}</td>
                <td className="py-3 px-4 text-center text-slate-400">×</td>
                <td className="py-3 px-4 text-center font-mono">{pointsPerLike}</td>
                <td className="py-3 px-4 text-center text-slate-400">=</td>
                <td className="py-3 px-4 text-right font-semibold text-pink-600">{exampleLikes * pointsPerLike}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-500" /> Shares
                </td>
                <td className="py-3 px-4 text-center font-mono">{exampleShares}</td>
                <td className="py-3 px-4 text-center text-slate-400">×</td>
                <td className="py-3 px-4 text-center font-mono">{pointsPerShare}</td>
                <td className="py-3 px-4 text-center text-slate-400">=</td>
                <td className="py-3 px-4 text-right font-semibold text-emerald-600">{exampleShares * pointsPerShare}</td>
              </tr>
              <tr className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <td colSpan={5} className="py-3 px-4 font-bold text-slate-900">Total Points</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full font-bold text-lg">
                    <Zap className="h-4 w-4" /> {examplePoints}
                  </span>
                </td>
              </tr>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <td colSpan={5} className="py-3 px-4 font-bold text-slate-900">Result</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold">
                    {Array.from({ length: exampleStars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-white" />
                    ))}
                    {exampleTier}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Overview */}
      <div className="rounded-2xl bg-white shadow-lg border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Tier Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'New', stars: 0, points: 0, color: 'bg-slate-400', bgLight: 'bg-slate-100' },
            { name: 'Starter', stars: 1, points: pointsFor1Star, color: 'bg-emerald-500', bgLight: 'bg-emerald-50' },
            { name: 'Bronze', stars: 2, points: pointsFor2Stars, color: 'bg-amber-600', bgLight: 'bg-amber-50' },
            { name: 'Silver', stars: 3, points: pointsFor3Stars, color: 'bg-slate-500', bgLight: 'bg-slate-100' },
            { name: 'Platinum', stars: 4, points: pointsFor4Stars, color: 'bg-indigo-500', bgLight: 'bg-indigo-50' },
            { name: 'Gold', stars: 5, points: pointsFor5Stars, color: 'bg-yellow-500', bgLight: 'bg-yellow-50' },
          ].map((tier) => (
            <div key={tier.name} className={`p-4 rounded-xl ${tier.bgLight} text-center`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-lg ${tier.color} flex items-center justify-center shadow-md`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-slate-800">{tier.name}</p>
              <div className="flex items-center justify-center gap-0.5 my-1">
                {Array.from({ length: Math.max(1, tier.stars) }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${tier.stars === 0 ? 'text-slate-300' : 'text-amber-400'} fill-current`} />
                ))}
              </div>
              <p className="text-sm text-slate-600 font-mono">
                {tier.points === 0 ? '< ' + pointsFor1Star : tier.points + '+'} pts
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
