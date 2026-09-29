'use client';

// ============================================================================
// File: frontend/src/app/onboarding/page.tsx
// Description: 4-Step Interactive Onboarding Wizard from Wireframe v1
//              Step 1: Auth (LinkedIn/Google/GitHub/Email)
//              Step 2: Profile Basics (Name, Phone, University, Specialization)
//              Step 3: Personalize (Target Role, Target Company)
//              Step 4: Template Preference (Manual Gallery vs Auto-Select by Company ATS)
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  GraduationCap,
  Briefcase,
  Layers,
  Wand2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const TEMPLATES_PREVIEW = [
  { id: 1, name: 'Minimalist Standard', file: '/assets/Resume/rem1.webp', ats: 94.8, bestFor: 'Workday / Stripe' },
  { id: 3, name: 'AI & Systems Pro', file: '/assets/Resume/rem3.webp', ats: 98.2, bestFor: 'Greenhouse / OpenAI' },
  { id: 4, name: 'Full-Stack Modern', file: '/assets/Resume/rem4.webp', ats: 97.2, bestFor: 'Lever / Vercel' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    authMethod: 'linkedin',
    email: 'rohan.patel@email.com',
    password: '',
    name: 'Rohan K. Patel',
    phone: '+1 (555) 349-2049',
    university: 'Stanford University',
    specialization: 'Computer Science & Distributed Systems',
    targetRole: 'Staff Software Architect',
    targetCompany: 'Stripe Core Infrastructure',
    selectedTemplateId: 1,
    autoSelectTemplate: true,
  });

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col justify-between font-sans selection:bg-[#6C5CE7] selection:text-white">
      {/* Top Simple Header */}
      <header className="h-16 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#121217]/80 backdrop-blur-xl px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#38BDF8] flex items-center justify-center text-white font-black text-xs shadow-sm">
            P
          </div>
          <span className="font-extrabold text-base tracking-tight">Placemind</span>
        </Link>

        {/* 4-Step Progress Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep >= step
                  ? 'w-8 bg-[#6C5CE7]'
                  : 'w-2 bg-black/[0.1] dark:bg-white/[0.1]'
              }`}
            />
          ))}
          <span className="text-xs font-mono font-bold text-[#8A8A92] ml-2">
            Step 0{currentStep} / 04
          </span>
        </div>
      </header>

      {/* Main Multi-Step Wizard Stage */}
      <main className="flex-1 max-w-xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: LOGIN / SIGN UP */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 01 &bull; Account Creation</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to Placemind
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  Choose your high-signal sign-in method to get personalized ATS intelligence.
                </p>
              </div>

              <Card className="p-6 space-y-3 shadow-xl">
                {/* 1. LinkedIn Auth */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, authMethod: 'linkedin' }));
                    setCurrentStep(2);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] dark:border-white/[0.1] hover:border-[#0A66C2] bg-white dark:bg-[#1A1A22] hover:bg-[#0A66C2]/5 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-5 h-5 rounded-md bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-black">
                    in
                  </span>
                  <span>Continue with LinkedIn (Recommended)</span>
                </button>

                {/* 2. Google Auth */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, authMethod: 'google' }));
                    setCurrentStep(2);
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] dark:border-white/[0.1] hover:border-[#EA4335] bg-white dark:bg-[#1A1A22] hover:bg-[#EA4335]/5 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-[#EA4335] text-white flex items-center justify-center text-[10px] font-black">
                    G
                  </span>
                  <span>Continue with Google</span>
                </button>

                {/* 3. GitHub Auth */}
                <button
                  onClick={() => {
                    setFormData({ ...formData, authMethod: 'github' });
                    nextStep();
                  }}
                  className="w-full p-3 rounded-xl border border-black/[0.1] dark:border-white/[0.1] hover:border-black dark:hover:border-white bg-white dark:bg-[#1A1A22] hover:bg-black/5 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                    gh
                  </span>
                  <span>Continue with GitHub</span>
                </button>

                {/* 4. Inline Email Expander */}
                <div className="pt-2 space-y-2">
                  <Label>Or use standard work email</Label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <Button variant="default" size="default" className="w-full" onClick={nextStep}>
                    Continue with Email
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: PROFILE BASICS */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 02 &bull; Background</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Profile & Education Basics
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  This automatically pre-fills your resume contact and education sections.
                </p>
              </div>

              <Card className="p-6 space-y-4 shadow-xl">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>College / University</Label>
                  <Input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Field of Study / Specialization</Label>
                  <Input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button variant="default" size="default" onClick={nextStep} icon={<ArrowRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: PERSONALIZATION & TARGETING */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 03 &bull; Target Context</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Personalize Your Track
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  What role and company are you targeting first?
                </p>
              </div>

              <Card className="p-6 space-y-4 shadow-xl">
                <div className="space-y-1.5">
                  <Label>Target Position / Role</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Staff Distributed Systems Engineer"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Target Company (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Stripe, OpenAI, Google"
                    value={formData.targetCompany}
                    onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 text-xs text-[#6C5CE7] dark:text-[#8F82FF] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Dashboard will immediately customize recommended skills and interview probes for {formData.targetCompany || 'your target role'}.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button variant="default" size="default" onClick={nextStep} icon={<ArrowRight className="w-4 h-4" />}>
                    Select Template
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: TEMPLATE PREFERENCE */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 04 &bull; Format Alignment</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Choose Starting Template
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  Pick your favorite or let AI choose based on {formData.targetCompany}&apos;s ATS parser.
                </p>
              </div>

              <Card className="p-6 space-y-4 shadow-xl">
                {/* Auto-Select Option */}
                <div
                  onClick={() => setFormData({ ...formData, autoSelectTemplate: true })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    formData.autoSelectTemplate
                      ? 'border-[#16A34A] bg-[#16A34A]/10 shadow-sm'
                      : 'border-black/[0.08] dark:border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1E] dark:text-white">
                      <Wand2 className="w-4 h-4 text-[#16A34A]" />
                      <span>Auto-Select According to Company ATS (Recommended)</span>
                    </div>
                    <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                      Automatically sets single-column Workday/Greenhouse verified layout.
                    </p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                </div>

                {/* Manual Template Choices */}
                <div className="space-y-2 pt-1">
                  <Label>Or Pick From Verified Gallery</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {TEMPLATES_PREVIEW.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() =>
                          setFormData({ ...formData, selectedTemplateId: tmpl.id, autoSelectTemplate: false })
                        }
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer space-y-1.5 ${
                          !formData.autoSelectTemplate && formData.selectedTemplateId === tmpl.id
                            ? 'border-[#6C5CE7] bg-[#6C5CE7]/15 ring-2 ring-[#6C5CE7]'
                            : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/20'
                        }`}
                      >
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-black/10 bg-white">
                          <Image src={tmpl.file} alt={tmpl.name} fill className="object-cover object-top" />
                        </div>
                        <div className="text-[10px] font-bold truncate">{tmpl.name}</div>
                        <span className="text-[9px] font-mono text-[#16A34A] font-bold block">
                          {tmpl.ats}% ATS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button variant="default" size="default" onClick={nextStep} icon={<Sparkles className="w-4 h-4" />}>
                    Enter Dashboard
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-4 text-center text-[11px] text-[#8A8A92] border-t border-black/[0.06] dark:border-white/[0.06]">
        Placemind Privacy Sandbox &bull; 100% In-Memory Processing &bull; Zero Telemetry
      </footer>
    </div>
  );
}
