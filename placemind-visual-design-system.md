# Placemind — Visual Design System
## Color Palette, Background Interactivity Level, and Additional Polish

---

## 1. Color Palette

**Approach:** dark-mode-first (matches the "Linear/Vercel/Raycast" professional-modern tone from the strategy doc), one confident accent color, restrained semantic colors. Avoid multi-color gradient-soup — that's what reads as "generic AI startup" rather than "confident product."

### Base / Neutral scale (backgrounds, text, borders)

| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0A0A0C` | Page background (near-black, not pure black — pure black feels flat/cheap under a 3D background) |
| `bg-surface` | `#141417` | Card backgrounds, nav bar |
| `bg-surface-raised` | `#1C1C21` | Hovered cards, modals |
| `border-subtle` | `#2A2A30` | Default borders/dividers |
| `border-strong` | `#3D3D45` | Hover-state borders |
| `text-primary` | `#F5F5F7` | Headlines, primary text |
| `text-secondary` | `#A1A1AA` | Subheadlines, descriptions |
| `text-tertiary` | `#6B6B76` | Footnotes, timestamps, disabled |

### Accent color (pick ONE — this is your brand color)

Recommendation: a **cool electric indigo/violet**, not blue — blue is the single most oversaturated color in AI/SaaS right now (every competitor you researched uses blue-ish branding); a shifted indigo/violet still reads "trustworthy tech" but is more distinctive.

| Token | Hex | Use |
|---|---|---|
| `accent` | `#6C5CE7` | Primary buttons, links, active states, the 3D/gradient background's dominant hue |
| `accent-hover` | `#7D6FF0` | Button hover state (slightly lighter, not darker — dark-mode hovers should brighten) |
| `accent-muted` | `#6C5CE7` at 12% opacity | Subtle backgrounds behind icons, badge fills |
| `accent-glow` | `#6C5CE7` at 30% opacity, heavy blur | Used only for the hero background glow / button hover shadow |

**Alternative accent** if you want to differentiate further from typical AI-purple: a **warm amber/coral** (`#FF6B4A`) against the same dark neutral base — reads more "human/career-focused" than "generic AI," and pairs unusually well with dark mode. Either works; don't use both as co-equal accents — pick one primary, and the other can become a single semantic color (see below).

### Semantic colors (used sparingly — scores, states, alerts)

| Token | Hex | Use |
|---|---|---|
| `success` | `#22C55E` | High ATS score, "well covered" gap-report tag |
| `warning` | `#F5A623` | "Weakly covered" gap-report tag |
| `danger` | `#F04438` | "Not covered" gap-report tag, errors |
| `info` | `#38BDF8` | Neutral informational badges |

**Rule:** semantic colors appear only inside data/UI elements (score badges, gap-report tags) — never as decorative page elements. This keeps the palette feeling intentional instead of "everything is colorful."

---

## 2. Typography

| Role | Suggested font | Notes |
|---|---|---|
| Headings | **Geist** or **Inter** (variable weight) | Both are free, modern, and used by Vercel/Linear-tier products — safe, professional choice |
| Body | Same family as headings (single font family) | Two-font systems rarely help on a product landing page; one family, multiple weights, is cleaner |
| Monospace (for code/JSON snippets, if shown) | **JetBrains Mono** or **Geist Mono** | Use only if you show any technical snippet (e.g. the resume JSON schema) as a credibility flex |

**Scale (approximate, rem-based):**
- Hero headline: 3.5-4.5rem, bold (700)
- Section headline: 2-2.5rem, semi-bold (600)
- Body: 1-1.125rem, regular (400), `text-secondary` color
- Small/labels: 0.875rem, medium (500), uppercase + letterspaced for section eyebrows (e.g. "HOW IT WORKS")

---

## 3. How Much Should the Background Actually Move?

This is the part most projects get wrong in both directions — either too static (boring) or too busy (unprofessional, distracting, hurts readability). Here's a concrete calibration:

### The core rule: **the background should never compete with the foreground for attention.**
If someone can't easily read the headline text on first glance, it's too much.

### Recommended interactivity levels, by zone

| Zone | Motion level | Reasoning |
|---|---|---|
| **Hero section** | Medium — this is your one "wow" moment | Gradient mesh slowly animating (auto-drift, ~20-40s loop) + the one 3D element responding to mouse with a **small** parallax/rotation range (max ~10-15° tilt, not full free rotation) |
| **All other sections (features, how-it-works, etc.)** | Low to none | Background here should be nearly static — maybe a very faint gradient continuation from the hero, no active 3D geometry. Motion budget should be spent on scroll-reveal animations of the *content*, not the background, once you're past the hero |
| **Final CTA band** | Medium (mirrors hero) | A lighter/smaller echo of the hero treatment — ties the page together visually without needing new motion design |

### Specific numeric guidance (for whoever builds this)

- **Mouse-parallax displacement:** cap at ~15-20px max translation and ~10-15° max rotation — beyond this it starts to feel like a game/gimmick rather than a subtle depth cue
- **Auto-animation speed (gradient drift, particle drift):** slow enough that a user has to watch for 3-4 seconds to notice it's moving at all — if it's noticeably animating within the first second, it's too fast
- **Opacity of background elements behind text:** background should sit at low enough opacity/contrast that text remains at a **minimum 4.5:1 contrast ratio** (WCAG AA) against it — non-negotiable for a "professional" feel, not just accessibility
- **Frame budget:** target 60fps but design so a drop to 30fps (lower-end device) is still visually acceptable — avoid effects that look "broken" at half speed
- **Mobile:** disable the interactive 3D element entirely on mobile (no mouse to track anyway); keep only the slow auto-animating gradient, or even a static gradient image as the mobile fallback

### A simple mental model to hand off
> "The background should feel like a **living, breathing surface you glance at**, not a **stage you're asked to watch**. If a user describes the page as 'that site with the cool background,' you've gone too far — you want 'that site that felt really polished,' where they can't quite articulate why."

---

## 4. Additional Polish (beyond what's already in the strategy doc)

### Glassmorphism, used sparingly
- Nav bar and any floating card over the hero background can use a subtle frosted-glass effect (`backdrop-blur` + low-opacity surface color) — this is what makes UI feel like it's "floating above" the 3D background rather than sitting flatly on top of it
- Don't apply glass effect to every card on the page — reserve it for elements literally overlapping the animated background (nav bar, hero product mockup card)

### Cursor micro-interactions
- A custom cursor (small dot that scales up slightly over clickable elements) is a cheap, high-perceived-polish addition — very common on this exact style of product site
- Keep it subtle: scale/opacity change only, no color-cycling or trailing effects (those read as "fun/gimmicky" not "professional")

### Spacing system
- Use a consistent 8px-based spacing scale (8/16/24/32/48/64/96/128) throughout — this single discipline does more for "looking professional" than almost any other visual decision, since inconsistent spacing is the #1 tell of an amateur build

### Iconography
- Pick one icon set and use it everywhere (recommend **Lucide** or **Phosphor** — both free, modern, consistent stroke-width) — mixing icon styles (some filled, some outlined, from different libraries) is another common amateur tell

### Section transitions
- Rather than hard section-to-section cuts, use a subtle gradient fade or a very slight color-temperature shift at section boundaries (e.g. background gets fractionally warmer/cooler as you scroll) — reinforces the idea that the page is one continuous "living" surface, tying back to the interactive-background concept without adding more literal motion

### Loading/skeleton states
- Since real AI processing takes a few seconds (parsing, scoring), design skeleton/shimmer loading states now as part of the system, not as an afterthought — a polished loading state matters as much as the final result for perceived quality, especially in your live demo section

### Sound (optional, use extremely sparingly if at all)
- If you want one more "modern" touch: a very quiet, subtle UI click/tick sound on primary CTA clicks only (off by default or easily mutable) — this is a genuinely underused touch on B2C SaaS sites and can feel premium, but skip entirely if there's any risk it feels gimmicky or annoying — silence is the safer default

---

## 5. Quick Reference Summary

| Decision | Recommendation |
|---|---|
| Accent color | Indigo/violet `#6C5CE7` (or amber `#FF6B4A` as alternative) |
| Base theme | Dark mode, near-black `#0A0A0C` |
| Font | Geist or Inter, single family |
| Background motion (hero) | Medium — slow gradient drift + capped-range 3D parallax |
| Background motion (rest of page) | Low/none — motion budget spent on content reveals instead |
| Mouse parallax range | Max 15-20px / 10-15° |
| Mobile background | Static fallback, no 3D interactivity |
| Contrast rule | Min 4.5:1 text-to-background at all times |
| Glass effect | Nav bar + hero floating card only |
| Icon set | One library only (Lucide/Phosphor) |
| Spacing | 8px-based scale throughout |
