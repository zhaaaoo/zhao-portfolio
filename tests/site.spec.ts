import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).analyze()).violations.map((v) => `${v.id}: ${v.nodes.length}`);

for (const colorScheme of ['light', 'dark'] as const) {
  test(`plain view has no accessibility violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/?plain');
    for (const demo of await page.locator('.demo').all()) await demo.scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: '/lockin' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`desk view has no accessibility violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Work' }).click();
    await expect(page.getByText('A faster, configurable validation CLI')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test('resume page has no accessibility violations', async ({ page }) => {
  await page.goto('/resume/');
  expect(await violations(page)).toEqual([]);
});

test('terminal opens windows from commands', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Terminal' }).click();
  const input = page.getByLabel('Terminal command');
  await input.fill('cat work/validation.md');
  await input.press('Enter');
  await expect(page.getByText(/about an hour to about 15 minutes/)).toBeVisible();
  await input.fill('open browhen');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: 'browhen.app' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'browhen.app' })).toBeHidden();
});

test('i toggles inspect mode and the drawer counts renders', async ({ page }) => {
  await page.goto('/?plain');
  await expect(page.getByRole('heading', { name: 'Wang Zhao', level: 1 })).toBeVisible();
  await page.keyboard.press('i');
  const drawer = page.getByRole('complementary', { name: 'Inspect' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('row', { name: /Section Work/ })).toBeVisible();
  await page.keyboard.press('i');
  await expect(drawer).toBeHidden();
});
