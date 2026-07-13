import { Eta } from 'eta';
import path from 'path';
import { isDev } from './env';

export const eta = new Eta({ views: path.join(process.cwd(), 'src', 'views'), cache: !isDev });
