(() => {
  const cfg = window.__CONFIG__;
  const panel = document.getElementById('result-card');

  function set(id, value, good) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.className = 'config-val ' + (good ? 'config-val--good' : 'config-val--bad');
  }

  if (cfg) {
    set('cfg-userId', String(cfg.userId), true);
    set('cfg-locale', cfg.locale, true);
    set('cfg-csrf', cfg.csrf, true);
    if (panel) panel.dataset.state = 'ran';
    if (typeof window.markScriptRan === 'function') window.markScriptRan();
  } else {
    set('cfg-userId', 'unavailable', false);
    set('cfg-locale', 'unavailable', false);
    set('cfg-csrf', 'unavailable', false);
    if (panel) panel.dataset.state = 'blocked';
  }
})();
