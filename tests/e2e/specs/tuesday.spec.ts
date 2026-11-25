/** Buy 1 Take 1 runs on Tuesdays in the Philippines. The browser clock is controlled with page.clock. */
import { expect, test, TUESDAY } from '../fixtures';

test.describe('Buy 1 Take 1 Tuesdays', () => {
  test.describe('on a Tuesday', () => {
    test.use({ clockAt: TUESDAY });

    test('the cheaper drink of a pair is free @smoke', async ({ shop, drawer }) => {
      await shop.goto();
      await expect(shop.b1t1Ribbon).toBeVisible();
      await shop.add({ drink: 'Matcha Latte' }); // 139
      await shop.add({ drink: 'Classic Milk Tea' }); // 99
      await drawer.open();
      await expect(drawer.b1t1).toHaveText('₱99.00');
      await expect(drawer.total).toHaveText('₱188.00'); // 238 − 99 + 49
    });
  });

  test.describe('on a Wednesday', () => {
    test('no promo, no discount', async ({ shop, drawer }) => {
      await shop.goto();
      await expect(shop.b1t1Ribbon).toBeHidden();
      await shop.add({ drink: 'Classic Milk Tea', qty: 2 });
      await drawer.open();
      await expect(drawer.b1t1).toHaveCount(0);
    });
  });

  test.describe('for a customer abroad', () => {
    // Monday 9 a.m. in Los Angeles is already Tuesday 1 a.m. in Manila.
    test.use({ timezoneId: 'America/Los_Angeles', clockAt: new Date('2026-11-30T17:00:00Z') });

    test('Tuesday follows Philippine time, not the device', async ({ shop, page }) => {
      await shop.goto();
      expect(await page.evaluate(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }))).toBe('Monday');
      await expect(shop.b1t1Ribbon).toBeVisible();
    });
  });
});
