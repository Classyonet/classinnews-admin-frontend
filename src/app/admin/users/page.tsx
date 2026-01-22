"use client";

export const runtime = 'edge';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Simple redirect page: Users management has been consolidated under Creators / role-based screens.
export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    // Replace the users route with the creators page to avoid leaving a dead link
    router.replace('/admin/creators');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Users page removed</h2>
        <p className="text-gray-500 mt-2">Redirecting to Creators management…</p>
      </div>
    </div>
  );
}
