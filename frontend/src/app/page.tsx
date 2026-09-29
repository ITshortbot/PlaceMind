'use client';

// ============================================================================
// File: frontend/src/app/page.tsx
// Description: Master Landing Page with continuous GlobalBackground, Product Showcase,
//              Authentic 18-Template Resume Gallery, MobileShowcase, 3D Coverflow Carousel,
//              and exact section layout.
// ============================================================================

import React, { useState } from 'react';
import { GlobalBackground } from '@/components/landing/GlobalBackground';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemFraming } from '@/components/landing/ProblemFraming';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { ResumeGallery } from '@/components/landing/ResumeGallery';
import { MobileShowcase } from '@/components/landing/MobileShowcase';
import { FeatureCarousel } from '@/components/landing/FeatureCarousel';
import { InteractiveDemoWidget } from '@/components/landing/InteractiveDemoWidget';
import { SocialProof } from '@/components/landing/SocialProof';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { DemoModal } from '@/components/landing/DemoModal';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const scrollToDemo = () => {
    const el = document.getElementById('demo');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen text-[#1A1A1E] dark:text-[#F5F5F7] relative selection:bg-[#6C5CE7] selection:text-white">
      {/* Continuous Animated Background */}
      <GlobalBackground />

      {/* Sticky Navigation Bar with Theme Switcher */}
      <Navbar
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onGetStarted={scrollToDemo}
      />

      {/* Hero Section with Parallax Card */}
      <HeroSection
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onTryFree={scrollToDemo}
      />

      {/* Problem Framing (Asymmetric Bento Grid) */}
      <ProblemFraming />

      {/* How It Works (4-Stage Pipeline with Real WebP Document Parsing) */}
      <HowItWorks />

      {/* Product Showcase (Real MacBook Pro on Bouclé Sofa Asset with Scroll Parallax) */}
      <ProductShowcase />

      {/* Authentic 18-Template ATS Resume Gallery */}
      <ResumeGallery />

      {/* Real iPhone in Shirt Pocket Scene Asset with Scroll Parallax */}
      <MobileShowcase />

      {/* True 3D Coverflow Feature Carousel */}
      <FeatureCarousel />

      {/* Live Interactive Demo Widget (Laser Scanning Gap Scorer + Mock Rehearsal) */}
      <InteractiveDemoWidget />

      {/* Verified Open-Source & Model Credibility Signals */}
      <SocialProof />

      {/* Transparent Pricing & Free Tier Callout */}
      <Pricing />

      {/* FAQ Accordion with Spacious Glassmorphic Rows */}
      <FAQ />

      {/* Final High-Contrast CTA Band with Radial Glow Bookend */}
      <FinalCTA />

      {/* Modern Footer with Architecture Links & Legal Disclaimers */}
      <Footer />

      {/* 60-Second Walkthrough Video Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </main>
  );
}
