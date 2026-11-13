const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/resume', { waitUntil: 'networkidle', timeout: 60000 });
  const fill = async (ph, v) => page.fill(`[placeholder="${ph}"]`, v);
  await fill('Your name', 'Alex Doe');
  await page.locator('[placeholder="e.g. Backend Engineer"]').first().fill('Backend Engineer');
  await page.locator('[placeholder="e.g. Backend Engineer"]').nth(1).fill('Backend Engineer');
  await fill('you@example.com', 'alex.doe@example.com');
  await fill('Optional', '+91 90000 00000');
  await fill('2-3 sentences about your experience', 'Backend engineer with 3 years building Python APIs and data pipelines.');
  await fill('Python, FastAPI, PostgreSQL', 'Python, FastAPI, PostgreSQL, Redis, Docker');
  await fill('Employer name', 'ExampleCorp');
  await page.locator('[placeholder*="Built FastAPI services"]').fill('Built FastAPI services serving 2M requests/day\nCut p95 latency from 800ms to 240ms');
  await fill('e.g. B.Tech Computer Science', 'B.Tech Computer Science');
  await fill('University name', 'Example University');
  await fill('e.g. 2023', '2023');
  await page.waitForTimeout(1200);
  await page.emulateMedia({ media: 'print' });
  const fs = require('fs');
  const counts = {};
  for (const fam of ['Classic', 'Modern', 'Compact', 'Academic']) {
    await page.getByRole('button', { name: new RegExp(fam) }).first().click();
    await page.waitForTimeout(800);
    const p = `/workspaces/PlaceMind/frontend/public/print-${fam.toLowerCase()}.pdf`;
    await page.pdf({ path: p, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const s = fs.readFileSync(p).toString('latin1');
    counts[fam] = (s.match(/\/Count\s+(\d+)/) || [])[1] || '?';
  }
  // Long-content pagination: 14 bullets + long summary
  await page.emulateMedia({ media: 'screen' });
  await fill('2-3 sentences about your experience', 'Backend engineer with 3 years building Python APIs and data pipelines. Experienced in high-throughput services, caching layers, observability, incident response, database tuning, asynchronous workers, API design, and mentoring. Comfortable owning services end to end from design to production.');
  const bullets = Array.from({length: 14}, (_, i) => `Achievement ${i+1}: delivered measurable impact on service reliability, latency, and developer productivity across the platform`).join('\n');
  await page.locator('[placeholder*="Built FastAPI services"]').fill(bullets);
  await fill('Python, FastAPI, PostgreSQL', 'Python, FastAPI, PostgreSQL, Redis, Docker, Kafka, Kubernetes, AWS, Terraform, Grafana, Pytest, Celery');
  await page.waitForTimeout(1200);
  await page.emulateMedia({ media: 'print' });
  const lp = '/workspaces/PlaceMind/frontend/public/print-long.pdf';
  await page.pdf({ path: lp, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const ls = fs.readFileSync(lp).toString('latin1');
  counts['Long'] = (ls.match(/\/Count\s+(\d+)/) || [])[1] || '?';
  await browser.close();
  console.log('NODE=' + process.version);
  console.log('COUNTS=' + JSON.stringify(counts));
  console.log('PDF_CHECK2_DONE');
})().catch(e => { console.error('PDF_CHECK2_FAIL', e.message); process.exit(1); });
