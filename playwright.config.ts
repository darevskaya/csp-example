import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true },
    },
    {
      name: 'headless',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'ui',
      use: { ...devices['Desktop Chrome'], headless: false, launchOptions: { slowMo: 800 } },
    },
  ],

  webServer: {
    command: 'cross-env NODE_ENV=production tsx bin/server.ts',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
  },
});
