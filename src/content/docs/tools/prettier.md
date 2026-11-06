---
title: Prettier Code Formatting 🎨
description: How Prettier works in Angular 22 projects — the generated .prettierrc, Angular template formatting, automatic formatting by the CLI, editor, ESLint and CI setup.
sidebar:
  order: 6
---

Prettier is an opinionated code formatter: it re-prints your code in one consistent style, so nobody argues about spaces, quotes or line breaks again. Angular projects come with Prettier **already set up**, and the Angular CLI even uses it to format the files it generates.

## What you'll learn

- What `ng new` sets up for Prettier and why the `.prettierrc` has an Angular override
- How Prettier formats Angular templates, control flow and inline templates
- How the CLI formats generated and migrated files automatically
- How to format on save, combine Prettier with ESLint and check formatting in CI

## What a new project includes

Since Angular 21.2, `ng new` adds `prettier` as a dev dependency and creates this `.prettierrc`:

```json title=".prettierrc"
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

- `printWidth: 100` — wrap lines longer than 100 characters.
- `singleQuote: true` — `'single'` quotes in TypeScript, like Angular's own code.
- **The `*.html` → `angular` parser override is important.** Prettier only recognizes Angular templates automatically in files named `*.component.html`. With the 2025 file names (`user-card.html`), Prettier would treat your template as plain HTML and mangle control flow blocks.

See the difference on the same `user-card.html`:

```html
<!-- ✅ With the "angular" parser -->
<div>
  <span class="a">{{ name }}</span>
  @if (show) {
    <p>hi</p>
  }
</div>
```

```html
<!-- ❌ Without it (plain HTML parser) -->
<div>
  <span class="a">{{name}}</span> @if (show) {
  <p>hi</p>
  }
</div>
```

Everything else uses Prettier's defaults: 2-space indentation, semicolons, trailing commas, `"lf"` line endings.

:::note[Older projects]
Projects created before 21.2 may not have Prettier. Add it with `npm install --save-dev prettier` and copy the `.prettierrc` above.
:::

## What Prettier formats in an Angular app

| File | Formatted? |
|---|---|
| `*.ts` | Yes — including **inline `template` and `styles`** in `@Component` |
| `*.html` templates | Yes, with the `angular` parser (control flow, `@let`, bindings, pipes) |
| `*.css`, `*.scss`, `*.less` | Yes |
| `*.json`, `*.md`, `*.yml` | Yes |

Inline templates and styles are formatted too:

```ts title="before"
@Component({ selector: 'app-x', template: `<div><span   class="a">{{ name }}</span>   @if (show) {<p>hi</p>}</div>`, styles: `:host{display:block;color:red}` })
export class X { name = 'a'; show = true; }
```

```ts title="after: npx prettier --write x.ts"
@Component({
  selector: 'app-x',
  template: `<div>
    <span class="a">{{ name }}</span>
    @if (show) {
      <p>hi</p>
    }
  </div>`,
  styles: `
    :host {
      display: block;
      color: red;
    }
  `,
})
export class X {
  name = 'a';
  show = true;
}
```

## The CLI formats files for you

When `prettier` is installed in the workspace, the Angular CLI runs `prettier --write` on every file that a schematic **creates or modifies**:

- `ng generate …` (components, services, `ai-config` Markdown files, …)
- `ng add <package>` setup schematics
- `ng update` migrations

It uses your project's Prettier version, `.prettierrc` and `.prettierignore`, and skips file types Prettier doesn't know. If Prettier isn't installed, nothing is formatted — and if formatting fails, the CLI prints a warning but keeps the generated files. With `--dry-run` nothing is written or formatted.

That means generated code and migration diffs already match your style, so `ng update` pull requests stay small and readable.

## Format your code

Add scripts to `package.json`:

```json title="package.json"
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

```bash
npm run format          # format everything
npm run format:check    # list unformatted files, exit with an error if any (for CI)
npx prettier --write "src/**/*.{ts,html,scss}"   # only some files
```

### Ignore files

Prettier 3 already ignores `node_modules` and everything in your `.gitignore` (which already lists `/dist`, `/coverage` and `/.angular/cache` in new projects). Add a `.prettierignore` for anything else:

```text title=".prettierignore"
package-lock.json
public/vendor/
```

To skip one block of code, put `// prettier-ignore` (TypeScript) or `<!-- prettier-ignore -->` (HTML) right before it.

## Optional settings

Keep the config small — every option is a style debate. Two options people often add to Angular projects:

```json title=".prettierrc"
{
  "printWidth": 100,
  "singleQuote": true,
  "singleAttributePerLine": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

`singleAttributePerLine: true` puts each attribute on its own line once an element wraps, which makes template diffs easy to read:

```html
<app-user-card
  [user]="currentUser()"
  [showAvatar]="true"
  (selected)="onSelect($event)"
/>
```

:::caution[`htmlWhitespaceSensitivity: "ignore"`]
You'll see this option in many blog posts. It makes templates look tidier, but it lets Prettier add or remove whitespace between inline elements such as `<span>` and `<a>`, which can **change what users see**. Only use it if you accept that.
:::

Using Tailwind CSS? The community plugin `prettier-plugin-tailwindcss` sorts utility classes in a consistent order: install it and add `"plugins": ["prettier-plugin-tailwindcss"]` to `.prettierrc`.

## Format on save in VS Code

Install **Prettier – Code formatter** (`esbenp.prettier-vscode`) and add to `.vscode/settings.json`:

```json title=".vscode/settings.json"
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

The extension uses the Prettier version from your `node_modules` and your `.prettierrc`, so the editor, the CLI and CI all produce identical output. See [VS Code setup](/tools/vscode/).

## Prettier and ESLint

Use Prettier for **formatting** and ESLint for **code quality**. Turn off ESLint rules that would conflict with Prettier using `eslint-config-prettier`:

```bash
npm install --save-dev eslint-config-prettier
```

Add it as the **last** entry in `eslint.config.js` so it overrides everything before it:

```js title="eslint.config.js"
// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

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
    rules: {},
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier, // must be last
]);
```

Don't run Prettier *through* ESLint (`eslint-plugin-prettier`): it's slower and reports formatting as lint errors. Run them side by side instead. Setting up ESLint is covered in [ESLint for Angular](/tools/eslint/).

## Check formatting before commit and in CI

Format only the files you're committing with Husky + lint-staged:

```json title="package.json"
{
  "lint-staged": {
    "*.{ts,html,css,scss,json,md}": "prettier --write"
  }
}
```

The full setup is in [Git hooks](/tools/git-hooks/). In CI, fail the build on unformatted code:

```yaml title=".github/workflows/format.yml"
name: Format
on: [pull_request]

jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx prettier --check .
```

## Common mistakes

- **Removing the `angular` parser override** → control flow in `*.html` gets formatted as text.
- **Different Prettier versions** on different machines → keep it in `devDependencies` and use `npx prettier`, never a global install.
- **Two formatters in the editor** (e.g. the built-in HTML formatter) → set `editor.defaultFormatter`.
- **Formatting rules in ESLint** → add `eslint-config-prettier` last.
- **Reformatting the whole repo in a feature PR** → do a separate "format only" commit.

## Key takeaways

- New Angular projects include Prettier and a `.prettierrc` with an `angular` parser override for `*.html`.
- Prettier formats templates (including `@if`/`@for`), inline templates/styles, styles, JSON and Markdown.
- The CLI formats files touched by `ng generate`, `ng add` and `ng update` automatically.
- Format on save locally, check with `prettier --check` in CI, and let ESLint focus on code quality.

## Next steps

- [ESLint for Angular](/tools/eslint/) — code-quality rules
- [Git hooks](/tools/git-hooks/) — format staged files automatically
- [VS Code setup](/tools/vscode/) — editor configuration
