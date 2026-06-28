import express, { Request, Response } from 'express';
import { render } from '../render';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  render(res, 'index', { title: 'Home' });
});

export default router;
