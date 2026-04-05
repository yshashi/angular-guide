---
title: VS Code Setup 💻
description: Optimize VS Code for Angular development with extensions, settings, and productivity tips
sidebar:
  order: 2
---

Visual Studio Code is the most popular editor for Angular development. With the right extensions, settings, and configuration, you can dramatically boost your productivity — from intelligent autocompletion and inline error detection to one-click debugging and automated formatting.

## 🎯 Essential Extensions

Install these extensions to get a first-class Angular development experience:

### Angular Language Service

The **must-have** extension for Angular development. It provides autocompletion, error checking, and go-to-definition inside Angular templates.

```
Extension ID: Angular.ng-template
```

Features:
- Autocomplete for component inputs, outputs, and template variables
- Inline template error checking (type errors, missing properties)
- Go-to-definition from templates to TypeScript
- Hover information for directives and pipes
- Signal type checking in templates

### ESLint

Integrates ESLint into VS Code for real-time linting feedback:

```
Extension ID: dbaeumer.vscode-eslint
```

### Prettier — Code Formatter

Automatic code formatting that keeps your codebase consistent:

```
Extension ID: esbenp.prettier-vscode
```

### Error Lens

Displays errors and warnings inline — no need to hover over squiggly lines:

```
Extension ID: usernameheo.errorlens
```

### GitLens

Supercharges Git capabilities with inline blame, history, and comparison tools:

```
Extension ID: eamodio.gitlens
```

### Additional Recommended Extensions

| Extension | ID | Purpose |
|-----------|-----|---------|
| Path Intellisense | `christian-kohler.path-intellisense` | Autocomplete file paths |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | Rename paired HTML tags |
| Material Icon Theme | `PKief.material-icon-theme` | Better file icons |
| TODO Highlight | `wayou.vscode-todo-highlight` | Highlight TODO/FIXME comments |
| Import Cost | `wix.vscode-import-cost` | Show import sizes inline |

## ⚙️ Recommended Settings

Add these settings to your workspace or user `settings.json` for an optimal Angular setup:

```json
{
  // TypeScript
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",

  // Formatting
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll.eslint": "explicit"
  },

  // Editor
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.inlineSuggest.enabled": true,
  "editor.minimap.enabled": false,
  "editor.wordWrap": "on",
  "editor.tabSize": 2,

  // Files
  "files.autoSave": "onFocusChange",
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.angular": true
  },

  // Angular-specific
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.angular": true,
    "**/package-lock.json": true
  },

  // Emmet for Angular templates
  "emmet.includeLanguages": {
    "typescript": "html"
  }
}
```

:::tip
Use **Workspace Settings** (`.vscode/settings.json`) for project-specific config and commit it to Git. This ensures every team member has the same experience.
:::

## 📝 Useful Snippets

Create custom snippets for common Angular patterns. Go to **File → Preferences → Configure Snippets → typescript.json**:

```json
{
  "Angular Component with Signals": {
    "prefix": "ng-component-signal",
    "body": [
      "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';",
      "",
      "@Component({",
      "  selector: 'app-${1:name}',",
      "  template: `",
      "    <div>",
      "      {{ ${2:value}() }}",
      "    </div>",
      "  `,",
      "  changeDetection: ChangeDetectionStrategy.OnPush,",
      "})",
      "export class ${3:Name}Component {",
      "  ${2:value} = signal(${4:''});",
      "}"
    ],
    "description": "Angular standalone component with signal"
  },
  "Angular Injectable Service": {
    "prefix": "ng-service",
    "body": [
      "import { Injectable, inject } from '@angular/core';",
      "import { HttpClient } from '@angular/common/http';",
      "",
      "@Injectable({",
      "  providedIn: 'root',",
      "})",
      "export class ${1:Name}Service {",
      "  private http = inject(HttpClient);",
      "}"
    ],
    "description": "Angular injectable service with HttpClient"
  },
  "Signal Input": {
    "prefix": "ng-input",
    "body": [
      "${1:name} = input<${2:string}>(${3:''});"
    ],
    "description": "Angular signal input"
  },
  "Inject Function": {
    "prefix": "ng-inject",
    "body": [
      "private ${1:service} = inject(${2:ServiceName});"
    ],
    "description": "Angular inject function"
  }
}
```

## 🐛 Debugging Setup

Configure VS Code to debug your Angular app directly in the editor.

### launch.json Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Angular App",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Angular Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### How to Debug

1. Start the dev server: `ng serve`
2. Set breakpoints in your `.ts` files by clicking the gutter
3. Press **F5** or select **Debug Angular App** from the Run menu
4. Chrome opens, and VS Code pauses at your breakpoints

:::note
Source maps are enabled by default in development mode. Your breakpoints in TypeScript files will work correctly with no extra configuration.
:::

## ⌨️ Keyboard Shortcuts for Angular Development

Master these shortcuts to speed up your workflow:

| Shortcut (Mac / Win) | Action |
|---|---|
| `Cmd+Shift+P` / `Ctrl+Shift+P` | Command Palette |
| `Cmd+P` / `Ctrl+P` | Quick Open file |
| `Cmd+Shift+F` / `Ctrl+Shift+F` | Search across files |
| `F12` | Go to Definition |
| `Shift+F12` | Find All References |
| `F2` | Rename Symbol |
| `Cmd+.` / `Ctrl+.` | Quick Fix (auto-import, etc.) |
| `Cmd+Shift+O` / `Ctrl+Shift+O` | Go to Symbol in file |
| `Cmd+T` / `Ctrl+T` | Go to Symbol in workspace |
| `Alt+Shift+F` | Format document |
| `Cmd+D` / `Ctrl+D` | Select next occurrence |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | Select all occurrences |
| `Alt+Up/Down` | Move line up/down |
| `Cmd+/` / `Ctrl+/` | Toggle line comment |

:::tip
Use **Cmd+P** (Quick Open) and type `#` to search symbols across the workspace — great for finding components, services, or interfaces by name.
:::

## 🏢 Workspace vs User Settings

VS Code has two settings scopes:

- **User Settings** — Apply to all projects. Set your personal preferences here (font size, theme, keybindings).
- **Workspace Settings** — Saved in `.vscode/settings.json` inside the project. Set project-specific config here (formatter, linting rules, excluded files).

Workspace settings override user settings. Commit `.vscode/settings.json` to Git so team members share the same development experience.

### Recommended `.vscode/extensions.json`

Add a recommendations file so team members get prompted to install essential extensions:

```json
{
  "recommendations": [
    "Angular.ng-template",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "usernameheo.errorlens",
    "eamodio.gitlens"
  ]
}
```

## 📁 Multi-Root Workspaces for Monorepos

If you work with Angular monorepos (e.g., Nx workspaces), use multi-root workspaces:

1. Open the root folder containing multiple projects
2. Go to **File → Add Folder to Workspace…**
3. Save the workspace as a `.code-workspace` file:

```json
{
  "folders": [
    { "path": "apps/frontend", "name": "Frontend App" },
    { "path": "apps/admin", "name": "Admin App" },
    { "path": "libs/shared", "name": "Shared Library" }
  ],
  "settings": {
    "typescript.tsdk": "node_modules/typescript/lib"
  }
}
```

This gives each project its own file explorer root and lets you configure settings per folder.

:::tip
In a monorepo, point `typescript.tsdk` to the root `node_modules/typescript/lib` to ensure all projects use the same TypeScript version.
:::
