import type { Request, Response } from 'express';
import express from 'express';
import { examples } from '../examples/registry';
import { render } from '../render';

const router = express.Router();

const topics = [{ id: 'csp', label: 'Content Security Policy', badge: 'CSP' }];

router.get('/', (_req: Request, res: Response) => {
  render(res, 'views/index', { title: 'Home', topics, examples });
});

export default router;
