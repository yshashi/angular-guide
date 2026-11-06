---
title: Debugging Angular Apps 🐛
description: Debug Angular 22 apps with browser DevTools, ng.* console utilities, NG error codes, provideStabilityDebugging, AI runtime tools, source maps and Vitest debugging.
sidebar:
  order: 4
---

Every developer spends a lot of time debugging. The good news: Angular gives you more help than most frameworks — readable error codes, console utilities, a browser extension and test debugging built into the CLI. This page is your toolbox, from "the UI isn't updating" to "the app never becomes stable".

## What you'll learn

- How to use browser DevTools and source maps with Angular
- The `ng.*` console utilities (`ng.getComponent`, `ng.applyChanges`, …)
- How to read `NG0xxx` / `NG8xxx` error codes and fix the most common ones
- How to debug signals, app stability (`provideStabilityDebugging`) and hydration
- What the dev-mode AI runtime debugging tools are
- How to debug Vitest unit tests and SSR server code

## Your debugging toolkit

| Tool | Best for |
|---|---|
| Browser DevTools (Elements, Console, Sources, Network) | DOM, breakpoints, network calls |
| `ng.*` console utilities | Reading/changing component state from the console |
| [Angular DevTools](/tools/devtools/) | Component tree, signal graph, profiler, injectors, routes |
| Error codes (`NG0201` …) | Understanding framework errors quickly |
| `provideStabilityDebugging()` | Finding what keeps the app "unstable" (SSR/hydration, tests) |
| `ng test --debug` | Stepping through unit tests |
| [VS Code debugger](/tools/vscode/#debug-the-app-in-vs-code) | Breakpoints in your editor |

:::note[Dev mode vs. production]
Most debugging help — descriptive error messages, `ng.*` utilities, Angular DevTools — exists only in **development mode** (`ng serve`, `ng build -c development`). Production builds strip it to keep bundles small and show only short error codes.
:::

## Browser DevTools essentials

- **Elements** — inspect the rendered DOM. Right-click a node → *Break on → subtree modifications* to catch unexpected DOM changes. Selecting a node makes it available as `$0` in the console.
- **Console** — logs and the `ng.*` utilities. `console.table(items)` prints arrays nicely; `console.trace()` prints the call stack.
- **Network** — filter by *Fetch/XHR* to see API calls (Angular's `HttpClient` uses `fetch` by default since v22). Check status, headers, payload and timing; use throttling to simulate slow networks.
- **Sources** — set breakpoints in your TypeScript files (press `Cmd/Ctrl+P` and type the file name, e.g. `user-card.ts`).

### Breakpoints

| Type | How | When |
|---|---|---|
| Line | Click the line number in Sources | Pause at a line |
| Conditional | Right-click line → *Add conditional breakpoint* (e.g. `user.id === 42`) | Pause only for one item in a loop |
| Logpoint | Right-click line → *Add logpoint* | Log without editing code |
| `debugger;` statement | Write it in code | Quick, but don't commit it |
| DOM | Elements → *Break on* | Find who changes the DOM |
| XHR/fetch | Sources → *XHR/fetch Breakpoints* | Pause when a URL is requested |
| Event listener | Sources → *Event Listener Breakpoints* | Pause on `click`, `keydown`… |

### Source maps

The `development` configuration (used by `ng serve`) has `"sourceMap": true`, so breakpoints and stack traces point to your `.ts` and `.html` files. For production you can generate source maps for error-reporting tools without exposing them to users:

```json title="angular.json (production configuration)"
"sourceMap": {
  "scripts": true,
  "styles": false,
  "hidden": true
}
```

`hidden: true` creates the `.map` files but doesn't reference them from the bundles. Upload them to your error tracker and **don't deploy them** to your public server.

## Angular console utilities (`ng.*`)

In development mode Angular adds a global `ng` object to the page. Select an element in the **Elements** panel, then use `$0` in the console:

```js
const cmp = ng.getComponent($0);   // the component instance whose host element is $0
cmp.count();                       // read a signal
cmp.count.set(10);                 // write a signal — the view updates automatically
```

| Utility | Returns |
|---|---|
| `ng.getComponent(element)` | The component instance whose host element is `element` (or `null`). |
| `ng.getOwningComponent(elementOrDirective)` | The component whose **template** contains the element. |
| `ng.getDirectives(element)` | Directive instances on the element (not the component). |
| `ng.getContext(element)` | The template context, e.g. the `@for` item and `$index` for a repeated element. |
| `ng.getHostElement(componentOrDirective)` | The host DOM element of an instance. |
| `ng.getInjector(elementOrDirective)` | The injector at that element. |
| `ng.getListeners(element)` | Event listeners Angular registered on the element (name, callback, …). |
| `ng.getRootComponents(elementOrDirective)` | The root component(s) of the app. |
| `ng.getDirectiveMetadata(instance)` | Inputs, outputs, encapsulation and change detection of a component/directive. |
| `ng.applyChanges(component)` | Marks the component for check and runs change detection. |
| `ng.isSignal(value)` | `true` if the value is a signal. |
| `ng.enableProfiling()` | Adds Angular data to Chrome's Performance panel ([DevTools](/tools/devtools/#from-chromes-performance-panel-to-devtools)). |

If you changed a **plain (non-signal) field** from the console, call `ng.applyChanges` to refresh the view:

```js
const cmp = ng.getComponent($0);
cmp.title = 'Changed from the console';
ng.applyChanges(cmp);              // pass the component instance, not the element
```

:::tip
With Angular DevTools open, `$ng0` is the component you selected in the **Components** tab — often faster than `ng.getComponent($0)`.
:::

## Reading Angular error codes

Angular errors start with a code like `NG0201`. In dev mode you get a full message plus a link; in production only the code. Look up any code at `https://angular.dev/errors/NG0201` (replace the code).

- `NG0xxx` — **runtime** errors (in the browser console).
- `NG1xxx`–`NG8xxx` — **compile-time** errors from `ng build`/`ng serve` and your editor.
- `NG81xx` — **extended diagnostics**: warnings about code that compiles but is probably wrong.

### Common runtime errors

| Code | Meaning | Typical fix |
|---|---|---|
| `NG0100` | *Expression changed after it was checked* (dev mode only) | Don't change state during rendering; derive it with `computed()`. |
| `NG0200` | Circular dependency in DI | Two services inject each other — extract the shared logic into a third. |
| `NG0201` | No provider found | Use `@Service()` / `providedIn: 'root'`, or add the provider to `appConfig` / the route / the component. |
| `NG0203` | `inject()` called outside an injection context | Call `inject()` in a field initializer or constructor, or use `runInInjectionContext()`. |
| `NG0301` | Export not found (`#ref="ngModel"` etc.) | Import the directive that declares that `exportAs` name. |
| `NG0302` | Pipe not found | Add the pipe to the component's `imports`. |
| `NG0500`–`NG0507` | Hydration problems (node mismatch, missing node, DOM changed after SSR…) | See [hydration issues](#hydration-mismatches) below. |
| `NG0506` | Application remains unstable | Use [`provideStabilityDebugging()`](#app-never-becomes-stable). |
| `NG0600` | Signal written inside `computed()` or a template | Move the write to an event handler or an `effect()`; use `linkedSignal()` for resettable state. |
| `NG0919` | Circular dependency between components/directives/pipes | Break the `imports` cycle (extract a shared component). |
| `NG0950` | Required input read before it was set | Don't read `input.required()` in the constructor or field initializers; read it in `computed()`, the template, or later lifecycle hooks. |
| `NG0955` / `NG0956` | `@for` `track` has duplicate keys / re-creates the DOM | Track a unique, stable id: `track item.id`. |

### Common compile-time errors

| Code | Meaning | Typical fix |
|---|---|---|
| `NG8001` | Unknown element `<app-x>` | Import the component in `imports: [...]` (check the selector spelling). |
| `NG8002` | Can't bind to `x` since it isn't a known property | Import the directive, or check the input name. |
| `NG8003` | No directive found with `exportAs` | Import the directive used in `#ref="…"`. |
| `NG2003` | No injection token for a constructor parameter | Use `inject()` or provide a token for the type. |
| `NG8109` | Signal not invoked in interpolation (`{{ count }}`) | Write `{{ count() }}`. |
| `NG8111` / `NG8117` | Function not invoked in an event binding / interpolation | `(click)="save()"`, `{{ total() }}`. |
| `NG8113` | Unused standalone import | Remove it from `imports`. |
| `NG8101` | Invalid banana-in-box `([x])` | Use `[(x)]`. |

## Debugging signals

### Name your signals

A `debugName` appears in Angular DevTools' signal graph and in some error messages:

```ts
protected readonly cart = signal<CartItem[]>([], { debugName: 'cart' });
protected readonly total = computed(() => sum(this.cart()), { debugName: 'total' });
```

### Log when something re-runs

```ts title="counter.ts"
import { Component, computed, effect, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>{{ count() }} × 2 = {{ double() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class Counter {
  protected readonly count = signal(0, { debugName: 'count' });
  protected readonly double = computed(
    () => {
      console.log('double recomputed');
      return this.count() * 2;
    },
    { debugName: 'double' },
  );

  constructor() {
    effect(() => console.log('count changed to', this.count()), { debugName: 'logCount' });
  }

  protected increment() {
    this.count.update((c) => c + 1);
  }
}
```

The `computed` log should appear only when `count` changes **and** something reads `double`. If an effect runs too often, it is reading more signals than you think — wrap reads that shouldn't be tracked in `untracked()`.

### Common signal problems

| Symptom | Cause | Fix |
|---|---|---|
| View doesn't update | A plain field changed (zoneless + OnPush don't see it) | Make it a `signal()` and use `.set()` / `.update()`. |
| View doesn't update after `push()` | The array was mutated; the signal value is the same reference | `items.update((list) => [...list, item])`. |
| `{{ count }}` shows `[Signal: 0]` | Signal not called | `{{ count() }}` (extended diagnostic `NG8109`). |
| `NG0600` | Writing a signal inside `computed()`/template | Derive values instead of writing them. |

## App never becomes stable

Angular considers an app **stable** when no pending work remains. Hydration, `ApplicationRef.whenStable()`, SSR rendering and `fixture.whenStable()` all wait for it. If something never finishes (an endless `setInterval`, a never-resolving promise, a long-polling request started at startup), you'll see `NG0506: Application remains unstable` or a page that never hydrates.

`provideStabilityDebugging()` (since v21.1) logs **which pending tasks are blocking stability, with stack traces**, if the app hasn't stabilized within about 9 seconds:

```ts title="main.ts"
import { provideStabilityDebugging } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, {
  ...appConfig,
  providers: [...appConfig.providers, provideStabilityDebugging()],
}).catch((err) => console.error(err));
```

- It is **already on in dev mode when you use `provideClientHydration()`** — add it manually for production bundles or SSR without hydration.
- For apps that still use Zone.js, also add `import 'zone.js/plugins/task-tracking';` to see which macrotasks keep the zone busy.
- Neither is removed from production bundles. Use them **temporarily**, then remove them.

Typical fixes: start polling only after the app is stable or only in the browser (`afterNextRender`), and give long-running work a clear end.

## Hydration mismatches

With SSR, the browser must find exactly the DOM the server produced. Common causes of `NG0500`–`NG0507`:

- Browser-only APIs (`window`, `localStorage`) or random/time-based values used during rendering
- Invalid HTML nesting (e.g. `<div>` inside `<p>`) that the browser "fixes"
- Third-party scripts or CDNs that change the HTML before Angular hydrates

Render browser-only values after the first render:

```ts title="clock.ts"
import { Component, afterNextRender, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<p>{{ time() }}</p>`,
})
export class Clock {
  protected readonly time = signal('');

  constructor() {
    afterNextRender(() => this.time.set(new Date().toLocaleTimeString()));
  }
}
```

Angular DevTools shows the hydration status of each component and can overlay hydrated areas. See [Hydration](/ssr/hydration/) for more.

## AI runtime debugging tools (dev mode)

Since v22, a development build of Angular registers two **in-page tools** that browser-integrated AI assistants can discover and call while you debug:

| Tool | What it returns |
|---|---|
| `angular:di_graph` | The element and environment injector trees with their providers and resolved values. |
| `angular:signal_graph` | The signals, computeds and effects (with current values) that a component's template and effects depend on. |

Angular announces them in response to the browser's `devtoolstooldiscovery` event. You don't write any code — when an AI debugging assistant in your browser's DevTools supports this kind of tool discovery, it can inspect your app's DI and signal state instead of guessing. They are never registered in production builds.

:::note
This is complementary to the Angular CLI MCP server (`ng mcp`), which helps AI assistants with your **source code** — see [VS Code setup](/tools/vscode/#ai-assistants-and-the-angular-mcp-server).
:::

## Common scenarios

### UI not updating

New apps are zoneless and components are OnPush by default (v22), so Angular updates the view when a **signal it reads** changes, an **input** changes, a template **event** fires, or an `async` pipe emits.

1. Is the state a signal (or an input)? Plain fields changed in a `setTimeout` or subscription won't refresh the view.
2. Did you replace the value (`update(list => [...list, x])`) rather than mutate it?
3. Use the DevTools profiler with the *Change detection* checkbox to confirm whether the component was checked.

### Routing problems

Log every router event to the console while you debug:

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withDebugTracing()), // remove before committing
  ],
};
```

Also check the [Router Tree](/tools/devtools/#router-tree-tab) in Angular DevTools, that `**` is the **last** route, and what your guards return (log inside them).

### HTTP errors

Check the Network panel first. For app-wide logging, add a functional interceptor:

```ts title="logging-interceptor.ts"
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`${req.method} ${req.urlWithParams} → ${event.status} in ${Math.round(performance.now() - started)} ms`);
        }
      },
      error: (error) => console.error(`${req.method} ${req.urlWithParams} failed`, error),
    }),
  );
};
```

Register it with `provideHttpClient(withInterceptors([loggingInterceptor]))`.

### Memory leaks

Use the **Memory** panel: take a heap snapshot, navigate away and back a few times, take another, and compare. Usual suspects are subscriptions, timers and global event listeners that outlive their component. Tie them to the component's lifetime:

```ts title="ticker.ts"
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-ticker',
  template: `<p>{{ ticks() }}</p>`,
})
export class Ticker {
  protected readonly ticks = signal(0);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.ticks.update((t) => t + 1));

    const onResize = () => console.log(window.innerWidth);
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  }
}
```

Even simpler: prefer `toSignal()`, `resource()`/`httpResource()` and `host: { '(window:resize)': '…' }` listeners — Angular cleans those up for you.

## Debugging unit tests (Vitest)

```bash
ng test --debug                       # pause and wait for a debugger (Node inspector)
ng test --filter "Cart"               # only tests whose name matches
ng test --include src/app/cart        # only one folder or file
ng test --ui                          # Vitest UI in the browser
ng test --browsers ChromiumHeadless   # real browser (Vitest browser mode)
```

With `--debug`, tests run in a single process and stop at the first line until a debugger attaches. Attach with VS Code (a Node *attach* configuration on port `9229`, or simply run `ng test` from a **JavaScript Debug Terminal**) or with Chrome at `chrome://inspect`. In browser mode, `--debug` waits for you to open the browser's DevTools instead. While debugging, TestBed's automatic teardown is turned off, so rendered test components stay in the DOM for you to inspect.

Tips:

- Put `debugger;` or a breakpoint in the spec or the component.
- Use `it.only(...)` / `describe.only(...)` temporarily to focus.
- Print the rendered DOM: `console.log(fixture.nativeElement.innerHTML)`.
- Remember `await fixture.whenStable()` in zoneless tests before asserting.

See [Unit testing](/testing/unit-testing/) for writing tests.

## Debugging SSR server code

Run the dev server with the Node inspector to debug code that runs on the server (route `resolve`rs, server-side HTTP calls, `server.ts`):

```bash
ng serve --inspect          # then open chrome://inspect or attach your editor
```

`--inspect` only has an effect when SSR or SSG is enabled.

## Build and tooling problems

```bash
ng build --verbose      # more detail about what the build is doing
ng cache clean          # clear .angular/cache when a build behaves strangely
NG_DEBUG=1 ng build     # extra CLI debug messages
```

Read errors from the top: the first error is often the cause of the rest. Each Angular compile error includes the file, line and `NG` code.

## Best practices

- Reproduce in **development mode** first — you get full messages, `ng.*` and DevTools.
- Prefer **logpoints and breakpoints** over `console.log` edits you might forget to remove.
- Give important signals and effects a **`debugName`**.
- Remove `withDebugTracing()`, `enableProfiling()` and `provideStabilityDebugging()` when you're done.
- Turn every bug you fix into a **unit test** so it can't come back.

## Key takeaways

- `ng.getComponent($0)` and `$ng0` give you live component instances in the console; `ng.applyChanges(instance)` refreshes non-signal state.
- Angular error codes are searchable: `angular.dev/errors/NGxxxx`.
- Most "UI not updating" bugs in v22 are non-signal state or in-place mutation.
- `provideStabilityDebugging()` tells you exactly which pending task blocks stability.
- `ng test --debug` and `ng serve --inspect` let you step through tests and server code.

## Next steps

- [Angular DevTools](/tools/devtools/) — signal graph, profiler, injector and router trees
- [VS Code setup](/tools/vscode/) — debug from your editor
- [Zoneless](/modern/zoneless/) — how change detection is scheduled without zone.js
- [Troubleshooting](/resources/troubleshooting/) — more common problems and fixes
