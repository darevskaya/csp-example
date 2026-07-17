import { expect, test } from '@playwright/test';

// ── Home ─────────────────────────────────────────────────────────────────────

test.describe('home page', () => {
  test('lists all six examples', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CSP Examples/);
    await expect(page.getByText('default-src').first()).toBeVisible();
    await expect(page.getByText('script-src origin').first()).toBeVisible();
    await expect(page.getByText('script-src nonce').first()).toBeVisible();
    await expect(page.getByText('script-src hash').first()).toBeVisible();
    await expect(page.locator('.card-directive').filter({ hasText: 'strict-dynamic' }).first()).toBeVisible();
    await expect(page.locator('.card-directive').filter({ hasText: 'script-src-elem' }).first()).toBeVisible();
  });
});

// ── Reflected XSS ─────────────────────────────────────────────────────────────

test.describe('reflected XSS', () => {
  test('unsafe: no query — creature not shown', async ({ page }) => {
    await page.goto('/examples/reflected-xss/unsafe');
    await expect(page.locator('#creature')).not.toBeAttached();
  });

  test('safe: no query — creature not shown', async ({ page }) => {
    await page.goto('/examples/reflected-xss/safe');
    await expect(page.locator('#creature')).not.toBeAttached();
  });

  test('unsafe: plain input is reflected', async ({ page }) => {
    await page.goto('/examples/reflected-xss/unsafe?term=hello');
    await expect(page.locator('.demo-row-value').filter({ hasText: 'hello' }).first()).toBeVisible();
  });

  test('unsafe: injected script executes (alert fires)', async ({ page }) => {
    let alerted = false;
    page.on('dialog', async (dialog) => {
      alerted = true;
      await dialog.dismiss();
    });
    await page.goto('/examples/reflected-xss/unsafe?term=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    await page.waitForTimeout(500);
    expect(alerted).toBe(true);
  });

  test('unsafe: no CSP header on unsafe page', async ({ request }) => {
    const res = await request.get('/examples/reflected-xss/unsafe');
    expect(res.headers()['content-security-policy']).toBe("frame-ancestors 'none'");
  });

  test('safe: CSP header present on safe page', async ({ request }) => {
    const res = await request.get('/examples/reflected-xss/safe');
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  test('safe: injected script is blocked by CSP', async ({ page }) => {
    let alerted = false;
    page.on('dialog', async (dialog) => {
      alerted = true;
      await dialog.dismiss();
    });
    await page.goto('/examples/reflected-xss/safe?term=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    // creature state confirms the script was blocked
    await expect(page.locator('#creature')).toHaveClass(/ran/, {
      timeout: 2000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the XSS');
  });

  test('unsafe: XSS executes — creature shows XSS ran', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await page.goto(
      '/examples/reflected-xss/unsafe?term=%3Cscript%3EmarkScriptRan()%3C%2Fscript%3E',
    );
    await expect(page.locator('#creature')).toHaveClass(/xss/, {
      timeout: 5000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('XSS ran — no CSP');
  });

  test('safe: XSS blocked — creature shows attack blocked', async ({ page }) => {
    await page.goto('/examples/reflected-xss/safe?term=%3Cscript%3EmarkScriptRan()%3C%2Fscript%3E');
    await expect(page.locator('#creature')).toHaveClass(/ran/, {
      timeout: 5000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('CSP blocked the XSS');
  });

  test('mode toggle preserves term query string', async ({ page }) => {
    await page.goto('/examples/reflected-xss/safe?term=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    const unsafeLink = page.locator('a.mode-tab', { hasText: 'CSP off' });
    const href = await unsafeLink.getAttribute('href');
    expect(href).toContain('term=');
    expect(href).toContain('%3Cscript%3E');
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
    await expect(page.locator('#creature')).toHaveClass(/blocked/, {
      timeout: 2000,
    });
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
    const stripNonce = (h: string) => h.replace(/ 'nonce-[^']*'/g, '');
    expect(stripNonce(h1)).toBe(stripNonce(h2));
  });

  test('no-hash: mismatched script is blocked — creature shows CSP blocked', async ({ page }) => {
    await page.goto('/examples/inline-script/no-hash');
    await expect(page.locator('#creature')).toHaveClass(/blocked/, {
      timeout: 2000,
    });
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
    await expect(page.locator('#creature')).toHaveClass(/blocked/, {
      timeout: 2000,
    });
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

  test('loader runs on both modes — loader creature shows script ran', async ({ page }) => {
    for (const path of [
      '/examples/third-party/no-strict-dynamic',
      '/examples/third-party/strict-dynamic',
    ]) {
      await page.goto(path);
      await expect(page.locator('#creature-loader')).toHaveClass(/ran/, { timeout: 2000 });
      await expect(page.locator('#creature-speech-loader')).toHaveText('Script ran');
    }
  });

  test('no-strict-dynamic: SDK injection blocked — creature shows CSP blocked', async ({
    page,
  }) => {
    await page.goto('/examples/third-party/no-strict-dynamic');
    await expect(page.locator('#creature-injected')).toHaveClass(/blocked/, { timeout: 2000 });
    await expect(page.locator('#creature-speech-injected')).toHaveText('CSP blocked the script');
  });

  test('strict-dynamic: header contains nonce and strict-dynamic', async ({ request }) => {
    const res = await request.get('/examples/third-party/strict-dynamic');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toMatch(/nonce-/);
    expect(csp).toContain("'strict-dynamic'");
  });

  test('strict-dynamic: injected SDK runs — creature shows script allowed', async ({ page }) => {
    await page.goto('/examples/third-party/strict-dynamic');
    await expect(page.locator('#creature-injected')).toHaveClass(/ran/);
    await expect(page.locator('#creature-speech-injected')).toHaveText('Script allowed');
  });
});

// ── Event handler ─────────────────────────────────────────────────────────────

test.describe('event-handler example', () => {
  test('script-src-only: CSP header uses script-src with nonce', async ({ request }) => {
    const res = await request.get('/examples/event-handler/script-src-only');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toContain('script-src ');
    expect(csp).toMatch(/nonce-/);
  });

  test('script-src-only: inline handler blocked — creature shows handler blocked', async ({
    page,
  }) => {
    await page.goto('/examples/event-handler/script-src-only');
    await page.locator('button').click();
    await expect(page.locator('#creature')).toHaveClass(/blocked/, {
      timeout: 2000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('Handler blocked by CSP');
  });

  test('split-unsafe-inline: CSP header uses script-src-elem and script-src-attr', async ({
    request,
  }) => {
    const res = await request.get('/examples/event-handler/split-unsafe-inline');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toContain('script-src-elem');
    expect(csp).toContain("script-src-attr 'unsafe-inline'");
  });

  test('split-unsafe-inline: inline handler allowed — creature shows script allowed', async ({
    page,
  }) => {
    await page.goto('/examples/event-handler/split-unsafe-inline');
    await page.locator('button').click();
    await expect(page.locator('#creature')).toHaveClass(/ran/, {
      timeout: 2000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('Script allowed');
  });

  test('split-none: CSP header uses script-src-attr none', async ({ request }) => {
    const res = await request.get('/examples/event-handler/split-none');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toContain('script-src-elem');
    expect(csp).toContain("script-src-attr 'none'");
  });

  test('split-none: inline handler blocked — creature shows handler blocked', async ({ page }) => {
    await page.goto('/examples/event-handler/split-none');
    await page.locator('button').click();
    await expect(page.locator('#creature')).toHaveClass(/blocked/, {
      timeout: 2000,
    });
    await expect(page.locator('#creature-speech')).toHaveText('Handler blocked by CSP');
  });
});

// ── Home page redesign ────────────────────────────────────────────────────────

test.describe('home page redesign', () => {
  test('skip link present with correct href', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main');
  });

  test('6 example cards visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.example-card')).toHaveCount(6);
  });
});

// ── Mode toggle ARIA ──────────────────────────────────────────────────────────

test.describe('mode toggle ARIA', () => {
  test('nonce example — active mode tab has aria-selected=true', async ({ page }) => {
    await page.goto('/examples/inline-script/nonce');
    const activeTab = page.locator('.mode-tab[aria-selected="true"]');
    await expect(activeTab).toHaveCount(1);
    await expect(activeTab).toContainText('nonce');
  });

  test('no-nonce example — unsafe mode tab has aria-selected=true', async ({ page }) => {
    await page.goto('/examples/inline-script/no-nonce');
    const activeTab = page.locator('.mode-tab[aria-selected="true"]');
    await expect(activeTab).toHaveCount(1);
    await expect(activeTab).toContainText('without nonce');
  });
});

// ── Security invariants ───────────────────────────────────────────────────────

test.describe('security invariants', () => {
  const ALL_ROUTES = [
    '/examples/reflected-xss/safe',
    '/examples/reflected-xss/unsafe',
    '/examples/inline-script/nonce',
    '/examples/inline-script/no-nonce',
    '/examples/inline-script/hash',
    '/examples/inline-script/no-hash',
    '/examples/third-party/allowlist',
    '/examples/third-party/no-allowlist',
    '/examples/third-party/strict-dynamic',
    '/examples/third-party/no-strict-dynamic',
    '/examples/event-handler/script-src-only',
    '/examples/event-handler/split-unsafe-inline',
    '/examples/event-handler/split-none',
  ];

  test("all routes include frame-ancestors 'none'", async ({ request }) => {
    for (const path of ALL_ROUTES) {
      const res = await request.get(path);
      expect(res.headers()['content-security-policy'], path).toContain("frame-ancestors 'none'");
    }
  });
});
