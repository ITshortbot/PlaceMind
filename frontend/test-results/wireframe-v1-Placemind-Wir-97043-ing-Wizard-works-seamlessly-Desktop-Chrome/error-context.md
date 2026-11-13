# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wireframe-v1.spec.ts >> Placemind Wireframe v1 Suite (Onboarding + 8 Flat Tabs) >> Step 1-4 Onboarding Wizard works seamlessly
- Location: tests/wireframe-v1.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
  navigated to "http://localhost:3005/resume"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "P" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
          - button "Search Pages & Actions (Cmd+K)" [ref=e9] [cursor=pointer]
        - navigation [ref=e13]:
          - link [ref=e15] [cursor=pointer]:
            - /url: /dashboard
          - link [ref=e22] [cursor=pointer]:
            - /url: /template
          - link [ref=e29] [cursor=pointer]:
            - /url: /resume
          - link [ref=e34] [cursor=pointer]:
            - /url: /resume
          - link [ref=e40] [cursor=pointer]:
            - /url: /ats
          - link [ref=e46] [cursor=pointer]:
            - /url: /resumes/upload
          - link [ref=e51] [cursor=pointer]:
            - /url: /interview
          - link [ref=e56] [cursor=pointer]:
            - /url: /report
          - link [ref=e60] [cursor=pointer]:
            - /url: /history
          - link [ref=e66] [cursor=pointer]:
            - /url: /settings
        - button "Toggle Theme" [ref=e71] [cursor=pointer]
    - generic [ref=e74]:
      - banner [ref=e75]:
        - generic [ref=e77]:
          - link "Dashboard" [ref=e78] [cursor=pointer]:
            - /url: /dashboard
          - generic [ref=e81]: Resume Builder
        - generic [ref=e83]:
          - button "Save Draft" [ref=e84] [cursor=pointer]
          - button "Export PDF" [ref=e86] [cursor=pointer]
      - generic [ref=e88]:
        - complementary [ref=e89]:
          - heading "Your Information" [level=3] [ref=e90]
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: Full Name
              - textbox "Your name" [ref=e94]
            - generic [ref=e95]:
              - generic [ref=e96]: Target Title
              - textbox "e.g. Backend Engineer" [ref=e97]
            - generic [ref=e98]:
              - generic [ref=e99]: Email
              - textbox "you@example.com" [ref=e100]
            - generic [ref=e101]:
              - generic [ref=e102]: Phone
              - textbox "Optional" [ref=e103]
            - generic [ref=e104]:
              - generic [ref=e105]: Professional Summary
              - textbox "2-3 sentences about your experience" [ref=e106]
            - generic [ref=e107]:
              - generic [ref=e108]: Skills (comma separated)
              - textbox "Python, FastAPI, PostgreSQL" [ref=e109]
          - generic [ref=e111]:
            - heading "Most Recent Role" [level=4] [ref=e112]
            - generic [ref=e113]:
              - generic [ref=e114]: Role
              - textbox "e.g. Backend Engineer" [ref=e115]
            - generic [ref=e116]:
              - generic [ref=e117]: Company
              - textbox "Employer name" [ref=e118]
            - generic [ref=e119]:
              - generic [ref=e120]: Achievement Bullets (one per line)
              - textbox "Built FastAPI services serving 2M requests/day Cut p95 latency from 800ms to 240ms" [ref=e121]:
                - /placeholder: "Built FastAPI services serving 2M requests/day\nCut p95 latency from 800ms to 240ms"
          - generic [ref=e123]:
            - heading "Education" [level=4] [ref=e124]
            - generic [ref=e125]:
              - generic [ref=e126]: Degree
              - textbox "e.g. B.Tech Computer Science" [ref=e127]
            - generic [ref=e128]:
              - generic [ref=e129]: Institution
              - textbox "University name" [ref=e130]
            - generic [ref=e131]:
              - generic [ref=e132]: Year
              - textbox "e.g. 2023" [ref=e133]
        - main [ref=e134]:
          - generic [ref=e135]:
            - paragraph [ref=e139]: Start typing on the left
            - paragraph [ref=e140]: Your own content renders here live in the selected template. Nothing is pre-filled and nothing is invented - what you type is exactly what exports.
        - complementary [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]: Template Layout
            - generic [ref=e144]:
              - button "Classic Times 11pt" [ref=e145] [cursor=pointer]:
                - generic [ref=e146]: Classic
                - generic [ref=e147]: Times 11pt
              - button "Modern Arial 11pt" [ref=e148] [cursor=pointer]:
                - generic [ref=e149]: Modern
                - generic [ref=e150]: Arial 11pt
              - button "Compact Calibri 10pt" [ref=e151] [cursor=pointer]:
                - generic [ref=e152]: Compact
                - generic [ref=e153]: Calibri 10pt
              - button "Academic Georgia 11pt" [ref=e154] [cursor=pointer]:
                - generic [ref=e155]: Academic
                - generic [ref=e156]: Georgia 11pt
            - paragraph [ref=e157]: Layouts are rendered live with WCAG-checked palettes. Use Analyze to score a saved resume against a job description.
      - generic [ref=e159]:
        - generic [ref=e160]:
          - button "Star Presets" [ref=e161] [cursor=pointer]
          - button "Export" [ref=e164] [cursor=pointer]
          - button "Attach File" [ref=e168] [cursor=pointer]
        - generic [ref=e172]:
          - button "Voice Input" [ref=e173] [cursor=pointer]
          - textbox "Describe the resume you want - opens the Template Studio with your prompt..." [ref=e177]
        - generic [ref=e178]:
          - button "Direct Rewrite" [ref=e179] [cursor=pointer]
          - button "Run Prompt" [disabled] [ref=e183] [cursor=pointer]
  - alert [ref=e187]
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
> 28 |     await page.waitForURL('**/dashboard');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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