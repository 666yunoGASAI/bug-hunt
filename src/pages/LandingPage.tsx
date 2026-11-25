import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Cup from '../components/Cup';
import { BUGS } from '../lib/bugs';
import { DRINKS } from '../lib/menu';
import { HUNT_KEY } from '../lib/storage';
import { useOrder } from '../state/OrderContext';

const REPO = 'https://github.com/666yunoGASAI/bug-hunt';

/** The hero cup cycles through the menu, so the shop's one bold element greets you first. */
const SHOWCASE = [
  { drinkId: 'taro', toppings: ['pearls', 'cream-cheese'] },
  { drinkId: 'thai', toppings: ['popping', 'nata'] },
  { drinkId: 'matcha', toppings: ['pudding', 'pearls'] },
  { drinkId: 'brown-sugar', toppings: ['pearls', 'grass-jelly'] },
];

export function startHunt(huntMode: boolean) {
  if (huntMode) {
    window.location.hash = '/hunt';
    return;
  }
  try {
    localStorage.setItem(HUNT_KEY, 'on');
    sessionStorage.removeItem('boba-bar:bugs');
  } catch {
    /* storage blocked: the board still opens, just without Hunt mode */
  }
  window.history.replaceState(null, '', `${window.location.pathname}#/hunt`);
  window.location.reload();
}

export default function LandingPage() {
  const { huntMode, caught } = useOrder();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SHOWCASE.length), 2600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const show = SHOWCASE[index];
  const drink = DRINKS.find((d) => d.id === show.drinkId)!;
  const rise = (delay: number) => (reduce ? {} : { initial: { y: 28, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 110, damping: 16, delay } });

  return (
    <div className="landing" style={{ ['--tea' as string]: drink.tea }}>
      <section className="landing-hero">
        <div className="landing-copy">
          <motion.p className="landing-kicker" {...rise(0)}>
            A milk tea shop with {BUGS.length} bugs hiding inside
          </motion.p>
          <motion.h1 {...rise(0.06)}>Find the boba. Find the bugs.</motion.h1>
          <motion.p className="landing-sub" {...rise(0.12)}>
            Order like a real customer, or switch on Hunt mode and try to trigger every bug we planted: wrong totals,
            broken promos, vanishing orders and more.
          </motion.p>
          <motion.div className="landing-ctas" {...rise(0.18)}>
            <a href="#/order" className="btn btn-primary btn-big">
              Order a boba
            </a>
            <button type="button" className="btn btn-dark btn-big" onClick={() => startHunt(huntMode)}>
              {huntMode ? `Back to the hunt · ${caught.length}/${BUGS.length}` : 'Start the hunt'}
            </button>
          </motion.div>
        </div>

        <div className="landing-stage" aria-hidden="true">
          <div className="landing-glow" />
          <div className="landing-cup">
            <Cup drinkId={show.drinkId} size="large" ice="less-ice" toppings={show.toppings} />
          </div>
          <motion.p key={drink.id} className="landing-flavour" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {drink.name}
          </motion.p>
        </div>
      </section>

      <section className="landing-steps" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol>
          <li>
            <span className="step-num" aria-hidden="true">1</span>
            <h3>Order like a customer</h3>
            <p>Build a drink, add toppings, use a promo code, check out. With Hunt mode off, everything works.</p>
          </li>
          <li>
            <span className="step-num" aria-hidden="true">2</span>
            <h3>Switch on Hunt mode</h3>
            <p>{BUGS.length} bugs wake up: boundaries, rounding, state, persistence, time zones and accessibility.</p>
          </li>
          <li>
            <span className="step-num" aria-hidden="true">3</span>
            <h3>Catch them all</h3>
            <p>Every bug you trigger flips over on the board, with what went wrong and why.</p>
          </li>
        </ol>
      </section>

      <section className="landing-proof" aria-labelledby="proof-title">
        <h2 id="proof-title">The tests catch every one</h2>
        <p className="landing-proof-sub">
          Bug Hunt is a QA showcase. Each planted bug is switched on by itself and the whole test suite runs: if no test
          fails, the build fails.
        </p>
        <dl className="proof-grid">
          <div>
            <dt>Planted bugs caught</dt>
            <dd>10/10</dd>
          </div>
          <div>
            <dt>Mutation score</dt>
            <dd>98.96%</dd>
          </div>
          <div>
            <dt>Unit and property tests</dt>
            <dd>81</dd>
          </div>
          <div>
            <dt>Browser tests</dt>
            <dd>35 × 4</dd>
          </div>
        </dl>
        <a href={REPO} className="btn btn-quiet" target="_blank" rel="noopener">
          Read the code and the test strategy
        </a>
      </section>
    </div>
  );
}
