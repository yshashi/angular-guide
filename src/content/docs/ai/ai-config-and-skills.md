---
title: AI Config, Rules & Skills 📜
description: Generate AGENTS.md, CLAUDE.md or GEMINI.md and MCP config with ng generate ai-config, customise Angular rules files, install agent skills and use the Angular AI tutor.
sidebar:
  order: 4
---

AI assistants write better Angular code when they're told **how** your project wants code written. Angular 22 gives you three ready-made ways to do that: a generated **rules file** (`AGENTS.md`, `CLAUDE.md` or `GEMINI.md`), the **MCP server config** for your tool, and official **agent skills**. On top of that, the CLI includes an interactive **AI tutor**.

## What you'll learn

- How `ng new --ai-config` and `ng generate ai-config` work, and exactly which files they create per tool
- What's inside the generated Angular best-practices rules file and how to customise it
- Where rules files live for Copilot, Cursor, Claude Code, Gemini CLI, Codex, JetBrains, Windsurf and Antigravity
- How to install the official Angular agent skills
- How to start and use the Angular AI tutor

## Generate AI config with the CLI

### When creating a project

`ng new` asks **"Which AI tools should Angular integrate with?"** You can also answer up front:

```bash
ng new my-app --ai-config=claude-code
```

### In an existing project

```bash
ng generate ai-config --tool=vscode
```

Pass `--tool` more than once to configure several tools at the same time:

```bash
ng generate ai-config --tool=cursor --tool=claude-code
```

### Which files are created

Each choice creates **one rules file** (Angular best practices) and **one MCP config** that registers the Angular CLI MCP server.

| `--tool` value | Rules file | MCP config |
| --- | --- | --- |
| `claude-code` | `CLAUDE.md` | `.mcp.json` (`mcpServers`) |
| `cursor` | `AGENTS.md` | `.cursor/mcp.json` (`mcpServers`) |
| `gemini-cli` | `.gemini/GEMINI.md` | `.gemini/settings.json` (`mcpServers`) |
| `open-ai-codex` | `AGENTS.md` | `.codex/config.toml` (`[mcp_servers.angular-cli]`) |
| `vscode` | `AGENTS.md` | `.vscode/mcp.json` (`servers`) |
| `none` | — | — |

The schematic is **non-destructive**:

- If the rules file already exists, it is **skipped** with a warning (so your customisations survive). Delete it and re-run to get the latest Angular defaults.
- If a JSON MCP config exists, the `angular-cli` entry is **merged** into it; other servers stay.
- If `.codex/config.toml` already has `[mcp_servers.angular-cli]`, it is left alone; otherwise the section is appended.

:::note[Angular 22.0 and earlier]
Since 22.1, `ai-config` also writes the MCP server config. In earlier versions it only created the rules file, so you added the MCP config by hand (see [Angular MCP Server](/ai/mcp-server/)).
:::

## What's in the generated rules file

The rules file is a short, opinionated Angular style guide written for an LLM. It starts with a role ("You are an expert in TypeScript, Angular, and scalable web application development…") followed by sections like these (abridged):

```md
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object …
- Use `NgOptimizedImage` for all static images.

## Components
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties …
- Use `computed()` for derived state
- Prefer Signal Forms (`@angular/forms/signals`) for new forms …
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule` …

## Templates
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`

## Services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
```

It also has sections on TypeScript (strict types, no `any`), accessibility (must pass AXE checks and WCAG AA) and state management (no `mutate`, use `set`/`update`).

The same guide is shipped inside `@angular/core` (`@angular/core/resources/best-practices.md`), which is what the MCP server's `get_best_practices` tool loads for your installed version.

### Customise it for your project

The generated file is a starting point. Add the things an assistant can't guess:

```md
## Project conventions
- Angular 22.2, TypeScript 6.0, Vitest for unit tests, Playwright for e2e.
- Feature folders live in `src/app/features/<name>/`; shared UI in `src/app/ui/`.
- State: signals in `@Service()` classes; no NgRx in new code.
- HTTP: use `httpResource` for reads, `HttpClient` for writes. Never add `withFetch()` (fetch is the default).
- Forms: Signal Forms with `[formField]`.
- Run `ng test` and `ng build` before saying a task is done.
```

Keep it short and specific. Rules files are sent with many requests, so every line costs context.

## Rules files for other tools

Different tools look for instructions in different places. The Angular team also publishes ready-made files you can download from angular.dev's "LLM prompts and AI IDE setup" page.

| Tool | Where it reads instructions |
| --- | --- |
| GitHub Copilot (VS Code, JetBrains, GitHub) | `.github/copilot-instructions.md`; VS Code also reads `AGENTS.md` and `*.instructions.md` files |
| Cursor | `AGENTS.md` or rules in `.cursor/rules/` |
| Claude Code | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |
| OpenAI Codex | `AGENTS.md` |
| JetBrains Junie | `AGENTS.md` |
| Antigravity | `GEMINI.md` |
| Windsurf | Rules files (Angular publishes a `guidelines.md`) |

The downloadable Angular best-practices prompt lives at `https://angular.dev/assets/context/best-practices.md`. You can also paste it as context into any chat that has no rules-file support.

### `llms.txt` context files

`llms.txt` is a proposed convention that helps LLMs find a site's key content. angular.dev provides:

- `https://angular.dev/llms.txt` — an index of key pages and resources
- `https://angular.dev/assets/context/llms-full.txt` — a large compiled guide to how Angular works

Give these to tools that can fetch URLs, or attach them as context when you ask about Angular concepts.

:::tip[Use NG Guide with your assistant too]
This site also offers an `llms.txt`, an `llms-full.txt` and a ready-made `AGENTS.md` written for Angular 22. See [Use NG Guide with AI](/ai/use-ng-guide-with-ai/).
:::

## Agent skills

**Agent skills** are packaged, task-specific instructions an agent loads **only when relevant** (for example, when you ask it to create a component). They keep the always-on rules file small while giving the agent deep guidance on demand.

The Angular team maintains official skills in the `angular/skills` repository:

| Skill | Use it for |
| --- | --- |
| `angular-developer` | Generating Angular code and architecture guidance: components, services, reactivity (signals, `linkedSignal`, `resource`), forms, dependency injection, routing, SSR, accessibility (ARIA), animations, styling, testing and CLI tooling |
| `angular-new-app` | Creating a new Angular app with the Angular CLI, following current guidelines for setup and structure |

Install them with the community `skills` tool:

```bash
npx skills add https://github.com/angular/skills
```

Or follow your tool's own skills instructions (Gemini CLI, Antigravity and other agentic tools support skills). Once installed, you don't have to mention the skill — when you ask "add a settings page with a form", a skill-aware agent loads `angular-developer` automatically.

:::tip[Skills + MCP = best results]
Skills tell the agent **how** to write Angular code; the [MCP server](/ai/mcp-server/) lets it **check** its work (search docs, build, run tests). Use both.
:::

## The Angular AI tutor

The **Angular AI Tutor** is an interactive course that runs inside your AI assistant through the MCP server's `ai_tutor` tool. You build a real app — a **"Smart Recipe Box"** — step by step. Instead of dumping code, the tutor explains a concept, shows a small example, gives you an exercise, then **reads your project files** to check your solution.

### Start the tutor

1. Set up the [Angular MCP server](/ai/mcp-server/) in your tool.
2. Create a fresh project: `ng new recipe-box` and open it in your AI-enabled editor or CLI (VS Code, Gemini CLI, Claude Code…).
3. Type: **`launch the Angular AI tutor`**.

### Useful commands

| You say | The tutor… |
| --- | --- |
| "Set my experience level to beginner" / "Change my rating to 8" | Adapts explanations (Beginner 1–3, Intermediate 4–7, Experienced 8–10) |
| "Show the table of contents" / "Where are we?" | Shows the learning plan and your position |
| "hint" | Gives a nudge without the full answer |
| "detailed guide" / "step-by-step instructions" | Walks you through the exercise |
| "Skip this section" | Confirms, then applies the solution and moves on |
| "Take me to the forms lesson" | Jumps to a topic and updates your code to the right starting point |
| "proceed" | Nudges the tutor if it seems stuck |

Your progress is your code: in a new session the tutor reads your files to find where you left off. Commit after each module (`git commit -m "Complete module 8"`) so you have checkpoints.

### What it covers

The curriculum has five phases: **Angular fundamentals** (interpolation, events), **state and signals** (`set`, `update`, `computed`), **component architecture** (bindings, inputs, styling, `@for`, `@if`), **advanced features** (two-way binding, services and DI, routing, forms, Angular Material) and **Signal Forms** (submitting, resetting, validation, field state).

### Troubleshooting

- Nothing happens? Make sure a project is open and the MCP server is running (in VS Code: **MCP: List Running Servers** should show `angular-cli`; the `.vscode/mcp.json` file has a **Start** button).
- Tutor confused about your progress? Tell it: "I'm actually on module 8."
- Still odd? Start a new chat — the tutor re-reads your files.

## Key takeaways

- `ng new --ai-config=<tool>` or `ng generate ai-config --tool=<tool>` creates a rules file plus the Angular MCP config; it never overwrites an existing rules file.
- Claude Code gets `CLAUDE.md`, Gemini CLI gets `.gemini/GEMINI.md`, and Cursor, Codex and VS Code share `AGENTS.md`.
- Customise the rules file with your project's conventions — short and specific.
- Install the official skills with `npx skills add https://github.com/angular/skills`.
- The AI tutor (via MCP) is a hands-on way to learn modern Angular.

## Next steps

- Connect the MCP server manually or tweak its options: [Angular MCP Server](/ai/mcp-server/)
- Learn a reliable prompting workflow: [Prompting Best Practices](/ai/prompting-best-practices/)
- Point your assistant at this site: [Use NG Guide with AI](/ai/use-ng-guide-with-ai/)
