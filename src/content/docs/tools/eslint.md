---
title: ESLint for Angular 📐
description: Add angular-eslint to an Angular 22 project with ng add, understand the flat eslint.config.js, enable modern Angular rules and run ng lint locally and in CI.
sidebar:
  order: 5
---

ESLint finds bugs and enforces conventions in your TypeScript **and** your Angular templates. Angular projects use **angular-eslint**, a community project that works closely with the Angular team: it adds Angular-specific rules (selectors, signals, control flow, accessibility…) on top of ESLint and typescript-eslint.

## What you'll learn

- How to add ESLint to an Angular 22 project with one command
- What the generated flat config (`eslint.config.js`) means
- Which rules are on by default and which modern Angular rules to add
- How to run `ng lint`, auto-fix problems and lint in CI

:::note[Not included by default]
`ng new` doesn't add a linter. Add it with `ng add angular-eslint` — or just run `ng lint`, and the CLI offers to install it for you.
:::

## Set up with `ng add`

```bash
ng add angular-eslint
```

At the time of writing this installs **angular-eslint 22.x**, **ESLint 10** and **typescript-eslint 8**. The schematic:

1. Adds the dev dependencies `angular-eslint`, `eslint`, `@eslint/js` and `typescript-eslint`.
2. Creates `eslint.config.js` (ESLint "flat config" — the only format ESLint 10 supports).
3. Adds a `lint` target to `angular.json`:

   ```json title="angular.json"
   "lint": {
     "builder": "@angular-eslint/builder:lint",
     "options": {
       "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
     }
   }
   ```

4. Adds `"schematicCollections": ["angular-eslint"]` under `cli` in `angular.json`. The angular-eslint collection extends the normal Angular schematics, so `ng g component` keeps working, and `ng g application` / `ng g library` also wire up ESLint for new projects.

Choose a stricter typescript-eslint preset up front if you like:

```bash
ng add angular-eslint --tseslint-preset=strict
# recommended (default) | strict | recommendedTypeChecked | strictTypeChecked
```

The `*TypeChecked` presets enable **type-aware linting** (more powerful, slower).

## The generated `eslint.config.js`

```js title="eslint.config.js"
// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
```

How to read it:

| Part | Meaning |
|---|---|
| `defineConfig([...])` | ESLint's helper for typed flat configs. Each object applies to the files in its `files` glob. |
| First block (`**/*.ts`) | JavaScript + TypeScript + Angular TypeScript rules for your classes. |
| `processor: angular.processInlineTemplates` | Extracts inline `template: \`…\`` strings so the HTML rules also check them. |
| Second block (`**/*.html`) | Angular template rules, including accessibility rules. |
| `directive-selector` / `component-selector` | Enforce your `app` prefix: `appHighlight`, `<app-user-card>`. |

The file uses `require()` because Angular projects' `package.json` is not `"type": "module"`. If yours is, the schematic writes `import`/`export default` instead (you can also rename the file to `eslint.config.mjs`).

## What the recommended configs check

**`angular.configs.tsRecommended`** (errors unless noted):

- `prefer-standalone`, `prefer-inject` (use `inject()` instead of constructor parameters)
- `prefer-on-push-component-change-detection` — reports components that **opt out** of OnPush (`ChangeDetectionStrategy.Eager` or the deprecated `Default`). Leaving `changeDetection` out is fine, because OnPush is the default since v22.
- `no-input-rename`, `no-output-rename`, `no-output-native`, `no-output-on-prefix`, `no-inputs-metadata-property`, `no-outputs-metadata-property`
- `contextual-lifecycle`, `no-empty-lifecycle-method`, `use-pipe-transform-interface`, `use-lifecycle-interface` (warning)

**`angular.configs.templateRecommended`**: `prefer-control-flow` (no `*ngIf`/`*ngFor`), `banana-in-box` (`([x])` → `[(x)]`), `eqeqeq`, `no-negated-async`.

**`angular.configs.templateAccessibility`**: `alt-text`, `elements-content`, `label-has-associated-control`, `click-events-have-key-events`, `mouse-events-have-key-events`, `interactive-supports-focus`, `no-autofocus`, `no-distracting-elements`, `role-has-required-aria`, `table-scope`, `valid-aria`.

## Rules worth adding for modern Angular

```js title="eslint.config.js (excerpt)"
{
  files: ['**/*.ts'],
  // ...
  rules: {
    // ...selector rules from above
    '@angular-eslint/prefer-service-decorator': 'error',      // @Service() over @Injectable({ providedIn: 'root' })
    '@angular-eslint/prefer-host-metadata-property': 'error', // host: {} over @HostBinding/@HostListener
    '@angular-eslint/prefer-output-readonly': 'error',
    '@angular-eslint/computed-must-return': 'error',
    '@angular-eslint/no-implicit-take-until-destroyed': 'error',
    '@angular-eslint/sort-lifecycle-methods': 'warn',
  },
},
{
  files: ['**/*.html'],
  // ...
  rules: {
    '@angular-eslint/template/prefer-self-closing-tags': 'warn', // <app-card />
    '@angular-eslint/template/prefer-class-binding': 'warn',     // [class.x] over ngClass
    '@angular-eslint/template/prefer-style-binding': 'warn',     // [style.x] over ngStyle
    '@angular-eslint/template/prefer-ngsrc': 'warn',             // NgOptimizedImage
    '@angular-eslint/template/prefer-at-empty': 'warn',          // @for … @empty
    '@angular-eslint/template/button-has-type': 'warn',
  },
},
```

### Type-aware rules (signals)

Some of the most useful signal rules need TypeScript type information:

- `@angular-eslint/no-uncalled-signals` — catches `if (this.isLoggedIn)` where you meant `this.isLoggedIn()`.
- `@angular-eslint/prefer-signals` — prefer `input()`, `viewChild()`, … over decorators, and `readonly` signals.
- `@angular-eslint/reactive-context-must-read-signal` — a `computed()`/`effect()` that reads no signal is probably a bug.
- `@angular-eslint/prefer-signal-model` — use `model()` instead of an `input` + `output` pair.
- `@angular-eslint/no-developer-preview`, `@angular-eslint/no-experimental` — flag non-stable Angular APIs.

Enable type information in the TypeScript block, then turn the rules on:

```js title="eslint.config.js (excerpt)"
{
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: { projectService: true },
  },
  // ...
  rules: {
    '@angular-eslint/no-uncalled-signals': 'error',
    '@angular-eslint/prefer-signals': 'error',
    '@angular-eslint/reactive-context-must-read-signal': 'error',
  },
},
```

### Restrict imports

Block deprecated APIs with ESLint's built-in `no-restricted-imports` rule:

```js
'no-restricted-imports': ['error', {
  paths: [
    { name: '@angular/animations', message: 'Use native CSS with animate.enter / animate.leave.' },
    {
      name: '@angular/common/http',
      importNames: ['HttpClientModule'],
      message: 'Use provideHttpClient() in app.config.ts.',
    },
  ],
}],
```

## Run the linter

```bash
ng lint                    # lint every project that has a lint target
ng lint --fix              # apply automatic fixes
ng lint my-app             # one project
```

```text
src/app/core/user-api.ts
  3:1  error  Use the `@Service()` decorator instead of `@Injectable({ providedIn: 'root' })`  @angular-eslint/prefer-service-decorator

src/app/user/user-card.html
  1:7  error  Use built-in control flow instead of directive ngIf  @angular-eslint/template/prefer-control-flow

✖ 2 problems (2 errors, 0 warnings)
```

Useful builder options (also settable under `lint.options` in `angular.json`):

| Option | Purpose |
|---|---|
| `--fix` | Apply fixes for auto-fixable rules. |
| `--cache` | Only re-lint changed files (much faster locally). |
| `--max-warnings 0` | Fail when there are warnings (strict CI). |
| `--quiet` | Report errors only. |
| `--format json` + `--output-file lint.json` | Machine-readable reports. |
| `--lint-file-patterns "src/app/features/**/*.ts"` | Lint only some files. |

You can also call ESLint directly — handy for editors and Git hooks: `npx eslint src/app/cart`.

:::caution
Review auto-fixes before committing. Most are safe (formatting of templates, `prefer-self-closing-tags`), but a fix can still change behaviour in rare cases.
:::

## Disable a rule locally

```ts
// eslint-disable-next-line @angular-eslint/prefer-inject -- third-party base class needs constructor DI
constructor(private readonly legacy: LegacyService) {}
```

```html
<!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
<div (click)="close()" class="backdrop"></div>
```

Always add a reason after `--`. If you disable a rule often, change the config instead.

## ESLint and Prettier together

Let Prettier handle formatting and ESLint handle code quality. Add `eslint-config-prettier` as the **last** config entry to turn off any ESLint rules that would fight Prettier — see [Prettier](/tools/prettier/#prettier-and-eslint).

## Lint in CI

```yaml title=".github/workflows/lint.yml"
name: Lint
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx ng lint --max-warnings 0
```

For linting only staged files before each commit, see [Git hooks](/tools/git-hooks/).

## Editor integration

Install the **ESLint** extension (`dbaeumer.vscode-eslint`) and add `"eslint.validate": ["typescript", "html"]` so template problems appear while you type. See [VS Code setup](/tools/vscode/#recommended-workspace-settings).

## Common mistakes

- **Using `.eslintrc.json` examples** from old blog posts. ESLint 10 only reads `eslint.config.*` (flat config).
- **Spreading configs** (`...angular.configs.tsRecommended`) inside `extends` — not needed with `defineConfig`; pass them directly.
- **Adding `changeDetection: OnPush` everywhere** to satisfy the old rule — in v22 it's the default, and the rule only reports opting out.
- **Enabling type-aware rules without `projectService`** — ESLint will throw "You have used a rule which requires type information".
- **Linting `dist/` or `.angular/`** — keep `lintFilePatterns` pointed at `src/`.

## Key takeaways

- `ng add angular-eslint` sets up ESLint 10 flat config, the `ng lint` target and the right schematics.
- The recommended configs already enforce standalone, `inject()`, OnPush, control flow and accessibility.
- Add signal-aware rules with `projectService: true` for the best Angular 22 feedback.
- Run `ng lint --max-warnings 0` in CI and ESLint on staged files in a pre-commit hook.

## Next steps

- [Prettier](/tools/prettier/) — automatic formatting
- [Git hooks](/tools/git-hooks/) — lint staged files before commit
- [Best practices](/resources/best-practices/) — the conventions these rules enforce
