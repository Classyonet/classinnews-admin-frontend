'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  BarChart3,
  FolderTree,
  Settings,
  BookOpen,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, notificationKey: 'dashboard' },
  { name: 'Publishers', href: '/admin/creators', icon: Users, notificationKey: 'creators' },
  { name: 'Readers', href: '/admin/readers', icon: BookOpen, notificationKey: 'readers' },
  { name: 'Administrators', href: '/admin/administrators', icon: Shield, notificationKey: 'administrators' },
  { name: 'Articles', href: '/admin/articles', icon: FileText, notificationKey: 'articles' },
  { name: 'Moderation', href: '/admin/moderation', icon: Shield, notificationKey: 'moderation', showBadge: true },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: DollarSign, notificationKey: 'withdrawals', showBadge: true },
  { name: 'Trending Topics', href: '/admin/trending-topics', icon: TrendingUp, notificationKey: 'trending' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, notificationKey: 'analytics' },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree, notificationKey: 'categories' },
  { name: 'System Settings', href: '/admin/settings', icon: Settings, notificationKey: 'settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({
    moderation: 0,
    articles: 0,
    creators: 0,
    readers: 0,
    withdrawals: 0,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  useEffect(() => {
    // Fetch notification counts
    const fetchNotifications = async () => {
      try {
        // Fetch pending moderation count
        const moderationRes = await fetch(`${API_URL}/api/moderation/pending-count`);
        if (!moderationRes.ok) throw new Error('Failed to fetch moderation count');
        const moderationData = await moderationRes.json();
        
        // Fetch pending articles count
        const articlesRes = await fetch(`${API_URL}/api/articles/pending-count`);
        if (!articlesRes.ok) throw new Error('Failed to fetch articles count');
        const articlesData = await articlesRes.json();
        
        // Fetch new users awaiting approval
        const usersRes = await fetch(`${API_URL}/api/users/pending-count`);
        if (!usersRes.ok) throw new Error('Failed to fetch users count');
        const usersData = await usersRes.json();

        // Fetch pending withdrawals count
        const withdrawalsRes = await fetch(`${API_URL}/api/withdrawals?status=pending`);
        const withdrawalsData = await withdrawalsRes.json();
        const withdrawalsCount = withdrawalsData.success ? withdrawalsData.data.withdrawals.length : 0;

        console.log('Notification counts:', {
          moderation: moderationData.count,
          articles: articlesData.count,
          creators: usersData.creators,
          readers: usersData.readers,
          withdrawals: withdrawalsCount
        });

        setNotificationCounts({
          moderation: moderationData.count || 0,
          articles: articlesData.count || 0,
          creators: usersData.creators || 0,
          readers: usersData.readers || 0,
          withdrawals: withdrawalsCount || 0,
        });
      } catch (error) {
        console.error('Failed to fetch notification counts:', error);
        // On error, keep previous counts or set to 0
        // This ensures UI doesn't show stale mock data
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-72 bg-gradient-to-br from-[#9966CC] via-[#4169E1] to-[#1E3A8A] text-white flex flex-col shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFF33]/10 via-[#FFD700]/5 to-transparent pointer-events-none"></div>
      
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 relative z-10 bg-gradient-to-r from-[#9966CC]/50 to-[#4169E1]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFFF33] to-[#FFD700] flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <span className="text-xl font-bold text-[#1E3A8A]">CN</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#FFFF33] to-[#FFD700] bg-clip-text text-transparent">ClassyNews</h1>
            <p className="text-xs text-blue-200">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto relative z-10">
        <div className="space-y-1.5 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            const count = notificationCounts[item.notificationKey] || 0;
            const showBadge = (item.showBadge || count > 0) && count > 0;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group',
                  isActive
                    ? 'bg-gradient-to-r from-[#FFFF33] to-[#FFD700] text-[#1E3A8A] shadow-xl shadow-yellow-500/50 scale-[1.02]'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm'
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-[#1E3A8A]/20" 
                    : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex-1">{item.name}</span>
                {showBadge && (
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center shadow-lg shadow-red-500/50 animate-pulse">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 relative z-10 bg-gradient-to-r from-[#9966CC]/30 to-[#4169E1]/30">
        <div className="px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <p className="text-xs text-blue-200 text-center font-semibold">
            ClassyNews Admin v1.0
          </p>
          <p className="text-xs text-blue-300/70 text-center mt-1">
            Powered by Innovation
          </p>
        </div>
      </div>
    </div>
  );
}
