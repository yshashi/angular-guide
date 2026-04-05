---
title: Performance Checklist ⚡
description: Comprehensive performance optimization checklist for Angular applications
sidebar:
  order: 4
---

A prioritized checklist for optimizing Angular application performance. Work through each section methodically — the items at the top of each section typically have the highest impact.

## 🔄 Change Detection

- [ ] **Use `OnPush` change detection on every component** — Prevents Angular from checking the component on every cycle. Only checks when inputs change or signals update.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

- [ ] **Use signals for all component state** — Signals notify Angular exactly which components need updating, skipping unnecessary checks.

```typescript
// ✅ Signal-based state
count = signal(0);
doubled = computed(() => this.count() * 2);

// ❌ Plain properties trigger broad checks
count = 0;
get doubled() { return this.count * 2; }
```

- [ ] **Use `computed()` for derived state** — Computed signals are memoized and only recalculate when their dependencies change.

- [ ] **Consider going zoneless** — Angular 21 supports experimental zoneless change detection, eliminating Zone.js overhead entirely.

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ...
  ],
};
```

- [ ] **Avoid triggering change detection in `effect()`** — Effects that modify signals can cause infinite loops. Use `untracked()` for reads you don't want to track.

## 📦 Bundle Size

- [ ] **Lazy-load feature routes** — Only load code when the user navigates to a route.

```typescript
{
  path: 'admin',
  loadChildren: () =>
    import('./admin/admin.routes').then(m => m.adminRoutes),
}
```

- [ ] **Use `loadComponent` for standalone page components** — Avoids bundling pages the user may never visit.

```typescript
{
  path: 'settings',
  loadComponent: () =>
    import('./settings.component').then(m => m.SettingsComponent),
}
```

- [ ] **Analyze your bundle** — Use `ng build --stats-json` and then `npx webpack-bundle-analyzer dist/stats.json` to identify large dependencies.

- [ ] **Remove unused imports** — Tree-shaking only works if you don't import things you don't use. Check for barrel file re-exports that pull in entire modules.

- [ ] **Use `@defer` for heavy below-the-fold components** — Deferred components are split into separate chunks automatically.

- [ ] **Avoid importing entire libraries** — Import specific functions/modules instead of entire packages.

```typescript
// ✅ Good — tree-shakable import
import { map, filter } from 'rxjs';

// ❌ Bad — imports everything
import * as rxjs from 'rxjs';
```

## 🖼️ Rendering Performance

- [ ] **Always provide `track` in `@for` blocks** — The `track` expression enables Angular to reuse DOM nodes instead of recreating them.

```html
<!-- ✅ Track by unique ID -->
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
}

<!-- ⚠️ Track by index — only if items have no unique ID -->
@for (item of items(); track $index) {
  <span>{{ item }}</span>
}
```

- [ ] **Use `@defer` to lazy-load heavy components** — Split large widgets, charts, and editors into deferred blocks.

```html
@defer (on viewport) {
  <app-analytics-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-skeleton" style="height: 400px"></div>
}
```

- [ ] **Use virtual scrolling for long lists** — The CDK `VirtualScrollViewport` renders only visible items.

```html
<cdk-virtual-scroll-viewport itemSize="48" class="list-viewport">
  <div *cdkVirtualFor="let item of items" class="list-item">
    {{ item.name }}
  </div>
</cdk-virtual-scroll-viewport>
```

- [ ] **Avoid DOM manipulation in tight loops** — Batch DOM changes. Prefer signal-driven updates over imperative DOM mutations.

- [ ] **Limit the use of `effect()`** — Effects run on every signal change. Prefer `computed()` when you're just deriving values.

## 🌐 Network Performance

- [ ] **Use `httpResource` for declarative data fetching** — Caches results and provides built-in loading/error states.

```typescript
readonly users = httpResource<User[]>(() => '/api/users');
```

- [ ] **Implement HTTP caching with interceptors** — Cache GET requests to avoid redundant network calls.

```typescript
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const cache = inject(HttpCacheService);
  const cached = cache.get(req.urlWithParams);
  if (cached) return of(cached);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req.urlWithParams, event);
      }
    }),
  );
};
```

- [ ] **Use preloading strategies** — Preload lazy routes after the initial load completes.

```typescript
provideRouter(
  routes,
  withPreloading(PreloadAllModules),
)
```

- [ ] **Use service workers for offline support** — Add `@angular/service-worker` for PWA caching.

```bash
ng add @angular/service-worker
```

- [ ] **Compress API responses** — Ensure your server sends gzip or brotli-compressed responses.

## 🖼️ Image Optimization

- [ ] **Use `NgOptimizedImage` for all images** — Enforces best practices automatically (lazy loading, sizing, priority hints).

```html
<!-- Hero image — mark as priority -->
<img ngSrc="/hero.jpg" width="1200" height="600" priority />

<!-- Regular images — lazy-loaded by default -->
<img ngSrc="/product.jpg" width="400" height="300" />
```

- [ ] **Set `priority` on LCP images** — The Largest Contentful Paint image should always have the `priority` attribute.

- [ ] **Provide `width` and `height` attributes** — Prevents layout shift (CLS). `NgOptimizedImage` will warn if these are missing.

- [ ] **Use responsive images with `ngSrcset`** — Serve appropriate image sizes based on viewport.

```html
<img
  ngSrc="/product.jpg"
  ngSrcset="300w, 600w, 900w"
  sizes="(max-width: 768px) 100vw, 50vw"
  width="900"
  height="600"
/>
```

- [ ] **Use modern image formats** — Serve WebP or AVIF with fallbacks.

## 🧹 Memory Management

- [ ] **Use `takeUntilDestroyed()` for all subscriptions** — Automatically unsubscribes when the component is destroyed.

```typescript
export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.someObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.data.set(value));
  }
}
```

- [ ] **Prefer signals over manual subscriptions** — Signals don't need unsubscription. Use `computed()` and `effect()` instead of `.subscribe()` where possible.

- [ ] **Clean up event listeners** — Use the `host` property in the decorator, which Angular manages automatically.

```typescript
@Component({
  host: {
    '(window:resize)': 'onResize($event)',
  },
})
```

- [ ] **Avoid memory leaks in `effect()`** — Effects are cleaned up automatically when the owning context is destroyed. Don't create effects in services without proper lifecycle management.

- [ ] **Use `untracked()` to prevent unnecessary subscriptions** — In effects that read many signals, use `untracked()` for signals you only want to read, not react to.

```typescript
effect(() => {
  const id = this.userId(); // react to this
  const config = untracked(() => this.config()); // just read this
  this.loadUser(id, config);
});
```

## 🏗️ Build Optimization

- [ ] **Use the default esbuild builder** — Angular 21 uses esbuild by default, which is significantly faster than webpack.

- [ ] **Enable production optimizations** — Always build with `ng build` (production mode is the default).

```bash
ng build                    # production by default
ng build --configuration=development  # dev build
```

- [ ] **Enable route-level code splitting** — This happens automatically with `loadComponent` and `loadChildren`.

- [ ] **Configure budget limits** — Set bundle size budgets in `angular.json` to catch regressions.

```json
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
```

- [ ] **Enable SSR/SSG for content pages** — Server-side rendering improves Time to First Byte (TTFB) and SEO.

```bash
ng add @angular/ssr
```

## 📊 Monitoring and Profiling

- [ ] **Use Angular DevTools** — The Chrome/Firefox extension shows component trees, change detection cycles, and profiler data.

- [ ] **Profile with Chrome DevTools Performance tab** — Record and analyze runtime performance bottlenecks.

- [ ] **Monitor Core Web Vitals** — Track LCP, FID/INP, and CLS in production.

- [ ] **Set up error tracking** — Use tools like Sentry to catch runtime errors in production.

:::tip
Start with the **Change Detection** and **Bundle Size** sections — these typically provide the biggest performance wins with the least effort.
:::
