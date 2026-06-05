'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { adminAuthFetch } from '@/lib/admin-session';

interface AdminAlert {
  key: 'publishers' | 'articles' | 'withdrawals';
  title: string;
  description: string;
  href: string;
  count: number;
}

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const API_URL = getApiUrl();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
    publishers: 0,
    articles: 0,
    withdrawals: 0,
  });

  useEffect(() => {
    const fetchAdminAlerts = async () => {
      try {
        const [usersResponse, articlesResponse, withdrawalsResponse] = await Promise.all([
          adminAuthFetch(`${API_URL}/api/users/pending-count`),
          adminAuthFetch(`${API_URL}/api/articles/pending-count`),
          adminAuthFetch(`${API_URL}/api/withdrawals?status=pending`),
        ]);

        const usersData = usersResponse.ok ? await usersResponse.json() : {};
        const articlesData = articlesResponse.ok ? await articlesResponse.json() : {};
        const withdrawalsData = withdrawalsResponse.ok ? await withdrawalsResponse.json() : {};

        setAlertCounts({
          publishers: Number(usersData.creators || 0),
          articles: Number(articlesData.count || 0),
          withdrawals:
            withdrawalsData.success && Array.isArray(withdrawalsData.data?.withdrawals)
              ? withdrawalsData.data.withdrawals.length
              : 0,
        });
      } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
      }
    };

    fetchAdminAlerts();
    const interval = setInterval(fetchAdminAlerts, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const alerts: AdminAlert[] = [
    {
      key: 'publishers',
      title: 'New Publisher Requests',
      description: 'Publisher accounts are waiting for review.',
      href: '/admin/creators',
      count: alertCounts.publishers,
    },
    {
      key: 'articles',
      title: 'New Articles Pending',
      description: 'Articles are waiting for admin review.',
      href: '/admin/articles',
      count: alertCounts.articles,
    },
    {
      key: 'withdrawals',
      title: 'Withdrawal Requests',
      description: 'Publisher withdrawals need review or payment action.',
      href: '/admin/withdrawals',
      count: alertCounts.withdrawals,
    },
  ];
  const activeAlerts = alerts.filter((alert) => alert.count > 0);
  const totalAlerts = activeAlerts.reduce((total, alert) => total + alert.count, 0);

  return (
    <header className="relative z-50 h-20 overflow-visible bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 border-b-2 border-purple-100 flex items-center justify-between px-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome back, {user?.username || 'Admin'}!
        </h2>
        <p className="text-sm text-slate-600 font-medium mt-0.5">
          {user?.role === 'admin' ? 'Super Administrator' : 'Content Moderator'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell Icon */}
        <div className="relative z-[70]">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((value) => !value)}
            className="relative p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] rounded-full bg-gradient-to-br from-red-500 to-pink-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white ring-2 ring-white shadow-lg">
                {totalAlerts}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 z-[100] mt-3 w-96 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-900/5">
              <div className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Admin Notifications</p>
                <p className="text-xs text-slate-500">
                  {totalAlerts} active alert{totalAlerts === 1 ? '' : 's'} across publisher, article, and withdrawal queues
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => (
                    <button
                      key={alert.key}
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        router.push(alert.href);
                      }}
                      className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-purple-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{alert.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{alert.description}</span>
                      </span>
                      <span className="min-w-[28px] rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2 py-1 text-center text-xs font-bold text-white">
                        {alert.count}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500">No new admin notifications.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  router.push('/admin/dashboard');
                }}
                className="block w-full bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-purple-600 hover:bg-purple-50"
              >
                Open Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl border-2 border-purple-100 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold text-slate-900">{user?.username}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
          className="gap-2 border-2 border-red-200 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:border-red-500 transition-all duration-300 px-4 py-2 h-auto"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
