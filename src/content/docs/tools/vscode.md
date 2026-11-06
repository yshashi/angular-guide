---
title: VS Code Setup 💻
description: Set up VS Code for Angular 22 — Angular Language Service (inlay hints, outline, inline styles), recommended extensions, debugging and Copilot with the Angular MCP server.
sidebar:
  order: 2
---

Visual Studio Code is the most popular editor for Angular. Out of the box it understands TypeScript, but it only understands **Angular templates** once you install the Angular Language Service. This page shows the setup we recommend in 2026 — from template autocompletion to debugging and AI assistants that know your Angular project.

## What you'll learn

- What the Angular Language Service extension does (including inlay hints and outline support)
- Which extensions and settings to use for an Angular project
- How to debug the app and Vitest tests from VS Code
- How to connect GitHub Copilot (and other AI tools) to the Angular CLI MCP server

## The Angular Language Service extension

Install **Angular Language Service** (`Angular.ng-template`), published and maintained by the Angular team. A new project already recommends it in `.vscode/extensions.json`, so VS Code prompts you to install it when you open the folder.

```bash
code --install-extension Angular.ng-template
```

It works in external templates (`user-card.html`) and inline templates (`template: \`…\``), and also in VS Code–based editors such as Cursor.

### What it gives you

| Feature | Example |
|---|---|
| **Completions** | Component selectors, inputs/outputs, signals, pipes, `@if` / `@for` blocks, `$index`, `$event` members. Missing components can be auto-imported. |
| **Errors as you type** | The same template errors `ng build` reports (unknown elements, wrong input types, calling a method that doesn't exist…). |
| **Quick info (hover)** | Hover a binding, pipe or directive to see its type and where it comes from. |
| **Go to definition / references / rename** | `F12` from `{{ user().name }}` jumps into the TypeScript class; `F2` renames across template and class. |
| **Inlay hints** (v22) | Show inferred types inline, e.g. `@for (user /* : User */ of users())`. |
| **Document symbols** (v22) | `@if`, `@for`, `@defer`, `@let` and elements appear in the **Outline** view, breadcrumbs and `Cmd/Ctrl+Shift+O`. |
| **Inline styles support** (v21.2) | Completions, hover info and code folding inside `styles: \`…\``. |
| **Linked editing** (v21.2) | Renaming `<div>` also renames its closing `</div>`. |
| **`angularCompilerOptions` schema** (v21.2) | Autocomplete and validation for Angular options in `tsconfig.json`. |

Useful commands (Command Palette → "Angular:"):

- **Go to component** / **Go to template** — jump between `user-card.ts` and `user-card.html`.
- **View Template Typecheck Block** — shows the TypeScript Angular generates to type-check a template (great for confusing errors).
- **Restart Angular Language server** — fixes stale errors after big refactors or `npm install`.

:::tip[Full checking needs strict templates]
The Language Service is most helpful with strict template type checking. In Angular 22, `strictTemplates` is `true` by default, so new projects get it automatically. Older projects updated with `ng update` may have `"strictTemplates": false` in `tsconfig.json` — remove it when you can.
:::

### Turn on inlay hints

Most Angular inlay hints are **off by default** so the editor stays calm. Enable the ones you like in `.vscode/settings.json`:

```json title=".vscode/settings.json"
{
  "editor.inlayHints.enabled": "onUnlessPressed",
  "angular.inlayHints.variableTypes.forLoopVariableTypes": true,
  "angular.inlayHints.variableTypes.letDeclarationTypes": true,
  "angular.inlayHints.variableTypes.referenceVariableTypes": true,
  "angular.inlayHints.eventHints.parameterTypes": true,
  "angular.inlayHints.bindingHints.pipeOutputTypes": true
}
```

What they look like in a template:

```html
@for (user /* : User */ of users(); track user.id) {
  @let fullName /* : string */ = user.first + ' ' + user.last;
  <input #search /* : HTMLInputElement */ (keyup)="filter($event /* : KeyboardEvent */)" />
  <p>{{ user.joined | date /* : string | null */ }}</p>
}
```

`"onUnlessPressed"` shows hints but hides them while you hold `Ctrl+Alt` (`Ctrl+Option` on macOS). Other options include `@if` alias types, `@switch` expression types, two-way binding signal types, arrow-function parameter/return types and a required-input marker (`angular.inlayHints.bindingHints.requiredInputIndicator`). Search "angular.inlayHints" in the Settings UI to see them all.

### Other extension settings

| Setting | Default | Purpose |
|---|---|---|
| `angular.documentSymbols.enabled` | `true` | Angular symbols in Outline/breadcrumbs. |
| `angular.documentSymbols.showImplicitForVariables` | `false` | Also list `$index`, `$first`, … for `@for`. |
| `angular.suggest.autoImports` | `true` | Auto-import components when you type their selector. |
| `angular.suppressAngularDiagnosticCodes` | `""` | Comma-separated template error codes to hide (use sparingly). |
| `angular.forceStrictTemplates` | `false` | Use strict template checking in the editor even if the project doesn't. |
| `angular.log` | `"off"` | Write a server log for bug reports. |

## Recommended extensions

| Extension | ID | Why |
|---|---|---|
| Angular Language Service | `Angular.ng-template` | Templates: completions, errors, navigation. **Required.** |
| ESLint | `dbaeumer.vscode-eslint` | Shows [ESLint](/tools/eslint/) problems (TS + templates) as you type. |
| Prettier – Code formatter | `esbenp.prettier-vscode` | Formats on save with the project's `.prettierrc` ([Prettier](/tools/prettier/)). |
| EditorConfig | `EditorConfig.EditorConfig` | Applies the `.editorconfig` that `ng new` creates. |
| GitHub Copilot Chat | `GitHub.copilot-chat` | AI chat/agent; pair it with the Angular MCP server (below). |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Only if you chose `--style=tailwind`. |
| Playwright Test | `ms-playwright.playwright` | Only if you use Playwright for [e2e tests](/testing/e2e-testing/). |
| Error Lens (optional) | `usernamehw.errorlens` | Shows errors inline at the end of the line. |

Share the list with your team by extending the generated file:

```json title=".vscode/extensions.json"
{
  "recommendations": [
    "angular.ng-template",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

## Recommended workspace settings

Commit `.vscode/settings.json` so everyone gets the same behaviour:

```json title=".vscode/settings.json"
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.validate": ["typescript", "html"],

  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",

  "files.exclude": { "**/.angular": true },
  "search.exclude": { "**/.angular": true, "**/dist": true, "**/coverage": true }
}
```

- `typescript.tsdk` makes VS Code use the project's TypeScript (Angular 22 uses TypeScript 6.0). Run **TypeScript: Select TypeScript Version → Use Workspace Version** once.
- `eslint.validate` makes the ESLint extension also lint `.html` templates.
- `.angular/` is the CLI's build cache — hide it from search.

:::note
User settings apply to every project; workspace settings (`.vscode/settings.json`) override them for this project only. Keep personal taste (theme, font) in user settings and team rules in workspace settings.
:::

## Debug the app in VS Code

New projects already ship with `.vscode/launch.json` and `.vscode/tasks.json`. The **ng serve** configuration starts `npm start`, waits for the build, then opens Chrome with the debugger attached:

```json title=".vscode/launch.json (generated)"
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "ng serve",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "npm: start",
      "url": "http://localhost:4200/"
    }
  ]
}
```

1. Set a breakpoint in any `.ts` file (click left of the line number).
2. Open **Run and Debug** (`Cmd/Ctrl+Shift+D`), choose **ng serve**, press `F5`.
3. Use the app — VS Code pauses on your breakpoint with variables, call stack and a debug console.

Source maps are on in the `development` configuration, so breakpoints map to your TypeScript files. Use `"type": "msedge"` instead of `"chrome"` for Edge.

### Debug Vitest tests

The generated **ng test** launch config points to `http://localhost:9876/debug.html`, which only exists for **Karma**. With Vitest (the default), use one of these instead:

- **JavaScript Debug Terminal** (simplest): Command Palette → *Debug: JavaScript Debug Terminal*, then run `npx ng test --no-watch`. VS Code attaches to the Node processes automatically and stops at your breakpoints.
- **`ng test --debug`** + attach: the test run waits for a debugger on the default Node inspector port. Add this configuration and press `F5` after starting the tests:

```json title=".vscode/launch.json"
{
  "name": "Attach to ng test --debug",
  "type": "node",
  "request": "attach",
  "port": 9229
}
```

More techniques are in [Debugging Angular apps](/tools/debugging/#debugging-unit-tests-vitest).

## AI assistants and the Angular MCP server

GitHub Copilot in VS Code (agent mode) gets much better at Angular when it can call the **Angular CLI MCP server**. The server gives the assistant tools to search the official docs for *your* Angular version, load Angular best practices, list your projects, start/stop the dev server, read build output and run targets like `test` or `build`.

### Option 1: let the CLI configure it

```bash
ng g ai-config --tool=vscode     # in an existing project
ng new my-app --ai-config=vscode # for a new project
```

This creates two files:

- `AGENTS.md` — Angular best-practice instructions that VS Code Copilot can include as custom instructions.
- `.vscode/mcp.json` — registers the Angular CLI MCP server.

### Option 2: write `.vscode/mcp.json` yourself

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

:::caution[VS Code uses `servers`]
VS Code's `mcp.json` uses a top-level `"servers"` key. Cursor (`.cursor/mcp.json`), Claude Code (`.mcp.json`) and Gemini CLI use `"mcpServers"` instead. Copying a config between tools without changing this key is the most common setup mistake.
:::

Open `mcp.json` and click **Start** above the server (or run *MCP: List Servers*), then switch Copilot Chat to **Agent** mode and check the tools list. Try prompts such as:

- "Use the Angular docs to explain `linkedSignal` and add one to `cart.ts`."
- "Start the dev server and tell me if the build has errors."
- "Run the unit tests for this project and fix failures."

### Useful server flags

Add flags to the `args` array:

```json
"args": ["-y", "@angular/cli", "mcp", "--read-only", "--local-only"]
```

| Flag | Effect |
|---|---|
| `--read-only` | Only tools that don't change your project. |
| `--local-only` | Only tools that work without internet (no online docs search). |
| `--root <path>` | Limit which folders the server may access (repeatable). |

The default tools are `search_documentation`, `get_best_practices`, `list_projects`, `devserver_start`, `devserver_stop`, `devserver_wait_for_build`, `run_target`, `onpush_zoneless_migration` and `ai_tutor` (an interactive Angular tutor).

:::tip[Agent skills]
The Angular team also publishes **agent skills** (`angular-developer`, `angular-new-app`) for tools that support skills: `npx skills add https://github.com/angular/skills`. Skills give the AI detailed instructions; the MCP server gives it actions. They work well together.
:::

## Keyboard shortcuts worth learning

| macOS | Windows/Linux | Action |
|---|---|---|
| `Cmd+P` | `Ctrl+P` | Quick open a file (type `user-card`) |
| `Cmd+Shift+P` | `Ctrl+Shift+P` | Command Palette (all "Angular:" commands) |
| `F12` / `Shift+F12` | `F12` / `Shift+F12` | Go to definition / find references (works in templates) |
| `F2` | `F2` | Rename symbol |
| `Cmd+.` | `Ctrl+.` | Quick fix (e.g. import a component) |
| `Cmd+Shift+O` | `Ctrl+Shift+O` | Go to symbol in file (includes template blocks) |
| `Cmd+T` | `Ctrl+T` | Go to symbol in workspace |
| `Shift+Option+F` | `Shift+Alt+F` | Format document |
| `F5` | `F5` | Start debugging |

## Monorepos

For a workspace with several apps/libraries (Angular CLI multi-project or Nx), open the **repository root** so the Language Service finds `angular.json`/`tsconfig.json`, and keep a single TypeScript version with `"typescript.tsdk": "node_modules/typescript/lib"`. Multi-root `.code-workspace` files also work, but every folder must be able to resolve its own `tsconfig.json`.

## Common mistakes

- **No Angular Language Service installed** → templates look like plain HTML, with no errors until you build.
- **Stale template errors** after switching branches → run *Angular: Restart Angular Language server*.
- **Using the Karma "ng test" launch config with Vitest** → use the JavaScript Debug Terminal or `ng test --debug`.
- **`mcpServers` in `.vscode/mcp.json`** → VS Code expects `servers`.
- **Formatter fights** (Prettier vs. another formatter) → set `editor.defaultFormatter` in workspace settings.

## Key takeaways

- The Angular Language Service brings type checking, navigation, inlay hints and outline support to templates.
- Commit `.vscode/extensions.json`, `settings.json` and `launch.json` to share one setup.
- Debug the app with the generated **ng serve** config; debug Vitest with the JavaScript Debug Terminal or `ng test --debug`.
- `ng g ai-config --tool=vscode` wires Copilot to the Angular MCP server in one command.

## Next steps

- [Angular CLI](/tools/angular-cli/) — every command and flag
- [Angular DevTools](/tools/devtools/) — inspect components and signals in the browser
- [Debugging Angular apps](/tools/debugging/) — techniques and error codes
- [ESLint](/tools/eslint/) and [Prettier](/tools/prettier/) — code quality on save
