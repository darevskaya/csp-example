import { test, expect } from '@playwright/test';

// ── Home ─────────────────────────────────────────────────────────────────────

test.describe('home page', () => {
  test('lists all five examples', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CSP Examples/);
    await expect(page.getByText('default-src').first()).toBeVisible();
    await expect(page.getByText('script-src origin')).toBeVisible();
    await expect(page.getByText('script-src nonce')).toBeVisible();
    await expect(page.getByText('script-src hash')).toBeVisible();
    await expect(page.getByText('script-src strict-dynamic')).toBeVisible();
  });
});

// ── Reflected XSS ─────────────────────────────────────────────────────────────

test.describe('reflected XSS', () => {
  test('unsafe: plain input is reflected', async ({ page }) => {
    await page.goto('/examples/reflected-xss/unsafe?term=hello');
    await expect(page.locator('.output-code')).toHaveText('hello');
  });

  test('unsafe: injected script executes (alert fires)', async ({ page }) => {
    let alerted = false;
    page.on('dialog', async dialog => {
      alerted = true;
      await dialog.dismiss();
    });
    await page.goto('/examples/reflected-xss/unsafe?term=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    await page.waitForTimeout(500);
    expect(alerted).toBe(true);
  });

  test('unsafe: no script-src restriction on unsafe page', async ({ request }) => {
    const res = await request.get('/examples/reflected-xss/unsafe');
    const csp = res.headers()['content-security-policy'];
    expect(csp).not.toContain('script-src');
    expect(csp).not.toContain('default-src');
  });

  test('safe: CSP header present on safe page', async ({ request }) => {
    const res = await request.get('/examples/reflected-xss/safe');
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  test('safe: injected script is blocked by CSP', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy'))
        violations.push(msg.text());
    });
    let alerted = false;
    page.on('dialog', async dialog => { alerted = true; await dialog.dismiss(); });
    await page.goto('/examples/reflected-xss/safe?term=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    expect(violations.length).toBeGreaterThan(0);
  });

  test('unsafe: XSS executes — creature shows XSS ran', async ({ page }) => {
    page.on('dialog', async dialog => { await dialog.dismiss(); });
    await page.goto('/examples/reflected-xss/unsafe?term=%3Cscript%3EmarkScriptRan()%3C%2Fscript%3E');
    await expect(page.locator('#creature')).toHaveClass(/xss/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('XSS ran — no CSP');
  });

  test('safe: XSS blocked — creature shows attack blocked', async ({ page }) => {
    await page.goto('/examples/reflected-xss/safe?term=%3Cscript%3EmarkScriptRan()%3C%2Fscript%3E');
    await expect(page.locator('#creature')).toHaveClass(/ran/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the XSS');
  });
});

// ── Nonce ─────────────────────────────────────────────────────────────────────

test.describe('nonce example', () => {
  test('both pages set a CSP header with a nonce', async ({ request }) => {
    for (const path of ['/examples/inline-script/nonce', '/examples/inline-script/no-nonce']) {
      const res = await request.get(path);
      expect(res.headers()['content-security-policy']).toMatch(/nonce-/);
    }
  });

  test('no-nonce: script is blocked — creature shows CSP blocked', async ({ page }) => {
    await page.goto('/examples/inline-script/no-nonce');
    await expect(page.locator('#creature')).toHaveClass(/blocked/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the script');
  });

  test('nonce: script runs — creature shows script allowed', async ({ page }) => {
    await page.goto('/examples/inline-script/nonce');
    await expect(page.locator('#creature')).toHaveClass(/ran/);
    await expect(page.locator('#creature-speech')).toHaveText('Script allowed');
  });

  test('nonce is different on each request', async ({ request }) => {
    const extract = (header: string) => header.match(/nonce-([^']+)/)?.[1];
    const r1 = await request.get('/examples/inline-script/nonce');
    const r2 = await request.get('/examples/inline-script/nonce');
    const n1 = extract(r1.headers()['content-security-policy'] ?? '');
    const n2 = extract(r2.headers()['content-security-policy'] ?? '');
    expect(n1).toBeDefined();
    expect(n2).toBeDefined();
    expect(n1).not.toBe(n2);
  });
});

// ── Hash ──────────────────────────────────────────────────────────────────────

test.describe('hash example', () => {
  test('both pages set the same CSP header with a sha256 hash', async ({ request }) => {
    const r1 = await request.get('/examples/inline-script/hash');
    const r2 = await request.get('/examples/inline-script/no-hash');
    const h1 = r1.headers()['content-security-policy'];
    const h2 = r2.headers()['content-security-policy'];
    expect(h1).toContain('sha256-');
    expect(h1).toBe(h2);
  });

  test('no-hash: mismatched script is blocked — creature shows CSP blocked', async ({ page }) => {
    await page.goto('/examples/inline-script/no-hash');
    await expect(page.locator('#creature')).toHaveClass(/blocked/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the script');
  });

  test('hash: matching script runs — creature shows script allowed', async ({ page }) => {
    await page.goto('/examples/inline-script/hash');
    await expect(page.locator('#creature')).toHaveClass(/ran/);
    await expect(page.locator('#creature-speech')).toHaveText('Script allowed');
  });
});

// ── Origin allowlist ──────────────────────────────────────────────────────────

test.describe('origin allowlist example', () => {
  test('both pages set script-src self CSP header', async ({ request }) => {
    for (const path of ['/examples/third-party/allowlist', '/examples/third-party/no-allowlist']) {
      const res = await request.get(path);
      expect(res.headers()['content-security-policy']).toContain("script-src 'self'");
    }
  });

  test('no-allowlist: SDK not loaded — creature shows CSP blocked', async ({ page }) => {
    await page.goto('/examples/third-party/no-allowlist');
    await expect(page.locator('#creature')).toHaveClass(/blocked/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the script');
  });

  test('allowlist: SDK loads directly — creature shows script allowed', async ({ page }) => {
    await page.goto('/examples/third-party/allowlist');
    await expect(page.locator('#creature')).toHaveClass(/ran/);
    await expect(page.locator('#creature-speech')).toHaveText('Script allowed');
  });
});

// ── strict-dynamic ────────────────────────────────────────────────────────────

test.describe('strict-dynamic example', () => {
  test('no-strict-dynamic: nonce-only CSP header set', async ({ request }) => {
    const res = await request.get('/examples/third-party/no-strict-dynamic');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toMatch(/nonce-/);
    expect(csp).not.toContain('strict-dynamic');
  });

  test('no-strict-dynamic: SDK injection blocked — creature shows CSP blocked', async ({ page }) => {
    await page.goto('/examples/third-party/no-strict-dynamic');
    await expect(page.locator('#creature')).toHaveClass(/blocked/, { timeout: 2000 });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the script');
  });

  test('strict-dynamic: header contains nonce and strict-dynamic', async ({ request }) => {
    const res = await request.get('/examples/third-party/strict-dynamic');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toMatch(/nonce-/);
    expect(csp).toContain("'strict-dynamic'");
  });

  test('strict-dynamic: injected SDK runs — creature shows script allowed', async ({ page }) => {
    await page.goto('/examples/third-party/strict-dynamic');
    await expect(page.locator('#creature')).toHaveClass(/ran/);
    await expect(page.locator('#creature-speech')).toHaveText('Script allowed');
  });
});
