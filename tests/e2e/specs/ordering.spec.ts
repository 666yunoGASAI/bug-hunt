import { expect, test } from '../fixtures';

test.describe('Building and ordering drinks', () => {
  test.beforeEach(async ({ shop }) => {
    await shop.goto();
  });

  test('build a drink, add it, see it in the order @smoke', async ({ shop, drawer }) => {
    await shop.choose({ drink: 'Taro Milk Tea', size: 'Large', sugar: '25% sugar', ice: 'Less ice', toppings: ['Black pearls', 'Egg pudding'] });
    await expect(shop.addButton).toHaveText('Add to order · ₱169.00');
    await shop.addButton.click();
    await expect(shop.cartCount).toHaveText('1');

    await drawer.open();
    await expect(drawer.lines).toHaveCount(1);
    await expect(drawer.lines.first()).toContainText('Taro Milk Tea');
    await expect(drawer.lines.first()).toContainText('Large · 25% sugar · Less ice · Black pearls, Egg pudding');
    await expect(drawer.lines.first().getByTestId('line-price')).toHaveText('₱169.00');
  });

  test('Large costs ₱20 more for the drink, not per topping', async ({ shop }) => {
    await shop.choose({ drink: 'Classic Milk Tea', toppings: ['Black pearls', 'Nata de coco'] });
    await expect(shop.addButton).toHaveText('Add to order · ₱129.00');
    await shop.choose({ drink: 'Classic Milk Tea', size: 'Large', toppings: ['Black pearls', 'Nata de coco'] });
    await expect(shop.addButton).toHaveText('Add to order · ₱149.00');
  });

  test('up to 3 toppings: a 4th is refused with a message', async ({ shop }) => {
    await shop.choose({ drink: 'Thai Milk Tea', toppings: ['Black pearls', 'Nata de coco', 'Egg pudding'] });
    await shop.topping('Popping boba').click();

    await expect(shop.toppingError).toHaveText('You can add up to 3 toppings.');
    await expect(shop.topping('Popping boba')).not.toBeChecked();
    await expect(shop.addButton).toHaveText('Add to order · ₱154.00');
  });

  test('the sweetness label follows the chosen level', async ({ shop, page }) => {
    for (const [label, shown] of [['No sugar', 'No sugar'], ['75% sugar', '75% sugar'], ['Full sugar', 'Full sugar']] as const) {
      await page.getByRole('radio', { name: label, exact: true }).check();
      await expect(shop.sugarValue).toHaveText(shown);
    }
  });

  test('quantity: added in one go, changeable in the order', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Matcha Latte', qty: 3 });
    await expect(shop.cartCount).toHaveText('3');

    await drawer.open();
    const line = drawer.line('Matcha Latte');
    await expect(line.getByTestId('line-price')).toHaveText('₱417.00');
    await line.getByRole('button', { name: 'One less' }).click();
    await expect(line.getByTestId('line-qty')).toHaveText('2');
    await expect(drawer.subtotal).toHaveText('₱278.00');
  });

  test('the same drink made the same way merges into one line', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Wintermelon' });
    await shop.add({ drink: 'Wintermelon' });
    await drawer.open();
    await expect(drawer.lines).toHaveCount(1);
    await expect(drawer.lines.first().getByTestId('line-qty')).toHaveText('2');
  });

  test('removing one of two Taro drinks removes the one you clicked', async ({ shop, drawer }) => {
    await shop.add({ drink: 'Taro Milk Tea' });
    await shop.add({ drink: 'Taro Milk Tea', size: 'Large' });
    await drawer.open();
    await expect(drawer.lines).toHaveCount(2);

    await drawer.root.getByRole('button', { name: 'Remove Taro Milk Tea, Large · 50% sugar · Regular ice' }).click();

    await expect(drawer.lines).toHaveCount(1);
    await expect(drawer.lines.first()).toContainText('Regular · 50% sugar');
  });

  test('an empty order invites you back to the menu', async ({ drawer }) => {
    await drawer.open();
    await expect(drawer.root.getByText('Your order is empty.')).toBeVisible();
    await drawer.root.getByRole('link', { name: 'Browse the menu' }).click();
    await expect(drawer.root).toBeHidden();
  });
});
