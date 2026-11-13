# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-responsive.spec.ts >> Placemind Visual & Responsive Suite >> Studio Interior Workspace loads all 3 panels and template switchers
- Location: tests/visual-responsive.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Placemind Studio')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Placemind Studio')

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
  - text: Resume Builder
  - button "Save Draft":
    - img
    - text: Save Draft
  - button "Export PDF":
    - img
    - text: Export PDF
- complementary:
  - heading "Your Information" [level=3]
  - text: Full Name
  - textbox "Your name"
  - text: Target Title
  - textbox "e.g. Backend Engineer"
  - text: Email
  - textbox "you@example.com"
  - text: Phone
  - textbox "Optional"
  - text: Professional Summary
  - textbox "2-3 sentences about your experience"
  - text: Skills (comma separated)
  - textbox "Python, FastAPI, PostgreSQL"
  - heading "Most Recent Role" [level=4]
  - text: Role
  - textbox "e.g. Backend Engineer"
  - text: Company
  - textbox "Employer name"
  - text: Achievement Bullets (one per line)
  - textbox "Built FastAPI services serving 2M requests/day Cut p95 latency from 800ms to 240ms":
    - /placeholder: "Built FastAPI services serving 2M requests/day\nCut p95 latency from 800ms to 240ms"
  - heading "Education" [level=4]
  - text: Degree
  - textbox "e.g. B.Tech Computer Science"
  - text: Institution
  - textbox "University name"
  - text: Year
  - textbox "e.g. 2023"
- main:
  - img
  - paragraph: Start typing on the left
  - paragraph: Your own content renders here live in the selected template. Nothing is pre-filled and nothing is invented - what you type is exactly what exports.
- complementary:
  - text: Template Layout
  - button "Classic Times 11pt"
  - button "Modern Arial 11pt"
  - button "Compact Calibri 10pt"
  - button "Academic Georgia 11pt"
  - paragraph: Layouts are rendered live with WCAG-checked palettes. Use Analyze to score a saved resume against a job description.
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
  3  | test.describe('Placemind Visual & Responsive Suite', () => {
  4  |   test('Landing Page renders flawlessly with zero horizontal overflow', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('networkidle');
  7  | 
  8  |     // Verify Title and Core Header
  9  |     await expect(page).toHaveTitle(/Placemind/);
  10 |     await expect(page.locator('h1')).toBeVisible();
  11 | 
  12 |     // Verify Horizontal Overflow (Page width must match client width)
  13 |     const hasHorizontalScroll = await page.evaluate(() => {
  14 |       return document.documentElement.scrollWidth > window.innerWidth;
  15 |     });
  16 |     expect(hasHorizontalScroll).toBeFalsy();
  17 | 
  18 |     // Capture screenshot
  19 |     await page.screenshot({ path: `tests/screenshots/landing-${page.viewportSize()?.width}px.png`, fullPage: false });
  20 |   });
  21 | 
  22 |   test('Studio Interior Workspace loads all 3 panels and template switchers', async ({ page }) => {
  23 |     await page.goto('/studio');
  24 |     await page.waitForLoadState('networkidle');
  25 | 
  26 |     // Verify Studio Title and Panels
> 27 |     await expect(page.getByText('Placemind Studio')).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  28 |     await expect(page.getByText('ATS Audit Score')).toBeVisible();
  29 |     await expect(page.getByText('Target Job Criteria')).toBeVisible();
  30 | 
  31 |     // Capture screenshot
  32 |     await page.screenshot({ path: `tests/screenshots/studio-${page.viewportSize()?.width}px.png`, fullPage: false });
  33 |   });
  34 | 
  35 |   test('Universal Download Hub displays all OS targets (macOS, Windows, Linux, Mobile)', async ({ page }) => {
  36 |     await page.goto('/download');
  37 |     await page.waitForLoadState('networkidle');
  38 | 
  39 |     await expect(page.getByText('Download Placemind on')).toBeVisible();
  40 |     await expect(page.getByRole('heading', { name: 'macOS' })).toBeVisible();
  41 |     await expect(page.getByRole('heading', { name: 'Windows' })).toBeVisible();
  42 |     await expect(page.getByRole('heading', { name: 'Linux' })).toBeVisible();
  43 | 
  44 |     // Capture screenshot
  45 |     await page.screenshot({ path: `tests/screenshots/download-${page.viewportSize()?.width}px.png`, fullPage: false });
  46 |   });
  47 | 
  48 |   test('AI Mock Rehearsal Room renders waveform visualizer and question probes', async ({ page }) => {
  49 |     await page.goto('/rehearse');
  50 |     await page.waitForLoadState('networkidle');
  51 | 
  52 |     await expect(page.getByText('AI Technical Phone Screen Rehearsal')).toBeVisible();
  53 |     await expect(page.getByText('Listening to speech...')).toBeVisible();
  54 | 
  55 |     // Capture screenshot
  56 |     await page.screenshot({ path: `tests/screenshots/rehearse-${page.viewportSize()?.width}px.png`, fullPage: false });
  57 |   });
  58 | });
  59 | 
```