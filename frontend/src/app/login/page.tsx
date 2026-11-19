'use client';

// ============================================================================
// File: frontend/src/app/login/page.tsx
// Description: Sign-in page. One real action: continue with Google through
//   the backend OAuth flow. Signed-in visitors are forwarded to where they
//   were headed. Error codes arrive from the backend callback as ?error=.
// ============================================================================

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth, loginWithGoogle } from '@/lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  google_declined: 'The Google sign-in was cancelled or declined.',
  invalid_state: 'That sign-in attempt expired. Please try again.',
  not_configured: 'Google sign-in is not configured on this server yet.',
  no_id_token: 'Google did not return an identity token. Please try again.',
  missing_identity: 'Your Google account did not share an email address.',
  account_exists:
    'An account with this email already exists but could not be safely linked to this Google account.',
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [starting, setStarting] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const next = params.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  const errorCode = params.get('error');
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] || 'Sign-in failed. Please try again.'
    : null;

  useEffect(() => {
    if (!loading && user && !user.is_guest) {
      router.replace(safeNext);
    }
  }, [loading, user, router, safeNext]);

  const startGoogle = async () => {
    setStarting(true);
    setConfigError(null);
    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await fetch(`${backendUrl}/api/v1/auth/google/login`, {
        redirect: 'manual',
        credentials: 'include',
      });
      // The endpoint answers 302 to Google, or 503 when not configured.
      if (res.status === 503) {
        setConfigError(ERROR_MESSAGES.not_configured);
        setStarting(false);
        return;
      }
    } catch {
      // Network hiccup: still attempt the top-level navigation below.
    }
    loginWithGoogle();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7EFE8] dark:bg-[#0A0A0C]">
        <Loader2 className="w-6 h-6 animate-spin text-[#6C5CE7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white font-black text-sm shadow-sm">
          P
        </div>
        <span className="font-extrabold text-lg tracking-tight">Placemind</span>
      </Link>

      <Card className="w-full max-w-sm p-8 space-y-6 shadow-xl text-center">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
            {user?.is_guest
              ? 'You are using a guest session. Continue with Google for a registered account.'
              : 'Your resumes, scores and interview practice are tied to your account.'}
          </p>
        </div>

        {(errorMessage || configError) && (
          <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#DC2626] dark:text-[#F87171] flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage || configError}</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={startGoogle}
          disabled={starting}
          icon={starting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {starting ? 'Connecting to Google...' : 'Continue with Google'}
        </Button>

        <p className="text-[11px] text-[#8A8A92] leading-relaxed">
          Sign-in uses your Google account. PlaceMind stores your name, email and Google account id
          - never your Google password.
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7EFE8] dark:bg-[#0A0A0C]">
          <Loader2 className="w-6 h-6 animate-spin text-[#6C5CE7]" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
