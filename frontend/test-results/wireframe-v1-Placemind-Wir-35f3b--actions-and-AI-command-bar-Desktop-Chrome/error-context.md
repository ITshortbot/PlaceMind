# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wireframe-v1.spec.ts >> Placemind Wireframe v1 Suite (Onboarding + 8 Flat Tabs) >> Tab 1 - Dashboard renders greeting, 3 quick actions, and AI command bar
- Location: tests/wireframe-v1.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder(/Ask Placemind AI/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByPlaceholder(/Ask Placemind AI/)

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
  - heading "Dashboard" [level=1]
  - link "Build Resume":
    - /url: /resume
    - button "Build Resume":
      - img
      - text: Build Resume
- main:
  - heading "Welcome back" [level=1]
  - paragraph: Your saved resumes and practice sessions, loaded from your workspace.
  - text: "Resumes saved:"
  - strong: "0"
  - img
  - text: "Practice sessions:"
  - strong: "0"
  - link "Build a Resume Craft and edit your single-column ATS resume with certificates and real-time live preview. Open 3-Panel Editor →":
    - /url: /resume
    - img
    - heading "Build a Resume" [level=3]
    - paragraph: Craft and edit your single-column ATS resume with certificates and real-time live preview.
    - text: Open 3-Panel Editor →
  - link "Auto-Generate for a Job Paste a job description and generate an ATS-friendly draft from transparent rules - no black-box AI. Start 1-Pass Auto-Gen →":
    - /url: /ats
    - img
    - heading "Auto-Generate for a Job" [level=3]
    - paragraph: Paste a job description and generate an ATS-friendly draft from transparent rules - no black-box AI.
    - text: Start 1-Pass Auto-Gen →
  - link "Practice Interview Run technical and STAR behavioral practice sessions with transparent, heuristic answer feedback. Start Rehearsal →":
    - /url: /interview
    - img
    - heading "Practice Interview" [level=3]
    - paragraph: Run technical and STAR behavioral practice sessions with transparent, heuristic answer feedback.
    - text: Start Rehearsal →
  - heading "Recent Resumes" [level=2]
  - link "View All →":
    - /url: /history
  - text: No resumes saved yet. Upload one to see it here.
  - link "Upload Resume":
    - /url: /resumes/upload
    - button "Upload Resume"
  - heading "Recent Interview Sessions" [level=2]
  - link "New Simulation →":
    - /url: /interview/new
  - text: No practice sessions yet. Start a simulation to see it here.
  - link "Start Practicing":
    - /url: /interview/new
    - button "Start Practicing"
- button "Star Presets":
  - img
- button "Export":
  - img
- button "Attach File":
  - img
- button "Voice Input":
  - img
- textbox "Describe the resume you want - opens the Template Studio with your prompt..."
- button "Direct Rewrite":
  - img
- button "Run Prompt" [disabled]:
  - img
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
> 38 |     await expect(page.getByPlaceholder(/Ask Placemind AI/)).toBeVisible();
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  39 |   });
  40 | 
  41 |   test('Tab 2 - Template Gallery renders 2x5 grid with ATS badges', async ({ page }) => {
  42 |     await page.goto('/template');
  43 |     await page.waitForLoadState('networkidle');
  44 |     await expect(page.getByText('ATS-Verified Resume Templates')).toBeVisible();
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