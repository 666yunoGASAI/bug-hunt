import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { OrderProvider } from './state/OrderContext';
import { HUNT_KEY } from './lib/storage';
import Header from './components/Header';
import OrderPage from './pages/OrderPage';
import HuntPage from './pages/HuntPage';
import LandingPage from './pages/LandingPage';
import CartDrawer from './components/CartDrawer';
import Toasts from './components/Toasts';

function useRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function App({ huntMode }: { huntMode: boolean }) {
  const route = useRoute();

  const toggleHunt = () => {
    try {
      localStorage.setItem(HUNT_KEY, huntMode ? 'off' : 'on');
      sessionStorage.removeItem('boba-bar:bugs');
    } catch {
      /* storage blocked */
    }
    // Reload so every bug switch applies from a clean start (including loading the cart).
    // (location.replace() to the same URL + #fragment would NOT reload: it's an in-page jump.)
    const url = new URL(window.location.href);
    url.searchParams.delete('bugs');
    window.history.replaceState(null, '', url.toString());
    window.location.reload();
  };

  return (
    <MotionConfig reducedMotion="user">
      <OrderProvider huntMode={huntMode} onToggleHunt={toggleHunt}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header route={route} />
        <main id="main" tabIndex={-1}>
          {route === '/hunt' ? <HuntPage /> : route === '/order' ? <OrderPage /> : <LandingPage />}
        </main>
        <footer className="site-footer">
          <p>
            Boba Bar is a demo shop for <strong>Bug Hunt</strong>, a QA showcase built by Akinon. No real orders are
            placed.
          </p>
        </footer>
        <CartDrawer />
        <Toasts />
      </OrderProvider>
    </MotionConfig>
  );
}
