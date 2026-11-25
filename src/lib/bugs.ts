/**
 * The bug switchboard.
 *
 * Every planted bug lives behind `bug('<id>')`. With no bugs switched on, the app
 * behaves correctly and every test passes. Hunt mode switches all of them on.
 * The catch matrix (scripts/catch-matrix.ts) switches them on ONE AT A TIME and
 * proves at least one test fails for each, i.e. the suite would catch it.
 *
 * When a buggy code path actually produces a wrong result, it calls `triggered(id)`
 * so the Hunt board can reveal that bug to the player.
 */

export const BUGS = [
  {
    id: 'free-delivery-boundary',
    title: 'Free delivery misses ₱500 exactly',
    hint: 'Delivery is free from ₱500. Land on exactly ₱500 (WELCOME50 can help) and check the fee.',
    explanation: 'The check used > instead of >=, so an order of exactly ₱500 still paid ₱49 delivery. A classic boundary bug.',
    kind: 'Boundary value',
  },
  {
    id: 'toppings-limit',
    title: 'A 4th topping sneaks in',
    hint: 'The menu says up to 3 toppings.',
    explanation: 'The limit check was off by one (<= 3 instead of < 3 before adding), so a fourth topping could be added and charged.',
    kind: 'Off-by-one',
  },
  {
    id: 'promo-case',
    title: 'Promo codes are case-sensitive',
    hint: 'Try typing a promo code the way people really type.',
    explanation: '"boba10" was rejected while "BOBA10" worked. Codes were compared without normalising case or spaces.',
    kind: 'Input handling',
  },
  {
    id: 'promo-stacking',
    title: 'The same promo applies twice',
    hint: 'What if you apply a code you already applied?',
    explanation: 'Re-applying an active code added its discount again instead of replacing it, so the discount doubled.',
    kind: 'State',
  },
  {
    id: 'large-surcharge-toppings',
    title: 'Large size overcharges toppings',
    hint: 'Compare a Large with toppings to a Regular with the same toppings.',
    explanation: 'The ₱20 Large surcharge was applied to every topping as well as the drink.',
    kind: 'Calculation',
  },
  {
    id: 'remove-wrong-item',
    title: 'Remove deletes the wrong drink',
    hint: 'Order the same drink twice, made differently, then remove one.',
    explanation: 'Removal matched by drink type instead of the exact line, so it always deleted the first drink of that kind.',
    kind: 'State',
  },
  {
    id: 'float-rounding',
    title: 'Totals show floating-point noise',
    hint: 'Percent discounts make for interesting numbers. Try BOBA10 on a few different orders.',
    explanation: 'Totals were never rounded to centavos, so amounts like ₱157.70000000000002 leaked to the screen.',
    kind: 'Calculation',
  },
  {
    id: 'cart-not-saved',
    title: 'Your order vanishes on refresh',
    hint: 'Build an order, then reload the page.',
    explanation: 'The cart was saved under one storage key and loaded from another, so a reload always started empty.',
    kind: 'Persistence',
  },
  {
    id: 'b1t1-wrong-drink',
    title: 'Buy 1 Take 1 frees the pricier drink',
    hint: 'Tuesdays are Buy 1 Take 1. Which drink becomes free?',
    explanation: 'The promo sorted prices the wrong way and made the most expensive drink free instead of the cheaper one.',
    kind: 'Business rule',
  },
  {
    id: 'keyboard-add',
    title: 'Keyboard users can’t add to order',
    hint: 'Put the mouse away. Can you still order?',
    explanation: 'The "Add to order" control was a clickable <div>, so it couldn’t be reached with Tab or pressed with Enter.',
    kind: 'Accessibility',
  },
] as const;

export type BugId = (typeof BUGS)[number]['id'];
export const BUG_IDS = BUGS.map((b) => b.id) as BugId[];

let active = new Set<BugId>();
const listeners = new Set<(id: BugId) => void>();

export function setActiveBugs(ids: Iterable<string>): void {
  active = new Set([...ids].filter((id): id is BugId => (BUG_IDS as string[]).includes(id)));
}

export function activeBugs(): BugId[] {
  return [...active];
}

/** Is this planted bug switched on? */
export function bug(id: BugId): boolean {
  return active.has(id);
}

/** Called by buggy code when it actually produced a wrong result. */
export function triggered(id: BugId): void {
  for (const listener of listeners) listener(id);
}

export function onTriggered(listener: (id: BugId) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Parses "all", "none" or a comma list ("promo-case,toppings-limit"). */
export function parseBugList(value: string | null | undefined): BugId[] {
  if (!value || value === 'none') return [];
  if (value === 'all') return [...BUG_IDS];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((id): id is BugId => (BUG_IDS as string[]).includes(id));
}
