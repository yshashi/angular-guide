---
title: Deployment Strategies 🚀
description: Deploy Angular 22 apps — build output, static hosts (Firebase, Netlify, Vercel, GitHub Pages, Cloudflare), Node SSR, environments, base href and ng deploy.
sidebar:
  order: 1
---

Your Angular app is ready — now it needs to live on the internet. This page explains what `ng build` produces, which files you upload, and how to deploy to the most popular hosts, both for **static (client-side) apps** and **server-side rendered (SSR) apps**.

**What you'll learn**

- What `ng build` creates and which folder you actually deploy
- How to choose between static hosting, prerendering (SSG) and SSR
- Copy-paste configs for Firebase, Netlify, Vercel, GitHub Pages and Cloudflare
- How to run an SSR app on Node.js safely (`PORT`, `allowedHosts`, proxies)
- How to manage environments, `<base href>`, caching and `ng deploy`

## Step 1: Build for production

```bash
ng build
```

That's it. `ng build` uses the **`production` configuration by default** (`"defaultConfiguration": "production"` in `angular.json`), so you get ahead-of-time (AOT) compilation, minification, tree-shaking, dead-code removal and hashed file names automatically. Development-only checks and debugging helpers are stripped from the bundle — you don't call `enableProdMode()` anymore.

:::tip
Use `ng build --configuration development` only when you need readable, unminified output for debugging a build problem.
:::

### What ends up in `dist/`

The output goes to `dist/<project-name>/` (change it with the `outputPath` option). Inside you always find a **`browser/`** folder, plus a **`server/`** folder when SSR is enabled.

```text
dist/my-app/
├── 3rdpartylicenses.txt        # licenses of bundled packages
├── prerendered-routes.json     # only when routes are prerendered
├── browser/                    # ← everything the browser downloads
│   ├── index.html              # host page (CSR apps)
│   ├── index.csr.html          # host page used as SPA fallback when prerendering
│   ├── main-ABC123.js          # hashed bundles (safe to cache forever)
│   ├── chunk-DEF456.js         # lazy-loaded routes / @defer blocks
│   ├── styles-GHI789.css
│   ├── favicon.ico             # files copied from public/
│   └── about/index.html        # prerendered page (SSG), if any
└── server/                     # only for SSR builds
    ├── server.mjs              # Node.js entry point (from src/server.ts)
    ├── main.server.mjs
    ├── angular-app-manifest.mjs
    ├── angular-app-engine-manifest.mjs
    └── index.server.html
```

| Your app | What to deploy | How it runs |
|---|---|---|
| Client-side rendered (CSR, the `ng new` default) | `dist/my-app/browser/` | Any static file host or CDN |
| Prerendered / SSG (`"outputMode": "static"`) | `dist/my-app/browser/` | Any static host — fallback page is `index.csr.html` |
| Server-side rendered (`"outputMode": "server"`) | `dist/my-app/browser/` **and** `dist/my-app/server/` | `node dist/my-app/server/server.mjs` |

:::caution[Deploy the `browser/` folder, not `dist/my-app/`]
The most common deployment mistake is pointing the host at `dist/my-app`. Your site then shows a directory listing or a 404. Always publish `dist/my-app/browser` for static hosting.
:::

## Step 2: Choose a hosting model

| Model | Good for | Needs a server? |
|---|---|---|
| **CSR** (single-page app) | Dashboards, admin tools, apps behind a login | No |
| **SSG** (prerender at build time) | Marketing pages, docs, blogs — content that changes on deploy | No |
| **SSR** (render on each request) | SEO-critical pages with dynamic data, fast first paint for personalised pages | Yes (Node.js or an edge runtime) |
| **Hybrid** | Mix the three per route with server routes | Yes |

Add SSR to an existing app with `ng add @angular/ssr` (or create a new one with `ng new my-app --ssr`). You then pick a render mode per route (`RenderMode.Client`, `RenderMode.Prerender`, `RenderMode.Server`) in `app.routes.server.ts` — see [Render Modes](/ssr/render-modes/) and [Static Generation](/ssr/static-generation/).

If every route is prerendered and you don't want a server at all, set `outputMode` to `static`:

```json title="angular.json (excerpt)"
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "outputMode": "static"
          }
        }
      }
    }
  }
}
```

## The one rule for every static host: SPA fallback

When a user opens `https://my-app.com/products/42` directly (from a link, bookmark or refresh), the browser asks the **server** for `/products/42`. That file doesn't exist — only `index.html` does. Without configuration you get a **404**.

Fix it by telling your host: *"if a file isn't found, serve `index.html`"*. Angular's router then reads the URL and shows the right page. Each section below includes this rewrite.

:::note
With `"outputMode": "static"` (prerendering), use **`index.csr.html`** as the fallback instead. `index.html` there contains the prerendered home page, not the empty app shell.
:::

## Static hosting

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory: dist/my-app/browser, single-page app: Yes
ng build
firebase deploy --only hosting
```

```json title="firebase.json"
{
  "hosting": {
    "public": "dist/my-app/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      },
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

Prefer a one-liner? `ng add @angular/fire` sets up an `ng deploy` target for Firebase (see [`ng deploy`](#ng-deploy-one-command-deployments) below). For SSR apps, Firebase **App Hosting** can build and run the Node server for you.

### Netlify

Connect your Git repository in the Netlify UI, or deploy from the CLI:

```bash
npm install -g netlify-cli
ng build
netlify deploy --prod --dir=dist/my-app/browser
```

```toml title="netlify.toml"
[build]
  command = "ng build"
  publish = "dist/my-app/browser"

[build.environment]
  NODE_VERSION = "24"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

Vercel detects Angular projects automatically. Import the repository in the Vercel dashboard, or use the CLI:

```bash
npm install -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

For a client-side app, make sure deep links fall back to `index.html`:

```json title="vercel.json"
{
  "buildCommand": "ng build",
  "outputDirectory": "dist/my-app/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Set the Node.js version to 24 (or 22/26) in the project settings — Angular 22 doesn't run on Node 20.

### GitHub Pages

GitHub Pages serves your site from a sub-path like `https://<user>.github.io/<repo>/`, so you must build with a matching **base href**. Pages also has no rewrite rules — the trick is to copy `index.html` to `404.html`, which Pages serves for unknown URLs.

**Option A — `ng deploy` with `angular-cli-ghpages`** (pushes to a `gh-pages` branch and creates `404.html` for you):

```bash
ng add angular-cli-ghpages
ng deploy --base-href=/my-repo/
```

**Option B — GitHub Actions** (recommended; no extra package). Enable *Settings → Pages → Source: GitHub Actions*, then add:

```yaml title=".github/workflows/pages.yml"
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx ng build --base-href=/${{ github.event.repository.name }}/
      - run: cp dist/my-app/browser/index.html dist/my-app/browser/404.html
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist/my-app/browser

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

### Cloudflare

Cloudflare can serve the `browser/` folder as static assets with **Workers**. Add a Wrangler config and deploy:

```jsonc title="wrangler.jsonc"
{
  "name": "my-app",
  "compatibility_date": "2026-11-01",
  "assets": {
    "directory": "./dist/my-app/browser",
    "not_found_handling": "single-page-application"
  }
}
```

```bash
ng build
npx wrangler deploy
```

`"not_found_handling": "single-page-application"` is Cloudflare's SPA fallback — unknown paths return `index.html`. If you use **Cloudflare Pages** instead, set the build output directory to `dist/my-app/browser`; Pages treats a project without a top-level `404.html` as a single-page app automatically.

### Your own web server (nginx, Apache, S3 + CDN)

The idea is always the same: serve `browser/`, cache hashed files for a long time, never cache `index.html`, and fall back to `index.html`.

```nginx title="nginx.conf (server block)"
root /usr/share/nginx/html;
index index.html;

# Hashed bundles never change — cache for a year
location ~* \.(?:js|css|woff2?|ttf|svg|png|jpe?g|gif|webp|avif|ico)$ {
  expires 1y;
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri =404;
}

# Everything else: try the file, otherwise hand over to Angular's router
location / {
  add_header Cache-Control "no-cache";
  try_files $uri $uri/ /index.html;
}
```

For Apache, use `FallbackResource /index.html` in `.htaccess`. For S3 + CloudFront, upload `browser/` (`aws s3 sync dist/my-app/browser s3://my-bucket --delete`) and configure CloudFront to return `/index.html` with status `200` for 403/404 errors.

## Deploying an SSR app on Node.js

An SSR build contains a ready-to-run Express server generated from `src/server.ts`. Locally:

```bash
ng build
node dist/my-app/server/server.mjs
# or: npm run serve:ssr:my-app   (script added by ng add @angular/ssr)
```

The generated `server.ts` looks like this (trimmed):

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

// Your own API endpoints, health checks, etc.
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

// Static files from /browser (hashed, so cache them for a year)
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));

// Everything else is rendered by Angular
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

// Start listening when run directly with `node` (or via PM2)
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Used by the Angular CLI dev server and by serverless hosts
export const reqHandler = createNodeRequestHandler(app);
```

Things to know in production:

| Concern | What to do |
|---|---|
| **Port** | The server listens on `process.env.PORT` (default `4000`). Most platforms set `PORT` for you. |
| **Allowed hosts** | Requests whose `Host` header isn't allow-listed get **`400 Bad Request`** (since v22 there's no silent fallback to client rendering). Configure them — see below. |
| **Reverse proxy / load balancer** | `Forwarded` and `X-Forwarded-*` headers are ignored unless you opt in with `trustProxyHeaders` (or the `NG_TRUST_PROXY_HEADERS` env var). |
| **Process manager** | Run under a supervisor (systemd, PM2, Docker, Kubernetes) so it restarts on crash. |
| **Files to ship** | Both `dist/my-app/browser` and `dist/my-app/server`, side by side. The server bundle already contains its npm dependencies (such as Express), so you don't need `node_modules` at runtime unless you excluded packages with the `externalDependencies` build option. |

### Configure allowed hosts

Angular validates the `Host` header to prevent Server-Side Request Forgery (SSRF). List every domain that serves your app:

```json title="angular.json (excerpt)"
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "security": {
              "allowedHosts": ["example.com", "*.example.com"]
            }
          }
        }
      }
    }
  }
}
```

Or set them at runtime — handy when the same build runs on several domains:

```bash
NG_ALLOWED_HOSTS="example.com,*.example.com" node dist/my-app/server/server.mjs
```

You can also pass `new AngularNodeAppEngine({ allowedHosts: [...] })` in `server.ts`. Hosts from `angular.json` are always included; the `NG_ALLOWED_HOSTS` variable is only read when you don't pass `allowedHosts` in code.

:::danger
Avoid `"*"` (allow every host) unless a proxy or load balancer in front of the app already validates `Host` and `X-Forwarded-Host`. Accepting any host exposes you to host-header injection and SSRF.
:::

Behind a proxy that sets forwarding headers, trust only what you need:

```ts
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto'],
});
```

### Serverless and edge runtimes

`createNodeRequestHandler(app)` (exported as `reqHandler`) is what platforms like Firebase Functions call. For non-Node runtimes (Cloudflare Workers, Deno, Bun, edge functions), use `AngularAppEngine` and `createRequestHandler` from `@angular/ssr`, which work with standard `Request`/`Response` objects. Many hosts (Firebase App Hosting, Netlify, Vercel) provide Angular SSR adapters that wire this up for you.

:::note[Angular 21 and earlier]
Older SSR setups used `CommonEngine` from `@angular/ssr/node`. It still works but is **deprecated since v22** — switch to `AngularNodeAppEngine` (Node) or `AngularAppEngine` (other runtimes). The legacy `@nguniversal/*` packages are long gone.
:::

## Environment configuration

### Build-time environments (`fileReplacements`)

Generate the environment files once:

```bash
ng generate environments
```

This creates `src/environments/environment.ts` (production defaults) and `environment.development.ts`, and adds `fileReplacements` to the `development` configuration in `angular.json`.

```ts title="src/environments/environment.ts"
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
};
```

Always import the **base** file — the CLI swaps it at build time:

```ts title="product-api.ts"
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface Product {
  id: number;
  name: string;
}

@Service()
export class ProductApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`);
  }
}
```

Add a `staging` environment by creating `environment.staging.ts` and a configuration:

```json title="angular.json (excerpt)"
"configurations": {
  "production": { "...": "..." },
  "development": { "...": "..." },
  "staging": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.staging.ts"
      }
    ]
  }
}
```

```bash
ng build --configuration staging
ng build --configuration production,staging   # combine: later ones win
```

For one-off values such as a version or commit hash, `--define` replaces a global identifier at build time:

```bash
ng build --define "APP_VERSION='1.4.2'" --define "COMMIT_SHA='$GITHUB_SHA'"
```

```ts
declare const APP_VERSION: string; // tell TypeScript it exists
console.log(`Running v${APP_VERSION}`);
```

:::danger[Never put secrets in environment files]
Everything in `src/environments/` (and `--define`) is bundled into JavaScript that **anyone can read** in the browser. API keys, database passwords and tokens belong on a server, not in your Angular bundle.
:::

### Runtime configuration (build once, deploy many)

Environment files bake values in at build time, so each environment needs its own build. If you want **one build artifact** that runs in staging and production (common with Docker), load a JSON file at startup instead:

```ts title="config-store.ts"
import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface RuntimeConfig {
  apiUrl: string;
  featureFlags: Record<string, boolean>;
}

@Service()
export class ConfigStore {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<RuntimeConfig | null>(null);
  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    const config = await firstValueFrom(this.http.get<RuntimeConfig>('/config.json'));
    this._config.set(config);
  }
}
```

```ts title="app.config.ts"
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ConfigStore } from './config-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // Angular waits for this promise before rendering the app
    provideAppInitializer(() => inject(ConfigStore).load()),
  ],
};
```

Each environment then serves a different `public/config.json` (for example, mounted into the container or written by your deploy script). Serve `config.json` with `Cache-Control: no-cache` so changes show up immediately.

## Base href and sub-path deployments

`<base href="/">` in `src/index.html` tells the browser and the router where your app lives. Deploying to a sub-path such as `https://example.com/shop/`? Build with:

```bash
ng build --base-href /shop/
```

Or set `"baseHref": "/shop/"` in the build configuration in `angular.json`. The trailing slash matters. Your server must also serve the app (and its fallback) under `/shop/`.

:::tip
`--deploy-url` also exists, but it's only for special cases such as serving bundles from a different CDN origin. Prefer `--base-href` — it's simpler and set in one place.
:::

## Caching strategy

| File | Cache-Control | Why |
|---|---|---|
| `main-*.js`, `chunk-*.js`, `styles-*.css`, media | `public, max-age=31536000, immutable` | File names contain a content hash; a change produces a new name |
| `index.html`, `index.csr.html` | `no-cache` | Must always be fresh so it points to the newest bundles |
| `config.json` (runtime config) | `no-cache` | Changes without a rebuild |
| Files from `public/` without a hash (e.g. `favicon.ico`) | Short (e.g. `max-age=3600`) | Their names never change |

Want offline support and smarter caching? `ng add @angular/pwa` adds a service worker — see the [PWA project](/projects/pwa/).

## `ng deploy`: one-command deployments

`ng deploy` runs the `deploy` target in `angular.json`. Angular doesn't ship a deployer itself — you add one from the community with `ng add`, which registers the target for you:

| Host | Setup command |
|---|---|
| Firebase Hosting | `ng add @angular/fire` |
| Netlify | `ng add @netlify-builder/deploy` |
| GitHub Pages | `ng add angular-cli-ghpages` |
| Amazon S3 | `ng add @jefiozie/ngx-aws-deploy` |
| Vercel | Use the Vercel CLI / Git integration (`vercel`) |

```bash
ng add @angular/fire
ng deploy
```

:::caution
These builders are third-party packages. Before relying on one, check that it lists support for your Angular major version. A CI pipeline that runs `ng build` and uploads `browser/` (see [CI/CD Pipelines](/deployment/ci-cd/)) works with every host.
:::

## Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| Blank page or directory listing | Deployed `dist/my-app` instead of `dist/my-app/browser` | Publish the `browser/` folder |
| 404 when refreshing `/products/42` | No SPA fallback | Add the rewrite to `index.html` (or `index.csr.html` for SSG) |
| Assets 404 on GitHub Pages | Wrong base href | `--base-href=/repo-name/` with trailing slash |
| SSR returns `400 Bad Request` | Host not in `allowedHosts` | Add the domain in `angular.json` or `NG_ALLOWED_HOSTS` |
| Users see an old version after deploy | `index.html` cached | `Cache-Control: no-cache` on `index.html` |
| Build fails on the host with engine errors | Host uses Node 20 | Use Node 22.22+, 24.15+ or 26 |
| API key visible in DevTools | Secret in `environment.ts` | Move it to a server or proxy |

## Deployment checklist

- [ ] `ng build` passes locally with no budget errors
- [ ] Unit and e2e tests pass in CI
- [ ] Host publishes `dist/<app>/browser` (SSR: `browser` + `server`)
- [ ] SPA fallback configured (or SSR server running)
- [ ] Correct `--base-href` for sub-path deployments
- [ ] `index.html` not cached; hashed bundles cached long-term
- [ ] HTTPS enabled
- [ ] No secrets in environment files
- [ ] SSR: `allowedHosts` and (if behind a proxy) `trustProxyHeaders` configured
- [ ] Rollback plan (previous build artifact or previous container image)

## Key takeaways

- `ng build` produces a production build by default into `dist/<app>/browser` (and `server/` for SSR).
- Static hosts only need `browser/` plus a rewrite to `index.html` for deep links.
- SSR apps run with `node dist/<app>/server/server.mjs`; set `PORT`, `allowedHosts` and, behind a proxy, `trustProxyHeaders`.
- Use environment files for build-time settings, a runtime `config.json` for build-once-deploy-many, and never ship secrets.
- `ng deploy` is a convenience wrapper around community builders; a CI pipeline works everywhere.

## Next steps

1. **[Docker & Containers](/deployment/docker/)** — package static and SSR apps as container images
2. **[CI/CD Pipelines](/deployment/ci-cd/)** — test, build and deploy automatically
3. **[Render Modes](/ssr/render-modes/)** — choose CSR, SSR or prerendering per route
4. **[Bundle Optimization](/advanced/bundle-optimization/)** — make the build smaller before you ship it
