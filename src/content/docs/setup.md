---
title: Development Environment 🛠️
description: Set up Angular 22 step by step — Node.js versions, the Angular CLI, ng new prompts and flags, the project structure, VS Code, DevTools and AI config.
sidebar:
  order: 3
---

Let's get your computer ready for Angular development. By the end of this page you will have
Node.js, the Angular CLI, a fresh Angular 22 project running in your browser, and an editor that
understands Angular templates.

## What you'll learn

- Which Node.js versions Angular 22 supports and how to install one
- How to install the Angular CLI and create a project with `ng new`
- What every prompt and important flag of `ng new` does
- What each file in a new Angular 22 project is for
- How to set up VS Code, Angular DevTools and (optionally) AI assistants

## Quick checklist

- [ ] Node.js `^22.22.3`, `^24.15.0` or `>=26.0.0`
- [ ] Angular CLI 22 installed
- [ ] A new project created with `ng new` and running with `ng serve`
- [ ] Editor with the **Angular Language Service** extension
- [ ] Browser with **Angular DevTools**

## Step 1: Install Node.js

The Angular CLI runs on [Node.js](https://nodejs.org/). Angular 22 supports these versions:

| Angular | Node.js | TypeScript | RxJS |
| --- | --- | --- | --- |
| **22.x** | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | `>=6.0 <6.1` | `^6.5.3 \|\| ^7.4.0` |
| 21.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.9 <6.0` | `^6.5.3 \|\| ^7.4.0` |
| 20.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8 <6.0` | `^6.5.3 \|\| ^7.4.0` |

Check what you have:

```bash
node --version
# e.g. v24.15.0 ✅   v20.19.0 ❌ (not supported by Angular 22)
```

**Recommended:** install the latest **LTS** (long-term support) release from
[nodejs.org](https://nodejs.org/), or use a version manager so you can switch versions per project:

```bash
# macOS / Linux with nvm (https://github.com/nvm-sh/nvm)
nvm install 24
nvm use 24

# Windows: use the official installer, or nvm-windows / fnm
```

:::tip
Stick to even-numbered (LTS) Node.js releases. The Angular CLI prints a warning when you use an
odd-numbered release such as 25.x, because those are not supported for production.
:::

## Step 2: Install the Angular CLI

The **Angular CLI** (`ng`) creates projects, generates code, runs the dev server, runs tests and
builds for production. Install it globally with your package manager of choice:

```bash
npm install -g @angular/cli    # npm
pnpm install -g @angular/cli   # pnpm
yarn global add @angular/cli   # Yarn
bun install -g @angular/cli    # Bun
```

Then check it works:

```bash
ng version
```

You should see `Angular CLI: 22.x.x` along with your Node.js version and package manager.

:::note[Prefer not to install globally?]
You can run any CLI command with `npx`, e.g. `npx @angular/cli@latest new my-app`. Inside a
project, `npx ng serve` uses the project's own CLI version.
:::

## Step 3: Create a new project

```bash
ng new my-app
```

The CLI asks a few questions. Use the arrow keys and <kbd>Enter</kbd>; if you're unsure, accept
the defaults.

| Prompt | Choices | Our advice |
| --- | --- | --- |
| **What name would you like to use for the new workspace and initial project?** | any name (e.g. `my-app`) | Only asked if you didn't type one |
| **Which stylesheet system would you like to use?** | CSS, Tailwind CSS, Sass (SCSS), Sass (Indented), Less | CSS is perfect for learning; Tailwind sets everything up for you |
| **Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)?** | Yes / No (default: No) | No for now — you can add it later with `ng add @angular/ssr` |
| **Which AI tools should Angular integrate with?** | None, Claude Code, Cursor, Gemini CLI, Open AI Codex, VSCode | Pick the assistant you use, or None (see [Step 7](#step-7-optional-set-up-ai-assistants)) |

The CLI then creates the files, installs the npm packages and makes an initial Git commit.

### What a new Angular 22 project gives you

You don't need to configure any of this — it's the default:

| Default | What it means |
| --- | --- |
| **Standalone components** | No `NgModule`s. Each component lists what it uses in `imports`. |
| **Zoneless** | No `zone.js`. Angular updates the screen when signals change, template events fire, or inputs change (default since v21). |
| **OnPush change detection** | Components skip unnecessary checks by default (since v22) — you don't write `changeDetection` any more. |
| **Routing** | `app.routes.ts` and `provideRouter(routes)` are ready to use. |
| **Vitest** | `ng test` runs your unit tests with Vitest (default since v21). |
| **Strict TypeScript + strict templates** | TypeScript 6 and the Angular compiler are strict by default, so many bugs are caught at build time. |
| **Prettier** | A `.prettierrc` file and the `prettier` dev dependency for consistent formatting. |
| **Short file names** | `app.ts`, `app.html`, class `App` — no `.component` suffix (the "2025" style guide). |
| **Fast builds** | The `@angular/build:application` builder (esbuild + Vite). |

### Useful `ng new` flags

Skip the prompts or change the defaults with flags:

```bash
# Accept every default without being asked
ng new my-app --defaults

# Pick options up front
ng new my-app --style=scss --ssr=false --ai-config=vscode

# Use a different package manager
ng new my-app --package-manager=pnpm
```

| Flag | Values (default) | What it does |
| --- | --- | --- |
| `--style` | `css` \| `scss` \| `sass` \| `less` \| `tailwind` (`css`) | Stylesheet format |
| `--ssr` | boolean (`false`) | Adds SSR + prerendering (`server.ts`, `main.server.ts`, …) |
| `--ai-config` | `none`, `claude-code`, `cursor`, `gemini-cli`, `open-ai-codex`, `vscode` | Generates AI instruction + MCP config files |
| `--routing` | boolean (`true`) | Sets up the router |
| `--zoneless` | boolean (`true`) | `--zoneless=false` adds zone.js and `provideZoneChangeDetection()` |
| `--test-runner` | `vitest` \| `karma` (`vitest`) | Unit test runner |
| `--package-manager` | `npm` \| `pnpm` \| `yarn` \| `bun` | Package manager to install with |
| `--prefix` | string (`app`) | Prefix for component selectors (`app-header`) |
| `--inline-style` / `-s` | boolean | Put the root component's CSS in `app.ts` |
| `--inline-template` / `-t` | boolean | Put the root component's HTML in `app.ts` |
| `--skip-tests` / `-S` | boolean | Don't create `.spec.ts` files |
| `--skip-git` / `-g` | boolean | Don't initialise a Git repository |
| `--skip-install` | boolean | Don't run `npm install` |
| `--minimal` | boolean | No testing setup — for quick experiments only |
| `--file-name-style-guide` | `2025` \| `2016` (`2025`) | `2016` brings back `app.component.ts`-style names |
| `--directory` | path | Create the workspace in a different folder |

Run `ng new --help` to see every option.

## Step 4: Run the app

```bash
cd my-app
ng serve        # or: npm start
```

```text
  ➜  Local:   http://localhost:4200/
  ➜  press h + enter to show help
```

Open `http://localhost:4200`. 🎉 Leave `ng serve` running while you work — when you save a file, the
browser updates automatically (template and style changes are hot-replaced without a full reload).

```bash
ng serve --open        # open the browser for you (-o)
ng serve --port 4300   # use another port
```

:::note
In Angular 22 the `PORT` environment variable, if set, takes priority over `--port` and
`angular.json`.
:::

## Step 5: Understand the project structure

Here is what `ng new my-app` creates (with the default answers):

```text
my-app/
├── .vscode/               # Recommended VS Code extension, launch & task configs
├── node_modules/          # Installed packages (never edit, never commit)
├── public/
│   └── favicon.ico        # Static files copied as-is to the build output
├── src/
│   ├── app/
│   │   ├── app.ts         # Root component class (App)
│   │   ├── app.html       # Root component template
│   │   ├── app.css        # Root component styles (scoped to App)
│   │   ├── app.spec.ts    # Unit tests for App (Vitest)
│   │   ├── app.config.ts  # Application-wide providers (router, HTTP, …)
│   │   └── app.routes.ts  # Route definitions
│   ├── index.html         # The single HTML page; contains <app-root>
│   ├── main.ts            # Entry point: bootstraps the App component
│   └── styles.css         # Global styles
├── .editorconfig          # Editor formatting basics (indentation, charset)
├── .gitignore
├── .prettierrc            # Prettier formatting rules
├── angular.json           # Workspace & build configuration
├── package.json           # Dependencies and npm scripts
├── README.md
├── tsconfig.json          # Shared TypeScript + Angular compiler options
├── tsconfig.app.json      # TypeScript config for the app
└── tsconfig.spec.json     # TypeScript config for tests
```

With `--ssr` you also get `src/server.ts`, `src/main.server.ts`, `src/app/app.config.server.ts` and
`src/app/app.routes.server.ts`. There is no `assets/` or `environments/` folder any more: put static
files in `public/`, and run `ng generate environments` if you need environment files.

### The key files

**`src/main.ts`** starts the app by bootstrapping the root component with the app config:

```ts title="src/main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

**`src/app/app.config.ts`** lists application-wide **providers** — services and features such as
the router or `HttpClient`:

```ts title="src/app/app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
```

`provideBrowserGlobalErrorListeners()` reports uncaught errors and unhandled promise rejections to
Angular's `ErrorHandler`. Notice there is no `provideZoneChangeDetection()` — the app is zoneless.

**`src/app/app.ts`** is the root component. Its selector `app-root` matches the `<app-root>` tag in
`index.html`:

```ts title="src/app/app.ts"
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('my-app');
}
```

**`src/app/app.html`** contains a big placeholder welcome page. Somewhere inside it you'll find
`<h1>Hello, {{ title() }}</h1>` and, at the very end, `<router-outlet />`, where routed pages
appear. You'll replace this file in [Your First App](/beginner/first-app/).

**`angular.json`** configures the `build` (`@angular/build:application`), `serve`
(`@angular/build:dev-server`) and `test` (`@angular/build:unit-test`) targets — including bundle
size **budgets** that warn you when your app grows too large.

**`package.json`** contains handy scripts:

| Script | Runs | Purpose |
| --- | --- | --- |
| `npm start` | `ng serve` | Dev server on port 4200 |
| `npm run build` | `ng build` | Production build into `dist/my-app/` |
| `npm run watch` | `ng build --watch --configuration development` | Rebuild on every change |
| `npm test` | `ng test` | Run unit tests with Vitest |

### Generate code with the CLI

Use `ng generate` (or `ng g`) instead of creating files by hand:

```bash
ng generate component user-card   # src/app/user-card/user-card.ts, .html, .css, .spec.ts
ng generate service user-store    # src/app/user-store.ts (uses @Service()) + spec
ng generate pipe initials
ng generate directive highlight
ng generate guard auth
```

See the [Angular CLI](/tools/angular-cli/) page for every command.

## Step 6: Set up your editor

### VS Code (recommended)

Install [Visual Studio Code](https://code.visualstudio.com/). When you open a new Angular project,
VS Code suggests the extension listed in `.vscode/extensions.json`:

| Extension | ID | Why |
| --- | --- | --- |
| **Angular Language Service** | `angular.ng-template` | Autocomplete, errors, go-to-definition and quick info **inside templates** |
| Prettier | `esbenp.prettier-vscode` | Formats code using the project's `.prettierrc` |
| ESLint (optional) | `dbaeumer.vscode-eslint` | Shows lint errors after you run `ng add angular-eslint` |

Suggested workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.quoteStyle": "single"
}
```

The generated `.vscode/launch.json` already contains an **"ng serve"** debug configuration, so you
can press <kbd>F5</kbd> to start the app with the VS Code debugger attached. See
[VS Code Setup](/tools/vscode/) for more tips.

### Other editors

The Angular Language Service is also available for **WebStorm** (built in), **Zed**, **Neovim**,
**Sublime Text** and **Eclipse IDE**.

## Step 7 (optional): Set up AI assistants

Angular 22 has first-class support for AI coding assistants. If you answered the
**"Which AI tools…"** prompt, the CLI already created these files. You can add them to any existing
project too:

```bash
ng generate ai-config            # asks which tools you use
ng generate ai-config --tool=vscode
```

| Tool | Files created |
| --- | --- |
| Claude Code | `CLAUDE.md` + `.mcp.json` |
| Cursor | `AGENTS.md` + `.cursor/mcp.json` |
| Gemini CLI | `.gemini/GEMINI.md` + `.gemini/settings.json` |
| OpenAI Codex | `AGENTS.md` + `.codex/config.toml` |
| VS Code | `AGENTS.md` + `.vscode/mcp.json` |

- The **instruction file** (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) teaches the assistant modern
  Angular best practices, so it writes signals and `@if` instead of outdated code.
- The **MCP config** connects the assistant to the **Angular CLI MCP server** (`ng mcp`), which lets
  it search the official docs, find examples, list your projects, build, test and more.

For example, `.vscode/mcp.json` looks like this:

```json title=".vscode/mcp.json"
{
  "servers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

Learn more in [Angular MCP Server](/ai/mcp-server/) and
[AI Config, Rules & Skills](/ai/ai-config-and-skills/), or start with the
[Angular + AI overview](/ai/overview/).

## Step 8: Install Angular DevTools

**Angular DevTools** is a browser extension for inspecting your running app: the component tree,
inputs and signal values, the dependency-injection tree, the router tree and a change-detection
profiler.

- [Chrome Web Store](https://chrome.google.com/webstore/detail/angular-developer-tools/ienfalfjdbdpebioblfackkekamfmbnh) (works in Chrome and Edge)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/angular-devtools/)

Open your app (in development mode), press <kbd>F12</kbd> and look for the **Angular** tab. See
[Angular DevTools](/tools/devtools/) for a full walkthrough.

## Optional extras

Add official and community packages with `ng add`, which installs **and** configures them:

```bash
ng add @angular/material   # Material Design components (+ CDK)
ng add @angular/ssr        # Server-side rendering for an existing app
ng add angular-eslint      # Linting with `ng lint`
```

Enable tab-completion for `ng` commands in your shell:

```bash
ng completion
```

## Troubleshooting

**"The Angular CLI requires a minimum Node.js version…"** — your Node.js is too old (for example
v20). Install a supported version (Step 1) and reinstall the CLI.

**`ng: command not found`** — the global npm folder isn't on your `PATH`. Close and reopen the
terminal, or use `npx ng …` inside a project.

**PowerShell: "running scripts is disabled on this system"** (Windows) — allow scripts for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**`EACCES: permission denied`** when installing globally (macOS/Linux) — avoid `sudo` where you can;
installing Node.js with a version manager such as nvm puts global packages in your home folder.

**Port 4200 is already in use** — stop the other server, or run `ng serve --port 4300`.

**Strange build errors after switching branches or upgrading** — clear the build cache:

```bash
ng cache clean
```

**Still stuck?** Check the versions of everything:

```bash
node --version
npm --version
ng version
```

## Key takeaways

- Angular 22 needs **Node.js 22.22.3+, 24.15+ or 26**; install the CLI with `npm install -g @angular/cli`.
- `ng new` asks about **styles, SSR and AI tools**; everything else (standalone, zoneless, OnPush,
  routing, Vitest, strict mode, Prettier) is already set up for you.
- The app starts in `main.ts` → `bootstrapApplication(App, appConfig)`; providers live in
  `app.config.ts`, routes in `app.routes.ts`.
- Install the **Angular Language Service** and **Angular DevTools** — they make learning much easier.

## Next steps

1. **[Learning Path Guide](/learning-path/)** — choose your route through the course
2. **[What is Angular?](/beginner/what-is-angular/)** — start the beginner section
3. **[Your First App](/beginner/first-app/)** — build a task manager in your new project

Need help? Join the [Let's Program Telegram community](https://t.me/letsprogramYt/1). 🚀
