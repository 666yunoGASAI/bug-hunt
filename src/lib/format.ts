import { bug } from './bugs';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

/** ₱1,234.50. With the float-rounding bug on, raw floating-point noise shows through. */
export function formatPeso(amount: number): string {
  // Stryker disable all: planted bug
  if (bug('float-rounding') && Math.round(amount * 100) / 100 !== amount) {
    return `₱${amount}`;
  }
  // Stryker restore all
  return peso.format(amount);
}

export function sugarLabel(level: number): string {
  if (level === 0) return 'No sugar';
  if (level === 100) return 'Full sugar';
  return `${level}% sugar`;
}
