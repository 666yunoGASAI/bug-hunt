export interface Drink {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Colours for the animated cup: the tea, and the milk swirl. */
  tea: string;
  swirl: string;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  colour: string;
}

export type Size = 'regular' | 'large';
export type Ice = 'no-ice' | 'less-ice' | 'regular-ice';
export type Sugar = 0 | 25 | 50 | 75 | 100;

export const DRINKS: Drink[] = [
  { id: 'classic', name: 'Classic Milk Tea', description: 'Black tea, fresh milk, nothing to prove.', price: 99, tea: '#c99a6b', swirl: '#efdcc5' },
  { id: 'brown-sugar', name: 'Brown Sugar Fresh Milk', description: 'Tiger stripes of brown sugar syrup.', price: 129, tea: '#a8653a', swirl: '#f6e9d9' },
  { id: 'taro', name: 'Taro Milk Tea', description: 'Creamy, nutty, unapologetically purple.', price: 119, tea: '#b79ad8', swirl: '#efe5fa' },
  { id: 'matcha', name: 'Matcha Latte', description: 'Stone-ground matcha over fresh milk.', price: 139, tea: '#8fb26b', swirl: '#e9f1dc' },
  { id: 'thai', name: 'Thai Milk Tea', description: 'Spiced, bright orange, very sweet.', price: 109, tea: '#e98a3b', swirl: '#fbe0c6' },
  { id: 'wintermelon', name: 'Wintermelon', description: 'Caramel-like and mellow.', price: 99, tea: '#c6a15e', swirl: '#f2e6cc' },
];

export const TOPPINGS: Topping[] = [
  { id: 'pearls', name: 'Black pearls', price: 15, colour: '#2b1b14' },
  { id: 'nata', name: 'Nata de coco', price: 15, colour: '#f4f1e1' },
  { id: 'pudding', name: 'Egg pudding', price: 15, colour: '#f2c94c' },
  { id: 'grass-jelly', name: 'Grass jelly', price: 15, colour: '#3b2f2a' },
  { id: 'popping', name: 'Popping boba', price: 15, colour: '#e85d75' },
  { id: 'cream-cheese', name: 'Cream cheese foam', price: 25, colour: '#fffaf0' },
];

export const LARGE_SURCHARGE = 20;
export const MAX_TOPPINGS = 3;
export const MAX_QTY = 10;
export const SUGAR_LEVELS: Sugar[] = [0, 25, 50, 75, 100];

export const ICE_LABELS: Record<Ice, string> = {
  'no-ice': 'No ice',
  'less-ice': 'Less ice',
  'regular-ice': 'Regular ice',
};

export function findDrink(id: string): Drink {
  const drink = DRINKS.find((d) => d.id === id);
  if (!drink) throw new Error(`Unknown drink "${id}"`);
  return drink;
}

export function findTopping(id: string): Topping {
  const topping = TOPPINGS.find((t) => t.id === id);
  if (!topping) throw new Error(`Unknown topping "${id}"`);
  return topping;
}
