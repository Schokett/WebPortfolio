import './styles.scss';

type Theme = 'light' | 'dark';
type Mode = 'auto' | Theme; // 'auto' = System steuert

const THEME_KEY = 'theme'; // gespeichert nur 'light' oder 'dark'
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
    root.removeAttribute('data-theme'); // CSS fällt auf System zurück
    updateBtnUI('auto', getSystemTheme());
  } else {
    localStorage.setItem(THEME_KEY, mode);
    root.setAttribute('data-theme', mode);
    updateBtnUI(mode, mode);
  }
}

function updateBtnUI(mode: Mode, effective: Theme) {
  if (!btn) return;
  btn.setAttribute('data-mode', mode); // für Icons per CSS
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
    e.preventDefault(); // Click nach Longpress ignorieren
    return;
  }
  toggleFixed();
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial anwenden
  applyMode(getSavedMode());

  if (btn) {
    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointerleave', onPointerUp);
    btn.addEventListener('pointercancel', onPointerUp);
    btn.addEventListener('click', onClick);
  } else {
    console.warn('Theme toggle button not found; skipping init.');
  }

  // Im Auto-Modus Systemwechseln folgen (mit Safari-Fallback)
  const onMqlChange = () => {
    if (getSavedMode() === 'auto') {
      applyMode('auto');
      rippleOnce();
      kickThemeSwapFX();
    }
  };
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onMqlChange);
  } else {
    // @ts-ignore - ältere Browser
    mql.addListener(onMqlChange);
  }

  // Jahr im Footer (optional)
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
});

// Button-Glow beim Theme-Switch
function rippleOnce() {
  if (!btn) return;
  btn.classList.remove('is-rippling'); // re-trigger
  void btn.offsetWidth;                // force reflow
  btn.classList.add('is-rippling');
}

function kickThemeSwapFX() {
  const el = document.documentElement;
  el.classList.remove('theme-swap');
  void el.offsetWidth;
  el.classList.add('theme-swap');
}

document.addEventListener('animationend', (e) => {
  const t = e.target as HTMLElement;
  if (t === document.documentElement && e.animationName === 'pop') {
    document.documentElement.classList.remove('theme-swap');
  }
});

(() => {
  const el = document.getElementById('scrollTopBtn');
  if (!(el instanceof HTMLButtonElement)) return; // type guard

  const SHOW_AFTER = 400;

  const toggleFab = () => {
    if (window.scrollY > SHOW_AFTER) el.classList.add('show');
    else el.classList.remove('show');
  };

  toggleFab();
  window.addEventListener('scroll', toggleFab, { passive: true });

  el.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

(() => {
  const svg = document.querySelector('.kozu-bot');
  const left = svg?.querySelector('.pupil-left');
  const right = svg?.querySelector('.pupil-right');
  if (!svg || !left || !right) return;

  const cxL = 62, cyL = 70, cxR = 98, cyR = 70; // Augenmittelpunkte in SVG-Koordinaten
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function move(e) {
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 160; // viewBox x
    const y = ((e.clientY - rect.top) / rect.height) * 180; // viewBox y

    const max = 3.5;      // wie weit Pupillen wandern dürfen (px im viewBox-Sinn)
    const k = 0.08;     // Sensitivität

    const dxL = clamp((x - cxL) * k, -max, max);
    const dyL = clamp((y - cyL) * k, -max, max);
    const dxR = clamp((x - cxR) * k, -max, max);
    const dyR = clamp((y - cyR) * k, -max, max);

    left.style.setProperty('--tx', dxL + 'px');
    left.style.setProperty('--ty', dyL + 'px');
    right.style.setProperty('--tx', dxR + 'px');
    right.style.setProperty('--ty', dyR + 'px');
  }

  function reset() {
    left.style.removeProperty('--tx'); left.style.removeProperty('--ty');
    right.style.removeProperty('--tx'); right.style.removeProperty('--ty');
  }

  // Performance-freundlich: nur wenn Maus drüber
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', reset);
})();

// Herzchen-Effekt bei Klick auf die Maskottchen
const mascot = document.querySelector('.mascot-wrap');
const heartColors = ["❤️", "💖", "🩷"];

if (mascot) {
  mascot.addEventListener('click', (e) => {
    const rect = mascot.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const count = Math.floor(Math.random() * 3) + 3; // 3–5 Herzen

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span');
      heart.classList.add('heart');
      heart.textContent = heartColors[Math.floor(Math.random() * heartColors.length)];

      // Startposition
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';

      // Zufällige Werte
      const dx = (Math.random() - 0.5) * 60; // -30 bis 30 px seitlich
      const scale = 0.8 + Math.random() * 1.2; // 0.8 – 2.0

      heart.style.setProperty('--x', dx + 'px');
      heart.style.setProperty('--s', scale);

      mascot.appendChild(heart);

      setTimeout(() => heart.remove(), 2000);
    }
  });
}
