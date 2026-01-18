'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <header className="h-20 bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 border-b-2 border-purple-100 flex items-center justify-between px-8 shadow-sm">
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
        <button className="relative p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-gradient-to-br from-red-500 to-pink-500 ring-2 ring-white shadow-lg"></span>
        </button>

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
