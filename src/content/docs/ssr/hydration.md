---
title: Hydration 💧
description: How Angular hydration reuses server-rendered HTML - provideClientHydration, HTTP transfer cache, incremental hydration, ngSkipHydration and fixing NG05xx errors.
sidebar:
  order: 3
---

When a server-rendered or prerendered page reaches the browser, it's just HTML: it looks right but nothing reacts to clicks yet. **Hydration** is the step where Angular boots in the browser, **reuses the existing DOM** instead of rebuilding it, attaches event listeners and restores application state. Done right, the user never sees a flicker — the page simply becomes interactive.

## What you'll learn

- What hydration does and why it beats re-rendering from scratch
- How to enable it with `provideClientHydration()` and what it turns on by default
- How incremental hydration and event replay fit in (both on by default since v22)
- How the **HTTP transfer cache** avoids duplicate requests, and how to configure it
- The rules your templates must follow, how to fix common errors (NG0500–NG0507), and when to use `ngSkipHydration`

## Why hydration matters

Without hydration, Angular would throw away the server's DOM and render everything again in the browser. That causes a visible flash, layout shifts and wasted work. With hydration:

1. The server renders the page and **annotates** it: components get an `ngh` attribute and a JSON script (`<script id="ng-state">`) stores what Angular needs to match the DOM, plus cached HTTP responses.
2. The browser shows that HTML immediately.
3. Angular bootstraps, walks the existing DOM and **claims** each node for the matching part of your templates, attaching listeners as it goes.
4. Data that the server already fetched is taken from the page instead of being requested again.
5. Once the app is stable, Angular cleans up and the page behaves like a normal single-page app.

This improves Core Web Vitals such as Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS).

## Enabling hydration

If you created the project with `ng new --ssr` or ran `ng add @angular/ssr`, hydration is already on:

```ts title="src/app/app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
  ],
};
```

Hydration needs `provideClientHydration()` on **both** the server and the browser. The generated `app.config.server.ts` uses `mergeApplicationConfig(appConfig, serverConfig)`, so the server inherits it automatically. If you build the server config separately and forget it, the browser logs **NG0505** ("No hydration info in server response").

### What `provideClientHydration()` includes

| Feature | Default | Change it with |
|---|---|---|
| DOM hydration (reuse server DOM) | ✅ On | — |
| HTTP transfer cache | ✅ On | `withHttpTransferCacheOptions({...})`, `withNoHttpTransferCache()` |
| [Incremental hydration](/modern/incremental-hydration/) (`hydrate` triggers on `@defer`) | ✅ On (since v22) | `withNoIncrementalHydration()` |
| [Event replay](/ssr/event-replay/) | ✅ On (enabled by incremental hydration) | `withEventReplay()` re-enables it if you opted out of incremental hydration |
| Hydration of i18n blocks | ❌ Off | `withI18nSupport()` |
| Stability debugging logs | ✅ In dev mode only | `provideStabilityDebugging()` to add it elsewhere |

All `with…` functions are imported from `@angular/platform-browser` and passed as arguments:

```ts
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
  withI18nSupport,
  withNoIncrementalHydration,
} from '@angular/platform-browser';

provideClientHydration(
  withI18nSupport(),
  withHttpTransferCacheOptions({ includePostRequests: true }),
);

// Full (non-incremental) hydration, keeping event replay:
provideClientHydration(withNoIncrementalHydration(), withEventReplay());
```

:::note[Angular 21 and earlier]
Incremental hydration was opt-in with `withIncrementalHydration()`. In v22 it's the default and `withIncrementalHydration()` is **deprecated** — you can delete it. Apps generated before v22 often also contain `withEventReplay()`; it's harmless but no longer needed, because incremental hydration turns event replay on.
:::

### Check that hydration works

Run the app (`ng serve`) and open the browser console. In development mode Angular logs a summary such as:

```text
Angular hydrated 12 component(s) and 148 node(s), 0 component(s) were skipped. 3 defer block(s) were configured to use incremental hydration.
```

[Angular DevTools](/tools/devtools/) can also show the hydration status of each component and highlight the component that caused a mismatch.

## Incremental hydration (on by default)

With incremental hydration, `@defer` blocks that have a `hydrate` trigger are **rendered on the server** but stay **dehydrated** in the browser — their JavaScript isn't even downloaded — until the trigger fires:

```html
<app-product-header />

@defer (hydrate on viewport) {
  <app-reviews />
} @placeholder {
  <p>Reviews</p>
}

@defer (hydrate on interaction) {
  <app-size-picker />
} @placeholder {
  <p>Choose a size</p>
}
```

The user sees the full server HTML immediately, but the reviews code loads only when that section scrolls into view, and the size picker only when the user interacts with it. Available triggers include `hydrate on idle`, `viewport`, `interaction`, `hover`, `immediate`, `timer(…)`, `hydrate when <condition>` and `hydrate never`.

Read the full guide in [Incremental Hydration](/modern/incremental-hydration/).

## The HTTP transfer cache

Data fetched during server rendering would normally be fetched **again** in the browser while hydrating. The HTTP transfer cache prevents that: `HttpClient` requests made on the server (including `httpResource`) are serialised into the page, and the browser reuses those responses **until the app becomes stable** after hydration. After that, every request goes to the network as usual.

### What is cached by default

- `GET` and `HEAD` requests only.
- **Not** requests with `Authorization`, `Proxy-Authorization` or `Cookie` headers.
- **Not** requests sent `withCredentials` or with Fetch `credentials: 'include' | 'same-origin'`.
- **Not** requests or responses with `Cache-Control: no-store`, `no-cache` or `private`, requests with Fetch `cache: 'no-store' | 'no-cache'`, or responses with a `Set-Cookie` header.
- No response headers are kept unless you list them.

These defaults make sure one user's private data is never baked into HTML that could be served to someone else.

### Configuring it globally

```ts title="src/app/app.config.ts"
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

provideClientHydration(
  withHttpTransferCacheOptions({
    includeHeaders: ['ETag'],          // keep these response headers
    includePostRequests: true,         // e.g. GraphQL queries sent with POST
    filter: (req) => !req.url.includes('/api/cart'), // never cache the cart
  }),
);
```

| Option | Default | Use it when… |
|---|---|---|
| `filter: (req) => boolean` | cache all eligible | You want to exclude (or include only) specific URLs |
| `includeHeaders: string[]` | none | Your code reads response headers such as `ETag` |
| `includePostRequests` | `false` | `POST` is used for **read-only** queries (GraphQL) |
| `includeRequestsWithAuthHeaders` | `false` | Auth headers don't change the response (e.g. a public API key) |
| `includeRequestsWithCredentials` | `false` | Credentialed requests return data that's safe to embed in the page |
| `includeNonCacheableRequests` | `false` | You deliberately want to ignore `Cache-Control`/`Set-Cookie` restrictions |

`includeRequestsWithCredentials` and `includeNonCacheableRequests` were added in v22.1.

:::danger
Enabling the auth/credential/non-cacheable options can put **user-specific data into the HTML**. Only do it for pages that are never cached by a CDN or shared between users, and never include sensitive headers in `includeHeaders`.
:::

### Per-request control

```ts title="profile-api.ts"
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Service()
export class ProfileApi {
  private readonly http = inject(HttpClient);

  profile() {
    return this.http.get('/api/profile', { transferCache: false }); // never cached
  }

  catalog() {
    return this.http.get('/api/catalog', { transferCache: { includeHeaders: ['ETag'] } });
  }
}
```

### Disabling it completely

```ts
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser';

provideClientHydration(withNoHttpTransferCache());
```

Every request then runs twice: once on the server, once in the browser.

### Different API origins on server and browser

If the server calls your API on an internal address (`http://api.internal:8080`) but the browser uses the public one (`https://api.example.com`), the cache keys won't match. Map them with `HTTP_TRANSFER_CACHE_ORIGIN_MAP` — **in the server config only** (Angular throws if it's provided in the browser):

```ts title="src/app/app.config.server.ts"
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useValue: { 'http://api.internal:8080': 'https://api.example.com' },
    },
  ],
};
```

### Caching `resource()` data

`httpResource` uses `HttpClient`, so it's covered by the transfer cache. A plain `resource()` with a custom loader (for example `fetch` or a third-party SDK) isn't — give it an `id` and Angular stores its resolved value in `TransferState` on the server and starts the resource in the `'resolved'` state in the browser:

```ts
import { resource } from '@angular/core';

protected readonly quote = resource({
  loader: () => fetch('https://api.example.com/quote').then((r) => r.text()),
  id: 'quote-of-the-day', // unique, identical on server and browser
});
```

Like the HTTP cache, this embeds data in the HTML — don't set `id` on resources that load user-specific data. For other kinds of data, see [`TransferState`](/ssr/introduction/#sending-data-from-the-server-to-the-browser).

## The golden rule: same DOM on server and browser

Hydration only works if the browser's first render produces **exactly** the DOM the server produced — including the comment nodes and whitespace Angular emits. Things that break that:

### Direct DOM manipulation

Calling `appendChild`, setting `innerHTML`/`outerHTML`, moving or removing nodes with native APIs changes the DOM behind Angular's back. Use template features (`@if`, `@for`, bindings) instead. If a component *must* manipulate the DOM, do it in `afterNextRender` (which runs after hydration) or skip hydration for it.

### Content that differs between server and browser

```ts title="clock.ts"
import { Component, afterNextRender, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<time>{{ now() }}</time>`,
})
export class Clock {
  // ❌ signal(new Date().toLocaleTimeString()) would differ between server and browser
  // ✅ same initial value on both sides, then update in the browser
  protected readonly now = signal('');

  constructor() {
    afterNextRender(() => {
      this.now.set(new Date().toLocaleTimeString());
      setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
    });
  }
}
```

The same applies to `Math.random()`, `isPlatformBrowser()` in `@if`, reading `localStorage` during rendering, or showing a "logged in" state that only the browser knows.

### State copied once instead of derived

A frequent cause of **NG0501** is copying an input into a signal once (in `ngOnInit` or the constructor). Depending on timing, the copy may hold different values on the server and in the browser. Derive it instead:

```ts title="item-list.ts"
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-item-list',
  template: `
    @if (visibleItems().length) {
      <ul>
        @for (item of visibleItems(); track item) {
          <li>{{ item }}</li>
        }
      </ul>
    }
  `,
})
export class ItemList {
  readonly items = input<string[]>([]);
  // ✅ always in sync with the input, on every render
  protected readonly visibleItems = computed(() => this.items());
}
```

Use [`linkedSignal()`](/modern/linked-signals/) if the user must also be able to change the value locally.

### Invalid HTML

Browsers silently "fix" invalid HTML while parsing, so the DOM no longer matches what the server rendered. Watch out for:

- `<table>` without `<tbody>` (browsers insert one) — always write `<tbody>` explicitly,
- `<div>` (or other block elements) inside `<p>`,
- `<a>` inside another `<a>`.

### HTML changed after rendering

Some CDNs and HTML minifiers strip comments and whitespace. Angular needs them; turn that optimisation off. Otherwise you get **NG0507**.

### `preserveWhitespaces`

Keep the default (`false`). If you change it, use the same value for the browser and server builds.

## Skipping hydration with `ngSkipHydration`

If a component can't be fixed right away (for example it wraps a DOM-heavy third-party chart library), you can tell Angular to **destroy and re-render** it instead of hydrating it:

```html
<app-legacy-chart ngSkipHydration />
```

or permanently, from the component itself:

```ts title="legacy-chart.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-legacy-chart',
  template: `<div class="chart"></div>`,
  host: { ngSkipHydration: 'true' },
})
export class LegacyChart {}
```

- It only works on **component host elements**; anywhere else Angular throws **NG0504**.
- The component *and all its children* lose the benefits of hydration (and may flicker).
- Putting it on the root component effectively disables hydration for the whole app.

Treat it as a temporary workaround — fix the component, then remove the attribute.

## Common hydration errors

| Code | Meaning | Typical fix |
|---|---|---|
| **NG0500** | Node mismatch: the browser found a different node than the server rendered | Remove direct DOM manipulation / `innerHTML`; make server and browser render the same content; fix invalid HTML |
| **NG0501** | Missing siblings: fewer nodes than expected | Same as NG0500; derive state with `computed()` instead of copying it once |
| **NG0502** | Missing node | Same as NG0500 |
| **NG0503** | Nodes created with native DOM APIs were projected (e.g. via `createComponent` `projectableNodes`) | Create content with Angular templates, or skip hydration for that component |
| **NG0504** | `ngSkipHydration` used on a non-component element | Put it on a component's host element only |
| **NG0505** | Browser expects hydration data but the server response has none | Add `provideClientHydration()` to the server config too |
| **NG0506** | App didn't become stable within 10 seconds (warning) | Make sure pending tasks/requests finish; start timers and polling in `afterNextRender` |
| **NG0507** | HTML was modified after SSR (comments/whitespace removed) | Disable HTML minification in your CDN / post-processing |

In development, Angular prints the expected vs actual DOM and the component involved. [Angular DevTools](/tools/devtools/) highlights the offending component on the page.

## Application stability

Hydration finishes (and the transfer cache stops being used) once the app is **stable** — no pending HTTP requests, `resource` loads, or tasks registered with `PendingTasks`. Work that never finishes — a `PendingTasks` task that's never removed, a request that hangs, or (in Zone.js apps) a `setInterval`/`setTimeout` started during rendering — delays this and triggers **NG0506** after 10 seconds.

`provideClientHydration()` adds stability debugging in development mode: if the app takes too long to stabilise, the console lists the pending tasks. To use it in a production build temporarily, add it yourself:

```ts
import { provideStabilityDebugging } from '@angular/core';

providers: [provideClientHydration(), provideStabilityDebugging()],
```

Remove it again afterwards — it isn't tree-shaken from production bundles.

:::note[Zone.js apps]
Zoneless (the default since v21) works with hydration out of the box. Apps that still use Zone.js are supported too, but a custom or "noop" `NgZone` is not (warning **NG05000**). With Zone.js you can also import `zone.js/plugins/task-tracking` while debugging to see which macrotasks keep the zone busy.
:::

## Internationalisation (i18n)

Components that contain `i18n` blocks are **skipped** (re-rendered from scratch) by default. To hydrate them as well, add `withI18nSupport()`:

```ts
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';

provideClientHydration(withI18nSupport());
```

## Third-party scripts and libraries

- **Scripts that modify the page** (ads, A/B testing, some analytics) can run before hydration and change the DOM. Load them after hydration — for example from `afterNextRender` — so Angular finds the DOM it expects.
- **DOM-heavy libraries** (charts, maps, rich text editors) usually belong in `afterNextRender`, in a `@defer` block, or on a `RenderMode.Client` route. As a last resort, use `ngSkipHydration` on the wrapping component.

## Common mistakes

- Adding `withIncrementalHydration()` in new code — it's deprecated; incremental hydration is already on.
- Forgetting `provideClientHydration()` on the server (custom configs) → NG0505.
- Rendering `new Date()`, random values or browser-only state during the first render.
- Writing `<table>` without `<tbody>`.
- Letting a CDN minify HTML → NG0507.
- Turning on `includeRequestsWithAuthHeaders`/`includeRequestsWithCredentials` for pages that a CDN caches.
- Using `ngSkipHydration` as a permanent fix.

## Key takeaways

- Hydration reuses the server's DOM instead of re-rendering it; enable it with `provideClientHydration()` (the CLI does this for you).
- Since v22, `provideClientHydration()` also enables incremental hydration and event replay.
- The HTTP transfer cache prevents duplicate requests and, by default, skips anything with credentials or no-cache headers. Use `resource({ id })` for non-HTTP data.
- The server and browser must produce identical DOM: no direct DOM manipulation, no browser-only values during the first render, valid HTML.
- Use the NG05xx error codes and Angular DevTools to find mismatches; use `ngSkipHydration` only as a temporary workaround.

## Next steps

- [Incremental Hydration](/modern/incremental-hydration/) — `hydrate on …` triggers in depth
- [Event Replay](/ssr/event-replay/) — what happens to clicks before hydration finishes
- [Route-level Render Modes](/ssr/render-modes/) — choose SSR, SSG or CSR per route
- [SSR Introduction](/ssr/introduction/) — writing SSR-safe code
