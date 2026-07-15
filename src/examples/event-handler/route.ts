import type { Request, Response } from 'express';
import express from 'express';
import { generateNonce } from '../../csp';
import { render } from '../../render';
import { buildEventHandlerPolicy, type EventHandlerMode, MODE_CONFIG } from './policy';

const router = express.Router();

function handler(mode: EventHandlerMode) {
  const { explanation, handlerAllowed } = MODE_CONFIG[mode];

  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const { cspHeader, cspDisplay } = buildEventHandlerPolicy(mode, nonce);
    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/event-handler/view', {
      title: 'script-src-elem / script-src-attr',
      mode,
      nonce,
      cspDisplay,
      explanation,
      handlerAllowed,
    });
  };
}

router.get('/script-src-only', handler('script-src-only'));
router.get('/split-unsafe-inline', handler('split-unsafe-inline'));
router.get('/split-none', handler('split-none'));

export default router;
