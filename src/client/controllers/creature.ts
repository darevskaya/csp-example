type CreatureState = 'ran' | 'blocked' | 'xss';
type CreatureMode = 'default' | 'xss' | 'click' | 'strict-dynamic';

interface CreatureElements {
  creature: HTMLElement;
  speech: HTMLElement;
  panel: HTMLElement;
}

const FACE = {
  happy: '( ^-^)',
  dead: '( x_x)',
} as const;

const MSG = {
  scriptRan: 'Script ran',
  scriptAllowed: 'Script allowed',
  scriptBlocked: 'CSP blocked the script',
  xssRan: 'XSS ran — no CSP',
  xssBlocked: 'CSP blocked the XSS',
  handlerBlocked: 'Handler blocked by CSP',
} as const;

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
      if (loaderEls) applyState(loaderEls, 'ran', FACE.happy, MSG.scriptRan);

      if (window.__creatureRan) {
        if (injectedEls) applyState(injectedEls, 'ran', FACE.happy, MSG.scriptAllowed);
      } else {
        const timeout = setTimeout(() => {
          if (injectedEls) applyState(injectedEls, 'blocked', FACE.dead, MSG.scriptBlocked);
        }, 400);
        window.markScriptRan = () => {
          clearTimeout(timeout);
          if (injectedEls) applyState(injectedEls, 'ran', FACE.happy, MSG.scriptAllowed);
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
      applyState(els, 'xss', FACE.dead, MSG.xssRan);
    } else {
      applyState(els, 'ran', FACE.happy, MSG.scriptAllowed);
    }
  };

  const onBlocked = () => {
    applyState(els, 'blocked', FACE.dead, MSG.handlerBlocked);
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
            applyState(els, 'ran', FACE.happy, MSG.xssBlocked);
          } else {
            applyState(els, 'blocked', FACE.dead, MSG.scriptBlocked);
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
