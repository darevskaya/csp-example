import path from 'path';
import { Eta } from 'eta';
import { isDev } from './env';

export const eta = new Eta({ views: path.join(__dirname, '..', 'views'), cache: !isDev });
