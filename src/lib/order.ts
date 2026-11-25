/**
 * Boba Bar order rules: pure functions only, so every rule is unit-testable and
 * mutation-testable. Planted bugs are marked with `bug('<id>')`.
 *
 * The rules (the "spec" the tests check):
 *  - Unit price = drink + ₱20 if Large + toppings. Max 3 toppings. Qty 1–10 per line.
 *  - Identical drinks (same drink, size, sugar, ice, toppings) merge into one line.
 *  - Buy 1 Take 1 Tuesdays (Manila time): for every 2 drinks, the cheaper one is free.
 *  - One promo code at a time, case- and space-insensitive:
 *      BOBA10    10% off, capped at ₱100
 *      WELCOME50 ₱50 off orders of ₱300 or more
 *  - Delivery ₱49, free when the order after discounts is ₱500 or more. Pickup is free.
 *  - Every amount is rounded to centavos.
 */
import { bug, triggered } from './bugs';
import { findDrink, findTopping, LARGE_SURCHARGE, MAX_QTY, MAX_TOPPINGS, type Ice, type Size, type Sugar } from './menu';

export interface DrinkConfig {
  drinkId: string;
  size: Size;
  sugar: Sugar;
  ice: Ice;
  toppings: string[];
}

export interface CartLine extends DrinkConfig {
  lineId: string;
  qty: number;
}

export type Fulfilment = 'delivery' | 'pickup';

export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_FROM = 500;

export const PROMOS: Record<string, { label: string; describe: string }> = {
  BOBA10: { label: 'BOBA10', describe: '10% off, up to ₱100' },
  WELCOME50: { label: 'WELCOME50', describe: '₱50 off orders of ₱300 or more' },
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Toppings and lines
// ---------------------------------------------------------------------------

export type ToppingResult = { ok: true; toppings: string[] } | { ok: false; error: string };

/** Adds or removes a topping, enforcing the limit. */
export function toggleTopping(selected: string[], id: string): ToppingResult {
  if (selected.includes(id)) return { ok: true, toppings: selected.filter((t) => t !== id) };
  let allowed = selected.length < MAX_TOPPINGS;
  // Stryker disable next-line all: planted bug
  if (bug('toppings-limit')) allowed = selected.length <= MAX_TOPPINGS;
  if (!allowed) return { ok: false, error: `You can add up to ${MAX_TOPPINGS} toppings.` };
  const toppings = [...selected, id];
  // Stryker disable next-line all: planted bug report
  if (toppings.length > MAX_TOPPINGS) triggered('toppings-limit');
  return { ok: true, toppings };
}

export function unitPrice(config: DrinkConfig): number {
  const base = findDrink(config.drinkId).price;
  const large = config.size === 'large' ? LARGE_SURCHARGE : 0;
  const toppings = config.toppings.reduce((sum, id) => sum + findTopping(id).price, 0);
  let price = base + large + toppings;
  // Stryker disable all: planted bug
  if (bug('large-surcharge-toppings') && config.size === 'large' && config.toppings.length > 0) {
    price += LARGE_SURCHARGE * config.toppings.length;
    triggered('large-surcharge-toppings');
  }
  // Stryker restore all
  return price;
}

export function linePrice(line: CartLine): number {
  return unitPrice(line) * line.qty;
}

function sameConfig(a: DrinkConfig, b: DrinkConfig): boolean {
  return (
    a.drinkId === b.drinkId &&
    a.size === b.size &&
    a.sugar === b.sugar &&
    a.ice === b.ice &&
    [...a.toppings].sort().join() === [...b.toppings].sort().join()
  );
}

export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
}

let lineCounter = 0;
export function newLineId(): string {
  lineCounter += 1;
  return `l${Date.now().toString(36)}${lineCounter}`;
}

export function addToCart(cart: CartLine[], config: DrinkConfig, qty: number, lineId = newLineId()): CartLine[] {
  const existing = cart.find((l) => sameConfig(l, config));
  if (existing) {
    return cart.map((l) => (l === existing ? { ...l, qty: clampQty(l.qty + qty) } : l));
  }
  return [...cart, { ...config, toppings: [...config.toppings], lineId, qty: clampQty(qty) }];
}

export function removeFromCart(cart: CartLine[], lineId: string): CartLine[] {
  // Stryker disable all: planted bug
  if (bug('remove-wrong-item')) {
    const target = cart.find((l) => l.lineId === lineId);
    const first = cart.find((l) => l.drinkId === target?.drinkId);
    if (first && target && first !== target) triggered('remove-wrong-item');
    return cart.filter((l) => l !== first);
  }
  // Stryker restore all
  return cart.filter((l) => l.lineId !== lineId);
}

export function setQty(cart: CartLine[], lineId: string, qty: number): CartLine[] {
  return cart.map((l) => (l.lineId === lineId ? { ...l, qty: clampQty(qty) } : l));
}

export function itemCount(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.qty, 0);
}

// ---------------------------------------------------------------------------
// Buy 1 Take 1 Tuesdays
// ---------------------------------------------------------------------------

/** Tuesday in the Philippines, wherever the customer's device is. */
export function isB1T1Day(now: Date): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Manila' }).format(now);
  return weekday === 'Tue';
}

export function b1t1Discount(cart: CartLine[], now: Date): number {
  if (!isB1T1Day(now)) return 0;
  const units = cart.flatMap((l) => Array.from({ length: l.qty }, () => unitPrice(l)));
  const freeCount = Math.floor(units.length / 2);
  const cheapestFirst = [...units].sort((a, b) => a - b);
  const correct = cheapestFirst.slice(0, freeCount).reduce((s, p) => s + p, 0);
  // Stryker disable all: planted bug
  if (bug('b1t1-wrong-drink')) {
    const priciestFirst = [...units].sort((a, b) => b - a);
    const wrong = priciestFirst.slice(0, freeCount).reduce((s, p) => s + p, 0);
    if (wrong !== correct) triggered('b1t1-wrong-drink');
    return wrong;
  }
  // Stryker restore all
  return correct;
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export type PromoResult = { ok: true; promos: string[] } | { ok: false; error: string };

/** Applies a code. Only one promo at a time: a new code replaces the old one. */
export function applyPromo(current: string[], input: string): PromoResult {
  const normalised = input.trim().toUpperCase();
  let code = normalised;
  // Stryker disable next-line all: planted bug
  if (bug('promo-case')) code = input.trim();
  if (!code) return { ok: false, error: 'Enter a promo code.' };
  if (!PROMOS[code]) {
    // Stryker disable next-line all: planted bug report
    if (bug('promo-case') && PROMOS[normalised]) triggered('promo-case');
    return { ok: false, error: `"${input.trim()}" isn't a valid promo code.` };
  }
  // Stryker disable all: planted bug
  if (bug('promo-stacking') && current.includes(code)) {
    triggered('promo-stacking');
    return { ok: true, promos: [...current, code] };
  }
  // Stryker restore all
  return { ok: true, promos: [code] };
}

/** Discount for one code on an amount, plus a note when it doesn't apply yet. */
export function promoDiscount(code: string, amount: number): { discount: number; note?: string } {
  if (code === 'BOBA10') {
    const raw = Math.min(amount * 0.1, 100);
    // Stryker disable next-line all: planted bug
    if (bug('float-rounding')) return { discount: raw };
    return { discount: round2(raw) };
  }
  if (code === 'WELCOME50') {
    if (amount >= 300) return { discount: 50 };
    return { discount: 0, note: `Add ₱${round2(300 - amount)} more to use WELCOME50.` };
  }
  return { discount: 0 };
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export interface Totals {
  subtotal: number;
  b1t1: number;
  promo: number;
  promoNote?: string;
  delivery: number;
  /** How much more to spend for free delivery (0 when already free or pickup). */
  freeDeliveryGap: number;
  total: number;
}

export function totals(cart: CartLine[], promos: string[], fulfilment: Fulfilment, now: Date): Totals {
  const subtotal = round2(cart.reduce((s, l) => s + linePrice(l), 0));
  const b1t1 = round2(b1t1Discount(cart, now));
  const afterB1T1 = subtotal - b1t1;

  let promo = 0;
  let promoNote: string | undefined;
  for (const code of promos) {
    const result = promoDiscount(code, afterB1T1);
    promo += result.discount;
    promoNote = result.note ?? promoNote;
  }
  promo = Math.min(promo, afterB1T1);
  const afterDiscounts = round2(afterB1T1 - promo);

  let delivery = 0;
  let freeDeliveryGap = 0;
  if (fulfilment === 'delivery' && cart.length > 0) {
    let free = afterDiscounts >= FREE_DELIVERY_FROM;
    // Stryker disable next-line all: planted bug
    if (bug('free-delivery-boundary')) free = afterDiscounts > FREE_DELIVERY_FROM;
    // Stryker disable next-line all: planted bug report
    if (bug('free-delivery-boundary') && afterDiscounts === FREE_DELIVERY_FROM) triggered('free-delivery-boundary');
    delivery = free ? 0 : DELIVERY_FEE;
    freeDeliveryGap = free ? 0 : round2(FREE_DELIVERY_FROM - afterDiscounts);
  }

  const rawTotal = afterB1T1 - promo + delivery;
  let total = round2(rawTotal);
  // Stryker disable next-line all: planted bug
  if (bug('float-rounding')) total = rawTotal;
  // Stryker disable next-line all: planted bug report
  if (bug('float-rounding') && (total !== round2(total) || promo !== round2(promo))) triggered('float-rounding');

  return { subtotal, b1t1, promo, promoNote, delivery, freeDeliveryGap, total };
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CheckoutForm {
  name: string;
  mobile: string;
  address: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutForm | 'cart', string>>;

/** Philippine mobile numbers: 09XXXXXXXXX or +639XXXXXXXXX, spaces and dashes allowed. */
export function normaliseMobile(input: string): string | null {
  const compact = input.replace(/[\s-]/g, '');
  if (/^09\d{9}$/.test(compact)) return compact;
  if (/^\+639\d{9}$/.test(compact)) return `0${compact.slice(3)}`;
  return null;
}

export function validateCheckout(form: CheckoutForm, fulfilment: Fulfilment, cart: CartLine[]): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (cart.length === 0) errors.cart = 'Your order is empty.';
  if (form.name.trim().length < 2) errors.name = 'Enter the name for the order.';
  if (!normaliseMobile(form.mobile)) errors.mobile = 'Enter a mobile number like 0917 123 4567.';
  if (fulfilment === 'delivery' && form.address.trim().length < 10) {
    errors.address = 'Enter a delivery address with street and barangay.';
  }
  return errors;
}

export function orderNumber(seed = Math.random()): string {
  return `BB-${String(Math.floor(seed * 9000) + 1000)}`;
}
