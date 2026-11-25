import { expect, type Locator, type Page } from '@playwright/test';

/** The slide-out order drawer: lines, promo, delivery, totals, checkout, receipt. */
export class OrderDrawer {
  readonly root: Locator;
  readonly lines: Locator;
  readonly promoInput: Locator;
  readonly promoChips: Locator;
  readonly promoError: Locator;
  readonly subtotal: Locator;
  readonly b1t1: Locator;
  readonly promoDiscount: Locator;
  readonly deliveryFee: Locator;
  readonly total: Locator;
  readonly freeDelivery: Locator;
  readonly receipt: Locator;

  constructor(readonly page: Page) {
    this.root = page.getByRole('dialog');
    this.lines = this.root.getByTestId('cart-line');
    this.promoInput = this.root.getByLabel('Promo code');
    this.promoChips = this.root.getByTestId('promo-chip');
    this.promoError = this.root.locator('#promo-error');
    this.subtotal = this.root.getByTestId('subtotal');
    this.b1t1 = this.root.getByTestId('b1t1');
    this.promoDiscount = this.root.getByTestId('promo-discount');
    this.deliveryFee = this.root.getByTestId('delivery-fee');
    this.total = this.root.getByTestId('total');
    this.freeDelivery = this.root.getByTestId('free-delivery');
    this.receipt = this.root.getByTestId('receipt');
  }

  async open() {
    await this.page.getByRole('button', { name: /Your order/ }).click();
    await expect(this.root).toBeVisible();
  }

  async close() {
    await this.root.getByRole('button', { name: 'Close order' }).click();
    await expect(this.root).toBeHidden();
  }

  line(text: string | RegExp): Locator {
    return this.lines.filter({ hasText: text });
  }

  async applyPromo(code: string) {
    await this.promoInput.fill(code);
    await this.root.getByRole('button', { name: 'Apply' }).click();
  }

  async fulfil(how: 'Delivery' | 'Pickup') {
    await this.root.getByRole('radio', { name: how }).check();
  }

  async checkout(form: { name?: string; mobile?: string; address?: string }) {
    await this.root.getByRole('button', { name: 'Checkout' }).click();
    if (form.name !== undefined) await this.root.getByLabel('Name').fill(form.name);
    if (form.mobile !== undefined) await this.root.getByLabel('Mobile number').fill(form.mobile);
    if (form.address !== undefined) await this.root.getByLabel('Delivery address').fill(form.address);
    await this.root.getByRole('button', { name: /Place order/ }).click();
  }
}
