---
title: Incremental Hydration 💧
description: Defer client-side hydration of server-rendered Angular content until it is needed, using hydration triggers in @defer blocks.
sidebar:
  order: 10
---

Incremental hydration lets an Angular application render deferred content on the server while delaying the JavaScript work needed to hydrate that content in the browser. The HTML remains visible and can become interactive when a hydration trigger fires.

Use it to reduce initial client-side work for non-critical page sections. It does not make server rendering optional: incremental hydration requires SSR and client hydration, and it does not guarantee a performance improvement for every page.

## Requirements and setup

The application must use SSR and `provideClientHydration()`. In Angular 22, **incremental hydration is enabled by default** whenever you call `provideClientHydration()` — you do not need `withIncrementalHydration()` (which is now deprecated):

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import {
  provideClientHydration,
  withNoIncrementalHydration,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // Incremental hydration + event replay are active by default in Angular 22:
    provideClientHydration(),
    // If you ever need to opt out of incremental hydration:
    // provideClientHydration(withNoIncrementalHydration()),
  ],
};
```

In the SSR application configuration, make sure the providers used by the browser are also included in the server configuration. Angular CLI SSR projects commonly share providers through `mergeApplicationConfig()`.

Incremental hydration enables event replay automatically.

## Add a hydration boundary

Add a `hydrate` trigger to an `@defer` block. On the server, Angular renders the block's main content. In the browser, that content remains dehydrated until a trigger fires:

```html
@defer (hydrate on viewport) {
  <app-product-reviews [productId]="productId()" />
} @placeholder {
  <section aria-label="Product reviews">
    <p>Reviews are loading…</p>
  </section>
}
```

The placeholder can be visible in client-only rendering or if the deferred content cannot be rendered on the server. Keep dimensions and accessible labels appropriate to avoid layout shifts and confusing screen-reader output.

## Hydration triggers

The available triggers are:

| Trigger | When Angular hydrates |
| --- | --- |
| `hydrate on idle` | When the browser is idle; accepts an optional timeout such as `hydrate on idle(2s)`. |
| `hydrate on viewport` | When the block enters the viewport. |
| `hydrate on interaction` | After a user interaction with the block or a specified reference. |
| `hydrate on hover` | When the pointer hovers or the block receives focus. |
| `hydrate on immediate` | As soon as non-deferred content has rendered. |
| `hydrate on timer(500ms)` | After the specified duration. |
| `hydrate when condition` | When a template expression becomes truthy. |
| `hydrate never` | Keep the block dehydrated for the lifetime of the page. Use only for content that does not need client-side behavior. |

Multiple `hydrate` triggers can be separated with semicolons; the first trigger to fire starts hydration.

```html
@defer (hydrate on interaction; hydrate on timer(5s)) {
  <app-recommendations />
} @placeholder {
  <button type="button">Load recommendations</button>
}
```

Use a trigger that matches the content's purpose. For example, `hydrate on viewport` is often appropriate for below-the-fold content, while a control that users may activate immediately should not be delayed behind an unpredictable trigger.

## Hydration is not the same as loading

Ordinary `@defer` triggers (`on idle`, `on viewport`, `on interaction`, and others) control when deferred dependencies and content are loaded. `hydrate` triggers control when server-rendered content becomes interactive in the browser. Incremental hydration combines these behaviors so the server can render the main content without eagerly hydrating it on the client.

Do not use hydration triggers as a substitute for route-level code splitting, server-side data loading, or a loading/error state for a request. Each solves a different problem.

## Event replay

Incremental hydration uses event replay to capture supported user events that occur before a dehydrated block becomes interactive, then replay them after hydration. Event replay does not make every interaction or third-party widget safe to delay. Test keyboard, pointer, focus and form interactions on the actual rendered page.

## Practical guidance

- Start with a measurable goal such as reducing initial JavaScript work; compare Core Web Vitals and bundle/network traces before and after.
- Defer content that is useful to show on the initial page but does not need immediate client behavior.
- Keep server and browser markup consistent and avoid browser-only APIs during server rendering.
- Ensure any data needed to render the deferred block is available to SSR.
- Avoid delaying essential navigation, form submission, or other critical interactions.
- Test hydration in a production build; development mode alone does not reflect real loading behavior.

## Related guides

- [SSR Introduction](/ssr/introduction/)
- [Hydration](/ssr/hydration/)
- [Template Control Flow & `@defer`](/modern/control-flow/#deferrable-views-defer)
