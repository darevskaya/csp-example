import type { Request, Response } from 'express';
import express from 'express';
import { examples } from '../examples/registry';
import { render } from '../render';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  render(res, 'views/index', {
    title: 'Home',
    cspExamples: examples.filter((e) => e.topic === 'csp'),
    reportingExamples: examples.filter((e) => e.topic === 'reporting'),
  });
});

export default router;
