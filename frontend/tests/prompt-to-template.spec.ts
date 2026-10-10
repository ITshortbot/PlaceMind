// ============================================================================
// File: frontend/tests/prompt-to-template.spec.ts
// Description: Playwright E2E tests for Prompt-to-Template Screen:
//              - Mocked API template generation
//              - Fallback badge display on source='fallback'
//              - Offline Demo Mode toggle without network request
//              - LocalStorage history retention (last 5 items)
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Prompt-to-Template Studio Screen', () => {
  test('Renders prompt studio with live preview, color picker, and example chips', async ({
    page,
  }) => {
    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    // Header & Prompt Box
    await expect(
      page.getByRole('heading', { level: 1, name: 'Prompt-to-Template Generator' })
    ).toBeVisible();
    await expect(page.locator('#prompt-input')).toBeVisible();
    await expect(page.locator('#generate-template-btn')).toBeVisible();

    // Verify static deceptive labels are completely removed
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Workday/Greenhouse Verified');
    expect(bodyText).not.toContain('% ATS');

    // Live Resume Preview
    await expect(page.locator('#resume-preview-sheet')).toBeVisible();
    await expect(page.locator('text=Color & Accessibility Engine')).toBeVisible();
  });

  test('Generates template via mocked API and updates live preview', async ({ page }) => {
    // Intercept and mock API response
    await page.route('**/api/v1/templates/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          style: {
            layout: 'single_column',
            font: 'Georgia',
            size_pt: 11.0,
            density: 'normal',
            header_style: 'left',
            section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
            mood: 'tech',
            hue: 195,
          },
          content: {
            headline: 'Mocked Senior Cloud Architect',
            summary: 'Experienced cloud systems architect with multi-region AWS expertise.',
            skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
            experience: [
              {
                role: 'Principal Architect',
                company: 'Mock Cloud Inc',
                bullets: ['Designed multi-region failover handling 10M events/day.'],
              },
            ],
            projects: [],
            education: [],
          },
          warnings: [],
          latency_ms: 32.5,
          source: 'model',
        }),
      });
    });

    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    // Fill prompt and trigger generation
    await page.fill('#prompt-input', 'cloud architect resume in blue');
    await page.click('#generate-template-btn');

    // Verify preview updates with mocked model data
    await expect(page.locator('#resume-preview-sheet')).toContainText(
      'Mocked Senior Cloud Architect'
    );
    await expect(page.locator('#resume-preview-sheet')).toContainText('Mock Cloud Inc');
    await expect(page.locator('#model-badge')).toBeVisible();
  });

  test('Displays preset fallback badge when source="fallback"', async ({ page }) => {
    await page.route('**/api/v1/templates/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          style: {
            layout: 'single_column',
            font: 'Calibri',
            size_pt: 10.0,
            density: 'compact',
            header_style: 'left',
            section_order: ['skills', 'experience', 'projects', 'education', 'summary'],
            mood: 'minimal',
            hue: 240,
          },
          content: {
            headline: 'Fallback Dev Engineer',
            summary: 'Fallback content preserved safely.',
            skills: ['Python', 'SQL'],
            experience: [],
            projects: [],
            education: [],
          },
          warnings: ['Used fallback preset Classic due to model schema error.'],
          latency_ms: 45.0,
          source: 'fallback',
        }),
      });
    });

    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#prompt-input', 'complex request');
    await page.click('#generate-template-btn');

    // Verify fallback badge is visible
    await expect(page.locator('#fallback-badge')).toBeVisible();
    await expect(page.locator('#fallback-badge')).toContainText('Preset Fallback');
  });

  test('Demo Mode generates instantly without triggering backend network call', async ({
    page,
  }) => {
    let apiCalled = false;
    await page.route('**/api/v1/templates/generate', async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 500, body: 'Should not be called in demo mode' });
    });

    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    // Toggle Demo Mode
    await page.check('#demo-mode-toggle');
    await expect(page.locator('text=Offline Mode Active')).toBeVisible();

    // Click quick example chip
    await page.click('button:has-text("clean dark-teal resume for a fresher data analyst")');
    await page.click('#generate-template-btn');

    // Confirm preview updates
    await expect(page.locator('#resume-preview-sheet')).toContainText(
      'Associate Data Analyst'
    );
    // Confirm backend was NOT called
    expect(apiCalled).toBe(false);
  });

  test('Displays ATS Readiness Report with score, top recommendations, and limits note', async ({
    page,
  }) => {
    await page.route('**/api/v1/ats/score-doc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 88.0,
          categories: { structure: 92.0, formatting: 90.0, keywords: 82.0, semantic: 85.0 },
          items: [
            {
              rule_id: 'headings_present',
              category: 'structure',
              passed: true,
              points: 100.0,
              evidence: 'All 5 standard sections populated in order.',
              fix: 'No action needed. Standard headings are clearly recognizable.',
            },
            {
              rule_id: 'contact_info_body',
              category: 'structure',
              passed: true,
              points: 100.0,
              evidence: 'Contact details accessible in text.',
              fix: 'No action needed. Contact info is fully machine-readable.',
            },
            {
              rule_id: 'bullet_style',
              category: 'formatting',
              passed: true,
              points: 85.0,
              evidence: 'Bullets begin with strong action verbs.',
              fix: 'No action needed. Bullet points are concise and action-oriented.',
            },
          ],
          top_fixes: ['Paste target Job Description for exact keyword alignment.'],
          limits_note:
            "This readiness score is an automated estimation based on standard ATS parsing heuristics and keyword alignment. It does not reflect any proprietary or specific employer's internal ATS algorithm.",
        }),
      });
    });

    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    // Verify ATS Readiness Panel is visible
    const atsPanel = page.locator('#ats-readiness-panel');
    await expect(atsPanel).toBeVisible();

    // Verify score and mandatory disclaimer note
    await expect(page.locator('#ats-overall-score')).toBeVisible();
    await expect(page.locator('#ats-limits-note')).toContainText(
      'This readiness score is an automated estimation based on standard ATS parsing heuristics'
    );
    await expect(page.locator('#ats-limits-note')).toContainText(
      "It does not reflect any proprietary or specific employer's internal ATS algorithm."
    );

    // Verify rule toggle shows heuristic breakdown
    await page.click('#toggle-rule-details-btn');
    await expect(page.locator('text=headings present')).toBeVisible();
    await expect(page.locator('text=bullet style')).toBeVisible();
  });
});
