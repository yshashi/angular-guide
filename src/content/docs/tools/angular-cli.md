---
title: Angular CLI ⚙️
description: Master the Angular CLI for efficient project creation, development, and deployment
sidebar:
  order: 1
---

The Angular CLI (`@angular/cli`) is the official command-line tool for creating, developing, building, and maintaining Angular applications. It handles project scaffolding, code generation, development serving, production builds, testing, and much more — all with sensible defaults and powerful customization.

## 🎯 Installation

Install the Angular CLI globally using npm:

```bash
npm install -g @angular/cli
```

Verify the installation:

```bash
ng version
```

You should see output showing the Angular CLI version, Node.js version, and package manager:

```
Angular CLI: 21.0.0
Node: 22.12.0
Package Manager: npm 10.9.0
```

:::tip
You can also use `npx` to run CLI commands without a global install:
```bash
npx @angular/cli new my-app
```
:::

## 🚀 Creating a New Project

Use `ng new` to scaffold a complete Angular project:

```bash
ng new my-app
```

The CLI will prompt you for configuration options like stylesheet format and SSR. You can skip prompts with flags:

```bash
ng new my-app --style=scss --ssr=false --skip-tests
```

### Common `ng new` Options

| Flag | Description |
|------|-------------|
| `--style=scss\|css\|less` | Stylesheet preprocessor |
| `--ssr` | Enable server-side rendering |
| `--skip-tests` | Skip generating test files |
| `--skip-git` | Don't initialize a Git repository |
| `--prefix=app` | Component selector prefix |
| `--routing` | Add routing module |
| `--package-manager=npm\|yarn\|pnpm` | Package manager to use |
| `--dry-run` | Preview changes without writing files |

:::note
Angular 21 projects use **esbuild** as the default build system and **Vitest** as the default test runner. The older Webpack and Karma setups are no longer generated.
:::

## 🏗️ Code Generation Commands

The `ng generate` (or `ng g`) command scaffolds code using built-in schematics:

### Components

```bash
ng g component features/user-profile
```

This creates:

```
src/app/features/user-profile/
├── user-profile.component.ts
├── user-profile.component.html
├── user-profile.component.scss
└── user-profile.component.spec.ts
```

The generated component uses standalone and `OnPush` change detection by default:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {}
```

Useful generation flags:

```bash
ng g component shared/button --inline-template --inline-style
ng g component layout/header --skip-tests
ng g component features/dashboard --flat  # No subdirectory
```

### Services

```bash
ng g service core/services/auth
```

Generates a service with `providedIn: 'root'`:

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {}
```

### Other Schematics

```bash
ng g directive shared/directives/highlight
ng g pipe shared/pipes/truncate
ng g guard core/guards/auth
ng g interceptor core/interceptors/auth
ng g interface models/user
ng g enum models/role
ng g environments
```

:::tip
Always use `--dry-run` (or `-d`) to preview generated files before committing:
```bash
ng g component features/settings --dry-run
```
:::

## 🖥️ Development Server

Start the development server with:

```bash
ng serve
```

The app is available at `http://localhost:4200` with live reload enabled.

### Common `ng serve` Options

```bash
ng serve --port 3000              # Custom port
ng serve --open                   # Open browser automatically
ng serve --host 0.0.0.0           # Expose to network
ng serve --ssl                    # Enable HTTPS
ng serve --proxy-config proxy.conf.json  # API proxy
```

### Proxy Configuration

Create `proxy.conf.json` to proxy API requests during development:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    }
  }
}
```

Then serve with the proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

:::note
You can also set the proxy config in `angular.json` under `architect.serve.options.proxyConfig` to avoid passing the flag every time.
:::

## 📦 Building for Production

Build your application for production:

```bash
ng build
```

Angular 21 uses **esbuild** by default, producing highly optimized bundles. Output goes to `dist/my-app/`.

### Build Options

```bash
ng build --configuration=production   # Explicit production config
ng build --source-map                 # Include source maps
ng build --stats-json                 # Generate bundle stats
ng build --base-href /my-app/         # Set base href
ng build --output-hashing all         # Cache-busting filenames
```

### Analyzing Bundle Size

Generate a stats file and analyze it:

```bash
ng build --stats-json
npx esbuild-visualizer --metadata dist/my-app/stats.json --open
```

## 🧪 Testing with Vitest

Angular 21 uses **Vitest** as the default test runner:

```bash
ng test
```

### Test Options

```bash
ng test --watch              # Watch mode (default)
ng test --no-watch           # Single run
ng test --code-coverage      # Generate coverage report
ng test --browsers=ChromeHeadless  # Headless browser
```

## 📚 Adding Libraries

Use `ng add` to install and configure third-party libraries with their schematics:

```bash
ng add @angular/material
ng add @angular/pwa
ng add @angular-eslint/schematics
ng add @ngrx/store
```

The `ng add` command runs the library's schematic, which can modify `angular.json`, add imports, update styles, and more — beyond what `npm install` alone does.

## 🔄 Updating Angular

Keep Angular up to date with:

```bash
ng update
```

This shows available updates. To apply them:

```bash
ng update @angular/core @angular/cli
```

For major version updates, check the update guide first:

```bash
ng update @angular/core@21 @angular/cli@21
```

:::caution
Always commit or stash changes before running `ng update`. The command modifies files in place and runs migrations that transform your code.
:::

## ⚙️ Configuration — angular.json

The `angular.json` file is the central configuration for your Angular workspace. Key sections:

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          }
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "proxyConfig": "proxy.conf.json"
          }
        }
      }
    }
  }
}
```

### Key Configuration Areas

- **`budgets`** — Set size limits to catch bundle bloat early
- **`fileReplacements`** — Swap environment files per configuration
- **`assets`** — Static files copied to the build output
- **`styles` / `scripts`** — Global styles and scripts
- **`outputPath`** — Where built files are written

## 🏭 Custom Schematics (Brief Overview)

You can create reusable code generators for your team:

```bash
npm install -g @angular-devkit/schematics-cli
schematics blank --name=my-schematics
```

Custom schematics are useful for enforcing team patterns — generating feature modules with a consistent structure, creating boilerplate for state management, or scaffolding API service layers.

:::tip
See the [Schematics](/tools/schematics/) page for a deep dive into creating custom schematics.
:::

## 📋 CLI Command Reference

| Command | Description |
|---------|-------------|
| `ng new` | Create a new workspace |
| `ng generate` | Generate code from schematics |
| `ng serve` | Start dev server |
| `ng build` | Build for production |
| `ng test` | Run unit tests |
| `ng lint` | Run linter |
| `ng add` | Add a library with schematics |
| `ng update` | Update Angular packages |
| `ng deploy` | Deploy (with adapter) |
| `ng analytics` | Configure CLI analytics |
| `ng cache` | Manage CLI disk cache |
| `ng completion` | Set up shell autocompletion |

Run `ng help` or `ng <command> --help` for full documentation on any command.
