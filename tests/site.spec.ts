import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`home page has no accessibility violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    // scroll through so the lazy demos are on the page when axe runs
    for (const demo of await page.locator('.demo').all()) await demo.scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: '/lockin' })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test('resume page has no accessibility violations', async ({ page }) => {
  await page.goto('/resume/');
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test('i toggles inspect mode and the drawer counts renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wang Zhao', level: 1 })).toBeVisible();
  await page.keyboard.press('i');
  const drawer = page.getByRole('complementary', { name: 'Inspect' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('row', { name: /PlatformMap/ })).toBeVisible();
  await page.keyboard.press('i');
  await expect(drawer).toBeHidden();
});
