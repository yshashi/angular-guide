---
title: RxJS Fundamentals 🔄
description: Learn RxJS from zero for Angular 22 - streams, Observables, operators, subscriptions, and how RxJS fits next to signals.
sidebar:
  order: 1
---

RxJS (Reactive Extensions for JavaScript) is a library for working with **values that arrive over time**: clicks, keystrokes,
HTTP responses, WebSocket messages, timers. Angular uses RxJS in `HttpClient`, the Router and Reactive Forms, and gives you
ready-made bridges between RxJS and [signals](/modern/signals/).

This page gives you the mental model. The rest of the RxJS section builds on it step by step.

## What you'll learn

- What a stream is and why Observables exist
- The building blocks: Observable, Observer, Subscription, operators, Subjects
- How Observables differ from Promises and from signals
- How to create Observables and transform them with `pipe()`
- Where Angular uses RxJS, and how to clean up subscriptions the modern way

:::note[Which RxJS version?]
New Angular 22 projects install **RxJS 7.8** (`"rxjs": "~7.8.0"` in `package.json`). Angular 22 supports
`rxjs ^6.5.3 || ^7.4`. Everything in this section is written for RxJS 7.8. RxJS 8 is not released as stable, so
we don't use any RxJS 8-only APIs.
:::

## The big idea: streams

A **stream** is a sequence of values delivered over time. Think of a conveyor belt: items arrive one by one, and you
decide what to do with each item as it arrives.

```
keystrokes:  --a----b--c--------d-->
HTTP call:   -----------response|
timer:       ----0----1----2----3-->
```

That text notation is called a **marble diagram**. Time flows left to right, each letter is a value, `|` means
"completed" and `#` means "errored". You'll see marble diagrams throughout this section.

### Push vs pull

| | Single value | Multiple values |
|---|---|---|
| **Pull** (you ask for the value) | Function | Iterator / generator |
| **Push** (the value is delivered to you) | Promise | **Observable** |

An Observable is the "push, many values" corner of this table. A Promise gives you **one** value; an Observable can give
you **zero, one, or many** values, and can finish (complete) or fail (error).

## The building blocks

| Concept | What it is | Analogy |
|---|---|---|
| **Observable** | A blueprint for a stream of values. Nothing happens until someone subscribes. | A YouTube video |
| **Observer** | An object with `next`, `error` and `complete` callbacks that receives the values. | The viewer |
| **Subscription** | The live connection between an Observable and an Observer. Call `unsubscribe()` to stop. | Pressing play (and stop) |
| **Operator** | A function that takes an Observable and returns a new, transformed Observable. | A video filter |
| **Subject** | An Observable you can also push values into, shared by many subscribers. | A live stream |
| **Scheduler** | Controls *when* work happens (sync, microtask, timer, animation frame). | The clock |

## Your first Observable

```ts
import { Observable } from 'rxjs';

const numbers$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

numbers$.subscribe({
  next: (value) => console.log('Value:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Done!'),
});

// Value: 1
// Value: 2
// Value: 3
// Done!
```

- The function passed to `new Observable()` runs **each time** someone subscribes.
- `subscriber.next(value)` sends a value, `subscriber.complete()` ends the stream, `subscriber.error(err)` fails it.
- After `complete()` or `error()`, no more values are delivered.

:::tip[Passing only a `next` callback is fine]
`numbers$.subscribe((value) => console.log(value))` is still valid. What's **deprecated** is passing three separate
callbacks: `subscribe(next, error, complete)`. When you need `error` or `complete`, pass an **observer object** as above.
:::

### Observables are lazy

Nothing runs until you subscribe, and every subscriber gets its own execution:

```ts
import { Observable } from 'rxjs';

const random$ = new Observable<number>((subscriber) => {
  console.log('Producing a value…');
  subscriber.next(Math.random());
  subscriber.complete();
});

// Nothing logged yet — no one has subscribed.

random$.subscribe((n) => console.log('A got', n));
random$.subscribe((n) => console.log('B got', n)); // A and B get DIFFERENT numbers
```

This "one execution per subscriber" behaviour is called a **cold** Observable. `HttpClient` requests are cold: two
subscriptions send **two** HTTP requests. You'll learn how to share one execution in [Subjects](/rxjs/subjects/).

### The lifecycle and cleanup

The function you pass to `new Observable()` can return a **teardown** function. RxJS calls it when the subscriber
unsubscribes, or when the Observable completes or errors.

```ts
import { Observable } from 'rxjs';

const ticks$ = new Observable<number>((subscriber) => {
  let count = 0;
  const id = setInterval(() => subscriber.next(count++), 1000);

  return () => {
    clearInterval(id); // teardown: stop the timer
    console.log('Cleaned up');
  };
});

const subscription = ticks$.subscribe((n) => console.log('tick', n));

setTimeout(() => subscription.unsubscribe(), 3500);
// tick 0, tick 1, tick 2, Cleaned up
```

If you forget to unsubscribe from an endless stream like this, the timer keeps running forever — a **memory leak**.
Angular gives you tools so that you rarely call `unsubscribe()` yourself (see [Cleaning up](#cleaning-up-subscriptions-in-angular)).

## Observable vs Promise

```ts
import { Observable } from 'rxjs';

const promise = new Promise<number>((resolve) => {
  console.log('Promise runs immediately (eager)');
  resolve(42);
});

const observable$ = new Observable<number>((subscriber) => {
  console.log('Observable runs only when subscribed (lazy)');
  subscriber.next(42);
  subscriber.complete();
});

observable$.subscribe((value) => console.log(value));
```

| | Promise | Observable |
|---|---|---|
| Values | Exactly one | Zero, one, or many |
| Starts | Immediately (eager) | On `subscribe()` (lazy) |
| Cancel | Not built in | `unsubscribe()` |
| Sharing | Always shared | Cold by default (one execution per subscriber) |
| Operators | `then`/`catch` | 100+ operators (`map`, `filter`, `switchMap`…) |
| Sync/async | Always async | Can be sync or async |

### Converting between them

```ts
import { firstValueFrom, from, lastValueFrom, of } from 'rxjs';

// Promise → Observable
const fromPromise$ = from(fetch('/api/health'));

// Observable → Promise
async function demo() {
  const first = await firstValueFrom(of(1, 2, 3)); // 1
  const last = await lastValueFrom(of(1, 2, 3)); // 3
  console.log(first, last);
}
```

:::caution[`toPromise()` is deprecated]
`observable.toPromise()` is deprecated in RxJS 7 and will be removed in RxJS 8. Use `firstValueFrom()` (resolve with the
first value) or `lastValueFrom()` (resolve with the last value when the Observable completes). Both reject with
`EmptyError` if the Observable completes without emitting — pass `{ defaultValue }` to avoid that.
:::

## Creating Observables

You rarely call `new Observable()` yourself. RxJS ships **creation functions**:

```ts
import { defer, EMPTY, from, fromEvent, interval, NEVER, of, range, throwError, timer } from 'rxjs';

of(1, 2, 3); // emits 1, 2, 3 then completes
from([10, 20, 30]); // array, Promise, iterable, or another Observable
from(Promise.resolve('hi')); // emits 'hi' then completes
range(1, 5); // 1, 2, 3, 4, 5
interval(1000); // 0, 1, 2… every second, forever
timer(2000); // emits 0 after 2s, then completes
timer(0, 1000); // emits 0 immediately, then every second
fromEvent<MouseEvent>(document, 'click'); // DOM events
defer(() => from(fetch('/api'))); // creates the source lazily, per subscriber
throwError(() => new Error('Oops')); // errors immediately
EMPTY; // completes immediately, no values
NEVER; // never emits, never completes
```

| Function | Use it for |
|---|---|
| `of(...values)` | A fixed list of values, mocks, fallbacks |
| `from(input)` | Converting arrays, Promises, iterables |
| `interval(ms)` / `timer(due, period?)` | Polling, countdowns, delays |
| `fromEvent(target, name)` | Events on `window`/`document` or third-party emitters |
| `defer(factory)` | Make Promise-based code lazy and retryable |
| `throwError(() => err)` | Returning an error inside `catchError`/`switchMap` |
| `EMPTY` / `NEVER` | "Do nothing" branches |

:::caution[Always pass a factory to `throwError`]
`throwError(new Error('x'))` (passing the error directly) is deprecated. Write `throwError(() => new Error('x'))`.
:::

## Operators and `pipe()`

Operators are functions you chain with `pipe()`. Each operator returns a **new** Observable — the original is never changed.

```ts
import { filter, map, of } from 'rxjs';

of(1, 2, 3, 4, 5)
  .pipe(
    filter((n) => n % 2 === 0), // keep even numbers
    map((n) => n * 10), // multiply by 10
  )
  .subscribe((n) => console.log(n));

// 20
// 40
```

```
source:   -1-2-3-4-5|
filter:   ---2---4--|
map:      ---20--40-|
```

Import operators straight from `'rxjs'` (supported since RxJS 7.2). The older `'rxjs/operators'` path still works,
but new code doesn't need it.

The operators you'll use most:

| Category | Operators | Page |
|---|---|---|
| Transform | `map`, `scan`, `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` | [Transformation](/rxjs/transformation-operators/) |
| Filter | `filter`, `debounceTime`, `distinctUntilChanged`, `take`, `first` | [Filtering](/rxjs/filtering-operators/) |
| Combine | `combineLatest`, `forkJoin`, `merge`, `withLatestFrom` | [Combination](/rxjs/combination-operators/) |
| Errors | `catchError`, `retry`, `finalize` | [Error handling](/rxjs/error-handling/) |
| Side effects | `tap` | everywhere |

## Where Angular uses RxJS

| Angular API | What you get |
|---|---|
| `HttpClient.get()` / `post()`… | A cold Observable that emits one response and completes |
| `Router.events` | A stream of navigation events |
| `ActivatedRoute.paramMap`, `queryParamMap`, `data` | Observables of route state |
| `FormControl.valueChanges`, `statusChanges`, `events` | Streams of Reactive Forms changes |
| `@angular/core/rxjs-interop` | `toSignal`, `toObservable`, `takeUntilDestroyed`, `rxResource`, `outputFromObservable`, `outputToObservable` |

### Signals or RxJS?

Modern Angular uses **both**. A good rule of thumb:

| Use **signals** for… | Use **RxJS** for… |
|---|---|
| State that has a current value (`count`, `user`, `filters`) | Events over time (keystrokes, clicks, WebSocket messages) |
| Derived values (`computed()`) | Time-based logic (`debounceTime`, `throttleTime`, `interval`) |
| What the template reads | Racing, cancelling, retrying async work (`switchMap`, `retry`) |
| Simple async reads (`resource`, `httpResource`) | Combining many async sources |

Then convert at the boundary with `toSignal()` (Observable → signal) and `toObservable()` (signal → Observable).

## A first Angular example

Here's a search box that waits until the user stops typing, then shows the term. RxJS handles the timing, a signal feeds
the template.

```ts title="search-box.ts"
import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-search-box',
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="search" placeholder="Search…" />
    <p>Searching for: {{ term() }}</p>
  `,
})
export class SearchBox {
  protected readonly search = new FormControl('', { nonNullable: true });

  protected readonly term = toSignal(
    this.search.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(300), // wait 300 ms after the last keystroke
      distinctUntilChanged(), // ignore repeats
    ),
    { initialValue: '' },
  );
}
```

`toSignal()` subscribes for you and **unsubscribes automatically** when the component is destroyed. Components are
OnPush by default since Angular 22, and signals tell Angular exactly when to re-render.

And an HTTP request — `HttpClient` returns an Observable:

```ts title="user-list.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-list',
  template: `
    @for (user of users(); track user.id) {
      <p>{{ user.name }}</p>
    } @empty {
      <p>Loading…</p>
    }
  `,
})
export class UserList {
  private readonly http = inject(HttpClient);

  protected readonly users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
}
```

:::tip
For plain "load this data" cases, [`httpResource`](/modern/http-resource-api/) also gives you loading and error signals
without writing any RxJS. Reach for RxJS when you need operators such as `debounceTime`, `switchMap` or `retry`.
:::

## Cleaning up subscriptions in Angular

Every `subscribe()` you write is a resource you own. Use one of these, in order of preference:

| Technique | When |
|---|---|
| `toSignal(obs$)` | You want to show the value in a template or use it in `computed()` |
| `async` pipe | You keep an Observable and render it with `{{ obs$ \| async }}` |
| `takeUntilDestroyed()` | You must `subscribe()` for a side effect (logging, navigation, saving) |
| Nothing | The Observable completes on its own (e.g. a single `HttpClient` call) |

```ts title="clock.ts"
import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-clock',
  template: `<p>Seconds: {{ seconds() }}</p>`,
})
export class Clock {
  protected readonly seconds = signal(0);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed()) // unsubscribes when the component is destroyed
      .subscribe((n) => this.seconds.set(n + 1));
  }
}
```

`takeUntilDestroyed()` without arguments must be called in an **injection context** (a constructor or field initializer).
Elsewhere, pass a `DestroyRef`: `takeUntilDestroyed(this.destroyRef)`. More in [RxJS Patterns in Angular](/rxjs/angular-patterns/).

## Naming convention: the `$` suffix

End Observable variable names with `$` so readers can tell streams from plain values and signals:

```ts
const users$ = this.http.get<User[]>('/api/users'); // Observable
const users = toSignal(users$, { initialValue: [] }); // Signal
```

## Common mistakes

- **Forgetting to subscribe.** `this.http.post(...)` does nothing until something subscribes (or `toSignal`/`async` pipe does it for you).
- **Subscribing twice by accident.** Each subscription to a cold Observable re-runs it — two subscriptions to an HTTP call send two requests.
- **Nesting `subscribe()` inside `subscribe()`.** Use a flattening operator like `switchMap` instead ([Higher-order Observables](/rxjs/higher-order-observables/)).
- **Leaking endless streams.** `interval`, `fromEvent`, `valueChanges` and Router events never complete — always clean them up.
- **Using deprecated APIs.** `toPromise()`, `subscribe(next, error, complete)` and `throwError(value)` will be removed in RxJS 8.

## Key takeaways

- An Observable is a lazy, cancellable stream of zero or more values.
- Subscribing starts the work; unsubscribing (or completion) runs the teardown.
- Operators are chained with `pipe()` and always return new Observables.
- In Angular 22, keep **state in signals** and use **RxJS for events, timing and async coordination**; bridge with `toSignal`/`toObservable`.
- Prefer `toSignal`, the `async` pipe or `takeUntilDestroyed` over manual `unsubscribe()`.

## Next steps

- [Observables & Observers](/rxjs/observables/) — creation, observers, hot vs cold in depth
- [Subjects & BehaviorSubject](/rxjs/subjects/) — multicasting and sharing
- [Transformation Operators](/rxjs/transformation-operators/) — `map`, `scan`, `switchMap` and friends
- [Signals](/modern/signals/) — Angular's reactive state primitive
