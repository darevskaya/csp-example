type CreatureState = 'ran' | 'blocked' | 'xss';
type CreatureMode = 'default' | 'xss' | 'click' | 'strict-dynamic';

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

export class CspCreatureElement extends HTMLElement {
  private creature!: HTMLElement;
  private speech!: HTMLElement;

  connectedCallback(): void {
    const creature = this.querySelector<HTMLElement>('.creature');
    const speech = this.querySelector<HTMLElement>('.creature-speech');
    if (!creature || !speech) return;
    this.creature = creature;
    this.speech = speech;

    const mode = (this.dataset['mode'] ?? 'default') as CreatureMode;

    if (mode === 'strict-dynamic') {
      this.initStrictDynamic();
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const onRan = () => {
      if (timeout) clearTimeout(timeout);
      if (mode === 'xss') {
        this.applyState('xss', FACE.dead, MSG.xssRan);
      } else {
        this.applyState('ran', FACE.happy, MSG.scriptAllowed);
      }
    };

    const onBlocked = () => {
      this.applyState('blocked', FACE.dead, MSG.handlerBlocked);
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
              this.applyState('ran', FACE.happy, MSG.xssBlocked);
            } else {
              this.applyState('blocked', FACE.dead, MSG.scriptBlocked);
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

  private initStrictDynamic(): void {
    const injected = document.querySelector<CspCreatureElement>(
      'csp-creature[data-peer="injected"]',
    );

    setTimeout(() => {
      this.applyState('ran', FACE.happy, MSG.scriptRan);

      if (window.__creatureRan) {
        injected?.applyState('ran', FACE.happy, MSG.scriptAllowed);
      } else {
        const timeout = setTimeout(() => {
          injected?.applyState('blocked', FACE.dead, MSG.scriptBlocked);
        }, 400);
        window.markScriptRan = () => {
          clearTimeout(timeout);
          injected?.applyState('ran', FACE.happy, MSG.scriptAllowed);
        };
      }
    }, 400);
  }

  applyState(state: CreatureState, face: string, message: string): void {
    this.creature.textContent = face;
    this.creature.className = `creature ${state}`;
    this.speech.textContent = message;
    this.speech.className = `creature-speech ${state}`;
    this.className = `creature-panel card ${state}`;
  }
}

customElements.define('csp-creature', CspCreatureElement);
