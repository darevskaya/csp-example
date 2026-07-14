import '../styles/main.css';
import { initCopyButton } from './controllers/copy';
import { initCreature } from './controllers/creature';

document.querySelectorAll<HTMLElement>('[data-controller="creature"]').forEach(initCreature);
document.querySelectorAll<HTMLElement>('[data-controller="copy"]').forEach(initCopyButton);
