type CreatureState = 'ran' | 'blocked' | 'xss';
type CreatureMode = 'default' | 'xss' | 'click' | 'strict-dynamic';

interface CreatureElements {
  creature: HTMLElement;
  speech: HTMLElement;
  panel: HTMLElement;
}

function getElements(suffix: string): CreatureElements | null {
  const sep = suffix ? `-${suffix}` : '';
  const creature = document.getElementById(`creature${sep}`);
  const speech = document.getElementById(`creature-speech${sep}`);
  const panel = document.getElementById(`creature-panel${sep}`);
  if (!creature || !speech || !panel) return null;
  return { creature, speech, panel };
}

function applyState(
  els: CreatureElements,
  state: CreatureState,
  face: string,
  message: string,
): void {
  els.creature.textContent = face;
  els.creature.className = `creature ${state}`;
  els.speech.textContent = message;
  els.speech.className = `creature-speech ${state}`;
  els.panel.className = `creature-panel card ${state}`;
}

export function initCreature(el: HTMLElement): void {
  const mode = (el.dataset['mode'] ?? 'default') as CreatureMode;

  if (mode === 'strict-dynamic') {
    const loaderEls = getElements('loader');
    const injectedEls = getElements('injected');

    setTimeout(() => {
      if (loaderEls) applyState(loaderEls, 'ran', '( ^-^)', 'Script ran');

      if (window.__creatureRan) {
        if (injectedEls) applyState(injectedEls, 'ran', '( ^-^)', 'Script allowed');
      } else {
        const timeout = setTimeout(() => {
          if (injectedEls) applyState(injectedEls, 'blocked', '( x_x)', 'CSP blocked the script');
        }, 400);
        window.markScriptRan = () => {
          clearTimeout(timeout);
          if (injectedEls) applyState(injectedEls, 'ran', '( ^-^)', 'Script allowed');
        };
      }
    }, 400);
    return;
  }

  const els = getElements('');
  if (!els) return;

  let timeout: ReturnType<typeof setTimeout> | null = null;

  const onRan = () => {
    if (timeout) clearTimeout(timeout);
    if (mode === 'xss') {
      applyState(els, 'xss', '( x_x)', 'XSS ran — no CSP');
    } else {
      applyState(els, 'ran', '( ^-^)', 'Script allowed');
    }
  };

  const onBlocked = () => {
    applyState(els, 'blocked', '( x_x)', 'Handler blocked by CSP');
  };

  timeout =
    mode === 'click'
      ? null
      : setTimeout(() => {
          if (window.__creatureRan) {
            onRan();
          } else if (window.__creatureBlocked) {
            onBlocked();
          } else if (mode === 'xss') {
            applyState(els, 'ran', '( ^-^)', 'CSP blocked the XSS');
          } else {
            applyState(els, 'blocked', '( x_x)', 'CSP blocked the script');
          }
        }, 400);

  window.markScriptRan = () => {
    window.__creatureRan = true;
    onRan();
  };

  window.markHandlerBlocked = () => {
    window.__creatureBlocked = true;
    onBlocked();
  };
}
