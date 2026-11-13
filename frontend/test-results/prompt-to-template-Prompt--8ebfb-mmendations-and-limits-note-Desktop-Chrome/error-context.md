# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prompt-to-template.spec.ts >> Prompt-to-Template Studio Screen >> Displays ATS Readiness Report with score, top recommendations, and limits note
- Location: tests/prompt-to-template.spec.ts:159:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#ats-overall-score')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#ats-overall-score')

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
  - text: Templates
  - link "Upload Resume":
    - /url: /resumes/upload
    - button "Upload Resume":
      - img
      - text: Upload Resume
- main:
  - heading "Prompt-to-Template Generator" [level=1]
  - paragraph: Synthesize ATS-compliant single-column layouts, tailored resume content, and WCAG 4.5:1 color palettes.
  - text: Demo Mode
  - checkbox "Demo Mode"
  - img
  - text: Describe Your Resume & Style 65 / 500 chars
  - textbox "Describe Your Resume & Style":
    - /placeholder: e.g. clean dark-teal resume for a fresher data analyst, projects first
    - text: clean dark-teal resume for a fresher data analyst, projects first
  - text: "Quick Prompts:"
  - button "clean dark-teal resume for a fresher data analyst, projects first"
  - button "modern executive tech lead resume with accent banner"
  - button "compact 1-page software engineer resume"
  - button "academic CV for research scientist with education first"
  - button "+ Add Target Job Description (Optional)"
  - button "Generate Resume":
    - img
    - text: Generate Resume
  - img
  - text: Sample preset (offline demo)
  - img
  - text: 22.1ms
  - heading "Color & Accessibility Engine" [level=3]
  - paragraph: OKLCH spectrum with guaranteed WCAG 4.5:1 contrast
  - text: Mood Preset
  - button "Corporate"
  - button "Tech"
  - button "Creative"
  - button "Minimal"
  - button "Finance"
  - text: Hue Angle 195°
  - slider "Hue Angle": "195"
  - text: Custom Brand Hex (Optional)
  - textbox "Custom Brand Hex (Optional)":
    - /placeholder: "#3B82F6"
  - text: "Generated Palette BG #F6FBFB Ink #0A1414 Muted #465656 Accent #00666B Rule #D5E1E0 Accessibility Audit (WCAG 2.1) Body Text 17.91:1 PASS Accent Heading 6.46:1 PASS Grayscale 6.46:1 PASS Active Architecture Spec Layout sidebar header Typography Arial (11pt) Density normal Header Style banner Modern Tech • Arial • 11pt • normal"
  - button "Export to PDF (Print)"
  - heading "Candidate Resume" [level=1]
  - paragraph: Full-Stack Software Architect
  - heading "Professional Summary" [level=2]
  - paragraph: Versatile engineer with 6+ years architecting scalable cloud services, real-time reactive frontends, and AI pipelines.
  - heading "Core Competencies & Skills" [level=2]
  - text: TypeScript Next.js Python FastAPI Kubernetes Docker PostgreSQL Redis
  - heading "Work Experience" [level=2]
  - text: Senior Full-Stack Engineer [High-Growth Startup]
  - list:
    - listitem: Engineered microservices handling [X]k concurrent user sessions with [X]% uptime.
    - listitem: Optimized frontend Time-to-Interactive by [X]% using Next.js partial pre-rendering.
  - heading "Key Projects" [level=2]
  - text: Distributed Vector Memory Engine github.com/example/vector-mem
  - paragraph: High-throughput RAG search engine with pgvector indexing.
  - list:
    - listitem: Reduced similarity lookup latency from [X]ms to [X]ms.
  - heading "Education & Credentials" [level=2]
  - text: B.S. in Computer Science 2020
  - paragraph: "[Top University]"
  - img
  - heading "ATS Readiness Audit" [level=3]
  - paragraph: Audit this resume against standard ATS parsing heuristics, keyword alignment, and structural rules.
  - button "Calculate Readiness Score":
    - img
    - text: Calculate Readiness Score
- alert
```

# Test source

```ts
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
  128 |     await expect(page.locator('#fallback-badge')).toContainText('Preset Fallback');
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
> 210 |     await expect(page.locator('#ats-overall-score')).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
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