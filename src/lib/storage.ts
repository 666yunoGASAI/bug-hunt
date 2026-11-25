import { bug, triggered } from './bugs';
import type { CartLine, Fulfilment } from './order';

export const CART_KEY = 'boba-bar:cart';
export const HUNT_KEY = 'boba-bar:hunt';
export const CAUGHT_KEY = 'boba-bar:caught';

export interface SavedOrder {
  cart: CartLine[];
  promos: string[];
  fulfilment: Fulfilment;
}

const EMPTY: SavedOrder = { cart: [], promos: [], fulfilment: 'delivery' };

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the order still works for this visit.
  }
}

export function saveOrder(order: SavedOrder): void {
  safeSet(CART_KEY, JSON.stringify(order));
}

export function loadOrder(): SavedOrder {
  let raw = safeGet(CART_KEY);
  // Stryker disable all: planted bug
  if (bug('cart-not-saved')) {
    raw = safeGet('boba-bar:order');
    const real = safeGet(CART_KEY);
    if (real && JSON.parse(real).cart?.length) triggered('cart-not-saved');
  }
  // Stryker restore all
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedOrder>;
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      promos: Array.isArray(parsed.promos) ? parsed.promos : [],
      fulfilment: parsed.fulfilment === 'pickup' ? 'pickup' : 'delivery',
    };
  } catch {
    return EMPTY;
  }
}

export function loadList(key: string): string[] {
  try {
    const parsed = JSON.parse(safeGet(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveList(key: string, list: string[]): void {
  safeSet(key, JSON.stringify(list));
}

export function clearOrder(): void {
  safeSet(CART_KEY, JSON.stringify(EMPTY));
}
