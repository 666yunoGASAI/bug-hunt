import { expect, test } from '../fixtures';

test.describe('Landing page', () => {
  test.use({ bugs: 'none' });

  test('introduces the shop and the hunt @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the boba. Find the bugs.');
    await expect(page.getByText('A milk tea shop with 10 bugs hiding inside')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
  });

  test('"Order a boba" opens the shop with Hunt mode off', async ({ page, shop }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Order a boba' }).click();
    await expect(page.getByRole('heading', { name: 'Build your boba.' })).toBeVisible();
    await expect(shop.huntPill).toBeHidden();
  });

  test('"Start the hunt" switches Hunt mode on and opens the board', async ({ page, shop, hunt }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start the hunt' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bug Hunt' })).toBeVisible();
    await expect(shop.huntPill).toBeVisible();
    await expect(hunt.toggle).toHaveText('Turn off Hunt mode');

    await page.getByRole('link', { name: 'Boba Bar home' }).click();
    await expect(page.getByRole('button', { name: /Back to the hunt · 0\/10/ })).toBeVisible();
  });
});
