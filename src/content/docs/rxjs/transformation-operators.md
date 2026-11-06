---
title: Transformation Operators 🔄
description: RxJS transformation operators for Angular - map, scan, reduce, pairwise, buffer, groupBy, expand, and an intro to switchMap, mergeMap, concatMap, exhaustMap.
sidebar:
  order: 4
---

Transformation operators **change the values** flowing through a stream: reshape them, accumulate them, group them, or
turn each value into a whole new async operation. They are the operators you'll use most in Angular apps.

## What you'll learn

- `map` to reshape values (and why `pluck`/`mapTo` are deprecated)
- `scan` and `reduce` to accumulate state
- `pairwise`, `bufferTime`/`bufferCount` and `toArray` to work with several values at once
- `groupBy` and `expand` for advanced cases (per-key streams, pagination)
- The four flattening operators — `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` — and how to choose

All operators are imported from `'rxjs'`:

```ts
import { map, scan, switchMap } from 'rxjs';
```

## `map` — transform every value

```
source:  --1--2--3--|
map(x => x * 10)
result:  --10-20-30-|
```

```ts
import { map, of } from 'rxjs';

of(1, 2, 3)
  .pipe(map((n) => n * 10))
  .subscribe((n) => console.log(n)); // 10, 20, 30
```

### Real-world: shape an API response into a view model

APIs often return data in a shape your UI doesn't want. Map it once, in the service, so components get clean types:

```ts title="user-api.ts"
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';

interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
}

@Service()
export class UserApi {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<ApiUser[]>('/api/users').pipe(
      map((apiUsers) =>
        apiUsers.map((u) => ({
          id: u.id,
          fullName: `${u.first_name} ${u.last_name}`,
          email: u.email,
        })),
      ),
    );
  }
}
```

:::note
`map` on the Observable runs once per **emission** (one HTTP response). `Array.prototype.map` inside it runs once per
**item** in the array. Mixing the two is normal and common.
:::

:::caution[Deprecated: `pluck` and `mapTo`]
`pluck('a', 'b')` and `mapTo(value)` are deprecated in RxJS 7. Use `map((x) => x.a.b)` (fully type-safe) and
`map(() => value)` instead.
:::

## `tap` — side effects without changing values

`tap` lets you *look* at values (logging, analytics, setting a loading flag) without transforming them:

```ts
import { map, of, tap } from 'rxjs';

of(1, 2, 3)
  .pipe(
    tap((n) => console.log('before', n)),
    map((n) => n * 2),
    tap({
      next: (n) => console.log('after', n),
      complete: () => console.log('done'),
    }),
  )
  .subscribe();
```

`tap` also accepts `subscribe`, `unsubscribe` and `finalize` callbacks in its observer object, which is handy for debugging.

## `scan` — accumulate state over time

`scan` is like `Array.reduce`, but it emits the **running** result after every value:

```
source:  --1--2--3--|
scan((acc, x) => acc + x, 0)
result:  --1--3--6--|
```

```ts
import { of, scan } from 'rxjs';

of(1, 2, 3)
  .pipe(scan((total, n) => total + n, 0))
  .subscribe((t) => console.log(t)); // 1, 3, 6
```

### Real-world: a tiny reducer for a component

`scan` + a Subject of actions gives you a predictable mini-store. Here's a counter with undo:

```ts title="undo-counter.ts"
import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan, Subject } from 'rxjs';

type Action = 'inc' | 'dec' | 'undo';

interface State {
  value: number;
  history: number[];
}

@Component({
  selector: 'app-undo-counter',
  template: `
    <p>Value: {{ state().value }}</p>
    <button type="button" (click)="actions.next('dec')">-</button>
    <button type="button" (click)="actions.next('inc')">+</button>
    <button type="button" (click)="actions.next('undo')" [disabled]="state().history.length === 0">Undo</button>
  `,
})
export class UndoCounter {
  protected readonly actions = new Subject<Action>();

  protected readonly state = toSignal(
    this.actions.pipe(
      scan(
        (s: State, action: Action): State => {
          switch (action) {
            case 'inc':
              return { value: s.value + 1, history: [...s.history, s.value] };
            case 'dec':
              return { value: s.value - 1, history: [...s.history, s.value] };
            case 'undo':
              return { value: s.history.at(-1) ?? s.value, history: s.history.slice(0, -1) };
          }
        },
        { value: 0, history: [] },
      ),
    ),
    { initialValue: { value: 0, history: [] } },
  );
}
```

:::tip
For plain component state, a `signal()` with `update()` is simpler. `scan` shines when state is built from a **stream
of events** that you also want to debounce, filter or combine with other streams.
:::

## `reduce` — one final result

`reduce` is `scan` that only emits **once**, when the source completes:

```ts
import { of, reduce } from 'rxjs';

of(5, 10, 15)
  .pipe(reduce((sum, n) => sum + n, 0))
  .subscribe((sum) => console.log(sum)); // 30
```

Never use `reduce` (or `toArray`, `last`) on a stream that doesn't complete — it will never emit.

## Working with several values at once

### `pairwise` — previous and current

```ts
import { fromEvent, map, pairwise } from 'rxjs';

// Detect scroll direction
fromEvent(window, 'scroll')
  .pipe(
    map(() => window.scrollY),
    pairwise(), // emits [previous, current]
    map(([prev, curr]) => (curr > prev ? 'down' : 'up')),
  )
  .subscribe((direction) => console.log(direction));
```

### `bufferCount` and `bufferTime` — batches

```ts
import { bufferCount, of } from 'rxjs';

of(1, 2, 3, 4, 5)
  .pipe(bufferCount(2))
  .subscribe((batch) => console.log(batch)); // [1, 2], [3, 4], [5]
```

Real-world: batch analytics events and send them every 5 seconds instead of one request per event:

```ts title="analytics.ts"
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { bufferTime, concatMap, filter, Subject } from 'rxjs';

interface TrackEvent {
  name: string;
  at: number;
}

@Service()
export class Analytics {
  private readonly http = inject(HttpClient);
  private readonly events = new Subject<TrackEvent>();

  constructor() {
    this.events
      .pipe(
        bufferTime(5000), // collect events for 5 s
        filter((batch) => batch.length > 0), // skip empty batches
        concatMap((batch) => this.http.post('/api/analytics', batch)), // send batches in order
      )
      .subscribe();
  }

  track(name: string) {
    this.events.next({ name, at: Date.now() });
  }
}
```

A root service lives as long as the app, so this subscription never needs to be cleaned up.

### `toArray` — collect everything

```ts
import { of, toArray } from 'rxjs';

of('a', 'b', 'c')
  .pipe(toArray())
  .subscribe((all) => console.log(all)); // ['a', 'b', 'c']
```

## Advanced: `groupBy` and `expand`

### `groupBy` — one inner stream per key

`groupBy` splits a stream into groups. Each group is itself an Observable (`GroupedObservable`) with a `key`:

```ts
import { from, groupBy, mergeMap, reduce } from 'rxjs';

const orders = [
  { customer: 'ana', total: 20 },
  { customer: 'ben', total: 5 },
  { customer: 'ana', total: 15 },
];

from(orders)
  .pipe(
    groupBy((o) => o.customer),
    mergeMap((group) => group.pipe(reduce((sum, o) => sum + o.total, 0))),
  )
  .subscribe((sum) => console.log(sum)); // 35 (ana), 5 (ben)
```

### `expand` — recursive calls, e.g. fetching every page

`expand` feeds each result back into itself until you return `EMPTY`. Perfect for "load page 1, then page 2, …":

```ts title="all-products.ts"
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { EMPTY, expand, map, reduce } from 'rxjs';

interface Page<T> {
  items: T[];
  nextPage: number | null;
}

interface Product {
  id: number;
  name: string;
}

@Service()
export class ProductApi {
  private readonly http = inject(HttpClient);

  private getPage(page: number) {
    return this.http.get<Page<Product>>('/api/products', { params: { page } });
  }

  /** Loads every page and emits one array with all products */
  getAll() {
    return this.getPage(1).pipe(
      expand((res) => (res.nextPage ? this.getPage(res.nextPage) : EMPTY)),
      map((res) => res.items),
      reduce((all, items) => [...all, ...items], [] as Product[]),
    );
  }
}
```

## Flattening operators: when each value starts async work

Often each value should start **another** Observable — an HTTP request, a timer, a save. If you use `map`, you get an
Observable *of Observables*. **Flattening operators** subscribe to those inner Observables for you and emit their results.

The four operators differ only in what they do **when a new value arrives while the previous inner Observable is still running**:

| Operator | While busy, a new value… | Typical Angular use |
|---|---|---|
| `switchMap` | **cancels** the previous inner Observable | Search-as-you-type, route param → load data |
| `mergeMap` | runs **in parallel** with the previous ones | Upload many files, independent requests |
| `concatMap` | **waits** in a queue until the previous one completes | Ordered saves, sequential steps |
| `exhaustMap` | is **ignored** until the current one completes | Login/submit buttons (prevent double submit) |

```ts
import { concatMap, exhaustMap, mergeMap, switchMap } from 'rxjs';

searchTerm$.pipe(switchMap((term) => api.search(term))); // latest wins
files$.pipe(mergeMap((file) => api.upload(file), 3)); // up to 3 at once
edits$.pipe(concatMap((edit) => api.save(edit))); // one at a time, in order
submitClicks$.pipe(exhaustMap(() => api.login(credentials))); // ignore clicks while logging in
```

Here's a component that loads a product whenever the `id` input changes. `switchMap` cancels the in-flight request
if the user navigates to another product before it finishes:

```ts title="product-detail.ts"
import { Component, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

interface Product {
  id: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-product-detail',
  template: `
    @if (product(); as p) {
      <h2>{{ p.name }}</h2>
      <p>{{ p.price }}</p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class ProductDetail {
  private readonly http = inject(HttpClient);
  readonly id = input.required<string>();

  protected readonly product = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.http.get<Product>(`/api/products/${id}`))),
  );
}
```

:::tip
This "input → request" pattern is exactly what `rxResource` (or `httpResource`) does for you, with loading and error
state included. Compare the approaches in [RxJS Patterns in Angular](/rxjs/angular-patterns/).
:::

Each flattening operator has a deep-dive with timelines and real-world examples in
[Higher-Order Observables](/rxjs/higher-order-observables/).

## Quick reference

| Operator | What it does |
|---|---|
| `map` | Transform each value |
| `tap` | Side effect, value unchanged |
| `scan` | Running accumulation (emits each step) |
| `reduce` | Final accumulation (emits once on complete) |
| `pairwise` | Emit `[previous, current]` |
| `bufferCount` / `bufferTime` | Emit arrays of values by count / time |
| `toArray` | Collect all values into one array on complete |
| `groupBy` | Split into per-key inner streams |
| `expand` | Recursively apply a projection (pagination, trees) |
| `switchMap` / `mergeMap` / `concatMap` / `exhaustMap` | Map each value to an inner Observable and flatten |

## Common mistakes

- **Using `map` to return an Observable.** You'll get `Observable<Observable<T>>`. Use a flattening operator.
- **Using `mergeMap` for search.** Older responses can arrive after newer ones and overwrite the results. Use `switchMap`.
- **Using `switchMap` for writes.** Cancelling a `POST`/`PUT` mid-flight can leave the server in an unknown state. Use `concatMap` or `exhaustMap`.
- **`reduce`/`toArray` on endless streams.** They only emit on completion.
- **Putting logic in `tap` that should be in `map`.** `tap` is for side effects; its return value is ignored.

## Key takeaways

- `map` reshapes values; `tap` observes them.
- `scan` accumulates and emits every step; `reduce` emits only the final result.
- `pairwise`, `buffer*` and `toArray` work with groups of values.
- Pick the flattening operator by asking "what should happen when a new value arrives while I'm busy?"

## Next steps

- [Filtering Operators](/rxjs/filtering-operators/) — decide which values get through
- [Higher-Order Observables](/rxjs/higher-order-observables/) — deep dive into the flattening operators
- [Combination Operators](/rxjs/combination-operators/) — combine several streams
