---
title: WebMCP Tools 🧰
description: Expose Angular app features as tools for in-browser AI agents with experimental WebMCP APIs — provideExperimentalWebMcpTools, declareExperimentalWebMcpTool and Signal Forms.
sidebar:
  order: 5
---

**WebMCP** is a proposed web standard that lets a web page register **tools** — named functions with a description and a JSON Schema — that an **AI agent running in the browser** can call. Instead of an agent clicking through your UI like a robot ("find the search box, type, press Enter, scroll…"), your app offers a clean `searchCatalog({ query })` tool and the agent calls it directly.

Angular 22 has experimental WebMCP support: tools tied to the **dependency injection lifecycle**, and **Signal Forms that become tools automatically**.

:::caution[Experimental]
WebMCP is an early-stage proposal that changes often, and browser support is still experimental. Angular's WebMCP APIs are **experimental** (added in 22.0, annotations in 22.2) and can change even in minor releases. Try them, but don't build critical features on them yet.
:::

## What you'll learn

- How WebMCP differs from the Angular CLI MCP server
- How to register app-wide and route-specific tools with `provideExperimentalWebMcpTools`
- How to declare tools from a service with `declareExperimentalWebMcpTool`
- How to turn a Signal Form into a tool with `provideExperimentalWebMcpForms`
- Tool annotations (`readOnlyHint`, `untrustedContentHint`, `consequentialHint`)
- Security and testing best practices

## WebMCP vs. the Angular CLI MCP server

| | Angular CLI MCP server | WebMCP |
| --- | --- | --- |
| Who uses it | Your **coding assistant** (Copilot, Claude Code…) | An **AI agent in the user's browser** |
| Runs where | Your machine, via `ng mcp` | Inside your running web app |
| Tools are about | Building your project (docs, build, test) | Using your app (search, add to cart, register) |
| Page | [Angular MCP Server](/ai/mcp-server/) | This page |

## How it works

When the browser supports WebMCP, it exposes a `modelContext` object (on `document` or `navigator`). Angular calls its `registerTool()` for you and **unregisters** the tool automatically when the related injector is destroyed (app destroyed, route left, service destroyed).

If the browser has no WebMCP support, Angular's functions simply do nothing — your app keeps working. They are also skipped during server-side rendering.

Every tool has:

| Field | Purpose |
| --- | --- |
| `name` | Unique tool name, e.g. `searchCatalog` |
| `description` | Tells the agent what the tool does and when to use it — write it like docs for a colleague |
| `inputSchema` | JSON Schema of the arguments (required in the TypeScript types; use `{ type: 'object', properties: {} }` for no arguments) |
| `execute(args, client)` | Runs the tool **in an injection context**, so you can call `inject()`. `client.signal` is an `AbortSignal` |
| `annotations` (optional, 22.2) | Hints about the tool's behaviour (see [Annotations](#annotations)) |

## App-wide tools: `provideExperimentalWebMcpTools`

Add tools to your application providers. They're registered when the app starts and removed when it's destroyed.

```ts title="src/app/app.config.ts"
import {
  ApplicationConfig,
  Service,
  inject,
  provideExperimentalWebMcpTools,
  signal,
} from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: number;
}

@Service()
export class Catalog {
  private readonly products = signal<Product[]>([
    { id: 'p1', name: 'Angular mug', price: 12 },
    { id: 'p2', name: 'Signals T-shirt', price: 25 },
  ]);

  search(query: string, limit: number): Product[] {
    const q = query.toLowerCase();
    return this.products()
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, limit);
  }
}

@Service()
export class Cart {
  readonly items = signal<string[]>([]);
  add(productId: string) {
    this.items.update((items) => [...items, productId]);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalWebMcpTools([
      {
        name: 'searchCatalog',
        description: 'Searches the store catalog for products matching a query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keywords, e.g. "mug".' },
            maxResults: { type: 'number', description: 'Maximum number of results (default 5).' },
          },
          required: ['query'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: ({ query, maxResults }) => {
          // Agents may send anything: validate at runtime.
          if (typeof query !== 'string' || query.length > 100) {
            throw new Error('query must be a string of at most 100 characters');
          }
          const limit = typeof maxResults === 'number' ? Math.min(maxResults, 20) : 5;

          const results = inject(Catalog).search(query, limit);
          return { content: [{ type: 'text', text: JSON.stringify(results) }] };
        },
      },
      {
        name: 'addToCart',
        description: 'Adds a product to the shopping cart by its id (from searchCatalog).',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The product id, e.g. "p1".' },
          },
          required: ['productId'],
          additionalProperties: false,
        },
        annotations: { consequentialHint: true },
        execute: ({ productId }) => {
          if (typeof productId !== 'string') throw new Error('productId must be a string');
          inject(Cart).add(productId);
          return { content: [{ type: 'text', text: `Added ${productId} to the cart.` }] };
        },
      },
    ]),
  ],
};
```

Things to notice:

- **Typed arguments.** Angular infers argument types from `inputSchema`: `query` is `string`, `maxResults` is `number | undefined`. Listing a property in `required` removes `undefined`; `additionalProperties: false` stops extra keys appearing in the type.
- **`inject()` works inside `execute`**, because it runs in the injector's context.
- **Runtime validation is still needed.** Angular does **not** check that the agent's arguments match the schema — the types are a promise, not a guarantee.
- The result here follows MCP's content format (`{ content: [{ type: 'text', text }] }`). Whatever you return is serialised and sent back to the agent.

## Route-specific tools

Some tools only make sense on one page. Put them in the route's `providers`:

```ts title="src/app/app.routes.ts"
import { provideExperimentalWebMcpTools } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
    providers: [
      provideExperimentalWebMcpTools([
        {
          name: 'exportDashboardReport',
          description: 'Exports the analytics shown on the dashboard as CSV.',
          inputSchema: { type: 'object', properties: {} },
          execute: () => ({ content: [{ type: 'text', text: 'Export started.' }] }),
        },
      ]),
    ],
  },
];
```

Route injectors normally live on after you navigate away, so the tool would stay visible to agents. Add **`withAutoCleanupInjectors()`** (stable since 22.2) so the router destroys unused route injectors — and unregisters their tools:

```ts title="src/app/app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withAutoCleanupInjectors } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withAutoCleanupInjectors())],
};
```

## Tools from a service: `declareExperimentalWebMcpTool`

For dynamic cases, call `declareExperimentalWebMcpTool()` in any injection context (a constructor or field initializer). The tool is removed when that context is destroyed. You can also pass an `Injector` as the second argument to use it outside an injection context.

```ts title="src/app/counter.ts"
import { Service, declareExperimentalWebMcpTool, signal } from '@angular/core';

@Service()
export class Counter {
  readonly count = signal(0);

  constructor() {
    declareExperimentalWebMcpTool({
      name: 'getCounter',
      description: 'Reads the current value of the global counter.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => ({
        content: [{ type: 'text', text: `The count is ${this.count()}.` }],
      }),
    });

    declareExperimentalWebMcpTool({
      name: 'incrementCounter',
      description: 'Increments the global counter by the given amount.',
      inputSchema: {
        type: 'object',
        properties: { by: { type: 'number', description: 'Amount to add (1-100).' } },
        required: ['by'],
        additionalProperties: false,
      },
      execute: ({ by }, client) => {
        if (client.signal.aborted) return { content: [{ type: 'text', text: 'Cancelled.' }] };
        if (typeof by !== 'number' || by < 1 || by > 100) {
          throw new Error('"by" must be a number between 1 and 100');
        }
        this.count.update((c) => c + by);
        return { content: [{ type: 'text', text: `The count is now ${this.count()}.` }] };
      },
    });
  }
}
```

`client.signal` aborts when the agent cancels the call **or** when the tool's injector is destroyed — pass it to `fetch()` or check it in long-running work.

:::caution[Avoid name collisions]
Tool names must be unique on the page; registering the same name twice throws. Prefer app providers, route providers or **root services** (created once). If you declare a tool in a component — including a Signal Form tool — make sure that component is never on the page more than once at a time.
:::

## Signal Forms as tools

Signal Forms can become WebMCP tools with almost no code. Angular reads your form model to build the JSON Schema, wires the agent's input into the form, runs your **validators**, and calls your **submission action**. Validation errors and submission failures are reported back to the agent so it can correct itself and retry.

### 1. Enable the feature

```ts title="src/app/app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideExperimentalWebMcpForms } from '@angular/forms/signals';

export const appConfig: ApplicationConfig = {
  providers: [provideExperimentalWebMcpForms()],
};
```

### 2. Opt a form in with `experimentalWebMcpTool`

```ts title="src/app/user-registration/user-registration.ts"
import { Component, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';

interface Registration {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  newsletter: boolean;
  hobbies: string[];
}

@Component({
  selector: 'app-user-registration',
  imports: [FormRoot, FormField],
  template: `
    <form [formRoot]="userForm">
      <label>First name <input [formField]="userForm.firstName" /></label>
      <label>Last name <input [formField]="userForm.lastName" /></label>
      <label>Email <input type="email" [formField]="userForm.email" /></label>
      <label>Age <input type="number" [formField]="userForm.age" /></label>
      <label><input type="checkbox" [formField]="userForm.newsletter" /> Newsletter</label>
      <button type="submit">Register</button>
    </form>
  `,
})
export class UserRegistration {
  private readonly model = signal<Registration>({
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
    newsletter: false,
    hobbies: ['Web development'],
  });

  protected readonly userForm = form(
    this.model,
    (f) => {
      required(f.firstName, { message: 'First name is required.' });
      required(f.lastName, { message: 'Last name is required.' });
      required(f.email);
      email(f.email, { message: 'Enter a valid email address.' });
    },
    {
      experimentalWebMcpTool: {
        name: 'registerUser',
        description: 'Registers a new user account. Use only when the user asks to sign up.',
        annotations: { consequentialHint: true },
      },
      submission: {
        action: async (field) => {
          const value = field().value();
          console.log('Registering', value.email);
        },
      },
    },
  );
}
```

From this form Angular generates a tool named `registerUser` whose schema:

1. has `firstName`, `lastName`, `email`, `age`, `newsletter` and `hobbies` parameters, typed from the **initial model value**;
2. marks `firstName`, `lastName` and `email` as **required** (from the `required` validators);
3. treats `hobbies` as an **array of strings**, so the agent can send any number;
4. disallows extra properties (`additionalProperties: false`).

Rules for schema inference:

- Use **concrete initial values** (`''`, `0`, `false`) — Angular can't infer a type from `null` or `undefined`.
- Give arrays **at least one item** — an empty array has no element type to infer.
- **Async validators** don't block submission by default, so their errors aren't reported to the agent. Re-check those conditions in your submission `action`.

Form tools always report `readOnlyHint: false` and `untrustedContentHint: false` (a form changes page state, and its responses are app-generated). The only annotation you can set is `consequentialHint`.

## Annotations

Since 22.2 tools can carry **annotations** — hints that help agents (and browsers) decide how carefully to treat a tool:

| Annotation | Meaning | Example |
| --- | --- | --- |
| `readOnlyHint: true` | Doesn't change user-visible state (no navigation, DOM changes or backend writes). Agents may use such tools more freely. | `searchCatalog`, `getCounter` |
| `untrustedContentHint: true` | The result may contain content **you** don't trust (user-generated text, third-party data). | `readProductReviews` |
| `consequentialHint: true` | Has real-world effects: mutates data, spends money, sends messages. Agents should confirm with the user. | `addToCart`, `placeOrder`, `registerUser` |

Annotations are **hints**, not security controls. Your `execute` function must still enforce permissions.

## Security checklist

- **Expose only what an agent should be allowed to do.** A tool is a public API for whatever agent the user runs.
- **Validate every argument at runtime** (types, ranges, lengths). Angular doesn't validate against the schema.
- **Re-check authorization inside `execute`** — the tool runs with the logged-in user's session.
- **Mark consequential tools** with `consequentialHint: true` and consider asking the user to confirm inside your UI before irreversible actions.
- **Flag untrusted output** with `untrustedContentHint: true` so agents treat it as data, not instructions (prompt-injection risk).
- **Scope tools** to routes or services so they exist only while relevant, and use `withAutoCleanupInjectors()` for route tools.
- **Don't leak secrets** in tool results (tokens, internal IDs, other users' data).

## Testing tools

Browsers (and jsdom) without WebMCP make the APIs no-ops, so for unit tests use a WebMCP polyfill such as [`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill), which Angular's docs suggest. It supplies a `modelContext` implementation so your tools actually register and can be called from Vitest. To try tools against a real browser agent during development, Chrome DevTools for agents (`chrome-devtools-mcp`) has experimental `list_webmcp_tools` and `execute_webmcp_tool` tools (enable them with `--categoryExperimentalWebmcp=true`).

## Key takeaways

- WebMCP lets **in-browser AI agents** call structured tools your app provides — it's experimental.
- `provideExperimentalWebMcpTools([...])` registers tools for an app or route; `declareExperimentalWebMcpTool()` registers one from an injection context. Both clean up automatically.
- `provideExperimentalWebMcpForms()` + `experimentalWebMcpTool` turns a Signal Form into a validated tool.
- Always include `inputSchema`, validate inputs at runtime, use annotations, and keep tool names unique.

## Next steps

- Build forms that work great as tools: [Signal Forms](/modern/signal-forms/)
- Inspect your running app from an agent: [AI Runtime Debugging](/ai/ai-debugging/)
- Learn about injectors and their lifecycle: [Dependency Injection](/advanced/dependency-injection/)
