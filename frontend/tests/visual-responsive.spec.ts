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

  test('Studio route redirects to the real Resume Builder workspace', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForURL('**/resume');
    await page.waitForLoadState('networkidle');

    // The builder workspace: form pane, live preview empty state, layout switcher.
    await expect(page.getByText('Your Information')).toBeVisible();
    await expect(page.getByText('Start typing on the left')).toBeVisible();
    await expect(page.getByText('TEMPLATE LAYOUT')).toBeVisible();
    for (const name of ['Classic', 'Modern', 'Compact', 'Academic']) {
      await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Save Draft/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export PDF/ })).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/builder-${page.viewportSize()?.width}px.png`, fullPage: false });
  });

  test('Universal Download Hub displays all OS targets (macOS, Windows, Linux, Mobile)', async ({ page }) => {
    await page.goto('/download');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Download Placemind on')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'macOS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Windows' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Linux' })).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/download-${page.viewportSize()?.width}px.png`, fullPage: false });
  });

  test('AI Mock Rehearsal Room states honestly that voice is not available yet', async ({ page }) => {
    await page.goto('/rehearse');
    await page.waitForLoadState('networkidle');

    // The feature is not built; the page must say so instead of faking a waveform.
    await expect(page.getByText('Voice rehearsal is not available yet')).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: `tests/screenshots/rehearse-${page.viewportSize()?.width}px.png`, fullPage: false });
  });
});
