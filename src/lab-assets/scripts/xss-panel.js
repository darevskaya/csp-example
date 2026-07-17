(() => {
  const panel = document.getElementById('result-card');
  const attempt = document.getElementById('exfil-attempt');
  const data = document.getElementById('exfil-data');

  if (!attempt || !data) return;

  if (attempt.className.includes('config-val--bad')) return;

  attempt.textContent = 'blocked by CSP';
  attempt.className = 'config-val config-val--good';
  if (data) {
    data.textContent = '—';
    data.className = 'config-val';
  }
  if (panel) panel.dataset.state = 'ran';
  if (typeof window.markScriptRan === 'function') window.markScriptRan();
})();
