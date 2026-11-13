# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prompt-to-template.spec.ts >> Prompt-to-Template Studio Screen >> Displays preset fallback badge when source="fallback"
- Location: tests/prompt-to-template.spec.ts:89:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#fallback-badge')
Expected substring: "Preset Fallback"
Received string:    "Preset layout - sample content"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#fallback-badge')
    14 × locator resolved to <span id="fallback-badge" title="No live model is configured, so a keyword-matched preset layout with sample placeholder content was used - edit before use" class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold">…</span>
       - unexpected value "Preset layout - sample content"

```

```yaml
- img
- text: Preset layout - sample content
```

# Test source

```ts
  28  |     expect(bodyText).not.toContain('Workday/Greenhouse Verified');
  29  |     expect(bodyText).not.toContain('% ATS');
  30  | 
  31  |     // Live Resume Preview
  32  |     await expect(page.locator('#resume-preview-sheet')).toBeVisible();
  33  |     await expect(page.locator('text=Color & Accessibility Engine')).toBeVisible();
  34  |   });
  35  | 
  36  |   test('Generates template via mocked API and updates live preview', async ({ page }) => {
  37  |     // Intercept and mock API response
  38  |     await page.route('**/api/v1/templates/generate', async (route) => {
  39  |       await route.fulfill({
  40  |         status: 200,
  41  |         contentType: 'application/json',
  42  |         body: JSON.stringify({
  43  |           style: {
  44  |             layout: 'single_column',
  45  |             font: 'Georgia',
  46  |             size_pt: 11.0,
  47  |             density: 'normal',
  48  |             header_style: 'left',
  49  |             section_order: ['summary', 'skills', 'experience', 'projects', 'education'],
  50  |             mood: 'tech',
  51  |             hue: 195,
  52  |           },
  53  |           content: {
  54  |             headline: 'Mocked Senior Cloud Architect',
  55  |             summary: 'Experienced cloud systems architect with multi-region AWS expertise.',
  56  |             skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
  57  |             experience: [
  58  |               {
  59  |                 role: 'Principal Architect',
  60  |                 company: 'Mock Cloud Inc',
  61  |                 bullets: ['Designed multi-region failover handling 10M events/day.'],
  62  |               },
  63  |             ],
  64  |             projects: [],
  65  |             education: [],
  66  |           },
  67  |           warnings: [],
  68  |           latency_ms: 32.5,
  69  |           source: 'model',
  70  |         }),
  71  |       });
  72  |     });
  73  | 
  74  |     await page.goto('/template');
  75  |     await page.waitForLoadState('domcontentloaded');
  76  | 
  77  |     // Fill prompt and trigger generation
  78  |     await page.fill('#prompt-input', 'cloud architect resume in blue');
  79  |     await page.click('#generate-template-btn');
  80  | 
  81  |     // Verify preview updates with mocked model data
  82  |     await expect(page.locator('#resume-preview-sheet')).toContainText(
  83  |       'Mocked Senior Cloud Architect'
  84  |     );
  85  |     await expect(page.locator('#resume-preview-sheet')).toContainText('Mock Cloud Inc');
  86  |     await expect(page.locator('#model-badge')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('Displays preset fallback badge when source="fallback"', async ({ page }) => {
  90  |     await page.route('**/api/v1/templates/generate', async (route) => {
  91  |       await route.fulfill({
  92  |         status: 200,
  93  |         contentType: 'application/json',
  94  |         body: JSON.stringify({
  95  |           style: {
  96  |             layout: 'single_column',
  97  |             font: 'Calibri',
  98  |             size_pt: 10.0,
  99  |             density: 'compact',
  100 |             header_style: 'left',
  101 |             section_order: ['skills', 'experience', 'projects', 'education', 'summary'],
  102 |             mood: 'minimal',
  103 |             hue: 240,
  104 |           },
  105 |           content: {
  106 |             headline: 'Fallback Dev Engineer',
  107 |             summary: 'Fallback content preserved safely.',
  108 |             skills: ['Python', 'SQL'],
  109 |             experience: [],
  110 |             projects: [],
  111 |             education: [],
  112 |           },
  113 |           warnings: ['Used fallback preset Classic due to model schema error.'],
  114 |           latency_ms: 45.0,
  115 |           source: 'fallback',
  116 |         }),
  117 |       });
  118 |     });
  119 | 
  120 |     await page.goto('/template');
  121 |     await page.waitForLoadState('domcontentloaded');
  122 | 
  123 |     await page.fill('#prompt-input', 'complex request');
  124 |     await page.click('#generate-template-btn');
  125 | 
  126 |     // Verify fallback badge is visible
  127 |     await expect(page.locator('#fallback-badge')).toBeVisible();
> 128 |     await expect(page.locator('#fallback-badge')).toContainText('Preset Fallback');
      |                                                   ^ Error: expect(locator).toContainText(expected) failed
  129 |   });
  130 | 
  131 |   test('Demo Mode generates instantly without triggering backend network call', async ({
  132 |     page,
  133 |   }) => {
  134 |     let apiCalled = false;
  135 |     await page.route('**/api/v1/templates/generate', async (route) => {
  136 |       apiCalled = true;
  137 |       await route.fulfill({ status: 500, body: 'Should not be called in demo mode' });
  138 |     });
  139 | 
  140 |     await page.goto('/template');
  141 |     await page.waitForLoadState('domcontentloaded');
  142 | 
  143 |     // Toggle Demo Mode
  144 |     await page.check('#demo-mode-toggle');
  145 |     await expect(page.locator('text=Offline Mode Active')).toBeVisible();
  146 | 
  147 |     // Click quick example chip
  148 |     await page.click('button:has-text("clean dark-teal resume for a fresher data analyst")');
  149 |     await page.click('#generate-template-btn');
  150 | 
  151 |     // Confirm preview updates
  152 |     await expect(page.locator('#resume-preview-sheet')).toContainText(
  153 |       'Associate Data Analyst'
  154 |     );
  155 |     // Confirm backend was NOT called
  156 |     expect(apiCalled).toBe(false);
  157 |   });
  158 | 
  159 |   test('Displays ATS Readiness Report with score, top recommendations, and limits note', async ({
  160 |     page,
  161 |   }) => {
  162 |     await page.route('**/api/v1/ats/score-doc', async (route) => {
  163 |       await route.fulfill({
  164 |         status: 200,
  165 |         contentType: 'application/json',
  166 |         body: JSON.stringify({
  167 |           overall: 88.0,
  168 |           categories: { structure: 92.0, formatting: 90.0, keywords: 82.0, semantic: 85.0 },
  169 |           items: [
  170 |             {
  171 |               rule_id: 'headings_present',
  172 |               category: 'structure',
  173 |               passed: true,
  174 |               points: 100.0,
  175 |               evidence: 'All 5 standard sections populated in order.',
  176 |               fix: 'No action needed. Standard headings are clearly recognizable.',
  177 |             },
  178 |             {
  179 |               rule_id: 'contact_info_body',
  180 |               category: 'structure',
  181 |               passed: true,
  182 |               points: 100.0,
  183 |               evidence: 'Contact details accessible in text.',
  184 |               fix: 'No action needed. Contact info is fully machine-readable.',
  185 |             },
  186 |             {
  187 |               rule_id: 'bullet_style',
  188 |               category: 'formatting',
  189 |               passed: true,
  190 |               points: 85.0,
  191 |               evidence: 'Bullets begin with strong action verbs.',
  192 |               fix: 'No action needed. Bullet points are concise and action-oriented.',
  193 |             },
  194 |           ],
  195 |           top_fixes: ['Paste target Job Description for exact keyword alignment.'],
  196 |           limits_note:
  197 |             "This readiness score is an automated estimation based on standard ATS parsing heuristics and keyword alignment. It does not reflect any proprietary or specific employer's internal ATS algorithm.",
  198 |         }),
  199 |       });
  200 |     });
  201 | 
  202 |     await page.goto('/template');
  203 |     await page.waitForLoadState('domcontentloaded');
  204 | 
  205 |     // Verify ATS Readiness Panel is visible
  206 |     const atsPanel = page.locator('#ats-readiness-panel');
  207 |     await expect(atsPanel).toBeVisible();
  208 | 
  209 |     // Verify score and mandatory disclaimer note
  210 |     await expect(page.locator('#ats-overall-score')).toBeVisible();
  211 |     await expect(page.locator('#ats-limits-note')).toContainText(
  212 |       'This readiness score is an automated estimation based on standard ATS parsing heuristics'
  213 |     );
  214 |     await expect(page.locator('#ats-limits-note')).toContainText(
  215 |       "It does not reflect any proprietary or specific employer's internal ATS algorithm."
  216 |     );
  217 | 
  218 |     // Verify rule toggle shows heuristic breakdown
  219 |     await page.click('#toggle-rule-details-btn');
  220 |     await expect(page.locator('text=headings present')).toBeVisible();
  221 |     await expect(page.locator('text=bullet style')).toBeVisible();
  222 |   });
  223 | });
  224 | 
```