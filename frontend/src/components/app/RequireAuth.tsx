'use client';

// ============================================================================
// File: frontend/src/components/app/RequireAuth.tsx
// Description: Client-side gate for internal pages. While the session is
//   being resolved it renders a loading state; signed-out visitors are sent
//   to /login with a return path. The backend independently enforces auth on
//   every API call - this gate is the UX half, not the security boundary.
// ============================================================================

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7EFE8] dark:bg-[#0A0A0C]">
        <Loader2 className="w-6 h-6 animate-spin text-[#6C5CE7]" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
