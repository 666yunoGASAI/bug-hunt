import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { round2 } from '../lib/order';
import { formatPeso } from '../lib/format';

const plain = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

/** Counts smoothly to the new amount. The final frame always shows the real value. */
export default function AnimatedPeso({ value, testId }: { value: number; testId?: string }) {
  const reduce = useReducedMotion();
  const previous = useRef(value);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduce || from === value) {
      setShown(null);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.45,
      ease: 'easeOut',
      onUpdate: (v) => setShown(v),
      onComplete: () => setShown(null),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span data-testid={testId} className="amount">
      {shown === null ? formatPeso(value) : plain.format(round2(shown))}
    </span>
  );
}
