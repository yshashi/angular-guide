---
title: Unit Testing with Vitest 🧪
description: Write and run Angular unit tests with Vitest and ng test — setup, Vitest basics, TestBed, browser mode, configuration, CI, and migrating from Karma/Jasmine.
sidebar:
  order: 1
---

Tests are a safety net: they catch bugs before your users do and let you refactor without fear. Every new Angular project
comes with a fast, modern unit-test setup built on **[Vitest](https://vitest.dev)** — you can write your first test
in minutes, without installing or configuring anything.

This page is your starting point for testing in Angular. It covers how `ng test` works, the Vitest API you'll use
every day, the basics of `TestBed`, how to configure and run tests (locally, in a real browser and in CI), and how to
migrate an older Karma/Jasmine project.

## What you'll learn

- The different kinds of tests and which one to write first
- How `ng test` and the `@angular/build:unit-test` builder run your specs
- The Vitest essentials: `describe`, `it`, `expect`, hooks, matchers and `vi`
- How to test pure functions, pipes and services, and what `TestBed` does
- How to filter, debug, configure and run tests in CI or a real browser
- How to migrate from Karma/Jasmine to Vitest

## Kinds of tests

| Kind | What it checks | Tools | Speed | Guide |
| --- | --- | --- | --- | --- |
| **Unit** | One function, pipe, service or class in isolation | Vitest (+ `TestBed`) | ⚡ milliseconds | This page, [Service testing](/testing/service-testing/) |
| **Component** | A component's template and class working together | Vitest + `TestBed` | ⚡ fast | [Component testing](/testing/component-testing/) |
| **Integration** | Several real pieces together (router, guards, forms, HTTP mocked at the edge) | Vitest + `TestBed` + `RouterTestingHarness` | 🚀 fast | [Integration testing](/testing/integration-testing/) |
| **End-to-end (E2E)** | The whole running app in real browsers, like a user | Playwright | 🐢 seconds | [E2E testing](/testing/e2e-testing/) |

A healthy test suite has **many** fast unit and component tests, a good number of integration tests, and a
**few** E2E tests for the most important user journeys.

## Your project is already set up

When you create an app with `ng new`, the CLI adds everything you need:

| File | What it does |
| --- | --- |
| `package.json` | `vitest` and `jsdom` in `devDependencies` |
| `angular.json` | a `test` target that uses the `@angular/build:unit-test` builder |
| `tsconfig.spec.json` | adds `"types": ["vitest/globals"]` so `describe`, `it`, `expect` and `vi` are typed globals |
| `src/app/app.spec.ts` | a first test for the root component |

```json title="angular.json (excerpt)"
{
  "projects": {
    "my-app": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test"
        }
      }
    }
  }
}
```

Run the tests:

```bash
ng test
```

The builder compiles your app and specs with the same esbuild/Vite pipeline as `ng build`, starts Vitest, and
**watches** your files — save a file and the affected tests run again. The output looks like this:

```bash
 RUN  v5.1.0 /home/me/my-app

 ✓ src/app/app.spec.ts (2 tests) 32ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  1.45s
```

:::note[Angular 20 and earlier]
Vitest became the default test runner in **Angular 21**. Older projects were generated with Karma + Jasmine
(`@angular/build:karma` or `@angular-devkit/build-angular:karma`). Karma is still supported — create a Karma
project with `ng new my-app --test-runner=karma` — but new projects should use Vitest.
See [Migrating from Karma/Jasmine](#migrating-from-karmajasmine) below.
:::

Angular 22 supports **Vitest 4 and 5**; new v22 projects install Vitest 5.

## Your first test

Start with plain TypeScript — no Angular involved:

```ts title="price.ts"
export function applyDiscount(price: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new RangeError('percent must be between 0 and 100');
  }
  return Math.round(price * (100 - percent)) / 100;
}
```

```ts title="price.spec.ts"
import { applyDiscount } from './price';

describe('applyDiscount', () => {
  it('takes 10% off', () => {
    expect(applyDiscount(200, 10)).toBe(180);
  });

  it('returns the same price for 0%', () => {
    expect(applyDiscount(99.99, 0)).toBe(99.99);
  });

  it('throws for an invalid percentage', () => {
    expect(() => applyDiscount(100, 120)).toThrow(RangeError);
  });

  // One test per row of data
  it.each([
    { price: 100, percent: 50, expected: 50 },
    { price: 80, percent: 25, expected: 60 },
    { price: 10, percent: 100, expected: 0 },
  ])('$price with $percent% off is $expected', ({ price, percent, expected }) => {
    expect(applyDiscount(price, percent)).toBe(expected);
  });
});
```

- `describe(name, fn)` groups related tests (a *suite*). Suites can be nested.
- `it(name, fn)` (alias `test`) is one test. Its name should read like a sentence: *"applyDiscount takes 10% off"*.
- `expect(value)` starts an assertion; a **matcher** such as `toBe` checks it.

The CLI picks up every `*.spec.ts` and `*.test.ts` file under your project's source folder.

:::tip[Arrange → Act → Assert]
Structure each test in three steps: **arrange** the inputs, **act** (call the code), **assert** the result.
Keep one behaviour per test — when it fails, the test name tells you exactly what broke.
:::

## Vitest essentials

### Globals or imports

Angular's builder turns on Vitest **globals**, so `describe`, `it`, `expect`, `vi` and the hooks are available
everywhere without imports. If you prefer explicit imports (some teams do), they work too:

```ts
import { describe, expect, it, vi } from 'vitest';
```

### Lifecycle hooks

```ts
describe('Vitest basics', () => {
  let numbers: number[];

  beforeAll(() => {
    // runs once before all tests in this describe
  });

  beforeEach(() => {
    numbers = [3, 1, 2]; // fresh data for every test
  });

  afterEach(() => {
    vi.restoreAllMocks(); // undo spies after every test
  });

  // afterAll(() => { ... }) runs once at the end
});
```

Prefer `beforeEach` over `beforeAll`: a fresh setup per test keeps tests independent.

### Common matchers

| Matcher | Use it for |
| --- | --- |
| `toBe(x)` | primitives and same object reference (`===`) |
| `toEqual(x)` | deep equality of objects/arrays |
| `toMatchObject(x)` | object contains at least these properties |
| `toContain(x)` | item in an array / substring in a string |
| `toHaveLength(n)` | `.length` of arrays, strings, `NodeList`s |
| `toBeTruthy()` / `toBeFalsy()` | truthiness |
| `toBeNull()` / `toBeUndefined()` / `toBeDefined()` | empty values |
| `toBeCloseTo(n)` | floating point numbers (`0.1 + 0.2`) |
| `toMatch(/re/)` | strings against a regex |
| `toThrow(ErrorOrMessage)` | a function throws |
| `toBeInstanceOf(Class)` | `instanceof` checks |
| `toHaveBeenCalled…()` | mock functions — see [Mocking & Spies](/testing/mocking/) |
| `.not.…` | negates any matcher |
| `expect.objectContaining({…})`, `expect.any(Number)` | flexible matching inside `toEqual` / `toHaveBeenCalledWith` |

```ts
it('has many handy matchers', () => {
  expect('Angular').toContain('gul');
  expect([3, 1, 2]).toHaveLength(3);
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect({ id: 1, name: 'Ada', role: 'admin' }).toMatchObject({ name: 'Ada' });
  expect(5).not.toBe(6);
});
```

### Async tests

Make the test `async` and `await` — no `done` callbacks needed:

```ts
it('awaits promises', async () => {
  const value = await Promise.resolve(42);
  expect(value).toBe(42);

  await expect(Promise.resolve('ok')).resolves.toBe('ok');
  await expect(Promise.reject(new Error('boom'))).rejects.toThrow('boom');
});
```

### Focusing and skipping

| Write | Effect |
| --- | --- |
| `it.only(…)` / `describe.only(…)` | run only these (in that file) |
| `it.skip(…)` / `describe.skip(…)` | skip temporarily |
| `it.todo('name')` | placeholder for a test you still need to write |
| `it.each([...])(name, fn)` | data-driven tests |

### Mock functions in one minute

`vi.fn()` creates a function that records how it was called:

```ts
it('creates mock functions with vi.fn', () => {
  const onSave = vi.fn((name: string) => `saved ${name}`);

  onSave('Ada');

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith('Ada');
  expect(onSave).toHaveReturnedWith('saved Ada');
});
```

`vi.spyOn`, typed mocks, fake timers and more are covered in [Mocking & Spies](/testing/mocking/).

## Testing a pipe

A pipe is just a class with a `transform` method, so you can test it with `new` — no Angular needed:

```ts title="truncate-pipe.ts"
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 20, trail = '…'): string {
    if (!value) {
      return '';
    }
    return value.length <= limit ? value : value.slice(0, limit).trimEnd() + trail;
  }
}
```

```ts title="truncate-pipe.spec.ts"
import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe(); // pure and stateless: one instance is fine

  it('keeps short text unchanged', () => {
    expect(pipe.transform('Short text', 20)).toBe('Short text');
  });

  it('cuts long text and adds an ellipsis', () => {
    expect(pipe.transform('Angular makes testing pleasant', 7)).toBe('Angular…');
  });

  it('supports a custom trail', () => {
    expect(pipe.transform('Hello wonderful world', 5, ' (more)')).toBe('Hello (more)');
  });

  it('returns an empty string for null and undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
```

If a pipe uses `inject()`, create it inside `TestBed.runInInjectionContext(() => new MyPipe())`. To check how a pipe
looks *inside a template*, write a component test.

## Meet `TestBed`

As soon as code uses Angular's dependency injection (`inject()`, services, components), you need **`TestBed`**.
It builds a small Angular environment for each test: an injector, the providers you choose, and a place to render
components.

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Service()
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly total = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  add(item: Omit<CartItem, 'quantity'>): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.id === item.id);
      return existing
        ? items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { ...item, quantity: 1 }];
    });
  }

  remove(id: number): void {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }
}
```

```ts title="cart-store.spec.ts"
import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart-store';

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    store = TestBed.inject(CartStore); // a fresh instance for every test
  });

  it('starts empty', () => {
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
  });

  it('increments quantity when the same item is added twice', () => {
    store.add({ id: 1, name: 'Keyboard', price: 50 });
    store.add({ id: 1, name: 'Keyboard', price: 50 });

    expect(store.items()[0]).toEqual(expect.objectContaining({ id: 1, quantity: 2 }));
    expect(store.count()).toBe(2);
    expect(store.total()).toBe(100);
  });

  it('removes an item', () => {
    store.add({ id: 1, name: 'Keyboard', price: 50 });
    store.add({ id: 2, name: 'Mouse', price: 20 });

    store.remove(1);

    expect(store.items().map((i) => i.name)).toEqual(['Mouse']);
  });
});
```

`@Service()` classes are provided automatically, so `TestBed.inject()` works without any configuration.
`TestBed` is **reset after every test**, so each test gets new service instances — state never leaks between tests.

The `TestBed` methods you'll use most:

| Method | What it does |
| --- | --- |
| `TestBed.configureTestingModule({ providers, imports })` | Adds or replaces providers for this test (call it before `inject`/`createComponent`) |
| `TestBed.inject(Token)` | Gets an instance from the test injector |
| `TestBed.createComponent(Cmp)` | Renders a component and returns a `ComponentFixture` — see [Component testing](/testing/component-testing/) |
| `TestBed.runInInjectionContext(fn)` | Runs `fn` where `inject()`, `effect()`, `form()`… are allowed |
| `TestBed.tick()` | Flushes pending effects and change detection — see [Testing signals](/testing/testing-signals/) |
| `TestBed.overrideComponent(Cmp, {...})` | Changes a component's `imports`/`providers` for the test — see [Mocking](/testing/mocking/) |

:::caution
Configure first, then use. Once you call `TestBed.inject()` or `TestBed.createComponent()`, the configuration is
frozen for that test; calling `configureTestingModule()` afterwards throws an error.
:::

## Running tests

`ng test` accepts many flags. The most useful ones:

| Command | What it does |
| --- | --- |
| `ng test` | Watch mode in a terminal, single run on CI |
| `ng test --no-watch` | Run once and exit |
| `ng test --include src/app/cart` | Only specs in a folder (or a single file, or a glob) |
| `ng test --filter "^CartStore"` | Only tests whose suite/test name matches a regular expression |
| `ng test --list-tests` | Print the discovered spec files and exit, without building |
| `ng test --coverage` | Collect code coverage — see [Code coverage](/testing/coverage/) |
| `ng test --browsers chromium` | Run in a real browser — see [Browser mode](#running-in-a-real-browser) |
| `ng test --ui` | Open the interactive Vitest UI (uses the `@vitest/ui` package) |
| `ng test --debug` | Wait for a debugger (Node inspector or browser DevTools) |
| `ng test --reporters verbose` | Change the console reporter (`default`, `verbose`, `dots`, `json`, `junit`, `tap`, `tap-flat`, `html`) |
| `ng test --reporters junit --output-file reports/junit.xml` | Write a report file for CI |
| `ng test --isolate` | Run each spec file in its own isolated environment (slower, see below) |
| `ng test --no-quiet` | Show the full build summary on every rebuild |

```bash
# Example: only the cart tests, once, with detailed output
ng test --no-watch --include src/app/cart --reporters verbose
```

:::note[No isolation by default]
To match the old Karma/Jasmine behaviour and stay fast, the Angular builder runs spec files **without** Vitest
isolation (`isolate: false`). `TestBed` is still reset between tests, but module-level variables and globals you
change (for example `window` properties or a module-scoped cache) are shared between spec files. Clean up after
yourself (restore spies, real timers, stubbed globals), or run with `--isolate` if you need full isolation.
:::

## Configuring the test target

Most options can be set permanently in `angular.json`:

```json title="angular.json (excerpt)"
{
  "test": {
    "builder": "@angular/build:unit-test",
    "options": {
      "include": ["src/**/*.spec.ts"],
      "exclude": ["src/legacy/**"],
      "setupFiles": ["src/test-setup.ts"],
      "providersFile": "src/test-providers.ts",
      "reporters": ["default", ["junit", { "outputFile": "reports/junit.xml" }]],
      "coverageReporters": ["html", "lcov"]
    }
  }
}
```

| Option | Default | Purpose |
| --- | --- | --- |
| `include` / `exclude` | `**/*.spec.ts`, `**/*.test.ts` | Which spec files to run (relative to the project source root) |
| `buildTarget` | `::development` | Which build configuration (polyfills, styles, assets…) the tests use |
| `tsConfig` | `tsconfig.spec.json` | TypeScript config for specs |
| `setupFiles` | — | Files run before the specs (global mocks, polyfills). The TestBed is already initialised when they run |
| `providersFile` | — | A file whose **default export** is an array of providers added to every test |
| `browsers` | — (jsdom/happy-dom) | Run in real browsers |
| `watch` | `true` in a terminal | Watch mode |
| `reporters`, `outputFile` | `default` | Console/report output |
| `coverage*` | off | See [Code coverage](/testing/coverage/) |
| `runner` | `vitest` | `karma` to keep using Karma with the same builder |
| `runnerConfig` | `false` | Path to (or `true` to auto-find) a Vitest config file |

`setupFiles` and `providersFile` are great for global setup. For example, to make the HTTP testing backend and the
router available in **every** test:

```ts title="src/test-providers.ts"
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

const testProviders: (Provider | EnvironmentProviders)[] = [
  provideHttpClientTesting(),
  provideRouter([]),
];

export default testProviders;
```

Make sure new setup files are included by `tsconfig.spec.json` (add them to its `include` array).

### Advanced: a Vitest config file

For anything the builder doesn't expose (for example `testTimeout` or `restoreMocks`), generate a Vitest config:

```bash
ng generate config vitest
```

This creates `vitest-base.config.mts` and sets `"runnerConfig": true` in the test target so the builder finds it:

```ts title="vitest-base.config.mts"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10_000,
    restoreMocks: true, // restore vi.spyOn spies after each test
  },
});
```

:::caution
The builder still owns some settings — it overrides `test.include` and `test.projects`, and sets `globals: true`.
The Angular team doesn't provide support for the contents of custom config files or third-party Vitest plugins, so
keep this file small.
:::

## DOM emulation vs real browser

By default your tests run in **Node.js** with a simulated DOM:

| Environment | How to get it | Good for |
| --- | --- | --- |
| `jsdom` (default) | installed by `ng new` | Most component tests — fast, no browser needed |
| `happy-dom` | `npm i -D happy-dom` (used automatically when installed) | A lighter, faster DOM emulation |
| Real browser (Vitest browser mode) | install a browser provider, set `browsers` | Layout, CSS, real events, browser-only APIs, debugging visually |

DOM emulation doesn't do layout: `getBoundingClientRect()` returns zeros, `IntersectionObserver` and CSS media
queries don't work, and there's no real focus/scroll behaviour. If a test needs those, use browser mode.

### Running in a real browser

The quickest way to set up [Vitest browser mode](https://vitest.dev/guide/browser/) with Playwright:

```bash
ng add @vitest/browser-playwright
```

This built-in CLI schematic installs `@vitest/browser-playwright` and `playwright`, adds
`"browsers": ["chromium"]` to the `test` target, and updates `tsconfig.spec.json`. You may also need to download
the browser binaries once with `npx playwright install chromium`. You can also install manually:

```bash
npm install --save-dev @vitest/browser-playwright playwright
```

| Provider | Browser names |
| --- | --- |
| `@vitest/browser-playwright` | `chromium`, `firefox`, `webkit` |
| `@vitest/browser-webdriverio` (+ `webdriverio`) | `chrome`, `firefox`, `edge`, `safari` |
| `@vitest/browser-preview` | for WebContainers such as StackBlitz only (not CI) |

```bash
ng test --browsers chromium                 # headed locally
ng test --browsers chromiumHeadless         # "Headless" suffix = headless
ng test --browsers chromium --headless      # force headless for all browsers
ng test --browsers chromium --browser-viewport 1280x720
```

To test in several browsers, list them in `angular.json`: `"browsers": ["chromium", "firefox", "webkit"]`.
Browsers run **headed** locally and **headless automatically when the `CI` environment variable is set**.

In browser mode you can also use Vitest's browser APIs, such as locators and realistic user events:

```ts title="counter.spec.ts (only works in browser mode)"
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { Counter } from './counter';

it('increments with a real click', async () => {
  const fixture = TestBed.createComponent(Counter);
  await fixture.whenStable();
  const screen = page.elementLocator(fixture.nativeElement);

  await screen.getByRole('button', { name: '+1' }).click();

  await expect.element(screen.getByText('Count: 1')).toBeVisible();
});
```

## Debugging tests

- **In the editor:** `ng test --debug` starts the runner and waits for a debugger. Attach VS Code's Node debugger
  (or Chrome DevTools for Node) and set breakpoints in your `.ts` files — source maps are always on.
- **In a browser:** `ng test --debug --browsers chromium` opens the browser; use its DevTools.
- **Interactively:** `ng test --ui` opens the Vitest UI (`npm i -D @vitest/ui`) to browse, filter and re-run tests.
- **Quick look at the DOM:** `console.log(fixture.nativeElement.innerHTML)` inside a test.

## Running tests in CI

Most CI services set `CI=true`. `ng test` detects it and runs **once**, without watch mode or interactive output
(browsers also switch to headless). If your CI doesn't set it, be explicit:

```bash
ng test --no-watch --no-progress
```

A minimal GitHub Actions job:

```yaml title=".github/workflows/test.yml"
name: Unit tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx ng test --no-watch --coverage --reporters default --reporters junit --output-file reports/junit.xml
```

Angular 22 requires Node.js `^22.22.3`, `^24.15.0` or `^26`.

## Migrating from Karma/Jasmine

There are two separate jobs: switch the **runner** (Karma → Vitest), then convert the **test code**
(Jasmine APIs → Vitest APIs).

### 1. Switch the runner with the migration

When you run `ng update` to Angular 22, the CLI offers an **optional** migration, `migrate-karma-to-vitest`.
You can also run it later:

```bash
ng update @angular/cli --migrate-only --name=migrate-karma-to-vitest
```

For every **application** project that already uses the `@angular/build:application` builder and has a Karma
`test` target, it:

- switches the builder to `@angular/build:unit-test` with `"runner": "vitest"`;
- maps `codeCoverage` → `coverage`, `codeCoverageExclude` → `coverageExclude`, and `main` → `setupFiles`;
- moves test-only build options (`polyfills`, `styles`, `assets`…) into a new `testing` build configuration used
  via `buildTarget`;
- deletes `karma.conf.js` when it contains nothing custom (otherwise it tells you what to migrate by hand);
- replaces `jasmine` with `vitest/globals` in the spec `tsconfig` types;
- installs `vitest` (plus `@vitest/coverage-v8` if you used coverage, and `@vitest/coverage-istanbul` for
  non-Chromium browsers).

Library projects are skipped, and so are apps that still use a Webpack-based builder — move those to the
`application` builder first (see [Version upgrade](/migration/version-upgrade/)). After the migration, install a DOM environment
(`npm i -D jsdom`) if you don't have one, and remove the Karma packages:

```bash
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
```

### 2. Convert Jasmine code to Vitest

The `refactor-jasmine-vitest` schematic rewrites spec files for you:

```bash
ng g @schematics/angular:refactor-jasmine-vitest
```

| Option | Purpose |
| --- | --- |
| `--project my-app` | Only one project |
| `--include src/app/cart` | Only a file or folder |
| `--file-suffix .test.ts` | Spec files use another suffix (default `.spec.ts`) |
| `--add-imports` | Add explicit `import { … } from 'vitest'` |
| `--browser-mode` | You'll run in browser mode (keeps `toHaveClass`) |
| `--fake-async` | Convert `fakeAsync`/`tick` tests to Vitest fake timers |
| `--report` | Write a `jasmine-vitest-<date>.md` summary (on by default) |
| `--verbose` | Log every transformation |

It converts `fdescribe`/`fit` → `.only`, `xdescribe`/`xit` → `.skip`, `spyOn` → `vi.spyOn`,
`jasmine.createSpy` → `vi.fn`, `jasmine.any`/`objectContaining` → `expect.any`/`expect.objectContaining`,
`fail()` → `expect.fail()`, Jasmine-only matchers, spy APIs and type annotations — and leaves `TODO` comments for
anything it can't convert safely. **Review every change** and run `ng test` afterwards.
The full Jasmine → Vitest cheat sheet is on the [Mocking & Spies](/testing/mocking/#jasmine-to-vitest-cheat-sheet) page.

### 3. Tests that use `fakeAsync`

`fakeAsync`, `tick`, `flush` and `waitForAsync` depend on **zone.js**. New zoneless apps don't load it. You have two
options:

- **Recommended:** rewrite them with `async`/`await` and Vitest fake timers (`--fake-async` above does most of
  the work). See [fake timers](/testing/mocking/#fake-timers).
- **Temporary:** if your app still uses zone.js (its `polyfills` include `zone.js`), add
  `zone.js/plugins/vitest-patch` to the `polyfills` of the build configuration your tests use. The builder sees
  zone.js and loads `zone.js/testing` for you.

### Staying on Karma (for now)

You can keep Karma while using the new builder by setting `"runner": "karma"` on `@angular/build:unit-test`.
In Angular 22, `istanbul-lib-instrument` became an **optional** peer dependency, so Karma projects that collect
coverage must have it installed — `ng update` adds it automatically.

## Common mistakes

- **Calling `configureTestingModule` after `TestBed.inject()`/`createComponent()`** — configure first.
- **Testing private implementation details** (calling private methods, spying on internals). Test what users and
  callers can observe: return values, rendered DOM, emitted outputs, HTTP requests.
- **Sharing mutable state between tests** via top-level variables. Re-create it in `beforeEach`.
- **Leaving `it.only` in committed code** — it silently skips the rest of the file.
- **Vague names** such as `it('works')`. Prefer `it('shows an error when the email is invalid')`.
- **Using `vi.mock('./my-file')` for your own code** — the Angular builder doesn't support module mocking of
  relative imports. Replace dependencies through `TestBed` providers instead ([Mocking](/testing/mocking/)).

## Best practices

- Write tests next to the code (`cart-store.ts` + `cart-store.spec.ts`).
- Test behaviour, not implementation — refactors shouldn't break good tests.
- Keep unit tests fast and deterministic: no real network, no real timers, no random data without a seed.
- Prefer real dependencies when they're simple; mock only what is slow, flaky or external.
- Run `ng test --no-watch` in CI on every pull request.

## Key takeaways

- New projects use **Vitest** through `ng test` and the `@angular/build:unit-test` builder (default since v21).
- `describe`/`it`/`expect`/`vi` are globals; tests are plain TypeScript.
- Pure functions and pipes need no Angular; anything using DI needs **`TestBed`**.
- Tests run in Node with jsdom by default; add a provider and `browsers` for real-browser runs.
- `--include`, `--filter`, `--list-tests`, `--ui`, `--debug` and reporters make day-to-day testing comfortable.
- Migrate old projects with `migrate-karma-to-vitest` + `refactor-jasmine-vitest`.

## Next steps

- [Component testing](/testing/component-testing/) — render components and interact with the DOM
- [Service testing](/testing/service-testing/) — services, HTTP and `httpResource`
- [Mocking & Spies](/testing/mocking/) — `vi.fn`, `vi.spyOn`, providers and fake timers
- [Code coverage](/testing/coverage/) — measure what your tests exercise
