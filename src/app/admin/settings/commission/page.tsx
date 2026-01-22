'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Percent, 
  Star, 
  Save, 
  ArrowLeft,
  Info,
  Award,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface CommissionSetting {
  id?: number;
  settingKey: string;
  settingValue: string;
  settingUnit: string;
  description: string;
  isActive: boolean;
}

// Tier configuration for display with default commission rates
const tierConfig = [
  { key: 'commission_new_tier', name: 'New', stars: 0, defaultRate: '30', color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  { key: 'commission_starter_tier', name: 'Starter', stars: 1, defaultRate: '25', color: 'from-amber-400 to-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'commission_bronze_tier', name: 'Bronze', stars: 2, defaultRate: '20', color: 'from-orange-400 to-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'commission_silver_tier', name: 'Silver', stars: 3, defaultRate: '15', color: 'from-slate-300 to-slate-400', bgColor: 'bg-slate-50', borderColor: 'border-slate-300' },
  { key: 'commission_platinum_tier', name: 'Platinum', stars: 4, defaultRate: '10', color: 'from-purple-400 to-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'commission_gold_tier', name: 'Gold', stars: 5, defaultRate: '0', color: 'from-yellow-400 to-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
];

export default function CommissionSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rating/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only commission settings
        const commissionSettings = (data.data || []).filter((s: CommissionSetting) => 
          s.settingKey.startsWith('commission_')
        );
        setSettings(commissionSettings);
      }
    } catch (error) {
      console.error('Failed to fetch commission settings:', error);
      setMessage({ type: 'error', text: 'Failed to load commission settings' });
    } finally {
      setLoading(false);
    }
  };

  const getSettingValue = (key: string): string => {
    const setting = settings.find(s => s.settingKey === key);
    if (setting?.settingValue) return setting.settingValue;
    // Return default value if not found in database
    const tier = tierConfig.find(t => t.key === key);
    return tier?.defaultRate || '0';
  };

  const updateSettingValue = (key: string, value: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.settingKey === key);
      if (existing) {
        return prev.map(s => s.settingKey === key ? { ...s, settingValue: value } : s);
      } else {
        // Create new setting if doesn't exist
        const tier = tierConfig.find(t => t.key === key);
        return [...prev, {
          settingKey: key,
          settingValue: value,
          settingUnit: 'percent',
          description: `Commission rate for ${tier?.name || 'Unknown'} tier publishers`,
          isActive: true
        }];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save each commission setting
      for (const setting of settings) {
        await fetch(`${API_URL}/api/rating/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            settingKey: setting.settingKey,
            settingValue: setting.settingValue,
            settingUnit: 'percent',
            description: setting.description
          })
        });
      }

      setMessage({ type: 'success', text: 'Commission settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save commission settings:', error);
      setMessage({ type: 'error', text: 'Failed to save commission settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Commission Settings
            </h1>
            <p className="text-slate-600 mt-1">Configure withdrawal commission rates for each publisher tier</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg">
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">How Commission Works</h3>
              <p className="text-slate-600 mt-1">
                When publishers request a withdrawal, a commission percentage is deducted based on their tier level. 
                Higher tier publishers (more stars) pay lower commission rates. This incentivizes publishers to 
                create quality content and grow their audience.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-medium">
                <TrendingDown className="h-4 w-4" />
                Higher tier = Lower commission = More earnings for publishers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rates Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-purple-600" />
          Commission Rates by Tier
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tierConfig.map((tier) => (
            <div
              key={tier.key}
              className={`rounded-xl p-5 ${tier.bgColor} border ${tier.borderColor} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-md`}>
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{tier.name}</h3>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < tier.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Commission Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={getSettingValue(tier.key)}
                    onChange={(e) => updateSettingValue(tier.key, e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-bold text-slate-900"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {tier.stars === 0 && 'New publishers with no rating'}
                  {tier.stars === 1 && 'Publishers with 1 star rating'}
                  {tier.stars === 2 && 'Publishers with 2 star rating'}
                  {tier.stars === 3 && 'Publishers with 3 star rating'}
                  {tier.stars === 4 && 'Publishers with 4 star rating'}
                  {tier.stars === 5 && 'Top tier publishers with 5 stars'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Calculation */}
      <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="h-6 w-6 text-blue-600" />
          Example Calculation
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Tier</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Stars</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Commission Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">On GHC 100 Withdrawal</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Publisher Receives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tierConfig.map((tier) => {
                const rate = parseFloat(getSettingValue(tier.key)) || 0;
                const withdrawal = 100;
                const commission = (withdrawal * rate) / 100;
                const net = withdrawal - commission;
                
                return (
                  <tr key={tier.key} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{tier.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < tier.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        rate === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      - GHC {commission.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-emerald-600">GHC {net.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 p-6 border border-amber-200">
        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Recommended Commission Structure
        </h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>New tier (30%)</strong> - Starting rate for new publishers</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Gradual decrease</strong> - Reduce commission by 5% for each tier level</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Gold tier (0%)</strong> - No commission for top performers to reward excellence</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>Balance revenue</strong> - Ensure commission covers platform costs while incentivizing growth</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
