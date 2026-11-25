import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

const COLOURS = ['#f28c38', '#b79ad8', '#8fb26b', '#e85d75', '#f2c94c', '#6b3e26'];

/** A one-shot burst of tapioca-coloured confetti. Hidden from screen readers. */
export default function Confetti({ pieces = 46 }: { pieces?: number }) {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 520,
        y: -(160 + Math.random() * 260),
        rotate: Math.random() * 720 - 360,
        colour: COLOURS[i % COLOURS.length],
        round: i % 3 === 0,
        delay: Math.random() * 0.12,
      })),
    [pieces],
  );
  if (reduce) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className={b.round ? 'confetti-bit is-round' : 'confetti-bit'}
          style={{ background: b.colour }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 420], opacity: [1, 1, 0], rotate: b.rotate, scale: 1 }}
          transition={{ duration: 1.6, delay: b.delay, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
