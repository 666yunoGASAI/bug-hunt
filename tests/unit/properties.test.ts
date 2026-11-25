/**
 * Property-based tests: rules that must hold for ANY order fast-check can invent.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DRINKS, SUGAR_LEVELS, TOPPINGS } from '../../src/lib/menu';
import { round2, totals, unitPrice, type CartLine } from '../../src/lib/order';

const lineArb = fc.record({
  drinkId: fc.constantFrom(...DRINKS.map((d) => d.id)),
  size: fc.constantFrom('regular' as const, 'large' as const),
  sugar: fc.constantFrom(...SUGAR_LEVELS),
  ice: fc.constantFrom('no-ice' as const, 'less-ice' as const, 'regular-ice' as const),
  toppings: fc.uniqueArray(fc.constantFrom(...TOPPINGS.map((t) => t.id)), { maxLength: 3 }),
  qty: fc.integer({ min: 1, max: 10 }),
  lineId: fc.uuid(),
});
const cartArb = fc.array(lineArb, { maxLength: 6 }) as fc.Arbitrary<CartLine[]>;
const promosArb = fc.constantFrom([], ['BOBA10'], ['WELCOME50']);
const fulfilmentArb = fc.constantFrom('delivery' as const, 'pickup' as const);
const dateArb = fc.date({ min: new Date('2026-01-01'), max: new Date('2027-12-31') });

describe('totals: invariants for any order', () => {
  it('every amount is whole centavos and never negative', () => {
    fc.assert(
      fc.property(cartArb, promosArb, fulfilmentArb, dateArb, (cart, promos, f, now) => {
        const t = totals(cart, promos, f, now);
        for (const value of [t.subtotal, t.b1t1, t.promo, t.delivery, t.total]) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(round2(value)).toBe(value);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('total = subtotal − discounts + delivery, and discounts never exceed the subtotal', () => {
    fc.assert(
      fc.property(cartArb, promosArb, fulfilmentArb, dateArb, (cart, promos, f, now) => {
        const t = totals(cart, promos, f, now);
        expect(t.total).toBe(round2(t.subtotal - t.b1t1 - t.promo + t.delivery));
        expect(t.b1t1 + t.promo).toBeLessThanOrEqual(t.subtotal);
      }),
      { numRuns: 300 },
    );
  });

  it('delivery is ₱49 exactly when the discounted order is under ₱500, else free', () => {
    fc.assert(
      fc.property(cartArb.filter((c) => c.length > 0), promosArb, dateArb, (cart, promos, now) => {
        const t = totals(cart, promos, 'delivery', now);
        const afterDiscounts = round2(t.subtotal - t.b1t1 - t.promo);
        expect(t.delivery).toBe(afterDiscounts >= 500 ? 0 : 49);
        expect(t.freeDeliveryGap).toBe(afterDiscounts >= 500 ? 0 : round2(500 - afterDiscounts));
      }),
      { numRuns: 300 },
    );
  });

  it('Buy 1 Take 1 never frees more than half the drinks, and never the priciest of a pair', () => {
    const tuesday = new Date('2026-12-01T10:00:00+08:00');
    fc.assert(
      fc.property(cartArb, (cart) => {
        const units = cart.flatMap((l) => Array.from({ length: l.qty }, () => unitPrice(l))).sort((a, b) => a - b);
        const t = totals(cart, [], 'pickup', tuesday);
        const half = Math.floor(units.length / 2);
        expect(t.b1t1).toBe(units.slice(0, half).reduce((s, p) => s + p, 0));
      }),
      { numRuns: 300 },
    );
  });

  it('a Large always costs exactly ₱20 more than the same drink in Regular', () => {
    fc.assert(
      fc.property(lineArb, (l) => {
        expect(unitPrice({ ...l, size: 'large' }) - unitPrice({ ...l, size: 'regular' })).toBe(20);
      }),
    );
  });
});
