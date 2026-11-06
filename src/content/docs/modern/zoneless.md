---
title: Zoneless Angular ⚡
description: Learn how Angular schedules rendering without Zone.js, what notifications trigger updates, how to migrate and how zoneless affects SSR and tests.
sidebar:
  order: 11
---

Angular can schedule rendering without Zone.js. Instead of watching patched browser APIs and checking whether state may have changed, zoneless Angular relies on explicit notifications from Angular APIs and application state.

Zoneless change detection is stable and is the default for new applications starting with Angular 21. It does not mean that Angular stops updating the UI; it means code must notify Angular through supported mechanisms.

## Why use zoneless Angular?

Removing Zone.js can reduce runtime overhead, make stack traces easier to read and avoid browser API patching. The actual performance impact depends on the application, so measure before and after a migration rather than assuming a fixed improvement.

## What schedules change detection?

Angular receives notifications such as:

- Updating a signal read by a template
- A bound template or host event listener running
- `ChangeDetectorRef.markForCheck()`
- `ComponentRef.setInput()`
- Attaching a view that is already marked dirty
- `AsyncPipe` receiving a new value (it calls `markForCheck()`)

Use these notification paths consistently. Direct assignment to an ordinary field from an arbitrary callback does not by itself schedule an update in zoneless mode.

## New projects and existing projects

New Angular 21+ projects are zoneless by default; the CLI omits Zone.js. You normally do not need to register `provideZonelessChangeDetection()` yourself.

In Angular 20, enable it explicitly:

```ts
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
});
```

In an existing application, migrate incrementally: make asynchronous state updates use signals or another Angular notification mechanism, test the affected features, and then remove Zone.js.

## Update state from asynchronous work

This callback assigns an ordinary field but does not notify Angular:

```ts
this.api.load().subscribe((value) => {
  this.value = value;
});
```

Prefer converting a stable observable to a signal:

```ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApi } from './catalog-api';

@Component({
  template: `
    @if (products(); as items) {
      @for (product of items; track product.id) {
        <p>{{ product.name }}</p>
      }
    }
  `,
})
export class ProductList {
  private readonly api = inject(CatalogApi);
  protected readonly products = toSignal(this.api.getProducts(), { initialValue: [] });
}
```

The `AsyncPipe` is also a valid choice for template-driven observable rendering. For imperative code that must update an ordinary field, call `markForCheck()` after the update.

## OnPush-compatible components

Using `ChangeDetectionStrategy.OnPush` is a recommended way to prepare for zoneless rendering, but it is not required for zoneless compatibility: components must notify Angular when state changes. Angular 22 makes OnPush the default for components, so new v22 examples do not need to set it explicitly.

For code that must preserve pre-v22 eager checking behavior, use `ChangeDetectionStrategy.Eager`. The v22 update migration adds this where needed.

## Remove Zone.js from an existing workspace

After confirming that the app and dependencies work without Zone.js:

1. Remove `zone.js` from the `polyfills` configuration in `angular.json`.
2. Remove `zone.js/testing` from test polyfills if present.
3. Remove imports of `zone.js` and `zone.js/testing` from a custom polyfills file.
4. Remove the dependency if no other package needs it: `npm uninstall zone.js`.
5. Run unit, integration and end-to-end tests, then build and test in a real browser.

The CLI migration can help with upgrade-related changes. Check its output and review the diff before applying a migration in a large workspace.

## `NgZone` and stability APIs

`NgZone.run()` and `runOutsideAngular()` remain compatible and can still be useful for libraries that also support Zone.js applications. In a zoneless app, `NgZone.onMicrotaskEmpty`, `onStable` and `onUnstable` do not emit, and `isStable` is always `true`; do not use them to schedule app work.

Use `afterNextRender()` or `afterEveryRender()` when work depends on Angular finishing a render. Use a direct browser API such as `MutationObserver` when observing DOM changes is the actual requirement.

## SSR and pending asynchronous work

Server rendering must know when asynchronous work that affects the rendered HTML is complete. Use `PendingTasks` for work Angular cannot otherwise track:

```ts
import { inject, PendingTasks } from '@angular/core';

const pendingTasks = inject(PendingTasks);

pendingTasks.run(async () => {
  const result = await loadDataNeededForThePage();
  this.data.set(result);
});
```

`HttpClient` requests and router navigation are integrated with Angular's stability tracking. Do not mark unrelated background work as pending, or SSR may wait longer than necessary. See [SSR Introduction](/ssr/introduction/).

## Reactive Forms note

Reactive Forms update their own state and emit observables, but updates such as `setValue()` do not necessarily notify a zoneless component to render. If a template reads Reactive Forms state, connect the relevant observable to a signal or call `ChangeDetectorRef.markForCheck()` when the state changes.

## Testing

Angular's `TestBed` uses zoneless change detection by default. Prefer `await fixture.whenStable()` after asynchronous actions, and use `fixture.detectChanges()` when a test intentionally changes ordinary fields directly. Zone-based tests can explicitly provide `provideZoneChangeDetection()`.

## Migration checklist

- Replace direct field writes from timers or subscriptions with signals, `AsyncPipe` or explicit `markForCheck()`.
- Remove code relying on `NgZone.onStable` or `isStable`.
- Use `PendingTasks` for server-rendered async work not tracked by Angular.
- Test browser APIs and third-party libraries without relying on Zone.js patches.
- Remove Zone.js only after tests pass.

## Next steps

- [Angular Signals](/modern/signals/)
- [Testing Fundamentals](/testing/unit-testing/)
- [SSR Introduction](/ssr/introduction/)
