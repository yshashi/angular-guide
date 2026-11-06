---
title: Observables & Observers 📡
description: Understand RxJS Observables, Observers and Subscriptions in depth - the contract, teardown, sync vs async, hot vs cold, and wrapping browser APIs.
sidebar:
  order: 2
---

In [RxJS Fundamentals](/rxjs/fundamentals/) you met the Observable. This page looks inside it: how values travel from a
**producer** to an **Observer**, what a **Subscription** really is, and how to turn any callback-based browser API into
an Observable you can use in Angular.

## What you'll learn

- The three roles: Observable, Observer and Subscription
- The Observable contract (`next*`, then `error` **or** `complete`)
- How teardown logic works and how to group subscriptions
- Synchronous vs asynchronous emissions
- Cold vs hot Observables, and how to share one execution
- How to wrap browser APIs (`ResizeObserver`, `online`/`offline` events) and use them in components

## The three roles

```ts
import { Observable, Observer, Subscription } from 'rxjs';

// 1. Observable — the producer (a blueprint, nothing runs yet)
const greeting$ = new Observable<string>((subscriber) => {
  subscriber.next('Hello');
  subscriber.next('Angular');
  subscriber.complete();
});

// 2. Observer — the consumer
const observer: Observer<string> = {
  next: (value) => console.log(value),
  error: (err) => console.error(err),
  complete: () => console.log('complete'),
};

// 3. Subscription — the running connection
const subscription: Subscription = greeting$.subscribe(observer);
```

| Role | Type | Job |
|---|---|---|
| Observable | `Observable<T>` | Describes *how* to produce values. Lazy. |
| Observer | `Observer<T>` (or `Partial<Observer<T>>`) | Receives `next`, `error`, `complete` notifications. |
| Subscription | `Subscription` | Represents one execution. `unsubscribe()` stops it and runs teardown. |

### Partial observers

You only need to pass the callbacks you care about:

```ts
greeting$.subscribe({ next: (v) => console.log(v) });
greeting$.subscribe({ complete: () => console.log('finished') });
greeting$.subscribe((v) => console.log(v)); // a single function = `next`
```

:::caution[Deprecated: separate callback arguments]
`subscribe(next, error, complete)` and `tap(next, error, complete)` with **multiple function arguments** are deprecated
in RxJS 7 and will be removed in RxJS 8. Pass an observer object instead:
`subscribe({ next, error, complete })`.
:::

## The Observable contract

Every Observable follows the same grammar:

```
next*  ( error | complete )?
```

- Zero or more `next` notifications…
- …optionally followed by **exactly one** `error` **or** `complete`.
- After `error` or `complete`, nothing else is delivered — even if the producer keeps calling `next()`.

```ts
import { Observable } from 'rxjs';

const broken$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.error(new Error('Something broke'));
  subscriber.next(2); // ignored — the stream is already closed
});

broken$.subscribe({
  next: (n) => console.log('next', n),
  error: (err: Error) => console.log('error', err.message),
  complete: () => console.log('complete'), // never called
});

// next 1
// error Something broke
```

If the producer function **throws**, RxJS turns the exception into an `error` notification for you.

:::tip
An Observable that errors is **finished**. To keep a long-lived stream (such as a search box) alive after an HTTP error,
catch the error *inside* the inner request. See [Error Handling](/rxjs/error-handling/).
:::

## Teardown: cleaning up the producer

Return a function from the producer to release resources. RxJS calls it exactly once, when any of these happen:

1. The subscriber calls `unsubscribe()`
2. The Observable calls `complete()`
3. The Observable calls `error()`

```ts
import { Observable } from 'rxjs';

const clock$ = new Observable<Date>((subscriber) => {
  const id = setInterval(() => subscriber.next(new Date()), 1000);
  return () => clearInterval(id); // teardown
});

const subscription = clock$.subscribe((date) => console.log(date.toLocaleTimeString()));
setTimeout(() => subscription.unsubscribe(), 5000); // clearInterval runs here
```

### Grouping subscriptions

A `Subscription` can hold child subscriptions. Unsubscribing the parent unsubscribes all children:

```ts
import { interval, Subscription } from 'rxjs';

const all = new Subscription();
all.add(interval(1000).subscribe((n) => console.log('A', n)));
all.add(interval(2000).subscribe((n) => console.log('B', n)));

// Later — stops both
all.unsubscribe();
console.log(all.closed); // true
```

In Angular components you rarely need this — `takeUntilDestroyed()` and `toSignal()` handle cleanup for you
(see [Cleaning up in Angular](#observables-in-angular-components)).

## Synchronous vs asynchronous

Observables are **not** automatically async. If the producer calls `next()` synchronously, the values arrive before
`subscribe()` even returns:

```ts
import { Observable } from 'rxjs';

const sync$ = new Observable<string>((subscriber) => {
  subscriber.next('sync value');
  subscriber.complete();
});

console.log('before');
sync$.subscribe((v) => console.log(v));
console.log('after');

// before
// sync value
// after
```

`of()`, `from([...])` and `BehaviorSubject` emit synchronously. `HttpClient`, `timer()`, `interval()` and `fromEvent()`
emit asynchronously. This matters for `toSignal(obs$, { requireSync: true })`, which only works with Observables
that emit synchronously on subscribe.

## Cold vs hot Observables

| | Cold | Hot |
|---|---|---|
| Producer created… | **inside** the Observable, once per subscriber | **outside** the Observable, shared |
| Each subscriber gets… | its own execution, from the start | the values emitted *after* it subscribed |
| Examples | `HttpClient` calls, `of`, `interval`, `timer` | DOM events, `Subject`s, `Router.events`, WebSockets |

```ts
import { interval, take } from 'rxjs';

// Cold: each subscriber starts its own timer from 0
const cold$ = interval(1000).pipe(take(3));
cold$.subscribe((n) => console.log('A', n));
setTimeout(() => cold$.subscribe((n) => console.log('B', n)), 1500);

// A 0, A 1, B 0, A 2, B 1, B 2
```

### Sharing one execution

Use `share()` to turn a cold Observable into a hot, shared one. The first subscriber starts the source; later
subscribers join the same execution:

```ts
import { interval, share, take, tap } from 'rxjs';

const shared$ = interval(1000).pipe(
  take(3),
  tap((n) => console.log('produced', n)), // runs once per value, not once per subscriber
  share(),
);

shared$.subscribe((n) => console.log('A', n));
setTimeout(() => shared$.subscribe((n) => console.log('B', n)), 1500);

// produced 0, A 0, produced 1, A 1, B 1, produced 2, A 2, B 2
```

`B` joined late, so it missed `0`. If late subscribers must receive the latest value, use `shareReplay`:

```ts
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { shareReplay } from 'rxjs';

// inside a service
const config$ = inject(HttpClient)
  .get<{ theme: string }>('/api/config')
  .pipe(shareReplay({ bufferSize: 1, refCount: true }));
```

More about `share`, `shareReplay` and Subjects in [Subjects & BehaviorSubject](/rxjs/subjects/).

## Wrapping browser APIs

A powerful use of `new Observable()` is turning callback APIs into streams with proper cleanup.

### Example: element size with `ResizeObserver`

```ts title="from-resize.ts"
import { Observable } from 'rxjs';

export function fromResize(element: Element): Observable<DOMRectReadOnly> {
  return new Observable<DOMRectReadOnly>((subscriber) => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        subscriber.next(entry.contentRect);
      }
    });
    observer.observe(element);

    return () => observer.disconnect(); // teardown
  });
}
```

```ts title="responsive-card.ts"
import { Component, ElementRef, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, map } from 'rxjs';
import { fromResize } from './from-resize';

@Component({
  selector: 'app-responsive-card',
  host: { '[class.compact]': 'isCompact()' },
  template: `<p>Width: {{ width() }}px ({{ isCompact() ? 'compact' : 'wide' }})</p>`,
})
export class ResponsiveCard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly width = toSignal(
    fromResize(this.host.nativeElement).pipe(
      debounceTime(50),
      map((rect) => Math.round(rect.width)),
    ),
    { initialValue: 0 },
  );

  protected readonly isCompact = computed(() => this.width() < 400);
}
```

When the component is destroyed, `toSignal()` unsubscribes, which runs the teardown and disconnects the
`ResizeObserver`. No leaks, no `ngOnDestroy`.

:::note[Server-side rendering]
`ResizeObserver`, `window` and `navigator` don't exist on the server. If your app uses SSR, only subscribe to
browser-only streams in the browser — for example inside `afterNextRender()`, or guard with
`isPlatformBrowser(inject(PLATFORM_ID))`.
:::

### Example: online/offline status as a service

```ts title="network-status.ts"
import { Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, merge, startWith } from 'rxjs';

@Service()
export class NetworkStatus {
  private readonly online$ = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false)),
  ).pipe(startWith(navigator.onLine)); // emit the current state synchronously

  readonly isOnline = toSignal(this.online$, { requireSync: true });
}
```

```ts title="offline-banner.ts"
import { Component, inject } from '@angular/core';
import { NetworkStatus } from './network-status';

@Component({
  selector: 'app-offline-banner',
  template: `
    @if (!network.isOnline()) {
      <p role="status">You are offline. Changes will sync when you reconnect.</p>
    }
  `,
})
export class OfflineBanner {
  protected readonly network = inject(NetworkStatus);
}
```

`startWith()` makes the stream emit synchronously, so `requireSync: true` gives a `Signal<boolean>` without
`undefined` in its type.

## Observables in Angular components

Components are OnPush by default since Angular 22. Signals notify Angular when they change, so the cleanest way to put
an Observable on screen is to convert it with `toSignal()`:

```ts title="route-user.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-route-user',
  template: `<h2>User #{{ userId() }}</h2>`,
})
export class RouteUser {
  private readonly route = inject(ActivatedRoute);

  protected readonly userId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
}
```

:::tip
For route params, you can also enable `withComponentInputBinding()` in `provideRouter()` and read the param with
`id = input<string>()`. Use the Observable approach when you need operators such as `switchMap`.
:::

### Inputs and outputs are not Observables

- **Inputs** created with `input()` are signals. Convert one to a stream with `toObservable(this.myInput)` when you need RxJS operators.
- **Outputs** created with `output()` return an `OutputEmitterRef`, not an Observable. Use `outputToObservable()` to
  get a stream from it, or `outputFromObservable()` to create an output from a stream. See
  [RxJS Patterns in Angular](/rxjs/angular-patterns/#outputs-from-observables).

## Checking for an Observable

```ts
import { isObservable, of } from 'rxjs';

isObservable(of(1)); // true
isObservable(Promise.resolve(1)); // false
```

## Common mistakes

- **Expecting an error to be "skipped".** After `error()`, the stream is over. Catch errors where you want the stream to survive.
- **Forgetting teardown in `new Observable()`.** If you add a listener, timer or observer, return a function that removes it.
- **Assuming `share()` replays values.** It doesn't; late subscribers miss earlier values. Use `shareReplay({ bufferSize: 1, refCount: true })` when they need the latest one.
- **Using `requireSync: true` with an async Observable.** `toSignal` throws if the Observable doesn't emit synchronously on subscribe.
- **`Observable.create()`.** Deprecated — use `new Observable()`.

## Key takeaways

- An Observable is a lazy producer; an Observer consumes; a Subscription is one running execution.
- The contract is `next*` then at most one `error` or `complete`.
- Return a teardown function from `new Observable()` to release resources.
- Cold Observables run once per subscriber; `share()`/`shareReplay()` make them shared.
- Wrap callback APIs with `new Observable()` and expose them to templates with `toSignal()`.

## Next steps

- [Subjects & BehaviorSubject](/rxjs/subjects/) — push values yourself and multicast to many subscribers
- [Transformation Operators](/rxjs/transformation-operators/) — reshape streams with `map`, `scan` and more
- [RxJS Patterns in Angular](/rxjs/angular-patterns/) — signals interop in real apps
