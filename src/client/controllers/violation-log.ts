function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initViolationLog(panel: HTMLElement): void {
  const list = panel.querySelector<HTMLElement>('.violation-list');
  let empty = panel.querySelector<HTMLElement>('.violation-empty');
  if (!list) return;

  document.addEventListener('securitypolicyviolation', (e) => {
    if (empty) {
      empty.style.display = 'none';
      empty = null;
    }

    const blocked = e.blockedURI || '(empty)';
    const directive = e.effectiveDirective || e.violatedDirective || '(unknown)';
    const disposition = e.disposition || 'enforce';

    const item = document.createElement('div');
    item.className = 'violation-item';
    item.innerHTML =
      `<span class="violation-directive">${escapeHtml(directive)}</span>` +
      `<span class="violation-blocked">${escapeHtml(blocked)}</span>` +
      `<span class="violation-disposition violation-disposition--${escapeHtml(disposition)}">${escapeHtml(disposition)}</span>`;

    list.appendChild(item);
    panel.dataset['state'] = 'active';
  });
}
