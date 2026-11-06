---
title: Prompting Best Practices ✍️
description: Get more reliable Angular 22 code from Copilot, Cursor, Claude Code and other coding agents with specific prompts, project context and a review checklist.
sidebar:
  order: 7
---

AI assistants can save time, but their training data includes older Angular patterns. Give the assistant the version, constraints and acceptance criteria before asking it to write code.

## A practical workflow

1. **Check the project version.** Read `package.json` and `angular.json`; do not assume the newest Angular version.
2. **State the task and boundaries.** Name the files or behavior involved, what must remain unchanged, and the expected result.
3. **Provide project conventions.** Point the assistant to `AGENTS.md`, `.github/copilot-instructions.md`, or the rules file used by your tool.
4. **Ask for a small implementation.** Prefer one well-scoped change over a request to rewrite an entire application.
5. **Require verification.** Ask the assistant to run the relevant test or build, explain failures and report any unverified claims.
6. **Review the diff.** Confirm behavior, accessibility, error handling, security and dependency changes yourself.

### Example prompt

```text
In this Angular 22.2 project, add an accessible product filter to
src/app/products/product-list.ts and its template.

Follow AGENTS.md. Use signal inputs, computed state and @for with a stable track
expression. Do not add a dependency or change the route structure.

Acceptance criteria:
- Search is case-insensitive and updates as the user types.
- The label is programmatically associated with the input.
- An empty state appears when there are no matches.
- Add focused Vitest tests for matching and the empty state.

Run the relevant tests and ng build. Summarize changed files and anything that
could not be verified.
```

## Give the assistant the right Angular context

For version-aware suggestions, connect the Angular CLI MCP server to your editor. It can expose documentation search, project information, examples and other CLI tools to compatible assistants. See [Angular MCP Server](/ai/mcp-server/).

Add a checked-in rules file that describes your repository rather than relying on a generic prompt. You can start with `ng generate ai-config`, then review the generated files and edit them to match your app. See [AI Config, Rules & Skills](/ai/ai-config-and-skills/) and [Use NG Guide with AI](/ai/use-ng-guide-with-ai/).

## Angular 22 review checklist

Before accepting generated Angular code, check:

- **Version fit:** APIs and package versions match the project's Angular version.
- **Components:** standalone by default; no redundant `standalone: true`; OnPush is already the default for components in v22.
- **Inputs and outputs:** use `input()`, `output()` and `model()` for new code instead of decorator-based APIs.
- **Dependency injection:** use `inject()`; use `@Service()` for new root-provided services where its constraints fit.
- **Templates:** use `@if`, `@for` with a stable `track` expression, `@switch`, and class/style bindings. These built-in blocks replace deprecated `NgIf`, `NgFor` and `NgSwitch`.
- **Signals:** use `computed()` for derived values; do not copy one signal into another with an `effect()`.
- **HTTP:** `provideHttpClient()` uses Fetch by default in v22; `withFetch()` is deprecated. Use `withXhr()` only when upload progress is needed.
- **Forms:** Signal Forms use `FormField` and `[formField]`, not a `Field` directive or `[field]`.
- **Dynamic components:** `ComponentFactoryResolver` was removed in v22; pass the component type directly to `ViewContainerRef.createComponent()`.
- **Tests:** new projects use Vitest. Use `vi.fn()` and `vi.spyOn()` rather than Jasmine-only APIs.
- **Accessibility:** verify labels, keyboard interaction, focus handling and semantic HTML; generated ARIA attributes do not guarantee an accessible widget.
- **Security:** validate untrusted data, avoid unsafe DOM APIs and never put private service credentials in browser code.

## Ask for evidence—not confidence

If a suggestion depends on an API or a recent change, ask the assistant to name the symbol, package and Angular version, then verify it in the official API reference or the installed package's TypeScript declarations. A plausible-looking code sample is not proof that the API exists.

For an unfamiliar behavior, ask for a minimal reproduction and a test. Avoid accepting claims such as “this is faster” without a measured comparison on your application.

## Common failure modes

| What the assistant may produce | Why it is a problem | Better direction |
|---|---|---|
| Old structural directives in a new v22 template | `NgIf`, `NgFor` and `NgSwitch` are deprecated | Use the built-in `@if`, `@for`, `@switch` blocks |
| `standalone: true` everywhere | Standalone is the default | Remove the redundant metadata |
| `ChangeDetectionStrategy.OnPush` boilerplate | OnPush is the v22 default | Omit it unless documenting older code or intentional eager behavior |
| `withFetch()` | Deprecated in v22; Fetch is already the default | Use `provideHttpClient()`; use `withXhr()` only for upload progress |
| `ComponentFactoryResolver` | Removed in v22 | Pass the component class directly to the dynamic component API |
| API key in `environment.ts` | Browser bundles are public | Call a server endpoint or use a client-safe service protected by its recommended controls |
| A large untested rewrite | Hard to review and easy to break | Split work into small changes with focused tests |

## Next steps

- [Angular MCP Server](/ai/mcp-server/)
- [AI Config, Rules & Skills](/ai/ai-config-and-skills/)
- [The NG Guide agent instructions](/AGENTS.md)
- [Download the Angular coding skill](/skills/ng-guide/SKILL.md)
