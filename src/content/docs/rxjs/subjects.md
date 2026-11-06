---
title: Subjects & BehaviorSubject 📢
description: Learn RxJS Subjects, BehaviorSubject, ReplaySubject and AsyncSubject, plus share/shareReplay, and when to use signals instead in Angular 22.
sidebar:
  order: 3
---

A plain Observable is a one-way blueprint: values come *out* of it. A **Subject** is both an Observable **and** an
Observer — you can push values *into* it with `next()`, and every subscriber receives them. That makes Subjects the tool
for **multicasting** (one source, many listeners) and for turning imperative events into streams.

## What you'll learn

- How `Subject`, `BehaviorSubject`, `ReplaySubject` and `AsyncSubject` differ
- How to expose a Subject safely with `asObservable()`
- How to share one execution with `share()` and `shareReplay()`
- When to use a **signal** instead of a `BehaviorSubject` in Angular 22
- Real-world patterns: refresh triggers and notification streams

## Subject basics

```ts
import { Subject } from 'rxjs';

const messages = new Subject<string>();

messages.subscribe((m) => console.log('A received', m));
messages.next('Hello');

messages.subscribe((m) => console.log('B received', m));
messages.next('World');

// A received Hello
// A received World
// B received World   ← B subscribed late, so it missed "Hello"
```

Key facts:

- A Subject is **hot**: subscribers only get values emitted **after** they subscribe.
- All subscribers share **one** stream of values (multicast).
- `complete()` and `error()` end the Subject for everyone; later `next()` calls are ignored.

## The four Subject types

| Type | Late subscriber receives… | Needs initial value? | Typical use |
|---|---|---|---|
| `Subject<T>` | Nothing from the past | No | Events: clicks, "refresh", notifications |
| `BehaviorSubject<T>` | The **current** (latest) value | **Yes** | State with a current value (legacy store pattern) |
| `ReplaySubject<T>` | The last **N** values (optionally within a time window) | No | Caching, late subscribers that need history |
| `AsyncSubject<T>` | Only the **last** value, and only after `complete()` | No | One final result (rare) |

### BehaviorSubject

```ts
import { BehaviorSubject } from 'rxjs';

const count = new BehaviorSubject(0);

count.subscribe((v) => console.log('A', v)); // A 0  ← gets the current value immediately
count.next(1); // A 1

count.subscribe((v) => console.log('B', v)); // B 1  ← late subscriber still gets the latest
count.next(2); // A 2, B 2

console.log(count.value); // 2 — read the current value synchronously
```

### ReplaySubject

```ts
import { ReplaySubject } from 'rxjs';

const recent = new ReplaySubject<string>(2); // remember the last 2 values

recent.next('one');
recent.next('two');
recent.next('three');

recent.subscribe((v) => console.log(v));
// two
// three
```

`new ReplaySubject<T>(bufferSize, windowTime)` can also forget values older than `windowTime` milliseconds.

### AsyncSubject

```ts
import { AsyncSubject } from 'rxjs';

const result = new AsyncSubject<number>();
result.subscribe((v) => console.log('final', v));

result.next(1);
result.next(2);
result.next(3);
result.complete(); // final 3 — only now, and only the last value
```

### `Subject<void>` for "signals" without data

When the event itself is the information, use `void`:

```ts
import { Subject } from 'rxjs';

const refresh = new Subject<void>();
refresh.subscribe(() => console.log('Refresh requested'));
refresh.next(); // no argument needed
```

## Expose Subjects as read-only Observables

Keep the Subject `private` so only the owner can push values. Expose a read-only stream with `asObservable()`:

```ts title="toast-service.ts"
import { Service } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface Toast {
  text: string;
  kind: 'success' | 'error';
}

@Service()
export class ToastService {
  private readonly toastSubject = new Subject<Toast>();

  /** Consumers can listen, but can't call next() */
  readonly toasts$: Observable<Toast> = this.toastSubject.asObservable();

  success(text: string) {
    this.toastSubject.next({ text, kind: 'success' });
  }

  error(text: string) {
    this.toastSubject.next({ text, kind: 'error' });
  }
}
```

A Subject is the right tool here: toasts are **events** (each one matters, there's no "current toast" state).
A component can listen with `takeUntilDestroyed()` and keep the visible list in a signal:

```ts title="toast-outlet.ts"
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, mergeMap, tap, timer } from 'rxjs';
import { Toast, ToastService } from './toast-service';

@Component({
  selector: 'app-toast-outlet',
  template: `
    @for (item of visible(); track item.id) {
      <p role="status" [class]="item.toast.kind">{{ item.toast.text }}</p>
    }
  `,
})
export class ToastOutlet {
  protected readonly visible = signal<{ id: number; toast: Toast }[]>([]);
  private nextId = 0;

  constructor() {
    inject(ToastService)
      .toasts$.pipe(
        map((toast) => ({ id: this.nextId++, toast })),
        tap((item) => this.visible.update((list) => [...list, item])),
        // one 3-second timer per toast, running in parallel
        mergeMap((item) => timer(3000).pipe(map(() => item.id))),
        takeUntilDestroyed(), // also cancels pending timers on destroy
      )
      .subscribe((id) => this.visible.update((list) => list.filter((t) => t.id !== id)));
  }
}
```

## Sharing a source: `share()` and `shareReplay()`

You can multicast any Observable without managing a Subject yourself. Both operators use a Subject internally.

| Operator | Late subscribers get | Source unsubscribed when… |
|---|---|---|
| `share()` | Only future values | All subscribers leave (by default) |
| `shareReplay({ bufferSize: 1, refCount: true })` | The last value, then future values | All subscribers leave |
| `shareReplay(1)` | The last value, then future values | **Never** (the source stays subscribed) |

```ts title="settings-service.ts"
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { shareReplay } from 'rxjs';

interface Settings {
  currency: string;
  locale: string;
}

@Service()
export class SettingsService {
  private readonly http = inject(HttpClient);

  /** One HTTP request, cached and shared by every subscriber */
  readonly settings$ = this.http.get<Settings>('/api/settings').pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
```

:::caution[`shareReplay(1)` keeps the source alive]
Without `refCount: true`, `shareReplay` never unsubscribes from its source, even when nobody listens anymore. For an
HTTP call that completes, that's fine (it's a cache). For endless sources such as `interval()` or a WebSocket it's a
**memory leak**. Prefer the explicit config object: `shareReplay({ bufferSize: 1, refCount: true })`.
:::

`share()` also accepts options to control resetting:

```ts
import { interval, share, timer } from 'rxjs';

const ticks$ = interval(1000).pipe(
  share({
    resetOnRefCountZero: () => timer(5000), // keep the source alive 5 s after the last subscriber leaves
  }),
);
```

:::note[Deprecated multicasting operators]
`multicast`, `publish`, `publishReplay`, `publishBehavior`, `publishLast` and `refCount` are deprecated in RxJS 7.
Use `share()`, `shareReplay()` or `connectable()` instead.
:::

## Signals vs Subjects in Angular 22

Before signals, Angular services stored state in a `BehaviorSubject`. You will still see this pattern in many codebases:

```ts title="cart-store.ts (BehaviorSubject style)"
import { Service } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
}

@Service()
export class CartStoreRx {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  readonly total$ = this.items$.pipe(map((items) => items.reduce((sum, i) => sum + i.price, 0)));

  add(item: CartItem) {
    this.itemsSubject.next([...this.itemsSubject.value, item]);
  }
}
```

In Angular 22, **signals are the recommended way to hold state**. The same store is shorter, synchronous, and needs no
subscription management:

```ts title="cart-store.ts (signals)"
import { computed, Service, signal } from '@angular/core';
import { CartItem } from './cart-item';

@Service()
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price, 0));

  add(item: CartItem) {
    this._items.update((items) => [...items, item]);
  }
}
```

If some consumer still needs a stream, convert with `toObservable(cartStore.items)`.

| Use a **signal** when… | Use a **Subject** when… |
|---|---|
| There's always a *current value* (state) | Each event matters, even if it repeats (clicks, toasts, "refresh") |
| Templates read it | You need RxJS timing operators on the events |
| Values are derived with `computed()` | You bridge a callback/event API into RxJS |

## Real-world pattern: a refresh trigger

A `Subject<void>` is a clean way to say "do it again". Combine it with `startWith` (load immediately) and `switchMap`
(cancel the previous request if a new refresh arrives):

```ts title="order-list.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, startWith, switchMap } from 'rxjs';

interface Order {
  id: number;
  total: number;
}

@Component({
  selector: 'app-order-list',
  template: `
    <button type="button" (click)="refresh.next()">Refresh</button>
    @for (order of orders(); track order.id) {
      <p>#{{ order.id }} — {{ order.total }}</p>
    }
  `,
})
export class OrderList {
  private readonly http = inject(HttpClient);
  protected readonly refresh = new Subject<void>();

  protected readonly orders = toSignal(
    this.refresh.pipe(
      startWith(undefined), // load once immediately
      switchMap(() => this.http.get<Order[]>('/api/orders')),
    ),
    { initialValue: [] },
  );
}
```

:::tip
For simple "load and reload" cases, [`httpResource`](/modern/http-resource-api/) or `rxResource` give you a
`reload()` method plus loading/error signals out of the box. See [RxJS Patterns in Angular](/rxjs/angular-patterns/).
:::

## Common mistakes

- **Exposing the Subject itself.** Make it `private` and expose `asObservable()` (or a read-only signal).
- **Using `BehaviorSubject` for new state code.** Use `signal()` + `computed()`; keep Subjects for events.
- **Reading `.value` everywhere.** Code built around `behaviorSubject.value` is imperative — that's exactly what signals are designed for.
- **`shareReplay(1)` on endless streams.** Add `refCount: true`, or the source is never unsubscribed.
- **Calling `next()` after `complete()`.** It's silently ignored — a completed Subject can't be reused.
- **Using `EventEmitter` as a general-purpose Subject.** It only exists for legacy `@Output()`; new components use `output()`.

## Key takeaways

- A Subject is an Observable you can push into; it multicasts to all current subscribers.
- `BehaviorSubject` holds a current value, `ReplaySubject` replays history, `AsyncSubject` emits only the final value.
- Hide Subjects behind `asObservable()`.
- `share()` and `shareReplay({ bufferSize: 1, refCount: true })` multicast any Observable.
- In Angular 22, **state → signals, events → Subjects**, and bridge with `toSignal`/`toObservable`.

## Next steps

- [Transformation Operators](/rxjs/transformation-operators/) — `map`, `scan`, `switchMap` and more
- [Signals](/modern/signals/) — Angular's state primitive
- [State Management](/intermediate/state-management/) — patterns for app-wide state
