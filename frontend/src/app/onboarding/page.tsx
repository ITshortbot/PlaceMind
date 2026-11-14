'use client';

// ============================================================================
// File: frontend/src/app/onboarding/page.tsx
// Description: 4-Step Interactive Onboarding Wizard
//              Step 1: Auth (Email demo)
//              Step 2: Profile Basics (Name, Phone, University, Specialization)
//              Step 3: Personalize (Target Role, Target Company)
//              Step 4: Template Preference & Bootstrap Resume Creation
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
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
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ResumePreview } from '@/components/templates/ResumePreview';
import { BUILDER_TEMPLATES, SAMPLE_RESUME_CONTENT } from '@/lib/builderTemplates';
import { buildPalette } from '@/lib/color/engine';
import { bootstrapResume, type OnboardingAnswers } from '@/lib/api/onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    authMethod: 'email',
    email: '',
    password: '',
    name: '',
    phone: '',
    university: '',
    specialization: '',
    targetRole: '',
    targetCompany: '',
    selectedTemplateId: 'classic',
    autoSelectTemplate: true,
  });

  const nextStep = async () => {
    if (currentStep < 4) {
      // If moving from step 1 to 2, derive default name from email if not already typed
      if (currentStep === 1 && !formData.name && formData.email) {
        const derived = formData.email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        if (derived) {
          setFormData((prev) => ({ ...prev, name: derived }));
        }
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        return;
      }

      setIsBootstrapping(true);
      setBootstrapError(null);

      // Persist profile locally for client-side forms, including email
      try {
        window.localStorage.setItem(
          'placemind.profile',
          JSON.stringify({
            fullName: trimmedName,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            college: formData.university.trim(),
            specialization: formData.specialization.trim(),
          })
        );
      } catch {
        // localStorage not available
      }

      // Bootstrap backend resume record strictly from user-typed facts (no invented facts)
      try {
        const answers: OnboardingAnswers = {
          full_name: trimmedName,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          university: formData.university.trim() || undefined,
          specialization: formData.specialization.trim() || undefined,
          target_role: formData.targetRole.trim() || undefined,
          target_company: formData.targetCompany.trim() || undefined,
        };
        const result = await bootstrapResume(answers);
        if (result?.resume?.id) {
          try {
            window.localStorage.setItem('placemind.activeResumeId', result.resume.id);
            window.localStorage.removeItem('placemind.unsavedNotice');
            if (result.missing && result.missing.length > 0) {
              window.localStorage.setItem('placemind.missingFacts', JSON.stringify(result.missing));
            } else {
              window.localStorage.removeItem('placemind.missingFacts');
            }
          } catch {
            // ignore
          }
        }
        router.push('/resume');
      } catch (err) {
        // On bootstrap failure, keep user answers visible on final step and show options
        setBootstrapError("Couldn't save your setup");
      } finally {
        setIsBootstrapping(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const continueWithoutSaving = () => {
    try {
      window.localStorage.setItem('placemind.unsavedNotice', 'true');
    } catch {}
    router.push('/resume');
  };

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col justify-between font-sans selection:bg-[#6C5CE7] selection:text-white overflow-x-hidden">
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

      {/* Main Multi-Step Form Stage */}
      <main className="flex-1 max-w-xl mx-auto w-full p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: AUTHENTICATION */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 01 &bull; Demo Setup</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to Placemind
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  This is a single-user demo: no account is created and nothing you enter is verified.
                </p>
              </div>

              <Card className="p-6 space-y-4 shadow-xl">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="text-[10px] text-[#8A8A92]">
                    Used to label local demo exports; not sent to any auth provider.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Demo only (not stored)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <Button
                  variant="primary"
                  size="default"
                  onClick={nextStep}
                  className="w-full mt-2"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue with Email
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: PROFILE BASICS */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    placeholder="Optional"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>College / University</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Your university"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Degree & Specialization</Label>
                  <Input
                    type="text"
                    placeholder="e.g. B.Tech Computer Science"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button variant="primary" size="default" onClick={nextStep} icon={<ArrowRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: PERSONALIZE */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 03 &bull; Target Goals</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Personalize Your Track
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  Tailors your starting template keywords and mock interview role context.
                </p>
              </div>

              <Card className="p-6 space-y-4 shadow-xl">
                <div className="space-y-1.5">
                  <Label>Target Job Title / Role</Label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8A8A92]" />
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder="e.g. SDE-1, Full Stack Developer"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Company (Optional)</Label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8A8A92]" />
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder="e.g. Google, Stripe, or Early Stage Startup"
                      value={formData.targetCompany}
                      onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button variant="primary" size="default" onClick={nextStep} icon={<ArrowRight className="w-4 h-4" />}>
                    Select Template
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: TEMPLATE PREFERENCE & BOOTSTRAP */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <Badge variant="accent" size="sm">Step 04 &bull; Format Engine</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Choose Starting Template
                </h1>
                <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA]">
                  Pick a layout to initialize your live resume editor.
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
                      <span>Default ATS-Friendly Layout (Recommended)</span>
                    </div>
                    <p className="text-[11px] text-[#5A5A63] dark:text-[#A1A1AA]">
                      Uses the single-column Classic layout, the safest default for ATS parsing. You can switch layouts anytime in the builder.
                    </p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                </div>

                {/* Manual Template Choices */}
                <div className="space-y-2 pt-1">
                  <Label>Or Pick A Layout (sample previews)</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {BUILDER_TEMPLATES.map((tmpl) => (
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
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-black/10 bg-white pointer-events-none">
                          <div
                            className="absolute top-0 left-0 origin-top-left"
                            style={{ width: '794px', transform: 'scale(0.16)', transformOrigin: 'top left' }}
                          >
                            <ResumePreview content={SAMPLE_RESUME_CONTENT} style={tmpl.style} palette={buildPalette(tmpl.style.mood, tmpl.style.hue ?? undefined)} />
                          </div>
                        </div>
                        <div className="text-[10px] font-bold truncate">{tmpl.name}</div>
                        <span className="text-[9px] font-mono text-[#4A4A52] dark:text-[#A1A1AA] block">
                          Sample layout
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bootstrap Failure Banner */}
                {bootstrapError && (
                  <div className="p-3.5 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#DC2626] dark:text-[#F87171]">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{bootstrapError}</span>
                    </div>
                    <p className="text-[11px] text-[#4A4A52] dark:text-[#A1A1AA] leading-relaxed">
                      We could not create the initial resume record on the backend. Your answers are preserved above.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={nextStep}
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                        disabled={isBootstrapping}
                      >
                        {isBootstrapping ? 'Retrying...' : 'Try again'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={continueWithoutSaving}
                      >
                        Continue without saving
                      </Button>
                    </div>
                  </div>
                )}

                {/* Name Validation Hint */}
                {!formData.name.trim() && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Please enter your full name (Step 2) to build your starting resume draft.</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" size="sm" onClick={prevStep} icon={<ArrowLeft className="w-3.5 h-3.5" />} disabled={isBootstrapping}>
                    Back
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    onClick={nextStep}
                    icon={isBootstrapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    disabled={!formData.name.trim() || isBootstrapping}
                  >
                    {isBootstrapping ? 'Entering Dashboard...' : 'Enter Dashboard'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-4 text-center text-[11px] text-[#8A8A92] border-t border-black/[0.06] dark:border-white/[0.06]">
        Placemind demo build
      </footer>
    </div>
  );
}
