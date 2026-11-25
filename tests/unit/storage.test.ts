/** Persistence, with an in-memory localStorage standing in for the browser's. */
import { beforeEach, describe, expect, it } from 'vitest';
import { CART_KEY, clearOrder, loadList, loadOrder, saveList, saveOrder } from '../../src/lib/storage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const order = {
  cart: [{ lineId: 'a', drinkId: 'taro', size: 'large' as const, sugar: 25 as const, ice: 'less-ice' as const, toppings: ['pearls'], qty: 2 }],
  promos: ['BOBA10'],
  fulfilment: 'pickup' as const,
};

describe('saved order', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
  });

  it('what is saved is exactly what loads back', () => {
    saveOrder(order);
    expect(loadOrder()).toEqual(order);
  });

  it('starts empty when nothing is saved', () => {
    expect(loadOrder()).toEqual({ cart: [], promos: [], fulfilment: 'delivery' });
  });

  it('survives corrupted or tampered data', () => {
    localStorage.setItem(CART_KEY, '{oops');
    expect(loadOrder().cart).toEqual([]);
    localStorage.setItem(CART_KEY, JSON.stringify({ cart: 'nope', promos: 5, fulfilment: 'teleport' }));
    expect(loadOrder()).toEqual({ cart: [], promos: [], fulfilment: 'delivery' });
  });

  it('clearing empties the saved order', () => {
    saveOrder(order);
    clearOrder();
    expect(loadOrder()).toEqual({ cart: [], promos: [], fulfilment: 'delivery' });
  });
});

describe('saved lists (caught bugs)', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
  });

  it('round-trips a list', () => {
    saveList('k', ['a', 'b']);
    expect(loadList('k')).toEqual(['a', 'b']);
  });

  it('is empty when missing, corrupted or not a list', () => {
    expect(loadList('missing')).toEqual([]);
    localStorage.setItem('bad', '{oops');
    expect(loadList('bad')).toEqual([]);
    localStorage.setItem('obj', '{"a":1}');
    expect(loadList('obj')).toEqual([]);
  });

  it('never throws when storage itself is blocked', () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => saveList('k', ['a'])).not.toThrow();
    expect(loadList('k')).toEqual([]);
    expect(loadOrder().cart).toEqual([]);
  });
});
