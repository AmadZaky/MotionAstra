/* Apply validated appearance preferences before paint; never recolor FX artwork. */
(function () {
  'use strict';
  const palettes = {
    orange: { fill: '#ff943f', ink: '#ffad6b', light: '#934100', on: '#211309' },
    lime: { fill: '#c5ef69', ink: '#c5ef69', light: '#416300', on: '#172006' },
    blue: { fill: '#85caff', ink: '#85caff', light: '#005d96', on: '#092031' },
    burgundy: { fill: '#802b46', ink: '#efa1ba', light: '#802b46', on: '#ffffff' },
    white: { fill: '#f4f4f5', ink: '#f4f4f5', light: '#343438', on: '#18181b' }
  };
  let theme = 'dark', accent = 'orange';
  try {
    theme = localStorage.getItem('ma-theme') === 'light' ? 'light' : 'dark';
    const saved = localStorage.getItem('zxt-accent');
    if (Object.prototype.hasOwnProperty.call(palettes, saved)) accent = saved;
  } catch (_) {}
  function apply() {
    const root = document.documentElement, p = palettes[accent];
    root.dataset.theme = theme;
    root.dataset.accent = accent;
    root.style.setProperty('--accent', theme === 'light' ? p.light : p.ink);
    root.style.setProperty('--accent-fill', p.fill);
    root.style.setProperty('--on-accent', p.on);
    root.style.setProperty('--orange-soft', (theme === 'light' ? p.light : p.ink) + '16');
    root.style.setProperty('--accent-border', (theme === 'light' ? p.light : p.ink) + '66');
    try { localStorage.setItem('ma-theme', theme); localStorage.setItem('zxt-accent', accent); } catch (_) {}
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '☀' : '☾';
      toggle.title = 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode';
      toggle.setAttribute('aria-label', toggle.title);
      toggle.setAttribute('aria-pressed', String(theme === 'light'));
    }
    document.querySelectorAll('[data-accent]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.accent === accent));
    });
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; apply(); };
    document.querySelectorAll('#accent-options button').forEach(button => {
      button.onclick = () => { accent = button.dataset.accent; apply(); };
    });
  });
})();
