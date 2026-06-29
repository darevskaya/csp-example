import express from 'express';
import reflectedXssRouter from './reflected-xss';
import nonceRouter from './nonce';
import hashRouter from './hash';
import strictDynamicRouter from './strict-dynamic';

const router = express.Router();

router.use('/reflected-xss', reflectedXssRouter);
router.use('/inline-script', nonceRouter);
router.use('/inline-script', hashRouter);
router.use('/third-party', strictDynamicRouter);

export default router;
