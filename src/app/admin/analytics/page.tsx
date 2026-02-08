'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { analyticsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ThumbsUp, Share2, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    // optional article totals returned from the backend overview endpoint
    articles?: {
      total: number;
      published: number;
      pending: number;
      draft: number;
    };
  };
  topArticles: Array<{
    id: string;
    title: string;
    viewsCount: number;
    likesCount: number;
    author: { username: string };
  }>;
  topCreators: Array<{
    id: string;
    username: string;
    articlesCount: number;
    totalViews: number;
  }>;
  categories: Array<{
    name: string;
    color: string;
    articlesCount: number;
    percentage: number;
  }>;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [period, token]);

  const fetchAnalytics = async () => {
    if (!token) {
      console.log('No token available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Backend expects a numeric 'period' (days). Map friendly values to days.
      const mapPeriodToDays = (p: string) => {
        if (!p) return undefined;
        if (/^\d+$/.test(p)) return p; // already numeric
        if (p === '24h') return '1';
        if (p === '7d') return '7';
        if (p === '30d') return '30';
        if (p === '90d') return '90';
        // fallback: try to extract digits
        const m = p.match(/(\d+)/);
        return m ? m[1] : undefined;
      };

      const periodDays = mapPeriodToDays(period);

      const [overview, topArticles, topCreators, categories] = await Promise.all([
        analyticsAPI.getOverview(token, periodDays),
        analyticsAPI.getTopArticles(token, { limit: 10 }),
        analyticsAPI.getTopCreators(token, 10),
        analyticsAPI.getCategories(token),
      ]);

      // Helper to extract data whether backend returns { success: true, data: ... } or bare arrays/objects
      const extract = (r: any) => r?.data ?? r ?? null;

      setAnalytics({
        overview: extract(overview) || { totalViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0 },
        topArticles: extract(topArticles) || [],
        topCreators: extract(topCreators) || [],
        categories: extract(categories) || [],
      });
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      // Don't show alert popup, set default empty data
      setAnalytics({
        overview: { totalViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0 },
        topArticles: [],
        topCreators: [],
        categories: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-slate-600 mt-1">Platform performance and insights</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-slate-700"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Views</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mt-2">
                {formatNumber(analytics.overview.totalViews)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Eye className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Likes</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mt-2">
                {formatNumber(analytics.overview.totalLikes)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <ThumbsUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Shares</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">
                {formatNumber(analytics.overview.totalShares)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Share2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Comments</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mt-2">
                {formatNumber(analytics.overview.totalComments)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-100">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Top Performing Articles
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <span className="text-sm font-bold text-white">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{article.title}</p>
                    <p className="text-sm text-slate-500">By {article.author.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatNumber(article.viewsCount)} views
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(article.likesCount)} likes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Creators */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-100">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
                            Top Publishers
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topCreators.map((creator, index) => (
                <div key={creator.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                    <span className="text-sm font-bold text-white">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{creator.username}</p>
                    <p className="text-sm text-slate-500">{creator.articlesCount} articles</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatNumber(creator.totalViews)} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="rounded-2xl bg-white shadow-xl border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Content by Category</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.categories.map((category: any) => {
              // Defensive extraction: backend may return different shapes (category.articlesCount, category.stats.totalArticles, category._count)
              const articlesCount =
                category.articlesCount ?? category.stats?.totalArticles ?? category._count?.articles ?? 0;

              const totalArticles = analytics.overview?.articles?.total ?? 0;

              // Prefer an explicit percentage from backend, otherwise compute from totals if available
              const percentage =
                typeof category.percentage === 'number'
                  ? category.percentage
                  : totalArticles > 0
                  ? (articlesCount / totalArticles) * 100
                  : 0;

              const barColor = category.color ?? category.stats?.color ?? '#718096';

              return (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">{category.name}</span>
                    <span className="text-sm font-semibold text-slate-600">
                      {articlesCount} articles ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 shadow-inner">
                    <div
                      className="h-3 rounded-full transition-all shadow-sm"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
