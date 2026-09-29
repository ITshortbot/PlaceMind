import { test, expect } from '@playwright/test';

test.describe('Hover Extension Test', () => {
  test('Hovering an item extends frosted yellow box', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Hover the "Templates" nav icon
    const templateNav = page.locator('aside a[href="/template"]').first();
    await templateNav.hover();
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'tests/screenshots/floating-nav-hover-yellow.png' });
  });
});
