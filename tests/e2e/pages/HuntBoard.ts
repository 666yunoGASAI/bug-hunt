import { expect, type Locator, type Page } from '@playwright/test';

export class HuntBoard {
  readonly cards: Locator;
  readonly caughtCards: Locator;
  readonly score: Locator;
  readonly toggle: Locator;
  readonly reset: Locator;

  constructor(readonly page: Page) {
    this.cards = page.getByTestId('bug-card');
    this.caughtCards = page.locator('[data-testid="bug-card"][data-caught="true"]');
    this.score = page.getByTestId('hunt-score');
    this.toggle = page.getByRole('button', { name: /Turn (on|off) Hunt mode/ });
    this.reset = page.getByRole('button', { name: 'Reset my progress' });
  }

  async goto() {
    await this.page.goto('/#/hunt');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Bug Hunt' })).toBeVisible();
  }
}
