const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/resume', { waitUntil: 'networkidle', timeout: 60000 });
  const btns = await page.getByRole('button').allTextContents();
  console.log('BUTTONS=' + JSON.stringify(btns.map(b => b.slice(0, 40))));
  console.log('URL=' + page.url());
  console.log('TITLE=' + await page.title());
  const tb = await page.getByRole('textbox').count();
  console.log('TEXTBOXES=' + tb);
  await page.screenshot({ path: '/workspaces/PlaceMind/frontend/public/pwdebug.png' });
  await browser.close();
  console.log('DEBUG_DONE');
})().catch(e => { console.error('DEBUG_FAIL', e.message.slice(0, 300)); process.exit(1); });
