'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatDateTime } from '@/lib/utils';
import { Users, FileText, Eye, ThumbsUp, Share2, MessageCircle, AlertCircle } from 'lucide-react';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalArticles: number;
    publishedArticles: number;
    pendingModeration: number;
    newUsersToday: number;
    newArticlesToday: number;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
  };
  recentActivity: {
    articles: any[];
    users: any[];
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!token) return
    try {
      const response = await dashboardAPI.getStats(token);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.overview.totalUsers),
      change: `+${stats.overview.newUsersToday} today`,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/30',
      bgGradient: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Total Articles',
      value: formatNumber(stats.overview.totalArticles),
      change: `+${stats.overview.newArticlesToday} today`,
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/30',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    {
      title: 'Published',
      value: formatNumber(stats.overview.publishedArticles),
      change: `${stats.overview.totalArticles > 0 ? Math.round((stats.overview.publishedArticles / stats.overview.totalArticles) * 100) : 0}% of total`,
      icon: Eye,
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/30',
      bgGradient: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Pending Moderation',
      value: formatNumber(stats.overview.pendingModeration),
      change: 'Needs review',
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
      bgGradient: 'from-amber-50 to-orange-50',
    },
  ];

  const engagementCards = [
    {
      title: 'Total Views',
      value: formatNumber(stats.engagement.totalViews),
      icon: Eye,
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      title: 'Total Likes',
      value: formatNumber(stats.engagement.totalLikes),
      icon: ThumbsUp,
      gradient: 'from-red-500 to-pink-500',
      shadowColor: 'shadow-red-500/30',
    },
    {
      title: 'Total Shares',
      value: formatNumber(stats.engagement.totalShares),
      icon: Share2,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/30',
    },
    {
      title: 'Total Comments',
      value: formatNumber(stats.engagement.totalComments),
      icon: MessageCircle,
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-8 shadow-xl text-white">
        <h1 className="text-4xl font-bold">Dashboard Overview</h1>
        <p className="text-purple-100 mt-2 text-lg">Monitor your platform's performance and key metrics at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="group relative rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:scale-[1.02]">
              <div className={`absolute -z-10 inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity`}></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <p className="text-sm font-medium text-slate-600 mt-1">{stat.change}</p>
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadowColor}`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Metrics */}
      <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {engagementCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.title} className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-md ${metric.shadowColor}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Articles</h3>
          <div className="space-y-4">
            {stats.recentActivity.articles.map((article) => (
              <div key={article.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors">{article.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-600 font-medium">
                      By {article.author?.username}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      article.status === 'published' 
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                        : article.status === 'pending_review'
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700'
                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
                    }`}>
                      {article.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-blue-600 font-semibold">
                    <Eye className="w-4 h-4" />
                    <span>{article.viewsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Users</h3>
          <div className="space-y-4">
            {stats.recentActivity.users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 pb-4 border-b border-slate-100 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                  <span className="text-sm font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{user.username}</p>
                  <p className="text-sm text-slate-600 truncate">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    user.role === 'admin'
                      ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                      : user.role === 'moderator'
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                      : user.role === 'creator'
                      ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                      : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {formatDateTime(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
