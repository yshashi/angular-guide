---
title: Route-level Render Modes 🎯
description: Configure server routes in Angular - RenderMode.Server, Prerender and Client, getPrerenderParams, fallbacks, headers, status codes and redirects.
sidebar:
  order: 4
---

With Angular's **hybrid rendering**, every route in your app can be rendered differently: some on the server for every request (SSR), some once at build time (SSG/prerendering), and some only in the browser (CSR). You choose per route in a small file called `app.routes.server.ts`. This page explains every option in that file.

If you haven't set up SSR yet, start with the [SSR Introduction](/ssr/introduction/).

## What you'll learn

- How **server routes** relate to your normal Angular routes
- The three render modes — `RenderMode.Server`, `RenderMode.Prerender`, `RenderMode.Client` — and when to pick each
- How Angular matches URLs to server routes (wildcards, order, required coverage)
- Prerendering parameterized routes with `getPrerenderParams` and `fallback`
- Setting response headers, status codes and redirects — statically and at runtime
- Using an app shell for client-rendered routes

## Two route configs, two jobs

Your app now has **two** route files:

| File | Answers the question | Used by |
|---|---|---|
| `app.routes.ts` (`Routes`) | *Which component shows for this URL?* | Browser **and** server (normal Angular router) |
| `app.routes.server.ts` (`ServerRoute[]`) | *How should the HTML for this URL be produced?* | Server and build only |

Server routes don't define components — they only attach a **render mode** (and optional headers/status) to URL patterns. They are registered in `app.config.server.ts`:

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

## The three render modes

`RenderMode` is an enum exported from `@angular/ssr`:

| Mode | HTML is produced… | Good for | Watch out for |
|---|---|---|---|
| `RenderMode.Prerender` | once, **at build time** | Pages that are the same for everyone: home, about, blog posts, docs | Data is frozen until the next build; no access to the request |
| `RenderMode.Server` | **on every request** on the server | Fresh or personalised pages that need SEO: product pages, search | Needs a running server; costs CPU per request |
| `RenderMode.Client` | in the **browser** (server sends an empty shell) | Dashboards, pages behind login, heavy browser-only UIs | No SEO; content appears after JS loads |

The quick decision guide:

1. Is the page identical for every visitor between deployments? → **Prerender**.
2. Does it need to be fresh/personalised **and** visible to crawlers or fast on first load? → **Server**.
3. Otherwise (private, very interactive, browser APIs everywhere) → **Client**.

## A real-world configuration

Imagine a shop with these Angular routes:

```ts title="src/app/app.routes.ts"
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'about', loadComponent: () => import('./pages/about').then((m) => m.About) },
  { path: 'blog', loadComponent: () => import('./pages/blog-list').then((m) => m.BlogList) },
  { path: 'blog/:slug', loadComponent: () => import('./pages/blog-post').then((m) => m.BlogPost) },
  { path: 'products/:id', loadComponent: () => import('./pages/product').then((m) => m.Product) },
  { path: 'account', loadComponent: () => import('./pages/account').then((m) => m.Account) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard) },
  { path: 'old-blog', redirectTo: 'blog', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
```

A matching server config could be:

```ts title="src/app/app.routes.server.ts"
import { inject } from '@angular/core';
import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { PostService } from './post.service';

export const serverRoutes: ServerRoute[] = [
  // Same HTML for everyone → build once (SSG)
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },

  // Parameterized route → tell Angular which slugs to build
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const posts = inject(PostService); // inject() BEFORE any await
      const slugs = await posts.getSlugs();
      return slugs.map((slug) => ({ slug }));
    },
    fallback: PrerenderFallback.Server, // new posts → SSR on demand (the default)
  },

  // Fresh data on every request → SSR
  {
    path: 'products/:id',
    renderMode: RenderMode.Server,
    headers: { 'Cache-Control': 'public, max-age=60' },
  },
  { path: 'account', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'private, no-store' } },

  // Browser-only, behind login → CSR
  { path: 'dashboard', renderMode: RenderMode.Client },

  // Permanent redirect on the server
  { path: 'old-blog', renderMode: RenderMode.Server, status: 301 },

  // Everything else → SSR
  { path: '**', renderMode: RenderMode.Server },
];
```

The `PostService` used above is an ordinary service:

```ts title="src/app/post.service.ts"
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Service()
export class PostService {
  private readonly http = inject(HttpClient);

  getSlugs(): Promise<string[]> {
    return firstValueFrom(this.http.get<string[]>('https://api.example.com/posts/slugs'));
  }
}
```

## How URLs are matched

Each `ServerRoute` has a `path` and a `renderMode`. The matching rules:

- **No leading slash.** Write `'products/:id'`, not `'/products/:id'` (the build reports an error).
- **`:param`** matches exactly one segment, like in the Angular router. `*` also matches one segment.
- **`**`** matches any number of segments. `'**'` alone is the catch-all; `'docs/**'` matches everything under `/docs/`.
- **The first matching entry wins.** If several server routes match a URL, Angular uses the one defined **earliest** in the array. Put specific routes first and `'**'` last.
- **Every Angular route must be covered.** If a route in `app.routes.ts` doesn't match any server route, the build fails with *"route does not match any route defined in the server routing configuration"*. A final `'**'` entry is the easiest way to cover everything.
- **Server routes must exist in the Angular router.** A server route that matches no Angular route is also reported as an error, which protects you from typos.

## `RenderMode.Server` (SSR)

The page is rendered for every request. This is the only mode where you can read the request (`REQUEST`, `REQUEST_CONTEXT`) and change the response at runtime (`RESPONSE_INIT`) — see [Accessing the request and response](/ssr/introduction/#accessing-the-request-and-response).

Tips:

- Add `Cache-Control` headers so a CDN can cache public SSR pages for a short time. Use `private, no-store` for personalised pages.
- Data fetched with `HttpClient` / `httpResource` is transferred to the browser automatically, so it isn't fetched twice during hydration.
- In `ng serve`, server-rendered routes behave exactly as in production.

## `RenderMode.Client` (CSR)

The server answers with the **CSR shell** (`index.csr.html`): your `index.html` with scripts and styles, but without rendered content. The page then renders in the browser like a classic single-page app. Hydration doesn't apply because there's nothing to hydrate.

Use it for routes that:

- are behind authentication (crawlers can't see them anyway),
- depend heavily on browser-only APIs (canvas editors, maps, drag-and-drop dashboards),
- would be expensive to render on the server for no SEO benefit.

### App shell for client-rendered routes

An **app shell** is a minimal, static layout (header, navigation, loading state) shown immediately for client-rendered routes, while the app loads. Configure it with `withAppShell()`:

```ts title="src/app/app.config.server.ts"
import { ApplicationConfig } from '@angular/core';
import { provideServerRendering, withAppShell, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes),
      withAppShell(() => import('./app-shell').then((m) => m.AppShell)),
    ),
  ],
};
```

```ts title="src/app/app-shell.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-shell',
  template: `<header>My App</header><p class="loading">Loading…</p>`,
})
export class AppShell {}
```

`withAppShell()` accepts a component class or a lazy `import()` function. The rendered shell replaces the empty `index.csr.html`, so client-rendered routes show the layout instantly.

## `RenderMode.Prerender` (SSG)

The page is rendered **at build time** and saved as a static HTML file (for example `dist/my-app/browser/about/index.html`). When your Node.js server receives a request for it, Angular serves the file directly — no rendering — with an `ETag` header, and answers `304 Not Modified` when the browser already has the latest version.

A prerendered route **cannot** set `status` (the type doesn't allow it) and has no access to the request. It *can* set `headers`, which are applied when the Angular server serves the page.

### Parameterized routes need `getPrerenderParams`

Angular can't guess which `:slug` values exist, so for a route like `blog/:slug` you must provide a `getPrerenderParams` function. It returns a `Promise` of parameter objects; each object becomes one HTML file:

```ts
{
  path: 'blog/:slug',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    return [{ slug: 'hello-angular' }, { slug: 'signals-101' }];
    // → /blog/hello-angular and /blog/signals-101
  },
},
```

Rules for `getPrerenderParams`:

- It runs **at build time only**, in Angular's injection context, so you can call `inject()` to use services.
- Call `inject()` **synchronously, before any `await`**. After an `await` you're outside the injection context and `inject()` throws.
- Don't depend on browser APIs or the incoming request — there is no request at build time. Use absolute URLs for HTTP calls.
- Without it, a parameterized `Prerender` route fails the build with *"uses prerendering and includes parameters, but 'getPrerenderParams' is missing"*.

### Catch-all and multi-parameter routes

For `**` segments the parameter name is `'**'`, and its value can contain slashes. You can combine it with normal parameters:

```ts
import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

export const docsRoutes: ServerRoute[] = [
  {
    path: 'docs/**',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ '**': 'getting-started' }, { '**': 'guides/routing' }];
      // → /docs/getting-started and /docs/guides/routing
    },
  },
  {
    path: 'shop/:category/:id',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      return [
        { category: 'books', id: '1' },
        { category: 'games', id: '7' },
      ];
    },
  },
];
```

### Fallback for paths that weren't prerendered

When a request arrives for a parameter value you didn't prerender (say, a blog post published after the build), the `fallback` option decides what happens. It's only allowed on routes that have `getPrerenderParams`.

| `PrerenderFallback` | Behaviour for unknown paths |
|---|---|
| `Server` (**default**) | Render it with SSR on demand |
| `Client` | Send the CSR shell and render in the browser |
| `None` | No fallback — Angular won't render paths for this route that weren't prerendered |

:::note
Fallbacks need a server. With `outputMode: "static"` there is no server, so only the prerendered files exist. See [Static Site Generation](/ssr/static-generation/).
:::

## Headers and status codes

### Static: in the server route

```ts
{
  path: 'products/:id',
  renderMode: RenderMode.Server,
  headers: { 'Cache-Control': 'public, max-age=60', 'X-Frame-Options': 'DENY' },
},
{
  path: 'legacy-api-docs',
  renderMode: RenderMode.Server,
  status: 410, // Gone
},
```

`headers` works for all modes; `status` works for `Server` and `Client` routes.

### Dynamic: with `RESPONSE_INIT`

Often the status depends on data — for example a product that doesn't exist should return `404` so search engines drop it. Inject `RESPONSE_INIT` (from `@angular/core`) and change it while rendering:

```ts title="product-page.ts"
import { Component, RESPONSE_INIT, computed, effect, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Product {
  id: string;
  name: string;
}

@Component({
  selector: 'app-product-page',
  template: `
    @if (product.hasValue()) {
      <h1>{{ product.value().name }}</h1>
    } @else if (product.error()) {
      <h1>Product not found</h1>
    }
  `,
})
export class ProductPage {
  readonly id = input.required<string>(); // bound from the route with withComponentInputBinding()
  protected readonly product = httpResource<Product>(() => `/api/products/${this.id()}`);
  private readonly responseInit = inject(RESPONSE_INIT);
  private readonly notFound = computed(() => this.product.status() === 'error');

  constructor() {
    effect(() => {
      if (this.notFound() && this.responseInit) {
        this.responseInit.status = 404;
      }
    });
  }
}
```

`RESPONSE_INIT` is `null` in the browser and during prerendering, hence the `if`. Your router's wildcard `NotFound` page can use the same trick to return a real `404` (see the [SSR Introduction](/ssr/introduction/#accessing-the-request-and-response)).

## Redirects

Redirects in your Angular routes (`redirectTo`) are handled on the server too:

- **SSR:** Angular sends a real HTTP redirect. The status is `302` by default; set `status` on the matching server route to use `301`, `303`, `307` or `308`. Any other status on a redirect route is a build error.
- **Prerender:** a static file can't send HTTP headers, so Angular writes a small HTML page with a `<meta http-equiv="refresh">` "soft redirect".
- **Guards:** if a guard redirects (returns a `UrlTree` or `RedirectCommand`) during server rendering, the server also answers with an HTTP redirect.

```ts
// app.routes.ts
{ path: 'old-blog', redirectTo: 'blog', pathMatch: 'full' },

// app.routes.server.ts
{ path: 'old-blog', renderMode: RenderMode.Server, status: 301 },
```

## Common mistakes

- **Leaving the generated `'**' → Prerender` with parameterized routes.** Add `getPrerenderParams` or switch those routes to `Server`.
- **Leading slashes** in server route paths (`'/about'`). Use `'about'`.
- **`'**'` placed first.** The first match wins, so it would swallow every route. Keep it last.
- **Calling `inject()` after `await`** inside `getPrerenderParams`.
- **Using `fallback` without `getPrerenderParams`.** It's a type error — fallback only makes sense for parameterized routes.
- **Personalised data on prerendered pages.** A prerendered page is identical for every visitor; use `Server` or `Client` instead.
- **Expecting `REQUEST` / `RESPONSE_INIT` in `Prerender` or `Client` routes.** They're only provided for `RenderMode.Server`.

## Key takeaways

- `app.routes.ts` picks the component; `app.routes.server.ts` picks **how** the HTML is produced.
- `Prerender` for static pages, `Server` for fresh/personal pages that need SEO, `Client` for private or browser-heavy pages.
- Order matters (first match wins) and every Angular route must be covered — end with `'**'`.
- Parameterized prerendered routes need `getPrerenderParams`; `fallback` controls unknown paths (default: SSR).
- Use `headers`/`status` for static values and `RESPONSE_INIT` for dynamic ones; redirects become real HTTP redirects with SSR.

## Next steps

- [Static Site Generation](/ssr/static-generation/) — prerender everything and deploy to static hosting
- [Hydration](/ssr/hydration/) — what happens in the browser after the HTML arrives
- [Incremental Hydration](/modern/incremental-hydration/) — hydrate `@defer` blocks only when needed
- [Advanced Routing](/intermediate/advanced-routing/) — guards, resolvers and lazy loading
