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
// kozu
(() => {
  const svg = document.querySelector('.kozu-bot') as SVGSVGElement | null;
  const left = svg?.querySelector('.pupil-left') as SVGElement | null;
  const right = svg?.querySelector('.pupil-right') as SVGElement | null;
  if (!svg || !left || !right) return;

  const cxL = 62, cyL = 70, cxR = 98, cyR = 70; // Augenmittelpunkte in SVG-Koordinaten
  const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

  function move(e: PointerEvent) {
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 160; // viewBox x
    const y = ((e.clientY - rect.top) / rect.height) * 180; // viewBox y

    const max = 3.5;  // wie weit Pupillen wandern dürfen (px im viewBox-Sinn)
    const k = 0.08;   // Sensitivität

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
    left.style.removeProperty('--tx');
    left.style.removeProperty('--ty');
    right.style.removeProperty('--tx');
    right.style.removeProperty('--ty');
  }

  // Performance-freundlich: nur wenn Maus drüber
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', reset);
})();

// --- Kozu hearts + speech (TS safe) ---
(() => {
  const mascot = document.querySelector<HTMLElement>('.mascot');
  if (!mascot) {
    console.warn('[mascot] Element .mascot nicht gefunden – skip append');
    return;
  }
  // Ab hier nur noch nicht-nullable Referenz verwenden:
  const mascotEl: HTMLElement = mascot;

  const speechEl = document.querySelector<HTMLElement>('.mascot-speech');
  const heartColors = ["❤️", "💖", "🩷"] as const;
  const messages = [
    "Hehe, kitzelt! 💜",
    "Kozu freut sich! 🎉",
  ] as const;

  let clickCount = 0;
  let speechTimer: number | undefined; // setTimeout-ID im Browser

  // Browser-UI unterdrücken (Spam-Klicks)
  mascotEl.addEventListener('contextmenu', e => e.preventDefault());
  mascotEl.addEventListener('mousedown',   e => e.preventDefault());
  mascotEl.addEventListener('touchstart',  () => {}, { passive: true });

  // sanftes Rate-Limit
  let lastTime = 0;
  const canFire = () => {
    const now = performance.now();
    if (now - lastTime < 120) return false;
    lastTime = now;
    return true;
  };

  function spawnHearts(x: number, y: number): void {
    const count = Math.floor(Math.random() * 3) + 3; // 3–5
    for (let i = 0; i < count; i++) {
      const heart: HTMLSpanElement = document.createElement('span');
      heart.className = Math.random() < 0.5 ? 'heart' : 'heart rotate';
      heart.textContent = heartColors[Math.floor(Math.random() * heartColors.length)];

      heart.style.left = `${x}px`;
      heart.style.top  = `${y}px`;

      const dx = (Math.random() - 0.5) * 60;   // -30..30 px
      const scale = 0.8 + Math.random() * 1.2; // 0.8..2.0
      const rot = (Math.random() - 0.5) * 60;  // -30..30°

      heart.style.setProperty('--x', `${dx}px`);
      heart.style.setProperty('--s', String(scale));
      heart.style.setProperty('--r', `${rot}deg`);

      mascotEl.appendChild(heart);
      window.setTimeout(() => heart.remove(), 2000);
    }
  }

  function showSpeech(): void {
    if (!speechEl) return; // falls keine Blase im DOM, still aussteigen
    const msg = messages[Math.floor(Math.random() * messages.length)];
    speechEl.textContent = msg;
    speechEl.classList.add('show');
    if (speechTimer) window.clearTimeout(speechTimer);
    speechTimer = window.setTimeout(() => speechEl.classList.remove('show'), 1800);
  }

  mascotEl.addEventListener('click', (e: MouseEvent) => {
    if (!canFire()) return;

    const rect = mascotEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    spawnHearts(x, y);

    clickCount++;
    if (clickCount > 5) {
      showSpeech();
      clickCount = 0;
    }
  });
})();
