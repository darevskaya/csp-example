export function initCopyButton(btn: HTMLElement): void {
  btn.addEventListener('click', () => {
    const target = btn.dataset['copyTarget'];
    const text = target
      ? (document.getElementById(target)?.textContent ?? '')
      : (btn.dataset['copy'] ?? '');

    const original = btn.textContent;
    void navigator.clipboard.writeText(text).then(
      () => {
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      },
      () => {
        btn.textContent = original;
      },
    );
  });
}
