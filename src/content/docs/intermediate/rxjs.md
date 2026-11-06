---
title: RxJS in Angular 🌊
description: How RxJS fits into Angular 22 — signals vs observables, toSignal, toObservable, rxResource, takeUntilDestroyed, outputFromObservable and practical patterns.
sidebar:
  order: 6
---

**RxJS** is a library for working with *streams* of values over time — clicks, keystrokes, WebSocket messages, HTTP responses. Angular used to rely on it for almost everything. Since signals arrived, the roles are clearer: **signals hold state, RxJS handles events and async workflows**. This page shows how the two fit together in Angular 22 and gives you the patterns you'll use daily.

:::tip[New to RxJS?]
This page focuses on RxJS *inside Angular*. For Observables, operators and Subjects from the ground up, see the [RxJS section](/rxjs/fundamentals/).
:::

## What you'll learn

- When to use a signal and when to use an Observable
- Where Angular APIs still give you Observables
- Convert between the two with `toSignal()` and `toObservable()`
- Load data with `rxResource()`
- Clean up subscriptions with `takeUntilDestroyed()`
- Expose streams as outputs with `outputFromObservable()`

## Signals or Observables?

| | Signal | Observable |
|---|---|---|
| Represents | A **value** that changes over time ("what is it now?") | A **stream of events** ("what happened?") |
| Always has a current value | ✅ Yes | ❌ Not necessarily |
| Read it | Call it: `count()` | `subscribe()` / `async` pipe / `toSignal()` |
| Time-based operators (debounce, retry, buffer…) | ❌ | ✅ Huge operator library |
| Cancellation of in-flight work (`switchMap`) | via `resource` (aborts the previous request) | ✅ |
| Needs unsubscribing | No | Yes (or use helpers) |
| Template change detection | Automatic and precise | Via `async` pipe or `toSignal()` |

**Rule of thumb for Angular 22:**

- Component and service **state** → `signal()`, derived state → `computed()`.
- **Fetching data** → `httpResource()` / `resource()` (or `rxResource()` if your API returns Observables).
- **Event streams and complex async coordination** (typeahead, polling, WebSockets, retry/backoff, combining many sources) → RxJS, then convert the result to a signal for the template.

## Where Angular still gives you Observables

| API | Observable |
|---|---|
| `HttpClient` | `http.get()`, `post()`, … (cold, complete after one response) |
| Router | `router.events`, `ActivatedRoute.paramMap`, `queryParamMap`, `data` |
| Reactive forms | `control.valueChanges`, `statusChanges`, `events` |
| Outputs | `OutputRef.subscribe()` (convert with `outputToObservable()`) |
| Many libraries | Angular Material/CDK (`BreakpointObserver`, dialogs), NgRx Store, … |

All bridging helpers live in **`@angular/core/rxjs-interop`** (stable).

## Observable → signal: `toSignal()`

`toSignal()` subscribes immediately and gives you a signal of the latest value. It **unsubscribes automatically** when the component or service is destroyed.

```ts title="ticker.ts"
import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-ticker',
  template: `{{ seconds() }}s`,
})
export class Ticker {
  protected readonly seconds = toSignal(interval(1000), { initialValue: 0 });
}
```

Handling the "no value yet" moment:

| Option | Signal type | Use when |
|---|---|---|
| *(none)* | `Signal<T \| undefined>` | You can handle `undefined` in the template |
| `{ initialValue: x }` | `Signal<T \| typeof x>` | You have a sensible default (`[]`, `0`, `''`) |
| `{ requireSync: true }` | `Signal<T>` | The source emits synchronously (`BehaviorSubject`, `startWith`) — throws otherwise |

Other options: `equal` (custom equality), `injector` (when called outside an injection context), `manualCleanup`, `debugName`.

Real-world uses — route params and router events:

```ts title="product-page.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-product-page',
  template: `<p>Product {{ id() }}</p><p>Current URL: {{ url() }}</p>`,
})
export class ProductPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  protected readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
}
```

:::tip
For route params, `withComponentInputBinding()` + `input()` is even simpler — see [Advanced Routing](/intermediate/advanced-routing/).
:::

Good to know:

- Call `toSignal()` **once** (e.g. as a field) and reuse the signal — every call creates a new subscription.
- If the Observable **errors**, reading the signal throws that error. Catch errors in the pipe (`catchError`) if you want a fallback value.
- It must run in an injection context (constructor/field initializer) unless you pass `{ injector }`.

## Signal → Observable: `toObservable()` — a typeahead search

`toObservable()` turns a signal into an Observable so you can use time-based operators. The classic example is a search box that waits for the user to stop typing and cancels outdated requests:

```ts title="user-search.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-search',
  template: `
    <input #box placeholder="Search users" (input)="query.set(box.value)" />
    <ul>
      @for (user of results(); track user.id) {
        <li>{{ user.name }}</li>
      } @empty {
        <li>No results</li>
      }
    </ul>
  `,
})
export class UserSearch {
  private readonly http = inject(HttpClient);
  protected readonly query = signal('');

  protected readonly results = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim()),
      debounceTime(300),            // wait until typing pauses
      distinctUntilChanged(),       // ignore unchanged queries
      switchMap((q) =>              // cancel the previous request
        q.length < 2
          ? of([])
          : this.http.get<User[]>('/api/users', { params: { q } }).pipe(
              catchError(() => of([])), // keep the stream alive on errors
            ),
      ),
    ),
    { initialValue: [] as User[] },
  );
}
```

`toObservable()` emits **after** the signal settles (it uses an effect), so if you set a signal three times synchronously, only the last value is emitted.

:::note[A signals-only alternative]
The experimental `debounced(signal, ms)` from `@angular/core` returns a resource you can feed into `httpResource()` — no RxJS required. Because it's experimental, the RxJS version above is the safe choice for production today. See [Resource API](/modern/resource-api/).
:::

## Loading data: `rxResource()`

`rxResource()` is the Observable flavour of [`resource()`](/modern/resource-api/) (stable since v22). It re-runs `stream` whenever `params` change, cancels the previous stream, and exposes `value()`, `isLoading()`, `error()`, `hasValue()` and `reload()` as signals.

```ts title="user-profile.ts"
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserApi } from './user-api'; // returns Observable<User>

@Component({
  selector: 'app-user-profile',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p>Could not load user. <button type="button" (click)="user.reload()">Retry</button></p>
    } @else if (user.hasValue()) {
      <h2>{{ user.value().name }}</h2>
    }
  `,
})
export class UserProfile {
  readonly userId = input.required<number>();
  private readonly api = inject(UserApi);

  protected readonly user = rxResource({
    params: () => this.userId(),
    stream: ({ params: id }) => this.api.getUser(id),
  });
}
```

- If `params` returns `undefined`, the resource stays `idle` and `stream` doesn't run.
- For plain HTTP GETs, ``httpResource<User>(() => `/api/users/${this.userId()}`)`` is shorter — see [httpResource](/modern/http-resource-api/).
- Use `rxResource` when you already have Observable-returning services or need RxJS operators (`retry`, `timeout`, WebSocket streams).

## Cleaning up: `takeUntilDestroyed()`

Every manual `subscribe()` needs to end. `takeUntilDestroyed()` completes the stream when the surrounding component, directive or service is destroyed:

```ts title="scroll-tracker.ts"
import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, throttleTime } from 'rxjs';

@Component({
  selector: 'app-scroll-tracker',
  template: `Scrolled: {{ y() }}px`,
})
export class ScrollTracker {
  protected readonly y = signal(0);

  constructor() {
    fromEvent(window, 'scroll')
      .pipe(throttleTime(100), takeUntilDestroyed()) // put it last in the pipe
      .subscribe(() => this.y.set(window.scrollY));
  }
}
```

Outside the constructor, pass a `DestroyRef`:

```ts
private readonly destroyRef = inject(DestroyRef);

protected start() {
  interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.poll());
}
```

**You don't need to unsubscribe** from: the `async` pipe, `toSignal()`, `rxResource()`, `outputFromObservable()`, and single-shot `HttpClient` calls (they complete) — although cancelling a slow HTTP request when the user leaves is still a good idea.

:::note[Legacy pattern]
Older code uses `private destroy$ = new Subject<void>()` + `takeUntil(this.destroy$)` + `ngOnDestroy() { this.destroy$.next(); }`. `takeUntilDestroyed()` replaces all of that.
:::

## Outputs and Observables

Expose an Observable as a component/directive **output** with `outputFromObservable()`. Angular subscribes only when someone listens, and stops when the directive is destroyed.

```ts title="click-outside.ts"
import { Directive, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';

@Directive({ selector: '[appClickOutside]' })
export class ClickOutside {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  readonly appClickOutside = outputFromObservable(
    fromEvent<MouseEvent>(this.document, 'click').pipe(
      filter((e) => !this.el.nativeElement.contains(e.target as Node)),
    ),
  );
}
```

```html
<div (appClickOutside)="open.set(false)">…</div>
```

The reverse, `outputToObservable(componentRef.instance.someOutput)`, turns any output into an Observable (e.g. for dynamically created components).

## The `async` pipe

The `async` pipe subscribes in the template and unsubscribes automatically. It still works and is fine for simple cases:

```html
@if (user$ | async; as user) {
  <p>{{ user.name }}</p>
}
```

In new code prefer `toSignal()` or a resource: you get a typed value you can also use in `computed()`, and you avoid multiple subscriptions when the same stream is used several times in a template.

## Essential operators cheat sheet

| Need | Operator |
|---|---|
| Transform each value | `map` |
| Skip values | `filter`, `distinctUntilChanged` |
| Wait for a pause / limit rate | `debounceTime`, `throttleTime` |
| Switch to the latest inner request (search) | `switchMap` |
| Run requests one after another (saves) | `concatMap` |
| Ignore new triggers while busy (submit button) | `exhaustMap` |
| Run in parallel | `mergeMap` |
| Combine latest values of several streams | `combineLatest` |
| Wait for several requests to finish | `forkJoin` |
| Recover / retry | `catchError`, `retry({ count, delay })` |
| Share one subscription between many subscribers | `shareReplay({ bufferSize: 1, refCount: true })` |

Details and diagrams: [Transformation](/rxjs/transformation-operators/), [Filtering](/rxjs/filtering-operators/), [Combination](/rxjs/combination-operators/), [Error handling](/rxjs/error-handling/).

## State in services: prefer signals over `BehaviorSubject`

Many older services keep state in a `BehaviorSubject` and expose it with `asObservable()`. In Angular 22 a `signal()` does the same job with less code and no subscriptions (see [State Management](/intermediate/state-management/)). If you must consume such a service, convert it once with `toSignal(service.state$, { requireSync: true })`.

Keep `Subject`s for true **events** (notifications, messages from a WebSocket), not for state.

## Common mistakes

- **Subscribing without cleanup** → memory leaks and duplicated work. Use `takeUntilDestroyed()`, `toSignal()` or a resource.
- **Nested `subscribe()` calls** → use `switchMap`/`concatMap`/`mergeMap` instead.
- **Calling `toSignal()` inside a method or `computed()`** → new subscription each time and an injection-context error. Create it once as a field.
- **`catchError` at the outer level of a long-lived stream** → the stream completes after the first error. Catch errors on the *inner* Observable (inside `switchMap`).
- **Using RxJS for simple state** → a `signal()` is simpler and works perfectly with OnPush.
- **Forgetting `initialValue`** and fighting `undefined` in templates.

## Key takeaways

- Signals for state, RxJS for event streams and async orchestration.
- `toSignal()` / `toObservable()` bridge the two worlds; both clean up automatically.
- `rxResource()` and `httpResource()` replace most manual "fetch in `ngOnInit` + subscribe" code.
- `takeUntilDestroyed()` is the modern way to end manual subscriptions.
- `outputFromObservable()` turns a stream into a component output.

## Next steps

- [RxJS fundamentals](/rxjs/fundamentals/) — Observables from scratch
- [Angular RxJS patterns](/rxjs/angular-patterns/) — more real-world recipes
- [Resource API](/modern/resource-api/) and [httpResource](/modern/http-resource-api/) — signal-based data loading
- [State Management](/intermediate/state-management/) — signal-based stores
