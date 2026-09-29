import { test, expect } from '@playwright/test';

test.describe('Placemind Internal App & SaaS Navigation Suite', () => {
  test('Landing Page (Untouched) renders flawlessly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Placemind/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Dashboard loads persistent sidebar, quick action cards and stats', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Welcome back, Rohan')).toBeVisible();
    await expect(page.getByText('Upload & Parse Resume')).toBeVisible();
    await expect(page.getByText('Recent Resumes')).toBeVisible();
  });

  test('Resume Upload Wizard supports in-memory parsing checklist', async ({ page }) => {
    await page.goto('/resumes/upload');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Upload & Audit Your Resume')).toBeVisible();
    await expect(page.getByText('Drag and drop your resume PDF here')).toBeVisible();
  });

  test('ATS Gap Analysis renders prominent 89.4% score and gap report', async ({ page }) => {
    await page.goto('/resumes/stripe-staff/analyze');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('89.4%')).toBeVisible();
    await expect(page.getByText('Semantic Coverage')).toBeVisible();
    await expect(page.getByText('Apache Kafka Stream Processing')).toBeVisible();
  });

  test('Resume Editor loads two-pane canvas with inline XYZ rewrites', async ({ page }) => {
    await page.goto('/resumes/stripe-staff/edit');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Experience Optimization Studio')).toBeVisible();
    await expect(page.getByText('Accept & Apply').first()).toBeVisible();
  });

  test('Interview Setup wizard shows detected weak areas and mode toggle', async ({ page }) => {
    await page.goto('/interview/new');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Configure Your Mock Interview')).toBeVisible();
    await expect(page.getByText('Distributed Kafka Systems')).toBeVisible();
  });

  test('Live Interview session minimizes chrome and loads conversational chat', async ({ page }) => {
    await page.goto('/interview/sess-12345');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Placemind Live Session')).toBeVisible();
    await expect(page.getByText('End Session')).toBeVisible();
  });

  test('Interview Report renders multi-dimensional radar chart and review', async ({ page }) => {
    await page.goto('/interview/sess-12345/report');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Overall Interview Score')).toBeVisible();
    await expect(page.getByText('STAR Structure')).toBeVisible();
  });

  test('History archive page renders scannable data table and tabs', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Activity History & Document Archive')).toBeVisible();
    await expect(page.getByText('All Items')).toBeVisible();
  });

  test('Settings page renders AI Engine preference toggle (Local vs Cloud)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('AI Engine Routing & Egress Control')).toBeVisible();
    await expect(page.getByText('Always Use Local LM Studio / Ollama (Zero-Egress)')).toBeVisible();
  });
});
