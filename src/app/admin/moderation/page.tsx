'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { moderationAPI, articlesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ThumbsUp, ThumbsDown, AlertCircle, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface PendingArticle {
  id: string;
  title: string;
  excerpt?: string;
  author: {
    username: string;
    email: string;
  };
  category: {
    name: string;
    color: string;
  };
  createdAt: string;
}

export default function ModerationPage() {
  const { token } = useAuth();
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPendingArticles();
    fetchStats();
  }, []);

  const fetchPendingArticles = async () => {
    if (!token) return
    try {
      const response = await articlesAPI.getAll(token, { status: 'pending_review' });
      // Backend returns { success: true, data: { articles: [], pagination: {} } }
      setPendingArticles(response.data?.articles || []);
    } catch (error) {
      console.error('Failed to fetch pending articles:', error);
      setPendingArticles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return
    try {
      const response = await moderationAPI.getStats(token);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch moderation stats:', error);
    }
  };

  const handleApprove = async (articleId: string) => {
    if (!token) return
    try {
      await articlesAPI.updateStatus(token, articleId, 'published'); // lowercase enum value
      fetchPendingArticles();
      fetchStats();
    } catch (error) {
      console.error('Failed to approve article:', error);
      alert('Failed to approve article. Please try again.');
    }
  };

  const handleReject = async (articleId: string) => {
    if (!token) return
    try {
      await articlesAPI.updateStatus(token, articleId, 'rejected'); // lowercase enum value
      fetchPendingArticles();
      fetchStats();
    } catch (error) {
      console.error('Failed to reject article:', error);
      alert('Failed to reject article. Please try again.');
    }
  };

  const handleViewArticle = async (articleId: string) => {
    if (!token) return
    try {
      const response = await articlesAPI.getById(token, articleId);
      setSelectedArticle(response.data || response);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      alert('Failed to load article details.');
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Content Moderation</h1>
        <p className="text-slate-600 mt-1">Review and approve pending articles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Review</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-2">{pendingArticles.length}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Approved Today</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">{stats.approved || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ThumbsUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected Today</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mt-2">{stats.rejected || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <ThumbsDown className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-500/5 to-pink-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>

      {/* Pending Articles */}
      <div className="rounded-2xl bg-white shadow-xl border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pending Articles ({pendingArticles.length})
          </h2>
        </div>
        <div className="p-6">
          {pendingArticles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-slate-600 font-medium">No articles pending review</p>
              <p className="text-sm text-slate-400 mt-1">Great job keeping up with moderation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-6 border-2 border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {article.category ? (
                          <span
                            className="px-3 py-1 text-xs rounded-full font-semibold shadow-sm"
                            style={{
                              backgroundColor: (article.category.color || '#718096') + '20',
                              color: article.category.color || '#718096',
                            }}
                          >
                            {article.category.name}
                          </span>
                        ) : (
                          <span
                            className="px-3 py-1 text-xs rounded-full font-semibold bg-slate-100 text-slate-600"
                          >
                            Uncategorized
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-medium">By {article.author.username}</span>
                        <span>•</span>
                        <span>{formatDateTime(article.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleApprove(article.id)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(article.id)}
                        variant="outline"
                        className="border-2 border-red-500 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-red-500 gap-2 transition-all duration-300"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewArticle(article.id)}
                        className="hover:bg-purple-50 hover:text-purple-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Preview Modal */}
      {showPreview && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Article Preview</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setSelectedArticle(null);
                }}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Featured Image */}
              {selectedArticle.featuredImageUrl && (
                <div className="mb-6">
                  <img
                    src={selectedArticle.featuredImageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-96 object-cover rounded-2xl shadow-lg"
                  />
                </div>
              )}

              {/* Article Header */}
              <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                  {selectedArticle.title}
                </h1>
                
                {selectedArticle.excerpt && (
                  <p className="text-xl text-slate-600 mb-4 font-medium">
                    {selectedArticle.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="font-medium">By {selectedArticle.author?.username || 'Unknown'}</span>
                  <span>•</span>
                  <span>{formatDateTime(selectedArticle.createdAt)}</span>
                  {selectedArticle.category && (
                    <>
                      <span>•</span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: (selectedArticle.category?.color || '#718096') + '20',
                          color: selectedArticle.category?.color || '#718096',
                        }}
                      >
                        {selectedArticle.category?.name || 'Uncategorized'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Article Content */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex gap-3">
                <Button
                  onClick={() => {
                    handleApprove(selectedArticle.id);
                    setShowPreview(false);
                    setSelectedArticle(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve Article
                </Button>
                <Button
                  onClick={() => {
                    handleReject(selectedArticle.id);
                    setShowPreview(false);
                    setSelectedArticle(null);
                  }}
                  variant="outline"
                  className="border-2 border-red-500 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-red-500 gap-2 transition-all duration-300"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject Article
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
