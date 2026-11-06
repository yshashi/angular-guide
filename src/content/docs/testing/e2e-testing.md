---
title: E2E Testing with Playwright 🎭
description: Test Angular applications in real browsers with Playwright, accessible locators, isolated test data, network mocking and CI.
sidebar:
  order: 5
---

End-to-end tests exercise a running application in a browser, like a user would. Use a small set for important journeys; use Vitest for most fast unit and component tests.

## Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Create `playwright.config.ts` at the workspace root:

```ts title="playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'ng serve --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
  },
});
```

Add `"e2e": "playwright test"` to `package.json` scripts.

## Test a user journey

```ts title="e2e/todo.spec.ts"
import { expect, test } from '@playwright/test';

test('adds a task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'New task' }).fill('Read the Angular guide');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Read the Angular guide' })).toBeVisible();
});
```

Prefer locators based on accessible roles, labels and names. Avoid CSS classes that represent implementation details.

## Isolate test data

Each test should create or reset its own data. Playwright can intercept requests when the test needs a deterministic response:

```ts
await page.route('**/api/products', async (route) => {
  await route.fulfill({ json: [{ id: 1, name: 'Keyboard', price: 80 }] });
});
```

Never mutate production data from a test. Use test-only accounts and test environments.

## Run and debug

```bash
npx playwright test
npx playwright test e2e/todo.spec.ts
npx playwright test --headed
npx playwright show-report
```

Use traces and screenshots to diagnose failures. Prefer waiting for a locator or expected response over arbitrary sleeps such as `page.waitForTimeout()`.

## Continuous integration

In CI, install dependencies with `npm ci`, install Playwright browser dependencies using its documented CI command, then run `npx playwright test`. Save reports and traces as artifacts when a test fails.

An E2E runner is not automatically included in a new Angular workspace. `ng e2e` requires an E2E builder configured in the project; `npx playwright test` is the direct Playwright command.

## Next steps

- [Unit Testing with Vitest](/testing/unit-testing/)
- [Component Testing](/testing/component-testing/)
- [Integration Testing](/testing/integration-testing/)
