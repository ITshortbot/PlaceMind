import { test, expect, request as pwRequest } from '@playwright/test';

// ============================================================================
// Placemind Internal App & SaaS Navigation Suite
// Anchored to the REAL app: honest empty/error states, real backend records.
// All data seeded here is synthetic demo content.
// ============================================================================

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

const DEMO_RESUME = {
  file_name: 'pw_alex_backend_2026.txt',
  raw_text: [
    'Alex Morgan',
    'alex.morgan@example.com | +1 555 010 2030',
    '',
    'SUMMARY',
    'Backend engineer with 5 years building payments APIs.',
    '',
    'EXPERIENCE',
    'Senior Backend Engineer, FinCore, 2021-2026',
    '- Built Kafka stream processing pipeline handling 2M events/day.',
    '- Cut API p95 latency by 40% with Redis caching.',
    '',
    'SKILLS',
    'Python, FastAPI, PostgreSQL, Redis, Kafka, Docker',
    '',
    'EDUCATION',
    'B.S. Computer Science, State University, 2020',
  ].join('\n'),
  parsed_metadata: { seeded_by: 'playwright', synthetic: true },
};

const DEMO_JD =
  'We are hiring a Backend Engineer to build FastAPI services on PostgreSQL and Redis, ' +
  'with Kafka event pipelines and Docker-based deployments.';

const DEMO_ANSWER =
  'At FinCore I owned the payments events pipeline. I designed the Kafka topology, ' +
  'wrote the FastAPI consumers, and added Redis idempotency keys, cutting duplicate ' +
  'processing by 95 percent and p95 latency from 800ms to 240ms for 2M events per day.';

// A syntactically valid UUID that does not exist in the database.
const MISSING_UUID = '00000000-0000-4000-8000-000000000000';
const HONEST_ERROR = /request failed \(4\d\d\)|not found|could not load/i;

let resumeId = '';

test.beforeAll(async () => {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BACKEND}/api/v1/resumes`, { data: DEMO_RESUME });
  expect(res.ok(), `seed resume via backend failed (${res.status()})`).toBeTruthy();
  resumeId = (await res.json()).id;
  expect(resumeId).toBeTruthy();
  await ctx.dispose();
});

async function createSession(): Promise<string> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
    data: { target_role: 'Backend Engineer', interview_type: 'practice', question_count: 3 },
  });
  expect(res.ok(), `create interview session failed (${res.status()})`).toBeTruthy();
  const body = await res.json();
  await ctx.dispose();
  const id = body.session_id ?? body.id;
  expect(id).toBeTruthy();
  return id;
}

async function answerQuestion(sessionId: string): Promise<void> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions/${sessionId}/answer`, {
    data: { answer: DEMO_ANSWER },
  });
  expect(res.ok(), `answer question failed (${res.status()})`).toBeTruthy();
  await ctx.dispose();
}

test.describe('Placemind Internal App & SaaS Navigation Suite', () => {
  test('Landing Page (Untouched) renders flawlessly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Placemind/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Dashboard loads greeting, conversation composer and action chips in the chat stream', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Compact greeting line still visible
    await expect(page.getByText('Welcome back')).toBeVisible();

    // Stat chips visible (inline in compact header)
    await expect(page.getByText(/\d+ resumes/).first()).toBeVisible();
    await expect(page.getByText(/\d+ sessions/).first()).toBeVisible();

    // Exactly one visible text input composer on /dashboard (no duplicate AiCommandBar)
    const visibleInputs = page.locator('input[type="text"]:visible');
    await expect(visibleInputs).toHaveCount(1);

    // Action chips from the welcome message are present in the conversation stream
    await expect(page.getByText('Create New Resume')).toBeVisible();
    await expect(page.getByText('Score with ATS Rules')).toBeVisible();
    await expect(page.getByText('Start Mock Interview')).toBeVisible();

    // The old 3-card quick-action row is gone (no "Build a Resume" card heading)
    await expect(page.getByRole('heading', { name: 'Build a Resume' })).toHaveCount(0);

    // History is collapsed by default — resume/session rows are not visible
    const historyToggle = page.getByRole('button', { name: /Toggle workspace history/ });
    await expect(historyToggle).toBeVisible();
  });

  test('Resume Upload Wizard supports in-memory parsing checklist', async ({ page }) => {
    await page.goto('/resumes/upload');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Upload & Audit Your Resume')).toBeVisible();
    await expect(page.getByText('Drag and drop your resume PDF here')).toBeVisible();
  });

  test('ATS Gap Analysis scores a saved resume against a pasted job description', async ({
    page,
  }) => {
    await page.goto(`/resumes/${resumeId}/analyze`);
    await expect(page.getByText('ATS Gap Analysis')).toBeVisible({ timeout: 15000 });
    // Honest initial state: no fabricated score before a real scan.
    await expect(page.getByText('No analysis run yet')).toBeVisible();
    await page.getByPlaceholder('Job title (e.g. Backend Engineer)').fill('Backend Engineer');
    await page
      .getByPlaceholder(/Paste the real job description here/)
      .fill(DEMO_JD);
    await page.getByRole('button', { name: 'Run Scan' }).click();
    // Real deterministic analysis on the backend can take a moment.
    await expect(page.getByText('Structure & Sections')).toBeVisible({ timeout: 45000 });
    await expect(page.getByText('Formatting & Dates')).toBeVisible();
  });

  test('ATS Gap Analysis shows an honest error for an unknown resume', async ({ page }) => {
    await page.goto(`/resumes/${MISSING_UUID}/analyze`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(HONEST_ERROR).first()).toBeVisible();
  });

  test('Resume Editor loads a saved resume and survives reload', async ({ page }) => {
    await page.goto(`/resumes/${resumeId}/edit`);
    await expect(page.getByText('Resume Editor')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    await expect(page.getByText(/Alex Morgan/).first()).toBeVisible();
    // Reload: the record must persist from the backend, not local state.
    await page.reload();
    await expect(page.getByText('Resume Editor')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Alex Morgan/).first()).toBeVisible();
  });

  test('Resume Editor shows an honest error for an unknown resume', async ({ page }) => {
    await page.goto(`/resumes/${MISSING_UUID}/edit`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(HONEST_ERROR).first()).toBeVisible();
  });

  test('Interview Setup starts a real practice session', async ({ page }) => {
    await page.goto('/interview/new');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('MOCK INTERVIEW PRACTICE')).toBeVisible();
    await expect(
      page.getByText('Paste the job description for JD-tailored questions (optional)')
    ).toBeVisible();
    // The start button stays disabled until a target role is entered.
    await expect(page.getByRole('button', { name: 'Start Practice Session' })).toBeDisabled();
    await page.getByPlaceholder('e.g. Backend Engineer').fill('Backend Engineer');
    await page.getByRole('button', { name: 'Start Practice Session' }).click();
    await page.waitForURL(/\/interview\/[^/]+$/, { timeout: 20000 });
  });

  test('Live Interview session loads conversational answer UI and accepts an answer', async ({
    page,
  }) => {
    const sessionId = await createSession();
    await page.goto(`/interview/${sessionId}`);
    await expect(
      page.getByPlaceholder('Type your answer (aim for 60-120 words with a concrete metric)...')
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Question 1/).first()).toBeVisible();
    await expect(page.getByText(/Feedback is heuristic/).first()).toBeVisible();
    // Answer submits through the backend and the session advances.
    await page
      .getByPlaceholder('Type your answer (aim for 60-120 words with a concrete metric)...')
      .fill(DEMO_ANSWER);
    await page.getByRole('button', { name: 'Answer' }).click();
    await expect(page.getByText(/Question 2|Session complete|Feedback/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('Live Interview shows an honest error for an unknown session', async ({ page }) => {
    await page.goto(`/interview/${MISSING_UUID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(HONEST_ERROR).first()).toBeVisible();
  });

  test('Interview Report is honest with no answers and scores after one', async ({ page }) => {
    const sessionId = await createSession();
    await page.goto(`/interview/${sessionId}/report`);
    // No fabricated scores before any answer exists.
    await expect(page.getByText('No answers recorded yet')).toBeVisible({ timeout: 15000 });
    await answerQuestion(sessionId);
    await page.reload();
    await expect(page.getByText('Session Report')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('STAR Structure').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Action Ownership')).toBeVisible();
  });

  test('Interview Report shows an honest error for an unknown session', async ({ page }) => {
    await page.goto(`/interview/${MISSING_UUID}/report`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(HONEST_ERROR).first()).toBeVisible();
  });

  test('History archive lists the real seeded record', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
    await expect(
      page.getByText('Every entry below is a real saved record. Upload a resume to add one.')
    ).toBeVisible();
    await expect(page.getByText('pw_alex_backend_2026.txt').first()).toBeVisible();
  });

  test('Settings renders engine controls, no fabricated profile, and saves persist', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: 'Account & Application Settings' })
    ).toBeVisible();
    // Profile fields start empty - no invented persona.
    const inputValues = await page
      .locator('input')
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value).join(' | '));
    expect(inputValues).not.toMatch(/Rohan|Stanford/);

    // Saving the profile writes to this browser and survives a reload.
    await page.getByPlaceholder('Your full name').fill('Alex Morgan');
    await page.getByPlaceholder('Your phone number').fill('+1 555 010 2030');
    await page.getByPlaceholder('Your college or university').fill('State University');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Saved in this browser').first()).toBeVisible();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder('Your full name')).toHaveValue('Alex Morgan');
    await expect(page.getByPlaceholder('Your phone number')).toHaveValue('+1 555 010 2030');
    await expect(page.getByPlaceholder('Your college or university')).toHaveValue('State University');

    // Engine preference lives under its own tab and persists to localStorage.
    await page.getByRole('button', { name: 'AI Engine (Gemini vs LM Studio)' }).click();
    await expect(page.getByText('Prefer Local LM Studio')).toBeVisible();
    await expect(page.getByText('Prefer Gemini Cloud')).toBeVisible();
    await page.getByText('Prefer Local LM Studio').click();
    await page.getByRole('button', { name: 'Save Preference' }).click();
    await expect(page.getByText('Saved in this browser').first()).toBeVisible();
    const stored = await page.evaluate(() => window.localStorage.getItem('placemind.aiMode'));
    expect(stored).toBe('local');

    // Privacy copy states the real persistence model - no flushed-instantly claims.
    await page.getByRole('button', { name: 'Privacy & Data Retention' }).click();
    await expect(page.getByText(/Local demo persistence/i)).toBeVisible();
    await expect(page.getByText(/Zero-Disk Stream Extraction/i)).toHaveCount(0);
    await expect(page.getByText(/flushed instantly/i)).toHaveCount(0);
  });

  test('Resume Builder pre-fills details saved in Settings', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'placemind.profile',
        JSON.stringify({
          fullName: 'Alex Morgan',
          phone: '+1 555 010 2030',
          college: 'State University',
          specialization: 'B.S. Computer Science',
        })
      );
    });
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder('Your name')).toHaveValue('Alex Morgan');
    await expect(page.getByPlaceholder('Optional', { exact: true })).toHaveValue('+1 555 010 2030');
    await expect(page.getByPlaceholder('University name')).toHaveValue('State University');
    await expect(page.getByPlaceholder('e.g. B.Tech Computer Science')).toHaveValue(
      'B.S. Computer Science'
    );
  });

  test('AI command bar hands the prompt to Template Studio', async ({ page }) => {
    // AiCommandBar renders on working tabs (/resume, /ats, /interview) — not /dashboard
    await page.goto('/resume');
    await page.waitForLoadState('networkidle');
    // No fake dictation control is rendered.
    await expect(page.getByRole('button', { name: 'Voice Input' })).toHaveCount(0);
    const barInput = page.getByPlaceholder('Describe the resume you want');

    // Each quick action does what its tooltip says: insert a starter prompt.
    const starters: Array<[RegExp, RegExp]> = [
      [/metric-driven bullets/, /Enhance metrics/],
      [/PDF export/, /Export latest tailored resume/],
      [/ATS matching/, /Attach target Job Description/],
      [/bullet rewrites/, /Rewrite active bullet points/],
    ];
    for (const [tooltip, inserted] of starters) {
      await page.getByTitle(tooltip).click();
      await expect(barInput).toHaveValue(inserted);
      await barInput.fill('');
    }

    // Typing + submitting hands the text to Template Studio.
    await barInput.fill('synthetic playwright check: teal resume for a data analyst fresher');
    await page.getByRole('button', { name: 'Run Prompt' }).click();
    await page.waitForURL('**/template**');
    await expect(page.locator('#prompt-input')).toHaveValue(/teal resume/);
  });
});

test.describe('ATS 1-Pass: honest copy and provider-free scoring', () => {
  test('ATS page states the deterministic pipeline and shows no readiness badges', async ({
    page,
  }) => {
    await page.goto('/ats');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('1-PASS SCORING PIPELINE')).toBeVisible();
    await expect(page.getByText(/cosine similarity/i).first()).toBeVisible();
    // No static "live parser ready" badge and no unconditional AI claims.
    await expect(page.getByText('Live Semantic Parser Ready')).toHaveCount(0);
  });

  test('ATS upload scores a synthetic PDF with no AI provider configured', async ({ page }) => {
    test.setTimeout(180000);
    // Build the synthetic PDF on the fly - no binary resumes are stored in the repo.
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

    // The request must succeed without any AI provider: deterministic report, no 500.
    await expect(page.getByText(/overall ats alignment/i)).toBeVisible({ timeout: 150000 });
    await expect(page.getByText(/deterministic local analysis/i).first()).toBeVisible();
    await expect(page.getByText(/no llm call made/i).first()).toBeVisible();
  });
});
