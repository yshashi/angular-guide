---
title: Static Site Generation (SSG) 📄
description: Prerender Angular pages at build time - outputMode static, getPrerenderParams, SEO tags, build output and deploying to static hosting or a CDN.
sidebar:
  order: 2
---

**Static site generation (SSG)**, also called **prerendering**, renders your pages to plain HTML files **at build time**. Visitors get a ready-made page straight from a CDN — no server rendering per request — and Angular then hydrates it so it behaves like a normal app. It's the fastest and cheapest way to ship content-heavy pages such as blogs, docs, landing pages and marketing sites.

This page assumes you know the basics from the [SSR Introduction](/ssr/introduction/).

## What you'll learn

- The two ways to prerender: **hybrid** (`outputMode: "server"`) and **fully static** (`outputMode: "static"`)
- How to turn an app into a fully static site, step by step
- How to prerender routes with parameters using `getPrerenderParams`
- How to add per-page SEO tags that end up in the static HTML
- What the build output looks like and how to deploy it to any static host
- Limits of SSG and how to work around them

## Two ways to prerender

| | Hybrid (`outputMode: "server"`) | Fully static (`outputMode: "static"`) |
|---|---|---|
| Prerendered pages | ✅ Routes with `RenderMode.Prerender` | ✅ Routes with `RenderMode.Prerender` |
| Server-rendered pages | ✅ `RenderMode.Server` | ❌ Build error if any route uses it |
| Fallback for un-prerendered params | ✅ SSR or CSR (`fallback`) | ❌ Only the generated files exist |
| Node.js server in output | ✅ `dist/<app>/server/server.mjs` | ❌ None |
| Host on | Node.js host, container, serverless | Any static host or CDN (GitHub Pages, Netlify, Firebase Hosting, S3…) |

Choose **hybrid** if some pages need fresh data per request. Choose **fully static** if *every* page can be built ahead of time (or rendered in the browser).

## Step by step: a fully static site

### 1. Add SSR support

```bash
ng new my-blog --ssr        # new project
# or
ng add @angular/ssr         # existing project
```

This creates `main.server.ts`, `app.config.server.ts` and `app.routes.server.ts` — the build needs them to render your pages, even for a static site.

### 2. Switch the output mode to `static`

```json title="angular.json (projects.my-blog.architect.build.options)"
{
  "browser": "src/main.ts",
  "server": "src/main.server.ts",
  "outputMode": "static"
}
```

- `server` must stay — it's the entry that renders your pages during the build. Without it, nothing is prerendered.
- `ssr.entry` and `src/server.ts` are not needed for a static site. If you keep them, the build starts your `server.ts` while prerendering (so relative requests to API routes you defined there work at build time), but no server is written to the output.

### 3. Decide how each route renders

```ts title="src/app/app.routes.server.ts"
import { RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './posts';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return POSTS.map((post) => ({ slug: post.slug }));
    },
  },
  // Rendered in the browser (served via the index.csr.html fallback)
  { path: 'dashboard', renderMode: RenderMode.Client },
  // Everything else without parameters: prerender
  { path: '**', renderMode: RenderMode.Prerender },
];
```

With `outputMode: "static"` only `Prerender` and `Client` are allowed. A `RenderMode.Server` route fails the build with *"Route '…' is configured with server render mode, but the build 'outputMode' is set to 'static'"*.

### 4. Build

```bash
ng build
```

The CLI discovers every route in your router config, calls `getPrerenderParams` for parameterized ones, renders each URL and writes the HTML files.

## Prerendering routes with parameters

Routes such as `blog/:slug` can't be discovered automatically — Angular doesn't know which slugs exist. `getPrerenderParams` returns one object per page to generate.

### From local data

Keeping content in the repository (TypeScript, JSON or Markdown converted at build time) is the simplest and most reliable option:

```ts title="src/app/posts.ts"
export interface Post {
  slug: string;
  title: string;
  summary: string;
  body: string;
}

export const POSTS: Post[] = [
  { slug: 'hello-angular', title: 'Hello Angular', summary: 'Our first post', body: '…' },
  { slug: 'signals-101', title: 'Signals 101', summary: 'Reactive state made simple', body: '…' },
];
```

### From an API or headless CMS

`getPrerenderParams` runs in an injection context, so you can use `HttpClient`:

```ts title="src/app/app.routes.server.ts"
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const http = inject(HttpClient); // inject() before any await!
      const posts = await firstValueFrom(
        http.get<{ slug: string }[]>('https://cms.example.com/api/posts?fields=slug'),
      );
      return posts.map(({ slug }) => ({ slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

- Call `inject()` **before** the first `await`.
- Use **absolute URLs**: there's no browser and no incoming request at build time.
- For catch-all routes (`docs/**`) return `{ '**': 'guides/routing' }`. See [Render Modes → Catch-all routes](/ssr/render-modes/#catch-all-and-multi-parameter-routes).

## Rendering the page content (and SEO tags)

The page component doesn't know it's being prerendered — it renders like any other component. Here's a blog post page that reads the `slug` route parameter as an input (enable this with `provideRouter(routes, withComponentInputBinding())`) and sets the title and description so they end up in the static HTML:

```ts title="src/app/blog-post.ts"
import { Component, computed, effect, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { POSTS } from './posts';

@Component({
  selector: 'app-blog-post',
  template: `
    @if (post(); as post) {
      <article>
        <h1>{{ post.title }}</h1>
        <p>{{ post.body }}</p>
      </article>
    } @else {
      <h1>Post not found</h1>
    }
  `,
})
export class BlogPost {
  readonly slug = input.required<string>();
  protected readonly post = computed(() => POSTS.find((p) => p.slug === this.slug()));

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    effect(() => {
      const post = this.post();
      if (post) {
        this.title.setTitle(`${post.title} | My Blog`);
        this.meta.updateTag({ name: 'description', content: post.summary });
      }
    });
  }
}
```

Data loaded with `HttpClient` or `httpResource` while prerendering is embedded in the page (the **HTTP transfer cache**), so the browser doesn't fetch it again during hydration. Angular waits for those requests before writing the HTML. Each page must finish rendering within 30 seconds, otherwise the build reports an error.

:::caution
Prerendered HTML is identical for every visitor and frozen until the next build. Don't render user-specific data (names, carts, prices that change hourly) into it. Load such data in the browser — for example with `httpResource` inside a `@defer` block or a `RenderMode.Client` route.
:::

## The build output

```text
dist/my-blog/
├── browser/                     ← deploy this folder
│   ├── index.html               ← prerendered "/"
│   ├── index.csr.html           ← empty app shell for client-rendered routes
│   ├── blog/
│   │   ├── index.html           ← prerendered "/blog"
│   │   ├── hello-angular/index.html
│   │   └── signals-101/index.html
│   ├── main-XXXX.js, styles-XXXX.css, …
│   └── favicon.ico, other files from public/
└── prerendered-routes.json      ← list of generated routes
```

Each route becomes a folder with an `index.html`, so `/blog/hello-angular` maps naturally to `blog/hello-angular/index.html` on any static server.

Redirect routes (`redirectTo`) can't send HTTP status codes from a static file, so Angular generates a small page with a `<meta http-equiv="refresh">` tag that forwards the browser.

## Deploying a static site

Upload the contents of `dist/<app>/browser/` to your static host or CDN. Then configure one thing: the **fallback page**.

When someone opens a URL that has no prerendered file — a `RenderMode.Client` route like `/dashboard`, or a deep link the build didn't generate — the host must return the app shell so Angular can render it in the browser:

:::caution[Use `index.csr.html` as the SPA fallback]
With prerendering, `index.html` is the **prerendered home page**, not an empty shell. Configure your host's "single-page app" / 404 fallback to serve **`/index.csr.html`**. Pointing it at `index.html` would serve the home page's HTML for every unknown URL.
:::

Examples of the idea (check your host's docs for the exact syntax):

```text title="Netlify: public/_redirects"
/*    /index.csr.html   200
```

```json title="Firebase Hosting: firebase.json (excerpt)"
{
  "hosting": {
    "public": "dist/my-blog/browser",
    "rewrites": [{ "source": "**", "destination": "/index.csr.html" }]
  }
}
```

Static hosts serve real files before applying rewrites, so prerendered pages are still served as static HTML.

If your site lives in a sub-folder (for example GitHub Pages at `https://user.github.io/my-blog/`), build with the matching base href:

```bash
ng build --base-href /my-blog/
```

See [Deployment Strategies](/deployment/strategies/) and [CI/CD Pipelines](/deployment/ci-cd/) for automating builds and deploys.

## Keeping content fresh

A static site only changes when you rebuild it. Common approaches:

- **Rebuild on content change:** trigger your CI pipeline from a CMS webhook or on every merge to `main`.
- **Scheduled rebuilds:** rebuild nightly for content that changes slowly.
- **Mix in client-side data:** keep the page shell static and load fast-changing parts (stock, comments) in the browser.
- **Go hybrid:** switch to `outputMode: "server"` and use `fallback: PrerenderFallback.Server` so pages added after the build are rendered on demand. See [Render Modes](/ssr/render-modes/#fallback-for-paths-that-werent-prerendered).

## Developing a prerendered app

`ng serve` doesn't prerender the whole app on each change. Instead, `Prerender` routes are rendered on the server **when you request them**, so you can work as usual. To inspect the real output, run `ng build` and look into `dist/<app>/browser/`, or serve it with any static file server.

## Common mistakes

- **Removing the `server` option** from `angular.json`. Without `main.server.ts` nothing gets prerendered.
- **Using `RenderMode.Server` with `outputMode: "static"`.** The build fails; use `Prerender` or `Client`.
- **Forgetting `getPrerenderParams`** for `:param` routes. The build fails with "'getPrerenderParams' is missing".
- **Relative URLs or browser APIs** inside `getPrerenderParams`. It runs in Node.js at build time; use absolute URLs and plain data.
- **SPA fallback pointing to `index.html`.** Use `index.csr.html`.
- **A CDN that minifies HTML** by stripping comments and whitespace. Angular's hydration needs them; disable that optimisation (otherwise you'll see error NG0507 — see [Hydration](/ssr/hydration/#common-hydration-errors)).
- **Huge numbers of pages.** Every generated page adds build time and deployment size; prerender the popular ones and use a fallback (hybrid) for the long tail.

## Key takeaways

- SSG renders HTML at build time; the browser hydrates it into a full Angular app.
- `outputMode: "static"` produces only static files — no server. `outputMode: "server"` mixes prerendered pages with SSR.
- `getPrerenderParams` lists the parameter values to prerender; call `inject()` before `await` and use absolute URLs.
- Deploy `dist/<app>/browser/` and configure `index.csr.html` as the SPA fallback.
- Prerendered pages are the same for everyone and only update when you rebuild.

## Next steps

- [Route-level Render Modes](/ssr/render-modes/) — all server route options in detail
- [Hydration](/ssr/hydration/) — what happens when the static HTML reaches the browser
- [Incremental Hydration](/modern/incremental-hydration/) — ship less JavaScript for static content
- [Deployment Strategies](/deployment/strategies/) — hosting options
