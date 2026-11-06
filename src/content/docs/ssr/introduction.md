---
title: Server-Side Rendering (SSR) 🌐
description: Learn Angular SSR with @angular/ssr - CSR vs SSR vs SSG, setup, generated files, browser-only code, data transfer, security and deployment.
sidebar:
  order: 1
---

By default, an Angular app is **client-side rendered**: the browser downloads an almost empty `index.html`, then downloads and runs your JavaScript before anything appears on screen. **Server-side rendering (SSR)** and **prerendering (SSG)** flip that around: real HTML is produced *before* it reaches the browser, so users (and search engines) see content immediately. Angular then **hydrates** that HTML to make it interactive.

Everything you need is built into the Angular CLI through the `@angular/ssr` package. This page explains the concepts, walks through every generated file, and shows how to write code that works on both the server and the browser.

## What you'll learn

- The difference between CSR, SSR and SSG (prerendering), and when to use each
- How to add SSR to a new or existing project and what every generated file does
- How to run the dev server, build, and run the production Node.js server
- How to write "SSR-safe" code: `afterNextRender`, `DOCUMENT`, `isPlatformBrowser` and platform-specific services
- How data is transferred from the server to the browser (HTTP transfer cache, `resource` `id`, `TransferState`)
- How to secure your server (`allowedHosts`, trusted proxy headers) and customise `server.ts`

## CSR, SSR and SSG in one picture

| | **CSR** (client-side rendering) | **SSR** (server-side rendering) | **SSG** (static site generation / prerendering) |
|---|---|---|---|
| When is HTML created? | In the browser, after JS runs | On the server, **for every request** | At **build time**, once |
| First paint | Slowest (wait for JS) | Fast | Fastest (static file) |
| SEO / link previews | Weak | Excellent | Excellent |
| Per-user content on first load | ✅ | ✅ (cookies, headers) | ❌ (same HTML for everyone) |
| Needs a running server | No (static hosting) | **Yes** (Node.js or edge runtime) | No (static hosting / CDN) |
| Server cost | None | Highest | None per request |
| Typical pages | Dashboards, admin panels, pages behind login | Product pages, search results, feeds | Landing pages, blogs, docs, marketing |

With SSR and SSG the user sees content before the JavaScript has loaded. Once the JavaScript loads, Angular **hydrates** the page — it reuses the existing DOM, attaches event listeners and from then on the app behaves like a normal single-page application (later navigations happen in the browser, without asking the server for HTML).

:::tip[Hybrid rendering]
You don't have to choose one strategy for the whole app. Angular supports **hybrid rendering**: each route can use SSR, SSG or CSR. For example, `/` and `/blog/*` prerendered, `/products/:id` server-rendered, and `/dashboard` client-rendered. See [Route-level Render Modes](/ssr/render-modes/).
:::

### When should I use SSR or SSG?

- **Use SSG (prerendering)** when the page is the same for every visitor and changes only when you deploy: home page, docs, blog posts, pricing.
- **Use SSR** when the page must be fresh or personalised on the *first* load and must be indexable: product details with live stock, search results, news.
- **Use CSR** when SEO doesn't matter and the page relies heavily on browser APIs or the user being logged in: dashboards, editors, settings.

## Adding SSR to a project

### New project

```bash
ng new my-app --ssr
```

### Existing project

```bash
ng add @angular/ssr
```

Both commands do the same thing:

- Install `@angular/ssr`, `@angular/platform-server`, `express` (v5) and its types (`@types/express`, `@types/node`).
- Create `src/server.ts`, `src/main.server.ts`, `src/app/app.config.server.ts` and `src/app/app.routes.server.ts`.
- Add `provideClientHydration()` to `src/app/app.config.ts`.
- Update the `build` target in `angular.json` and add a `serve:ssr:<project>` script to `package.json`.

The `angular.json` changes look like this:

```json title="angular.json (build options)"
{
  "browser": "src/main.ts",
  "server": "src/main.server.ts",
  "outputMode": "server",
  "ssr": {
    "entry": "src/server.ts"
  },
  "security": {
    "allowedHosts": []
  }
}
```

| Option | Meaning |
|---|---|
| `server` | Entry point that bootstraps Angular on the server (`main.server.ts`). |
| `outputMode` | `"server"` builds a Node.js server **and** prerenders pages. `"static"` prerenders pages only (no server). See [Static Site Generation](/ssr/static-generation/). |
| `ssr.entry` | Your HTTP server file (`server.ts`). |
| `ssr.platform` | Optional: `"node"` (default) or `"neutral"` for edge/serverless runtimes that aren't Node.js. |
| `security.allowedHosts` | Host names that may access the server. **Required in production** (see [Security](#security-allowed-hosts-and-proxy-headers)). |

:::note
Angular Universal (`@nguniversal/*`) no longer exists. Everything moved into the Angular CLI and the `@angular/ssr` package years ago. If you find a tutorial using `@nguniversal/express-engine` or `ngExpressEngine`, it is outdated.
:::

## A tour of the generated files

### `app.config.ts` — browser providers (with hydration)

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

`provideClientHydration()` turns on hydration, the HTTP transfer cache, incremental hydration and event replay. Learn more in [Hydration](/ssr/hydration/).

### `app.routes.server.ts` — how each route renders

```ts title="src/app/app.routes.server.ts"
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
```

The generated config **prerenders every route** at build time. That's a safe default for static pages, but you will usually change it — for example, routes with parameters like `products/:id` need either `RenderMode.Server` or a `getPrerenderParams` function, otherwise the build fails. Everything about this file is covered in [Route-level Render Modes](/ssr/render-modes/).

### `app.config.server.ts` — server-only providers

```ts title="src/app/app.config.server.ts"
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

The server config **extends** the browser config, so every browser provider (router, HTTP client, hydration…) is also available on the server. Add providers here that should only exist on the server.

### `main.server.ts` — bootstrapping on the server

```ts title="src/main.server.ts"
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
```

The server calls this function once per render. The `BootstrapContext` it receives keeps each request's platform isolated from the others.

:::note[Angular 20 and earlier]
Older projects exported `const bootstrap = () => bootstrapApplication(App, config);` without a context. Angular 21 made the `context` parameter required; `ng update` migrates `main.server.ts` for you.
:::

### `server.ts` — the HTTP server

```ts title="src/server.ts"
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Example REST endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 1. Serve static files (JS, CSS, images) from /browser
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// 2. Let Angular handle everything else
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

// 3. Start listening only when this file is run directly (node server.mjs) or via PM2
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// 4. Used by `ng serve` and the build (route extraction / prerendering)
export const reqHandler = createNodeRequestHandler(app);
```

| API (from `@angular/ssr/node`) | What it does |
|---|---|
| `AngularNodeAppEngine` | The rendering engine. Create **one** instance. `handle(req)` serves a prerendered page, renders a page on the server, or returns the CSR shell — depending on the route's render mode. Resolves to `null` when no Angular route matches. |
| `writeResponseToNodeResponse(response, res)` | Streams the web-standard `Response` returned by `handle()` into Node's response. |
| `isMainModule(import.meta.url)` | `true` when the file is executed directly with `node`, so the server only listens in production. |
| `createNodeRequestHandler(app)` | Marks your Express app as the request handler. `ng serve` uses this export, so your API routes also work during development. |

The `angularApp.handle()` middleware is registered **last**: static files and your own API routes get the first chance to answer.

## Running your SSR app

### Development

```bash
ng serve
```

The dev server renders pages on the server using your `server.ts`. Routes marked as `Prerender` are rendered on demand when you request them (instead of prerendering the whole app on every change). Open DevTools → **View page source** to see the server HTML.

### Production build and server

```bash
ng build
npm run serve:ssr:my-app   # runs: node dist/my-app/server/server.mjs
```

The build output looks like this:

```text
dist/my-app/
├── browser/                   # static assets: JS, CSS, images, prerendered HTML
│   ├── index.csr.html         # empty shell used for client-rendered routes
│   ├── index.html             # prerendered "/" (if prerendered)
│   └── about/index.html       # prerendered "/about"
├── server/
│   └── server.mjs             # your compiled server.ts — start this with node
└── prerendered-routes.json    # list of routes that were prerendered
```

To deploy, copy **both** `browser/` and `server/` to the machine and run `node dist/my-app/server/server.mjs` (set the `PORT` environment variable to change the port). See [Deployment Strategies](/deployment/strategies/) and [Docker](/deployment/docker/) for hosting options.

:::caution[Getting "400 Bad Request" locally?]
Since v22, the production server rejects requests whose `Host` header isn't in `allowedHosts` — and the generated list is empty. When you test the production build on your machine, either add `"localhost"` to `security.allowedHosts` or start the server with:

```bash
NG_ALLOWED_HOSTS=localhost node dist/my-app/server/server.mjs
```

`ng serve` always allows its own host, so this only affects the built server.
:::

## How a request flows

1. The browser requests `/products/42`.
2. Express tries `express.static` (no file matches) and your API routes (no match).
3. `angularApp.handle(req)` validates the host, matches `products/:id` in your **server routes**, and sees `RenderMode.Server`.
4. Angular bootstraps the app on the server, navigates to `/products/42`, waits until the app is **stable** (all HTTP requests and pending tasks are done), serialises the DOM to HTML and adds hydration data plus the HTTP transfer cache.
5. The browser shows the HTML immediately, downloads the JavaScript, and Angular **hydrates** the page.

## Writing SSR-safe code

On the server there is **no browser**: no `window`, no `localStorage`, no layout (`getBoundingClientRect` returns zeros), no `IntersectionObserver`. Code that touches these will crash or behave differently during server rendering. Use the tools below.

### 1. `afterNextRender` / `afterEveryRender` for DOM and browser APIs

These hooks **never run on the server**. They run in the browser after Angular has rendered — the perfect place for measuring elements, initialising third-party widgets, or reading `localStorage`.

```ts title="chart-box.ts"
import { Component, ElementRef, afterNextRender, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-chart-box',
  template: `<div #box class="box">Width: {{ width() }}px</div>`,
})
export class ChartBox {
  private readonly box = viewChild.required<ElementRef<HTMLDivElement>>('box');
  protected readonly width = signal(0);

  constructor() {
    afterNextRender(() => {
      // Runs only in the browser, once, after the first render
      this.width.set(this.box().nativeElement.getBoundingClientRect().width);
    });
  }
}
```

### 2. Inject `DOCUMENT` instead of using the global `document`

On the server Angular provides a server-side DOM implementation. Inject it with the `DOCUMENT` token (exported from `@angular/core`) and your code works on both platforms:

```ts title="canonical-link.ts"
import { DOCUMENT, Service, inject } from '@angular/core';

@Service()
export class CanonicalLink {
  private readonly document = inject(DOCUMENT);

  set(href: string): void {
    const link = this.document.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    this.document.head.appendChild(link);
  }
}
```

For `<title>` and `<meta>` tags, use the built-in `Title` and `Meta` services from `@angular/platform-browser` — they work during SSR, so crawlers see your tags:

```ts title="seo.ts"
import { Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Service()
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  update(pageTitle: string, description: string): void {
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
  }
}
```

### 3. `isPlatformBrowser` for small runtime checks

```ts title="theme-toggle.ts"
import { Component, DOCUMENT, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  template: `<button type="button" (click)="toggle()">Toggle theme</button>`,
})
export class ThemeToggle {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected toggle(): void {
    this.document.body.classList.toggle('dark');
    if (this.isBrowser) {
      localStorage.setItem('theme', this.document.body.classList.contains('dark') ? 'dark' : 'light');
    }
  }
}
```

:::caution
Don't use `isPlatformBrowser` inside `@if` to show **different content** on the server and in the browser. The HTML won't match during hydration, causing hydration errors and layout shifts. Render the same thing on both sides and update it in `afterNextRender` if needed.
:::

### 4. Platform-specific services (cleanest for bigger differences)

When the browser and server need different behaviour, define an abstract class and provide a different implementation in each config:

```ts title="analytics.ts"
import { Injectable } from '@angular/core';

export abstract class Analytics {
  abstract track(event: string): void;
}

@Injectable()
export class BrowserAnalytics implements Analytics {
  track(event: string): void {
    navigator.sendBeacon('/analytics', event);
  }
}

@Injectable()
export class ServerAnalytics implements Analytics {
  track(event: string): void {
    console.log(`[ssr] ${event}`);
  }
}
```

```ts title="app.config.ts"
providers: [{ provide: Analytics, useClass: BrowserAnalytics }],
```

```ts title="app.config.server.ts"
providers: [{ provide: Analytics, useClass: ServerAnalytics }],
```

Components simply `inject(Analytics)` and never need an `if`.

### Server providers live across requests

On the server, top-level providers configured with `useValue` keep the **same value for every request** until the server restarts. If you need a fresh value per request, use `useFactory` — the factory runs for each render. Also avoid module-level mutable variables (`let cache = …` at the top of a file): they are shared between all users.

## Waiting for async work

Angular serialises the page when the app becomes **stable**. `HttpClient`, `httpResource` and `resource` already tell Angular "I'm still loading", so their data is included in the HTML. Work Angular doesn't know about (a raw `fetch` inside a `setTimeout`, a third-party SDK callback) must be wrapped with `PendingTasks`:

```ts
import { PendingTasks, inject } from '@angular/core';

const pendingTasks = inject(PendingTasks);

pendingTasks.run(async () => {
  const stats = await loadStats();
  this.visitors.set(stats.visitors);
});
```

Zoneless apps (the default since v21) rely entirely on this mechanism. If the app never becomes stable — a pending task that's never released, a request that hangs, or (in Zone.js apps) a `setInterval` started during rendering — the browser logs [NG0506](/ssr/hydration/#common-hydration-errors). Start timers and polling in `afterNextRender` so they only run in the browser.

## Accessing the request and response

During **server rendering** (`RenderMode.Server`) you can inject the incoming request and shape the response. These tokens come from `@angular/core`:

| Token | Type | Use it for |
|---|---|---|
| `REQUEST` | `Request \| null` | Read headers, cookies, URL |
| `RESPONSE_INIT` | `ResponseInit \| null` | Set the status code or headers dynamically |
| `REQUEST_CONTEXT` | `unknown` | Extra data you pass as the 2nd argument of `angularApp.handle(req, context)` |

```ts title="not-found.ts"
import { Component, RESPONSE_INIT, inject } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `<h1>Page not found</h1>`,
})
export class NotFound {
  constructor() {
    const responseInit = inject(RESPONSE_INIT);
    if (responseInit) {
      responseInit.status = 404; // a real 404 for crawlers
    }
  }
}
```

```ts title="greeting.ts"
import { Component, REQUEST, inject } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<p>Your language: {{ language }}</p>`,
})
export class Greeting {
  private readonly request = inject(REQUEST);
  protected readonly language =
    this.request?.headers.get('accept-language')?.split(',')[0] ?? 'unknown';
}
```

:::caution
These tokens are `null` in the browser, during prerendering (SSG), during the build, and for client-rendered routes. Always handle `null`.
:::

## Sending data from the server to the browser

Without help, data fetched during SSR would be fetched **again** in the browser during hydration. Angular avoids this in three ways:

1. **HTTP transfer cache (automatic).** With `provideClientHydration()`, `GET` and `HEAD` requests made with `HttpClient` (including `httpResource`) on the server are stored in the page and reused in the browser. Requests with `Authorization`/`Cookie` headers or credentials are skipped by default. All options are covered in [Hydration → HTTP transfer cache](/ssr/hydration/#the-http-transfer-cache).
2. **`resource` with an `id`.** For a `resource` whose loader doesn't use `HttpClient`, set a unique `id` and Angular transfers its resolved value:

   ```ts
   protected readonly quote = resource({
     loader: () => fetch('https://api.example.com/quote').then((r) => r.text()),
     id: 'quote-of-the-day',
   });
   ```

3. **`TransferState` (manual).** For anything else, store a value under a key on the server and read it in the browser:

   ```ts title="stats.ts"
   import { Component, PendingTasks, TransferState, inject, makeStateKey, signal } from '@angular/core';

   const STATS_KEY = makeStateKey<{ visitors: number }>('stats');

   @Component({
     selector: 'app-stats',
     template: `<p>Visitors: {{ visitors() }}</p>`,
   })
   export class Stats {
     private readonly transferState = inject(TransferState);
     private readonly pendingTasks = inject(PendingTasks);
     protected readonly visitors = signal(0);

     constructor() {
       const cached = this.transferState.get(STATS_KEY, null);
       if (cached) {
         this.visitors.set(cached.visitors); // browser: reuse server data
         this.transferState.remove(STATS_KEY);
         return;
       }
       this.pendingTasks.run(async () => {
         const stats = await loadStats(); // server (or browser without cache)
         this.visitors.set(stats.visitors);
         this.transferState.set(STATS_KEY, stats);
       });
     }
   }
   ```

:::danger
Transferred data is written into the HTML as JSON. Never transfer secrets, and don't put user-specific data in pages that a CDN might cache and serve to other users.
:::

### Response size limit

During SSR, `HttpClient` (Fetch backend) limits each response body to **1 MB** to protect your server's memory. Larger responses fail with error `NG02825`. Raise the limit only if you must:

```ts title="app.config.server.ts"
provideServerRendering({ maxResponseBodySize: 5 * 1024 * 1024 }, withRoutes(serverRoutes)),
```

## Security: allowed hosts and proxy headers

The server builds absolute URLs (for example for relative `HttpClient` requests) from the request's `Host` header. An attacker could send a fake `Host` to make your server call a URL they control — a **Server-Side Request Forgery (SSRF)** attack. Angular prevents this by validating every request:

- `Host` and `X-Forwarded-Host` must match `allowedHosts`. **Since v22, unknown hosts get a `400 Bad Request`** (previously the server silently fell back to client-side rendering).
- `Forwarded` and all `X-Forwarded-*` headers are **ignored and removed** unless you explicitly trust them.

Configure the hosts your app is served from:

```json title="angular.json (build options)"
"security": {
  "allowedHosts": ["example.com", "*.example.com"]
}
```

Or in code / environment variables:

```ts title="server.ts"
const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['example.com', '*.example.com'],
  trustProxyHeaders: ['forwarded'], // only if a trusted proxy sets it
});
```

```bash
NG_ALLOWED_HOSTS="example.com,*.example.com"
NG_TRUST_PROXY_HEADERS="x-forwarded-host,x-forwarded-proto"
```

- `*.example.com` allows all subdomains. `"*"` allows **any** host — avoid it unless a load balancer already validates the `Host` header.
- `trustProxyHeaders` accepts `true` (trust the standard `Forwarded` header and all `X-Forwarded-*` headers) or a list of header names. The standard `Forwarded` header is supported since v22.1; when trusted, its `host` and `proto` take precedence over `X-Forwarded-Host`/`X-Forwarded-Proto`.
- Enable proxy headers **only** behind a proxy that overwrites them; otherwise attackers can spoof them.

## Running on other platforms (edge, serverless)

`AngularNodeAppEngine` is for Node.js. For runtimes that speak the web-standard `Request`/`Response` API (Cloudflare Workers, Deno, Bun…), use `AngularAppEngine` from `@angular/ssr`, and set `"ssr": { "entry": "src/server.ts", "platform": "neutral" }` in `angular.json` so the server bundle doesn't depend on Node built-ins:

```ts title="src/server.ts"
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine({
  allowedHosts: ['my-app.example.com'],
});

export const reqHandler = createRequestHandler(async (request: Request) => {
  const response = await angularApp.handle(request);
  return response ?? new Response('Not found', { status: 404 });
});

export default { fetch: reqHandler };
```

The neutral platform doesn't polyfill Node.js modules, so your server code must only use web APIs. Check your hosting provider's documentation for the exact export shape it expects.

## Common mistakes

- **Accessing `window`, `document`, `localStorage` at the top of a component or service.** Move it into `afterNextRender`, inject `DOCUMENT`, or use a platform-specific service.
- **Leaving `'**'` as `RenderMode.Prerender` with parameterized routes.** The build fails with "uses prerendering and includes parameters, but 'getPrerenderParams' is missing". Use `RenderMode.Server` or add `getPrerenderParams`.
- **Forgetting `allowedHosts` in production.** Every request returns `400 Bad Request`.
- **Starting timers (`setInterval`) or polling during rendering.** On the server they keep running after the page has been sent (and in Zone.js apps they prevent stability). Start them in `afterNextRender`.
- **Rendering different content on server and client** (`Math.random()`, `new Date()`, `isPlatformBrowser` in templates). This causes hydration mismatches.
- **Storing per-user state in module-level variables or `useValue` providers.** They are shared across all requests.

## Version notes

- **v22:** unknown `Host` headers return `400` instead of falling back to CSR; `CommonEngine` is deprecated — use `AngularNodeAppEngine` (Node.js) or `AngularAppEngine` (other runtimes); incremental hydration is on by default; `experimentalPlatform` was renamed to `ssr.platform`. **v22.1:** standard `Forwarded` header support.
- **v21:** `main.server.ts` must pass the `BootstrapContext` to `bootstrapApplication`.

## Key takeaways

- `ng new --ssr` or `ng add @angular/ssr` sets everything up — no Angular Universal.
- `app.routes.server.ts` decides how each route renders (SSR, SSG or CSR); the default prerenders everything.
- `server.ts` is a normal Express 5 app; `AngularNodeAppEngine.handle()` does the rendering.
- Keep browser-only code in `afterNextRender`, inject `DOCUMENT`, and prefer platform-specific services over `isPlatformBrowser` checks.
- `HttpClient`/`httpResource` data is transferred automatically; use `resource({ id })` or `TransferState` for other data.
- Configure `allowedHosts` before deploying.

## Next steps

- [Route-level Render Modes](/ssr/render-modes/) — choose SSR, SSG or CSR per route
- [Static Site Generation](/ssr/static-generation/) — prerender pages and deploy without a server
- [Hydration](/ssr/hydration/) — how the browser takes over the server HTML
- [Event Replay](/ssr/event-replay/) — keep clicks that happen before hydration
- [Incremental Hydration](/modern/incremental-hydration/) — hydrate parts of the page on demand
