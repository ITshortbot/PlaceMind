# Placemind — UI & Frontend Architecture Guide
> **Owner/Role:** Frontend Engineer & Design Lead  
> **Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Three.js / React Three Fiber

---

## 1. Overview & Responsibility
This guide outlines the complete frontend design system, interactive animations, component breakdown, and local development workflow for the Placemind web interface.

The frontend is built with high-tier design principles:
- Dynamic dual-mode background (Soft Pastel Mesh for Light Mode & Deep Velvet Nebula for Dark Mode).
- 3D perspective typography & scroll-linked viewport exposes.
- 18 ATS-verified single-column resume templates gallery with interactive breakdown modal.
- Rich glassmorphism with responsive micro-animations and zero layout shifts.

---

## 2. Directory Structure

```
frontend/
├── public/
│   └── assets/
│       ├── Resume/             # 18 ATS WebP templates (rem1.webp to rem18.webp)
│       ├── mockups/            # MacBook & iPhone showcase assets
│       ├── hero-crystal.jpg    # Hero 3D background visual
│       └── ai-interviewer.jpg  # Rehearsal avatar portrait
├── src/
│   ├── app/
│   │   ├── globals.css         # Pastel mesh keyframes, glass tokens, buttons
│   │   ├── layout.tsx          # RootLayout with ThemeProvider & SVG filters
│   │   └── page.tsx            # Main Landing Page assembling all components
│   ├── components/
│   │   ├── landing/            # Core Landing Page Sections
│   │   │   ├── Navbar.tsx             # Frosted sticky navigation bar
│   │   │   ├── HeroSection.tsx        # 3D floor perspective title + live score card
│   │   │   ├── ProblemFraming.tsx     # 3 statistical pain-point cards
│   │   │   ├── HowItWorks.tsx         # 4-stage interactive algorithmic pipeline
│   │   │   ├── ProductShowcase.tsx    # Full-bleed MacBook with scroll-to-expose
│   │   │   ├── ResumeGallery.tsx      # 18-template grid with filter pills & modal
│   │   │   ├── MobileShowcase.tsx     # 3D depth perspective mobile carousel
│   │   │   ├── FeatureCarousel.tsx    # Asymmetric 3D feature cards
│   │   │   ├── InteractiveDemoWidget.tsx # Live ATS score simulator
│   │   │   ├── Pricing.tsx            # Freemium, Pro & Lifetime pricing cards
│   │   │   ├── FAQ.tsx                # Interactive collapsible accordion
│   │   │   ├── FinalCTA.tsx           # Conversion footer CTA banner
│   │   │   └── Footer.tsx             # Site links, legal & privacy notices
│   │   ├── providers/
│   │   │   └── ThemeProvider.tsx      # next-themes Light/Dark system
│   │   └── ui/
│   │       ├── Badge.tsx              # Pill status badges
│   │       └── Button.tsx             # Glassmorphic shimmering buttons
│   └── types/
│       └── ats.ts                     # TypeScript interfaces & types
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Core Design Tokens & Glassmorphism

| Element | Light Mode | Dark Mode |
|---|---|---|
| **Base Background** | `#F7EFE8` with pastel gradient | `#0A0A0C` with dark nebula |
| **Glass Surfaces** | `rgba(255, 255, 255, 0.75)` + `blur(24px)` | `rgba(20, 20, 24, 0.75)` + `blur(24px)` |
| **Borders** | `1px solid rgba(255, 255, 255, 0.85)` | `1px solid rgba(255, 255, 255, 0.1)` |
| **Brand Accent** | `#6C5CE7` (Electric Purple) | `#7D6FF0` (Neon Violet) |
| **Gradient Accent** | `from-[#6C5CE7] via-[#8F82FF] to-[#38BDF8]` | Same |
| **Success / Parsed** | `#16A34A` / `#22C55E` | `#22C55E` |

---

## 4. Key Interactive Components

### A. Hero Section (`HeroSection.tsx`)
- **3D Floor Headline:** `PLACEMIND • STUDIO` positioned at `rotateX(58deg) rotateY(12deg) rotateZ(-24deg)` behind the score card. Lights up dynamically on mouse proximity.
- **Interactive Card:** Tracks mouse coordinates with responsive 3D spring tilt (`preserve-3d`).

### B. MacBook Product Showcase (`ProductShowcase.tsx`)
- **Scroll-to-Expose:** Uses Framer Motion's `useScroll` to smoothly open and tilt the laptop chassis (`rotateX: 12deg → 0deg`, `scale: 0.92 → 1.02`).
- **Floating Glass Cards:** Inset callouts around the screen showing formatting stats, live ATS score gauge, and quantifiable metric rewrites.

### C. Resume Gallery (`ResumeGallery.tsx`)
- Displays top 3 templates by default with smooth expand/collapse (`18 total WebP assets`).
- Category filtering: *All*, *Software*, *AI/ML*, *Product*, *Data*, *Finance*, *Single-Column*.
- Clickable modal with full-resolution inspection, verified parser checklist, and ATS pass rates.

### D. Mobile Showcase (`MobileShowcase.tsx`)
- 3D perspective depth carousel displaying natural photography scene mockups with instant switch toggles.

---

## 5. Local Setup & Commands

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Build production bundle & check types
npm run build
```

---

## 6. API Integration Contract
When connecting to the Backend API:
- `POST /api/v1/score` &rarr; Send `multipart/form-data` with `file: PDF` and `job_description: string`.
- Handle returned JSON conforming to `AtsScoreResult` in `src/types/ats.ts`.
