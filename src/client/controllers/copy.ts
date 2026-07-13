export function initCopyButton(btn: HTMLElement): void {
  btn.addEventListener('click', () => {
    const target = btn.dataset['copyTarget'];
    const text = target
      ? (document.getElementById(target)?.textContent ?? '')
      : (btn.dataset['copy'] ?? '');

    void navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });
  });
}
