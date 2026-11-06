---
title: Performance Optimization ⚡
description: Measure Angular performance and improve loading, rendering, images and large-list behavior without premature optimization.
sidebar:
  order: 8
---

Optimize the work users actually experience. Start with a production build and browser measurements, identify the largest bottleneck, make one change, then measure again. A smaller bundle or fewer change-detection runs does not automatically mean a faster user experience.

## Measure the user experience

Start with these Core Web Vitals:

| Metric | What it measures | Good field result |
| --- | --- | --- |
| **LCP** (Largest Contentful Paint) | How quickly the main content appears | 2.5 seconds or less |
| **INP** (Interaction to Next Paint) | How quickly the page responds to interactions | 200 milliseconds or less |
| **CLS** (Cumulative Layout Shift) | How stable the page layout is | 0.1 or less |

Evaluate the 75th percentile of real page visits, separately for mobile and desktop. These are user-experience targets, not a guarantee that every individual visit meets them. The [Core Web Vitals guidance](https://web.dev/articles/vitals) maintains the definitions and thresholds.

Use Lighthouse for a repeatable lab check, browser Performance and Network panels to diagnose causes, and real-user monitoring for field data. A Lighthouse run without real interactions cannot directly measure field INP; its Total Blocking Time is a useful lab signal, not a replacement for INP. Angular DevTools can help profile Angular rendering and inspect the component tree.

## Keep initial JavaScript focused

Lazy-load routes that are not needed at startup:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'reports', loadChildren: () => import('./reports/reports.routes').then((m) => m.REPORT_ROUTES) },
];
```

Use `@defer` for a component that is not needed immediately. Deferred dependencies should be standalone and not referenced elsewhere in the same file if they are to be split:

```html
@defer (on viewport) {
  <app-analytics-chart />
} @placeholder {
  <div class="chart-placeholder" aria-hidden="true"></div>
} @error {
  <p role="alert">The chart could not be loaded.</p>
}
```

Give placeholders an appropriate size to avoid layout shifts. Do not defer content required for the initial task, such as primary navigation or a critical form.

Load large third-party libraries only where needed with dynamic `import()`. Prefer packages with supported tree-shakable entry points and remove dependencies that are no longer used.

### Preload when it helps navigation

Lazy loading can make the first visit smaller but introduce a wait on later navigation. If measurements show that preloading is useful, configure it alongside your routes:

```ts
import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
};
```

`PreloadAllModules` can download lazy routes that a visitor never opens, consuming bandwidth and potentially competing with more important requests. Measure it on slow connections, or use a selective preloading strategy instead.

## Render efficiently

Angular 22 uses `ChangeDetectionStrategy.OnPush` by default. Signals read by a template, input changes and bound events notify Angular about work to render. Use signals for mutable component state and `computed()` for derived values:

```ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-cart-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Items: {{ itemCount() }}</p>
    <p>Total: {{ total() }}</p>
  `,
})
export class CartSummary {
  private readonly quantities = signal([2, 1, 3]);
  readonly itemCount = computed(() => this.quantities().reduce((sum, count) => sum + count, 0));
  readonly total = computed(() => this.itemCount() * 12.5);
}
```

When upgrading an older project, review the Angular update migration for components that need to retain eager behavior; use `ChangeDetectionStrategy.Eager` only when that behavior is intentional. See [Zoneless Angular](/modern/zoneless/) for notification requirements.

For expensive work, profile before adding memoization or manual change-detection controls. Avoid expensive function calls and large transformations in frequently evaluated template expressions.

`computed()` caches its result until one of its signal dependencies changes. Pure pipes similarly run when their input arguments change; mutating an existing array or object in place does not give a pure pipe a new reference. Prefer immutable updates when a pipe depends on a collection.

## Render large collections

Use a stable identity in `@for` so Angular can reuse DOM nodes:

```html
@for (row of rows(); track row.id) {
  <app-data-row [row]="row" />
} @empty {
  <p>No rows found.</p>
}
```

For very large lists, the Angular CDK can render only the visible rows and a buffer. Add a CDK version compatible with your Angular version, for example with `ng add @angular/cdk`, then import `ScrollingModule`:

```ts
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface ListItem {
  id: number;
  name: string;
}

@Component({
  selector: 'app-virtual-list',
  imports: [ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cdk-virtual-scroll-viewport
      itemSize="48"
      class="viewport"
      role="region"
      aria-label="Items"
      tabindex="0"
    >
      <div *cdkVirtualFor="let item of items(); trackBy: trackItem" class="row">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 384px; }
    .row { height: 48px; box-sizing: border-box; padding: 12px; }
  `],
})
export class VirtualList {
  readonly items = signal<ListItem[]>(
    Array.from({ length: 10_000 }, (_, index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
    })),
  );
  readonly trackItem = (_index: number, item: ListItem) => item.id;
}
```

`*cdkVirtualFor` is the CDK's virtual-repeat directive, not the deprecated `*ngFor`. The row's rendered height must match `itemSize` for this fixed-size strategy. Virtualized off-screen items are not in the DOM, so test keyboard and screen-reader behavior; search, filtering or pagination may be more appropriate for some content.

## Reduce repeated search requests

For a search box, wait briefly after typing before sending the request, and cancel the previous timer or HTTP request when the input changes. This example expects `GET /api/search?q=...` to return an array such as `[{"id": 1, "name": "Book"}]`:

```ts
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, Subject, switchMap, timer } from 'rxjs';

interface SearchResult {
  id: number;
  name: string;
}

@Component({
  selector: 'app-product-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label for="product-search">Search products</label>
    <input id="product-search" type="search" #query (input)="search(query.value)" />

    @if (searching()) {
      <p role="status">Searching...</p>
    }
    @if (error(); as message) {
      <p role="alert">{{ message }}</p>
    }
    <ul>
      @for (result of results(); track result.id) {
        <li>{{ result.name }}</li>
      }
    </ul>
  `,
})
export class ProductSearch {
  private readonly http = inject(HttpClient);
  private readonly queries = new Subject<string>();

  readonly results = signal<SearchResult[]>([]);
  readonly searching = signal(false);
  readonly error = signal('');

  constructor() {
    this.queries.pipe(
      map((query) => query.trim()),
      switchMap((query) => {
        this.error.set('');
        this.results.set([]);
        if (!query) return of<SearchResult[]>([]);

        this.searching.set(true);
        return timer(300).pipe(
          switchMap(() => this.http.get<SearchResult[]>('/api/search', { params: { q: query } })),
          catchError(() => {
            this.error.set('Search failed. Please try again.');
            return of<SearchResult[]>([]);
          }),
          finalize(() => this.searching.set(false)),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe((results) => this.results.set(results));
  }

  search(query: string): void {
    this.queries.next(query);
  }
}
```

Configure `provideHttpClient()` in the application's providers. `switchMap` cancels the previous inner operation as soon as a new query arrives; `takeUntilDestroyed()` stops the subscription when the component is destroyed. Handle errors visibly rather than treating a failed request as a successful search. The generic type describes the expected response to TypeScript; validate untrusted response data at runtime when appropriate.

## Optimize images and fonts

Use `NgOptimizedImage` where appropriate. Set dimensions or use `fill` with a positioned container, provide meaningful alt text, and mark images that are likely LCP candidates as high priority:

```ts
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-image',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      ngSrc="/assets/product.webp"
      width="640"
      height="480"
      sizes="(max-width: 640px) 100vw, 640px"
      priority
      alt="Blue travel backpack"
    />
  `,
  styles: ['img { display: block; max-width: 100%; height: auto; }'],
})
export class ProductImage {}
```

Replace the URL and dimensions with your image's actual values. An LCP candidate can differ between screen sizes, so test representative viewports rather than marking every image as `priority`. Other images are lazy-loaded by default. For responsive images, describe the displayed width with `sizes` and use an image loader/CDN that can supply appropriately sized variants.

Compress assets and avoid loading large fonts or images that are not needed on the current route. Reserve space for images, placeholders and fonts to reduce layout shifts.

## Cache data deliberately

Caching can avoid repeat downloads, but `httpResource()` does not automatically cache arbitrary HTTP responses for you. Decide what can be cached, how long it remains fresh and how mutations invalidate it.

- Use appropriate HTTP caching headers for public assets. Fingerprinted, immutable assets can often have a long cache lifetime; the HTML entry point usually needs a shorter or revalidated lifetime.
- Do not share-cache personalized or sensitive responses. Consider authentication, cookies, locale and other response variations before using an interceptor or CDN cache.
- A service worker can support offline use and asset caching. Add one with `ng add @angular/service-worker`, then review its cache configuration and update behavior for your application.

See [HTTP Client](/beginner/http/) and [PWA Project](/projects/pwa/) for the underlying APIs and an application example.

## Choose a rendering strategy

- Use client rendering for interactive, personalized routes where server-rendered HTML is not important.
- Use prerendering for routes whose content is known at build time.
- Use SSR when rendering route content on the server benefits first loads or link previews.
- For SSR, hydration reuses server-rendered DOM. In Angular 22, incremental hydration is enabled by default when hydration is configured; choose deferred boundaries deliberately and measure their effect.

SSR and hydration add operational complexity. Make rendering decisions route by route and account for data freshness, caching, browser-only APIs and server runtime limits. See [SSR Introduction](/ssr/introduction/).

## Check bundles and production builds

Run the production build and inspect the output when a route or dependency appears to dominate the bundle:

```bash
ng build --configuration production
```

Use the builder's supported bundle analysis output or a compatible analyzer for your CLI version. You can set budgets under your project's `architect.build.configurations.production` in `angular.json`:

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kB",
      "maximumError": "1MB"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "4kB",
      "maximumError": "8kB"
    }
  ]
}
```

These are example limits, not universal targets. Angular reports a warning or fails the build when the respective budget is exceeded. Set limits from your baseline and review them in CI. Review source maps and other build artifacts before publishing them.

## Clean up long-lived work

An `AsyncPipe` or `toSignal()` subscription is normally managed by Angular. For an imperative subscription, `takeUntilDestroyed()` can tie it to the component's lifetime:

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ticks: {{ ticks() }}</p>`,
})
export class Timer {
  readonly ticks = signal(0);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe((tick) => this.ticks.set(tick));
  }
}
```

The call above is made in an injection context. When calling it from a method outside one, pass an injected `DestroyRef` to `takeUntilDestroyed(destroyRef)`. Also remove external event listeners, disconnect observers and clear timers when their owner is destroyed. Not every subscription leaks: for example, a normal `HttpClient` request usually completes on its own.

## Practical workflow

1. Capture a baseline on a production build.
2. Identify the slow route, interaction or asset.
3. Make one targeted change.
4. Re-run the same measurements and verify accessibility and correctness.
5. Keep the change only if it improves the measured user experience.

Related guides: [Bundle Optimization](/advanced/bundle-optimization/) · [Performance Checklist](/resources/performance-checklist/) · [Incremental Hydration](/modern/incremental-hydration/)
