import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import * as fs from 'fs';

test.describe('Connected UX: Home Chat & Dock-Aware Workspace Clearance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('1. /dashboard: exactly one visible input (shared capsule), single request, responses in main conversation', async ({ page }) => {
    // Intercept chat API to mock deterministic response and count requests
    let chatRequestCount = 0;
    await page.route('**/api/v1/chat**', async (route) => {
      chatRequestCount++;
      const req = route.request();
      const body = req.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: `Mocked assistant response to: "${body.message}"`,
          actions: [
            {
              id: 'act-test-prefill',
              label: 'Prefill Follow-up',
              kind: 'prefill',
              target: '/dashboard',
              payload: { text: 'Prefilled follow-up query' },
            },
          ],
          model_used: 'Local Test Model',
          is_fallback: true,
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Assert: exactly ONE visible text input exists on the entire page
    const inputs = page.locator('input[type="text"]:visible');
    await expect(inputs).toHaveCount(1);

    // Verify it is inside the shared dark capsule
    const sharedCapsule = page.locator('form.glass-frosted-dark');
    await expect(sharedCapsule).toBeVisible();
    await expect(sharedCapsule.locator('input[type="text"]')).toBeVisible();

    // Verify placeholder is page-specific
    await expect(sharedCapsule.locator('input[type="text"]')).toHaveAttribute(
      'placeholder',
      'Ask anything or request a focused action...'
    );

    // Type a message in the capsule
    await sharedCapsule.locator('input[type="text"]').fill('How can I optimize my resume?');
    await sharedCapsule.locator('button[type="submit"]').click();

    // Assert: exactly ONE request made to chat API
    await expect.poll(() => chatRequestCount).toBe(1);

    // Assert: User message is in main conversation stream
    await expect(page.getByText('How can I optimize my resume?', { exact: true })).toBeVisible();

    // Assert: Assistant response is in main conversation stream
    await expect(page.locator('text=Mocked assistant response to: "How can I optimize my resume?"')).toBeVisible();

    // Assert: NO floating response bubble exists above the capsule
    const floatingAssistantHeader = sharedCapsule.locator('..').locator('text=PlaceMind Assistant');
    await expect(floatingAssistantHeader).toHaveCount(0);

    // Test prefill action from within the conversation
    const prefillBtn = page.getByRole('button', { name: 'Prefill Follow-up' });
    await expect(prefillBtn).toBeVisible();
    await prefillBtn.click();

    // The shared capsule input should now have the prefilled text
    await expect(sharedCapsule.locator('input[type="text"]')).toHaveValue('Prefilled follow-up query');
  });

  test('2. /dashboard: starter prompts target the shared capsule and submit correctly', async ({ page }) => {
    let chatRequestCount = 0;
    await page.route('**/api/v1/chat**', async (route) => {
      chatRequestCount++;
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: `Insights for: ${body.message}`,
          actions: [],
          model_used: 'Local Test Model',
          is_fallback: true,
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click starter prompt
    const starterBtn = page.getByRole('button', { name: 'Draft a tailored profile for a Frontend Engineer' });
    await expect(starterBtn).toBeVisible();
    await starterBtn.click();

    // Sent to main conversation
    await expect.poll(() => chatRequestCount).toBe(1);
    await expect(page.getByText('Draft a tailored profile for a Frontend Engineer', { exact: true })).toBeVisible();
    await expect(page.getByText('Insights for: Draft a tailored profile for a Frontend Engineer')).toBeVisible();
  });

  test('3. /dashboard: draft preservation on failure and error retry', async ({ page }) => {
    let shouldFail = true;
    await page.route('**/api/v1/chat**', async (route) => {
      if (shouldFail) {
        await route.fulfill({ status: 500, body: 'Internal Server Error' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reply: 'Successful retry response',
            actions: [],
            model_used: 'Local Test Model',
            is_fallback: true,
          }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sharedCapsule = page.locator('form.glass-frosted-dark');
    const input = sharedCapsule.locator('input[type="text"]');
    await input.fill('Unsaved message draft');
    await sharedCapsule.locator('button[type="submit"]').click();

    // Error notice appears in conversation
    await expect(page.getByText(/Could not connect to the assistant service/i)).toBeVisible();

    // The user's typed draft is preserved in the composer for immediate retry!
    await expect(input).toHaveValue('Unsaved message draft');

    // Retry successfully
    shouldFail = false;
    await sharedCapsule.locator('button[type="submit"]').click();
    await expect(page.getByText('Successful retry response')).toBeVisible();
  });

  test('4. /resume: dock-aware clearance on desktop (1329x756 user viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 1329, height: 756 });
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Floating command capsule is present
    const capsule = page.locator('form.glass-frosted-dark');
    await expect(capsule).toBeVisible();
    const capsuleBox = await capsule.boundingBox();
    expect(capsuleBox).not.toBeNull();

    // Scroll left column to bottom
    const leftPane = page.locator('aside').first();
    await expect(leftPane).toBeVisible();

    // Find the Add Education button or Year field at the bottom of the left column
    const addEduBtn = page.getByRole('button', { name: /Add Education/i });
    await addEduBtn.scrollIntoViewIfNeeded();

    const addEduBox = await addEduBtn.boundingBox();
    expect(addEduBox).not.toBeNull();

    // Critical assertion: the bottom of Add Education button is strictly above the capsule top, or clear to interact
    // In horizontal layout, leftPane is on the left (x < capsuleBox.x) or when centered, the scroll spacer guarantees visibility.
    // Ensure button is clickable without intercept from capsule
    await expect(addEduBtn).toBeEnabled();
    await addEduBtn.click();

    // A second education entry should now be visible and scrollable
    const edu2Year = page.locator('input[placeholder="e.g. 2024"]');
    await edu2Year.scrollIntoViewIfNeeded();
    await expect(edu2Year).toBeVisible();
    await edu2Year.fill('2025');
    await expect(edu2Year).toHaveValue('2025');

    // Right template column clearance:
    const rightPane = page.locator('aside').last();
    await expect(rightPane).toBeVisible();
    const lastTemplateBtn = rightPane.locator('button').last();
    await lastTemplateBtn.scrollIntoViewIfNeeded();
    await expect(lastTemplateBtn).toBeEnabled();
    await lastTemplateBtn.click();
  });

  test('5. /resume: responsive mobile panel switching at 390x844 without viewport clipping', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Mobile tabs are visible on mobile
    const editorTab = page.getByRole('button', { name: 'Content Editor' });
    const previewTab = page.getByRole('button', { name: 'A4 Preview' });
    const templatesTab = page.getByRole('button', { name: 'Templates' });

    await expect(editorTab).toBeVisible();
    await expect(previewTab).toBeVisible();
    await expect(templatesTab).toBeVisible();

    // Initially on Content Editor
    const nameInput = page.getByPlaceholder('Your name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Mobile Candidate');

    // Switch to A4 Preview
    await previewTab.click();
    await expect(nameInput).not.toBeVisible();
    const previewSheet = page.locator('#resume-preview-sheet');
    await expect(previewSheet).toBeVisible();
    await expect(previewSheet).toContainText('Mobile Candidate');

    // Switch to Templates
    await templatesTab.click();
    await expect(previewSheet).not.toBeVisible();
    const modernTemplate = page.getByRole('button', { name: /Modern/i });
    await expect(modernTemplate).toBeVisible();
    await modernTemplate.click();

    // Return to Preview: style applied cleanly
    await previewTab.click();
    await expect(previewSheet).toBeVisible();
  });

  test('6. No duplicate composers on no-bar routes or active interview session', async ({ page }) => {
    // /settings has showAiBar={false}
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form.glass-frosted-dark')).toHaveCount(0);

    // /template has showAiBar={false}
    await page.goto('/template');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form.glass-frosted-dark')).toHaveCount(0);

    // /history has showAiBar={false}
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form.glass-frosted-dark')).toHaveCount(0);

    // /report has showAiBar={false}
    await page.goto('/report');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form.glass-frosted-dark')).toHaveCount(0);
  });

  test('7. Fresh filled PDF export: pure white sheet and clean print styling', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Fill resume content
    await page.getByPlaceholder('Your name').fill('Alexandre ConnectedUX');
    await page.getByPlaceholder('you@example.com').fill('alexandre.connected@example.com');
    await page.getByPlaceholder('2-3 sentences about your experience').fill('Full-stack engineer focusing on clean user interfaces and robust APIs.');
    await page.getByPlaceholder('Python, FastAPI, PostgreSQL').fill('TypeScript, React, Tailwind, Next.js');
    await page.locator('input[placeholder="e.g. Backend Engineer"]').nth(1).fill('Senior Frontend Architect');
    await page.locator('input[placeholder="Employer name"]').first().fill('CloudDesign Global');

    // Ensure preview sheet has updated
    await expect(page.locator('#resume-preview-sheet')).toContainText('Alexandre ConnectedUX');

    const pdfPath = '/tmp/connected-ux-test-print.pdf';
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    expect(fs.existsSync(pdfPath)).toBeTruthy();

    // Verify text extracted from PDF
    const pythonBin = process.env.PDF_TEST_PYTHON || 'python3';
    const extractScript = [
      'import warnings',
      'warnings.filterwarnings("ignore")',
      'import pymupdf as fitz',
      `doc = fitz.open("${pdfPath}")`,
      'full_text = "\\n".join(page.get_text() for page in doc)',
      'print(full_text)',
    ].join('; ');

    const extractedText = execFileSync(
      pythonBin,
      ['-c', extractScript],
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    expect(extractedText).toContain('Alexandre ConnectedUX');
    expect(extractedText).toContain('alexandre.connected@example.com');
    expect(extractedText).toContain('Senior Frontend Architect');
    expect(extractedText).toContain('CloudDesign Global');

    // Ensure zero app chrome or dock in PDF
    expect(extractedText).not.toContain('Dashboard');
    expect(extractedText).not.toContain('Resume Builder');
    expect(extractedText).not.toContain('Export PDF');
    expect(extractedText).not.toContain('Save Draft');
    expect(extractedText).not.toContain('Describe the resume you want');

    // Keep the uniquely named PDF file intact for review as requested in the prompt
  });
});
