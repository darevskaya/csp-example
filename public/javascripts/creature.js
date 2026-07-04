(function () {
  const mode = document.currentScript && document.currentScript.dataset.mode;
  const xss = mode === 'xss';
  const click = mode === 'click';
  const strictDynamic = mode === 'strict-dynamic';

  function setCreature(creatureId, speechId, panelId, state, face, speech) {
    const creature = document.getElementById(creatureId);
    const speechEl = document.getElementById(speechId);
    const panel = document.getElementById(panelId);
    creature.textContent = face;
    creature.className = 'creature ' + state;
    speechEl.textContent = speech;
    speechEl.className = 'creature-speech ' + state;
    panel.className = 'creature-panel card ' + state;
  }

  function setMain(state, face, speech) {
    setCreature('creature', 'creature-speech', 'creature-panel', state, face, speech);
  }

  if (strictDynamic) {
    setCreature('creature-loader', 'creature-speech-loader', 'creature-panel-loader', 'ran', '( ^‿^)', 'Script ran');

    const timeout = setTimeout(function () {
      setCreature('creature-injected', 'creature-speech-injected', 'creature-panel-injected', 'blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }, 400);

    window.markScriptRan = function () {
      clearTimeout(timeout);
      setCreature('creature-injected', 'creature-speech-injected', 'creature-panel-injected', 'ran', '( ^‿^)', 'Script allowed');
    };

    return;
  }

  const timeout = click ? null : setTimeout(function () {
    if (xss) {
      setMain('ran', '( ^‿^)', 'CSP blocked the XSS');
    } else {
      setMain('blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }
  }, 400);

  window.markScriptRan = function () {
    if (timeout) clearTimeout(timeout);
    if (xss) {
      setMain('xss', '( \xd7_\xd7)', 'XSS ran — no CSP');
    } else {
      setMain('ran', '( ^‿^)', 'Script allowed');
    }
  };

  window.markHandlerBlocked = function () {
    setMain('blocked', '( \xd7_\xd7)', 'Handler blocked by CSP');
  };
})();
