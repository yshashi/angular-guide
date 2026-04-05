---
title: ESLint for Angular 📐
description: Configure ESLint for consistent and error-free Angular code
sidebar:
  order: 5
---

ESLint is the standard linting tool for Angular projects. It catches bugs, enforces coding standards, and helps maintain consistency across your codebase. Angular has an official ESLint integration — **angular-eslint** — that provides Angular-specific rules for both TypeScript and HTML templates.

## 🎯 Setup with angular-eslint

The easiest way to add ESLint to an Angular project is with the `ng add` schematic:

```bash
ng add @angular-eslint/schematics
```

This command:

1. Installs `eslint`, `@angular-eslint/*`, and `typescript-eslint` packages
2. Creates an `eslint.config.js` file with Angular-recommended rules
3. Adds a `lint` target to `angular.json` so you can run `ng lint`

:::note
Angular 21 projects use ESLint **flat config** (`eslint.config.js`) by default. The legacy `.eslintrc.json` format is no longer generated.
:::

## ⚙️ Configuration (Flat Config)

After setup, your `eslint.config.js` looks like this:

```javascript
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
```

### Configuration Breakdown

- **`files: ['**/*.ts']`** — Apply TypeScript rules to all `.ts` files
- **`processInlineTemplates`** — Lint inline templates in `@Component({ template })` strings
- **`files: ['**/*.html']`** — Apply template rules to all `.html` files
- **`templateAccessibility`** — Enables accessibility-focused rules for templates

## 📏 Recommended Rules for Angular

### TypeScript Rules

Add these rules to the TypeScript config section for stricter Angular code:

```javascript
rules: {
  // Enforce consistent component architecture
  '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
  '@angular-eslint/no-empty-lifecycle-method': 'error',
  '@angular-eslint/use-lifecycle-interface': 'error',
  '@angular-eslint/relative-url-prefix': 'error',
  '@angular-eslint/sort-lifecycle-methods': 'warn',

  // TypeScript best practices
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
  }],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/prefer-readonly': 'warn',

  // General best practices
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  'no-var': 'error',
}
```

### Template Rules

Add these to the HTML config section:

```javascript
rules: {
  // Accessibility
  '@angular-eslint/template/alt-text': 'error',
  '@angular-eslint/template/elements-content': 'error',
  '@angular-eslint/template/label-has-associated-control': 'error',
  '@angular-eslint/template/click-events-have-key-events': 'warn',
  '@angular-eslint/template/no-autofocus': 'warn',

  // Best practices
  '@angular-eslint/template/no-negated-async': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error',
  '@angular-eslint/template/use-track-by-function': 'warn',
  '@angular-eslint/template/prefer-self-closing-tags': 'warn',
}
```

## 🛡️ Custom Rules for Enforcing Patterns

You can create custom rules to enforce your team's Angular conventions.

### Enforce OnPush Change Detection

```javascript
'@angular-eslint/prefer-on-push-component-change-detection': 'error',
```

This reports an error on any component that doesn't explicitly set `ChangeDetectionStrategy.OnPush`.

### Enforce inject() Over Constructor Injection

Use the `@angular-eslint/prefer-standalone` rule and the TypeScript ESLint ecosystem to enforce modern patterns:

```javascript
rules: {
  // Ban constructor parameter injection in favor of inject()
  '@angular-eslint/prefer-standalone': 'error',
}
```

### Restrict Specific Imports

Prevent importing from deprecated or internal paths:

```javascript
'no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['@angular/common/http/testing'],
      message: 'Use provideHttpClientTesting() from @angular/common/http instead.',
    },
  ],
}],
```

## ▶️ Running the Linter

### Basic Usage

```bash
ng lint
```

This lints all files in the project and reports errors:

```
/src/app/user/user.component.ts
  12:3  error  Component should use ChangeDetectionStrategy.OnPush
        @angular-eslint/prefer-on-push-component-change-detection
  25:7  warning  Unexpected console statement    no-console

✖ 2 problems (1 error, 1 warning)
```

### Lint Specific Files

```bash
ng lint --lint-file-patterns="src/app/features/**/*.ts"
```

### Fix Issues Automatically

Many ESLint rules support auto-fixing:

```bash
ng lint --fix
```

This automatically fixes issues like:

- Sorting imports
- Adding missing semicolons
- Converting `var` to `const`/`let`
- Removing unused imports
- Adding self-closing tags in templates

:::caution
Always review auto-fixed changes before committing. Some fixes may alter behavior in unexpected ways.
:::

## 🔄 Integration with CI/CD

Add linting to your CI pipeline to catch issues before merging:

### GitHub Actions Example

```yaml
name: Lint
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx ng lint
```

### Pre-Commit Hook

Lint only staged files before each commit using `lint-staged`:

```json
{
  "lint-staged": {
    "*.{ts,html}": "eslint --fix"
  }
}
```

:::tip
See the [Git Hooks & Automation](/tools/git-hooks/) page for a complete Husky + lint-staged setup.
:::

## 🧩 Common Rules to Enable/Customize

Here's a quick reference of commonly adjusted rules:

| Rule | Default | Recommended |
|------|---------|-------------|
| `@angular-eslint/prefer-on-push-component-change-detection` | off | `warn` or `error` |
| `@angular-eslint/template/prefer-self-closing-tags` | off | `warn` |
| `@angular-eslint/use-lifecycle-interface` | off | `error` |
| `@typescript-eslint/no-explicit-any` | `warn` | `error` for strict teams |
| `@typescript-eslint/no-unused-vars` | off | `error` with `argsIgnorePattern` |
| `no-console` | off | `warn` (allow `warn`/`error`) |
| `@angular-eslint/template/alt-text` | off | `error` |
| `@angular-eslint/template/click-events-have-key-events` | off | `warn` |

## 🚫 Disabling Rules When Needed

Sometimes you need to suppress a rule for a specific case:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyData: any = getLegacyData();
```

For an entire file:

```typescript
/* eslint-disable no-console */
// This file intentionally uses console for logging
```

:::caution
Use `eslint-disable` comments sparingly. If you find yourself disabling a rule frequently, consider adjusting the rule configuration instead.
:::
