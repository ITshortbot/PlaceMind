# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wireframe-v1.spec.ts >> Placemind Wireframe v1 Suite (Onboarding + 8 Flat Tabs) >> Tab 2 - Template Gallery renders 2x5 grid with ATS badges
- Location: tests/wireframe-v1.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('ATS-Verified Resume Templates')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('ATS-Verified Resume Templates')

```

```yaml
- complementary:
  - link "P":
    - /url: /dashboard
  - button "Search Pages & Actions (Cmd+K)":
    - img
  - navigation:
    - link:
      - /url: /dashboard
      - img
    - link:
      - /url: /template
      - img
    - link:
      - /url: /resume
      - img
    - link:
      - /url: /resume
      - img
    - link:
      - /url: /ats
      - img
    - link:
      - /url: /resumes/upload
      - img
    - link:
      - /url: /interview
      - img
    - link:
      - /url: /report
      - img
    - link:
      - /url: /history
      - img
    - link:
      - /url: /settings
      - img
  - button "Toggle Theme":
    - img
- banner:
  - link "Dashboard":
    - /url: /dashboard
  - img
  - text: Templates
  - link "Upload Resume":
    - /url: /resumes/upload
    - button "Upload Resume":
      - img
      - text: Upload Resume
- main:
  - heading "Prompt-to-Template Generator" [level=1]
  - paragraph: Synthesize ATS-compliant single-column layouts, tailored resume content, and WCAG 4.5:1 color palettes.
  - text: Demo Mode
  - checkbox "Demo Mode"
  - img
  - text: Describe Your Resume & Style 65 / 500 chars
  - textbox "Describe Your Resume & Style":
    - /placeholder: e.g. clean dark-teal resume for a fresher data analyst, projects first
    - text: clean dark-teal resume for a fresher data analyst, projects first
  - text: "Quick Prompts:"
  - button "clean dark-teal resume for a fresher data analyst, projects first"
  - button "modern executive tech lead resume with accent banner"
  - button "compact 1-page software engineer resume"
  - button "academic CV for research scientist with education first"
  - button "+ Add Target Job Description (Optional)"
  - button "Generate Resume":
    - img
    - text: Generate Resume
  - img
  - text: Sample preset (offline demo)
  - img
  - text: 22.1ms
  - heading "Color & Accessibility Engine" [level=3]
  - paragraph: OKLCH spectrum with guaranteed WCAG 4.5:1 contrast
  - text: Mood Preset
  - button "Corporate"
  - button "Tech"
  - button "Creative"
  - button "Minimal"
  - button "Finance"
  - text: Hue Angle 195°
  - slider "Hue Angle": "195"
  - text: Custom Brand Hex (Optional)
  - textbox "Custom Brand Hex (Optional)":
    - /placeholder: "#3B82F6"
  - text: "Generated Palette BG #F6FBFB Ink #0A1414 Muted #465656 Accent #00666B Rule #D5E1E0 Accessibility Audit (WCAG 2.1) Body Text 17.91:1 PASS Accent Heading 6.46:1 PASS Grayscale 6.46:1 PASS Active Architecture Spec Layout sidebar header Typography Arial (11pt) Density normal Header Style banner Modern Tech • Arial • 11pt • normal"
  - button "Export to PDF (Print)"
  - heading "Candidate Resume" [level=1]
  - paragraph: Full-Stack Software Architect
  - heading "Professional Summary" [level=2]
  - paragraph: Versatile engineer with 6+ years architecting scalable cloud services, real-time reactive frontends, and AI pipelines.
  - heading "Core Competencies & Skills" [level=2]
  - text: TypeScript Next.js Python FastAPI Kubernetes Docker PostgreSQL Redis
  - heading "Work Experience" [level=2]
  - text: Senior Full-Stack Engineer [High-Growth Startup]
  - list:
    - listitem: Engineered microservices handling [X]k concurrent user sessions with [X]% uptime.
    - listitem: Optimized frontend Time-to-Interactive by [X]% using Next.js partial pre-rendering.
  - heading "Key Projects" [level=2]
  - text: Distributed Vector Memory Engine github.com/example/vector-mem
  - paragraph: High-throughput RAG search engine with pgvector indexing.
  - list:
    - listitem: Reduced similarity lookup latency from [X]ms to [X]ms.
  - heading "Education & Credentials" [level=2]
  - text: B.S. in Computer Science 2020
  - paragraph: "[Top University]"
  - img
  - heading "ATS Readiness Audit" [level=3]
  - paragraph: Audit this resume against standard ATS parsing heuristics, keyword alignment, and structural rules.
  - button "Calculate Readiness Score":
    - img
    - text: Calculate Readiness Score
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Placemind Wireframe v1 Suite (Onboarding + 8 Flat Tabs)', () => {
  4  |   test('Step 1-4 Onboarding Wizard works seamlessly', async ({ page }) => {
  5  |     await page.goto('/onboarding');
  6  |     await page.waitForLoadState('networkidle');
  7  | 
  8  |     // Step 1: Auth
  9  |     await expect(page.getByText('Welcome to Placemind')).toBeVisible();
  10 |     await expect(page.getByText('Continue with LinkedIn')).toBeVisible();
  11 |     await page.click('button:has-text("Continue with LinkedIn")');
  12 | 
  13 |     // Step 2: Profile Basics
  14 |     await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  15 |     await expect(page.locator('input').filter({ hasText: '' }).first()).toBeVisible();
  16 |     await page.click('button:has-text("Continue")');
  17 | 
  18 |     // Step 3: Personalization
  19 |     await expect(page.getByText('Personalize Your Track')).toBeVisible();
  20 |     await page.click('button:has-text("Select Template")');
  21 | 
  22 |     // Step 4: Template Preference
  23 |     await expect(page.getByText('Choose Starting Template')).toBeVisible();
  24 |     await expect(page.getByText('Auto-Select According to Company ATS')).toBeVisible();
  25 |     await page.click('button:has-text("Enter Dashboard")');
  26 | 
  27 |     // Land on Dashboard
  28 |     await page.waitForURL('**/dashboard');
  29 |     await expect(page.getByText('Welcome back, Rohan')).toBeVisible();
  30 |   });
  31 | 
  32 |   test('Tab 1 - Dashboard renders greeting, 3 quick actions, and AI command bar', async ({ page }) => {
  33 |     await page.goto('/dashboard');
  34 |     await page.waitForLoadState('networkidle');
  35 |     await expect(page.getByText('Build a Resume')).toBeVisible();
  36 |     await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
  37 |     await expect(page.getByText('Practice Interview')).toBeVisible();
  38 |     await expect(page.getByPlaceholder(/Ask Placemind AI/)).toBeVisible();
  39 |   });
  40 | 
  41 |   test('Tab 2 - Template Gallery renders 2x5 grid with ATS badges', async ({ page }) => {
  42 |     await page.goto('/template');
  43 |     await page.waitForLoadState('networkidle');
> 44 |     await expect(page.getByText('ATS-Verified Resume Templates')).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  45 |     await expect(page.getByRole('button', { name: 'Use Template' }).first()).toBeVisible();
  46 |   });
  47 | 
  48 |   test('Tab 3 - Resume renders 3-column layout and physical hero document preview', async ({ page }) => {
  49 |     await page.goto('/resume');
  50 |     await page.waitForLoadState('networkidle');
  51 |     await expect(page.getByText('Your Information')).toBeVisible();
  52 |     await expect(page.getByText('Quick Template Switcher')).toBeVisible();
  53 |     await expect(page.getByText('Google XYZ Metric Optimization')).toBeVisible();
  54 |     await expect(page.getByPlaceholder(/Ask Placemind AI/)).toBeVisible();
  55 |   });
  56 | 
  57 |   test('Tab 4 - ATS Auto-Generate allows 1-pass synthesis', async ({ page }) => {
  58 |     await page.goto('/ats');
  59 |     await page.waitForLoadState('networkidle');
  60 |     await expect(page.getByText('Auto-Generate Tailored ATS Resume')).toBeVisible();
  61 |     await expect(page.getByRole('button', { name: /Auto-Generate Resume/ })).toBeVisible();
  62 |   });
  63 | 
  64 |   test('Tab 5 - Interview renders split setup and live conversation', async ({ page }) => {
  65 |     await page.goto('/interview');
  66 |     await page.waitForLoadState('networkidle');
  67 |     await expect(page.getByText('Interview Setup')).toBeVisible();
  68 |     await expect(page.getByText('Real Recruiter')).toBeVisible();
  69 |     await expect(page.getByText('AI Practice')).toBeVisible();
  70 |   });
  71 | 
  72 |   test('Tab 6 - Report renders 2-column analytical scoring and SVG radar chart', async ({ page }) => {
  73 |     await page.goto('/report');
  74 |     await page.waitForLoadState('networkidle');
  75 |     await expect(page.getByText('Resume & ATS Score Report')).toBeVisible();
  76 |     await expect(page.getByText('Interview Performance Report')).toBeVisible();
  77 |     await expect(page.getByText('STAR Structure')).toBeVisible();
  78 |   });
  79 | 
  80 |   test('Tab 7 - History renders chronological artifact cards', async ({ page }) => {
  81 |     await page.goto('/history');
  82 |     await page.waitForLoadState('networkidle');
  83 |     await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
  84 |     await expect(page.getByRole('button', { name: 'Open in Editor' }).first()).toBeVisible();
  85 |   });
  86 | 
  87 |   test('Tab 8 - Settings renders profile and AI engine controls', async ({ page }) => {
  88 |     await page.goto('/settings');
  89 |     await page.waitForLoadState('networkidle');
  90 |     await expect(page.getByText('Account & Application Settings')).toBeVisible();
  91 |     await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  92 |   });
  93 | });
  94 | 
```