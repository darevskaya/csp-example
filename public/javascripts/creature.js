function markScriptRan() {
  const creature = document.getElementById('creature');
  const speech = document.getElementById('creature-speech');
  const panel = document.getElementById('creature-panel');
  clearTimeout(window._creatureTimeout);
  creature.textContent = '( ^‿^)';
  creature.className = 'creature ran';
  speech.textContent = 'Script ran!';
  speech.className = 'creature-speech ran';
  panel.className = 'creature-panel card ran';
}

window._creatureTimeout = setTimeout(() => {
  const creature = document.getElementById('creature');
  const speech = document.getElementById('creature-speech');
  const panel = document.getElementById('creature-panel');
  creature.textContent = '( \xd7_\xd7)';
  creature.className = 'creature blocked';
  speech.textContent = 'Script blocked.';
  speech.className = 'creature-speech blocked';
  panel.className = 'creature-panel card blocked';
}, 400);
