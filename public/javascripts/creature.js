(function () {
  const mode = document.currentScript && document.currentScript.dataset.mode;
  const xss = mode === 'xss';
  const click = mode === 'click';

  function setCreature(state, face, speech) {
    const creature = document.getElementById('creature');
    const speechEl = document.getElementById('creature-speech');
    const panel = document.getElementById('creature-panel');
    creature.textContent = face;
    creature.className = 'creature ' + state;
    speechEl.textContent = speech;
    speechEl.className = 'creature-speech ' + state;
    panel.className = 'creature-panel card ' + state;
  }

  const timeout = click ? null : setTimeout(function () {
    if (xss) {
      setCreature('ran', '( ^‿^)', 'CSP blocked the XSS');
    } else {
      setCreature('blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }
  }, 400);

  window.markScriptRan = function () {
    if (timeout) clearTimeout(timeout);
    if (xss) {
      setCreature('xss', '( \xd7_\xd7)', 'XSS ran — no CSP');
    } else {
      setCreature('ran', '( ^‿^)', 'Script allowed');
    }
  };

  window.markHandlerBlocked = function () {
    setCreature('blocked', '( \xd7_\xd7)', 'Handler blocked by CSP');
  };
})();
