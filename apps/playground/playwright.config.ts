import { defineConfig, devices } from '@playwright/test';

const PORT = 5433;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    // Only set when the preinstalled browser revision doesn't match this Playwright version.
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  // The playground resolves boardkit-core/boardkit-react from their built dist output, so
  // `pnpm build` must run before this server starts.
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
