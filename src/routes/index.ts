import express, { Request, Response } from 'express';
import { layout } from '../layout';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const body = `
    <div class="page-title">Security Examples</div>
    <div class="page-subtitle">Interactive demos of common web vulnerabilities and how CSP can protect against them.</div>

    <ul class="example-list">
      <li>
        <div class="example-card">
          <div>
            <a href="/examples/reflected-xss/unsafe">Reflected XSS</a>
            <div class="desc">Unsanitized user input reflected into the DOM</div>
          </div>
          <span class="arrow">→</span>
        </div>
      </li>
    </ul>
  `;
  res.send(layout('Home', body));
});

export default router;
