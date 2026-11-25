import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOrder } from '../state/OrderContext';

export default function Toasts() {
  const { toasts } = useOrder();
  const reduce = useReducedMotion();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.p
            key={t.id}
            layout
            className={`toast toast-${t.tone}`}
            data-testid={t.tone === 'bug' ? 'bug-toast' : 'toast'}
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            {t.tone === 'bug' && <span aria-hidden="true">🐞 </span>}
            {t.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
