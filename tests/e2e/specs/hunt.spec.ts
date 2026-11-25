/** The game layer: Hunt mode, bug reveals, progress. */
import { expect, test } from '../fixtures';

test.describe('Hunt mode', () => {
  test.describe('starting with Hunt mode off', () => {
    test.use({ bugs: 'none' });

    test('turning Hunt mode on and off from the board', async ({ hunt, shop }) => {
    await hunt.goto();
    await expect(shop.huntPill).toBeHidden();
    await hunt.toggle.click();
    await expect(shop.huntPill).toBeVisible();
    await expect(hunt.toggle).toHaveText('Turn off Hunt mode');
    await hunt.toggle.click();
    await expect(shop.huntPill).toBeHidden();
    });
  });

  test.describe('with every bug on', () => {
    test.use({ bugs: 'all' });

    test('triggering a bug reveals it on the board', async ({ shop, drawer, hunt }) => {
      await shop.goto();
      await expect(shop.huntPill).toBeVisible();

      // Bug 3: lowercase promo code.
      await shop.add({ drink: 'Classic Milk Tea' });
      await drawer.open();
      await drawer.applyPromo('boba10');
      await expect(shop.bugToast.filter({ hasText: 'Bug caught: Promo codes are case-sensitive' })).toBeVisible();
      await drawer.close();

      // Bug 2: a 4th topping.
      await shop.choose({ drink: 'Thai Milk Tea', toppings: ['Black pearls', 'Nata de coco', 'Egg pudding', 'Popping boba'] });
      await expect(shop.bugToast.filter({ hasText: 'Bug caught: A 4th topping sneaks in' })).toBeVisible();

      await hunt.goto();
      await expect(hunt.caughtCards).toHaveCount(2);
      await expect(hunt.score).toContainText('2 of 10 bugs caught');
      await expect(hunt.caughtCards.first()).toContainText('A 4th topping sneaks in');

      await hunt.reset.click();
      await expect(hunt.caughtCards).toHaveCount(0);
    });
  });
});
