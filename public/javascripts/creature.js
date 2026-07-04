(function () {
  const mode = document.currentScript && document.currentScript.dataset.mode;
  const xss = mode === 'xss';
  const click = mode === 'click';
  const strictDynamic = mode === 'strict-dynamic';

  function setCreature(prefix, state, face, speech) {
    const sep = prefix ? '-' : '';
    const creature = document.getElementById('creature' + sep + prefix);
    const speechEl = document.getElementById('creature-speech' + sep + prefix);
    const panel = document.getElementById('creature-panel' + sep + prefix);
    creature.textContent = face;
    creature.className = 'creature ' + state;
    speechEl.textContent = speech;
    speechEl.className = 'creature-speech ' + state;
    panel.className = 'creature-panel card ' + state;
  }

  if (strictDynamic) {
    setCreature('loader', 'ran', '( ^‿^)', 'Script ran');

    const timeout = setTimeout(function () {
      setCreature('injected', 'blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }, 400);

    window.markScriptRan = function () {
      clearTimeout(timeout);
      setCreature('injected', 'ran', '( ^‿^)', 'Script allowed');
    };

    return;
  }

  const timeout = click ? null : setTimeout(function () {
    if (xss) {
      setCreature('', 'ran', '( ^‿^)', 'CSP blocked the XSS');
    } else {
      setCreature('', 'blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }
  }, 400);

  window.markScriptRan = function () {
    if (timeout) clearTimeout(timeout);
    if (xss) {
      setCreature('', 'xss', '( \xd7_\xd7)', 'XSS ran — no CSP');
    } else {
      setCreature('', 'ran', '( ^‿^)', 'Script allowed');
    }
  };

  window.markHandlerBlocked = function () {
    setCreature('', 'blocked', '( \xd7_\xd7)', 'Handler blocked by CSP');
  };
})();
