import { expect, test } from '../fixtures';

test.describe('Saved order', () => {
  test('the order, promo and delivery choice survive a reload @smoke', async ({ shop, drawer, page }) => {
    await shop.goto();
    await shop.add({ drink: 'Taro Milk Tea', toppings: ['Egg pudding'] });
    await drawer.open();
    await drawer.applyPromo('BOBA10');
    await drawer.fulfil('Pickup');

    await page.reload();
    await expect(shop.cartCount).toHaveText('1');
    await drawer.open();
    await expect(drawer.lines.first()).toContainText('Taro Milk Tea');
    await expect(drawer.promoChips).toHaveCount(1);
    await expect(drawer.deliveryFee).toHaveText('Pickup');
  });

  test('corrupted saved data starts a fresh order instead of crashing', async ({ shop, page }) => {
    await page.addInitScript(() => localStorage.setItem('boba-bar:cart', '{not json'));
    await shop.goto();
    await expect(shop.cartCount).toHaveText('0');
  });
});
