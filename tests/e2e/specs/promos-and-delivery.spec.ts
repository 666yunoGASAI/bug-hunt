import { expect, test } from '../fixtures';

test.describe('Promo codes and delivery', () => {
  test.beforeEach(async ({ shop }) => {
    await shop.goto();
  });

  test('promo codes work however they are typed', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Brown Sugar Fresh Milk', qty: 2 }); // ₱258
    await drawer.open();
    await drawer.applyPromo('  boba10 ');
    await expect(drawer.promoChips).toHaveCount(1);
    await expect(drawer.promoChips.first()).toContainText('BOBA10');
    await expect(drawer.promoDiscount).toHaveText('₱25.80');
  });

  test('applying the same code twice does not double the discount', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Brown Sugar Fresh Milk', qty: 2 });
    await drawer.open();
    await drawer.applyPromo('BOBA10');
    await drawer.applyPromo('BOBA10');
    await expect(drawer.promoChips).toHaveCount(1);
    await expect(drawer.promoDiscount).toHaveText('₱25.80');
    await expect(drawer.total).toHaveText('₱281.20'); // 258 − 25.80 + 49
  });

  test('an unknown code is explained, and nothing is applied', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Classic Milk Tea' });
    await drawer.open();
    await drawer.applyPromo('FREEBOBA');
    await expect(drawer.promoError).toHaveText('"FREEBOBA" isn\'t a valid promo code.');
    await expect(drawer.promoChips).toHaveCount(0);
  });

  test('WELCOME50 under ₱300 says how much more to add', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Matcha Latte' }); // ₱139
    await drawer.open();
    await drawer.applyPromo('WELCOME50');
    await expect(drawer.root.getByText('Add ₱161 more to use WELCOME50.')).toBeVisible();
    await expect(drawer.promoDiscount).toHaveCount(0);
  });

  test('BOBA10 amounts are rounded to centavos (₱307 → ₱30.70 off)', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Classic Milk Tea' });
    await shop.add({ drink: 'Wintermelon' });
    await shop.add({ drink: 'Thai Milk Tea' });
    await drawer.open();
    await drawer.applyPromo('BOBA10');
    await expect(drawer.promoDiscount).toHaveText('₱30.70');
    await expect(drawer.total).toHaveText('₱325.30');
  });

  test('delivery is free at exactly ₱500 @smoke', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Classic Milk Tea', qty: 4 }); // 396
    await shop.add({ drink: 'Matcha Latte', toppings: ['Black pearls'] }); // 154 → 550
    await drawer.open();
    await drawer.applyPromo('WELCOME50'); // 550 − 50 = exactly 500

    await expect(drawer.deliveryFee).toHaveText('Free');
    await expect(drawer.freeDelivery).toContainText('Free delivery unlocked');
    await expect(drawer.total).toHaveText('₱500.00');
  });

  test('the free-delivery meter counts down, and pickup skips delivery', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Taro Milk Tea' }); // 119
    await drawer.open();
    await expect(drawer.freeDelivery).toContainText('Add ₱381.00 more for free delivery');
    await drawer.fulfil('Pickup');
    await expect(drawer.deliveryFee).toHaveText('Pickup');
    await expect(drawer.freeDelivery).toBeHidden();
    await expect(drawer.total).toHaveText('₱119.00');
  });
});
