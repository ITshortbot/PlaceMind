# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: internal-app.spec.ts >> Placemind Internal App & SaaS Navigation Suite >> Live Interview shows an honest error for an unknown session
- Location: tests/internal-app.spec.ts:143:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Could not load this session.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Could not load this session.')

```

```yaml
- img
- paragraph: Request failed (422)
- link "Start a new practice session":
  - /url: /interview/new
- alert
```

# Test source

```ts
  46  |   const ctx = await pwRequest.newContext();
  47  |   const res = await ctx.post(`${BACKEND}/api/v1/interviews/sessions`, {
  48  |     data: { target_role: 'Backend Engineer', interview_type: 'practice', question_count: 3 },
  49  |   });
  50  |   expect(res.ok(), `create interview session failed (${res.status()})`).toBeTruthy();
  51  |   const body = await res.json();
  52  |   await ctx.dispose();
  53  |   const id = body.session_id ?? body.id;
  54  |   const question =
  55  |     body.current_question?.question ?? body.questions?.[0]?.question ?? body.current_question ?? '';
  56  |   return { id, question };
  57  | }
  58  | 
  59  | test.describe('Placemind Internal App & SaaS Navigation Suite', () => {
  60  |   test('Landing Page (Untouched) renders flawlessly', async ({ page }) => {
  61  |     await page.goto('/');
  62  |     await page.waitForLoadState('networkidle');
  63  |     await expect(page).toHaveTitle(/Placemind/);
  64  |     await expect(page.locator('h1')).toBeVisible();
  65  |   });
  66  | 
  67  |   test('Dashboard loads greeting, quick action cards and real workspace stats', async ({
  68  |     page,
  69  |   }) => {
  70  |     await page.goto('/dashboard');
  71  |     await page.waitForLoadState('networkidle');
  72  |     await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  73  |     await expect(
  74  |       page.getByText('Your saved resumes and practice sessions, loaded from your workspace.')
  75  |     ).toBeVisible();
  76  |     await expect(page.getByText('Build a Resume')).toBeVisible();
  77  |     await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
  78  |     await expect(page.getByText('Practice Interview')).toBeVisible();
  79  |     await expect(page.getByText('Practice sessions:')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('Resume Upload Wizard supports in-memory parsing checklist', async ({ page }) => {
  83  |     await page.goto('/resumes/upload');
  84  |     await page.waitForLoadState('networkidle');
  85  |     await expect(page.getByText('Upload & Audit Your Resume')).toBeVisible();
  86  |     await expect(page.getByText('Drag and drop your resume PDF here')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('ATS Gap Analysis renders real score for a saved resume', async ({ page }) => {
  90  |     await page.goto(`/resumes/${resumeId}/analyze`);
  91  |     // Real deterministic analysis on the backend can take a moment.
  92  |     await expect(page.getByText('ATS Gap Analysis')).toBeVisible({ timeout: 30000 });
  93  |     await expect(page.getByText('Structure & Sections')).toBeVisible();
  94  |     await expect(page.getByText('Formatting & Dates')).toBeVisible();
  95  |     await expect(page.getByText('Re-run Scan')).toBeVisible();
  96  |   });
  97  | 
  98  |   test('ATS Gap Analysis shows an honest error for an unknown resume', async ({ page }) => {
  99  |     await page.goto('/resumes/no-such-resume/analyze');
  100 |     await page.waitForLoadState('networkidle');
  101 |     await expect(page.getByText('Could not load this resume.')).toBeVisible();
  102 |   });
  103 | 
  104 |   test('Resume Editor loads a saved resume and survives reload', async ({ page }) => {
  105 |     await page.goto(`/resumes/${resumeId}/edit`);
  106 |     await expect(page.getByText('Resume Editor')).toBeVisible({ timeout: 15000 });
  107 |     await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  108 |     await expect(page.getByText(/Alex Morgan/).first()).toBeVisible();
  109 |     // Reload: the record must persist from the backend, not local state.
  110 |     await page.reload();
  111 |     await expect(page.getByText('Resume Editor')).toBeVisible({ timeout: 15000 });
  112 |     await expect(page.getByText(/Alex Morgan/).first()).toBeVisible();
  113 |   });
  114 | 
  115 |   test('Resume Editor shows an honest error for an unknown resume', async ({ page }) => {
  116 |     await page.goto('/resumes/no-such-resume/edit');
  117 |     await page.waitForLoadState('networkidle');
  118 |     await expect(page.getByText('Could not load this resume.')).toBeVisible();
  119 |   });
  120 | 
  121 |   test('Interview Setup starts a real practice session', async ({ page }) => {
  122 |     await page.goto('/interview/new');
  123 |     await page.waitForLoadState('networkidle');
  124 |     await expect(page.getByText('MOCK INTERVIEW PRACTICE')).toBeVisible();
  125 |     await expect(
  126 |       page.getByText('Paste the job description for JD-tailored questions (optional)')
  127 |     ).toBeVisible();
  128 |     await page.getByRole('button', { name: 'Start Practice Session' }).click();
  129 |     await page.waitForURL(/\/interview\/[^/]+$/, { timeout: 20000 });
  130 |   });
  131 | 
  132 |   test('Live Interview session loads conversational answer UI', async ({ page }) => {
  133 |     const session = await createSession();
  134 |     await page.goto(`/interview/${session.id}`);
  135 |     await expect(
  136 |       page.getByPlaceholder('Type your answer (aim for 60-120 words with a concrete metric)...')
  137 |     ).toBeVisible({ timeout: 15000 });
  138 |     if (session.question) {
  139 |       await expect(page.getByText(session.question, { exact: false }).first()).toBeVisible();
  140 |     }
  141 |   });
  142 | 
  143 |   test('Live Interview shows an honest error for an unknown session', async ({ page }) => {
  144 |     await page.goto('/interview/no-such-session');
  145 |     await page.waitForLoadState('networkidle');
> 146 |     await expect(page.getByText('Could not load this session.')).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  147 |   });
  148 | 
  149 |   test('Interview Report renders scoring dimensions for a real session', async ({ page }) => {
  150 |     const session = await createSession();
  151 |     await page.goto(`/interview/${session.id}/report`);
  152 |     await expect(page.getByText('Session Report')).toBeVisible({ timeout: 15000 });
  153 |     await expect(page.getByText('STAR Structure')).toBeVisible();
  154 |     await expect(page.getByText('Action Ownership')).toBeVisible();
  155 |   });
  156 | 
  157 |   test('Interview Report shows an honest error for an unknown session', async ({ page }) => {
  158 |     await page.goto('/interview/no-such-session/report');
  159 |     await page.waitForLoadState('networkidle');
  160 |     await expect(page.getByText('Could not load the report.')).toBeVisible();
  161 |   });
  162 | 
  163 |   test('History archive lists the real seeded record', async ({ page }) => {
  164 |     await page.goto('/history');
  165 |     await page.waitForLoadState('networkidle');
  166 |     await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
  167 |     await expect(
  168 |       page.getByText('Every entry below is a real saved record. Upload a resume to add one.')
  169 |     ).toBeVisible();
  170 |     await expect(page.getByText('pw_alex_backend_2026.txt').first()).toBeVisible();
  171 |   });
  172 | 
  173 |   test('Settings page renders AI Engine preference toggle (Local vs Cloud)', async ({ page }) => {
  174 |     await page.goto('/settings');
  175 |     await page.waitForLoadState('networkidle');
  176 |     await expect(page.getByText('AI Engine (Gemini vs LM Studio)')).toBeVisible();
  177 |     await expect(page.getByText('Always Use Local LM Studio / Ollama (0-Egress)')).toBeVisible();
  178 |     await expect(page.getByText('Gemini 2.5 Cloud Fast-Track')).toBeVisible();
  179 |     await expect(page.getByText('Local Endpoint URL')).toBeVisible();
  180 |   });
  181 | });
  182 | 
```