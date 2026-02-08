'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { articlesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, ThumbsUp, MessageCircle, MoreVertical } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  status: string;
  viewsCount: number;
  likesCount: number;
  author: {
    username: string;
    email: string;
  };
  // category may be null for older or incomplete articles
  category?: {
    name: string;
    color: string;
  } | null;
  createdAt: string;
  _count?: {
    comments: number;
  };
}

export default function ArticlesPage() {
  const { token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchArticles();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchArticles = async () => {
    if (!token) {
      console.log('❌ No token available - user not logged in');
      setLoading(false);
      return;
    }
    
    console.log('✅ Token exists, fetching articles...');
    
    try {
      setLoading(true);
      const response = await articlesAPI.getAll(token, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      console.log('📝 Articles API response:', response);
      console.log('📝 Response structure check:', {
        hasData: !!response.data,
        hasArticles: !!response.data?.articles,
        isArray: Array.isArray(response.data?.articles),
        articlesCount: response.data?.articles?.length || 0
      });
      
      // Handle nested response structure: { success: true, data: { articles, pagination } }
      const articlesData = response.data?.articles || response.data || response;
      console.log('📝 Extracted articles data:', articlesData);
      console.log('📝 Is articlesData an array?', Array.isArray(articlesData));
      console.log('📝 ArticlesData length:', Array.isArray(articlesData) ? articlesData.length : 'NOT AN ARRAY');
      
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      console.log('✅ Articles state updated');
    } catch (error: any) {
      console.error('❌ Failed to fetch articles:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      // Don't show alert popup, users can see the empty state message
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchArticles();
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    if (!token) return
    try {
      await articlesAPI.updateStatus(token, articleId, newStatus);
      fetchArticles(); // Refresh the list
    } catch (error) {
      console.error('Failed to update article status:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200';
      case 'pending_review':
        return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200';
      case 'draft':
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200';
      case 'rejected':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200';
      case 'archived':
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 border border-slate-200';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Approved Articles</h1>
          <p className="text-slate-600 mt-1">Manage published and approved articles from moderation</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search articles by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-slate-700"
          >
            <option value="published">Published (Approved)</option>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
          <Button onClick={handleSearch} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30">
            Search
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <div key={article.id} className="rounded-2xl bg-white p-6 shadow-lg border-2 border-purple-100 hover:shadow-2xl hover:border-purple-300 hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="px-3 py-1 text-xs rounded-full font-semibold shadow-sm"
                    style={{
                      backgroundColor: (article.category?.color || '#718096') + '20',
                      color: article.category?.color || '#718096',
                    }}
                  >
                    {article.category?.name || 'Uncategorized'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusBadgeColor(article.status)}`}>
                    {article.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer">
                  {article.title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="font-medium">By {article.author.username}</span>
                  <span>•</span>
                  <span>{formatDateTime(article.createdAt)}</span>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-700">{article.viewsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-100">
                    <ThumbsUp className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-700">{article.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-700">{article._count?.comments || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {article.status === 'pending_review' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(article.id, 'published')}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(article.id, 'rejected')}
                      className="border-2 border-red-500 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-red-500 transition-all duration-300"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {article.status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(article.id, 'archived')}
                    className="border-2 border-slate-300 text-slate-600 hover:bg-slate-600 hover:text-white hover:border-slate-600"
                  >
                    Archive
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="hover:bg-purple-50 hover:text-purple-600">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && !loading && (
        <div className="rounded-2xl bg-white p-12 shadow-lg border border-slate-100">
          <div className="text-center">
            <p className="text-slate-600 font-medium">{token ? 'No articles found' : 'Please log in to view articles'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
