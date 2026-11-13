'use client';

// ============================================================================
// File: frontend/src/app/rehearse/page.tsx
// Description: Voice rehearsal is not wired yet. This page says so honestly
//              and routes to the working text-based practice sessions.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { Mic, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function RehearsePage() {
  return (
    <div className="min-h-screen bg-[#F4EFEA] dark:bg-[#09090C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Mic className="w-8 h-8 text-[#6C5CE7]" />
      <h1 className="text-lg font-extrabold">Voice rehearsal is not available yet</h1>
      <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] max-w-sm">
        Speech capture and playback are not wired in this build. The working practice flow is
        text-based, with deterministic questions and transparent heuristic feedback.
      </p>
      <Link href="/interview/new">
        <Button variant="primary" size="default" icon={<ArrowRight className="w-4 h-4" />}>
          Start a text practice session
        </Button>
      </Link>
    </div>
  );
}
