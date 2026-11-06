---
title: Error Handling ⚠️
description: Handle RxJS errors in Angular 22 - catchError placement, retry with backoff, timeout, finalize, HttpErrorResponse, interceptors, and errors with toSignal and rxResource.
sidebar:
  order: 7
---

Networks fail, servers return 500s, users go offline. In RxJS an error is a **terminal** notification: once a stream
errors, it's finished. Good error handling means deciding **where** to catch errors, **what** to show the user, and
**whether** to try again.

## What you'll learn

- How errors travel through a `pipe()` and why they end the stream
- `catchError`: fall back, rethrow, or swallow — and where to put it
- `retry` with a count, a delay, and exponential backoff (`retryWhen` is deprecated)
- `timeout` for slow requests and `finalize` for cleanup
- Handling `HttpErrorResponse` and central handling with an HTTP interceptor
- How errors behave with `toSignal`, the `async` pipe and `rxResource`

## How errors flow

When a value-producing step throws or a source errors, every operator below it is skipped until something handles the error:

```
source:           --a--b--#            (# = error)
map(...):         --A--B--#            skipped for the error, passes it on
catchError(...):  --A--B--(F|)         replaced with a fallback F, then completes
```

```ts
import { catchError, map, of, throwError } from 'rxjs';

throwError(() => new Error('Network down'))
  .pipe(
    map((x) => x), // skipped
    catchError((err: Error) => of(`Fallback because: ${err.message}`)),
  )
  .subscribe({
    next: (v) => console.log(v), // Fallback because: Network down
    complete: () => console.log('complete'),
  });
```

:::note
After `catchError` the stream **completes** (it switched to your fallback Observable). It does not "resume" the
original source.
:::

## `catchError` — three ways to respond

`catchError` receives the error and must return a new Observable:

```ts
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, of, throwError } from 'rxjs';

// inside an injection context
const http = inject(HttpClient);

// 1. Fall back to a default value
http.get<string[]>('/api/tags').pipe(catchError(() => of([])));

// 2. Rethrow a friendlier error for the caller
http.get('/api/profile').pipe(
  catchError((err) => throwError(() => new Error('Could not load your profile', { cause: err }))),
);

// 3. Swallow it: complete without emitting
http.get('/api/ping').pipe(catchError(() => EMPTY));
```

Always use the factory form `throwError(() => error)` — passing the error directly is deprecated.

### Where you put `catchError` matters

This is the most important error-handling rule for long-lived streams like search boxes. Compare:

```ts
import { catchError, of, switchMap } from 'rxjs';

// ❌ Outer catchError: the FIRST failed request kills the whole search stream.
// After that, typing does nothing.
term$.pipe(
  switchMap((term) => api.search(term)),
  catchError(() => of([])),
);

// ✅ Inner catchError: only that one request is replaced; the search keeps working.
term$.pipe(
  switchMap((term) =>
    api.search(term).pipe(catchError(() => of([]))),
  ),
);
```

```
term$:          --a----b----c--->    (the request for "b" fails)
outer catch:    --A----(x|)          the whole stream is dead after b fails
inner catch:    --A----x----C--->    b's failure became x, c still works
```

## `retry` — try again

`HttpClient` requests are **cold**, so resubscribing sends the request again. `retry` does exactly that when an error occurs.

```ts
import { retry } from 'rxjs';

http.get('/api/flaky').pipe(retry(2)); // up to 3 attempts in total
```

### Retry with delay and exponential backoff

Pass a config object. `delay` can be a number of milliseconds or a function that returns an Observable — when that
Observable emits, RxJS retries; if it **errors**, retrying stops and the error is passed on.

```ts title="retry-backoff.ts"
import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, retry, throwError, timer } from 'rxjs';

/** Retry network/5xx errors with 1s, 2s, 4s… delays. Never retry 4xx errors. */
export function retryWithBackoff<T>(maxRetries = 3, baseMs = 1000): MonoTypeOperatorFunction<T> {
  return retry({
    count: maxRetries,
    delay: (error, retryCount) => {
      const retryable = error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
      if (!retryable) {
        return throwError(() => error); // stop retrying, pass the error on
      }
      return timer(baseMs * 2 ** (retryCount - 1));
    },
    resetOnSuccess: true, // reset the counter after a successful emission
  });
}
```

```ts
http.get<Order[]>('/api/orders').pipe(retryWithBackoff(), catchError(() => of([])));
```

:::caution[`retryWhen` is deprecated]
`retryWhen(errors$ => …)` is deprecated in RxJS 7 and will be removed in RxJS 8. Use `retry({ count, delay })` as shown
above. Similarly, `repeatWhen` is replaced by `repeat({ count, delay })`.
:::

:::danger[Don't blindly retry writes]
Retrying a `POST` that actually reached the server can create duplicates (two orders, two payments). Only retry
idempotent requests (`GET`, `PUT`, `DELETE`) unless your API supports idempotency keys.
:::

## `timeout` — give up on slow sources

```ts
import { catchError, of, timeout, TimeoutError } from 'rxjs';

http.get<Report>('/api/report').pipe(
  timeout({ first: 5000 }), // error with TimeoutError if no value within 5 s
  catchError((err) => {
    if (err instanceof TimeoutError) {
      return of(null); // treat as "no report"
    }
    throw err; // rethrow anything else
  }),
);
```

| Option | Meaning |
|---|---|
| `first` | Max time (ms or a `Date`) until the **first** value |
| `each` | Max time **between** values |
| `with` | Return a fallback Observable instead of erroring: `timeout({ first: 5000, with: () => of(cached) })` |

Throwing inside `catchError` (as above) is the same as returning `throwError(() => err)`.

:::tip[HttpClient has its own `timeout` option]
`http.get(url, { timeout: 3000 })` aborts the underlying HTTP request after 3 s and errors with an `HttpErrorResponse`
whose `status` is `0`. It only times the backend request itself (not interceptors). The RxJS `timeout()` operator works
on **any** Observable and lets you provide a fallback with `with`.
:::

## `finalize` — always clean up

`finalize` runs when the stream **completes, errors or is unsubscribed** — perfect for hiding a spinner:

```ts title="save-profile.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-save-profile',
  template: `
    <button type="button" (click)="save()" [disabled]="saving()">
      {{ saving() ? 'Saving…' : 'Save' }}
    </button>
    @if (error(); as message) {
      <p role="alert">{{ message }}</p>
    }
  `,
})
export class SaveProfile {
  private readonly http = inject(HttpClient);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected save() {
    this.saving.set(true);
    this.error.set(null);

    this.http
      .put('/api/profile', { name: 'Ada' })
      .pipe(finalize(() => this.saving.set(false))) // runs on success AND on error
      .subscribe({
        error: (err: HttpErrorResponse) => this.error.set(this.toMessage(err)),
      });
  }

  private toMessage(err: HttpErrorResponse): string {
    if (err.status === 0) return 'You appear to be offline.';
    if (err.status === 400) return 'Please check the form and try again.';
    if (err.status === 401) return 'Your session expired. Please sign in again.';
    if (err.status >= 500) return 'The server had a problem. Try again later.';
    return 'Something went wrong.';
  }
}
```

## Understanding `HttpErrorResponse`

Every failed `HttpClient` request errors with an `HttpErrorResponse`:

| Property | Meaning |
|---|---|
| `status` | HTTP status code. `0` means no response was received (offline, CORS, DNS failure, or the request `timeout` option expired) |
| `statusText` | Text for the status, e.g. `'Not Found'` |
| `error` | The response body (often your API's JSON error object), or the underlying error for network failures |
| `message` | A generated description including the URL and status |
| `url` | The request URL |

`HttpStatusCode` (from `@angular/common/http`) gives you named constants such as `HttpStatusCode.NotFound`.

## Central handling with an interceptor

Some reactions are the same for every request — for example "on 401, go to the login page". Put those in a functional
interceptor:

```ts title="auth-error.interceptor.ts"
import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === HttpStatusCode.Unauthorized) {
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err); // still let the caller decide what to show
    }),
  );
};
```

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authErrorInterceptor } from './auth-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authErrorInterceptor])),
  ],
};
```

## Errors with `toSignal`, the `async` pipe and `rxResource`

How an unhandled error surfaces depends on how you consume the Observable:

| Consumer | What happens on error |
|---|---|
| `subscribe()` without an `error` callback | RxJS rethrows it asynchronously; it reaches the browser and, with `provideBrowserGlobalErrorListeners()`, Angular's `ErrorHandler` |
| `async` pipe | Forwards the error to Angular's `ErrorHandler` |
| `toSignal()` | The signal **throws the error when it's read** (e.g. in the template) |
| `rxResource()` / `httpResource()` | No throw: `status()` becomes `'error'` and `error()` holds the error |

So with `toSignal`, handle errors **before** converting — map them into values the template can show:

```ts title="weather.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';

interface Forecast {
  summary: string;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'loaded'; forecast: Forecast }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-weather',
  template: `
    @let s = state();
    @switch (s.kind) {
      @case ('loading') {
        <p>Loading…</p>
      }
      @case ('error') {
        <p role="alert">Could not load the forecast.</p>
      }
      @case ('loaded') {
        <!-- s is narrowed to the 'loaded' variant here -->
        <p>{{ s.forecast.summary }}</p>
      }
    }
  `,
})
export class Weather {
  private readonly http = inject(HttpClient);

  protected readonly state = toSignal(
    this.http.get<Forecast>('/api/forecast').pipe(
      map((forecast): ViewState => ({ kind: 'loaded', forecast })),
      catchError(() => of<ViewState>({ kind: 'error', message: 'failed' })),
      startWith<ViewState>({ kind: 'loading' }),
    ),
    { requireSync: true }, // startWith makes the first value synchronous
  );
}
```

Or let `rxResource` track loading and error state for you:

```ts title="weather-resource.ts"
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

interface Forecast {
  summary: string;
}

@Component({
  selector: 'app-weather-resource',
  template: `
    @if (forecast.isLoading()) {
      <p>Loading…</p>
    } @else if (forecast.error()) {
      <p role="alert">Could not load the forecast.</p>
      <button type="button" (click)="forecast.reload()">Try again</button>
    } @else if (forecast.hasValue()) {
      <p>{{ forecast.value().summary }}</p>
    }
  `,
})
export class WeatherResource {
  private readonly http = inject(HttpClient);

  protected readonly forecast = rxResource({
    stream: () => this.http.get<Forecast>('/api/forecast').pipe(retry(2)),
  });
}
```

:::caution
A resource's `value()` **throws** while the status is `'error'`. Check `error()` first or guard with `hasValue()`
before reading `value()`.
:::

## Best practices

- **Handle errors where you have context** — the component or service that made the call knows what message to show.
  Angular's `ErrorHandler` is for *unexpected* errors (logging, reporting), not for normal UI flows.
- **Catch inside the flattening operator** for long-lived streams (search, polling, action streams).
- **Retry only transient failures** (status `0`, `5xx`) and only idempotent requests.
- **Use `finalize`** for cleanup that must happen on success, error and cancellation.
- **Give users a way out**: a "Try again" button (`reload()` on resources) beats a silent failure.

## Common mistakes

- **`catchError` at the end of a search/polling pipe** — the first error ends the stream forever.
- **Returning a plain value from `catchError`** (`catchError(() => [])` emits *nothing* for an empty array, since arrays are converted with `from`). Return `of([])`.
- **Using `retryWhen`, `throwError(err)` or `subscribe(next, error)`** — all deprecated. Use `retry({...})`, `throwError(() => err)` and observer objects.
- **Reading `resource.value()` in the error state** — it throws; check `hasValue()`/`error()` first.
- **Swallowing errors with `EMPTY` everywhere** — the user sees nothing and you never learn about the bug. At least log them.

## Key takeaways

- An error ends the stream; `catchError` replaces it with another Observable.
- Put `catchError` **inside** `switchMap`/`mergeMap` to keep outer streams alive.
- `retry({ count, delay })` replaces `retryWhen`; combine it with `timer` for backoff.
- `timeout` bounds waiting time; `finalize` always runs.
- `toSignal` throws errors on read, so map errors to state first — or use `rxResource`/`httpResource`, which expose `error()` and `reload()`.

## Next steps

- [Higher-Order Observables](/rxjs/higher-order-observables/) — where inner `catchError` lives
- [Schedulers & Testing](/rxjs/schedulers/) — test retries and timeouts with virtual time
- [Resource API](/modern/resource-api/) — signal-based async state
