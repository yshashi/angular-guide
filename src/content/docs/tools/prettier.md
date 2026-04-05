---
title: Prettier Code Formatting 🎨
description: Set up Prettier for consistent code formatting in Angular projects
sidebar:
  order: 6
---

Prettier is an opinionated code formatter that enforces a consistent style by parsing your code and reprinting it. Unlike ESLint, which focuses on code quality rules, Prettier handles purely stylistic concerns — indentation, quotes, semicolons, line length, and more. Together, they ensure your Angular codebase is both high-quality and consistently formatted.

## 🎯 Installation

Install Prettier as a dev dependency:

```bash
npm install --save-dev prettier
```

Verify the installation:

```bash
npx prettier --version
```

## ⚙️ Configuration

Create a `.prettierrc` file in your project root with Angular-friendly settings:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "htmlWhitespaceSensitivity": "ignore",
  "singleAttributePerLine": true
}
```

### Configuration Options Explained

| Option | Value | Why |
|--------|-------|-----|
| `semi` | `true` | Consistent semicolons in TypeScript |
| `singleQuote` | `true` | Angular style guide preference |
| `trailingComma` | `"all"` | Cleaner git diffs |
| `printWidth` | `100` | Reasonable line length for modern screens |
| `tabWidth` | `2` | Standard Angular indentation |
| `htmlWhitespaceSensitivity` | `"ignore"` | Better formatting for Angular templates |
| `singleAttributePerLine` | `true` | Readable component templates |

:::tip
You can also use `.prettierrc.js`, `.prettierrc.yml`, or a `prettier` key in `package.json`. The JSON format is simplest for most projects.
:::

## 🔗 Integration with ESLint

Prettier and ESLint can conflict — ESLint may report formatting issues that Prettier handles. Use `eslint-config-prettier` to disable conflicting ESLint rules:

```bash
npm install --save-dev eslint-config-prettier
```

Then add it to your `eslint.config.js`:

```javascript
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettier,  // Must be last to override other configs
    ],
    processor: angular.processInlineTemplates,
    rules: {},
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      prettier,
    ],
    rules: {},
  },
);
```

:::caution
`eslint-config-prettier` must be the **last** entry in the `extends` array. It disables all ESLint rules that conflict with Prettier, so placing it earlier would allow later configs to re-enable conflicting rules.
:::

## 💻 VS Code Integration

### Format on Save

Install the **Prettier — Code Formatter** extension (`esbenp.prettier-vscode`), then add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Now every time you save a file, Prettier formats it automatically.

### Format Manually

- **Format document**: `Alt+Shift+F` (Windows/Linux) or `Shift+Option+F` (Mac)
- **Format selection**: Select text, then use the same shortcut

## 🪝 Pre-Commit Hooks with Prettier

Ensure all committed code is formatted by running Prettier as a pre-commit hook. This catches unformatted code even if a developer's editor isn't configured.

### Setup with lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,html,scss,json,md}": "prettier --write"
  }
}
```

Update the Husky pre-commit hook (`.husky/pre-commit`):

```bash
npx lint-staged
```

Now Prettier runs on every staged file before each commit.

:::tip
See the [Git Hooks & Automation](/tools/git-hooks/) page for the complete Husky + lint-staged setup guide.
:::

## 📄 HTML Template Formatting

Angular templates have unique formatting needs. Prettier handles `.html` files well, but there are some considerations:

### `htmlWhitespaceSensitivity`

Set this to `"ignore"` in your Prettier config to get cleaner template formatting:

```json
{
  "htmlWhitespaceSensitivity": "ignore"
}
```

**With `"css"` (default):**

```html
<span>{{ user.name }}</span
><span>{{ user.email }}</span>
```

**With `"ignore"`:**

```html
<span>{{ user.name }}</span>
<span>{{ user.email }}</span>
```

### Single Attribute Per Line

With `singleAttributePerLine: true`, component elements stay readable:

```html
<!-- Before -->
<app-user-card [user]="currentUser()" [showAvatar]="true" (selected)="onSelect($event)"></app-user-card>

<!-- After -->
<app-user-card
  [user]="currentUser()"
  [showAvatar]="true"
  (selected)="onSelect($event)"
/>
```

## 🚫 Ignoring Files

Create a `.prettierignore` file to exclude files from formatting:

```
# Build output
dist/
coverage/

# Dependencies
node_modules/

# Auto-generated files
package-lock.json

# Angular cache
.angular/

# Specific files
src/assets/**
*.min.js
*.min.css
```

:::note
Prettier automatically respects `.gitignore`. Files listed in `.gitignore` are also ignored by Prettier unless you use `--ignore-path` to specify a different file.
:::

## ▶️ Running Prettier from CLI

### Check for Unformatted Files

```bash
npx prettier --check .
```

This reports files that need formatting without modifying them — perfect for CI:

```
Checking formatting...
src/app/user/user.component.ts
src/app/shared/button/button.component.html
All matched files use Prettier code style!
```

### Format All Files

```bash
npx prettier --write .
```

### Format Specific Files

```bash
npx prettier --write "src/**/*.ts"
npx prettier --write "src/**/*.html"
npx prettier --write "src/**/*.scss"
```

### Add Scripts to package.json

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## 🔄 CI/CD Integration

Add a formatting check to your CI pipeline:

```yaml
name: Format Check
on: [pull_request]

jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx prettier --check .
```

## 📋 Recommended Complete Config

Here's a complete `.prettierrc` optimized for Angular projects:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "htmlWhitespaceSensitivity": "ignore",
  "singleAttributePerLine": true
}
```

Pair this with the ESLint integration and pre-commit hook described above for a fully automated formatting pipeline that keeps your entire Angular codebase consistent.
