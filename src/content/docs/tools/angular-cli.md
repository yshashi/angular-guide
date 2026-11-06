---
title: Angular CLI ⚙️
description: Learn the Angular 22 CLI — ng new, ng generate, ng serve, ng build, ng test (Vitest), ng update, ng add, ng mcp and angular.json essentials.
sidebar:
  order: 1
---

The Angular CLI (`@angular/cli`, command `ng`) is the official tool for creating, running, testing, building and updating Angular apps. You will use it every day, so it pays to know its commands and the handful of flags that matter.

## What you'll learn

- How to install the CLI and create a new Angular 22 project with the right options
- How to generate components, services and other files (and what the files look like)
- How to run the dev server, build for production and run Vitest unit tests
- How to add libraries, update Angular and use the built-in AI (MCP) server
- The essential parts of `angular.json`

## Install the CLI

Angular 22 needs **Node.js `^22.22.3`, `^24.15.0` or `>=26`** (Node 20 is no longer supported).

```bash
node --version                 # check your Node.js version first
npm install -g @angular/cli    # install the CLI globally
ng version                     # verify
```

`ng version` prints the CLI, Angular, Node.js, package manager and OS versions, followed by a table of every Angular-related package in your project (installed vs. requested version). For scripts and bug reports, use JSON output:

```bash
ng version --json
```

```json
{
  "cli": { "version": "22.2.6" },
  "framework": { "version": "22.2.4" },
  "system": {
    "node": { "version": "24.16.0", "unsupported": false },
    "os": { "platform": "darwin", "architecture": "arm64" },
    "packageManager": { "name": "npm", "version": "11.13.0" }
  },
  "packages": {
    "@angular/core": { "requested": "^22.2.0", "installed": "22.2.4" }
  }
}
```

:::tip[No global install needed]
You can always run the CLI through `npx` — handy on CI or when you need a specific version:

```bash
npx @angular/cli@latest new my-app
```

Inside a project, `npm run ng -- <command>` (or `npx ng <command>`) uses the project's local CLI version.
:::

## Create a project with `ng new`

```bash
ng new my-app
```

The CLI asks a few questions (stylesheet system, SSR/SSG, which AI tools to configure), creates the workspace, installs packages and makes the first Git commit. You can answer the questions up front with flags:

```bash
ng new my-app --style=scss --ssr=false --ai-config=vscode
```

### What a new Angular 22 project contains

A fresh project is modern by default — no extra flags needed:

| Default | What it means |
|---|---|
| Standalone | No NgModules. Components import what they use. |
| Zoneless | No `zone.js` (default since v21). |
| OnPush by default | Components without `changeDetection` are OnPush (since v22). |
| Vitest | `ng test` runs Vitest via `@angular/build:unit-test` (default since v21). |
| `@angular/build:application` | esbuild + Vite based build and dev server. |
| Strict mode | Strict TypeScript, strict templates and tighter budgets. |
| Prettier | `prettier` dev dependency and a `.prettierrc` file. |
| 2025 file names | `app.ts`, `app.html`, `app.css`, class `App` — no `.component` suffix. |

```text
my-app/
├── .vscode/              # recommended extension, launch & task configs
├── public/               # static assets (favicon, images) copied as-is
├── src/
│   ├── app/
│   │   ├── app.config.ts # providers: provideBrowserGlobalErrorListeners(), provideRouter(routes)
│   │   ├── app.routes.ts
│   │   ├── app.ts        # root component (class App)
│   │   ├── app.html
│   │   ├── app.css
│   │   └── app.spec.ts
│   ├── index.html
│   ├── main.ts           # bootstrapApplication(App, appConfig)
│   └── styles.css
├── .prettierrc
├── angular.json
├── package.json
└── tsconfig.json (+ tsconfig.app.json, tsconfig.spec.json)
```

### `ng new` options

| Flag | Values / default | What it does |
|---|---|---|
| `--style` | `css` \| `scss` \| `sass` \| `less` \| `tailwind` | Stylesheet system. `tailwind` sets up Tailwind CSS for you. |
| `--ssr` | boolean | Add server-side rendering and prerendering (SSG). |
| `--ai-config` | `vscode`, `cursor`, `claude-code`, `gemini-cli`, `open-ai-codex`, `none` (array) | Generate AI instruction files (e.g. `AGENTS.md`) and Angular MCP server config. |
| `--routing` | boolean | Set up the router (on by default for new apps). |
| `--test-runner` | `vitest` (default) \| `karma` | Unit test runner. |
| `--zoneless` | boolean | Zoneless app. Already the default; use `--no-zoneless` to include `zone.js`. |
| `--file-name-style-guide` | `2025` (default) \| `2016` | `2016` brings back `app.component.ts` / `AppComponent` names. |
| `--prefix` | `app` | Selector prefix for generated components (`app-…`). |
| `--package-manager` | `npm` \| `pnpm` \| `yarn` \| `bun` | Which package manager to install with. |
| `--skip-tests` / `-S` | `false` | Don't create `*.spec.ts` files. |
| `--inline-template` / `-t`, `--inline-style` / `-s` | `false` | Put the root component's template/styles inside `app.ts`. |
| `--view-encapsulation` | `Emulated` \| `None` \| `ShadowDom` | Default encapsulation for components. |
| `--strict` | `true` | Strict type checking and budgets. Keep it on. |
| `--minimal` | `false` | No testing setup — for quick experiments only. |
| `--create-application` | `true` | `false` creates an empty workspace (for libraries/monorepos). |
| `--directory` | — | Folder to create the workspace in. |
| `--skip-install`, `--skip-git` / `-g`, `--commit` | — | Control install, Git init and the initial commit. |
| `--defaults`, `--interactive=false`, `--dry-run` / `-d` | — | Skip prompts, or preview without writing files. |

:::note[Angular 21 and earlier]
Components without a `changeDetection` setting used the "Default" (now called `Eager`) strategy before v22, and before v21 new projects included `zone.js` and Karma/Jasmine.
:::

## Generate code with `ng generate`

`ng generate <schematic> <name>` (short: `ng g`) creates files from templates called **schematics**. The path is relative to `src/app/`.

```bash
ng g component features/user-profile
```

```text
CREATE src/app/features/user-profile/user-profile.css
CREATE src/app/features/user-profile/user-profile.spec.ts
CREATE src/app/features/user-profile/user-profile.ts
CREATE src/app/features/user-profile/user-profile.html
```

```ts title="user-profile.ts"
import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile {}
```

There is no `standalone: true` (standalone is the default) and no `changeDetection` line (OnPush is the default since v22).

Services are generated with the `@Service()` decorator, which makes them app-wide singletons:

```bash
ng g service core/auth           # → src/app/core/auth.ts, class Auth
ng g service core/auth --type=service  # → auth.service.ts, class AuthService
```

```ts title="auth.ts"
import { Service } from '@angular/core';

@Service()
export class Auth {}
```

:::tip
Need the classic `@Injectable({ providedIn: 'root' })` instead (for example in a library that supports older Angular versions)? Use `ng g service core/auth --injectable`.
:::

### All built-in schematics

| Command | Alias | Creates (2025 naming) |
|---|---|---|
| `ng g component <name>` | `c` | `name.ts`, `.html`, `.css`, `.spec.ts` in a new folder — class `Name` |
| `ng g service <name>` | `s` | `name.ts` with `@Service()` |
| `ng g directive <name>` | `d` | `name.ts` — class `Name`, selector `[appName]` |
| `ng g pipe <name>` | `p` | `name-pipe.ts` — class `NamePipe` |
| `ng g guard <name>` | `g` | `name-guard.ts` — functional `CanActivateFn` (use `--implements` for others) |
| `ng g resolver <name>` | `r` | `name-resolver.ts` — functional `ResolveFn` |
| `ng g interceptor <name>` | — | `name-interceptor.ts` — functional `HttpInterceptorFn` |
| `ng g interface <name> [type]` | `i` | `name.ts` with an `export interface` |
| `ng g enum <name>` | `e` | `name.ts` with an `export enum` |
| `ng g class <name>` | `cl` | `name.ts` + spec |
| `ng g environments` | — | `src/environments/environment*.ts` + `fileReplacements` in `angular.json` |
| `ng g config <type>` | — | `vitest` → `vitest-base.config.mts`, `karma`, or `browserslist` config |
| `ng g web-worker <name>` | — | A web worker + `tsconfig.worker.json` |
| `ng g service-worker` | — | Service worker (PWA caching) setup |
| `ng g app-shell` | — | App shell rendered at build time (needs SSR) |
| `ng g application <name>` | `app` | A second app in the workspace |
| `ng g library <name>` | `lib` | A library project (uses ng-packagr) |
| `ng g module <name>` | `m` | An NgModule (legacy code only) |
| `ng g ai-config` | — | AI instruction files + Angular MCP config (see [below](#ai-configuration-ng-generate-ai-config)) |

### Useful `ng generate` flags

```bash
ng g c shared/button --inline-template --inline-style   # -t -s: single-file component
ng g c layout/header --skip-tests                       # no spec file
ng g c features/dashboard --flat                        # no sub-folder
ng g c widgets/chart --change-detection=Eager           # opt out of OnPush (rarely needed)
ng g c pages/home --export-default                      # default export (nice for loadComponent)
ng g c ui/card --type=component                         # card.component.ts + class CardComponent
ng g guard core/admin --implements=CanMatch             # CanMatchFn instead of CanActivateFn
ng g c features/settings --dry-run                      # -d: preview only
```

:::tip[Formatting is automatic]
If Prettier is installed in your project (it is in new projects), the CLI runs Prettier on every file a schematic creates or modifies — including `ng add` and `ng update` migrations. See [Prettier](/tools/prettier/).
:::

### Set default options per project

Tired of typing the same flags? Set defaults in `angular.json`:

```json title="angular.json"
{
  "projects": {
    "my-app": {
      "schematics": {
        "@schematics/angular:component": { "style": "scss", "skipTests": false },
        "@schematics/angular:service": { "type": "service" }
      }
    }
  }
}
```

### AI configuration: `ng generate ai-config`

```bash
ng g ai-config --tool=vscode --tool=claude-code
```

| `--tool` | Files created |
|---|---|
| `vscode` | `AGENTS.md`, `.vscode/mcp.json` |
| `cursor` | `AGENTS.md`, `.cursor/mcp.json` |
| `claude-code` | `CLAUDE.md`, `.mcp.json` |
| `gemini-cli` | `.gemini/GEMINI.md`, `.gemini/settings.json` |
| `open-ai-codex` | `AGENTS.md`, `.codex/config.toml` |

The Markdown file contains Angular best practices for the AI assistant; the JSON/TOML file registers the Angular CLI MCP server. The schematic doesn't overwrite files you already have.

## Run the dev server with `ng serve`

```bash
ng serve           # http://localhost:4200, rebuilds and reloads on save
ng serve --open    # -o: also open the browser
```

| Option | Default | Use it to… |
|---|---|---|
| `--port` | `4200` | Change the port. **The `PORT` environment variable wins** over `--port` and `angular.json` (since v22). |
| `--host` | `localhost` | `0.0.0.0` exposes the server on your network (e.g. test on a phone). |
| `--allowed-hosts` | — | Allow extra host names (needed behind some proxies/tunnels). |
| `--ssl`, `--ssl-cert`, `--ssl-key` | `false` | Serve over HTTPS. |
| `--proxy-config` | — | Forward API calls to a backend (see below). |
| `--hmr` | same as `--live-reload` | Hot module replacement for styles and templates (keeps component state). |
| `--live-reload`, `--watch` | `true` | Turn reloading/watching off. |
| `--define` | — | Replace global identifiers at build time, e.g. `--define "API_URL='http://x'"`. |
| `--headers` | — | Add custom response headers. |
| `--serve-path` | — | Serve the app under a sub-path. |
| `-c, --configuration` | `development` | Serve another build configuration, e.g. `production`. |
| `--inspect` | — | Open the Node.js inspector for SSR/SSG server code. |

```bash
PORT=3000 ng serve        # macOS/Linux; same as --port 3000
```

### Proxy API calls to a backend

Create `src/proxy.conf.json`:

```json title="src/proxy.conf.json"
{
  "/api/**": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Reference it once in `angular.json` so you never need the flag:

```json title="angular.json"
"serve": {
  "builder": "@angular/build:dev-server",
  "options": { "proxyConfig": "src/proxy.conf.json" }
}
```

Now a request to `http://localhost:4200/api/users` goes to `http://localhost:3000/api/users`. Path matching: `/api` matches anything starting with `/api` (even `/api-docs`), `/api/*` matches one level, `/api/**` matches `/api` and everything below it. Restart `ng serve` after editing the proxy file. To strip the prefix, add `"pathRewrite": { "^/api": "" }`.

## Build with `ng build`

```bash
ng build                          # production build (default configuration)
ng build -c development           # fast, unminified build with source maps
```

Output goes to `dist/my-app/browser/` (plus `dist/my-app/server/` when SSR is enabled). Production builds are minified, tree-shaken, hashed for caching and checked against size **budgets**.

| Option | What it does |
|---|---|
| `-c, --configuration` | `production` (default) or `development` — or your own. |
| `--base-href /shop/` | Set `<base href>` when the app lives in a sub-folder. |
| `--source-map` | Emit source maps (off in production by default). |
| `--stats-json` | Write `browser-stats.json` (and `server-stats.json` with SSR) for bundle analysis. |
| `--output-hashing` | `all` \| `bundles` \| `media` \| `none`. |
| `--output-mode` | `static` (any static host) or `server` (Node server for SSR/hybrid rendering). |
| `--localize` | Build one bundle per locale (i18n). |
| `--subresource-integrity` | Add SRI hashes to scripts. |
| `--define` | Replace global constants at build time. |
| `--watch` | Rebuild on change. |
| `--verbose` | Detailed logging. |

Analyze what's in your bundle:

```bash
ng build --stats-json
# then open https://esbuild.github.io/analyze/ and drop in dist/my-app/browser-stats.json
```

## Unit tests with `ng test` (Vitest)

```bash
ng test                      # watch mode in a terminal (TTY)
ng test --no-watch           # single run (CI)
ng test --coverage           # coverage report in coverage/<project>/
```

By default tests run in Node.js with a simulated DOM (`happy-dom` if installed, otherwise `jsdom`).

| Option | What it does |
|---|---|
| `--watch` / `--no-watch` | Re-run on change. Defaults to `true` in a terminal, `false` in CI. |
| `--include`, `--exclude` | Globs (relative to `src`). `--include src/app/auth` runs one folder. |
| `--filter "^Auth"` | Only run suites/tests whose name matches a regex. |
| `--list-tests` | Print discovered test files and exit. |
| `--browsers ChromiumHeadless` | Run in a real browser (Vitest browser mode with Playwright or WebdriverIO). |
| `--headless`, `--browser-viewport 1280x720` | Browser-mode helpers. |
| `--coverage`, `--coverage-include`, `--coverage-exclude`, `--coverage-reporters` | Code coverage. |
| `--reporters`, `--output-file` | e.g. `--reporters=junit --output-file=report.xml` for CI. |
| `--ui` | Open the Vitest UI. |
| `--debug` | Wait for a debugger (Node inspector) — see [Debugging](/tools/debugging/). |
| `--setup-files`, `--providers-file` | Global setup / shared Angular providers for all tests. |
| `--isolate` | Run each test file in isolation (off by default, like Karma). |
| `--runner-config` | Use a `vitest-base.config.mts` for advanced Vitest options. |

```bash
ng g config vitest   # creates vitest-base.config.mts for advanced Vitest settings
```

:::note[Coming from Karma?]
`ng update` to v22 offers the `migrate-karma-to-vitest` migration, and `ng g @schematics/angular:refactor-jasmine-vitest` converts Jasmine syntax (`jasmine.createSpyObj`, `fakeAsync`, …) to Vitest. See [Unit testing](/testing/unit-testing/).
:::

## End-to-end tests with `ng e2e`

New projects don't include an e2e framework. The first time you run `ng e2e`, the CLI offers to add one:

```bash
ng e2e
# Cannot find "e2e" target … Would you like to add a package with "e2e" capabilities now?
#   Playwright · Cypress · Nightwatch · WebdriverIO · Puppeteer
```

Or add one directly, e.g. `ng add playwright-ng-schematics` or `ng add @cypress/schematic`. After that, `ng e2e` builds/serves the app and runs the tests. See [E2E testing](/testing/e2e-testing/).

## Add libraries with `ng add`

`ng add <package>` installs a package **and** runs its setup schematic (config, providers, styles):

```bash
ng add @angular/material      # theme, fonts, animations setup
ng add @angular/ssr           # add SSR to an existing app
ng add @angular/pwa           # service worker + web manifest
ng add angular-eslint         # ESLint + `ng lint` target
ng add @ngrx/signals
```

| Option | What it does |
|---|---|
| `--dry-run` / `-d` | Show planned actions without changing anything. |
| `--skip-confirmation` | Don't ask before installing. |
| `--defaults` | Accept default answers. |
| `--registry` | Use another npm registry. |

If a package has no `ng add` schematic, the CLI still installs it. Peer-dependency conflicts are reported with a detailed explanation.

## Update Angular with `ng update`

```bash
ng update                                   # list available updates
ng update @angular/core @angular/cli        # update to the latest version
ng update @angular/core@22 @angular/cli@22  # one major at a time
```

`ng update` updates `package.json`, installs, and then runs **migrations** that rewrite your code (for v22, for example: add `ChangeDetectionStrategy.Eager` to components that relied on the old default, add `withXhr()` where XHR features are needed, migrate Karma to Vitest). Modified files are formatted with Prettier.

| Option | What it does |
|---|---|
| `-C, --create-commits` | One Git commit per migration — easy to review. |
| `--allow-dirty` | Run even with uncommitted changes (not recommended). |
| `--force` | Ignore peer dependency mismatches. |
| `--next` | Update to the next pre-release (RC/beta). |
| `--migrate-only --name <migration>` | Re-run a single migration. |
| `--migrate-only --from 21 --to 22` | Re-run the migrations for a version range. |

:::caution
Commit your work first, update **one major version at a time**, and use the interactive guide at [update.angular.dev](https://update.angular.dev/) for manual steps. More in [Version upgrades](/migration/version-upgrade/).
:::

## AI assistants: `ng mcp`

The CLI includes a **Model Context Protocol (MCP) server** so AI assistants (Copilot in VS Code, Cursor, Claude Code, Gemini CLI, …) can search the Angular docs, read best practices, list your projects, start the dev server and run builds/tests.

```bash
ng mcp                 # prints setup help; AI tools start it as `npx -y @angular/cli mcp`
```

| Flag | Effect |
|---|---|
| `--read-only` | Only register tools that don't modify your project. |
| `--local-only` | Only register tools that don't need internet access. |
| `--root <path>` | Restrict file-system access/workspace discovery to these folders (repeatable). |

You rarely run it by hand — `ng new --ai-config` or `ng g ai-config` writes the config for your editor. See [VS Code setup](/tools/vscode/#ai-assistants-and-the-angular-mcp-server).

## Other commands

| Command | What it does |
|---|---|
| `ng lint` | Run the `lint` target. Without one, the CLI offers to add ESLint ([ESLint](/tools/eslint/)). |
| `ng deploy` | Run the `deploy` target. Without one, the CLI offers adapters for Amazon S3, Firebase, Netlify and GitHub Pages. |
| `ng extract-i18n` | Extract `i18n` messages (`--format xlf`, `xlf2`, `json`, `arb`, …). |
| `ng run <project:target[:config]>` | Run any target in `angular.json`. |
| `ng config [path] [value]` | Read/write `angular.json` values, e.g. `ng config cli.packageManager pnpm`. |
| `ng cache clean \| info \| enable \| disable` | Manage the build cache in `.angular/cache`. |
| `ng analytics on \| off \| info \| prompt` | Control anonymous usage analytics. `NG_CLI_ANALYTICS=false` disables it (useful in CI). |
| `ng completion` | Set up shell autocompletion (bash/zsh). |
| `ng help`, `ng <command> --help` | Built-in help for every command and option. |

```bash
ng cache info    # where the cache lives and whether it's enabled
ng cache clean   # first thing to try when a build behaves strangely
```

:::tip[CLI syntax tips]
Booleans accept `--flag` / `--no-flag` (or `--flag=false`). Arrays accept `--opt a b` or `--opt a --opt b`. Most options have camelCase equivalents in `angular.json`.
:::

## `angular.json` essentials

`angular.json` describes the workspace: its projects and the **targets** (`build`, `serve`, `test`, …) the CLI runs. This is what a new project contains (trimmed):

```json title="angular.json"
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": { "packageManager": "npm" },
  "newProjectRoot": "projects",
  "projects": {
    "my-app": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "schematics": {},
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [{ "glob": "**/*", "input": "public" }],
            "styles": ["src/styles.css"]
          },
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
                { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": { "buildTarget": "my-app:build:production" },
            "development": { "buildTarget": "my-app:build:development" }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test"
        }
      }
    }
  }
}
```

| Setting | Purpose |
|---|---|
| `cli.packageManager`, `cli.cache`, `cli.analytics` | CLI-wide settings (`cache` has `enabled`, `environment` = `local` \| `ci` \| `all`, `path`). |
| `schematics` | Default options for `ng generate`. |
| `architect.<target>.builder` | Which builder runs the target. |
| `options` / `configurations` / `defaultConfiguration` | Base options, named overrides (`-c name`), and which one is used by default. |
| `assets` | Files copied to the output (the `public/` folder by default). |
| `styles` / `scripts` | Global CSS and scripts. |
| `budgets` | Fail or warn when bundles grow too large. |
| `fileReplacements` | Swap files per configuration (used by `ng g environments`). |
| `sourceMap`, `optimization`, `outputHashing` | Debuggability vs. size trade-offs. |
| `server`, `ssr`, `outputMode` | Server-side rendering setup (added by `--ssr` / `ng add @angular/ssr`). |

:::caution[Deprecated builders]
Webpack-based builders from `@angular-devkit/build-angular` (`:browser`, `:dev-server`, `:karma` …) are deprecated since v22. Migrate to `@angular/build:*` with `ng update @angular/cli --name use-application-builder` (see [Version upgrades](/migration/version-upgrade/)).
:::

## Common mistakes

- **Running a too-old Node.js.** v22 refuses to run on Node 20. Check with `node --version`.
- **Mixing global and local CLI versions.** The CLI warns when the global `ng` is newer than the project's. Use `npx ng` inside projects.
- **Updating several majors at once.** Go 20 → 21 → 22, running migrations at each step.
- **Hard-coding a port in scripts** while `PORT` is set by your environment — remember `PORT` takes priority in v22.
- **Adding `standalone: true` or `changeDetection: OnPush` by hand** to generated code — both are already the defaults.

## Key takeaways

- `ng new` gives you a standalone, zoneless, OnPush-by-default, Vitest, strict, Prettier-formatted project with 2025 file names.
- `ng g` creates files with modern defaults: `@Service()` services, functional guards/resolvers/interceptors.
- `ng serve`, `ng build`, `ng test` cover the daily loop; `ng add` and `ng update` keep the project healthy.
- `ng g ai-config` and `ng mcp` connect AI assistants to your project.

## Next steps

- [VS Code setup](/tools/vscode/) — editor, Angular Language Service and AI tools
- [Schematics](/tools/schematics/) — built-in migrations and writing your own generators
- [Unit testing](/testing/unit-testing/) — writing Vitest tests
- [Deployment strategies](/deployment/strategies/) — shipping your build
