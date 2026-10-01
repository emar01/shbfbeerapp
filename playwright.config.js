const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
  },
  webServer: {
    command: 'node management/serve-dist.js',
    url: 'http://127.0.0.1:4173',
    timeout: 15_000,
    reuseExistingServer: !process.env.CI,
  },
});
