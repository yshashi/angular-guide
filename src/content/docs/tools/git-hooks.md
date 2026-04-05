---
title: Git Hooks & Automation 🪝
description: Automate code quality checks with Git hooks in Angular projects
sidebar:
  order: 8
---

Git hooks are scripts that run automatically at specific points in your Git workflow — before a commit, before a push, or after a merge. By combining Git hooks with tools like Husky, lint-staged, and commitlint, you can automate code quality enforcement so that every commit is linted, formatted, and follows your team's conventions.

## 🎯 What Are Git Hooks?

Git hooks are scripts stored in the `.git/hooks/` directory of a repository. They run automatically when triggered by Git operations:

| Hook | Trigger | Common Use |
|------|---------|-----------|
| `pre-commit` | Before a commit is created | Lint and format staged files |
| `commit-msg` | After commit message is entered | Validate commit message format |
| `pre-push` | Before pushing to remote | Run tests |
| `post-merge` | After a merge completes | Run `npm install` |
| `post-checkout` | After switching branches | Run `npm install` |

The challenge is that `.git/hooks/` is not tracked by Git, so sharing hooks across a team requires a tool like **Husky**.

## 🐶 Husky Setup

Husky makes Git hooks easy to manage and share with your team.

### Initialize Husky

```bash
npx husky init
```

This command:

1. Installs `husky` as a dev dependency
2. Creates a `.husky/` directory
3. Adds a `prepare` script to `package.json` that runs `husky` on `npm install`
4. Creates a sample `pre-commit` hook

Your `package.json` now includes:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

:::note
The `prepare` script runs automatically after `npm install`, so new team members get hooks set up automatically when they clone and install the project.
:::

## 🔍 Pre-Commit Hooks with lint-staged

Running linters on your entire codebase before every commit is slow. **lint-staged** solves this by running tools only on files that are staged for commit.

### Install lint-staged

```bash
npm install --save-dev lint-staged
```

### Configure lint-staged

Add the configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,html}": [
      "eslint --fix"
    ],
    "*.{ts,html,scss,json,md}": [
      "prettier --write"
    ]
  }
}
```

### Update the Pre-Commit Hook

Edit `.husky/pre-commit`:

```bash
npx lint-staged
```

Now when you run `git commit`:

1. lint-staged identifies files staged for commit
2. ESLint runs on `.ts` and `.html` files with auto-fix
3. Prettier formats all supported file types
4. If any tool reports an unfixable error, the commit is aborted
5. Fixed files are automatically re-staged

### Example Workflow

```bash
# Stage your changes
git add src/app/user/user.component.ts

# Commit — lint-staged runs automatically
git commit -m "feat: add user component"

# Output:
# ✔ Preparing lint-staged...
# ✔ Running tasks for staged files...
#   ✔ *.{ts,html} — eslint --fix
#   ✔ *.{ts,html,scss,json,md} — prettier --write
# ✔ Applying modifications from tasks...
# ✔ Cleaning up...
# [main abc1234] feat: add user component
```

## 📝 Commit Message Conventions

Consistent commit messages make your Git history readable and enable automated changelogs.

### Conventional Commits

The [Conventional Commits](https://www.conventionalcommits.org/) specification defines a standard format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Other changes (tooling, etc.) |

**Examples:**

```bash
feat(auth): add login with Google OAuth
fix(user-profile): prevent crash when avatar URL is null
docs(readme): update installation instructions
refactor(api): replace callbacks with async/await
perf(dashboard): lazy load chart library
```

## ✅ commitlint Setup

**commitlint** validates commit messages against the Conventional Commits format.

### Install commitlint

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Configure commitlint

Create `commitlint.config.js` in your project root:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor',
        'perf', 'test', 'build', 'ci', 'chore', 'revert',
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
```

### Add the commit-msg Hook

Create the hook file `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit $1
```

### How It Works

```bash
# ❌ Rejected — no type prefix
git commit -m "add login feature"
# ⧗ input: add login feature
# ✖ subject may not be empty [subject-empty]
# ✖ type may not be empty [type-empty]

# ❌ Rejected — wrong type
git commit -m "feature: add login"
# ✖ type must be one of [feat, fix, docs, ...] [type-enum]

# ✅ Accepted
git commit -m "feat(auth): add login feature"
```

## 🚀 Pre-Push Hooks

Run tests before pushing to catch issues early:

Create `.husky/pre-push`:

```bash
npx ng test --no-watch --code-coverage
```

:::caution
Pre-push hooks run the full test suite, which can take time. If this slows down your workflow too much, consider running only affected tests or moving full test runs to CI.
:::

## 📦 Complete Setup from Scratch

Here's the full setup for a new Angular project:

### Step 1: Install Dependencies

```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional prettier
```

### Step 2: Initialize Husky

```bash
npx husky init
```

### Step 3: Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,html}": [
      "eslint --fix"
    ],
    "*.{ts,html,scss,json,md}": [
      "prettier --write"
    ]
  }
}
```

### Step 4: Set Up Hooks

Update `.husky/pre-commit`:

```bash
npx lint-staged
```

Create `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit $1
```

Create `.husky/pre-push`:

```bash
npx ng test --no-watch
```

### Step 5: Configure commitlint

Create `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

### Step 6: Verify Everything Works

```bash
# Test pre-commit hook
echo "test" >> README.md
git add README.md
git commit -m "test: verify git hooks"
# Should pass lint-staged and commitlint

# Test commit message validation
git commit --allow-empty -m "bad message"
# Should fail commitlint
```

## 🔄 Integration with CI/CD

Git hooks enforce quality locally, but CI/CD is the final safety net. Your CI should run the same checks:

```yaml
name: Quality Checks
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Needed for commitlint

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      # Validate commit messages
      - name: Validate commits
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD

      # Lint
      - name: Lint
        run: npx ng lint

      # Format check
      - name: Check formatting
        run: npx prettier --check .

      # Test
      - name: Test
        run: npx ng test --no-watch --code-coverage
```

:::tip
Git hooks can be bypassed with `git commit --no-verify`. The CI pipeline ensures that even bypassed hooks are caught before code is merged. Think of local hooks as a fast feedback loop and CI as the enforcer.
:::
