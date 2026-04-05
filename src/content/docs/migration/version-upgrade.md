---
title: Version Upgrade Guide 🔄
description: Step-by-step guide for upgrading between Angular versions
sidebar:
  order: 1
---

Keeping your Angular application up-to-date ensures you benefit from performance improvements, security patches, and modern APIs. This guide walks you through a reliable, repeatable process for upgrading between Angular major versions — from preparation to verification.

## 🎯 The Golden Rule

Angular supports upgrading **one major version at a time**. If you're on v17 and want to reach v21, you must go through v17 → v18 → v19 → v20 → v21 sequentially. Skipping versions is not supported and will likely break your application.

:::caution
Never attempt to skip major versions. Each major release includes migration schematics that expect the previous version's code structure. Skipping versions means those schematics won't run correctly.
:::

## 📋 Pre-Upgrade Checklist

Before running any upgrade commands, complete this checklist:

1. **Commit all changes** — start from a clean git state
2. **Run your test suite** — ensure all tests pass before upgrading
3. **Check third-party dependencies** — verify they support the target Angular version
4. **Review the changelog** — read the breaking changes for your target version
5. **Back up `package.json` and `package-lock.json`** — in case you need to rollback
6. **Check Node.js version** — each Angular version has minimum Node.js requirements

```bash
# Verify clean git state
git status

# Run existing tests
ng test --watch=false
ng build

# Check current versions
ng version
node --version
npm --version
```

## 🔧 Using update.angular.dev

The official [Angular Update Guide](https://update.angular.dev/) is your best friend. Select your current version, target version, and app complexity to get a customized migration checklist.

:::tip
Bookmark [update.angular.dev](https://update.angular.dev/) — it's maintained by the Angular team and always reflects the latest migration requirements.
:::

## ⚡ Step-by-Step Upgrade Process

### Step 1: Update Angular CLI and Core

Always update `@angular/cli` and `@angular/core` together using `ng update`:

```bash
# Update the Angular CLI first
ng update @angular/cli @angular/core
```

The `ng update` command does three things:
- Updates package versions in `package.json`
- Runs `npm install` to fetch new packages
- Executes **migration schematics** that automatically update your code

### Step 2: Update Additional Angular Packages

```bash
# Update Angular Material (if used)
ng update @angular/material

# Update Angular CDK
ng update @angular/cdk
```

### Step 3: Update Third-Party Libraries

```bash
# Check for outdated packages
npm outdated

# Update RxJS (if needed)
npm install rxjs@latest

# Update other libraries one at a time
npm install <package>@latest
```

### Step 4: Verify the Upgrade

```bash
# Build the application
ng build

# Run all tests
ng test --watch=false

# Run e2e tests if available
ng e2e

# Start the dev server and manually verify
ng serve
```

## 🚀 Version-by-Version Highlights

### Angular 17 → 18

Key changes in Angular 18:
- **Zoneless change detection (experimental)** — opt-in with `provideZonelessChangeDetection()`
- **Stable signal APIs** — `input()`, `output()`, `model()`, `viewChild()`, `contentChild()`
- **Route redirects with functions** — `redirectTo` accepts a function
- **Material 3 stable** — Angular Material components use M3 by default

```typescript
// v18: Function-based redirect
const routes: Routes = [
  {
    path: 'old-path',
    redirectTo: ({ queryParams }) => {
      const id = queryParams['id'];
      return id ? `/new-path/${id}` : '/new-path';
    },
  },
];
```

### Angular 18 → 19

Key changes in Angular 19:
- **Standalone is the default** — no need to set `standalone: true`
- **`linkedSignal()`** — reactive state derived from other signals with reset capability
- **`resource()` API (experimental)** — declarative async data loading
- **Incremental hydration** — `@defer` blocks work with SSR hydration
- **Strict unused imports** — compiler flags unused imports in templates

```typescript
// v19: linkedSignal for derived state with reset
import { signal, linkedSignal } from '@angular/core';

const items = signal(['apple', 'banana', 'cherry']);
const selectedItem = linkedSignal(() => items()[0]); // resets when items change
```

### Angular 19 → 20

Key changes in Angular 20:
- **Zoneless by default** — new projects no longer include zone.js
- **Stable `resource()` and `rxResource()`** — declarative data fetching
- **`httpResource()`** — HTTP-specific resource API
- **Signal-based forms (experimental)** — reactive forms with signals
- **`outputToObservable()` / `outputFromObservable()`** — bridge output signals and RxJS

```typescript
// v20: httpResource for declarative HTTP
import { httpResource } from '@angular/common/http';

const usersResource = httpResource<User[]>({
  url: '/api/users',
});
```

### Angular 20 → 21

Key changes in Angular 21:
- **Stable signal-based forms** — `FormSignal`, `FormSignalGroup`
- **Enhanced `effect()` scheduling** — improved effect timing
- **Improved `@let` syntax** — template local variables with more flexibility
- **Build performance improvements** — faster rebuilds with esbuild optimizations

```typescript
// v21: Stable signal-based forms
import { FormSignal, FormSignalGroup } from '@angular/forms';

const name = new FormSignal('');
const email = new FormSignal('');
const form = new FormSignalGroup({ name, email });
```

## 🛠️ Automated Migration Schematics

Angular ships migration schematics that automatically transform your code during `ng update`. Here are some commonly encountered ones:

```bash
# See what schematics are available without running them
ng update @angular/core --dry-run

# Force re-run schematics if they failed
ng update @angular/core --migrate-only

# Run a specific schematic
ng generate @angular/core:control-flow
ng generate @angular/core:standalone
ng generate @angular/core:inject
ng generate @angular/core:signal-input
ng generate @angular/core:signal-queries
ng generate @angular/core:output
```

:::tip
Always run `ng update` with `--dry-run` first to preview what changes will be made. This helps you understand the scope of the migration before committing to it.
:::

## 📦 Handling Third-Party Compatibility

Third-party libraries often lag behind Angular releases. Here's how to handle compatibility issues:

### Check Peer Dependency Warnings

```bash
# Install with legacy peer deps if needed temporarily
npm install --legacy-peer-deps

# Or force the install (less safe)
npm install --force
```

### Common Library Compatibility Checklist

| Library | Check URL |
|---------|-----------|
| Angular Material | github.com/angular/components |
| NgRx | ngrx.io |
| PrimeNG | primeng.org |
| Transloco | github.com/jsverse/transloco |
| Angular Fire | github.com/angular/angularfire |

### Temporary Version Pinning

If a library hasn't updated yet, pin it to the last working version:

```json
{
  "overrides": {
    "some-angular-library": {
      "@angular/core": "$@angular/core"
    }
  }
}
```

:::caution
Using `overrides` or `--legacy-peer-deps` is a temporary workaround. Always update to properly compatible versions as soon as they're available.
:::

## 🔍 Troubleshooting Failed Upgrades

### Problem: `ng update` Fails Mid-Migration

```bash
# Reset to pre-upgrade state
git checkout .
npm install

# Try again with verbose logging
ng update @angular/core --verbose
```

### Problem: Build Errors After Upgrade

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .angular/cache

# Reinstall dependencies from scratch
rm -rf node_modules package-lock.json
npm install

# Rebuild
ng build
```

### Problem: TypeScript Version Mismatch

Each Angular version requires a specific TypeScript range. If you see TS version errors:

```bash
# Check required TS version in Angular's package.json
npm info @angular/compiler-cli peerDependencies

# Install the correct TypeScript version
npm install typescript@<required-version>
```

### Problem: RxJS Compatibility Issues

```bash
# Check which RxJS version is needed
npm info @angular/core peerDependencies

# Install compatible RxJS
npm install rxjs@<compatible-version>
```

## ✅ Post-Upgrade Verification Checklist

After every upgrade, walk through this checklist:

- [ ] `ng build` completes without errors
- [ ] `ng build --configuration production` succeeds (AOT compilation)
- [ ] All unit tests pass (`ng test --watch=false`)
- [ ] All e2e tests pass
- [ ] Application starts and renders correctly
- [ ] Core user flows work end-to-end
- [ ] No new console warnings or deprecation notices
- [ ] Bundle sizes are comparable to pre-upgrade (check with `source-map-explorer`)
- [ ] Performance is on par (run Lighthouse before and after)

:::note
Keep a record of upgrade dates and version numbers. This makes future upgrades easier to plan and helps trace any subtle regressions that appear later.
:::

## 🗓️ Planning Your Upgrade Cadence

Angular releases a new major version roughly every 6 months. Each major version is actively supported for 18 months (6 months active + 12 months LTS). A healthy upgrade cadence is:

- **Stay within 1 major version of latest** for best community support
- **Upgrade within 1 month of a new release** if your test coverage is solid
- **Budget 1–3 days per major version** for the upgrade itself
- **Schedule upgrades after the first patch release** (e.g., v21.0.1) for stability
