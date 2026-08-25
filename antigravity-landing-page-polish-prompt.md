# Prompt for Antigravity (Claude Opus) — Placemind Landing Page Visual Polish Pass

## Context
The landing page content structure and section order are already correct and should NOT be changed — do not add, remove, or reorder sections, do not rewrite copy, do not change the information architecture. This is a **visual/motion polish pass only**. The current build looks flat, static, and text-heavy: solid black background with no depth, bordered boxes with no glassmorphism or hover feedback, zero scroll animation, and a hero with no interactive/3D element. Fix that without touching content or layout structure.

Tech stack already in use: Next.js 14 (App Router, TypeScript), Tailwind CSS, shadcn/ui. Add: **Framer Motion** (`framer-motion`) for scroll/hover animation, **React Three Fiber** (`@react-three/fiber`) + **drei** (`@react-three/drei`) for the one hero 3D element, and **Embla Carousel** (`embla-carousel-react`) or a custom CSS 3D-transform carousel for the feature-tile carousel described in Task 5.

---

## Task 1 — Global animated background (every section)

Replace the current flat solid-black background with a subtle, continuously-animating gradient mesh:
- Base color stays near-black (`#0A0A0C`), with 2-3 large, heavily-blurred blob shapes in the accent indigo/violet (`#6C5CE7`) and a secondary cooler tone, positioned absolutely and drifting slowly (`~30-40s` loop, `ease-in-out`, alternating).
- Implement as a fixed-position `<div>` behind all content (`position: fixed; inset: 0; z-index: -1; filter: blur(120px)`), NOT inside each section — one shared background for the whole page so it feels continuous while scrolling, not per-section boxes.
- Opacity/blur tuned so body text keeps a **minimum 4.5:1 contrast ratio** against it at all times — check this against every section's text color, not just the hero.
- Respect `prefers-reduced-motion`: if set, freeze the gradient in place (no animation, just the static blurred shapes).
- On mobile, keep the gradient but at a smaller blur radius / lower complexity for performance; no behavior change needed otherwise since it's not mouse-driven.

## Task 2 — Hero 3D interactive element

The hero currently has a flat card mockup and no true 3D. Add ONE lightweight interactive 3D element using React Three Fiber, positioned behind or beside the existing "Staff AI Architect Audit" mock UI card (don't remove that card — it's good content, just give it depth):
- A simple abstract geometric object (e.g. a low-poly icosahedron or a torus knot) in wireframe or subtle-gradient material, using the accent color.
- Responds to mouse movement with a **capped rotation range of 10-15°** and **max 15-20px translation** — subtle parallax, not free spin. Use `@react-three/drei`'s `useFrame` + lerp toward mouse position for smooth easing, not 1:1 tracking (1:1 tracking feels jittery/cheap).
- Lazy-load this component with `next/dynamic` and `ssr: false` so it doesn't block initial page load or hurt LCP.
- On mobile (`useMediaQuery` or `window.innerWidth < 768`), don't render the Three.js canvas at all — just show a static version of the gradient/glow in its place. No mouse to track on mobile anyway, and it saves bundle weight on the connection that needs it least.
- Also apply a lighter mouse-parallax tilt directly to the existing "Staff AI Architect Audit" mock card itself (CSS `transform: perspective() rotateX() rotateY()` driven by mouse position, same capped range) so it feels like it's floating in the same 3D space as the background element.

## Task 3 — Scroll-reveal animation on every section

Every section currently pops into view with zero motion. Wrap each major section's content in Framer Motion:
- Use `whileInView` with `viewport={{ once: true, margin: "-100px" }}` so animations trigger once, slightly before the element is fully in view (feels more responsive than waiting for full visibility).
- Standard reveal: `initial={{ opacity: 0, y: 24 }}` → `animate={{ opacity: 1, y: 0 }}`, duration ~0.5s, ease `[0.22, 1, 0.36, 1]` (a standard "ease-out-expo"-ish curve — avoid linear or default ease, they feel robotic).
- **Stagger children** within each section (feature grids, stat rows, pricing cards, FAQ items) using a parent `motion.div` with `staggerChildren: 0.08-0.12` — right now the 6 capability tiles and the pricing cards all appear simultaneously as one flat block; they should cascade in.
- The three stat numbers (75%+, 10x, $100) should count up from 0 when scrolled into view — implement with `react-countup` triggered by the same `whileInView` boundary, duration ~1.2-1.5s.
- The "Vector Alignment Matrix" bars inside the hero mock card, and any similar progress-bar-style UI elsewhere on the page, should animate their width from 0% to target% on mount/reveal rather than appearing pre-filled.

## Task 4 — Card depth, glassmorphism, and hover feedback

Every card on the page (stat cards, pipeline step cards, capability tiles, pricing cards, the hero mock UI card) currently reads as a flat bordered box. Upgrade the treatment:
- Card background: semi-transparent surface color (`rgba(20, 20, 23, 0.6)`) + `backdrop-filter: blur(12px)` so the background gradient from Task 1 subtly shows through — this is what makes cards feel like they're floating above the animated background instead of sitting on a flat black page.
- Border: `1px solid rgba(255,255,255,0.08)` default, brightening to `rgba(108,92,231,0.4)` (accent-tinted) on hover.
- On hover: subtle lift (`translateY(-4px)`) + soft accent-colored glow shadow (`box-shadow: 0 8px 30px rgba(108,92,231,0.15)`), transition ~200ms. Apply this consistently to ALL card types — currently capability tiles, pricing cards, and pipeline steps look inconsistent with each other; unify the hover treatment across all of them.
- Icons inside cards (currently flat single-color) should sit inside a small rounded square with a subtle accent-tinted background (`rgba(108,92,231,0.12)`), consistent size across every card type.

## Task 5 — Convert the 6 "Engineered for precision" capability tiles into a 3D carousel

This section (ATS Match Scoring / Tailored Bullet Rewriting / Adaptive Mock Interviews / Local Privacy Mode / Instant ATS PDF Export / Bipartite Gap Matrix) is currently a static 3x2 grid, which is a large chunk of the "wall of content" feeling. Convert it to an interactive 3D carousel:
- Use a coverflow-style layout: the center card is largest/fully opaque/facing forward, cards to either side are smaller, rotated on the Y-axis (~25-35°), and partially faded (`opacity: 0.5-0.6`), creating a visual sense of depth curving away from the viewer.
- Implement with `embla-carousel-react` + custom CSS 3D transforms per-slide based on distance-from-center (simplest, most performant route), OR a full React Three Fiber carousel if more visual fidelity is wanted — prefer the CSS/Embla route first for performance and simplicity unless it looks insufficient.
- Navigation: arrow buttons on either side (ghost style, matching the button system) + draggable/swipeable on both desktop (mouse drag) and mobile (touch), + small dot indicators below.
- Autoplay slowly (~5s per slide) but pause immediately on hover or drag interaction — never fight the user.
- Keep each card's internal content (icon, title, description, badge) exactly as currently designed — this task is about the container/layout mechanism, not the card content itself.

## Task 6 — Reduce visual density / "wall of text" feeling

Without cutting any copy, increase breathing room so the page reads as designed rather than dense:
- Increase vertical padding between major sections (target ~120-160px between sections on desktop, ~64-80px on mobile — audit current spacing, which looks tighter than this).
- Increase line-height on body/description text to 1.6-1.7 (currently reads tight).
- For the "Why traditional job applications are mathematically broken" stat cards and the FAQ list: increase internal card padding and the gap between items — these two sections currently look the most cramped.
- Section eyebrows (small uppercase labels like "THE RECRUITMENT BOTTLENECK", "THE FOUR-STAGE PIPELINE") should get a bit more letter-spacing and a subtle accent-colored dot or short line beside them for visual anchoring, rather than floating as plain small text.

## Task 7 — Button and CTA polish

- Primary buttons ("Try it Free", "Run Live Gap Analysis", pricing CTA): on hover, scale to `1.02-1.03` + brighten background + soft accent glow shadow, transition ~150-200ms ease-out. Currently these appear to have no hover feedback.
- Secondary/ghost buttons ("Watch AI Demo", carousel arrows): border brightens + subtle background tint fade-in on hover, no scale (keep scale reserved for primary CTAs only, per the two-button hierarchy already established).
- Add a subtle press-down effect (`scale: 0.98`) on `:active` for all buttons — small detail, noticeably improves perceived responsiveness/tactility.

## Task 8 — Nav bar

- Make the nav bar `sticky top-0`, fully transparent over the hero, transitioning to `backdrop-blur-lg` + semi-transparent surface background once the user scrolls past ~80px (use a scroll listener or Framer Motion's `useScroll` + `useTransform` on opacity/blur).

---

## Explicit boundaries — do NOT:
- Do not change any copy/text content in any section
- Do not reorder or remove any section
- Do not change the pricing structure or FAQ content
- Do not add new sections beyond what's specified above
- Do not make the 3D/animation elements the dominant visual focus — they should support the content, not distract from it; if in doubt, dial an effect back rather than up
- Do not skip the `prefers-reduced-motion` and mobile-fallback requirements in Tasks 1, 2, and 5 — these are not optional polish, they're required for a professional, accessible result

## Acceptance criteria
- [ ] Page background is a single continuous animated gradient mesh, not per-section flat black
- [ ] Hero has one working, mouse-responsive 3D element with capped rotation range
- [ ] Every section's content animates in on scroll (fade+slide, staggered for grids/lists)
- [ ] Stat numbers count up on scroll into view
- [ ] All cards share a consistent glassmorphism + hover-lift treatment
- [ ] The 6 capability tiles are now an interactive 3D coverflow carousel, draggable and autoplaying
- [ ] Section spacing/line-height increased per Task 6 — page no longer feels text-dense
- [ ] All buttons have hover + active-state feedback
- [ ] Nav bar transitions from transparent to blurred on scroll
- [ ] Reduced-motion and mobile fallbacks work correctly for every animated/3D element
- [ ] Lighthouse performance score does not regress meaningfully from the current build (verify after adding Three.js — lazy-load if needed)
