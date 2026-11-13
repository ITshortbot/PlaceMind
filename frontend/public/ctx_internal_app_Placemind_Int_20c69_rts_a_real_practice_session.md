# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: internal-app.spec.ts >> Placemind Internal App & SaaS Navigation Suite >> Interview Setup starts a real practice session
- Location: tests/internal-app.spec.ts:121:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Start Practice Session' })
    - locator resolved to <button disabled class="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer bg-[#FACC15] text-[#0A0A0C] hover:bg-[#FFE033] shadow-lg shadow-[#FACC15]/20 active:scale-[0.98] border border-[#FACC15]/40 h-11 rounded-2xl px…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    34 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "P" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
          - button "Search Pages & Actions (Cmd+K)" [ref=e9] [cursor=pointer]
        - navigation [ref=e13]:
          - link [ref=e15] [cursor=pointer]:
            - /url: /dashboard
          - link [ref=e22] [cursor=pointer]:
            - /url: /template
          - link [ref=e29] [cursor=pointer]:
            - /url: /resume
          - link [ref=e34] [cursor=pointer]:
            - /url: /ats
          - link [ref=e40] [cursor=pointer]:
            - /url: /resumes/upload
          - link [ref=e45] [cursor=pointer]:
            - /url: /interview
          - link [ref=e50] [cursor=pointer]:
            - /url: /report
          - link [ref=e54] [cursor=pointer]:
            - /url: /history
          - link [ref=e60] [cursor=pointer]:
            - /url: /settings
        - button "Toggle Theme" [ref=e65] [cursor=pointer]
    - generic [ref=e68]:
      - banner [ref=e69]:
        - generic [ref=e71]:
          - link "Dashboard" [ref=e72] [cursor=pointer]:
            - /url: /dashboard
          - link "Interview Practice" [ref=e75] [cursor=pointer]:
            - /url: /interview
          - generic [ref=e78]: New Session
        - link [ref=e80] [cursor=pointer]:
          - /url: /resumes/upload
          - button [ref=e81]
      - main [ref=e83]:
        - generic [ref=e84]:
          - generic [ref=e85]: MOCK INTERVIEW PRACTICE
          - heading "Configure Your Mock Interview" [level=1] [ref=e90]
          - paragraph [ref=e91]: Deterministic practice questions with transparent, heuristic answer feedback - no black-box scores.
        - generic [ref=e92]:
          - generic [ref=e93]:
            - generic [ref=e94]: Target Role
            - textbox "e.g. Backend Engineer" [ref=e99]
          - generic [ref=e100]:
            - generic [ref=e101]: Company (optional)
            - textbox "e.g. Stripe" [ref=e106]
          - generic [ref=e107]:
            - generic [ref=e108]:
              - generic [ref=e109]: Questions
              - generic [ref=e113]: "5"
            - slider [ref=e114]: "5"
          - button "Paste resume text for resume-specific questions (optional)" [ref=e116] [cursor=pointer]
          - button "Paste the job description for JD-tailored questions (optional)" [ref=e121] [cursor=pointer]
          - button "Start Practice Session" [disabled]
          - paragraph [ref=e125]: Sessions are stored by the backend so you can resume or review them later from the Interview tab.
      - generic [ref=e127]:
        - generic [ref=e128]:
          - button "Star Presets" [ref=e129] [cursor=pointer]
          - button "Export" [ref=e132] [cursor=pointer]
          - button "Attach File" [ref=e136] [cursor=pointer]
        - generic [ref=e140]:
          - button "Voice Input" [ref=e141] [cursor=pointer]
          - textbox "Describe the resume you want - opens the Template Studio with your prompt..." [ref=e145]
        - generic [ref=e146]:
          - button "Direct Rewrite" [ref=e147] [cursor=pointer]
          - button "Run Prompt" [disabled] [ref=e151] [cursor=pointer]
  - alert [ref=e155]
```

# Test source

```ts
  28  |     'EDUCATION',
  29  |     'B.S. Computer Science, State University, 2020',
  30  |   ].join('\n'),
  31  |   parsed_metadata: { seeded_by: 'playwright', synthetic: true },
  32  | };
  33  | 
  34  | let resumeId = '';
  35  | 
  36  | test.beforeAll(async () => {
  37  |   const ctx = await pwRequest.newContext();
  38  |   const res = await ctx.post(`${BACKEND}/api/v1/resumes`, { data: DEMO_RESUME });
  39  |   expect(res.ok(), `seed resume via backend failed (${res.status()})`).toBeTruthy();
  40  |   resumeId = (await res.json()).id;
  41  |   expect(resumeId).toBeTruthy();
  42  |   await ctx.dispose();
  43  | });
  44  | 
  45  | async function createSession(): Promise<{ id: string; question: string }> {
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
> 128 |     await page.getByRole('button', { name: 'Start Practice Session' }).click();
      |                                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  146 |     await expect(page.getByText('Could not load this session.')).toBeVisible();
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