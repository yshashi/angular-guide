---
title: Filtering Operators 🔍
description: RxJS filtering operators for Angular - filter, take, first, skip, distinctUntilChanged, debounceTime, throttleTime, auditTime and takeUntil, with real examples.
sidebar:
  order: 5
---

Filtering operators decide **which values get through** a stream. Some look at each value (`filter`), some count
values (`take`, `skip`), some drop duplicates (`distinctUntilChanged`), and some limit the **rate** of values
over time (`debounceTime`, `throttleTime`). Together they turn noisy event streams into exactly the values you need.

## What you'll learn

- `filter` (including type-narrowing filters)
- Taking and skipping: `take`, `takeWhile`, `takeUntil`, `first`, `last`, `skip`
- Removing duplicates: `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`
- Rate limiting: `debounceTime`, `throttleTime`, `auditTime`, `sampleTime`
- Which one to pick for search boxes, scroll handlers and buttons

## `filter` — keep values that pass a test

```
source:            --1--2--3--4--|
filter(isEven):    -----2-----4--|
```

```ts
import { filter, of } from 'rxjs';

of(1, 2, 3, 4)
  .pipe(filter((n) => n % 2 === 0))
  .subscribe((n) => console.log(n)); // 2, 4
```

### Type-narrowing filters

`filter` understands TypeScript type guards, so the type after the filter is narrowed:

```ts
import { filter, Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
}

declare const maybeUser$: Observable<User | null>;

// Observable<User> — null is removed from the type
const user$ = maybeUser$.pipe(filter((u): u is User => u !== null));

// Shortcut: filter(Boolean) removes all falsy values and narrows the type too
const user2$ = maybeUser$.pipe(filter(Boolean));
```

### Real-world: only react to finished navigations

```ts title="page-tracker.ts"
import { inject, Service } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Service()
export class PageTracker {
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects),
      )
      .subscribe((url) => console.log('Page view:', url));
  }
}
```

## Taking and skipping values

| Operator | Emits | Completes |
|---|---|---|
| `take(n)` | The first `n` values | After `n` values |
| `takeWhile(pred, inclusive?)` | Values while `pred` is true | When `pred` first returns false |
| `takeUntil(notifier$)` | Values until `notifier$` emits | When `notifier$` emits |
| `first()` / `first(pred)` | The first (matching) value | Immediately after it |
| `last()` / `last(pred)` | The last (matching) value | When the source completes |
| `skip(n)` | Everything except the first `n` values | With the source |
| `skipWhile(pred)` / `skipUntil(notifier$)` | Values after the condition is met | With the source |

```ts
import { interval, skip, take, takeWhile } from 'rxjs';

interval(1000).pipe(take(3)).subscribe((n) => console.log(n)); // 0, 1, 2 then complete

interval(1000)
  .pipe(takeWhile((n) => n < 3, true)) // `true` = also emit the value that failed
  .subscribe((n) => console.log(n)); // 0, 1, 2, 3 then complete

interval(1000).pipe(skip(2), take(2)).subscribe((n) => console.log(n)); // 2, 3
```

### `first()` vs `take(1)`

Both emit one value and complete. The difference is what happens if the source completes **without** emitting:

```ts
import { EMPTY, first, take } from 'rxjs';

EMPTY.pipe(take(1)).subscribe({ complete: () => console.log('take(1): completed quietly') });

EMPTY.pipe(first()).subscribe({
  error: (err: Error) => console.log('first():', err.name), // first(): EmptyError
});
```

Use `first()` when "no value" is a bug you want to hear about. Use `take(1)` when an empty source is fine.
`first(predicate, defaultValue)` lets you supply a fallback instead of an error.

### `takeUntil` and `takeUntilDestroyed`

`takeUntil(notifier$)` completes the stream as soon as `notifier$` emits. Here, a countdown stops when the user clicks
"Cancel":

```ts title="countdown.ts"
import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, Subject, take, takeUntil, timer } from 'rxjs';

@Component({
  selector: 'app-countdown',
  template: `
    <p>{{ remaining() }}</p>
    <button type="button" (click)="cancel.next()">Cancel</button>
  `,
})
export class Countdown {
  protected readonly remaining = signal(10);
  protected readonly cancel = new Subject<void>();

  constructor() {
    timer(1000, 1000)
      .pipe(
        map((i) => 9 - i),
        take(10),
        takeUntil(this.cancel), // stop early when Cancel is clicked
        takeUntilDestroyed(), // and always stop when the component is destroyed
      )
      .subscribe((n) => this.remaining.set(n));
  }
}
```

:::tip
In Angular you don't need the old `destroy$ = new Subject()` + `takeUntil(this.destroy$)` + `ngOnDestroy` pattern.
`takeUntilDestroyed()` from `@angular/core/rxjs-interop` does it for you. Put it **last** in the `pipe()` so it also
covers operators placed before it (like `switchMap`).
:::

## Removing duplicates

```
source:                  --a--a--b--b--a--|
distinctUntilChanged():  --a-----b-----a--|
distinct():              --a-----b--------|
```

- `distinctUntilChanged()` drops a value if it equals the **previous** one (uses `===` by default).
- `distinct()` drops a value if it was **ever** seen before (keeps an internal `Set`, so be careful with endless streams).

### Comparing objects

Objects are compared by reference, so `distinctUntilChanged()` alone won't detect "same content":

```ts
import { distinctUntilChanged, distinctUntilKeyChanged, of } from 'rxjs';

const filters$ = of({ category: 'books', page: 1 }, { category: 'books', page: 1 }, { category: 'games', page: 1 });

// Custom comparator
filters$
  .pipe(distinctUntilChanged((a, b) => a.category === b.category && a.page === b.page))
  .subscribe((f) => console.log(f)); // books, games

// Compare a single key
filters$.pipe(distinctUntilKeyChanged('category')).subscribe((f) => console.log(f.category)); // books, games
```

## Rate limiting: debounce, throttle, audit, sample

These operators control **how often** values get through. They all take a duration in milliseconds.

```
source:           a-b----c---|     (one character = 1 ms, durations = 3 ms)
debounceTime(3):  -----b----c|     wait for silence, then emit the latest
throttleTime(3):  a------c---|     emit the first, then ignore for 3 ms
auditTime(3):     ---b------c|     wait 3 ms after a value, then emit the latest
```

| Operator | Emits | Best for |
|---|---|---|
| `debounceTime(ms)` | The latest value after `ms` of **silence** | Search boxes, auto-save, resize "done" |
| `throttleTime(ms)` | The **first** value, then ignores for `ms` | Button spam, analytics on scroll |
| `throttleTime(ms, undefined, { leading: true, trailing: true })` | First **and** last value in each window | Drag/resize where the final position matters |
| `auditTime(ms)` | The **latest** value at the end of each window | Scroll/mousemove UI updates |
| `sampleTime(ms)` | The latest value every `ms`, on a fixed clock | Periodic snapshots (e.g. sensor readings) |

:::note
If the source completes while `debounceTime` is waiting, the pending value is emitted immediately before completion.
:::

### Real-world: a search box

The classic combination: trim → ignore short terms → wait for a pause → skip repeats.

```ts title="city-search.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-city-search',
  imports: [ReactiveFormsModule],
  template: `
    <label>
      City
      <input [formControl]="query" />
    </label>
    <ul>
      @for (city of cities(); track city) {
        <li>{{ city }}</li>
      }
    </ul>
  `,
})
export class CitySearch {
  private readonly http = inject(HttpClient);
  protected readonly query = new FormControl('', { nonNullable: true });

  protected readonly cities = toSignal(
    this.query.valueChanges.pipe(
      map((q) => q.trim()),
      debounceTime(300), // 1. wait until typing pauses
      distinctUntilChanged(), // 2. skip if the term didn't change
      switchMap((q) =>
        q.length < 2
          ? of([]) // 3. too short: clear results, no request
          : this.http.get<string[]>('/api/cities', { params: { q } }),
      ),
    ),
    { initialValue: [] },
  );
}
```

Notice the order: `debounceTime` **before** `distinctUntilChanged`, so "ab" → "abc" → "ab" typed quickly is treated as
"no change". `switchMap` then cancels any outdated request. We handle short terms inside `switchMap` (instead of
`filter`) so the list clears when the input is emptied. A full comparison with signal-based alternatives is in
[RxJS Patterns in Angular](/rxjs/angular-patterns/).

### Real-world: show a "back to top" button while scrolling

```ts title="back-to-top.ts"
import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { auditTime, distinctUntilChanged, fromEvent, map } from 'rxjs';

@Component({
  selector: 'app-back-to-top',
  template: `
    @if (visible()) {
      <button type="button" (click)="scrollTop()">↑ Top</button>
    }
  `,
})
export class BackToTop {
  protected readonly visible = toSignal(
    fromEvent(window, 'scroll', { passive: true }).pipe(
      auditTime(100), // at most one check per 100 ms
      map(() => window.scrollY > 600),
      distinctUntilChanged(), // only update when visibility actually flips
    ),
    { initialValue: false },
  );

  protected scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

## Other useful filters

| Operator | Purpose |
|---|---|
| `ignoreElements()` | Drop all values, keep only `complete`/`error` |
| `elementAt(i)` | Only the value at index `i` |
| `single(pred?)` | Exactly one value must match, otherwise error |
| `debounce(fn)` / `throttle(fn)` / `audit(fn)` | Like the `…Time` versions, but the duration comes from an Observable you return (dynamic timing) |

## Common mistakes

- **`distinctUntilChanged()` on objects** compares references. Pass a comparator or use `distinctUntilKeyChanged`.
- **`debounceTime` on the HTTP response** instead of on the user input. Debounce the *trigger*, then `switchMap` to the request.
- **`first()` on a stream that may be empty** throws `EmptyError`. Use `take(1)` or `first(pred, defaultValue)`.
- **`takeUntil` in the middle of the pipe.** Operators after it (like `switchMap`) can keep inner subscriptions alive. Put `takeUntil`/`takeUntilDestroyed` last.
- **`distinct()` on endless streams** grows its memory forever. Pass a `flushes` Observable or use `distinctUntilChanged`.

## Key takeaways

- `filter` keeps values by predicate and narrows types with type guards (or `filter(Boolean)`).
- `take`, `first`, `takeWhile` and `takeUntil` **complete** the stream — great for automatic cleanup.
- `distinctUntilChanged` removes consecutive duplicates; give it a comparator for objects.
- Debounce input, throttle actions, audit visual updates.
- In Angular, prefer `takeUntilDestroyed()` over a hand-made `destroy$` Subject.

## Next steps

- [Combination Operators](/rxjs/combination-operators/) — combine several streams
- [Error Handling](/rxjs/error-handling/) — keep streams alive when things fail
- [RxJS Patterns in Angular](/rxjs/angular-patterns/) — typeahead with `toSignal`, `rxResource` and `debounced()`
