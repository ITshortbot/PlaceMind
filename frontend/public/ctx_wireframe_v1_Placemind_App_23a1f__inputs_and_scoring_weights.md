# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wireframe-v1.spec.ts >> Placemind App Flow Suite (Onboarding + Core Tabs) >> Tab 4 - ATS 1-Pass renders analysis inputs and scoring weights
- Location: tests/wireframe-v1.spec.ts:102:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Semantic Coverage (50%)')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Semantic Coverage (50%)')

```

```yaml
- complementary:
  - link "P":
    - /url: /dashboard
  - button "Search Pages & Actions (Cmd+K)":
    - img
  - navigation:
    - link:
      - /url: /dashboard
      - img
    - link:
      - /url: /template
      - img
    - link:
      - /url: /resume
      - img
    - link:
      - /url: /ats
      - img
    - link:
      - /url: /resumes/upload
      - img
    - link:
      - /url: /interview
      - img
    - link:
      - /url: /report
      - img
    - link:
      - /url: /history
      - img
    - link:
      - /url: /settings
      - img
  - button "Toggle Theme":
    - img
- banner:
  - link "Dashboard":
    - /url: /dashboard
  - img
  - text: ATS 1-Pass
  - link "Upload Resume":
    - /url: /resumes/upload
    - button "Upload Resume":
      - img
      - text: Upload Resume
- main:
  - img
  - text: 1-PASS AI SCORING PIPELINE
  - heading "Analyze Resume vs. Job Description" [level=1]
  - paragraph: Upload your PDF resume and paste a job description. Our backend computes bipartite cosine similarity and synthesizes an AI-powered gap report.
  - text: AI Engine
  - button "Gemini Cloud":
    - img
    - text: Gemini Cloud
  - button "Local LM Studio":
    - img
    - text: Local LM Studio
  - text: Resume PDF
  - img
  - paragraph: Drop your PDF here or click to browse
  - paragraph: Supports PDF only · Max 10MB
  - button "Drop your PDF here or click to browse Supports PDF only · Max 10MB"
  - text: Job Title
  - textbox "e.g. Senior Frontend Engineer at Stripe": Staff Software Engineer · Stripe Core Infrastructure
  - text: Job Description Live Semantic Parser Ready
  - textbox "Paste job posting text here...": We are looking for a Staff Engineer to lead high-throughput event processing (Kafka), optimize PostgreSQL & vector search pipelines, and guarantee 99.99% multi-region uptime.
  - img
  - text: "Backend:"
  - strong: http://localhost:8000
  - text: POST /api/v1/resume/score
  - button "Run ATS Gap Analysis" [disabled]:
    - img
    - text: Run ATS Gap Analysis
  - paragraph: Upload a PDF resume to enable analysis
- button "Star Presets":
  - img
- button "Export":
  - img
- button "Attach File":
  - img
- button "Voice Input":
  - img
- textbox "Describe the resume you want - opens the Template Studio with your prompt..."
- button "Direct Rewrite":
  - img
- button "Run Prompt" [disabled]:
  - img
- alert
```

# Test source

```ts
  6   | // wizard is labeled demo setup, the old 8-tab wireframe copy is gone, and the
  7   | // builder writes real records through the backend.
  8   | // ============================================================================
  9   | 
  10  | test.describe('Placemind App Flow Suite (Onboarding + Core Tabs)', () => {
  11  |   test('Onboarding wizard is labeled demo setup and lands on the builder', async ({ page }) => {
  12  |     await page.goto('/onboarding');
  13  |     await page.waitForLoadState('networkidle');
  14  | 
  15  |     // Step 1: Demo Setup (not account creation)
  16  |     await expect(page.getByText('Welcome to Placemind')).toBeVisible();
  17  |     await expect(page.getByText('Step 01 • Demo Setup')).toBeVisible();
  18  |     await expect(
  19  |       page.getByText('This is a single-user demo: no account is created and nothing you enter is verified.')
  20  |     ).toBeVisible();
  21  |     await page.getByPlaceholder('name@company.com').fill('demo@placemind.local');
  22  |     await page.getByRole('button', { name: 'Continue with Email' }).click();
  23  | 
  24  |     // Step 2: Profile Basics
  25  |     await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  26  |     await page.getByRole('button', { name: 'Continue' }).click();
  27  | 
  28  |     // Step 3: Personalization
  29  |     await expect(page.getByText('Personalize Your Track')).toBeVisible();
  30  |     await page.getByRole('button', { name: 'Select Template' }).click();
  31  | 
  32  |     // Step 4: Template Preference
  33  |     await expect(page.getByText('Choose Starting Template')).toBeVisible();
  34  |     await page.getByRole('button', { name: 'Enter Dashboard' }).click();
  35  | 
  36  |     // Lands on the Resume Builder
  37  |     await page.waitForURL('**/resume');
  38  |     await expect(page.getByText('Your Information')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('Tab 1 - Dashboard renders greeting and 3 quick actions', async ({ page }) => {
  42  |     await page.goto('/dashboard');
  43  |     await page.waitForLoadState('networkidle');
  44  |     await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  45  |     await expect(page.getByText('Build a Resume')).toBeVisible();
  46  |     await expect(page.getByText('Auto-Generate for a Job')).toBeVisible();
  47  |     await expect(page.getByText('Practice Interview')).toBeVisible();
  48  |   });
  49  | 
  50  |   test('Tab 2 - Template Studio renders prompt generator and example chips', async ({ page }) => {
  51  |     await page.goto('/template');
  52  |     await page.waitForLoadState('networkidle');
  53  |     await expect(
  54  |       page.getByRole('heading', { name: 'Prompt-to-Template Generator' })
  55  |     ).toBeVisible();
  56  |     await expect(page.getByText('Describe Your Resume & Style')).toBeVisible();
  57  |     await expect(page.locator('#generate-template-btn')).toBeVisible();
  58  |     await expect(page.locator('#demo-mode-toggle')).toBeVisible();
  59  |   });
  60  | 
  61  |   test('Tab 3 - Resume Builder edits contact, saves a real draft and exports', async ({
  62  |     page,
  63  |   }) => {
  64  |     await page.addInitScript(() => {
  65  |       (window as unknown as { __printCalls: number }).__printCalls = 0;
  66  |       window.print = () => {
  67  |         (window as unknown as { __printCalls: number }).__printCalls += 1;
  68  |       };
  69  |     });
  70  | 
  71  |     await page.goto('/resume');
  72  |     await page.waitForLoadState('networkidle');
  73  |     await expect(page.getByText('Your Information')).toBeVisible();
  74  |     await expect(page.getByText('TEMPLATE LAYOUT')).toBeVisible();
  75  | 
  76  |     // Contact info flows live into the preview document.
  77  |     await page.getByPlaceholder('Your name').fill('Alex Morgan');
  78  |     await page.getByPlaceholder('you@example.com').fill('alex.morgan@example.com');
  79  |     await expect(page.getByText('Alex Morgan').first()).toBeVisible();
  80  |     await expect(page.getByText('alex.morgan@example.com').first()).toBeVisible();
  81  | 
  82  |     // Layout switcher applies a different template.
  83  |     await page.getByRole('button', { name: /Modern/ }).click();
  84  | 
  85  |     // Save persists through the backend...
  86  |     await page.getByRole('button', { name: /Save Draft/ }).click();
  87  |     await expect(page.getByText('Draft saved to your workspace.')).toBeVisible({ timeout: 15000 });
  88  | 
  89  |     // ...and the saved record is listed on History after navigation (real reload).
  90  |     await page.goto('/history');
  91  |     await expect(page.getByText('alex_morgan_draft.txt').first()).toBeVisible({ timeout: 15000 });
  92  | 
  93  |     // Export uses the print stylesheet path.
  94  |     await page.goto('/resume');
  95  |     await page.getByRole('button', { name: /Export PDF/ }).click();
  96  |     const printCalls = await page.evaluate(
  97  |       () => (window as unknown as { __printCalls: number }).__printCalls
  98  |     );
  99  |     expect(printCalls).toBe(1);
  100 |   });
  101 | 
  102 |   test('Tab 4 - ATS 1-Pass renders analysis inputs and scoring weights', async ({ page }) => {
  103 |     await page.goto('/ats');
  104 |     await page.waitForLoadState('networkidle');
  105 |     await expect(page.getByText('ATS 1-Pass')).toBeVisible();
> 106 |     await expect(page.getByText('Semantic Coverage (50%)')).toBeVisible();
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  107 |     await expect(page.getByText('Keyword Density (30%)')).toBeVisible();
  108 |     await expect(page.getByText('Resume Structure (20%)')).toBeVisible();
  109 |     await expect(page.getByText('Resume PDF')).toBeVisible();
  110 |     await expect(page.getByText('Job Title')).toBeVisible();
  111 |   });
  112 | 
  113 |   test('Tab 5 - Interview hub lists sessions with an honest heuristic note', async ({ page }) => {
  114 |     await page.goto('/interview');
  115 |     await page.waitForLoadState('networkidle');
  116 |     await expect(page.getByRole('heading', { name: /Mock Interview Practice/ })).toBeVisible();
  117 |     await expect(
  118 |       page.getByText('Deterministic question plans with transparent, heuristic answer feedback - every score shows its working.')
  119 |     ).toBeVisible();
  120 |     await expect(page.getByRole('link', { name: /New Session/ })).toBeVisible();
  121 |   });
  122 | 
  123 |   test('Tab 6 - Report renders 2-column analytical scoring and SVG radar chart', async ({ page }) => {
  124 |     await page.goto('/report');
  125 |     await page.waitForLoadState('networkidle');
  126 |     await expect(page.getByText('Resume & ATS Score Report')).toBeVisible();
  127 |     await expect(page.getByText('Interview Performance Report')).toBeVisible();
  128 |     await expect(page.getByText('STAR Structure')).toBeVisible();
  129 |   });
  130 | 
  131 |   test('Tab 7 - History renders real artifact records or an honest empty state', async ({
  132 |     page,
  133 |   }) => {
  134 |     await page.goto('/history');
  135 |     await page.waitForLoadState('networkidle');
  136 |     await expect(page.getByText('Your Resume Artifacts & Files')).toBeVisible();
  137 |     await expect(
  138 |       page.getByText('Every entry below is a real saved record. Upload a resume to add one.')
  139 |     ).toBeVisible();
  140 |   });
  141 | 
  142 |   test('Tab 8 - Settings renders profile and AI engine controls', async ({ page }) => {
  143 |     await page.goto('/settings');
  144 |     await page.waitForLoadState('networkidle');
  145 |     await expect(page.getByText('Account & Application Settings')).toBeVisible();
  146 |     await expect(page.getByText('Profile & Education Basics')).toBeVisible();
  147 |   });
  148 | });
  149 | 
```