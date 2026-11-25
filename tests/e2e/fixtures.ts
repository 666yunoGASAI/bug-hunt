/**
 * Shared fixtures.
 *  - bugs:    which planted bugs are on. Defaults to $BUGS (set by the catch matrix) or none.
 *  - clockAt: the time the browser thinks it is. Defaults to a Wednesday so the
 *             Tuesday promo can never change totals by accident when CI runs on a Tuesday.
 */
import { test as base, expect } from '@playwright/test';
import { HuntBoard } from './pages/HuntBoard';
import { OrderDrawer } from './pages/OrderDrawer';
import { ShopPage } from './pages/ShopPage';

export const WEDNESDAY = new Date('2026-11-25T10:00:00+08:00');
export const TUESDAY = new Date('2026-12-01T10:00:00+08:00');

interface Options {
  bugs: string;
  clockAt: Date;
}
interface Fixtures {
  shop: ShopPage;
  drawer: OrderDrawer;
  hunt: HuntBoard;
  setup: void;
}

export const test = base.extend<Fixtures & Options>({
  bugs: [process.env.BUGS ?? 'none', { option: true }],
  clockAt: [WEDNESDAY, { option: true }],
  setup: [
    async ({ page, bugs, clockAt }, use) => {
      // Forced once per tab, so a test can still flip Hunt mode itself and reload.
      await page.addInitScript((value) => {
        if (!sessionStorage.getItem('__e2e_bugs_set')) {
          sessionStorage.setItem('boba-bar:bugs', value);
          sessionStorage.setItem('__e2e_bugs_set', '1');
        }
      }, bugs);
      await page.clock.setFixedTime(clockAt);
      await use();
    },
    { auto: true },
  ],
  shop: async ({ page }, use) => use(new ShopPage(page)),
  drawer: async ({ page }, use) => use(new OrderDrawer(page)),
  hunt: async ({ page }, use) => use(new HuntBoard(page)),
});

export { expect };
