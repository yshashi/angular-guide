---
title: Higher-Order Observables 🎯
description: Deep dive into switchMap, mergeMap, concatMap and exhaustMap - timelines, concurrency, inner error handling and real Angular examples for search, uploads, saves and logins.
sidebar:
  order: 8
---

A **higher-order Observable** is an Observable whose values are themselves Observables — `Observable<Observable<T>>`.
They appear whenever one event should start another async operation: a keystroke starts a search request, a click
starts a save, a route change starts a data load. The four **flattening operators** turn them back into a normal
stream, and choosing the right one prevents race conditions, duplicate requests and lost data.

## What you'll learn

- Why nested `subscribe()` calls are a bug, and how flattening fixes them
- Exactly how `switchMap`, `mergeMap`, `concatMap` and `exhaustMap` behave on a timeline
- Limiting parallelism with `mergeMap(fn, concurrency)`
- Handling errors inside inner Observables
- Real Angular examples: route-driven loading, parallel uploads, ordered saves, double-submit protection

## The problem: nested subscriptions

```ts
// ❌ Don't do this
this.route.paramMap.subscribe((params) => {
  this.http.get<User>(`/api/users/${params.get('id')}`).subscribe((user) => {
    this.user.set(user);
  });
});
```

What's wrong?

- **Race condition:** if the id changes quickly, an older (slower) response can arrive last and overwrite the newer user.
- **Leaks:** the inner subscription isn't tied to anything; nobody unsubscribes it.
- **No composition:** you can't add `retry`, `catchError` or `debounceTime` to the whole flow.

With `map` alone you'd get an Observable of Observables:

```ts
const nested$ = this.route.paramMap.pipe(
  map((params) => this.http.get<User>(`/api/users/${params.get('id')}`)),
); // Observable<Observable<User>> 😕
```

A flattening operator subscribes to each inner Observable **for you** and emits its values:

```ts
// ✅ One stream, one subscription, latest id wins
const user$ = this.route.paramMap.pipe(
  switchMap((params) => this.http.get<User>(`/api/users/${params.get('id')}`)),
); // Observable<User>
```

(`switchMap` = `map` + `switchAll`. Likewise `mergeMap` = `map` + `mergeAll`, `concatMap` = `map` + `concatAll`,
`exhaustMap` = `map` + `exhaustAll`.)

## The four strategies on one timeline

Same outer stream, same inner Observable (each inner emits its value 3 ms after it starts and completes 1 ms later):

```
outer:        ab----c---|
inner(x):     ---X|

switchMap:    ----B----C|      a is cancelled when b arrives
mergeMap:     ---AB----C|      a and b run at the same time
concatMap:    ---A---B---C|    b waits for a; c waits for b
exhaustMap:   ---A-----C|      b is ignored because a is still running
```

| Operator | New outer value while an inner is running | Order of results | Risk |
|---|---|---|---|
| `switchMap` | Unsubscribe the old inner, start the new one | Only latest | Cancels work (bad for writes) |
| `mergeMap` | Start another inner in parallel | Whatever finishes first | Out-of-order results, unbounded parallelism |
| `concatMap` | Queue it; start when the current inner completes | Same as input | Queue can grow; slow |
| `exhaustMap` | Ignore it | Only the first of a burst | Drops events |

:::tip[Memory aid]
**switch** = "I changed my mind", **merge** = "do them all", **concat** = "one at a time, in order",
**exhaust** = "I'm busy, go away".
:::

## `switchMap` — latest wins

Use it for **reads** where only the latest request matters: search, filters, route-param loading, autocomplete.

```ts title="user-detail.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

interface User {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-detail',
  template: `
    @if (user(); as u) {
      <h2>{{ u.name }}</h2>
    } @else {
      <p>User not found.</p>
    }
  `,
})
export class UserDetail {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  protected readonly user = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')!),
      switchMap((id) =>
        this.http.get<User>(`/api/users/${id}`).pipe(
          catchError(() => of(null)), // inner catchError: one 404 doesn't break later navigations
        ),
      ),
    ),
  );
}
```

When `switchMap` unsubscribes from an in-flight `HttpClient` request, Angular **aborts** the HTTP request, so the
browser stops waiting for it too.

:::caution[Don't `switchMap` writes]
If the user clicks "Save" twice, `switchMap` cancels the first `PUT`. The server may or may not have processed it —
you can't know. Use `concatMap` (keep all, in order) or `exhaustMap` (ignore extras) for writes.
:::

## `mergeMap` — everything in parallel

Use it when each inner operation is **independent** and order doesn't matter: uploading several files, sending
analytics, deleting several selected items.

Always consider the optional **concurrency** argument to avoid flooding the server:

```ts title="file-uploader.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, from, map, mergeMap, Subject } from 'rxjs';

interface Progress {
  name: string;
  percent: number;
}

@Component({
  selector: 'app-file-uploader',
  template: `
    <input type="file" multiple (change)="select($event)" />
    @for (p of progress(); track p.name) {
      <p>{{ p.name }}: {{ p.percent }}%</p>
    }
  `,
})
export class FileUploader {
  private readonly http = inject(HttpClient);
  private readonly files = new Subject<File[]>();
  protected readonly progress = signal<Progress[]>([]);

  constructor() {
    this.files
      .pipe(
        mergeMap((files) => from(files)), // flatten the array into single files
        mergeMap((file) => this.upload(file), 3), // at most 3 uploads at the same time
        takeUntilDestroyed(),
      )
      .subscribe((p) =>
        this.progress.update((list) => [...list.filter((x) => x.name !== p.name), p]),
      );
  }

  protected select(event: Event) {
    const input = event.target as HTMLInputElement;
    this.files.next(Array.from(input.files ?? []));
  }

  private upload(file: File) {
    const body = new FormData();
    body.append('file', file);

    return this.http
      .post('/api/upload', body, { reportUploadProgress: true, observe: 'events' })
      .pipe(
        filter((e) => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
        map((e) => ({
          name: file.name,
          percent:
            e.type === HttpEventType.UploadProgress && e.total ? Math.round((100 * e.loaded) / e.total) : 100,
        })),
      );
  }
}
```

:::note[Upload progress needs `withXhr()`]
`HttpClient` uses the Fetch API by default in Angular 22, and Fetch can't report **upload** progress — setting
`reportUploadProgress` with the default backend throws an error. Add `provideHttpClient(withXhr())` to use
`XMLHttpRequest` if you need upload progress (don't use `withXhr` for server-side rendering).
:::

## `concatMap` — one at a time, in order

Use it when **order matters** or when each step depends on the previous one finishing: saving edits, moving items
in a sorted list, sending chat messages.

```ts title="todo-sync.ts"
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { concatMap, Subject } from 'rxjs';

type TodoChange =
  | { kind: 'add'; title: string }
  | { kind: 'toggle'; id: number }
  | { kind: 'remove'; id: number };

@Service()
export class TodoSync {
  private readonly http = inject(HttpClient);
  private readonly changes = new Subject<TodoChange>();

  constructor() {
    this.changes
      .pipe(
        // "add" must reach the server before "toggle" on the same item
        concatMap((change) => this.send(change)),
      )
      .subscribe();
  }

  queue(change: TodoChange) {
    this.changes.next(change);
  }

  private send(change: TodoChange) {
    switch (change.kind) {
      case 'add':
        return this.http.post('/api/todos', { title: change.title });
      case 'toggle':
        return this.http.patch(`/api/todos/${change.id}/toggle`, {});
      case 'remove':
        return this.http.delete(`/api/todos/${change.id}`);
    }
  }
}
```

## `exhaustMap` — ignore while busy

Use it for actions that should not overlap: login, "Submit order", pull-to-refresh, "Load more".

```ts title="login-form.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, exhaustMap, finalize, of, Subject, tap } from 'rxjs';

interface Credentials {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  template: `
    <form (submit)="$event.preventDefault(); submit.next({ email: email.value, password: password.value })">
      <input #email type="email" placeholder="Email" />
      <input #password type="password" placeholder="Password" />
      <button type="submit">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      @if (failed()) {
        <p role="alert">Wrong email or password.</p>
      }
    </form>
  `,
})
export class LoginForm {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly submit = new Subject<Credentials>();
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    this.submit
      .pipe(
        exhaustMap((credentials) => {
          this.busy.set(true);
          this.failed.set(false);
          return this.http.post<{ token: string }>('/api/login', credentials).pipe(
            tap(() => this.router.navigate(['/dashboard'])),
            catchError(() => {
              this.failed.set(true);
              return of(null); // keep the submit stream alive
            }),
            finalize(() => this.busy.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
```

Even if the user double-clicks or presses Enter repeatedly, only **one** login request is in flight.

## Errors inside inner Observables

An error in an inner Observable propagates to the outer stream and **kills it**. For long-lived outer streams
(route params, form changes, button clicks), always catch errors **inside** the flattening operator, as every example
above does. See [Error Handling](/rxjs/error-handling/#where-you-put-catcherror-matters).

## Making the right choice

```
Does each new value make the previous work irrelevant?
├─ Yes → switchMap          (search, filters, route params — reads only)
└─ No
   ├─ Should extra values be dropped while busy?
   │  └─ Yes → exhaustMap   (login, submit, refresh)
   └─ No, every value must be processed
      ├─ Does order matter / must they not overlap?
      │  └─ Yes → concatMap (ordered saves, queues)
      └─ No → mergeMap      (independent parallel work; set a concurrency limit)
```

:::tip[Signals alternative for reads]
For the very common "signal/input changes → load data" case, `rxResource` (or `httpResource`) gives you
`switchMap`-like cancellation plus `isLoading()`, `error()` and `reload()` with no manual flattening. See
[RxJS Patterns in Angular](/rxjs/angular-patterns/).
:::

## Related operators

| Operator | What it does |
|---|---|
| `switchAll` / `mergeAll` / `concatAll` / `exhaustAll` | Flatten an existing `Observable<Observable<T>>` |
| `switchScan` / `mergeScan` | Like `scan`, but the accumulator returns an Observable |
| `expand` | Recursively map each result to a new inner Observable (pagination) |

:::note[Deprecated forms]
`exhaust` was renamed to `exhaustAll`. Result-selector arguments (e.g. `switchMap(fn, (outer, inner) => …)`) and
`switchMapTo`/`mergeMapTo`/`concatMapTo` are deprecated — use a nested `map` instead:
`switchMap((a) => load(a).pipe(map((b) => ({ a, b }))))`.
:::

## Common mistakes

- **Nested `subscribe()`** — always use a flattening operator.
- **`switchMap` for POST/PUT/DELETE** — can cancel writes; use `concatMap` or `exhaustMap`.
- **`mergeMap` for search** — slower old responses can overwrite newer ones; use `switchMap`.
- **Unbounded `mergeMap`** — pass a concurrency limit when the source can emit many values.
- **`catchError` outside the flattening operator** — one failure ends the whole stream.

## Key takeaways

- Flattening operators subscribe to inner Observables for you and manage their lifetime.
- `switchMap` cancels, `mergeMap` parallelises, `concatMap` queues, `exhaustMap` ignores.
- Reads → usually `switchMap`; writes → `concatMap` or `exhaustMap`.
- Catch errors inside the inner Observable to keep the outer stream alive.

## Next steps

- [Schedulers & Testing](/rxjs/schedulers/) — prove these timelines with marble tests
- [RxJS Patterns in Angular](/rxjs/angular-patterns/) — `rxResource`, `toSignal` and friends
- [Error Handling](/rxjs/error-handling/) — inner `catchError`, `retry`, `finalize`
