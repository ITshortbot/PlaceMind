import { test, expect } from '@playwright/test';
for (const width of [320, 390]) {
 test(`mobile ${width}: preview fits and editor stays clear`, async ({page}) => {
  await page.setViewportSize({width,height:700}); await page.goto('/resume');
  await page.getByPlaceholder('Your name').fill('Synthetic Fit Candidate');
  await page.getByRole('button',{name:'A4 Preview',exact:true}).click();
  const sheet=page.locator('#resume-preview-sheet'); const box=await sheet.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Content Editor',exact:true}).click();
  const year=page.getByPlaceholder('e.g. 2023').first(); await year.scrollIntoViewIfNeeded(); await year.fill('2026');
  const y=await year.boundingBox(); const dock=await page.locator('form.glass-frosted-dark').boundingBox();
  expect(y!.y+y!.height).toBeLessThan(dock!.y);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(701);
 });
}
test('home long reply ends above dock without page scroll',async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.route('**/api/v1/chat**',r=>r.fulfill({json:{reply:'Synthetic response. '.repeat(100)+' END_MARKER',actions:[],model_used:'Test',is_fallback:true}}));
 await page.goto('/dashboard');
 const input=page.locator('form.glass-frosted-dark input');
 await input.fill('Synthetic'); await input.press('Enter');
 const reply=page.getByText(/END_MARKER/); await expect(reply).toBeVisible(); await page.waitForTimeout(600);
 const box=await reply.boundingBox(); const dock=await page.locator('form.glass-frosted-dark').boundingBox();
 expect(box!.y+box!.height).toBeLessThan(dock!.y);
 expect(await page.evaluate(()=>scrollY)).toBe(0);
});
