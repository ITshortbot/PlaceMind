# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-responsive.spec.ts >> Placemind Visual & Responsive Suite >> AI Mock Rehearsal Room renders waveform visualizer and question probes
- Location: tests/visual-responsive.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('AI Technical Phone Screen Rehearsal')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('AI Technical Phone Screen Rehearsal')

```

```yaml
- img
- heading "Voice rehearsal is not available yet" [level=1]
- paragraph: Speech capture and playback are not wired in this build. The working practice flow is text-based, with deterministic questions and transparent heuristic feedback.
- link "Start a text practice session":
  - /url: /interview/new
  - button "Start a text practice session":
    - img
    - text: Start a text practice session
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
  27 |     await expect(page.getByText('Placemind Studio')).toBeVisible();
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
> 52 |     await expect(page.getByText('AI Technical Phone Screen Rehearsal')).toBeVisible();
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
  53 |     await expect(page.getByText('Listening to speech...')).toBeVisible();
  54 | 
  55 |     // Capture screenshot
  56 |     await page.screenshot({ path: `tests/screenshots/rehearse-${page.viewportSize()?.width}px.png`, fullPage: false });
  57 |   });
  58 | });
  59 | 
```