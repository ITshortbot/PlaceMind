import { test, expect } from '@playwright/test';

test.describe('Placemind Wireframe v1 Suite (Onboarding + 8 Flat Tabs)', () => {
  test('Step 1-4 Onboarding Wizard works seamlessly', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Auth
    await expect(page.getByText('Welcome to Placemind')).toBeVisible();
    await expect(page.getByText('Continue with LinkedIn')).toBeVisible();
    await page.click('button:has-text("Continue with LinkedIn")');

    // Step 2: Profile Basics
    await expect(page.getByText('Profile & Education Basics')).toBeVisible();
    await expect(page.locator('input').filter({ hasText: '' }).first()).toBeVisible();
    await page.click('button:has-text("Continue")');

    // Step 3: Personalization
    await expect(page.getByText('Personalize Your Track')).toBeVisible();
    await page.click('button:has-text("Select Template")');

    // Step 4: Template Preference
    await expect(page.getByText('Choose Starting Template')).toBeVisible();
    await expect(page.getByText('Auto-Select According to Company ATS')).toBeVisible();
    await page.click('button:has-text("Enter Dashboard")');

    // Land on Dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Welcome back, Rohan')).toBeVisible();
  });

  test('Tab 1 - Dashboard renders greeting, 3 quick actions, and AI command bar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Build a Resume')).toBeVisible();
    await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
    await expect(page.getByText('Practice Interview')).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Placemind AI/)).toBeVisible();
  });

  test('Tab 2 - Template Gallery renders 2x5 grid with ATS badges', async ({ page }) => {
    await page.goto('/template');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('ATS-Verified Resume Templates')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Use Template' }).first()).toBeVisible();
  });

  test('Tab 3 - Resume renders 3-column layout and physical hero document preview', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Information')).toBeVisible();
    await expect(page.getByText('Quick Template Switcher')).toBeVisible();
    await expect(page.getByText('Google XYZ Metric Optimization')).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Placemind AI/)).toBeVisible();
  });

  test('Tab 4 - ATS Auto-Generate allows 1-pass synthesis', async ({ page }) => {
    await page.goto('/ats');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Auto-Generate Tailored ATS Resume')).toBeVisible();
    await expect(page.getByRole('button', { name: /Auto-Generate Resume/ })).toBeVisible();
  });

  test('Tab 5 - Interview renders split setup and live conversation', async ({ page }) => {
    await page.goto('/interview');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Interview Setup')).toBeVisible();
    await expect(page.getByText('Real Recruiter')).toBeVisible();
    await expect(page.getByText('AI Practice')).toBeVisible();
  });

  test('Tab 6 - Report renders 2-column analytical scoring and SVG radar chart', async ({ page }) => {
    await page.goto('/report');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Resume & ATS Score Report')).toBeVisible();
    await expect(page.getByText('Interview Performance Report')).toBeVisible();
    await expect(page.getByText('STAR Structure')).toBeVisible();
  });

  test('Tab 7 - History renders chronological artifact cards', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open in Editor' }).first()).toBeVisible();
  });

  test('Tab 8 - Settings renders profile and AI engine controls', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Account & Application Settings')).toBeVisible();
    await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  });
});
