'use client';

// ============================================================================
// File: frontend/src/app/ats/page.tsx
// Description: Tab 4 - ATS: Auto-Generate for a Job in 1-Pass from Wireframe v1
//              Step 1: Paste/Upload target JD
//              Step 2: Live AI Synthesis stream
//              Step 3: Seamless hand-off to 3-column editor
// ============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Wand2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  FileCheck2,
  Cpu,
} from 'lucide-react';

export default function AtsAutoGeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [jdText, setJdText] = useState(
    `Staff Software Engineer · Stripe Core Infrastructure
We are looking for a Staff Engineer to lead high-throughput event processing (Kafka), optimize PostgreSQL & vector search pipelines, and guarantee 99.99% multi-region uptime.`
  );

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      router.push('/resume');
    }, 2000);
  };

  return (
    <AppShell>
      <TopBar
        title="ATS Auto-Generate"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'ATS Auto-Generate' },
        ]}
      />

      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8 pb-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="accent" size="md" className="bg-[#FACC15] text-[#0A0A0C] border-none font-bold">
            <Wand2 className="w-3.5 h-3.5 mr-1" />
            1-PASS AI GENERATION PIPELINE
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0A0A0C] dark:text-[#F8F9FA]">
            Auto-Generate Tailored ATS Resume
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4A52] dark:text-[#A1A1AA]">
            Paste any job description and let Placemind synthesize a tailored, verified single-column draft in one pass.
          </p>
        </div>

        {/* Input & Action Card */}
        <Card className="p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-black/[0.08] dark:border-white/[0.12] bg-white/90 dark:bg-[#121217]/90 backdrop-blur-2xl">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="mb-0">Target Job Description / Requirements</Label>
              <span className="text-[10px] text-[#854D0E] dark:text-[#FACC15] font-bold">Live Semantic Parser Ready</span>
            </div>
            <Textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job posting text or URL here..."
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FACC15]" />
              <span>Base Profile: <strong>Rohan K. Patel (Staff Software Architect)</strong></span>
            </div>
            <span className="text-[#16A34A] dark:text-[#22C55E] font-bold text-[11px]">✓ 100% Parsable</span>
          </div>

          <div className="pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0C]" /> : <Sparkles className="w-4 h-4 text-[#0A0A0C]" />}
              className="w-full text-sm font-black shadow-xl shadow-[#FACC15]/25 text-[#0A0A0C]"
            >
              {isGenerating ? 'Synthesizing Tailored ATS Resume...' : 'Auto-Generate Resume & Open Editor'}
            </Button>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
