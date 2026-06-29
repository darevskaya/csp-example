import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
  },

  projects: [
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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
  },
});
