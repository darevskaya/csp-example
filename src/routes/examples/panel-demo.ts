import express, { Response } from 'express';
import { render } from '../../render';

const router = express.Router();

router.get('/', (_req: unknown, res: Response) => {
  render(res, 'examples/panel-demo', { title: 'Panel Demo' });
});

export default router;
