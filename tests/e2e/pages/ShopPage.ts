import { expect, type Locator, type Page } from '@playwright/test';

export interface DrinkChoice {
  drink: string;
  size?: 'Regular' | 'Large';
  sugar?: 'No sugar' | '25% sugar' | '50% sugar' | '75% sugar' | 'Full sugar';
  ice?: 'No ice' | 'Less ice' | 'Regular ice';
  toppings?: string[];
  qty?: number;
}

/** The order page: menu + drink builder. */
export class ShopPage {
  readonly addButton: Locator;
  readonly cartButton: Locator;
  readonly cartCount: Locator;
  readonly toppingError: Locator;
  readonly sugarValue: Locator;
  readonly b1t1Ribbon: Locator;
  readonly huntPill: Locator;
  readonly toast: Locator;
  readonly bugToast: Locator;
  readonly qtyMore: Locator;

  constructor(readonly page: Page) {
    this.addButton = page.getByTestId('add-to-order');
    this.cartButton = page.getByRole('button', { name: /Your order/ });
    this.cartCount = page.getByTestId('cart-count');
    this.toppingError = page.locator('.builder').getByRole('alert');
    this.sugarValue = page.getByTestId('sugar-value');
    this.b1t1Ribbon = page.getByTestId('b1t1-ribbon');
    this.huntPill = page.getByTestId('hunt-pill');
    this.toast = page.getByTestId('toast');
    this.bugToast = page.getByTestId('bug-toast');
    this.qtyMore = page.getByRole('group', { name: 'Quantity' }).getByRole('button', { name: 'One more' });
  }

  async goto() {
    await this.page.goto('/#/order');
    await expect(this.page.getByRole('heading', { name: 'Build your boba.' })).toBeVisible();
  }

  topping(name: string): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(`^${name}`) });
  }

  async choose(choice: DrinkChoice) {
    await this.page.getByRole('button', { name: new RegExp(`^${choice.drink}`) }).click();
    await expect(this.page.getByRole('heading', { level: 2, name: choice.drink })).toBeVisible();
    const size = choice.size === 'Large' ? this.page.getByRole('radio', { name: /^Large/ }) : this.page.getByRole('radio', { name: 'Regular', exact: true });
    await size.check();
    await this.page.getByRole('radio', { name: choice.sugar ?? '50% sugar', exact: true }).check();
    await this.page.getByRole('radio', { name: choice.ice ?? 'Regular ice', exact: true }).check();
    // Clear toppings left over from the previous drink, then pick these.
    for (const box of await this.page.getByRole('checkbox').all()) {
      if (await box.isChecked()) await box.click();
    }
    for (const t of choice.toppings ?? []) await this.topping(t).click();
    for (let i = 1; i < (choice.qty ?? 1); i++) await this.qtyMore.click();
  }

  /** Builds a drink and adds it to the order. */
  async add(choice: DrinkChoice) {
    await this.choose(choice);
    await this.addButton.click();
    await expect(this.toast.last()).toContainText(`Added ${choice.qty ?? 1} × ${choice.drink}`);
  }
}
