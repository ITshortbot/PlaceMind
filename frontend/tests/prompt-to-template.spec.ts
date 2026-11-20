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
    let generationRequests = 0;
    await page.route('**/api/v1/templates/generate', async (route) => {
      generationRequests += 1;
      await route.abort();
    });
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
    await expect(page.locator('#use-in-builder-btn')).toBeDisabled();

    await page.fill('#prompt-input', '   ');
    await page.click('#generate-template-btn');
    await expect(page.getByText('Enter a resume prompt before generating.')).toBeVisible();
    expect(generationRequests).toBe(0);
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

  test('Resume Builder prompt carries facts through selected-provider generation into preview and PDF', async ({
    page,
  }) => {
    let generationPayload: {
      prompt?: string;
      routing_mode?: string;
      resume_id?: string;
      facts?: {
        name?: string;
        contact?: string;
        summary?: string;
        skills?: string[];
        experience?: Array<{ role: string; company?: string; bullets: string[] }>;
      };
      api_key?: string;
    } | null = null;
    let chatRequests = 0;
    let generationRequests = 0;

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/api/v1/auth/guest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'playwright-guest',
          email: null,
          full_name: null,
          avatar_url: null,
          is_guest: true,
        }),
      });
    });
    await page.route('**/api/v1/chat', async (route) => {
      chatRequests += 1;
      await route.fulfill({ status: 503, body: 'Resume generation must not use chat' });
    });
    await page.route('**/api/v1/templates/generate', async (route) => {
      generationRequests += 1;
      generationPayload = route.request().postDataJSON() as typeof generationPayload;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          style: {
            layout: 'single_column',
            font: 'Arial',
            size_pt: 11,
            density: 'normal',
            header_style: 'left',
            section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
            mood: 'tech',
            hue: 195,
          },
          content: {
            name: 'Jordan Lee',
            contact: 'jordan@example.test',
            headline: 'Junior Data Analyst',
            summary: 'Statistics graduate with Python and SQL experience.',
            skills: ['Python', 'SQL'],
            experience: [
              {
                role: 'Research Assistant',
                company: 'Example Lab',
                bullets: ['Cleaned survey data using Python.'],
              },
            ],
            projects: [],
            education: [],
          },
          warnings: [],
          latency_ms: 18,
          source: 'model',
          facts_used: true,
        }),
      });
    });
    await page.route('**/api/v1/ats/score-doc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 80,
          categories: { structure: 80, formatting: 80, keywords: 80, semantic: 80 },
          items: [],
          top_fixes: [],
          limits_note: 'Automated readiness check.',
        }),
      });
    });

    await page.goto('/resume');
    await page.getByPlaceholder('Your name').fill('Jordan Lee');
    await page.getByPlaceholder('e.g. Backend Engineer').nth(0).fill('Junior Data Analyst');
    await page.getByPlaceholder('you@example.com').fill('jordan@example.test');
    await page
      .getByPlaceholder('2-3 sentences about your experience')
      .fill('Statistics graduate with Python and SQL experience.');
    await page.getByPlaceholder('Python, FastAPI, PostgreSQL').fill('Python, SQL');
    await page.getByPlaceholder('e.g. Backend Engineer').nth(1).fill('Research Assistant');
    await page.getByPlaceholder('Employer name').first().fill('Example Lab');
    await page
      .getByPlaceholder(/Built FastAPI services serving 2M requests/)
      .fill('Cleaned survey data using Python.');
    await page.getByRole('button').filter({ hasText: 'Modern' }).click();

    const command = 'Create a junior data analyst resume using only my information';
    await page.getByPlaceholder('Describe the resume you want').fill(command);
    await page.getByRole('button', { name: 'Run Prompt' }).click();
    await page.waitForURL('**/template**');
    await expect(page.locator('#prompt-input')).toHaveValue(command);
    await expect(page.locator('#template-provider')).toHaveValue('ollama');
    await expect(
      page.getByText(/Select a provider, then click Generate Resume to start the AI request/)
    ).toBeVisible();
    expect(chatRequests).toBe(0);
    expect(generationRequests).toBe(0);

    await page.selectOption('#template-provider', 'cloud');
    await page.click('#generate-template-btn');
    await expect(page.locator('#resume-preview-sheet')).toContainText('Junior Data Analyst');
    await expect(page.locator('#model-badge')).toBeVisible();

    expect(generationPayload?.prompt).toBe(command);
    expect(generationPayload?.routing_mode).toBe('cloud');
    expect(generationPayload?.resume_id).toBeUndefined();
    expect(generationPayload?.facts?.name).toBe('Jordan Lee');
    expect(generationPayload?.facts?.summary).toBe(
      'Statistics graduate with Python and SQL experience.'
    );
    expect(generationPayload?.facts?.skills).toEqual(['Python', 'SQL']);
    expect(generationPayload?.facts?.experience?.[0]).toMatchObject({
      role: 'Research Assistant',
      company: 'Example Lab',
      bullets: ['Cleaned survey data using Python.'],
    });
    expect(generationPayload?.api_key).toBeUndefined();
    expect(chatRequests).toBe(0);

    page.on('dialog', (dialog) => dialog.accept());
    await page.click('#use-in-builder-btn');
    await page.waitForURL('**/resume');
    await expect(page.getByPlaceholder('Your name')).toHaveValue('Jordan Lee');
    await expect(page.getByPlaceholder('2-3 sentences about your experience')).toHaveValue(
      'Statistics graduate with Python and SQL experience.'
    );
    await expect(page.locator('#resume-preview-sheet')).toContainText('Junior Data Analyst');
    await expect(
      page.getByRole('button').filter({ hasText: 'Modern' }).first()
    ).toHaveClass(/border-\[#6C5CE7\]/);

    const pdf = await page.pdf({ format: 'A4' });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
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

    // Verify the honest fallback badge: preset layout with sample content, not a model result
    await expect(page.locator('#fallback-badge')).toBeVisible();
    await expect(page.locator('#fallback-badge')).toContainText('Preset layout');
    await expect(page.locator('#fallback-badge')).toHaveAttribute(
      'title',
      /No live model is configured/
    );
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

  test('Displays honest error when ATS scoring backend is unreachable', async ({ page }) => {
    await page.route('**/api/v1/ats/score-doc', async (route) => {
      await route.fulfill({ status: 500, body: 'backend down' });
    });

    await page.goto('/template');
    await page.waitForLoadState('domcontentloaded');

    // Generate in demo mode; the deterministic ATS audit then fails honestly.
    await page.check('#demo-mode-toggle');
    await page.click('button:has-text("clean dark-teal resume for a fresher data analyst")');
    await page.click('#generate-template-btn');

    await expect(
      page.getByText(
        'ATS readiness service is unreachable. Start the backend and retry - no score was computed.'
      )
    ).toBeVisible({ timeout: 15000 });
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

    // Generate a demo resume; the deterministic readiness audit runs against it.
    await page.check('#demo-mode-toggle');
    await page.click('button:has-text("clean dark-teal resume for a fresher data analyst")');
    await page.click('#generate-template-btn');

    // Verify score and mandatory disclaimer note
    await expect(page.locator('#ats-overall-score')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#ats-overall-score')).toContainText('88/100');
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
