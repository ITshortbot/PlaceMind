import { test, expect, request as pwRequest } from '@playwright/test';

// ============================================================================
// File: frontend/tests/truthfulness-fixes.spec.ts
// Description: Focused regression tests for UI truthfulness fixes (Fixes 1 - 6):
//              - Truthful rewrites heading in ATS
//              - Interview hydration only rendering asked turns + single active question
//              - Report grouping follow-up probes under parent question
//              - Ambiguous send failure reconciliation & completion progress
//              - 320px / 390px TopBar action row adaptability
//              - Humanized missing facts labels in resume builder
// ============================================================================

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

test.describe('UI Truthfulness Fixes Suite', () => {
  test('Fix 1: ATS page renders neutral "Suggested Resume Improvements" heading without false AI claims', async ({
    page,
  }) => {
    test.setTimeout(180000);
    const { execFileSync } = await import('node:child_process');
    const pdfPath = '/tmp/pw-ats-synthetic.pdf';
    const pdfScript = [
      'import fitz',
      'doc = fitz.open()',
      'page = doc.new_page()',
      'text = "\\n".join([',
      '  "Alex Morgan",',
      '  "alex.morgan@example.com | +1 555 010 2030",',
      '  "",',
      '  "SUMMARY",',
      '  "Backend engineer with 5 years building payments APIs.",',
      '  "",',
      '  "EXPERIENCE",',
      '  "Senior Backend Engineer, FinCore, 2021-2026",',
      '  "- Built Kafka stream processing pipeline handling 2M events/day.",',
      '  "- Cut API p95 latency by 40% with Redis caching.",',
      '  "",',
      '  "SKILLS",',
      '  "Python, FastAPI, PostgreSQL, Redis, Kafka, Docker",',
      '  "",',
      '  "EDUCATION",',
      '  "B.S. Computer Science, State University, 2020",',
      '])',
      'page.insert_text((72, 72), text, fontsize=11)',
      'doc.save("/tmp/pw-ats-synthetic.pdf")',
    ].join('\n');
    execFileSync('python', ['-c', pdfScript]);

    await page.goto('/ats');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await page.getByPlaceholder('e.g. Senior Frontend Engineer at Stripe').fill('Backend Engineer');
    await page.getByPlaceholder('Paste job posting text here...').fill(
      'We are hiring a Backend Engineer to build FastAPI services on PostgreSQL and Redis, ' +
        'with Kafka event pipelines and Docker-based deployments.'
    );
    await page.getByRole('button', { name: /run ats gap analysis/i }).click();

    // Verify neutral heading is present and old AI heading is NOT present
    await expect(page.getByText('Suggested Resume Improvements')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('AI-Generated Actionable Rewrites')).toHaveCount(0);
  });

  test('Fix 2: Interview hydration renders ONLY asked turns and active question in order without unasked questions', async ({
    page,
  }) => {
    // 1. Create a 3-question session via backend API
    const ctx = await pwRequest.newContext();
    const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
      data: { target_role: 'Full Stack Engineer', interview_type: 'practice', question_count: 3 },
    });
    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    const sessionId = session.session_id ?? session.id;
    await ctx.dispose();

    // 2. Open the session in browser
    await page.goto(`/interview/${sessionId}`);
    await page.waitForLoadState('networkidle');

    // On initial load, only Question 1 should be in the conversation stream
    await expect(page.getByText(/Question 1 •/i)).toBeVisible();
    // Questions 2 and 3 should NOT be in the conversation stream
    await expect(page.locator('main').getByText(/Question 2 •/i)).toHaveCount(0);
    await expect(page.locator('main').getByText(/Question 3 •/i)).toHaveCount(0);

    // 3. Reload page and verify still only Question 1 is visible
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Question 1 •/i)).toBeVisible();
    await expect(page.locator('main').getByText(/Question 2 •/i)).toHaveCount(0);
  });

  test('Fix 3 & 4b: Report groups follow-up probes under parent question and completion progress updates', async ({
    page,
  }) => {
    // Create a 3-question session (schema requirement: ge=3)
    const ctx = await pwRequest.newContext();
    const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
      data: { target_role: 'Backend Engineer', interview_type: 'practice', question_count: 3 },
    });
    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    const sessionId = session.session_id ?? session.id;

    const richAnswer =
      'At FinCore I scaled FastAPI microservices handling 2M requests/day and cut p95 latency from 800ms to 240ms with Redis caching.';

    // 1. Answer Q1 thin to trigger follow-up probe
    const ans1 = await ctx.post(`${BACKEND}/api/v1/interviews/sessions/${sessionId}/answer`, {
      data: { answer: 'I built python apis.' },
    });
    expect(ans1.ok()).toBeTruthy();
    const ans1Body = await ans1.json();
    expect(ans1Body.next_question.category).toBe('follow-up');

    // Answer questions until session completes
    let isCompleted = false;
    let iterations = 0;
    while (!isCompleted && iterations < 8) {
      iterations += 1;
      const ans = await ctx.post(`${BACKEND}/api/v1/interviews/sessions/${sessionId}/answer`, {
        data: { answer: richAnswer },
      });
      expect(ans.ok()).toBeTruthy();
      const ansBody = await ans.json();
      isCompleted = ansBody.completed;
    }
    expect(isCompleted).toBe(true);
    await ctx.dispose();

    // Open the completed session in browser
    await page.goto(`/interview/${sessionId}`);
    await page.waitForLoadState('networkidle');

    // Fix 4b: Completion progress header should show 3/3 (not 2/3)
    await expect(page.getByText('3/3')).toBeVisible();

    // Fix 3: Report section should show "Question 1 •" and "Follow-up to Question 1", then "Question 2 •", then "Question 3 •"
    await expect(page.getByText(/Follow-up to Question 1/i)).toBeVisible();
    await expect(page.locator('section').getByText(/Question 1 •/i)).toBeVisible();
    await expect(page.locator('section').getByText(/Question 2 •/i)).toBeVisible();
    await expect(page.locator('section').getByText(/Question 3 •/i)).toBeVisible();
  });

  test('Fix 4a: Failed send removes optimistic candidate bubble and restores typed text to input for retry', async ({
    page,
  }) => {
    // 1. Create a session via backend API
    const ctx = await pwRequest.newContext();
    const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
      data: { target_role: 'Reliability Engineer', interview_type: 'practice', question_count: 3 },
    });
    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    const sessionId = session.session_id ?? session.id;
    await ctx.dispose();

    // 2. Open the session in browser
    await page.goto(`/interview/${sessionId}`);
    await page.waitForLoadState('networkidle');

    // 3. Intercept the answer endpoint to simulate a failed network call (abort)
    await page.route(`**/api/v1/interviews/sessions/${sessionId}/answer`, (route) => {
      route.abort('failed');
    });

    // 4. Type an answer and submit
    const answerText = 'This is an unrecorded answer attempt.';
    const inputArea = page.getByPlaceholder(/type your answer/i);
    await inputArea.fill(answerText);
    await page.getByRole('button', { name: /answer/i }).click();

    // 5. Verify: error message is displayed
    await expect(page.getByText(/could not submit your answer/i)).toBeVisible();

    // 6. Verify: candidate bubble is removed from transcript (not left falsely as sent)
    await expect(page.locator('main').getByText(answerText)).toHaveCount(0);

    // 7. Verify: typed text is restored to input area so user can retry
    await expect(inputArea).toHaveValue(answerText);
  });

  test('Fix 5: TopBar action row on /resume adapts cleanly at 320px and 390px without clipping', async ({
    page,
  }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/resume');
      await page.waitForLoadState('networkidle');

      const saveBtn = page.getByRole('button', { name: /Save Draft/i });
      const exportBtn = page.getByRole('button', { name: /Export PDF/i });

      await expect(saveBtn).toBeVisible();
      await expect(exportBtn).toBeVisible();

      const exportBox = await exportBtn.boundingBox();
      expect(exportBox).not.toBeNull();
      const rightEdge = (exportBox?.x || 0) + (exportBox?.width || 0);
      expect(rightEdge).toBeLessThanOrEqual(width);

      // Verify trial clickability
      await saveBtn.click({ trial: true });
      await exportBtn.click({ trial: true });
    }
  });

  test('Fix 6: Missing-facts banner humanizes keys with readable labels', async ({
    page,
  }) => {
    // Seed missing facts in localStorage before navigating
    await page.goto('/resume');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'placemind.missingFacts',
        JSON.stringify(['education.dates', 'skills', 'experience'])
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Banner should show "Education dates, Skills, Experience" rather than "education.dates, skills, experience"
    await expect(
      page.getByText('Missing facts from setup: Education dates, Skills, Experience')
    ).toBeVisible();
  });

  test('Resume page is single-window without document scroll, shows bottom bar, and renders A4 preview format', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');

    // Type a sample name to render the live preview sheet
    await page.locator('input[placeholder="Your name"]').fill('Alex Morgan');
    await page.waitForTimeout(300);

    // Document itself must not scroll (100dvh layout)
    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollY: window.scrollY,
    }));
    expect(metrics.scrollHeight).toBe(metrics.clientHeight);
    expect(metrics.scrollY).toBe(0);

    // Bottom command bar is visible and positioned within the viewport
    const barInput = page.locator('input[placeholder*="Describe the resume you want"]');
    await expect(barInput).toBeVisible();
    const barBox = await barInput.boundingBox();
    expect(barBox).not.toBeNull();
    expect(barBox!.y).toBeLessThan(900);
    expect(barBox!.y).toBeGreaterThan(700);

    // Resume preview sheet has authentic A4 format (ratio ~1:1.414, max width ~500px)
    const sheet = page.locator('#resume-preview-sheet');
    await expect(sheet).toBeVisible();
    const sheetBox = await sheet.boundingBox();
    expect(sheetBox).not.toBeNull();
    expect(sheetBox!.width).toBeLessThanOrEqual(520);
    expect(sheetBox!.height).toBeGreaterThanOrEqual(680);
    const ratio = sheetBox!.height / sheetBox!.width;
    expect(ratio).toBeGreaterThan(1.35);
    expect(ratio).toBeLessThan(1.50);
  });
});

