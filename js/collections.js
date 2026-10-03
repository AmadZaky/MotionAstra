/* Local-only collections. Failed operations never enter Recent. */
window.ZxTCollections = (() => {
  'use strict';
  const key = 'zxt-collections-v1', known = new Set([
    ...window.MA_PRESETS.presets.map(p => 'core:' + p.id),
    ...window.YTMCore.presets.map(p => 'yu:' + p.id)
  ]), listeners = [];
  let mode = 'all', saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  const clean = (a, limit) => Array.isArray(a) ? [...new Set(a.filter(k => known.has(k)))].slice(0, limit) : [];
  let favorites = clean(saved.favorites, known.size), recent = clean(saved.recent, 20);
  function emit(save) {
    if (save) try { localStorage.setItem(key, JSON.stringify({favorites, recent})); } catch (_) {}
    listeners.forEach(fn => fn());
  }
  return {
    get mode() { return mode; },
    isFavorite(k) { return favorites.includes(k); },
    toggle(k) { if (!known.has(k)) return; favorites = favorites.includes(k) ? favorites.filter(v => v !== k) : [...favorites, k]; emit(true); },
    record(k) { if (!known.has(k)) return; recent = [k, ...recent.filter(v => v !== k)].slice(0, 20); emit(true); },
    setMode(value) { if (!['all','favorites','recent'].includes(value)) return; mode = value; emit(false); },
    subscribe(fn) { listeners.push(fn); },
    filter(items, id) {
      if (mode === 'all') return items;
      const keys = mode === 'favorites' ? favorites : recent;
      const result = items.filter(p => keys.includes(id(p)));
      return mode === 'recent' ? result.sort((a,b) => keys.indexOf(id(a)) - keys.indexOf(id(b))) : result;
    },
    button(k, name) {
      const b = document.createElement('button'); b.className = 'favorite-toggle';
      b.textContent = favorites.includes(k) ? '★' : '☆';
      b.setAttribute('aria-pressed', String(favorites.includes(k)));
      b.setAttribute('aria-label', 'Favorite ' + name); b.title = 'Favorite ' + name;
      b.onclick = () => this.toggle(k); return b;
    },
    empty() { return mode === 'favorites' ? 'No favorites here yet. Use ☆ on a preset to save it.' : mode === 'recent' ? 'No recently applied presets in this category.' : 'No matching presets.'; }
  };
})();
