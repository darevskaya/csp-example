import express from 'express';
import allowlistRouter from '../../examples/allowlist/route';
import eventHandlerRouter from '../../examples/event-handler/route';
import hashRouter from '../../examples/inline-script-hash/route';
import nonceRouter from '../../examples/inline-script-nonce/route';
import reflectedXssRouter from '../../examples/reflected-xss/route';
import strictDynamicRouter from '../../examples/strict-dynamic/route';

const router = express.Router();

router.use('/reflected-xss', reflectedXssRouter);
router.use('/inline-script', nonceRouter);
router.use('/inline-script', hashRouter);
router.use('/third-party', strictDynamicRouter);
router.use('/third-party', allowlistRouter);
router.use('/event-handler', eventHandlerRouter);

export default router;
