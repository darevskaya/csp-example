// Lab-asset scripts (sdk.js, xss-panel.js) run outside the module system and
// can't import from creature.ts directly, so they communicate via window globals.
declare global {
  interface Window {
    markScriptRan?: () => void;
    markHandlerBlocked?: () => void;
    __creatureRan?: boolean;
    __creatureBlocked?: boolean;
  }
}

export {};
