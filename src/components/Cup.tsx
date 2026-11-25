/**
 * The animated cup: tea colour, fill level by size, ice cubes, and toppings that
 * drop in with a spring when added and sink away when removed.
 * Purely decorative for screen readers: the options themselves carry the meaning.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { findDrink, findTopping, type Ice, type Size } from '../lib/menu';

interface Props {
  drinkId: string;
  size: Size;
  ice: Ice;
  toppings: string[];
  compact?: boolean;
}

// Cup interior: top edge y=52, bottom y=262. Tapers from x 36–164 to 56–144.
const CUP_PATH = 'M30 46 H170 L150 266 Q149 274 140 274 H60 Q51 274 50 266 Z';

/** Deterministic pseudo-random so pieces don't jump around between renders. */
function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function piecesFor(id: string, layer: number) {
  const count = id === 'pudding' ? 3 : id === 'cream-cheese' ? 0 : 9;
  return Array.from({ length: count }, (_, i) => {
    const r = seeded(i + layer * 31 + id.length * 7);
    const r2 = seeded(i * 3 + layer * 17 + id.length);
    return { key: `${id}-${i}`, x: 62 + r * 76, y: 250 - layer * 14 - r2 * 12, rot: r * 90 };
  });
}

function Piece({ id, x, y, rot }: { id: string; x: number; y: number; rot: number }) {
  const colour = findTopping(id).colour;
  switch (id) {
    case 'pearls':
      return <circle cx={x} cy={y} r={6.5} fill={colour} />;
    case 'popping':
      return <circle cx={x} cy={y} r={6} fill={colour} stroke="#fff" strokeOpacity={0.6} strokeWidth={1.5} />;
    case 'nata':
      return <rect x={x - 5} y={y - 5} width={10} height={10} rx={2} fill={colour} fillOpacity={0.85} stroke="#d9d2b4" transform={`rotate(${rot} ${x} ${y})`} />;
    case 'grass-jelly':
      return <rect x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={colour} transform={`rotate(${rot / 2} ${x} ${y})`} />;
    case 'pudding':
      return <ellipse cx={x} cy={y - 2} rx={13} ry={8} fill={colour} />;
    default:
      return null;
  }
}

export default function Cup({ drinkId, size, ice, toppings, compact = false }: Props) {
  const drink = findDrink(drinkId);
  const reduce = useReducedMotion();
  const liquidTop = size === 'large' ? 70 : 104;
  const iceCount = ice === 'regular-ice' ? 4 : ice === 'less-ice' ? 2 : 0;
  const foam = toppings.includes('cream-cheese');
  const bottomToppings = toppings.filter((t) => t !== 'cream-cheese');

  return (
    <motion.svg
      viewBox="0 0 200 300"
      className={compact ? 'cup cup-compact' : 'cup'}
      aria-hidden="true"
      animate={{ scale: size === 'large' ? 1.06 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <defs>
        <clipPath id={`cup-clip-${compact ? 'c' : 'm'}-${drinkId}`}>
          <path d={CUP_PATH} />
        </clipPath>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Straw */}
      {!compact && (
        <motion.rect
          x="112"
          y="-6"
          width="14"
          height="250"
          rx="7"
          fill="#f28c38"
          initial={false}
          animate={{ rotate: size === 'large' ? 9 : 7, y: size === 'large' ? -16 : -6 }}
          style={{ originX: '119px', originY: '200px' }}
        />
      )}

      <g clipPath={`url(#cup-clip-${compact ? 'c' : 'm'}-${drinkId})`}>
        <rect x="0" y="0" width="200" height="300" fill="#fffdf8" />
        {/* Tea */}
        <motion.rect
          x="0"
          width="200"
          height="300"
          initial={false}
          animate={{ y: liquidTop, fill: drink.tea }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        />
        {/* Milk swirl */}
        <motion.path
          d="M0 0 C40 18 70 -10 110 8 S170 22 200 6 V40 C150 52 120 30 80 44 S20 40 0 50 Z"
          initial={false}
          animate={{ y: liquidTop + 10, fill: drink.swirl }}
          opacity={0.75}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        />
        {/* Foam layer */}
        <AnimatePresence>
          {foam && (
            <motion.rect
              key="foam"
              x="0"
              width="200"
              height="34"
              rx="10"
              fill="#fffaf0"
              initial={{ y: liquidTop - 60, opacity: 0 }}
              animate={{ y: liquidTop - 6, opacity: 1 }}
              exit={{ opacity: 0, y: liquidTop - 30 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            />
          )}
        </AnimatePresence>
        {/* Ice */}
        <AnimatePresence>
          {Array.from({ length: iceCount }, (_, i) => (
            <motion.rect
              key={`ice-${i}`}
              width="26"
              height="26"
              rx="6"
              fill="#ffffff"
              fillOpacity={0.55}
              stroke="#ffffff"
              strokeOpacity={0.9}
              initial={{ x: 60 + i * 22, y: liquidTop - 60, opacity: 0, rotate: 0 }}
              animate={{ x: 52 + i * 24, y: liquidTop + 10 + (i % 2) * 14, opacity: 1, rotate: 12 + i * 17 }}
              exit={{ opacity: 0, y: liquidTop + 40 }}
              transition={{ type: 'spring', stiffness: 140, damping: 12, delay: reduce ? 0 : i * 0.05 }}
            />
          ))}
        </AnimatePresence>
        {/* Bottom toppings: each layer drops in on top of the previous one */}
        <AnimatePresence>
          {bottomToppings.map((id, layer) => (
            <motion.g
              key={id}
              initial={{ y: -260, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 170, damping: 15 }}
            >
              {piecesFor(id, layer).map((p) => (
                <Piece key={p.key} id={id} x={p.x} y={p.y} rot={p.rot} />
              ))}
            </motion.g>
          ))}
        </AnimatePresence>
        <rect x="0" y="0" width="200" height="300" fill="url(#glass)" />
      </g>

      {/* Cup outline and lid */}
      <path d={CUP_PATH} fill="none" stroke="#2b1b14" strokeWidth={compact ? 6 : 4} strokeLinejoin="round" />
      <rect x="22" y="36" width="156" height="14" rx="7" fill="#2b1b14" />
    </motion.svg>
  );
}
