'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import AdminSidebar from '@/components/admin/sidebar';
import AdminHeader from '@/components/admin/header';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { newVersionAvailable } = useVersionCheck();

  useEffect(() => {
    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [user, loading, pathname, router]);

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show layout for authenticated users
  if (user) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {newVersionAvailable && (
            <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 z-50">
              <span className="animate-pulse">⬆️</span> New version available! Refresh to get the latest features.
              <button onClick={() => window.location.reload()} className="ml-4 underline font-bold hover:text-blue-200">Refresh Now</button>
            </div>
          )}
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return null;
}
