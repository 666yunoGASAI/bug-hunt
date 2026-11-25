import { motion, useAnimationControls } from 'framer-motion';
import { useEffect } from 'react';
import { BUGS } from '../lib/bugs';
import { itemCount } from '../lib/order';
import { useOrder } from '../state/OrderContext';

export default function Header({ route }: { route: string }) {
  const { cart, setCartOpen, huntMode, caught, lastAddedAt } = useOrder();
  const count = itemCount(cart);
  const badge = useAnimationControls();

  useEffect(() => {
    if (lastAddedAt) void badge.start({ scale: [1, 1.45, 0.9, 1], rotate: [0, -12, 8, 0], transition: { duration: 0.5 } });
  }, [lastAddedAt, badge]);

  return (
    <header className="site-header">
      <a href="#/" className="logo" aria-label="Boba Bar home">
        <svg viewBox="0 0 40 40" aria-hidden="true" className="logo-cup">
          <path d="M8 10h24l-3 24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fffdf8" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="16" cy="30" r="2.6" fill="currentColor" />
          <circle cx="22" cy="31" r="2.6" fill="currentColor" />
          <circle cx="19" cy="26" r="2.6" fill="currentColor" />
          <path d="M23 2l-2 20" stroke="#f28c38" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
        <span>Boba Bar</span>
      </a>

      <nav aria-label="Main" className="nav">
        <a href="#/order" aria-current={route === '/order' ? 'page' : undefined}>
          Order
        </a>
        <a href="#/hunt" aria-current={route === '/hunt' ? 'page' : undefined}>
          Bug Hunt
          {huntMode && (
            <span className="nav-count" data-testid="nav-caught">
              {caught.length}/{BUGS.length}
            </span>
          )}
        </a>
      </nav>

      {huntMode && (
        <span className="hunt-pill" data-testid="hunt-pill">
          <span className="hunt-dot" aria-hidden="true" />
          Hunt mode
        </span>
      )}

      <button type="button" className="cart-button" onClick={() => setCartOpen(true)}>
        <span>Your order</span>
        <motion.span className="cart-count" animate={badge} data-testid="cart-count">
          {count}
        </motion.span>
        <span className="sr-only">{count === 1 ? 'drink' : 'drinks'}</span>
      </button>
    </header>
  );
}
