import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, type KeyboardEvent } from 'react';
import Cup from '../components/Cup';
import { BUGS, bug, triggered } from '../lib/bugs';
import { formatPeso, sugarLabel } from '../lib/format';
import { DRINKS, findDrink, ICE_LABELS, LARGE_SURCHARGE, MAX_QTY, MAX_TOPPINGS, SUGAR_LEVELS, TOPPINGS, type Ice, type Size, type Sugar } from '../lib/menu';
import { isB1T1Day, toggleTopping, unitPrice } from '../lib/order';
import { useOrder } from '../state/OrderContext';

export default function OrderPage() {
  const { add, notify, now, huntMode, caught } = useOrder();
  const [drinkId, setDrinkId] = useState(DRINKS[0].id);
  const [size, setSize] = useState<Size>('regular');
  const [sugar, setSugar] = useState<Sugar>(50);
  const [ice, setIce] = useState<Ice>('regular-ice');
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [toppingError, setToppingError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const builderRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  function pickDrink(id: string) {
    setDrinkId(id);
    // On narrow screens the builder sits below the menu: bring it into view.
    if (window.matchMedia('(max-width: 1100px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => builderRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60);
    }
  }

  const drink = findDrink(drinkId);
  const config = { drinkId, size, sugar, ice, toppings };
  const price = unitPrice(config) * qty;

  function onTopping(id: string) {
    const result = toggleTopping(toppings, id);
    if (result.ok) {
      setToppings(result.toppings);
      setToppingError(null);
    } else {
      setToppingError(result.error);
    }
  }

  function onAdd() {
    add(config, qty);
    notify(`Added ${qty} × ${drink.name}`);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1300);
    setQty(1);
  }

  // Planted bug "keyboard-add": tabbing past the quantity control skips the Add control.
  function onQtyKey(e: KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey && bug('keyboard-add')) triggered('keyboard-add');
  }

  const labelText = justAdded ? 'Added to your order ✓' : `Add to order · ${formatPeso(price)}`;
  const addLabel = reduce ? (
    <span className="add-label">{labelText}</span>
  ) : (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={justAdded ? 'added' : 'add'}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -14, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="add-label"
      >
        {labelText}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <>
      <section className="hero">
        <motion.h1 initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
          Build your boba.
        </motion.h1>
        <p className="hero-sub">Pick a drink, make it yours, and we’ll bring it over. Free delivery from ₱500.</p>
        <div className="hero-tags">
          {isB1T1Day(now) && (
            <span className="ribbon" data-testid="b1t1-ribbon">
              It’s Tuesday: Buy 1 Take 1 on every drink
            </span>
          )}
          {huntMode && (
            <a href="#/hunt" className="ribbon ribbon-hunt" data-testid="hunt-banner">
              Bug Hunt is on: {BUGS.length - caught.length} bugs still hiding. See the board
            </a>
          )}
        </div>
      </section>

      <div className="order-layout">
        <section className="menu" aria-labelledby="menu-title">
          <h2 id="menu-title">Menu</h2>
          <ul className="menu-grid">
            {DRINKS.map((d, i) => (
              <motion.li key={d.id} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                <button
                  type="button"
                  className="drink-card"
                  aria-pressed={d.id === drinkId}
                  onClick={() => pickDrink(d.id)}
                  style={{ ['--tea' as string]: d.tea, ['--swirl' as string]: d.swirl }}
                >
                  <span className="drink-swatch" aria-hidden="true" />
                  <span className="drink-name">{d.name}</span>
                  <span className="drink-desc">{d.description}</span>
                  <span className="drink-price">{formatPeso(d.price)}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </section>

        <section ref={builderRef} className="builder" aria-labelledby="builder-title" style={{ ['--tea' as string]: drink.tea }}>
          <div className="builder-cup">
            <Cup drinkId={drinkId} size={size} ice={ice} toppings={toppings} />
          </div>
          <div className="builder-body">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={drinkId} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                <h2 id="builder-title">{drink.name}</h2>
                <p className="builder-desc">{drink.description}</p>
              </motion.div>
            </AnimatePresence>

            <fieldset className="option">
              <legend>Size</legend>
              <div className="segmented">
                {(['regular', 'large'] as Size[]).map((s) => (
                  <label key={s} className="seg">
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
                    <span>{s === 'regular' ? 'Regular' : `Large +₱${LARGE_SURCHARGE}`}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="option">
              <legend>
                Sweetness <span className="legend-value" data-testid="sugar-value">{sugarLabel(sugar)}</span>
              </legend>
              <div className="segmented segmented-5">
                {SUGAR_LEVELS.map((level) => (
                  <label key={level} className="seg">
                    <input type="radio" name="sugar" value={level} checked={sugar === level} onChange={() => setSugar(level)} aria-label={sugarLabel(level)} />
                    <span aria-hidden="true">{level}%</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="option">
              <legend>Ice</legend>
              <div className="segmented">
                {(Object.keys(ICE_LABELS) as Ice[]).map((level) => (
                  <label key={level} className="seg">
                    <input type="radio" name="ice" value={level} checked={ice === level} onChange={() => setIce(level)} />
                    <span>{ICE_LABELS[level]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="option">
              <legend>
                Toppings <span className="legend-value">up to {MAX_TOPPINGS}</span>
              </legend>
              <div className="chips">
                {TOPPINGS.map((t) => (
                  <label key={t.id} className="chip" style={{ ['--dot' as string]: t.colour }}>
                    <input type="checkbox" checked={toppings.includes(t.id)} onChange={() => onTopping(t.id)} />
                    <span>
                      <span className="chip-dot" aria-hidden="true" />
                      {t.name} <span className="chip-price">+₱{t.price}</span>
                    </span>
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {toppingError && (
                  <motion.p className="field-error" role="alert" initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {toppingError}
                  </motion.p>
                )}
              </AnimatePresence>
            </fieldset>

            <div className="add-row">
              <div className="stepper" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One less">
                  −
                </button>
                <output aria-live="polite" data-testid="builder-qty">
                  {qty}
                </output>
                <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="One more" onKeyDown={onQtyKey}>
                  +
                </button>
              </div>

              {bug('keyboard-add') ? (
                <motion.div className="btn btn-primary add-button" onClick={onAdd} whileTap={{ scale: 0.96 }} data-testid="add-to-order">
                  {addLabel}
                </motion.div>
              ) : (
                <motion.button type="button" className="btn btn-primary add-button" onClick={onAdd} whileTap={{ scale: 0.96 }} data-testid="add-to-order">
                  {addLabel}
                </motion.button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
