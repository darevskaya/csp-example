declare global {
  interface Window {
    markScriptRan?: () => void;
    markHandlerBlocked?: () => void;
    __creatureRan?: boolean;
    __creatureBlocked?: boolean;
  }
}

export {};
