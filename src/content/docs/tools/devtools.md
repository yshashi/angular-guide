---
title: Angular DevTools 🔍
description: Use Angular DevTools to inspect components, debug the signal graph, profile change detection, explore injectors and routes, and jump in from Chrome's Performance panel.
sidebar:
  order: 3
---

Angular DevTools is the official browser extension for inspecting a running Angular app. It shows your component tree, lets you edit state, draws the **signal graph**, profiles change detection, and visualizes dependency injection and routing. If you only learn one debugging tool, learn this one.

## What you'll learn

- How to install Angular DevTools and why it needs a development build
- How to inspect and edit components, `@defer` blocks and hydration status
- How to read and debug the signal graph
- How to profile change detection and spot unnecessary work
- How to explore the injector tree and router tree
- How to jump from Chrome's Performance panel straight to a component

## Install and open

Install **Angular DevTools** from the [Chrome Web Store](https://chrome.google.com/webstore/detail/angular-developer-tools/ienfalfjdbdpebioblfackkekamfmbnh) (works in Chrome and other Chromium browsers like Edge) or from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/angular-devtools/).

1. Run your app with `ng serve`.
2. Open the browser DevTools: `F12` or `Ctrl+Shift+I` (Windows/Linux), `Cmd+Option+I` (macOS).
3. Select the **Angular** tab.

| Tab | Use it to… |
|---|---|
| **Components** | Explore components/directives, edit their state, open the signal graph. |
| **Profiler** | Record and analyze change detection. |
| **Injector Tree** | See environment and element injectors and their providers. |
| **Router Tree** | See your route configuration and the active routes. |

Extra experimental tabs (for example **Transfer State**) can be enabled in the DevTools settings. The info button (top-right) shows the Angular version on the page and the DevTools version.

:::caution[Development builds only]
DevTools needs Angular's debug information, which production builds remove. `ng serve` works out of the box. If you see *"We detected an application built with production configuration"*, build with optimizations off (`ng build -c development`, or `"optimization": false`). *"Angular application not detected"* means the page has no running Angular app (note: Chrome's New Tab page doesn't run extensions).
:::

## Components tab

### Explore the tree

The left side shows the hierarchy of **components and directives** on the page. Click one to see its properties on the right. Use the search box to find a component by name.

Take this component:

```ts title="user-card.ts"
import { Component, computed, input, signal } from '@angular/core';

export interface User {
  name: string;
  online: boolean;
}

@Component({
  selector: 'app-user-card',
  template: `
    <h2>{{ user().name }}</h2>
    <p>Status: {{ status() }}</p>
    <button (click)="likes.update((n) => n + 1)">👍 {{ likes() }}</button>
  `,
})
export class UserCard {
  readonly user = input.required<User>();
  protected readonly likes = signal(0, { debugName: 'likes' });
  protected readonly status = computed(() => (this.user().online ? 'online' : 'offline'), {
    debugName: 'status',
  });
}
```

Selecting `app-user-card` shows the `user` input, the `likes` signal and the `status` computed with their current values, updating live as you click.

### Edit state

Right-click a property value; if that value type is editable, a text box appears. Type a new value and press `Enter`. The component updates immediately — perfect for testing edge cases such as an empty list or a very long name without touching code.

### Jump between DevTools, DOM and source

- **Double-click** a component in the tree → selects its host element in the **Elements** panel (Firefox: Inspector).
- **Inspect element** icon (top-left), then hover the page → selects the matching component in the tree.
- **Navigate to source** icon (top-right of the properties view) → opens the component class in **Sources** (Firefox: Debugger).

### Use the selected component in the console

DevTools stores recently selected instances as console variables:

```js
$ng0            // the currently selected component/directive instance
$ng1            // the one selected before it
$ng0.likes()    // read a signal
$ng0.likes.set(42)  // write a signal — the view updates
```

### `@defer` blocks and hydration

- **Deferrable views** appear in the tree. Select a `@defer` block to see its `@placeholder` / `@loading` / `@error` blocks, its triggers (defer, prefetch and hydrate triggers) and timing options like `minimum` and `after`.
- With **SSR + hydration**, each component shows its hydration status, and hydration errors are shown on the affected component. You can also turn on an **overlay** that highlights hydrated parts of the page.

## Debug the signal graph

The signal graph shows how the signals, computeds and effects of a component depend on each other.

1. In the **Components** tab, select a component.
2. Click **Show Signal Graph** in the property pane header (or click the graph button next to a signal property, or choose *Show in signal graph* from its actions menu).

Node types:

| Node | Created by |
|---|---|
| Signal | `signal()` |
| Computed | `computed()` |
| Linked signal | `linkedSignal()` |
| Effect | `effect()`, `afterRenderEffect()` |
| Template | The component's template (it reads signals while rendering) |
| Resource | `resource()` / `rxResource()` — grouped into a collapsible cluster; click **Expand** |

Lines connect each node to the nodes it **reads from** (upstream) and the nodes that **read it** (downstream). Click a node for its details panel:

- **View source** — open where the signal was created.
- **Set breakpoint** — pause when the signal updates (Chromium browsers only).
- **Watch signal** — log updates and invalidations to the console.
- **Highlight upstream / downstream** — trace dependencies.

Use the search icon in the graph toolbar to find a node by name.

:::tip[Give your signals a `debugName`]
Nodes are labelled with their `debugName`. Effects in particular are rarely stored in a named field, so name them:

```ts
effect(
  () => {
    localStorage.setItem('likes', String(this.likes()));
  },
  { debugName: 'persistLikes' },
);
```
:::

The signal graph works for apps built with Angular 19 or later in development mode. Components without signals show *"No signals in this component"*.

## Profiler tab

The profiler records **change detection** so you can see what Angular renders and how long it takes.

1. Open **Profiler** and click the circle → **Start recording**.
2. Use the app (click, type, navigate).
3. Click the circle again → **Stop recording**.

### Read the results

- The top strip shows **one bar per change detection cycle**. Taller bars took longer.
- Select a bar to see the time spent, an estimated frame rate (when below 60 fps) and a **bar chart** of every component/directive checked in that cycle.
- Switch to the **flame graph** to see time by position in the component tree. Darker tiles took longer relative to the slowest tile; double-click a tile to zoom in.
- Tick **Change detection** above the flame graph to show only components that were actually checked — skipped ones (for example OnPush components that weren't marked dirty) turn gray.

Use **Save Profile** to export a recording as JSON and **Choose file** on the profiler start screen to import it later (handy for comparing before/after or sharing with a teammate).

### What to look for

| Symptom in the profiler | Likely cause | Fix |
|---|---|---|
| Many cycles while idle | Timers/polling writing state constantly | Reduce writes, debounce, move work out of the template. |
| One component dominates each cycle | Expensive template expressions | Use `computed()` or a pure pipe instead of calling methods that do heavy work. |
| Whole tree is checked every time | Components using `ChangeDetectionStrategy.Eager` | Remove `Eager` (OnPush is the default since v22) and use signals. |
| Large lists re-render | Unstable `track` expression | `@for (item of items(); track item.id)`. |

## Injector Tree tab

Shows two trees: the **environment injector** hierarchy (root/platform, route and lazy-loaded injectors) and the **element injector** hierarchy (components and directives with `providers`/`viewProviders`). Works with apps built with Angular 17+.

- Select an injector to highlight the **resolution path** Angular follows up to the root — including jumps from the element tree to the environment tree.
- Select an injector with providers to list them (token and provider type); use the button next to a provider to log it to the console.

Use it to answer "why do I get a *different* instance of this service here?" — usually a component- or route-level `providers` entry.

## Router Tree tab

Visualizes your route configuration. Select a route to see its details: **path** (or matcher), **component** (or redirect target), path match, data, resolvers, guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`), providers, title, `runGuardsAndResolvers`, and whether it is **active**, **auxiliary** (named outlet) or **lazy**. Properties only appear when configured.

Click the **Navigate** icon next to a path to make the app navigate there — quick for testing guards.

## From Chrome's Performance panel to DevTools

Angular also adds an **Angular track** to Chrome DevTools' **Performance** panel, showing components, change detection and lifecycle hooks next to the browser's own data.

1. Enable profiling: run `ng.enableProfiling()` in the console, or call it before bootstrapping:

   ```ts title="main.ts"
   import { enableProfiling } from '@angular/core';
   import { bootstrapApplication } from '@angular/platform-browser';
   import { App } from './app/app';
   import { appConfig } from './app/app.config';

   enableProfiling(); // dev mode only — remove when you're done
   bootstrapApplication(App, appConfig).catch((err) => console.error(err));
   ```

2. Record in the **Performance** panel. Colors: 🟦 your TypeScript code, 🟪 your templates, 🟩 entry points (why code ran).
3. **Deep link (since v22.1):** select a component event in the Angular track; the **Summary** tab shows a **Component** link (`angular-devtools://component/…`). Click it to open Angular DevTools with that component selected in the Components tab.

:::caution[Experimental Chrome flag]
Opening component links requires Angular DevTools for Chrome and Chrome's experimental flag `chrome://flags/#enable-devtools-deep-link-via-extensibility-api`.
:::

## Best practices

- **Name important signals and effects** with `debugName` so the graph is readable.
- **Profile, change one thing, profile again.** Export recordings to compare.
- **Reproduce with a development build.** Production builds can't be inspected.
- **Keep recordings short and focused** — long sessions use a lot of memory.
- **Remove `enableProfiling()`** before committing.

## Key takeaways

- The Components tab shows and edits state, `@defer` blocks and hydration status; `$ng0` gives you the selected instance in the console.
- The signal graph shows how signals, computeds and effects connect — with breakpoints and watch logging.
- The Profiler shows which components each change detection cycle checks and how long they take.
- Injector Tree and Router Tree explain DI and routing problems visually.
- `enableProfiling()` + Chrome's Performance panel adds an Angular track, with deep links into DevTools.

## Next steps

- [Debugging Angular apps](/tools/debugging/) — console utilities, error codes and test debugging
- [Signals](/modern/signals/) — the reactive model behind the signal graph
- [Performance](/advanced/performance/) — optimizations to verify with the profiler
- [Hydration](/ssr/hydration/) — what the hydration overlay is showing you
