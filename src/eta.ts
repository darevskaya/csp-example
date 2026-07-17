import path from 'node:path';
import { Eta } from 'eta';
import { isDev } from './env';

export const eta = new Eta({ views: path.join(process.cwd(), 'src'), cache: !isDev });
