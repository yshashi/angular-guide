---
title: Schedulers & Testing 🧪
description: Understand RxJS schedulers and test async RxJS code in Angular 22 with Vitest - marble testing with TestScheduler, vi fake timers, and TestBed component tests.
sidebar:
  order: 9
---

**Schedulers** decide *when* RxJS does its work: right now, after the current task, on the next animation frame, or
after a timer. You rarely touch them directly — but understanding them explains how operators like `debounceTime` work,
and it's the key to **testing time-based code instantly** instead of waiting for real seconds to pass.

Angular projects use **Vitest** as the default test runner (since Angular 21), so all tests on this page use Vitest
(`describe`, `it`, `expect`, `vi`).

## What you'll learn

- The four RxJS schedulers and the order in which they run
- `observeOn`, `scheduled()` and `animationFrames()`
- Marble testing with `TestScheduler`: syntax, cold/hot Observables, subscriptions, time progression
- Testing timers with Vitest fake timers (`vi.useFakeTimers()`)
- Testing an Angular component that uses `debounceTime` + `HttpClient`

## The schedulers

| Scheduler | Runs work… | Built on | Used by default for |
|---|---|---|---|
| *(none — synchronous)* | Immediately, during `subscribe()`/`next()` | — | `of`, `from([...])`, `map`, `filter`… |
| `queueScheduler` | Synchronously, but queued (avoids deep recursion) | — | Rare; recursive scheduling |
| `asapScheduler` | After the current task, as a **microtask** | `Promise.resolve().then` | Nothing by default |
| `asyncScheduler` | After a delay, as a **macrotask** | `setTimeout`/`setInterval` | `interval`, `timer`, `delay`, `debounceTime`, `throttleTime`, `timeout`, `bufferTime`… |
| `animationFrameScheduler` | Before the next browser repaint | `requestAnimationFrame` | Nothing by default |

### Seeing the order

```ts
import { asapScheduler, asyncScheduler, observeOn, of } from 'rxjs';

console.log('start');

of('async').pipe(observeOn(asyncScheduler)).subscribe((v) => console.log(v));
of('asap').pipe(observeOn(asapScheduler)).subscribe((v) => console.log(v));
of('sync').subscribe((v) => console.log(v));
Promise.resolve().then(() => console.log('promise'));

console.log('end');

// start
// sync
// end
// asap      ← microtask, queued before the promise callback
// promise   ← microtask
// async     ← macrotask (setTimeout)
```

`observeOn(scheduler)` re-delivers every notification on the given scheduler. Its sibling `subscribeOn(scheduler)`
delays the **subscription** itself.

:::caution[Deprecated: scheduler arguments on creation functions]
Passing a scheduler as the last argument of `of`, `from`, `merge`, `concat`, `combineLatest`, `startWith`, etc. is
deprecated in RxJS 7. Use `scheduled()` or `observeOn()` instead:

```ts
import { asapScheduler, scheduled } from 'rxjs';

scheduled([1, 2, 3], asapScheduler); // instead of of(1, 2, 3, asapScheduler)
```

Time-based operators (`debounceTime(300, scheduler)`, `interval(1000, scheduler)`) still accept a scheduler argument,
but you almost never need it — `TestScheduler.run()` virtualises time automatically.
:::

### `animationFrames()` for smooth JS animations

`animationFrames()` emits once per frame with `{ timestamp, elapsed }`. It's handy for number counters and canvas
drawing (for regular UI transitions, prefer CSS and Angular's `animate.enter`/`animate.leave`).

```ts title="count-up.ts"
import { Component, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { animationFrames, map, switchMap, takeWhile } from 'rxjs';

@Component({
  selector: 'app-count-up',
  template: `<span>{{ value() }}</span>`,
})
export class CountUp {
  readonly target = input.required<number>();
  readonly durationMs = input(1000);

  protected readonly value = toSignal(
    toObservable(this.target).pipe(
      switchMap((target) =>
        animationFrames().pipe(
          map(({ elapsed }) => Math.min(elapsed / this.durationMs(), 1)), // progress 0 → 1
          takeWhile((progress) => progress < 1, true), // stop after reaching 1
          map((progress) => Math.round(target * progress)),
        ),
      ),
    ),
    { initialValue: 0 },
  );
}
```

`animationFrames()` relies on `requestAnimationFrame`, which doesn't exist during server-side rendering — only use
it in browser-rendered components.

## Testing RxJS code

Time-based code is hard to test with real time: a `debounceTime(300)` test would have to wait 300 ms, and a retry with
backoff could take seconds. You have two good tools:

| Tool | Best for |
|---|---|
| **`TestScheduler`** (marble tests) | Pure RxJS logic: operator chains, custom operators, services that return Observables |
| **Vitest fake timers** (`vi.useFakeTimers()`) | Code mixing RxJS with Promises, `setTimeout`, Angular components and `TestBed` |

:::note[What about `fakeAsync`?]
`fakeAsync`/`tick` depend on **zone.js**. New Angular apps are zoneless, and the Angular team no longer recommends
`fakeAsync`. Use Vitest fake timers or `TestScheduler` instead. (If an older test suite still needs `fakeAsync` under
Vitest, it requires the `zone.js/plugins/vitest-patch` polyfill.)
:::

## Marble testing with `TestScheduler`

`TestScheduler` runs your Observables in **virtual time**. Inside `testScheduler.run(...)`, every time-based operator
(`debounceTime`, `delay`, `interval`, `timer`, `retry` delays…) uses virtual time automatically, so a test that covers
"10 seconds" finishes in microseconds.

### Setup in Vitest

```ts title="search.spec.ts"
import { TestScheduler } from 'rxjs/testing';

describe('my stream', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    // Create a fresh scheduler for every test — virtual time must start at 0
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  // tests go here
});
```

### Marble syntax (inside `run()`)

| Symbol | Meaning |
|---|---|
| `-` | One frame of virtual time (1 ms) |
| `a`, `b`, `x`… | A value emitted in that frame (map letters to real values with an object) |
| `\|` | Complete |
| `#` | Error |
| `(ab)` | Synchronous group: `a` and `b` emitted in the **same** frame. The group still takes up as many frames as it has characters, including the parentheses |
| `100ms`, `2s`, `1m` | Time progression: advance virtual time by that amount (surround with spaces) |
| ` ` (space) | Ignored — use it to align diagrams |
| `^` | Subscription point (hot Observables and subscription marbles) |
| `!` | Unsubscription point (subscription marbles) |

```ts
it('maps values', () => {
  testScheduler.run(({ cold, expectObservable }) => {
    const source$ = cold('-a-b-c|', { a: 1, b: 2, c: 3 });

    expectObservable(source$.pipe(map((n) => n * 10))).toBe('-a-b-c|', { a: 10, b: 20, c: 30 });
  });
});
```

The `run()` callback gives you these helpers:

| Helper | Purpose |
|---|---|
| `cold(marbles, values?, error?)` | An Observable that starts when subscribed (like an HTTP call) |
| `hot(marbles, values?, error?)` | An Observable that is already "running"; `^` marks where the test subscribes |
| `expectObservable(obs$, subscriptionMarbles?).toBe(marbles, values?, error?)` | Assert what `obs$` emits (optionally unsubscribe at `!`) |
| `expectSubscriptions(cold$.subscriptions).toBe(marbles)` | Assert when a cold Observable was subscribed/unsubscribed |
| `time('---\|')` | Convert a marble string to a number of frames (here `3`) |
| `flush()` | Run all queued virtual work immediately |
| `animate(marbles)` | Control `animationFrames()` in virtual time |

### Example: testing a debounced search

The function under test:

```ts title="search.ts"
import { debounceTime, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';

export function searchResults(
  terms$: Observable<string>,
  search: (term: string) => Observable<string[]>,
): Observable<string[]> {
  return terms$.pipe(
    map((term) => term.trim()),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => search(term)),
  );
}
```

The tests — no real waiting, and we can even prove that `switchMap` cancelled the slow request:

```ts title="search.spec.ts"
import { TestScheduler } from 'rxjs/testing';
import { searchResults } from './search';

describe('searchResults', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('debounces input and searches the latest term', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      // "an" at 0 ms, "ang" at 101 ms, "angular" at 402 ms
      const terms$ = cold('a 100ms b 300ms c', { a: 'an', b: 'ang', c: 'angular' });
      // every search responds after 50 ms
      const search = (term: string) => cold('50ms r|', { r: [`${term} result`] });

      // "an" is dropped (a new term came within 300 ms)
      // "ang" is searched at 401 ms → result at 451 ms
      // "angular" is searched at 702 ms → result at 752 ms
      expectObservable(searchResults(terms$, search)).toBe('451ms x 300ms y', {
        x: ['ang result'],
        y: ['angular result'],
      });
    });
  });

  it('cancels a slow search when a newer term arrives', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const terms$ = cold('a 300ms b', { a: 'ng', b: 'rxjs' });
      const response$ = cold('500ms r|', { r: ['result'] }); // a slow API

      expectObservable(searchResults(terms$, () => response$)).toBe('1101ms r', { r: ['result'] });
      expectSubscriptions(response$.subscriptions).toBe([
        '300ms ^ 300ms !', // first search: cancelled by switchMap at 601 ms
        '601ms ^ 500ms !', // second search: runs to completion
      ]);
    });
  });
});
```

:::tip[Reading time progression]
`'451ms x 300ms y'` means: advance 451 frames, emit `x` (which takes one frame), advance 300 more, emit `y`. So `y`
lands at frame 451 + 1 + 300 = 752. When the math gets confusing, write the expected frames in a comment like above.
:::

### Hot Observables and `time()`

```ts
it('throttles clicks', () => {
  testScheduler.run(({ hot, time, expectObservable }) => {
    const clicks$ = hot('-a-^-b-c-d|'); // the test subscribes at ^; "a" happened before and is missed
    const t = time('---|'); // 3 frames

    expectObservable(clicks$.pipe(throttleTime(t))).toBe('--b---d|');
  });
});
```

### Testing errors and unsubscription

```ts
it('emits then errors', () => {
  testScheduler.run(({ cold, expectObservable }) => {
    const source$ = cold('-a-#', { a: 1 }, new Error('boom'));
    expectObservable(source$).toBe('-a-#', { a: 1 }, new Error('boom'));
  });
});

it('stops when unsubscribed', () => {
  testScheduler.run(({ cold, expectObservable }) => {
    // the second argument unsubscribes at "!" (frame 5)
    expectObservable(cold('-a-b-c-d-e|'), '^----!').toBe('-a-b-');
  });
});
```

### Testing retry with backoff

A `retry({ delay })` with exponential backoff (see [Error Handling](/rxjs/error-handling/#retry-with-delay-and-exponential-backoff))
would take 7 real seconds to test. With virtual time it's instant:

```ts
import { HttpErrorResponse } from '@angular/common/http';
import { defer, of, throwError } from 'rxjs';
import { retryWithBackoff } from './retry-backoff';

it('retries 5xx errors with 1s, 2s and 4s delays', () => {
  testScheduler.run(({ expectObservable }) => {
    let attempts = 0;
    const flaky$ = defer(() =>
      ++attempts < 4 ? throwError(() => new HttpErrorResponse({ status: 503 })) : of('ok'),
    );

    // 1000 + 2000 + 4000 = 7000 ms of virtual time
    expectObservable(flaky$.pipe(retryWithBackoff(3, 1000))).toBe('7000ms (o|)', { o: 'ok' });
  });
});
```

## Vitest fake timers

`asyncScheduler` uses `setInterval` and `Date.now()` under the hood. Vitest's fake timers replace both, so you can
drive RxJS timers manually with `vi.advanceTimersByTime()` — no `TestScheduler` needed. This is the simplest choice for
code that also uses Promises or Angular APIs.

```ts title="poll.ts"
import { exhaustMap, Observable, timer } from 'rxjs';

/** Calls `request` immediately and then every `everyMs`, skipping a tick if the previous call is still running. */
export function poll<T>(request: () => Observable<T>, everyMs: number): Observable<T> {
  return timer(0, everyMs).pipe(exhaustMap(() => request()));
}
```

```ts title="poll.spec.ts"
import { of } from 'rxjs';
import { poll } from './poll';

describe('poll', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers()); // always restore real timers

  it('requests immediately and then every 5 seconds', () => {
    const request = vi.fn(() => of('data'));
    const values: string[] = [];

    const subscription = poll(request, 5000).subscribe((v) => values.push(v));

    vi.advanceTimersByTime(0); // timer(0, …) fires on the next tick
    expect(request).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10_000);
    expect(request).toHaveBeenCalledTimes(3);
    expect(values).toEqual(['data', 'data', 'data']);

    subscription.unsubscribe();
    vi.advanceTimersByTime(10_000);
    expect(request).toHaveBeenCalledTimes(3); // no more calls after unsubscribe
  });
});
```

| Vitest API | What it does |
|---|---|
| `vi.useFakeTimers()` / `vi.useRealTimers()` | Turn fake timers on/off |
| `vi.advanceTimersByTime(ms)` | Run timers due in the next `ms` (synchronous) |
| `await vi.advanceTimersByTimeAsync(ms)` | Same, but also flushes Promises between timers |
| `await vi.runAllTimersAsync()` | Run all pending timers (don't use with endless `interval`s) |
| `vi.fn()` / `vi.spyOn()` | Mock functions and spy on methods |

## Testing an Angular component with RxJS timing

Here's a component that searches as you type, using `toObservable` + `debounceTime` + `switchMap` and `toSignal`:

```ts title="user-search.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-user-search',
  template: `
    <input #box (input)="query.set(box.value)" />
    <ul>
      @for (name of results(); track name) {
        <li>{{ name }}</li>
      }
    </ul>
  `,
})
export class UserSearch {
  private readonly http = inject(HttpClient);
  protected readonly query = signal('');

  protected readonly results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => (q ? this.http.get<string[]>('/api/users', { params: { q } }) : of([]))),
    ),
    { initialValue: [] },
  );
}
```

The test combines `TestBed`, `HttpTestingController` and Vitest fake timers. Use the **async** timer helpers so Angular's
rendering (which is Promise/timer based in zoneless apps) can run between steps:

```ts title="user-search.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserSearch } from './user-search';

describe('UserSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify(); // no unexpected requests
    vi.useRealTimers();
  });

  it('waits 300 ms after typing before searching', async () => {
    const fixture = TestBed.createComponent(UserSearch);
    const httpTesting = TestBed.inject(HttpTestingController);
    await vi.runAllTimersAsync(); // initial render

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'ad';
    input.dispatchEvent(new Event('input'));

    await vi.advanceTimersByTimeAsync(299);
    httpTesting.expectNone('/api/users?q=ad'); // still debouncing

    await vi.advanceTimersByTimeAsync(1);
    httpTesting.expectOne('/api/users?q=ad').flush(['Ada', 'Adele']);

    await vi.runAllTimersAsync(); // render the results
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(Array.from(items, (li: Element) => li.textContent)).toEqual(['Ada', 'Adele']);
  });
});
```

More component and service testing techniques are in [Component Testing](/testing/component-testing/) and
[Service Testing](/testing/service-testing/).

## Best practices

- **Extract stream logic into functions or services** that take their inputs as Observables — they're trivial to marble-test.
- **Create a new `TestScheduler` per test** (in `beforeEach`), or virtual time leaks between tests.
- **Prefer `TestScheduler` for pure RxJS**, fake timers for anything involving Promises, `TestBed` or the DOM.
- **Always restore real timers** in `afterEach`.
- **Don't mix** `TestScheduler.run()` and `vi.useFakeTimers()` in the same test.
- **Assert subscriptions** (`expectSubscriptions`) when cancellation behaviour matters — e.g. proving `switchMap` cancelled a request.

## Common mistakes

- **Waiting for real time** with `await new Promise((r) => setTimeout(r, 300))` — slow and flaky.
- **Forgetting that `(ab)` takes frames.** A group occupies as many frames as its characters, including the parentheses.
- **`vi.runAllTimers()` with an endless `interval`** — it loops until Vitest's timer limit and fails. Advance by a fixed time instead.
- **Using `fakeAsync` in a zoneless app** — it needs zone.js; use Vitest fake timers.

## Key takeaways

- Schedulers control *when* work happens; time-based operators use `asyncScheduler` by default.
- Use `scheduled()`/`observeOn()` instead of deprecated scheduler arguments.
- `TestScheduler.run()` virtualises time, so marble tests are fast and deterministic.
- Vitest fake timers drive RxJS timers too, and work well with `TestBed` and `HttpTestingController`.

## Next steps

- [RxJS Patterns in Angular](/rxjs/angular-patterns/) — put it all together with signals
- [Unit Testing](/testing/unit-testing/) — Vitest basics in Angular
- [Mocking](/testing/mocking/) — mocking services and HTTP
