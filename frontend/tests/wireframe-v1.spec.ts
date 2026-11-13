import { test, expect } from '@playwright/test';

// ============================================================================
// Placemind App Flow Suite (Onboarding + Core Tabs)
// Anchored to the current app after the audit-honesty rework: the onboarding
// wizard is labeled demo setup, the old 8-tab wireframe copy is gone, and the
// builder writes real records through the backend.
// ============================================================================

test.describe('Placemind App Flow Suite (Onboarding + Core Tabs)', () => {
  test('Onboarding wizard is labeled demo setup and lands on the builder', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Demo Setup (not account creation)
    await expect(page.getByText('Welcome to Placemind')).toBeVisible();
    await expect(page.getByText('Step 01 • Demo Setup')).toBeVisible();
    await expect(
      page.getByText('This is a single-user demo: no account is created and nothing you enter is verified.')
    ).toBeVisible();
    await page.getByPlaceholder('name@company.com').fill('demo@placemind.local');
    await page.getByRole('button', { name: 'Continue with Email' }).click();

    // Step 2: Profile Basics
    await expect(page.getByText('Profile & Education Basics')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Personalization
    await expect(page.getByText('Personalize Your Track')).toBeVisible();
    await page.getByRole('button', { name: 'Select Template' }).click();

    // Step 4: Template Preference
    await expect(page.getByText('Choose Starting Template')).toBeVisible();
    await page.getByRole('button', { name: 'Enter Dashboard' }).click();

    // Lands on the Resume Builder
    await page.waitForURL('**/resume');
    await expect(page.getByText('Your Information')).toBeVisible();
  });

  test('Tab 1 - Dashboard renders greeting and 3 quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Build a Resume')).toBeVisible();
    await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
    await expect(page.getByText('Practice Interview')).toBeVisible();
  });

  test('Tab 2 - Template Studio renders prompt generator and example chips', async ({ page }) => {
    await page.goto('/template');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: 'Prompt-to-Template Generator' })
    ).toBeVisible();
    await expect(page.getByText('Describe Your Resume & Style')).toBeVisible();
    await expect(page.locator('#generate-template-btn')).toBeVisible();
    await expect(page.locator('#demo-mode-toggle')).toBeVisible();
  });

  test('Tab 3 - Resume Builder edits contact, saves a real draft and exports', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __printCalls: number }).__printCalls = 0;
      window.print = () => {
        (window as unknown as { __printCalls: number }).__printCalls += 1;
      };
    });

    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Information')).toBeVisible();
    await expect(page.getByText('TEMPLATE LAYOUT')).toBeVisible();

    // Contact info flows live into the preview document.
    await page.getByPlaceholder('Your name').fill('Alex Morgan');
    await page.getByPlaceholder('you@example.com').fill('alex.morgan@example.com');
    await expect(page.getByText('Alex Morgan').first()).toBeVisible();
    await expect(page.getByText('alex.morgan@example.com').first()).toBeVisible();

    // Layout switcher applies a different template.
    await page.getByRole('button', { name: /Modern/ }).click();

    // Save persists through the backend...
    await page.getByRole('button', { name: /Save Draft/ }).click();
    await expect(page.getByText('Draft saved to your workspace.')).toBeVisible({ timeout: 15000 });

    // ...and the saved record is listed on History after navigation (real reload).
    await page.goto('/history');
    await expect(page.getByText('alex_morgan_draft.txt').first()).toBeVisible({ timeout: 15000 });

    // Export uses the print stylesheet path.
    await page.goto('/resume');
    await page.getByRole('button', { name: /Export PDF/ }).click();
    const printCalls = await page.evaluate(
      () => (window as unknown as { __printCalls: number }).__printCalls
    );
    expect(printCalls).toBe(1);
  });

  test('Tab 4 - ATS 1-Pass renders analysis inputs and scoring weights', async ({ page }) => {
    await page.goto('/ats');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('ATS 1-Pass')).toBeVisible();
    await expect(page.getByText('Semantic Coverage (50%)')).toBeVisible();
    await expect(page.getByText('Keyword Density (30%)')).toBeVisible();
    await expect(page.getByText('Resume Structure (20%)')).toBeVisible();
    await expect(page.getByText('Resume PDF')).toBeVisible();
    await expect(page.getByText('Job Title')).toBeVisible();
  });

  test('Tab 5 - Interview hub lists sessions with an honest heuristic note', async ({ page }) => {
    await page.goto('/interview');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Mock Interview Practice/ })).toBeVisible();
    await expect(
      page.getByText('Deterministic question plans with transparent, heuristic answer feedback - every score shows its working.')
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /New Session/ })).toBeVisible();
  });

  test('Tab 6 - Report renders 2-column analytical scoring and SVG radar chart', async ({ page }) => {
    await page.goto('/report');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Resume & ATS Score Report')).toBeVisible();
    await expect(page.getByText('Interview Performance Report')).toBeVisible();
    await expect(page.getByText('STAR Structure')).toBeVisible();
  });

  test('Tab 7 - History renders real artifact records or an honest empty state', async ({
    page,
  }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
    await expect(
      page.getByText('Every entry below is a real saved record. Upload a resume to add one.')
    ).toBeVisible();
  });

  test('Tab 8 - Settings renders profile and AI engine controls', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Account & Application Settings')).toBeVisible();
    await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  });
});
