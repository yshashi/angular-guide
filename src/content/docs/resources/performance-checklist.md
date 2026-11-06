---
title: Performance Checklist ⚡
description: A practical Angular performance checklist focused on Core Web Vitals, production measurements, rendering, bundles and network behavior.
sidebar:
  order: 4
---

Use this checklist to find and fix measured bottlenecks. Performance depends on the application and its users; none of these techniques guarantees a faster result without measurement.

## Measure first

- [ ] Record LCP, INP and CLS for representative routes and devices.
- [ ] Use a production build and test both lab measurements and real-user data.
- [ ] Capture a browser performance trace before changing code.
- [ ] Set project-specific bundle budgets and review regressions in CI.

## Rendering and state

- [ ] Use signals for mutable state consumed by templates and `computed()` for derived values.
- [ ] Angular 22 defaults components to `ChangeDetectionStrategy.OnPush`; inspect update migrations for components that need eager behavior.
- [ ] In zoneless apps, make asynchronous updates notify Angular with signals, `AsyncPipe`, `markForCheck()` or another supported mechanism.
- [ ] Keep template expressions inexpensive and side-effect free.
- [ ] Use a stable key in every `@for` block.
- [ ] Consider virtual scrolling for measured large-list rendering bottlenecks.
- [ ] Use `effect()` for synchronizing with imperative APIs, not for deriving state.

```html
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
}
```

## Loading and bundles

- [ ] Lazy-load routes that are not needed for the initial page.
- [ ] Use `@defer` for non-critical components that can load later; provide an appropriate placeholder and error state.
- [ ] Dynamically import large libraries when they are needed.
- [ ] Remove unused dependencies and imports.
- [ ] Review the production output and set budgets that match the project.
- [ ] Consider selective route preloading only when the navigation benefit outweighs the extra downloads.

```bash
ng build --configuration production
```

## Images and layout

- [ ] Set image dimensions or an aspect ratio to reserve space.
- [ ] Use `NgOptimizedImage` where appropriate; mark likely LCP images as `priority`, accounting for different screen sizes.
- [ ] Serve responsive, compressed image formats.
- [ ] Avoid layout shifts caused by late-loading content and fonts.
- [ ] Use semantic HTML, labels and accessible alternatives for visual content.

Import `NgOptimizedImage` in the component before using `ngSrc`:

```html
<img ngSrc="/assets/hero.webp" width="1200" height="600" priority alt="Your product" />
<img ngSrc="/assets/product.webp" width="400" height="300" alt="Product detail" />
```

Use real image paths, dimensions and descriptive alternatives. Only mark an image `priority` when it is a likely LCP candidate.

## Data and network

- [ ] Request only the data the current route needs; paginate large collections.
- [ ] Use `httpResource()` for reactive HTTP reads when its resource semantics fit; it does not automatically cache arbitrary server responses.
- [ ] Use `HttpClient` for writes and imperative request workflows.
- [ ] Add caching only with a clear freshness, invalidation and privacy policy.
- [ ] Compress responses and use a CDN where appropriate.
- [ ] Avoid making requests that are not needed for the initial user task.
- [ ] Debounce search input and cancel superseded requests where appropriate.
- [ ] Consider a service worker for offline support only after reviewing its caching and update behavior.

## SSR and rendering strategy

- [ ] Choose CSR, prerendering or SSR based on route requirements and data freshness.
- [ ] Add hydration only when it improves the measured user experience.
- [ ] Verify server rendering does not wait on irrelevant background work.
- [ ] Test browser-only APIs and third-party widgets in the server-rendered app.

## Memory and cleanup

- [ ] Prefer `AsyncPipe` or `toSignal()` over manual subscriptions when appropriate.
- [ ] Use `takeUntilDestroyed()` for subscriptions that need imperative handling.
- [ ] Clean up timers, observers and external event listeners.
- [ ] Keep effects tied to a lifecycle and clean up external resources they create.

For an imperative subscription created in an injection context:

```ts
interval(1000)
  .pipe(takeUntilDestroyed())
  .subscribe((tick) => this.ticks.set(tick));
```

Import `interval` from `rxjs` and `takeUntilDestroyed` from `@angular/core/rxjs-interop`. For a complete component and guidance on calls outside an injection context, see [Performance Optimization](/advanced/performance/#clean-up-long-lived-work).

## Example bundle budgets

Put project-specific limits in `angular.json` under `architect.build.configurations.production`:

```json
{
  "budgets": [
    { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
    { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
  ]
}
```

These values are examples, not required limits. A warning highlights a regression; an error budget fails the build.

## After each change

- [ ] Re-run the same performance measurement.
- [ ] Confirm functionality, keyboard behavior and screen-reader output still work.
- [ ] Keep the change only if measurements or maintainability improve.

See [Performance Optimization](/advanced/performance/) and [Zoneless Angular](/modern/zoneless/) for detailed guidance. Current Core Web Vitals definitions and thresholds are maintained at [web.dev](https://web.dev/articles/vitals).
