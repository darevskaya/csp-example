import '../styles/main.css';
import { initCreature } from './controllers/creature';

document.querySelectorAll<HTMLElement>('[data-controller="creature"]').forEach(initCreature);
