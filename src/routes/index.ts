import express, { Request, Response } from 'express';
import { isDev } from '../env';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.render('index.njk', { title: 'Home', isDev });
});

export default router;
