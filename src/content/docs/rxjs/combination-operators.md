---
title: Combination Operators 🔗
description: Combine RxJS streams in Angular - combineLatest, forkJoin, merge, concat, zip, race, withLatestFrom, startWith - and when computed() signals are simpler.
sidebar:
  order: 6
---

Real screens depend on **several** async sources at once: route params and a filter form, three API calls for a
dashboard, clicks plus the latest form value. Combination operators merge those streams into one.

## What you'll learn

- `combineLatest` — the latest value of every source, whenever any changes
- `forkJoin` — run requests in parallel, get all results once they finish
- `merge`, `concat`, `race` — interleave, sequence, or pick the fastest
- `zip` and `withLatestFrom` — pair values up or sample another stream
- `startWith`, `endWith` and the `…With` operator variants
- When a `computed()` signal replaces `combineLatest`

## Static functions vs `…With` operators

Most combinators exist in two forms:

| Static creation function | Pipeable operator (inside `pipe`) |
|---|---|
| `combineLatest([a$, b$])` | `a$.pipe(combineLatestWith(b$))` |
| `merge(a$, b$)` | `a$.pipe(mergeWith(b$))` |
| `concat(a$, b$)` | `a$.pipe(concatWith(b$))` |
| `zip([a$, b$])` | `a$.pipe(zipWith(b$))` |
| `race([a$, b$])` | `a$.pipe(raceWith(b$))` |

:::caution[Deprecated forms]
The old pipeable `combineLatest`, `merge`, `concat`, `zip` and `race` **operators** (imported from `rxjs/operators`)
are deprecated — use the `…With` versions. For `combineLatest` and `forkJoin`, pass an **array or object** of sources;
the rest-parameter form `combineLatest(a$, b$)` is deprecated, and so are "result selector" function arguments
(use `map` afterwards instead).
:::

## `combineLatest` — latest of everything

```
a$:             -a-----b---|
b$:             ---1-2-----|
combineLatest:  ---x-y-z---|     x = [a,1]  y = [a,2]  z = [b,2]
```

- Waits until **every** source has emitted at least once.
- Then emits an array (or object) with the latest value of each source whenever **any** source emits.
- Completes when all sources complete.

```ts
import { combineLatest, of } from 'rxjs';

// Array form → tuple
combineLatest([of('Ada'), of(36)]).subscribe(([name, age]) => console.log(name, age));

// Object form → named properties (easier to read)
combineLatest({ name: of('Ada'), age: of(36) }).subscribe(({ name, age }) => console.log(name, age));
```

### Real-world: filter products by route query + a form

```ts title="product-list.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, debounceTime, map, startWith, switchMap } from 'rxjs';

interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="search" placeholder="Filter…" />
    @for (p of products(); track p.id) {
      <p>{{ p.name }}</p>
    }
  `,
})
export class ProductList {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  protected readonly search = new FormControl('', { nonNullable: true });

  protected readonly products = toSignal(
    combineLatest({
      category: this.route.queryParamMap.pipe(map((q) => q.get('category') ?? 'all')),
      term: this.search.valueChanges.pipe(debounceTime(300), startWith('')), // startWith so it emits immediately
    }).pipe(
      switchMap(({ category, term }) =>
        this.http.get<Product[]>('/api/products', { params: { category, q: term } }),
      ),
    ),
    { initialValue: [] },
  );
}
```

:::tip[Why `startWith`?]
`valueChanges` doesn't emit until the user types. Without `startWith('')`, `combineLatest` would wait forever and the
list would stay empty.
:::

### With signals, use `computed()` instead

If your inputs are **signals**, you don't need `combineLatest` at all. A `computed()` re-runs whenever any signal it reads changes:

```ts
import { computed, signal } from '@angular/core';

const firstName = signal('Ada');
const lastName = signal('Lovelace');
const fullName = computed(() => `${firstName()} ${lastName()}`); // "combineLatest" for signals
```

And when signals drive a request, use `resource`/`rxResource` with a `params` function (see
[RxJS Patterns in Angular](/rxjs/angular-patterns/)). Reach for `combineLatest` when the sources are genuinely streams.

## `forkJoin` — wait for all, then emit once

`forkJoin` is the RxJS version of `Promise.all`. It subscribes to every source in parallel and emits **once**, with the
**last** value of each, when **all** have completed.

```
a$:        -a-----b---|
b$:        ---1-2-----|
forkJoin:  -----------(x|)     x = [b,2]
```

### Real-world: load a dashboard in parallel

```ts title="dashboard.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

interface Stats {
  visitors: number;
}
interface Order {
  id: number;
}
interface Alert {
  id: number;
  text: string;
}

@Component({
  selector: 'app-dashboard',
  template: `
    @if (data(); as d) {
      <p>Visitors: {{ d.stats.visitors }}</p>
      <p>Orders today: {{ d.orders.length }}</p>
      @for (a of d.alerts; track a.id) {
        <p>⚠️ {{ a.text }}</p>
      }
    } @else {
      <p>Loading dashboard…</p>
    }
  `,
})
export class Dashboard {
  private readonly http = inject(HttpClient);

  protected readonly data = toSignal(
    forkJoin({
      stats: this.http.get<Stats>('/api/stats'),
      orders: this.http.get<Order[]>('/api/orders/today'),
      alerts: this.http.get<Alert[]>('/api/alerts'),
    }),
  );
}
```

`forkJoin` rules to remember:

- If **any** source errors, `forkJoin` errors immediately (and the other requests are cancelled). Add `catchError` to
  individual sources if partial results are OK.
- If any source completes **without emitting**, `forkJoin` completes without emitting anything.
- Never use it with endless streams (`interval`, `valueChanges`) — it would wait forever.

## `merge` — interleave values as they arrive

```
a$:     -a-----b---|
b$:     ---1-2-----|
merge:  -a-1-2-b---|
```

```ts title="save-indicator.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, merge } from 'rxjs';
import { EditorEvents } from './editor-events';

@Component({
  selector: 'app-save-indicator',
  template: `<span>{{ status() }}</span>`,
})
export class SaveIndicator {
  private readonly events = inject(EditorEvents);

  protected readonly status = toSignal(
    merge(
      this.events.saving$.pipe(map(() => 'Saving…')),
      this.events.saved$.pipe(map(() => 'All changes saved')),
      this.events.failed$.pipe(map(() => 'Save failed')),
    ),
    { initialValue: '' },
  );
}
```

`merge` completes when **all** sources complete, and errors as soon as **any** source errors.

## `concat` — one after another

`concat` subscribes to the next source only after the previous one **completes**:

```ts
import { concat, of, timer, map } from 'rxjs';

concat(
  of('Loading from cache…'),
  timer(1000).pipe(map(() => 'Fresh data loaded')),
).subscribe((msg) => console.log(msg));
```

## `zip` — pair values by index

`zip` waits for the *n*-th value from **every** source, then emits them together:

```
a$:   -a-----b---|
b$:   ---1-2-----|
zip:  ---x---y---|     x = [a,1]  y = [b,2]
```

```ts
import { from, zip } from 'rxjs';

const questions = from(['2 + 2?', 'Capital of France?']);
const answers = from(['4', 'Paris']);

zip([questions, answers]).subscribe(([q, a]) => console.log(q, '→', a));
// 2 + 2? → 4
// Capital of France? → Paris
```

`zip` buffers values from faster sources, so avoid it with fast endless streams.

## `withLatestFrom` — sample another stream

`withLatestFrom` emits only when the **source** emits, adding the latest value of the other stream(s). The other
stream never triggers an emission on its own.

```
clicks$:         --c---c--c|
value$:          -a---b----|
withLatestFrom:  --x---y--z|     x = [c,a]  y = [c,b]  z = [c,b]
```

```ts title="save-button.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { exhaustMap, Subject, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-note-editor',
  imports: [ReactiveFormsModule],
  template: `
    <textarea [formControl]="note"></textarea>
    <button type="button" (click)="save.next()">Save</button>
  `,
})
export class NoteEditor {
  private readonly http = inject(HttpClient);
  protected readonly note = new FormControl('', { nonNullable: true });
  protected readonly save = new Subject<void>();

  constructor() {
    this.save
      .pipe(
        withLatestFrom(this.note.valueChanges),
        exhaustMap(([, text]) => this.http.put('/api/note', { text })), // ignore clicks while saving
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
```

:::caution
`withLatestFrom` drops source values until every other stream has emitted at least once. In the example above, clicking
Save before typing does nothing. If that's a problem, add `startWith(this.note.value)` to the other stream — or simply
read `this.note.value` inside `exhaustMap`.
:::

## `race` — first one wins

`race` subscribes to all sources and mirrors whichever emits **first**, unsubscribing from the rest:

```ts
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, race, timer } from 'rxjs';

// inside an injection context
const http = inject(HttpClient);

const fastest$ = race([
  http.get<string>('/api/eu/time'),
  http.get<string>('/api/us/time'),
  timer(3000).pipe(map(() => 'timeout')),
]);
```

For "error if too slow", the dedicated `timeout()` operator is usually clearer — see [Error Handling](/rxjs/error-handling/).

## `startWith` and `endWith`

```ts
import { endWith, of, startWith } from 'rxjs';

of('b', 'c')
  .pipe(startWith('a'), endWith('d'))
  .subscribe((v) => console.log(v)); // a, b, c, d
```

`startWith` is everywhere in Angular code: give `valueChanges` an initial value, show a loading state before a
request finishes, or trigger a first load in a refresh stream.

## `partition` — split one stream into two

```ts
import { from, partition } from 'rxjs';

const [evens$, odds$] = partition(from([1, 2, 3, 4]), (n) => n % 2 === 0);
evens$.subscribe((n) => console.log('even', n)); // 2, 4
odds$.subscribe((n) => console.log('odd', n)); // 1, 3
```

(The pipeable `partition` operator is deprecated; use this static function.)

## Choosing a combinator

| You want… | Use |
|---|---|
| Latest value of each source, whenever any changes | `combineLatest` (or `computed()` for signals) |
| Run in parallel, one result when all finish | `forkJoin` |
| All values from all sources, as they arrive | `merge` |
| Sources one after another | `concat` |
| Pair the *n*-th values together | `zip` |
| On each event, also read the latest value of something else | `withLatestFrom` |
| Whichever source responds first | `race` |
| An initial or final value | `startWith` / `endWith` |

## Common mistakes

- **`combineLatest` never emits** because one source hasn't emitted yet. Add `startWith(...)` to sources like `valueChanges`.
- **`forkJoin` with a stream that never completes** never emits. Use it only with completing sources (HTTP calls), or add `take(1)`.
- **`forkJoin` hiding partial results.** One error fails everything; catch errors per source if you want the rest.
- **Using `combineLatest` to combine signals.** Use `computed()`.
- **Using deprecated forms** like `combineLatest(a$, b$, (a, b) => …)`. Use `combineLatest([a$, b$]).pipe(map(([a, b]) => …))`.

## Key takeaways

- `combineLatest` = "latest of everything"; `forkJoin` = "Promise.all for Observables".
- `merge` interleaves, `concat` sequences, `race` picks the fastest, `zip` pairs by index.
- `withLatestFrom` adds context from another stream without triggering on it.
- Use the object form (`combineLatest({ a, b })`, `forkJoin({ a, b })`) for readable code.
- With signals, `computed()` and `resource` params replace most combination needs.

## Next steps

- [Error Handling](/rxjs/error-handling/) — `catchError`, `retry`, `timeout`
- [Higher-Order Observables](/rxjs/higher-order-observables/) — `switchMap` and friends in depth
- [Computed Signals](/modern/computed-signals/) — derived state without RxJS
