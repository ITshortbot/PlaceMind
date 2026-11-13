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

let resumeId = '';

test.beforeAll(async () => {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BACKEND}/api/v1/resumes`, { data: DEMO_RESUME });
  expect(res.ok(), `seed resume via backend failed (${res.status()})`).toBeTruthy();
  resumeId = (await res.json()).id;
  expect(resumeId).toBeTruthy();
  await ctx.dispose();
});

async function createSession(): Promise<{ id: string; question: string }> {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
    data: { target_role: 'Backend Engineer', interview_type: 'practice', question_count: 3 },
  });
  expect(res.ok(), `create interview session failed (${res.status()})`).toBeTruthy();
  const body = await res.json();
  await ctx.dispose();
  const id = body.session_id ?? body.id;
  const question =
    body.current_question?.question ?? body.questions?.[0]?.question ?? body.current_question ?? '';
  return { id, question };
}

test.describe('Placemind Internal App & SaaS Navigation Suite', () => {
  test('Landing Page (Untouched) renders flawlessly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Placemind/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Dashboard loads greeting, quick action cards and real workspace stats', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(
      page.getByText('Your saved resumes and practice sessions, loaded from your workspace.')
    ).toBeVisible();
    await expect(page.getByText('Build a Resume')).toBeVisible();
    await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
    await expect(page.getByText('Practice Interview')).toBeVisible();
    await expect(page.getByText('Practice sessions:')).toBeVisible();
  });

  test('Resume Upload Wizard supports in-memory parsing checklist', async ({ page }) => {
    await page.goto('/resumes/upload');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Upload & Audit Your Resume')).toBeVisible();
    await expect(page.getByText('Drag and drop your resume PDF here')).toBeVisible();
  });

  test('ATS Gap Analysis renders real score for a saved resume', async ({ page }) => {
    await page.goto(`/resumes/${resumeId}/analyze`);
    // Real deterministic analysis on the backend can take a moment.
    await expect(page.getByText('ATS Gap Analysis')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Structure & Sections')).toBeVisible();
    await expect(page.getByText('Formatting & Dates')).toBeVisible();
    await expect(page.getByText('Re-run Scan')).toBeVisible();
  });

  test('ATS Gap Analysis shows an honest error for an unknown resume', async ({ page }) => {
    await page.goto('/resumes/no-such-resume/analyze');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Could not load this resume.')).toBeVisible();
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
    await page.goto('/resumes/no-such-resume/edit');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Could not load this resume.')).toBeVisible();
  });

  test('Interview Setup starts a real practice session', async ({ page }) => {
    await page.goto('/interview/new');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('MOCK INTERVIEW PRACTICE')).toBeVisible();
    await expect(
      page.getByText('Paste the job description for JD-tailored questions (optional)')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Start Practice Session' }).click();
    await page.waitForURL(/\/interview\/[^/]+$/, { timeout: 20000 });
  });

  test('Live Interview session loads conversational answer UI', async ({ page }) => {
    const session = await createSession();
    await page.goto(`/interview/${session.id}`);
    await expect(
      page.getByPlaceholder('Type your answer (aim for 60-120 words with a concrete metric)...')
    ).toBeVisible({ timeout: 15000 });
    if (session.question) {
      await expect(page.getByText(session.question, { exact: false }).first()).toBeVisible();
    }
  });

  test('Live Interview shows an honest error for an unknown session', async ({ page }) => {
    await page.goto('/interview/no-such-session');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Could not load this session.')).toBeVisible();
  });

  test('Interview Report renders scoring dimensions for a real session', async ({ page }) => {
    const session = await createSession();
    await page.goto(`/interview/${session.id}/report`);
    await expect(page.getByText('Session Report')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('STAR Structure')).toBeVisible();
    await expect(page.getByText('Action Ownership')).toBeVisible();
  });

  test('Interview Report shows an honest error for an unknown session', async ({ page }) => {
    await page.goto('/interview/no-such-session/report');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Could not load the report.')).toBeVisible();
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

  test('Settings page renders AI Engine preference toggle (Local vs Cloud)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('AI Engine (Gemini vs LM Studio)')).toBeVisible();
    await expect(page.getByText('Always Use Local LM Studio / Ollama (0-Egress)')).toBeVisible();
    await expect(page.getByText('Gemini 2.5 Cloud Fast-Track')).toBeVisible();
    await expect(page.getByText('Local Endpoint URL')).toBeVisible();
  });
});
