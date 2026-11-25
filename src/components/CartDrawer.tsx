import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import AnimatedPeso from './AnimatedPeso';
import Confetti from './Confetti';
import Cup from './Cup';
import { formatPeso, sugarLabel } from '../lib/format';
import { findDrink, findTopping, ICE_LABELS, MAX_QTY } from '../lib/menu';
import { linePrice, orderNumber, PROMOS, validateCheckout, type CartLine, type CheckoutErrors, type CheckoutForm } from '../lib/order';
import { useOrder } from '../state/OrderContext';

type Step = 'cart' | 'checkout' | 'done';

export function describeLine(line: CartLine): string {
  const parts = [line.size === 'large' ? 'Large' : 'Regular', sugarLabel(line.sugar), ICE_LABELS[line.ice]];
  if (line.toppings.length) parts.push(line.toppings.map((t) => findTopping(t).name).join(', '));
  return parts.join(' · ');
}

interface Receipt {
  number: string;
  lines: CartLine[];
  total: number;
  fulfilment: string;
  name: string;
}

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useOrder();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>('cart');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (cartOpen) {
      opener.current = document.activeElement;
      window.setTimeout(() => closeRef.current?.focus(), 30);
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    (opener.current as HTMLElement | null)?.focus?.();
    if (step === 'done') setStep('cart');
  }, [cartOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="overlay" onClick={() => setCartOpen(false)} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="drawer-head">
              {step === 'checkout' ? (
                <button type="button" className="btn-text" onClick={() => setStep('cart')}>
                  Back to order
                </button>
              ) : (
                <h2 id="drawer-title">{step === 'done' ? 'Order placed' : 'Your order'}</h2>
              )}
              {step === 'checkout' && (
                <h2 id="drawer-title" className="sr-only">
                  Checkout
                </h2>
              )}
              <button ref={closeRef} type="button" className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close order">
                ✕
              </button>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="drawer-body"
                initial={reduce ? false : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {step === 'cart' && <CartStep onCheckout={() => setStep('checkout')} />}
                {step === 'checkout' && (
                  <CheckoutStep
                    onDone={(r) => {
                      setReceipt(r);
                      setStep('done');
                    }}
                  />
                )}
                {step === 'done' && receipt && <ReceiptStep receipt={receipt} />}
              </motion.div>
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CartStep({ onCheckout }: { onCheckout: () => void }) {
  const { cart, remove, changeQty, totals, fulfilment, setFulfilment, promos, applyCode, removeCode, setCartOpen } = useOrder();
  const reduce = useReducedMotion();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <Cup drinkId="classic" size="regular" ice="no-ice" toppings={[]} compact />
        <p>Your order is empty. Pick a drink from the menu.</p>
        <a
          href="#/order"
          className="btn btn-primary"
          onClick={() => setCartOpen(false)}
        >
          Browse the menu
        </a>
      </div>
    );
  }

  function onApply(e: FormEvent) {
    e.preventDefault();
    const error = applyCode(code);
    setCodeError(error);
    if (!error) setCode('');
  }

  const gapPercent = Math.min(100, ((500 - totals.freeDeliveryGap) / 500) * 100);

  return (
    <>
      <ul className="lines" aria-label="Drinks in your order">
        <AnimatePresence initial={false}>
          {cart.map((line) => {
            const drink = findDrink(line.drinkId);
            const details = describeLine(line);
            return (
              <motion.li
                key={line.lineId}
                layout
                className="line"
                data-testid="cart-line"
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: 60, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="line-cup">
                  <Cup drinkId={line.drinkId} size={line.size} ice={line.ice} toppings={line.toppings} compact />
                </div>
                <div className="line-info">
                  <p className="line-name">{drink.name}</p>
                  <p className="line-details">{details}</p>
                  <div className="line-actions">
                    <div className="stepper stepper-small" role="group" aria-label={`Quantity of ${drink.name}, ${details}`}>
                      <button type="button" aria-label="One less" disabled={line.qty <= 1} onClick={() => changeQty(line.lineId, line.qty - 1)}>
                        −
                      </button>
                      <output data-testid="line-qty">{line.qty}</output>
                      <button type="button" aria-label="One more" disabled={line.qty >= MAX_QTY} onClick={() => changeQty(line.lineId, line.qty + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="btn-text btn-remove" onClick={() => remove(line.lineId)} aria-label={`Remove ${drink.name}, ${details}`}>
                      Remove
                    </button>
                  </div>
                </div>
                <p className="line-price" data-testid="line-price">
                  {formatPeso(linePrice(line))}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <fieldset className="option fulfilment">
        <legend>How do you want it?</legend>
        <div className="segmented">
          <label className="seg">
            <input type="radio" name="fulfilment" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} />
            <span>Delivery</span>
          </label>
          <label className="seg">
            <input type="radio" name="fulfilment" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} />
            <span>Pickup</span>
          </label>
        </div>
      </fieldset>

      {fulfilment === 'delivery' && (
        <div className="free-delivery" data-testid="free-delivery">
          <p>{totals.freeDeliveryGap > 0 ? `Add ${formatPeso(totals.freeDeliveryGap)} more for free delivery` : 'Free delivery unlocked'}</p>
          <div className="meter" aria-hidden="true">
            <motion.span initial={false} animate={{ width: `${gapPercent}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </div>
        </div>
      )}

      <form className="promo" onSubmit={onApply} noValidate>
        <label htmlFor="promo-code">Promo code</label>
        <div className="promo-row">
          <input id="promo-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BOBA10" autoComplete="off" aria-describedby={codeError ? 'promo-error' : undefined} />
          <button type="submit" className="btn btn-dark">
            Apply
          </button>
        </div>
        {codeError && (
          <p id="promo-error" className="field-error" role="alert">
            {codeError}
          </p>
        )}
        <AnimatePresence>
          {promos.map((p, i) => (
            <motion.p key={`${p}-${i}`} className="promo-chip" data-testid="promo-chip" initial={reduce ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <strong>{p}</strong> {PROMOS[p]?.describe}
              <button type="button" className="btn-text" onClick={removeCode} aria-label={`Remove promo ${p}`}>
                Remove
              </button>
            </motion.p>
          ))}
        </AnimatePresence>
      </form>

      <dl className="summary">
        <div>
          <dt>Subtotal</dt>
          <dd>
            <AnimatedPeso value={totals.subtotal} testId="subtotal" />
          </dd>
        </div>
        {totals.b1t1 > 0 && (
          <div className="summary-saving">
            <dt>Buy 1 Take 1 Tuesday</dt>
            <dd>
              −<AnimatedPeso value={totals.b1t1} testId="b1t1" />
            </dd>
          </div>
        )}
        {totals.promo > 0 && (
          <div className="summary-saving">
            <dt>Promo</dt>
            <dd>
              −<AnimatedPeso value={totals.promo} testId="promo-discount" />
            </dd>
          </div>
        )}
        <div>
          <dt>Delivery</dt>
          <dd data-testid="delivery-fee">{fulfilment === 'pickup' ? 'Pickup' : totals.delivery === 0 ? 'Free' : formatPeso(totals.delivery)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>
            <AnimatedPeso value={totals.total} testId="total" />
          </dd>
        </div>
      </dl>

      {totals.promoNote && <p className="summary-note">{totals.promoNote}</p>}

      <motion.button type="button" className="btn btn-primary btn-block" onClick={onCheckout} whileTap={{ scale: 0.97 }}>
        Checkout
      </motion.button>
    </>
  );
}

function CheckoutStep({ onDone }: { onDone: (r: Receipt) => void }) {
  const { cart, totals, fulfilment, completeOrder } = useOrder();
  const [form, setForm] = useState<CheckoutForm>({ name: '', mobile: '', address: '' });
  const [errors, setErrors] = useState<CheckoutErrors>({});

  function field(key: keyof CheckoutForm, label: string, extra: Record<string, string> = {}) {
    const id = `checkout-${key}`;
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={errors[key] ? `${id}-error` : undefined}
          {...extra}
        />
        {errors[key] && (
          <p id={`${id}-error`} className="field-error">
            {errors[key]}
          </p>
        )}
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems = validateCheckout(form, fulfilment, cart);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;
    onDone({
      number: orderNumber(),
      lines: cart,
      total: totals.total,
      fulfilment: fulfilment === 'delivery' ? `Delivering to ${form.address.trim()}` : 'Ready for pickup in about 15 minutes',
      name: form.name.trim(),
    });
    completeOrder();
  }

  return (
    <form className="checkout" onSubmit={onSubmit} noValidate>
      <p className="checkout-intro">
        {fulfilment === 'delivery' ? 'Where should we bring it?' : 'Who’s picking it up?'} Total {formatPeso(totals.total)}.
      </p>
      {field('name', 'Name', { autoComplete: 'name' })}
      {field('mobile', 'Mobile number', { autoComplete: 'tel', inputMode: 'tel', placeholder: '0917 123 4567' })}
      {fulfilment === 'delivery' && field('address', 'Delivery address', { autoComplete: 'street-address', placeholder: 'Street, barangay, city' })}
      {Object.keys(errors).length > 0 && (
        <p className="field-error" role="alert">
          Check the highlighted fields.
        </p>
      )}
      <motion.button type="submit" className="btn btn-primary btn-block" whileTap={{ scale: 0.97 }}>
        Place order · {formatPeso(totals.total)}
      </motion.button>
    </form>
  );
}

function ReceiptStep({ receipt }: { receipt: Receipt }) {
  const { setCartOpen } = useOrder();
  const reduce = useReducedMotion();
  return (
    <div className="receipt-wrap">
      <Confetti />
      <motion.div className="receipt" data-testid="receipt" initial={reduce ? false : { y: -40, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
        <p className="receipt-number">Order {receipt.number}</p>
        <p className="receipt-thanks">Salamat, {receipt.name}! Your boba is on its way.</p>
        <ul>
          {receipt.lines.map((l) => (
            <li key={l.lineId}>
              <span>
                {l.qty} × {findDrink(l.drinkId).name}
              </span>
              <span>{formatPeso(linePrice(l))}</span>
            </li>
          ))}
        </ul>
        <p className="receipt-total">
          <span>Total</span> <span>{formatPeso(receipt.total)}</span>
        </p>
        <p className="receipt-where">{receipt.fulfilment}</p>
      </motion.div>
      <button type="button" className="btn btn-primary btn-block" onClick={() => setCartOpen(false)}>
        Start a new order
      </button>
    </div>
  );
}
