import './styles.scss';

type Theme = 'light' | 'dark';
type Mode = 'auto' | Theme;                 // 'auto' = System steuert

const THEME_KEY = 'theme';                  // gespeichert nur 'light' oder 'dark'
const root = document.documentElement;
const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function getSavedMode(): Mode {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  return saved ?? 'auto';
}
function getSystemTheme(): Theme {
  return mql.matches ? 'dark' : 'light';
}
function getEffectiveTheme(): Theme {
  const mode = getSavedMode();
  return mode === 'auto' ? getSystemTheme() : mode;
}

function applyMode(mode: Mode) {
  if (mode === 'auto') {
    localStorage.removeItem(THEME_KEY);
    root.removeAttribute('data-theme');                 // CSS fällt auf System zurück
    updateBtnUI('auto', getSystemTheme());
  } else {
    localStorage.setItem(THEME_KEY, mode);
    root.setAttribute('data-theme', mode);
    updateBtnUI(mode, mode);
  }
}

function updateBtnUI(mode: Mode, effective: Theme) {
  if (!btn) return;
  btn.setAttribute('data-mode', mode);                  // für Icons per CSS
  const next = effective === 'dark' ? 'light' : 'dark';
  const label =
    mode === 'auto'
      ? `Auto (System: ${effective}). Kurz-Klick für ${next}. Lang-Klick für Auto.`
      : `Fixiert: ${effective}. Kurz-Klick für ${next}. Lang-Klick für Auto.`;
  btn.setAttribute('aria-label', label);
  btn.title = label;
}

// --- Interaktion: Kurz-Klick = light/dark toggeln, Lang-Klick = Auto ---
function toggleFixed() {
  const effective = getEffectiveTheme();
  const next: Theme = effective === 'dark' ? 'light' : 'dark';
  applyMode(next);
  rippleOnce();
  kickThemeSwapFX();

}

// Lang-Klick erkennen (500ms halten)
let pressTimer: number | undefined;
let didLongPress = false;

function onPointerDown() {
  didLongPress = false;
  pressTimer = window.setTimeout(() => {
    didLongPress = true;
    applyMode('auto');
    rippleOnce();
    kickThemeSwapFX();
  }, 500);
}
function onPointerUp() {
  if (pressTimer) window.clearTimeout(pressTimer);
}
function onClick(e: MouseEvent) {
  if (didLongPress) {
    e.preventDefault();                                  // Click nach Longpress ignorieren
    return;
  }
  toggleFixed();
}

document.addEventListener('DOMContentLoaded', () => {
  applyMode(getSavedMode());                             // 'auto' oder gespeichertes Theme

  if (btn) {
    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointerleave', onPointerUp);
    btn.addEventListener('pointercancel', onPointerUp);
    btn.addEventListener('click', onClick);
  }

  // Im Auto-Modus Systemwechseln folgen
 mql.addEventListener('change', () => {
  if (getSavedMode() === 'auto') {
    applyMode('auto');
    rippleOnce();
    kickThemeSwapFX();
  }
});


  // Jahr im Footer (optional)
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
});

//Button-Icons animation

// globaler Button-Glow beim Theme-Switch
function rippleOnce() {
  if (!btn) return;
  btn.classList.remove('is-rippling'); // re-trigger
  void btn.offsetWidth;                // force reflow
  btn.classList.add('is-rippling');
}


function kickThemeSwapFX() {
  const el = document.documentElement;
  el.classList.remove('theme-swap');
  // re-trigger
  void el.offsetWidth;
  el.classList.add('theme-swap');
}


document.addEventListener('animationend', (e) => {
  const t = e.target as HTMLElement;
  if (t === document.documentElement && e.animationName === 'pop') {
    document.documentElement.classList.remove('theme-swap');
  }
});

// --- FAB Button ---
 (function () {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  const SHOW_AFTER = 400;

  function toggleFab() {
    if (window.scrollY > SHOW_AFTER) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }

  toggleFab();
  window.addEventListener('scroll', toggleFab, { passive: true });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();



