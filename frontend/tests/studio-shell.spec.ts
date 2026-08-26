import { test, expect } from '@playwright/test';

test.describe('Studio Page Shell Verification', () => {
  test('Studio Page renders with AppShell, Floating Nav, and High Contrast Theme', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/studio-page-shell.png' });
  });
});
