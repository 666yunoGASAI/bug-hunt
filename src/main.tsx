import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import { parseBugList, setActiveBugs } from './lib/bugs';
import { HUNT_KEY } from './lib/storage';
import App from './App';
import './styles.css';

/**
 * Which planted bugs are on, decided BEFORE anything renders (loading the saved
 * cart already depends on it). Priority:
 *   1. sessionStorage "boba-bar:bugs"  (set by tests and the catch matrix)
 *   2. ?bugs=all | none | id,id        (shareable links)
 *   3. Hunt mode toggle saved in localStorage
 */
function readBugSetting(): { ids: string[]; hunt: boolean } {
  let forced: string | null = null;
  try {
    forced = sessionStorage.getItem('boba-bar:bugs');
  } catch {
    /* storage blocked */
  }
  const fromUrl = new URLSearchParams(window.location.search).get('bugs');
  const setting = forced ?? fromUrl;
  if (setting !== null) {
    const ids = parseBugList(setting);
    return { ids, hunt: ids.length > 0 };
  }
  let hunt = false;
  try {
    hunt = localStorage.getItem(HUNT_KEY) === 'on';
  } catch {
    /* storage blocked */
  }
  return { ids: hunt ? parseBugList('all') : [], hunt };
}

const { ids, hunt } = readBugSetting();
setActiveBugs(ids);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App huntMode={hunt} />
  </StrictMode>,
);
