import { test, expect } from '@playwright/test';

test.describe('Placemind Visual Screenshot Capture (Wireframe v1 Alignment)', () => {
  test('Capture Onboarding and 8 Flat Tabs', async ({ page }) => {
    // 1. Onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-onboarding.png' });

    // 2. Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab1-dashboard.png' });

    // 3. Template
    await page.goto('/template');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab2-template.png' });

    // 4. Resume
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab3-resume.png' });

    // 5. ATS
    await page.goto('/ats');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab4-ats.png' });

    // 6. Interview
    await page.goto('/interview');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab5-interview.png' });

    // 7. Report
    await page.goto('/report');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab6-report.png' });

    // 8. History
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab7-history.png' });

    // 9. Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/wireframe-tab8-settings.png' });
  });
});
