import { motion, useReducedMotion } from 'framer-motion';
import Confetti from '../components/Confetti';
import { BUGS } from '../lib/bugs';
import { useOrder } from '../state/OrderContext';

const REPO = 'https://github.com/666yunoGASAI/bug-hunt';

function Ring({ caught, total }: { caught: number; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 128 128" className="ring" aria-hidden="true">
      <circle cx="64" cy="64" r={r} className="ring-track" />
      <motion.circle
        cx="64"
        cy="64"
        r={r}
        className="ring-fill"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * caught) / total }}
        transition={{ type: 'spring', stiffness: 60, damping: 16 }}
      />
      <text x="64" y="62" textAnchor="middle" className="ring-number">
        {caught}
      </text>
      <text x="64" y="84" textAnchor="middle" className="ring-label">
        of {total}
      </text>
    </svg>
  );
}

export default function HuntPage() {
  const { huntMode, toggleHunt, caught, resetCaught } = useOrder();
  const all = caught.length === BUGS.length;
  const reduce = useReducedMotion();

  return (
    <div className="hunt">
      {all && <Confetti pieces={70} />}
      <section className="hunt-hero">
        <div>
          <motion.h1 initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            Bug Hunt
          </motion.h1>
          <p className="hero-sub">
            {BUGS.length} bugs are hiding in Boba Bar. Turn on Hunt mode, order like a real customer, and every bug you
            trigger is pinned here.
          </p>
          <div className="hunt-actions">
            <button type="button" className={huntMode ? 'btn btn-dark' : 'btn btn-primary'} onClick={toggleHunt}>
              {huntMode ? 'Turn off Hunt mode' : 'Turn on Hunt mode'}
            </button>
            {caught.length > 0 && (
              <button type="button" className="btn btn-quiet" onClick={resetCaught}>
                Reset my progress
              </button>
            )}
          </div>
          {!huntMode && <p className="hunt-note">With Hunt mode off, the shop works correctly and every test passes.</p>}
        </div>
        <div className="hunt-score" data-testid="hunt-score">
          <Ring caught={caught.length} total={BUGS.length} />
          <p>{all ? 'Every bug caught. Nice hunting.' : `${caught.length} of ${BUGS.length} bugs caught`}</p>
        </div>
      </section>

      <ol className="bug-grid">
        {BUGS.map((b, i) => {
          const isCaught = caught.includes(b.id);
          return (
            <li key={b.id} className="bug-slot" data-testid="bug-card" data-caught={isCaught ? 'true' : 'false'}>
              <motion.div
                className="bug-card"
                initial={false}
                animate={{ rotateY: isCaught ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 14, delay: isCaught ? 0.1 : 0 }}
              >
                <div className="bug-face bug-front" aria-hidden={isCaught}>
                  <span className="bug-num">Bug {i + 1}</span>
                  <span className="bug-kind">{b.kind}</span>
                  <p className="bug-hint">{b.hint}</p>
                  <span className="bug-lock" aria-hidden="true">
                    ?
                  </span>
                </div>
                <div className="bug-face bug-back" aria-hidden={!isCaught}>
                  <span className="bug-num">Bug {i + 1} · caught</span>
                  <h2 className="bug-title">{b.title}</h2>
                  <p className="bug-explain">{b.explanation}</p>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>

      <section className="hunt-how">
        <h2>How the tests catch every one</h2>
        <p>
          Each bug sits behind a switch. A script turns them on one at a time and runs the whole test suite: every bug must
          make at least one test fail, or the build fails. Mutation testing then checks the tests themselves by breaking the
          pricing code in hundreds of small ways.
        </p>
        <p>
          <a href={`${REPO}/blob/main/docs/CATCH_MATRIX.md`} target="_blank" rel="noopener">
            See which test catches which bug
          </a>
        </p>
      </section>
    </div>
  );
}
