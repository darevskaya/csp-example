function markScriptRan() {
  const creature = document.getElementById('creature');
  const speech = document.getElementById('creature-speech');
  const panel = document.getElementById('creature-panel');
  clearTimeout(window._creatureTimeout);
  creature.textContent = '( \xd7_\xd7)';
  creature.className = 'creature xss';
  speech.textContent = 'XSS executed!';
  speech.className = 'creature-speech xss';
  panel.className = 'creature-panel card xss';
}

window._creatureTimeout = setTimeout(() => {
  const creature = document.getElementById('creature');
  const speech = document.getElementById('creature-speech');
  const panel = document.getElementById('creature-panel');
  creature.textContent = '( ^‿^)';
  creature.className = 'creature ran';
  speech.textContent = 'Attack blocked!';
  speech.className = 'creature-speech ran';
  panel.className = 'creature-panel card ran';
}, 400);
