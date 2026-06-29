(function () {
  var mode = document.currentScript && document.currentScript.dataset.mode;
  var xss = mode === 'xss';

  function setCreature(state, face, speech) {
    var creature = document.getElementById('creature');
    var speechEl = document.getElementById('creature-speech');
    var panel = document.getElementById('creature-panel');
    creature.textContent = face;
    creature.className = 'creature ' + state;
    speechEl.textContent = speech;
    speechEl.className = 'creature-speech ' + state;
    panel.className = 'creature-panel card ' + state;
  }

  var timeout = setTimeout(function () {
    if (xss) {
      setCreature('ran', '( ^‿^)', 'CSP blocked the XSS');
    } else {
      setCreature('blocked', '( \xd7_\xd7)', 'CSP blocked the script');
    }
  }, 400);

  window.markScriptRan = function () {
    clearTimeout(timeout);
    if (xss) {
      setCreature('xss', '( \xd7_\xd7)', 'XSS ran — no CSP');
    } else {
      setCreature('ran', '( ^‿^)', 'Script allowed');
    }
  };
})();
