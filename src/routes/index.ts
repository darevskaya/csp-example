import type { Response } from 'express';
import express from 'express';
import { render } from '../render';

const router = express.Router();

router.get('/', (_req: unknown, res: Response) => {
  render(res, 'index', { title: 'Home' });
});

export default router;
