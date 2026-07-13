import '../styles/main.css';
import { initCopyButton } from './controllers/copy';
import { initCreature } from './controllers/creature';
import { initViolationLog } from './controllers/violation-log';

// Modules are deferred — DOM is fully parsed when this runs
document.querySelectorAll<HTMLElement>('[data-controller="creature"]').forEach(initCreature);
document
  .querySelectorAll<HTMLElement>('[data-controller="violation-log"]')
  .forEach(initViolationLog);
document.querySelectorAll<HTMLElement>('[data-controller="copy"]').forEach(initCopyButton);
