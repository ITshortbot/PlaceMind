# Placemind — Landing Page Structure & Go-to-Market Strategy

**Scope of this doc:** structure and strategy only — no code, no visual mockups yet. This is meant to be the blueprint you (or a design tool/agentic coder) build from next.

---

## 1. Brand Positioning (sets the tone for everything below)

**One-line positioning:** *"The AI career copilot that parses, scores, rewrites, and rehearses — all in one place, and free to start."*

**Tone to hit:** confident but not hype-y, technical-credible but approachable — think Linear / Vercel / Raycast-style SaaS polish, not a flashy "AI startup" gradient-soup look. Professionalism comes from restraint; the "modern twist" comes from motion and interactivity, not from loud colors.

**Visual personality:** dark-mode-first, high contrast, one confident accent color, generous whitespace, subtle 3D/particle depth in the background rather than literal illustrations of robots/resumes.

---

## 2. Landing Page Structure (section-by-section, top to bottom)

### Section 1 — Navigation Bar (sticky)
- Logo (left) + product name "Placemind"
- Center/right nav: Features · How it Works · Pricing · (optional) Blog
- Right-aligned: "Log in" (ghost/text button) + "Get Started Free" (primary filled button)
- Behavior: transparent over hero, solidifies with a blur/background on scroll (common modern pattern — feels alive without being distracting)

### Section 2 — Hero
- **Headline:** short, outcome-focused (not feature-focused). E.g. "Your resume, scored. Your interview, rehearsed." (placeholder tone — refine later)
- **Subheadline:** one sentence explaining the four-in-one pipeline (parse → score → rewrite → interview)
- **Primary CTA button:** "Try it free" (filled, high-contrast accent color)
- **Secondary CTA:** "Watch demo" (ghost/outline button, maybe triggers a short video or scroll-to-demo)
- **This is where the 3D interactive background lives** — see §4 for concepts
- Optional: a floating/animated product screenshot or mock UI card (resume card + score badge) that reacts subtly to mouse movement (parallax tilt)

### Section 3 — Problem Framing (short, punchy, builds tension before the solution)
- 3 short stat-style callouts in a row, each with a number + one line:
  - e.g. "75%+ of resumes never reach a human — filtered by ATS first"
  - "Most job seekers rewrite the same resume by hand for every application"
  - "Real interview coaching costs $100+/hour"
- Animation: numbers count up on scroll into view

### Section 4 — How It Works (the core product narrative)
- Horizontal 4-step flow, matching your actual pipeline: **Upload → Score → Rewrite → Rehearse**
- Each step: icon + short title + one-sentence description
- Interaction idea: as the user scrolls, each step highlights/activates in sequence (scroll-linked animation), or it's a horizontally-scrollable interactive stepper the user can click through manually
- This section should visually *feel* like the product — a good place for a live-feeling mock UI (animated gap-report score filling in, animated resume bullet being "rewritten" with a typewriter effect)

### Section 5 — Feature Grid
- 4-6 cards, each: icon, short title, 1-2 line description
- Suggested features to highlight: ATS Match Scoring · Tailored Resume Generation · Adaptive Mock Interviews · Local/Private AI Option · Instant PDF Export · Gap Analysis
- Cards should have a subtle hover-lift + border-glow micro-interaction (small, not gimmicky)

### Section 6 — Live Interactive Demo (this is your differentiator section — invest here)
- An embedded, simplified interactive widget right on the landing page — e.g. paste a JD, see a live mock "gap score" animate in, or a mini chat bubble showing a sample AI interview question + score
- Doesn't need to be the real backend — can be a scripted/simulated demo for the landing page, clearly good enough to convey the experience
- This section does more conversion work than any static screenshot

### Section 7 — Social Proof / Credibility
- Since this is a new/student project, "social proof" can be reframed as **credibility signals** instead of fake testimonials:
  - "Built on open-source models: Gemini, DeBERTa, BGE" (logo row)
  - "100% free to start — no credit card"
  - If available later: a small "as featured in" or hackathon/PBL recognition badge
- Avoid fabricated testimonials/quotes — use real ones once you have them, or skip this section for MVP

### Section 8 — Pricing / Free Tier Callout
- Single clear card: "Free to start" with a bullet list of what's included
- If you plan a future paid tier, show it grayed-out/"coming soon" rather than fully building it now
- CTA button repeated here: "Get Started Free"

### Section 9 — FAQ
- Accordion-style, 5-6 questions: "Is my data private?", "Which AI models power this?", "Can I use my own local AI?", "Is it really free?", "What file formats are supported?"
- Good place to preempt the "is this just another wrapper" skepticism directly

### Section 10 — Final CTA Band
- Full-width, high-contrast section, one line + one button: "Ready to fix your resume?" → "Get Started Free"
- Often paired with a lighter version of the hero's 3D background for visual bookending

### Section 11 — Footer
- Logo + tagline
- Columns: Product (Features/Pricing/Demo) · Company (About/Contact) · Legal (Privacy/Terms)
- Social icons, minimal
- Small print: "Placemind is not affiliated with Google, Anthropic, or any ATS vendor" (good, honest disclaimer given you use their models)

---

## 3. Button & CTA System

**Hierarchy (only 2 button types — resist adding more):**
1. **Primary button** — solid fill, accent color, used for the single most important action per section ("Get Started Free"). Rounded corners (medium radius, not full pill — reads more professional/technical than a full pill shape). Subtle scale-up + shadow-lift on hover, not color-flash.
2. **Secondary/ghost button** — outline or text-only, used for lower-priority actions ("Watch demo", "Learn more"). Border appears/brightens on hover.

**Rules to keep it professional, not flashy:**
- Never more than one primary button visible in the same viewport at once
- Consistent sizing: same button height across the whole page (don't let hero buttons be huge and footer buttons tiny)
- Motion should be under 200ms — anything slower reads as sluggish, not premium
- Icon-in-button (e.g. arrow →) only on primary CTAs, and only one icon style throughout

---

## 4. "3D Interactive Background" — Concept Options (pick one, don't combine)

**Option A — Particle network / constellation** (classic but still effective if subtle)
- Thin dots connected by faint lines, drifting slowly, reacting to mouse position with gentle repulsion
- Risk: overused in AI-startup templates — only use if styled minimally (very low opacity, monochrome)

**Option B — Animated gradient mesh / blob (WebGL shader)**
- Soft, slow-moving colored blobs blurred into a mesh gradient behind the hero content
- Reads as premium/modern (this is the current dominant trend for AI SaaS hero sections) and is *cheaper to render* than true 3D geometry — good performance tradeoff
- Recommended as the safest "modern but professional" choice

**Option C — True 3D scene (Three.js/React Three Fiber)**
- A subtle 3D object — e.g. an abstract rotating geometric shape, or floating flat "resume card" planes with depth — that responds to mouse movement (parallax/rotation)
- Higher visual impact, but higher performance risk on low-end devices/mobile — needs a static fallback for mobile
- Recommended only if you want a genuine standout "wow" moment specifically in the hero, not throughout the whole page

**Option D — Interactive canvas tied to scroll, not just mouse**
- Background subtly evolves as the user scrolls down (e.g. particles/gradient shift color or density per section) — ties the "interactive background" idea to the whole page narrative instead of just the hero

**Recommendation:** Option B (gradient mesh) for the base background across the whole page for consistency and performance, layered with Option C (one small 3D element) *only* in the hero for the "wow" moment. This gets you both professionalism (consistent, subtle background) and a modern 3D twist (one high-impact focal element) without overloading every section.

---

## 5. Animation Strategy (general rules, not section-specific)

- **Scroll-triggered reveals:** elements fade+slide in (short distance, ~20-30px) as they enter viewport — standard, tasteful, and cheap to implement
- **Micro-interactions everywhere, macro-animations rarely:** buttons/cards get small hover feedback; big animated transitions should be reserved for 1-2 hero moments, not every section
- **Respect `prefers-reduced-motion`:** disable/simplify animations for users who've set this — a professional detail that also happens to be an accessibility requirement
- **Performance rule of thumb:** anything running continuously (the 3D background) should be paused/simplified when the tab isn't visible or on scroll-away, to avoid janky performance complaints

---

## 6. Advertisement / Go-to-Market Strategy

Given this starts as a free MVP/student project, the strategy should lean on **low-cost, high-credibility channels** rather than paid ads initially.

### Phase 1 — Pre-launch / Campus & Community (Weeks 1-2 of launch)
- Direct outreach to your own college's placement cell — offer it as a free tool for students during placement season (built-in credible use case + real user feedback loop)
- Post in relevant student/CS communities (college WhatsApp/Discord groups, LinkedIn student groups)
- A simple landing-page waitlist/email capture before full public launch builds an initial list to notify at launch

### Phase 2 — Content-Led Organic Growth (ongoing, $0 cost)
- **LinkedIn posts** (highest-fit channel for this exact audience — job seekers + recruiters both live there): before/after resume rewrite examples, "how ATS actually works" explainer posts, short demo clips
- **Short-form video** (Instagram Reels/YouTube Shorts): 20-30 second "watch this resume go from 45 to 89 ATS score" style clips — visually satisfying and highly shareable
- **SEO-driven blog content** (slow-burn but compounds): "How to beat ATS in 2026", "Free resume checker vs paid tools" — target the same long-tail keywords your competitors (Jobscan, Rezi, Wobo) already rank for
- **Reddit** (r/resumes, r/cscareerquestions, r/jobs): genuinely helpful participation, not spammy self-promo — mention the tool only when directly relevant to someone's question

### Phase 3 — Credibility & Comparison Positioning
- A direct, honest comparison page/section: "Placemind vs Jobscan vs Rezi" — highlighting your actual differentiators (free, integrated interview practice, local/private AI option) — this converts well because people actively search "X vs Y" before choosing a tool
- Publish your own version of a transparency report (like ResumeAI's "State of ATS" report) — builds trust and is inherently shareable/link-worthy content

### Phase 4 — Referral Loop (once you have real users)
- Simple mechanic: "Know someone job hunting? Share your resume score" — a shareable score-card image (like a Wordle/Spotify-Wrapped style share card) is a strong, cheap viral mechanic specifically because ATS scores are inherently a comparison-bait number

### Messaging Pillars (use consistently across all channels)
1. **"All-in-one"** — parsing + scoring + rewriting + interview practice, not four separate subscriptions
2. **"Actually free"** — no credit card, no 3-day trial trap
3. **"Your data, your choice"** — local AI option for privacy-conscious users
4. **"Built on real, current AI"** — Gemini-powered, not a black-box scoring gimmick

---

## 7. Summary Checklist (what to hand off to design/dev next)

- [ ] Finalize color palette (1 accent color + dark neutral base recommended)
- [ ] Pick ONE background concept from §4 (recommend: gradient mesh + one hero 3D element)
- [ ] Build section-by-section in the order from §2
- [ ] Implement the two-button system from §3 consistently
- [ ] Build the live interactive demo widget (§2, Section 6) — highest ROI section to get right
- [ ] Set up a waitlist/email capture before public launch (Phase 1 of §6)
- [ ] Draft 3-5 LinkedIn/short-video pieces of content ready to go live at launch
