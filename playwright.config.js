// @ts-check
import { defineConfig, devices } from '@playwright/test';

const projectPath = process.cwd().replace(/\\/g, '/');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  fullyParallel: false,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://127.0.0.1:9324',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  webServer: [
    {
      command: 'node e2e/mock-midtrans.js',
      url: 'http://127.0.0.1:9325/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'php artisan serve --host=127.0.0.1 --port=9324',
      url: 'http://127.0.0.1:9324/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        APP_ENV: 'testing',
        APP_URL: 'http://127.0.0.1:9324',
        APP_CONFIG_CACHE: `${projectPath}/storage/framework/testing/e2e-config.php`,
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: `${projectPath}/storage/framework/testing/e2e.sqlite`,
        DB_URL: '',
        SESSION_DRIVER: 'array',
        CACHE_STORE: 'array',
        QUEUE_CONNECTION: 'sync',
        MIDTRANS_SERVER_KEY: 'playwright-test-server-key',
        MIDTRANS_BASE_URL: 'http://127.0.0.1:9325',
      },
    },
  ],
});


