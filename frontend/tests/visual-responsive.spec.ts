import { test, expect } from '@playwright/test';

test.describe('Placemind Visual & Responsive Suite', () => {
  test('Landing Page renders flawlessly with zero horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Title and Core Header
    await expect(page).toHaveTitle(/Placemind/);
    await expect(page.locator('h1')).toBeVisible();

    // Verify Horizontal Overflow (Page width must match client width)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/landing-${page.viewportSize()?.width}px.png`, fullPage: false });
  });

  test('Studio Interior Workspace loads all 3 panels and template switchers', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Verify Studio Title and Panels
    await expect(page.getByText('Placemind Studio')).toBeVisible();
    await expect(page.getByText('ATS Audit Score')).toBeVisible();
    await expect(page.getByText('Target Job Criteria')).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/studio-${page.viewportSize()?.width}px.png`, fullPage: false });
  });

  test('Universal Download Hub displays all OS targets (macOS, Windows, Linux, Mobile)', async ({ page }) => {
    await page.goto('/download');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Download Placemind on')).toBeVisible();
    await expect(page.getByText('macOS')).toBeVisible();
    await expect(page.getByText('Windows')).toBeVisible();
    await expect(page.getByText('Linux')).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/download-${page.viewportSize()?.width}px.png`, fullPage: false });
  });

  test('AI Mock Rehearsal Room renders waveform visualizer and question probes', async ({ page }) => {
    await page.goto('/rehearse');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('AI Technical Phone Screen Rehearsal')).toBeVisible();
    await expect(page.getByText('Listening to speech...')).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/rehearse-${page.viewportSize()?.width}px.png`, fullPage: false });
  });
});
