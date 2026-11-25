/**
 * The order rules, checked one by one. These run with every bug OFF and must all pass.
 * The catch matrix re-runs them with each planted bug ON to prove they'd catch it.
 */
import { describe, expect, it } from 'vitest';
import {
  addToCart,
  applyPromo,
  b1t1Discount,
  clampQty,
  isB1T1Day,
  itemCount,
  linePrice,
  newLineId,
  normaliseMobile,
  orderNumber,
  promoDiscount,
  removeFromCart,
  round2,
  setQty,
  toggleTopping,
  totals,
  unitPrice,
  validateCheckout,
  type CartLine,
  type DrinkConfig,
} from '../../src/lib/order';
import { formatPeso, sugarLabel } from '../../src/lib/format';

// 2026-11-25 is a Wednesday; 2026-12-01 a Tuesday (Manila).
const WEDNESDAY = new Date('2026-11-25T10:00:00+08:00');
const TUESDAY = new Date('2026-12-01T10:00:00+08:00');

const drink = (drinkId: string, over: Partial<DrinkConfig> = {}): DrinkConfig => ({
  drinkId,
  size: 'regular',
  sugar: 50,
  ice: 'regular-ice',
  toppings: [],
  ...over,
});
let n = 0;
const line = (config: DrinkConfig, qty = 1): CartLine => ({ ...config, qty, lineId: `line-${++n}` });

describe('unit price', () => {
  it.each([
    ['classic regular, no toppings', drink('classic'), 99],
    ['matcha large', drink('matcha', { size: 'large' }), 159],
    ['taro with pearls and pudding', drink('taro', { toppings: ['pearls', 'pudding'] }), 149],
    ['cream cheese foam costs ₱25', drink('thai', { toppings: ['cream-cheese'] }), 134],
  ])('%s → ₱%i', (_, config, expected) => {
    expect(unitPrice(config)).toBe(expected);
  });

  it('a Large surcharge applies once to the drink, never per topping', () => {
    const large = unitPrice(drink('classic', { size: 'large', toppings: ['pearls', 'nata'] }));
    const regular = unitPrice(drink('classic', { toppings: ['pearls', 'nata'] }));
    expect(large - regular).toBe(20);
    expect(large).toBe(149);
  });

  it('line price multiplies by quantity', () => {
    expect(linePrice(line(drink('brown-sugar'), 3))).toBe(387);
  });

  it('rejects unknown drinks and toppings loudly', () => {
    expect(() => unitPrice(drink('kombucha'))).toThrow('Unknown drink');
    expect(() => unitPrice(drink('classic', { toppings: ['gold-flakes'] }))).toThrow('Unknown topping');
  });
});

describe('toppings', () => {
  it('adds and removes toppings', () => {
    expect(toggleTopping([], 'pearls')).toEqual({ ok: true, toppings: ['pearls'] });
    expect(toggleTopping(['pearls', 'nata'], 'pearls')).toEqual({ ok: true, toppings: ['nata'] });
  });

  it('allows exactly 3 toppings and refuses a 4th', () => {
    const three = toggleTopping(['pearls', 'nata'], 'pudding');
    expect(three).toEqual({ ok: true, toppings: ['pearls', 'nata', 'pudding'] });
    expect(toggleTopping(['pearls', 'nata', 'pudding'], 'popping')).toEqual({ ok: false, error: 'You can add up to 3 toppings.' });
  });

  it('can still remove a topping when at the limit', () => {
    expect(toggleTopping(['pearls', 'nata', 'pudding'], 'nata')).toEqual({ ok: true, toppings: ['pearls', 'pudding'] });
  });
});

describe('cart', () => {
  it.each([
    [['pearls', 'nata'], ['nata', 'pearls']],
    [['nata', 'pearls'], ['pearls', 'nata']],
  ])('merges identical drinks into one line, toppings in any order (%j then %j)', (first, second) => {
    let cart = addToCart([], drink('taro', { toppings: first }), 1, 'a');
    cart = addToCart(cart, drink('taro', { toppings: second }), 2, 'b');
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
  });

  it('keeps differently-made drinks as separate lines', () => {
    let cart = addToCart([], drink('taro'), 1, 'a');
    cart = addToCart(cart, drink('taro', { sugar: 25 }), 1, 'b');
    expect(cart.map((l) => l.lineId)).toEqual(['a', 'b']);
  });

  it.each([
    ['a different drink', drink('matcha')],
    ['a different size', drink('taro', { size: 'large' })],
    ['a different sugar level', drink('taro', { sugar: 75 })],
    ['a different ice level', drink('taro', { ice: 'no-ice' })],
    ['different toppings', drink('taro', { toppings: ['pearls'] })],
  ])('does NOT merge %s into the existing line', (_, other) => {
    const cart = addToCart(addToCart([], drink('taro'), 1, 'a'), other, 1, 'b');
    expect(cart.map((l) => [l.lineId, l.qty])).toEqual([['a', 1], ['b', 1]]);
  });

  it('merging updates only the matching line', () => {
    let cart = addToCart([], drink('classic'), 1, 'a');
    cart = addToCart(cart, drink('thai'), 1, 'b');
    cart = addToCart(cart, drink('thai'), 2);
    expect(cart.map((l) => l.qty)).toEqual([1, 3]);
  });

  it('changing quantity touches only that line', () => {
    const cart = [line(drink('classic'), 2), line(drink('thai'), 2)];
    expect(setQty(cart, cart[1].lineId, 7).map((l) => l.qty)).toEqual([2, 7]);
  });

  it('gives every new line a unique id', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newLineId()));
    expect(ids.size).toBe(50);
    expect([...ids].every((id) => /^l[0-9a-z]+$/.test(id))).toBe(true);
  });

  it('removes exactly the line asked for, even when the same drink is in the cart twice', () => {
    const cart = [line(drink('taro')), line(drink('taro', { size: 'large' })), line(drink('matcha'))];
    const after = removeFromCart(cart, cart[1].lineId);
    expect(after.map((l) => l.lineId)).toEqual([cart[0].lineId, cart[2].lineId]);
  });

  it('keeps quantities between 1 and 10', () => {
    expect([clampQty(0), clampQty(-3), clampQty(4.6), clampQty(99), clampQty(Number.NaN)]).toEqual([1, 1, 5, 10, 1]);
    const cart = [line(drink('classic'), 9)];
    expect(addToCart(cart, drink('classic'), 5)[0].qty).toBe(10);
    expect(setQty(cart, cart[0].lineId, 0)[0].qty).toBe(1);
  });

  it('counts drinks across lines', () => {
    expect(itemCount([line(drink('classic'), 2), line(drink('thai'), 3)])).toBe(5);
  });

  it('never mutates the cart it was given', () => {
    const cart = [line(drink('classic'))];
    const snapshot = JSON.stringify(cart);
    addToCart(cart, drink('classic'), 1);
    setQty(cart, cart[0].lineId, 5);
    removeFromCart(cart, cart[0].lineId);
    expect(JSON.stringify(cart)).toBe(snapshot);
  });
});

describe('promo codes', () => {
  it.each(['BOBA10', 'boba10', '  Boba10 ', 'welcome50'])('accepts "%s" regardless of case and spaces', (input) => {
    const result = applyPromo([], input);
    expect(result.ok).toBe(true);
  });

  it('rejects unknown and empty codes with a clear message', () => {
    expect(applyPromo([], 'FREEBOBA')).toEqual({ ok: false, error: '"FREEBOBA" isn\'t a valid promo code.' });
    expect(applyPromo([], '   ')).toEqual({ ok: false, error: 'Enter a promo code.' });
    expect(applyPromo([], '  nope ')).toEqual({ ok: false, error: '"nope" isn\'t a valid promo code.' });
  });

  it('applying the same code again keeps a single promo', () => {
    expect(applyPromo(['BOBA10'], 'boba10')).toEqual({ ok: true, promos: ['BOBA10'] });
  });

  it('a new code replaces the old one: never two promos', () => {
    expect(applyPromo(['BOBA10'], 'WELCOME50')).toEqual({ ok: true, promos: ['WELCOME50'] });
  });

  it('BOBA10 is 10% off, capped at ₱100', () => {
    expect(promoDiscount('BOBA10', 250).discount).toBe(25);
    expect(promoDiscount('BOBA10', 1000).discount).toBe(100);
    expect(promoDiscount('BOBA10', 2500).discount).toBe(100);
  });

  it('BOBA10 rounds to centavos (307 × 10% is 30.700000000000003 in floating point)', () => {
    expect(promoDiscount('BOBA10', 307).discount).toBe(30.7);
  });

  it('an unknown code is worth nothing', () => {
    expect(promoDiscount('FREEBOBA', 500)).toEqual({ discount: 0 });
  });

  it('WELCOME50 needs ₱300, and says how much more to add', () => {
    expect(promoDiscount('WELCOME50', 300)).toEqual({ discount: 50 });
    expect(promoDiscount('WELCOME50', 299)).toEqual({ discount: 0, note: 'Add ₱1 more to use WELCOME50.' });
  });
});

describe('Buy 1 Take 1 Tuesdays', () => {
  it('runs on Tuesday in the Philippines, whatever the device clock says', () => {
    expect(isB1T1Day(TUESDAY)).toBe(true);
    expect(isB1T1Day(WEDNESDAY)).toBe(false);
    // Monday 17:00 UTC is already Tuesday 01:00 in Manila.
    expect(isB1T1Day(new Date('2026-11-30T17:00:00Z'))).toBe(true);
    // Tuesday 17:00 UTC is Wednesday in Manila.
    expect(isB1T1Day(new Date('2026-12-01T17:00:00Z'))).toBe(false);
  });

  it('makes the CHEAPER drink of a pair free', () => {
    const cart = [line(drink('matcha')), line(drink('classic'))]; // 139 + 99
    expect(b1t1Discount(cart, TUESDAY)).toBe(99);
  });

  it('frees one drink per pair: 3 drinks → 1 free, 4 → 2 free (the two cheapest)', () => {
    expect(b1t1Discount([line(drink('classic'), 3)], TUESDAY)).toBe(99);
    const four = [line(drink('matcha'), 2), line(drink('classic')), line(drink('thai'))]; // 139,139,99,109
    expect(b1t1Discount(four, TUESDAY)).toBe(99 + 109);
  });

  it('gives nothing on other days or for a single drink', () => {
    expect(b1t1Discount([line(drink('classic'), 2)], WEDNESDAY)).toBe(0);
    expect(b1t1Discount([line(drink('classic'))], TUESDAY)).toBe(0);
  });
});

describe('totals', () => {
  it('a plain delivery order: subtotal + ₱49 delivery', () => {
    expect(totals([line(drink('taro'))], [], 'delivery', WEDNESDAY)).toEqual({
      subtotal: 119,
      b1t1: 0,
      promo: 0,
      promoNote: undefined,
      delivery: 49,
      freeDeliveryGap: 381,
      total: 168,
    });
  });

  it('pickup never pays delivery', () => {
    const t = totals([line(drink('taro'))], [], 'pickup', WEDNESDAY);
    expect(t.delivery).toBe(0);
    expect(t.total).toBe(119);
  });

  it('delivery is free at exactly ₱500 after discounts (4 Classic + Matcha with pearls = ₱550, WELCOME50)', () => {
    const cart = [line(drink('classic'), 4), line(drink('matcha', { toppings: ['pearls'] }))];
    const t = totals(cart, ['WELCOME50'], 'delivery', WEDNESDAY);
    expect(t.subtotal).toBe(550);
    expect(t.delivery).toBe(0);
    expect(t.freeDeliveryGap).toBe(0);
    expect(t.total).toBe(500);
  });

  it('just under ₱500 still pays delivery', () => {
    const t = totals([line(drink('classic'), 5)], [], 'delivery', WEDNESDAY); // 495
    expect(t.delivery).toBe(49);
    expect(t.freeDeliveryGap).toBe(5);
  });

  it('BOBA10 on Classic + Wintermelon + Thai (₱307): ₱30.70 off, total ₱325.30, no floating-point noise', () => {
    const cart = [line(drink('classic')), line(drink('wintermelon')), line(drink('thai'))];
    const t = totals(cart, ['BOBA10'], 'delivery', WEDNESDAY);
    expect(t.promo).toBe(30.7);
    expect(t.total).toBe(325.3);
    expect(String(t.promo)).toBe('30.7');
  });

  it('applies Buy 1 Take 1 before the promo code', () => {
    const cart = [line(drink('matcha'), 2), line(drink('classic'), 2)]; // 476, B1T1 frees 99+99
    const t = totals(cart, ['BOBA10'], 'pickup', TUESDAY);
    expect(t.b1t1).toBe(198);
    expect(t.promo).toBe(27.8); // 10% of 278
    expect(t.total).toBe(250.2);
  });

  it('passes the "add ₱X more" note through to the totals', () => {
    const t = totals([line(drink('matcha'))], ['WELCOME50'], 'pickup', WEDNESDAY);
    expect(t.promo).toBe(0);
    expect(t.promoNote).toBe('Add ₱161 more to use WELCOME50.');
  });

  it('an empty cart costs nothing, not even delivery', () => {
    expect(totals([], ['BOBA10'], 'delivery', WEDNESDAY).total).toBe(0);
  });

  it('rounds half-centavos correctly', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });
});

describe('checkout validation', () => {
  const cart = [line(drink('classic'))];
  const ok = { name: 'Akinon', mobile: '0917 123 4567', address: '12 Mabini St, Brgy San Roque' };

  it('accepts a complete delivery order', () => {
    expect(validateCheckout(ok, 'delivery', cart)).toEqual({});
  });

  it('names need 2 characters and addresses 10, ignoring surrounding spaces', () => {
    expect(validateCheckout({ ...ok, name: 'Al' }, 'delivery', cart).name).toBeUndefined();
    expect(validateCheckout({ ...ok, name: '  A  ' }, 'delivery', cart).name).toBeDefined();
    expect(validateCheckout({ ...ok, address: '12 Rizal S' }, 'delivery', cart).address).toBeUndefined();
    expect(validateCheckout({ ...ok, address: '   12 Rizal   ' }, 'delivery', cart).address).toBeDefined();
  });

  it('pickup does not need an address', () => {
    expect(validateCheckout({ ...ok, address: '' }, 'pickup', cart)).toEqual({});
  });

  it('reports every missing field at once', () => {
    expect(validateCheckout({ name: ' ', mobile: '123', address: 'short' }, 'delivery', [])).toEqual({
      cart: 'Your order is empty.',
      name: 'Enter the name for the order.',
      mobile: 'Enter a mobile number like 0917 123 4567.',
      address: 'Enter a delivery address with street and barangay.',
    });
  });

  it.each([
    ['09171234567', '09171234567'],
    ['0917 123 4567', '09171234567'],
    ['0917-123-4567', '09171234567'],
    ['+639171234567', '09171234567'],
    ['9171234567', null],
    ['0917123456', null],
    ['091712345678', null],
    ['08171234567', null],
    ['a09171234567', null],
    ['+63917123456789', null],
    ['x+639171234567', null],
  ])('mobile %s → %s', (input, expected) => {
    expect(normaliseMobile(input)).toBe(expected);
  });
});

describe('order numbers', () => {
  it('are BB- plus four digits, from 1000 to 9999', () => {
    expect(orderNumber(0)).toBe('BB-1000');
    expect(orderNumber(0.5)).toBe('BB-5500');
    expect(orderNumber(0.99999)).toBe('BB-9999');
    expect(orderNumber()).toMatch(/^BB-\d{4}$/);
  });
});

describe('formatting', () => {
  it('shows pesos with two decimals and thousands separators', () => {
    expect(formatPeso(1234.5)).toBe('₱1,234.50');
    expect(formatPeso(30.700000000000003)).toBe('₱30.70');
  });

  it.each([
    [0, 'No sugar'],
    [50, '50% sugar'],
    [100, 'Full sugar'],
  ])('sugar %i → %s', (level, label) => {
    expect(sugarLabel(level)).toBe(label);
  });
});
