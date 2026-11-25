import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures';

test.describe('Accessibility', () => {
  test('a keyboard-only customer can build and add a drink @smoke', async ({ shop, page }) => {
    await shop.goto();
    await shop.qtyMore.focus();
    await page.keyboard.press('Tab');
    await expect(shop.addButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(shop.cartCount).toHaveText('1');
  });

  test('the order drawer closes with Escape and gives focus back', async ({ shop, drawer, page }) => {
    await shop.goto();
    await drawer.open();
    await expect(drawer.root.getByRole('button', { name: 'Close order' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(drawer.root).toBeHidden();
    await expect(shop.cartButton).toBeFocused();
  });

  const scan = (page: import('@playwright/test').Page) =>
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

  test('order page has no WCAG A/AA violations', async ({ shop, page }) => {
    await shop.goto();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('order drawer with drinks and a promo has no violations', async ({ shop, drawer, page }) => {
    await shop.goto();
    await shop.add({ drink: 'Matcha Latte', toppings: ['Cream cheese foam'] });
    await drawer.open();
    await drawer.applyPromo('WELCOME50');
    expect((await scan(page)).violations).toEqual([]);
  });

  test('checkout errors have no violations', async ({ shop, drawer, page }) => {
    await shop.goto();
    await shop.add({ drink: 'Classic Milk Tea' });
    await drawer.open();
    await drawer.checkout({ name: '' });
    expect((await scan(page)).violations).toEqual([]);
  });

  test('landing page has no violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('hunt board has no violations', async ({ hunt, page }) => {
    await hunt.goto();
    expect((await scan(page)).violations).toEqual([]);
  });
});
