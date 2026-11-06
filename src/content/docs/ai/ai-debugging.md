---
title: AI Runtime Debugging 🔍
description: How Angular 22 exposes in-page AI debugging tools (angular:di_graph and angular:signal_graph) in dev mode, and how AI agents use them through Chrome DevTools for agents.
sidebar:
  order: 6
---

Reading source code only tells an AI agent what your app _should_ do. To debug what it _actually_ does, the agent needs to look inside the **running** app. Since v22, Angular registers **in-page AI debugging tools** in development mode, so an agent connected to Chrome can ask Angular directly for the live dependency-injection graph and signal graph.

## What you'll learn

- What Angular's AI runtime debugging tools are and when they're available
- What `angular:di_graph` and `angular:signal_graph` return
- How an AI agent calls them through Chrome DevTools for agents (`chrome-devtools-mcp`)
- Prompts that make good use of them, and their current limits

## What Angular registers

When an Angular platform is created **in dev mode**, Angular listens for a browser event named `devtoolstooldiscovery`. Chrome DevTools dispatches this event to ask the page which developer tools it offers, and Angular answers with a tool group named **Angular** containing two tools:

| Tool | Input | Returns |
| --- | --- | --- |
| `angular:di_graph` | none | The whole **dependency injection graph**: the element-injector tree (per component/directive host element) and the environment-injector tree, with the providers at each level and their values if already created |
| `angular:signal_graph` | `target`: the **host element** of a component | The **reactive graph** behind that component: signals, computeds, effects and the template, with current values and which node reads which |

Good to know:

- **Dev mode only.** The tools are registered only when `ngDevMode` is on (for example `ng serve`). Production builds don't include them.
- **No setup.** There's no provider to add — they register when the platform starts and unregister when it's destroyed.
- **Read-only.** They inspect state; they don't change your app.
- **Not WebMCP.** These are _debugging_ tools for developers, not tools for your users' agents. App features for agents are covered in [WebMCP Tools](/ai/webmcp/).

### `angular:di_graph` output (shape)

```text
elementInjectorRoots[]        one per Angular root ([ng-version]) on the page
  name, type: 'element'
  providers[] { token, value }
  hostElement                 DOM element of the component/directive
  children[]                  nested element injectors
environmentInjectorRoot
  name, type: 'environment' | 'null'
  providers[] { token, value }
  children[]                  child environment injectors (e.g. lazy routes)
```

Use it for questions like "why do these two components get different instances of `CartStore`?" or "which injector provides `API_URL` on the checkout page?".

Current limitations (documented in the implementation): the link between a component and the specific environment injector it uses isn't included, and pages with **multiple Angular apps** (micro-frontends) aren't supported.

### `angular:signal_graph` output (shape)

```text
nodes[]   { kind: 'signal' | 'computed' | 'effect' | 'template', value, label, epoch }
edges[]   { consumer, producer }   indexes into nodes[]: "nodes[consumer] reads nodes[producer]"
```

`label` is the variable name when Angular can tell (`const total = computed(...)` → `total`). The graph includes signals from services that the component depends on, but not signals used only by child components. It's ideal for "why didn't this view update?" or "what does `cartTotal` depend on?".

## Letting an AI agent use them

The tools are discovered by **Chrome DevTools**. The simplest way to give a coding agent (Copilot, Claude Code, Cursor, Gemini CLI…) access is **Chrome DevTools for agents**, the `chrome-devtools-mcp` MCP server. Its third-party tools category is experimental and off by default, so enable it with a flag:

```json title=".vscode/mcp.json (VS Code) — use mcpServers for other hosts"
{
  "servers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--categoryExperimentalThirdParty=true"]
    },
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

With that flag the agent gets two extra MCP tools:

- `list_3p_developer_tools` — lists in-page developer tools, including Angular's `angular:di_graph` and `angular:signal_graph`
- `execute_3p_developer_tool` — runs one of them and returns the result

A typical session:

1. The agent starts your dev server (for example with the Angular MCP server's `devserver_start`).
2. It opens `http://localhost:4200` in Chrome via `chrome-devtools-mcp` and reproduces the bug.
3. It calls `list_3p_developer_tools`, then `execute_3p_developer_tool` with `angular:di_graph` or `angular:signal_graph`.
4. It compares the live graph with the source code and proposes a fix.

Example prompts:

```text
Open http://localhost:4200/cart in Chrome. Use the Angular in-page developer tools
to get the DI graph and tell me which injector provides CartStore for <app-cart-summary>
and <app-mini-cart>. Are they the same instance?
```

```text
The total in <app-cart-summary> doesn't update after removing an item.
Use angular:signal_graph on that component's host element, explain the dependency
chain for the total, and point to the missing or wrong signal dependency.
```

:::caution[Experimental tooling]
The `devtoolstooldiscovery` integration and `chrome-devtools-mcp`'s third-party tools category are both new and experimental. Names and flags may change; check `chrome-devtools-mcp --help` if the flag isn't recognised. `chrome-devtools-mcp` gives the agent access to everything in that browser profile — avoid using it with sessions that contain sensitive data.
:::

## Related debugging tools

- **Angular DevTools** (browser extension) shows the component tree, DI tree, signal graph and profiler for humans. See [Angular DevTools](/tools/devtools/).
- **`provideStabilityDebugging()`** (`@angular/core`) logs which pending tasks keep an app from becoming stable — useful for SSR/hydration timeouts. It's on by default in dev mode when you use `provideClientHydration()`; add it manually only for temporary debugging in other setups.
- The [Angular MCP server](/ai/mcp-server/) lets the agent build, test and read dev-server logs, which pairs well with runtime inspection.

## Key takeaways

- In dev mode, Angular 22 exposes `angular:di_graph` and `angular:signal_graph` to Chrome DevTools through the `devtoolstooldiscovery` event.
- AI agents reach them through `chrome-devtools-mcp` with `--categoryExperimentalThirdParty=true` (`list_3p_developer_tools` / `execute_3p_developer_tool`).
- Use them to answer "which instance?" (DI) and "why didn't it update?" (signals) questions with real runtime data.

## Next steps

- Set up the Angular MCP server: [Angular MCP Server](/ai/mcp-server/)
- Understand injector hierarchies: [Dependency Injection](/advanced/dependency-injection/)
- Understand signal dependencies: [Signals](/modern/signals/)
