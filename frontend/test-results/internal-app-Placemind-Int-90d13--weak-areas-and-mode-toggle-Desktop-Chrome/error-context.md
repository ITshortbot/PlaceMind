# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: internal-app.spec.ts >> Placemind Internal App & SaaS Navigation Suite >> Interview Setup wizard shows detected weak areas and mode toggle
- Location: tests/internal-app.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Distributed Kafka Systems')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Distributed Kafka Systems')

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
  - link "Interview Practice":
    - /url: /interview
  - img
  - text: New Session
  - link "Upload Resume":
    - /url: /resumes/upload
    - button "Upload Resume":
      - img
      - text: Upload Resume
- main:
  - img
  - text: MOCK INTERVIEW PRACTICE
  - heading "Configure Your Mock Interview" [level=1]
  - paragraph: Deterministic practice questions with transparent, heuristic answer feedback - no black-box scores.
  - img
  - text: Target Role
  - textbox "e.g. Backend Engineer"
  - img
  - text: Company (optional)
  - textbox "e.g. Stripe"
  - img
  - text: Questions 5
  - slider: "5"
  - button "Paste resume text for resume-specific questions (optional)":
    - img
    - text: Paste resume text for resume-specific questions (optional)
  - button "Paste the job description for JD-tailored questions (optional)":
    - img
    - text: Paste the job description for JD-tailored questions (optional)
  - button "Start Practice Session" [disabled]:
    - img
    - text: Start Practice Session
    - img
  - paragraph: Sessions are stored by the backend so you can resume or review them later from the Interview tab.
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Placemind Internal App & SaaS Navigation Suite', () => {
  4  |   test('Landing Page (Untouched) renders flawlessly', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await expect(page).toHaveTitle(/Placemind/);
  8  |     await expect(page.locator('h1')).toBeVisible();
  9  |   });
  10 | 
  11 |   test('Dashboard loads persistent sidebar, quick action cards and stats', async ({ page }) => {
  12 |     await page.goto('/dashboard');
  13 |     await page.waitForLoadState('networkidle');
  14 |     await expect(page.getByText('Welcome back, Rohan')).toBeVisible();
  15 |     await expect(page.getByText('Upload & Parse Resume')).toBeVisible();
  16 |     await expect(page.getByText('Recent Resumes')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('Resume Upload Wizard supports in-memory parsing checklist', async ({ page }) => {
  20 |     await page.goto('/resumes/upload');
  21 |     await page.waitForLoadState('networkidle');
  22 |     await expect(page.getByText('Upload & Audit Your Resume')).toBeVisible();
  23 |     await expect(page.getByText('Drag and drop your resume PDF here')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('ATS Gap Analysis renders prominent 89.4% score and gap report', async ({ page }) => {
  27 |     await page.goto('/resumes/stripe-staff/analyze');
  28 |     await page.waitForLoadState('networkidle');
  29 |     await expect(page.getByText('89.4%')).toBeVisible();
  30 |     await expect(page.getByText('Semantic Coverage')).toBeVisible();
  31 |     await expect(page.getByText('Apache Kafka Stream Processing')).toBeVisible();
  32 |   });
  33 | 
  34 |   test('Resume Editor loads two-pane canvas with inline XYZ rewrites', async ({ page }) => {
  35 |     await page.goto('/resumes/stripe-staff/edit');
  36 |     await page.waitForLoadState('networkidle');
  37 |     await expect(page.getByText('Experience Optimization Studio')).toBeVisible();
  38 |     await expect(page.getByText('Accept & Apply').first()).toBeVisible();
  39 |   });
  40 | 
  41 |   test('Interview Setup wizard shows detected weak areas and mode toggle', async ({ page }) => {
  42 |     await page.goto('/interview/new');
  43 |     await page.waitForLoadState('networkidle');
  44 |     await expect(page.getByText('Configure Your Mock Interview')).toBeVisible();
> 45 |     await expect(page.getByText('Distributed Kafka Systems')).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  46 |   });
  47 | 
  48 |   test('Live Interview session minimizes chrome and loads conversational chat', async ({ page }) => {
  49 |     await page.goto('/interview/sess-12345');
  50 |     await page.waitForLoadState('networkidle');
  51 |     await expect(page.getByText('Placemind Live Session')).toBeVisible();
  52 |     await expect(page.getByText('End Session')).toBeVisible();
  53 |   });
  54 | 
  55 |   test('Interview Report renders multi-dimensional radar chart and review', async ({ page }) => {
  56 |     await page.goto('/interview/sess-12345/report');
  57 |     await page.waitForLoadState('networkidle');
  58 |     await expect(page.getByText('Overall Interview Score')).toBeVisible();
  59 |     await expect(page.getByText('STAR Structure')).toBeVisible();
  60 |   });
  61 | 
  62 |   test('History archive page renders scannable data table and tabs', async ({ page }) => {
  63 |     await page.goto('/history');
  64 |     await page.waitForLoadState('networkidle');
  65 |     await expect(page.getByText('Activity History & Document Archive')).toBeVisible();
  66 |     await expect(page.getByText('All Items')).toBeVisible();
  67 |   });
  68 | 
  69 |   test('Settings page renders AI Engine preference toggle (Local vs Cloud)', async ({ page }) => {
  70 |     await page.goto('/settings');
  71 |     await page.waitForLoadState('networkidle');
  72 |     await expect(page.getByText('AI Engine Routing & Egress Control')).toBeVisible();
  73 |     await expect(page.getByText('Always Use Local LM Studio / Ollama (Zero-Egress)')).toBeVisible();
  74 |   });
  75 | });
  76 | 
```