---
title: Event Replay 🖱️
description: Understand Angular event replay during SSR and hydration, when it is enabled, how it works with incremental hydration and how to verify it.
sidebar:
  order: 5
---

Server-rendered HTML can be visible before Angular has loaded and hydrated the application. During that gap, a visitor may click a button or submit a form. Event replay captures supported interactions and replays them when the relevant Angular view becomes interactive.

## What event replay does

1. The server sends rendered HTML to the browser.
2. Before the application is hydrated, the user interacts with visible content.
3. Angular records supported events.
4. Once hydration completes for the relevant component, Angular replays the events so the interaction is not lost.

Event replay improves the experience for SSR pages whose JavaScript takes time to download. It does not replace correct loading states, accessibility or application-level error handling.

## Event replay in Angular 22

With hydration enabled, incremental hydration is the default in Angular 22. Event replay is enabled with incremental hydration as well. A standard SSR app typically needs only:

```ts title="src/app/app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
  ],
};
```

The server configuration should merge the browser configuration so hydration providers are available during server rendering too. See [SSR Introduction](/ssr/introduction/) and [Hydration](/ssr/hydration/).

:::note[Angular 21 and earlier]
In earlier versions, event replay was enabled explicitly with `withEventReplay()`. In Angular 22, incremental hydration enables it by default. If you opt out of incremental hydration and still need event replay, configure `withEventReplay()` as described by the API for your version.
:::

## Interaction with incremental hydration

Incremental hydration lets a deferred section remain dehydrated until a trigger occurs. Event replay helps preserve events that happen before the section is hydrated.

```html
@defer (hydrate on interaction) {
  <app-add-to-cart [product]="product()" />
} @placeholder {
  <button type="button" disabled>Loading purchase options…</button>
}
```

Use the correct `hydrate` trigger for the interaction. A placeholder control should not pretend to be an active button if it cannot perform the action yet.

## Verify the behavior

- Test a production or SSR build; client-only development rendering does not exercise server hydration.
- Use a throttled network in browser developer tools to create a realistic gap before hydration.
- Interact with a server-rendered control while scripts are loading, then confirm the expected action happens once.
- Check the browser console for hydration mismatch errors.
- Test keyboard activation and screen-reader labels in addition to pointer clicks.

## Limitations and good practices

- Event replay is not a guarantee that every custom DOM event is captured.
- Do not perform irreversible work merely because a DOM event was replayed; keep server/API actions idempotent where possible.
- Avoid direct DOM mutation that causes the server and client markup to differ.
- Keep forms usable: labels, validation messages and submission state should remain understandable.
- If an interaction must work before JavaScript, use a server-backed form or another progressive-enhancement strategy.

## Related pages

- [Hydration](/ssr/hydration/)
- [Incremental Hydration](/modern/incremental-hydration/)
- [SSR Introduction](/ssr/introduction/)
