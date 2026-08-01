import { expect, test } from '@playwright/test';

// ── Page 1: Blocked resource types ───────────────────────────────────────────

test.describe('reporting: blocked resource types', () => {
  test('inline-script: panel populates with effectiveDirective script-src-elem', async ({
    page,
  }) => {
    await page.goto('/examples/reporting/blocked-resource/inline-script');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('script-src-elem');
    await expect(panel).toContainText('"inline"');
  });

  test('inline-script: report-only header is set', async ({ request }) => {
    const res = await request.get('/examples/reporting/blocked-resource/inline-script');
    expect(res.headers()['content-security-policy-report-only']).toContain("default-src 'self'");
  });

  test('inline-script: no enforced script-src blocks page scripts', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/examples/reporting/blocked-resource/inline-script');
    await page.waitForTimeout(500);
    const blockingErrors = errors.filter(
      (e) => e.includes('Content-Security-Policy') && !e.includes('Report-Only'),
    );
    expect(blockingErrors).toHaveLength(0);
  });

  test('external-script: blockedURL is a URL not a keyword', async ({ page }) => {
    await page.goto('/examples/reporting/blocked-resource/external-script');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('cdn.example.com');
  });

  test('image-style: two reports shown', async ({ page }) => {
    await page.goto('/examples/reporting/blocked-resource/image-style');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('img-src');
    await expect(panel).toContainText('style-src-elem');
  });

  test('highlighted fields have j-line-focus class', async ({ page }) => {
    await page.goto('/examples/reporting/blocked-resource/inline-script');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel.locator('.j-line-focus').first()).toBeVisible();
  });

  test('notice callout is visible', async ({ page }) => {
    await page.goto('/examples/reporting/blocked-resource/inline-script');
    await expect(page.locator('.notice')).toBeVisible();
  });
});

// ── Page 2: Directive inheritance ─────────────────────────────────────────────

test.describe('reporting: effective directive', () => {
  test('default-src: effectiveDirective is script-src-elem', async ({ page }) => {
    await page.goto('/examples/reporting/effective-directive/default-src');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('script-src-elem');
    await expect(panel).toContainText("default-src 'self'");
  });

  test('script-src: originalPolicy includes script-src', async ({ page }) => {
    await page.goto('/examples/reporting/effective-directive/script-src');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('script-src-elem');
    await expect(panel).toContainText("script-src 'self'");
  });

  test('script-src-attr: effectiveDirective is script-src-attr', async ({ page }) => {
    await page.goto('/examples/reporting/effective-directive/script-src-attr');
    await page.click('button.lab-btn');
    const panel = page.locator('csp-report-panel');
    await expect(panel.locator('.report-json').first()).toBeVisible({ timeout: 5000 });
    await expect(panel).toContainText('script-src-attr');
  });

  test('report-only header present on all modes', async ({ request }) => {
    for (const mode of ['default-src', 'script-src', 'script-src-attr']) {
      const res = await request.get(`/examples/reporting/effective-directive/${mode}`);
      expect(res.headers()['content-security-policy-report-only']).toBeTruthy();
    }
  });
});
