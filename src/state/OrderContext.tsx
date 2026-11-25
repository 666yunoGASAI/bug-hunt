import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BUGS, BUG_IDS, onTriggered, type BugId } from '../lib/bugs';
import {
  addToCart,
  applyPromo,
  removeFromCart,
  setQty,
  totals as computeTotals,
  type CartLine,
  type DrinkConfig,
  type Fulfilment,
  type Totals,
} from '../lib/order';
import { CAUGHT_KEY, clearOrder, loadList, loadOrder, saveList, saveOrder } from '../lib/storage';

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'bug';
}

interface OrderState {
  cart: CartLine[];
  promos: string[];
  fulfilment: Fulfilment;
  totals: Totals;
  now: Date;
  cartOpen: boolean;
  huntMode: boolean;
  caught: BugId[];
  toasts: Toast[];
  lastAddedAt: number;
  add: (config: DrinkConfig, qty: number) => void;
  remove: (lineId: string) => void;
  changeQty: (lineId: string, qty: number) => void;
  applyCode: (input: string) => string | null;
  removeCode: () => void;
  setFulfilment: (f: Fulfilment) => void;
  setCartOpen: (open: boolean) => void;
  completeOrder: () => void;
  toggleHunt: () => void;
  resetCaught: () => void;
  notify: (text: string, tone?: Toast['tone']) => void;
}

const OrderContext = createContext<OrderState | null>(null);

export function OrderProvider({ children, huntMode, onToggleHunt }: { children: ReactNode; huntMode: boolean; onToggleHunt: () => void }) {
  // Lazy initial state: load the saved order ONCE. (useRef(loadOrder()) would call it on every render.)
  const [initial] = useState(loadOrder);
  const [cart, setCart] = useState<CartLine[]>(initial.cart);
  const [promos, setPromos] = useState<string[]>(initial.promos);
  const [fulfilment, setFulfilment] = useState<Fulfilment>(initial.fulfilment);
  const [cartOpen, setCartOpen] = useState(false);
  const [caught, setCaught] = useState<BugId[]>(() => loadList(CAUGHT_KEY).filter((id): id is BugId => (BUG_IDS as string[]).includes(id)));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const toastId = useRef(0);

  const notify = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'bug' ? 6000 : 3200);
  }, []);

  // Planted bugs report themselves when they misbehave: reveal them on the Hunt board.
  // Reports often arrive DURING render (prices are computed while rendering), so state is
  // only updated after the render finishes; the ref stops the same bug re-reporting in a loop.
  const caughtRef = useRef(new Set<BugId>(caught));
  useEffect(
    () =>
      onTriggered((id) => {
        if (caughtRef.current.has(id)) return;
        caughtRef.current.add(id);
        queueMicrotask(() => {
          const next = [...caughtRef.current];
          setCaught(next);
          saveList(CAUGHT_KEY, next);
          notify(`Bug caught: ${BUGS.find((b) => b.id === id)!.title}`, 'bug');
        });
      }),
    [notify],
  );

  useEffect(() => {
    saveOrder({ cart, promos, fulfilment });
  }, [cart, promos, fulfilment]);

  const now = new Date();
  const totals = useMemo(() => computeTotals(cart, promos, fulfilment, now), [cart, promos, fulfilment, now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: OrderState = {
    cart,
    promos,
    fulfilment,
    totals,
    now,
    cartOpen,
    huntMode,
    caught,
    toasts,
    lastAddedAt,
    add: (config, qty) => {
      setCart((c) => addToCart(c, config, qty));
      setLastAddedAt(Date.now());
    },
    remove: (lineId) => setCart((c) => removeFromCart(c, lineId)),
    changeQty: (lineId, qty) => setCart((c) => setQty(c, lineId, qty)),
    applyCode: (input) => {
      const result = applyPromo(promos, input);
      if (!result.ok) return result.error;
      setPromos(result.promos);
      return null;
    },
    removeCode: () => setPromos([]),
    setFulfilment,
    setCartOpen,
    completeOrder: () => {
      setCart([]);
      setPromos([]);
      clearOrder();
    },
    toggleHunt: onToggleHunt,
    resetCaught: () => {
      caughtRef.current = new Set();
      setCaught([]);
      saveList(CAUGHT_KEY, []);
    },
    notify,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderState {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside OrderProvider');
  return ctx;
}
