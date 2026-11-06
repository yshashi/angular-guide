---
title: What is Angular? 🅰️
description: What Angular is, what it includes, how it works, how it compares to React and Vue, its release cycle and when to choose it — explained for beginners.
sidebar:
  order: 1
---

Angular is a free, open-source **web framework** for building fast, reliable web applications. It is
written in TypeScript and maintained by a dedicated team at Google, together with a large open-source
community. You can use it for anything from a small personal project to apps with hundreds of
screens and developers.

## What you'll learn

- What Angular is and what it includes "in the box"
- What Angular code looks like
- How an Angular app works at a high level
- How Angular compares to React and Vue
- How Angular versions and support work
- When Angular is (and isn't) a good fit

## Angular in simple terms

Think of Angular as a **complete workshop** rather than a single tool. Some libraries give you only
a hammer (for example, a way to render UI) and you pick the rest yourself. Angular gives you a
well-organised workshop where every tool is designed to work with the others:

| Tool in the workshop | What it does |
| --- | --- |
| **Components** | Reusable pieces of UI (a header, a product card, a whole page) |
| **Templates** | HTML with extra syntax to show data, react to events and loop over lists |
| **Signals** | Reactive values — when one changes, Angular updates exactly what depends on it |
| **Services & dependency injection** | Share logic and data (API calls, a shopping cart) across components |
| **Router** | Navigate between pages, lazy-load code, protect routes with guards |
| **Forms** | Collect and validate user input (Signal Forms, Reactive Forms, template-driven) |
| **HttpClient / `httpResource`** | Talk to backend APIs |
| **Angular CLI** | Create, run, test, build and update projects with one command |
| **SSR & hydration** | Render pages on the server for faster loads and better SEO |
| **Testing tools** | `TestBed`, component harnesses, Vitest integration |

## A first look at Angular code

Here is a small but complete component. It shows a counter and a button:

```ts title="counter.ts"
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>You clicked {{ count() }} times (double: {{ double() }})</p>
    <button type="button" (click)="increment()">Click me</button>
  `,
  styles: `
    button {
      padding: 0.5rem 1rem;
    }
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly double = computed(() => this.count() * 2);

  protected increment() {
    this.count.update((value) => value + 1);
  }
}
```

Reading it line by line:

- `@Component({...})` tells Angular "this class is a component".
- `selector: 'app-counter'` means you use it in HTML as `<app-counter />`.
- `template` is the HTML. `{{ count() }}` shows a value; `(click)="increment()"` listens to an event.
- `styles` are scoped to this component — they won't leak to the rest of the page.
- `signal(0)` creates a reactive value; `computed()` derives a new value from it.
- Calling `count.update(...)` changes the value, and Angular re-renders only what reads it.

Components can use **services** to share logic. Angular hands them a service through
**dependency injection** with `inject()`:

```ts title="greeting.ts"
import { Component, Service, inject, input } from '@angular/core';

@Service()
export class Greeter {
  greet(name: string) {
    return `Hello, ${name}! 👋`;
  }
}

@Component({
  selector: 'app-greeting',
  template: `<h2>{{ greeter.greet(name()) }}</h2>`,
})
export class Greeting {
  readonly name = input('Angular');
  protected readonly greeter = inject(Greeter);
}
```

`<app-greeting name="Sam" />` renders "Hello, Sam! 👋". You'll learn all of this step by step in the
next pages.

## How an Angular app works

```text
index.html  ──►  <app-root>            The browser loads one HTML page
                     │
main.ts  ──►  bootstrapApplication(App, appConfig)
                     │
                 App (root component)
                 ├── Header
                 ├── <router-outlet>  ──►  ProductList page   (chosen by the router)
                 │                          ├── ProductCard
                 │                          └── ProductCard
                 └── Footer
                     ▲
     Services (CartStore, ProductApi, …) are injected wherever they're needed
```

1. **One page, many views.** An Angular app is usually a **single-page application (SPA)**: the
   browser loads `index.html` once, and Angular swaps views as you navigate — no full page reloads.
2. **A tree of components.** The root component (`App`) contains other components, which contain
   others, and so on.
3. **Compiled ahead of time.** The Angular compiler turns your templates into efficient JavaScript
   at build time, and type-checks them, so many mistakes are caught before the app runs.
4. **Reactive updates.** When a signal changes, an event fires, or an input changes, Angular updates
   only the affected components. Since Angular 21, new apps don't need `zone.js` for this
   ("zoneless").
5. **Optional server rendering.** With SSR, the first HTML is rendered on the server, then
   **hydrated** in the browser so it becomes interactive.

## Why choose Angular?

**1. Batteries included.** Routing, forms, HTTP, testing, SSR, animations, i18n and accessibility
primitives are all official and designed together. You spend less time choosing and wiring up
libraries.

**2. TypeScript and strict type checking.** Your components, services **and templates** are
type-checked. Typos like `{{ user.nmae }}` fail the build instead of failing in production.

**3. Modern, fine-grained reactivity.** Signals, `computed()`, `linkedSignal()`, `resource()`
and `httpResource()` make state easy to reason about. Components use `OnPush` change detection
by default (since v22), so Angular skips work it doesn't need to do.

**4. Great tooling.**

- The **Angular CLI** creates projects, generates code and builds with esbuild and Vite.
- **`ng update`** upgrades your app and runs automatic code migrations for breaking changes.
- The **Angular Language Service** brings autocomplete and errors into templates in your editor.
- **Angular DevTools** lets you inspect components, signals, injectors and performance.
- The **Angular CLI MCP server** gives AI assistants accurate, up-to-date Angular knowledge.

**5. Stability you can plan around.** Angular follows semantic versioning, publishes a release
schedule, deprecates APIs before removing them, and gives every major version long-term support.

**6. Secure by default.** Angular automatically sanitises values you bind into the DOM to help
prevent cross-site scripting (XSS), and supports Trusted Types.

**7. Scales with your team.** A consistent project structure, a shared style guide and dependency
injection make large codebases easier to navigate.

## Angular vs React vs Vue

All three are excellent choices. They differ mainly in **how much they decide for you**.

| | Angular | React | Vue |
| --- | --- | --- | --- |
| **Type** | Full framework | UI library | Progressive framework |
| **Language** | TypeScript (built-in) | JavaScript or TypeScript | JavaScript or TypeScript |
| **Templates** | HTML templates with `@if` / `@for` | JSX | HTML templates (or JSX) |
| **Reactivity** | Signals | Hooks (`useState`, …) | Refs / reactive proxies |
| **Routing, forms, HTTP** | Official, built in | Third-party libraries | Official router and state library; others third-party |
| **Dependency injection** | Built in, hierarchical | No (uses context) | `provide` / `inject` |
| **CLI & build** | Angular CLI (esbuild + Vite) | Vite, Next.js, etc. | Vite, Nuxt, etc. |
| **Opinionated?** | Yes — one recommended way | No — you choose | Somewhat |

**In short:** if you want one consistent, well-integrated toolkit with strong typing, Angular is a
great fit. If you prefer to assemble your own stack piece by piece, React may suit you. Vue sits in
between.

:::note[Angular is not AngularJS]
**AngularJS** (version 1.x, first released in 2010) is a different, older framework. Its long-term
support ended on December 31, 2021. "Angular" (version 2 and later, first released in 2016) is a
complete rewrite. Tutorials that mention `$scope` or `ng-controller` are about AngularJS.
:::

## Versions and support

Angular uses **semantic versioning**: `major.minor.patch` (for example `22.2.4`).

- **Major** versions (22, 23, …) can contain breaking changes — `ng update` migrates most of them
  for you.
- **Minor** versions add features and are backward-compatible.
- **Patch** versions fix bugs and are released almost every week.

Starting with **Angular 22**, a new major version is planned **every 12 months** (before v22 it was
every 6 months), with 4–6 minor releases in between. Each major version is supported for about
**24 months**: 12 months of active support, then 12 months of long-term support (LTS) with critical
and security fixes only.

| Version | Status (Nov 2026) | Released | Active support ends | LTS ends |
| --- | --- | --- | --- | --- |
| **22** | Active | 2026-06-03 | ~2027-06 | ~2028-06 |
| 21 | LTS | 2025-11-19 | 2026-06-03 | ~2027-06 |
| 20 | LTS | 2025-05-28 | 2025-11-19 | 2026-11-28 |

Versions 2 to 19 are no longer supported. Check your project's version with `ng version`.

### How Angular got here

| Version | Highlights |
| --- | --- |
| 2 (2016) | The new Angular: TypeScript, components, dependency injection |
| 14–15 | Standalone components (no `NgModule` needed); typed reactive forms |
| 16 | Signals introduced; required inputs |
| 17 | New look and [angular.dev](https://angular.dev); built-in control flow (`@if`, `@for`) and `@defer`; esbuild/Vite build system by default |
| 18 | Control flow and `@defer` stable; experimental zoneless; `@let` (18.1) |
| 19 | Standalone is the default; `linkedSignal` and `resource` introduced; incremental hydration preview |
| 20 | `effect`, `linkedSignal`, `toSignal` and incremental hydration stable; zoneless stable (20.2); new short file names (`app.ts`) |
| 21 | Zoneless by default; Vitest by default; Signal Forms (experimental) and Angular Aria (preview); CLI MCP server |
| **22** | `OnPush` by default; `@Service()`; `injectAsync()`; **Signal Forms**, `resource`/`httpResource` and **Angular Aria** stable; fetch-based `HttpClient` by default; TypeScript 6 |

## The Angular ecosystem

| Project | What it's for |
| --- | --- |
| **Angular Material** (`@angular/material`) | Ready-made Material Design components |
| **Angular CDK** (`@angular/cdk`) | Behaviour primitives: overlays, drag & drop, virtual scrolling, a11y |
| **Angular Aria** (`@angular/aria`) | Headless, accessible patterns (tabs, menu, combobox, listbox, tree…) that you style yourself |
| **`@angular/ssr`** | Server-side rendering, prerendering and hydration |
| **`@angular/service-worker`** | Offline support and PWAs |
| **NgRx** (community) | State management, including the signal-based `@ngrx/signals` store |
| **angular-eslint** (community) | Linting rules for Angular code and templates |
| **Ionic + Capacitor**, **NativeScript** (community) | Mobile apps using Angular |

## When to use Angular

### ✅ A great fit for

- Medium to large applications with many screens: dashboards, admin panels, internal tools,
  e-commerce, banking and SaaS products
- Teams that value consistency, strong typing and clear conventions
- Long-lived projects that need predictable upgrades
- Apps that need SSR, i18n, accessibility and testing without assembling many libraries

### 🤔 Maybe something else

- A mostly static site or blog with little interactivity — a static site generator may be simpler
  (although Angular's prerendering handles this too)
- A tiny widget on an existing page — plain JavaScript or web components may be enough

## Who uses Angular?

Angular is used inside Google for large products such as **Google Cloud Console** and
**Google Fonts**, and by many companies worldwide for enterprise software, finance, healthcare,
e-commerce and government services.

## A typical development workflow

1. **Create** a project: `ng new my-app`
2. **Generate** building blocks: `ng generate component product-card`
3. **Develop** with live reload: `ng serve`
4. **Test**: `ng test` (Vitest)
5. **Build** for production: `ng build`
6. **Deploy** the `dist/` folder (or a Node.js server for SSR)
7. **Update** to the next version: `ng update @angular/core @angular/cli`

## Common misconceptions

- **"Angular needs NgModules."** Not any more — standalone components are the default.
- **"Angular is slow / heavy."** Modern Angular is zoneless, uses `OnPush` by default, and only
  ships the code you use (tree-shaking, lazy loading, `@defer`).
- **"Angular is hard to learn."** There is more built in, so there is more to discover — but you only
  need components, templates, signals and services to build your first app.
- **"Angular is the same as AngularJS."** No — see the note above.

## Key takeaways

- Angular is a complete, TypeScript-first framework for building web apps, maintained by Google.
- Apps are trees of **components**; **signals** drive updates; **services** share logic via
  **dependency injection**.
- Angular 22 is the current version: standalone, zoneless, `OnPush` by default, with stable Signal
  Forms and resource APIs.
- New majors arrive every 12 months, and each is supported for about 24 months.

## Next steps

1. **[Angular Architecture](/beginner/architecture/)** — see how the pieces fit together
2. **[Your First App](/beginner/first-app/)** — build a working task manager
3. **[Components Basics](/beginner/components/)** — dive into components
