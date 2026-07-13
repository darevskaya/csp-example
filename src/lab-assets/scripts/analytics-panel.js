(() => {
  const ana = window.__ANALYTICS__;
  const panel = document.getElementById('result-card');

  function set(id, value, good) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.className = 'config-val ' + (good ? 'config-val--good' : 'config-val--bad');
  }

  if (ana && ana.ready) {
    set('ana-status', 'ready', true);
    set('ana-provider', ana.provider, true);
    if (panel) panel.dataset.state = 'ran';
    if (typeof window.markScriptRan === 'function') window.markScriptRan();
  } else {
    set('ana-status', 'unavailable', false);
    set('ana-provider', 'unavailable', false);
    if (panel) panel.dataset.state = 'blocked';
  }
})();
