import express from 'express';
import allowlistRouter from './allowlist';
import eventHandlerRouter from './event-handler';
import hashRouter from './hash';
import nonceRouter from './nonce';
import reflectedXssRouter from './reflected-xss';
import strictDynamicRouter from './strict-dynamic';

const router = express.Router();

router.use('/reflected-xss', reflectedXssRouter);
router.use('/inline-script', nonceRouter);
router.use('/inline-script', hashRouter);
router.use('/third-party', strictDynamicRouter);
router.use('/third-party', allowlistRouter);
router.use('/event-handler', eventHandlerRouter);

export default router;
