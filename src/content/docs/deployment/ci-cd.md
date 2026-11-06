---
title: CI/CD Pipelines ⚙️
description: Automate Angular 22 builds — GitHub Actions with Node 24, npm ci, Vitest unit tests, Playwright e2e, production build and deploy, plus GitLab, Azure and Jenkins.
sidebar:
  order: 3
---

Continuous Integration (CI) runs your checks on every push and pull request; Continuous Deployment (CD) ships the result automatically. For an Angular app the pipeline is always the same handful of commands — this page shows them in **GitHub Actions** step by step, then gives short versions for other CI providers.

**What you'll learn**

- The five commands every Angular pipeline runs
- How `ng test` (Vitest) behaves in CI — no watch mode, headless browsers
- Running Playwright end-to-end tests in CI
- A complete GitHub Actions workflow: test → build → deploy (static and Docker)
- Caching, secrets, preview deployments and common pitfalls

## The pipeline in five commands

```bash
npm ci                    # 1. install exactly what package-lock.json says
npx ng lint               # 2. lint (if you added angular-eslint)
npx ng test               # 3. unit tests with Vitest (single run on CI)
npx ng build              # 4. production build → dist/<app>/
npx playwright test       # 5. end-to-end tests (optional but recommended)
```

Everything else — caching, artifacts, deployment — is plumbing around these.

| Command | Notes for CI |
|---|---|
| `npm ci` | Faster and stricter than `npm install`; fails if `package-lock.json` is out of sync. |
| `ng lint` | Needs a linter builder. Add one with `ng add angular-eslint` — see [ESLint](/tools/eslint/). |
| `ng test` | Vitest is the default runner since v21. When the `CI` environment variable is set (GitHub Actions, GitLab and most CI services set it), `ng test` runs **once** without watch mode. Elsewhere, add `--no-watch --no-progress`. |
| `ng build` | Uses the `production` configuration by default. Fails the job if a size budget's `maximumError` is exceeded. |
| `playwright test` | Starts your app, drives a real browser, and fails on broken user flows. |

:::note[Use Node 22, 24 or 26]
Angular 22 needs Node.js `^22.22.3 || ^24.15.0 || >=26`. Pipelines still pinned to Node 20 fail with an engine error. The examples use **Node 24**.
:::

## Unit tests in CI (Vitest)

New projects run unit tests with Vitest in a simulated DOM (jsdom), which needs no browser — perfect for CI. Useful flags:

```bash
npx ng test                          # single run when CI=true
npx ng test --no-watch --no-progress # force single run anywhere
npx ng test --coverage               # coverage report in coverage/<project>/
```

Coverage needs the provider package: `npm install --save-dev @vitest/coverage-v8`. To upload coverage to a service, choose report formats and thresholds in `angular.json`:

```json title="angular.json (excerpt)"
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "coverageReporters": ["lcov", "text-summary"],
    "coverageThresholds": { "statements": 80, "branches": 70, "functions": 80, "lines": 80 }
  }
}
```

If you configured **browser mode** (for example with `@vitest/browser-playwright` and `"browsers": ["chromium"]`), tests run **headless automatically when `CI` is set**. You can also force it with `--headless` or a browser name ending in `Headless` (`--browsers=chromiumHeadless`). Install the browser binary in the job with `npx playwright install --with-deps chromium`.

See [Unit Testing](/testing/unit-testing/) and [Code Coverage](/testing/coverage/) for writing the tests themselves.

## End-to-end tests with Playwright

Add Playwright with its Angular schematic (it creates an `e2e` target so `ng e2e` works) or install it directly:

```bash
ng add playwright-ng-schematics   # or: npm init playwright@latest
```

Let Playwright start the app itself with `webServer`:

```ts title="playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],          // fail if someone committed test.only
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',                // keep a trace for flaky tests
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
```

```ts title="e2e/home.spec.ts"
import { test, expect } from '@playwright/test';

test('home page shows the app title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('deep link renders the right page', async ({ page }) => {
  await page.goto('/products/42');
  await expect(page).toHaveURL(/\/products\/42$/);
});
```

More patterns in [E2E Testing](/testing/e2e-testing/).

## GitHub Actions: complete workflow

This workflow runs on every push and pull request. Pull requests get lint, unit tests, e2e tests and a build; pushes to `main` also deploy.

```yaml title=".github/workflows/ci.yml"
name: CI

on:
  push:
    branches: [main]
  pull_request:

# Cancel older runs of the same branch/PR
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx ng lint
      - run: npx ng test --coverage
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  build:
    needs: [test, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx ng build
      - uses: actions/upload-artifact@v7
        with:
          name: dist
          path: dist/my-app/
          retention-days: 7

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://my-app.example.com
    steps:
      - uses: actions/checkout@v7      # for firebase.json
      - uses: actions/download-artifact@v8
        with:
          name: dist
          path: dist/my-app/
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: my-firebase-project
          channelId: live
```

How it fits together:

- **`test`** and **`e2e`** run in parallel; `build` waits for both (`needs`).
- **`cache: npm`** in `setup-node` caches the npm download cache keyed on `package-lock.json` — you don't need a separate cache step for dependencies.
- **Artifacts** pass `dist/` from `build` to `deploy`, so you deploy exactly what you tested.
- **`environment: production`** lets you require manual approval and scope secrets in *Settings → Environments*.

:::tip[Swap the deploy step for your host]
The `deploy` job is the only host-specific part. Replace the Firebase step with, for example, `npx netlify-cli deploy --prod --dir=dist/my-app/browser` (with `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets as env vars), `npx wrangler deploy` for Cloudflare, or the GitHub Pages actions from [Deployment Strategies](/deployment/strategies/#github-pages).
:::

### Preview deployments for pull requests

Firebase can publish every PR to a temporary URL and comment it on the PR. Add a job that runs on `pull_request` with a non-`live` channel:

```yaml
  preview:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write   # to post the preview URL
    steps:
      - uses: actions/checkout@v7
      - uses: actions/download-artifact@v8
        with:
          name: dist
          path: dist/my-app/
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: my-firebase-project
          expires: 7d
```

Netlify, Vercel and Cloudflare offer the same feature through their Git integrations.

### Build and push a Docker image

For container deployments (see [Docker & Containers](/deployment/docker/)), build the image in CI and push it to GitHub Container Registry:

```yaml title=".github/workflows/docker.yml"
name: Docker

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v7
      - uses: docker/setup-buildx-action@v4
      - uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v6
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha
      - uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

The Dockerfile's build stage runs `npm ci` and `ng build` itself, so this job doesn't need Node.js installed.

### Speed up builds with the Angular cache

The Angular CLI keeps a build cache in `.angular/cache`, but by default it's **only enabled outside CI**. Turn it on for CI and persist it between runs:

```json title="angular.json (excerpt)"
{
  "cli": {
    "cache": { "environment": "all" }
  }
}
```

```yaml
      - uses: actions/cache@v6
        with:
          path: .angular/cache
          key: ng-cache-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
          restore-keys: ng-cache-${{ runner.os }}-
```

### Testing on several Node versions (libraries)

Apps usually test on one Node version. Libraries can use a matrix of the versions Angular supports:

```yaml
    strategy:
      matrix:
        node: [22, 24, 26]
    steps:
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node }}
```

## Other CI providers (short versions)

The commands don't change — only the YAML around them.

### GitLab CI

```yaml title=".gitlab-ci.yml"
image: node:24

stages: [test, build, deploy]

cache:
  key:
    files: [package-lock.json]
  paths: [.npm/]

default:
  before_script:
    - npm ci --cache .npm --prefer-offline

unit:
  stage: test
  script:
    - npx ng test --coverage

e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.65.0-noble   # match your @playwright/test version
  script:
    - npx playwright test

build:
  stage: build
  script:
    - npx ng build
  artifacts:
    paths: [dist/]
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - npx netlify-cli deploy --prod --dir=dist/my-app/browser
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Azure Pipelines

```yaml title="azure-pipelines.yml"
trigger: [main]

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '24.x'
  - script: npm ci
  - script: npx ng test --coverage
  - script: npx ng build
  - task: PublishPipelineArtifact@1
    inputs:
      targetPath: dist/my-app
      artifact: dist
```

### Jenkins

```groovy title="Jenkinsfile"
pipeline {
  agent { docker { image 'node:24' } }
  environment { CI = 'true' }
  stages {
    stage('Install') { steps { sh 'npm ci' } }
    stage('Test')    { steps { sh 'npx ng test --coverage' } }
    stage('Build')   { steps { sh 'npx ng build' } }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'npx netlify-cli deploy --prod --dir=dist/my-app/browser' }
    }
  }
}
```

Jenkins doesn't always set `CI`, which is why the example sets it — otherwise `ng test` would start in watch mode and never finish.

## Best practices

- **Fail fast on pull requests** — run lint, unit tests and the build on every PR and make them required checks (branch protection).
- **Build once** — deploy the artifact (or image) produced by the pipeline; don't rebuild on the server.
- **Keep secrets in the CI secret store** — `${{ secrets.NAME }}`, GitLab CI/CD variables, etc. Never commit tokens, and remember anything in Angular environment files ends up public.
- **Least-privilege permissions** — set `permissions:` per workflow/job in GitHub Actions.
- **Pin tool versions** — commit `package-lock.json`, pin Node major versions and action versions.
- **Keep artifacts short-lived** — `retention-days` saves storage.
- **Upload reports on failure** — Playwright traces and HTML reports make flaky failures debuggable.

## Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `ng test` never finishes | Watch mode because `CI` isn't set | Set `CI=true` or pass `--no-watch` |
| `EBADENGINE` / engine error | Node 20 in the pipeline | Use Node 24 (or 22.22.3+/26) |
| `npm ci` fails: lock file out of sync | `package.json` changed without updating the lock | Run `npm install` locally and commit `package-lock.json` |
| Playwright: "Executable doesn't exist" | Browsers not installed | `npx playwright install --with-deps` |
| Coverage flag fails | Missing `@vitest/coverage-v8` | Install it as a dev dependency |
| Deployed site 404s on refresh | Host lacks SPA fallback | See [Deployment Strategies](/deployment/strategies/) |
| Using Karma's `--browsers=ChromeHeadless` after migrating | Vitest uses Playwright/WebdriverIO browser names | `--browsers=chromiumHeadless` (Playwright provider) |

## Key takeaways

- Every Angular pipeline is `npm ci` → `ng lint` → `ng test` → `ng build` → (e2e) → deploy.
- `ng test` uses Vitest and runs once, headless, when `CI` is set.
- Use Node 24 (or 22.22.3+/26) — Angular 22 dropped Node 20.
- Pass `dist/` between jobs as an artifact so you deploy exactly what you tested.
- Only the deploy step is host-specific.

## Next steps

1. **[Deployment Strategies](/deployment/strategies/)** — host-specific configuration
2. **[Docker & Containers](/deployment/docker/)** — containerized deployments
3. **[E2E Testing](/testing/e2e-testing/)** — write reliable Playwright tests
