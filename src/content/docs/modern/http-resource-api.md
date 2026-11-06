---
title: HttpResource API 🌐
description: Fetch data reactively with httpResource() in Angular 22 — URLs and request objects, typing and parsing, status signals, response types, progress, SSR and testing.
sidebar:
  order: 11
---

`httpResource()` is the easiest way to **read** data from an HTTP API in modern Angular. You give it a reactive function that returns a URL (or a request object); it sends the request through `HttpClient`, re-sends it whenever the signals it reads change, cancels outdated requests, and gives you the response, status and errors as signals. It is stable in Angular 22.

## What you'll learn

- Fetch JSON with a reactive URL and type the result
- Use request objects for query params, headers and other options
- Display loading, error and success states
- Validate responses with `parse` (e.g. Zod)
- Read headers, status codes and download progress
- Load text, blobs and binary data
- Chain requests, cache across SSR, and test an `httpResource`

## Setup

`httpResource` lives in `@angular/common/http`. In Angular 21 and later `HttpClient` is available without any setup, so you can use `httpResource` right away. Add `provideHttpClient()` only when you need to **configure** HTTP — for example interceptors:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

Because it uses `HttpClient`, every `httpResource` request goes through your interceptors. Since v22 `HttpClient` uses the browser's `fetch` API by default — you don't need (the now deprecated) `withFetch()`.

## Your first `httpResource`

```ts title="user-card.ts"
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  companyId: number;
}

@Component({
  selector: 'app-user-card',
  template: `
    @if (user.hasValue()) {
      <h2>{{ user.value().name }}</h2>
    } @else if (user.error()) {
      <p>Could not load the user.</p>
      <button type="button" (click)="user.reload()">Try again</button>
    } @else if (user.isLoading()) {
      <p>Loading…</p>
    }
  `,
})
export class UserCard {
  readonly userId = input.required<number>();

  // Re-fetches automatically whenever userId() changes
  protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```

- The generic `httpResource<User>` types `value()` as `User | undefined`.
- The request is sent **eagerly** — as soon as the resource is created — unlike `http.get()`, which waits for a subscription.
- If `userId` changes while a request is in flight, the old request is cancelled.

:::caution
`httpResource` is for **reading** data (GET). Don't use it for `POST`/`PUT`/`DELETE` — a re-render or signal change could resend the request. Use `HttpClient` methods for mutations, then call `reload()` or `set()` on the resource.
:::

## Request objects

Return an object instead of a string to control the request. Any signal read inside the function is a dependency:

```ts
protected readonly page = signal(1);
protected readonly category = signal<string | undefined>(undefined);

protected readonly products = httpResource<Product[]>(
  () => ({
    url: '/api/products',
    params: { page: this.page(), ...(this.category() ? { category: this.category()! } : {}) },
    headers: { 'X-Client': 'ng-guide' },
  }),
  { defaultValue: [] },
);
```

Useful request properties:

| Property | Purpose |
|---|---|
| `url` | The URL (put query parameters in `params`, not in the URL) |
| `method` | Defaults to `'GET'` |
| `params` | Query parameters (`HttpParams` or a plain object) |
| `headers` | `HttpHeaders` or a plain object |
| `body` | Request body (rarely needed for reads) |
| `context` | `HttpContext` for interceptors |
| `withCredentials` | Send cookies cross-origin |
| `timeout` | Abort after N milliseconds |
| `reportProgress` | Enable the `progress` signal (download progress) |
| `transferCache` | SSR transfer-cache control (see below) |
| `cache`, `credentials`, `mode`, `priority`, `redirect`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` | Passed to `fetch` |

## Skipping the request (idle)

Return `undefined` and no request is sent; the status is `'idle'`:

```ts
readonly userId = input<number | undefined>();

protected readonly user = httpResource<User>(() => {
  const id = this.userId();
  return id === undefined ? undefined : `/api/users/${id}`;
});
```

## Options

The second argument configures the resource:

| Option | Description |
|---|---|
| `defaultValue` | Value while idle/loading/error instead of `undefined` (makes `value()` non-optional) |
| `parse` | Transform/validate the raw response; its return type becomes the value type |
| `equal` | Custom equality for the parsed value |
| `injector` | Create the resource outside an injection context |
| `debugName` | Name in Angular DevTools |

## Validating responses with `parse`

TypeScript generics don't check what the server actually sent. Use `parse` with a schema library such as [Zod](https://zod.dev) to validate at runtime — the resource's type is inferred from the parser:

```ts title="zod-user.ts"
import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  companyId: z.number(),
});

@Component({
  selector: 'app-zod-user',
  template: `{{ user.value()?.name }}`,
})
export class ZodUser {
  readonly id = signal(1);

  // value() is typed from the schema; invalid responses become errors
  protected readonly user = httpResource(() => `/api/users/${this.id()}`, {
    parse: UserSchema.parse,
  });
}
```

If `parse` throws, the resource goes into the `'error'` state with that error.

## Status signals

`httpResource` returns an `HttpResourceRef`, which has everything a [resource](/modern/resource-api/) has plus HTTP details:

| Signal / method | Description |
|---|---|
| `value()` | Parsed response body (throws in `'error'` — guard with `hasValue()`) |
| `hasValue()` | Type guard: a value is available |
| `status()` | `'idle' \| 'loading' \| 'reloading' \| 'resolved' \| 'error' \| 'local'` |
| `isLoading()` | Loading or reloading |
| `error()` | The `HttpErrorResponse` or parse error |
| `headers()` | Response `HttpHeaders`, when available |
| `statusCode()` | HTTP status code, when available |
| `progress()` | Latest `HttpProgressEvent` when `reportProgress: true` |
| `reload()`, `set()`, `update()`, `destroy()` | Same as `resource()` |

```ts
protected readonly total = computed(() => Number(this.users.headers()?.get('X-Total-Count') ?? 0));
```

## Response types

By default the body is parsed as JSON. For other formats use the variants:

```ts
protected readonly readme = httpResource.text(() => '/README.md');            // string
protected readonly avatar = httpResource.blob(() => `/api/avatars/${this.id()}`); // Blob
protected readonly data   = httpResource.arrayBuffer(() => '/data.bin');      // ArrayBuffer
```

### Download progress

```ts
readonly fileId = input.required<string>();

protected readonly file = httpResource.blob(() => ({
  url: `/api/files/${this.fileId()}`,
  reportProgress: true,
}));

protected readonly downloaded = computed(() => this.file.progress()?.loaded ?? 0);
```

`reportProgress` on `httpResource` covers **download** progress only. (On `HttpClient`, `reportProgress` is deprecated in v22 in favour of `reportUploadProgress`/`reportDownloadProgress`; upload progress requires `provideHttpClient(withXhr())` because `fetch` can't report it.)

## Dependent requests with `chain`

The request function receives the same context as `resource` params, so you can chain one request off another:

```ts
readonly userId = input.required<number>();

protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);

protected readonly company = httpResource<Company>(({ chain }) => {
  const user = chain(this.user); // waits for user; mirrors its loading/error state
  return user ? `/api/companies/${user.companyId}` : undefined;
});
```

## A complete example: paginated search

```ts title="product-search.ts"
import { Component, computed, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Page<T> {
  items: T[];
  total: number;
}
interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'app-product-search',
  template: `
    <input placeholder="Search…" [value]="query()" (input)="query.set($event.target.value)" />

    @if (results.isLoading()) {
      <p>Loading…</p>
    }

    @if (results.error()) {
      <p>Something went wrong. <button type="button" (click)="results.reload()">Retry</button></p>
    } @else {
      <ul>
        @for (p of results.value().items; track p.id) {
          <li>{{ p.name }}</li>
        } @empty {
          <li>No results</li>
        }
      </ul>

      <button type="button" [disabled]="page() === 1" (click)="page.update((p) => p - 1)">Prev</button>
      <span>Page {{ page() }} / {{ pageCount() }}</span>
      <button type="button" [disabled]="page() >= pageCount()" (click)="page.update((p) => p + 1)">Next</button>
    }
  `,
})
export class ProductSearch {
  protected readonly query = signal('');
  // Back to page 1 whenever the query changes
  protected readonly page = linkedSignal({ source: this.query, computation: () => 1 });

  protected readonly results = httpResource<Page<Product>>(
    () => ({ url: '/api/products', params: { q: this.query(), page: this.page() } }),
    { defaultValue: { items: [], total: 0 } },
  );

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.results.value().total / 20)));
}
```

Because `value()` throws in the error state, the template checks `error()` **first** and only reads `value()` in the `@else` branch. `defaultValue` keeps `value()` non-optional while loading.

## SSR and the transfer cache

When your app uses SSR with `provideClientHydration()`, Angular's HTTP transfer cache stores responses made on the server and reuses them during hydration, so `httpResource` doesn't fetch the same data twice. Per request, you can opt out or include headers:

```ts
httpResource<User>(() => ({ url: '/api/me', transferCache: false }));
httpResource<User>(() => ({ url: '/api/config', transferCache: { includeHeaders: ['ETag'] } }));
```

(Plain `resource()` uses its own `id` option for the same purpose — see [Resource API](/modern/resource-api/#caching-across-ssr-and-hydration).)

## Testing

`httpResource` uses `HttpClient`, so you test it with `HttpTestingController`:

```ts title="user.spec.ts"
import { ApplicationRef, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { httpResource } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

it('loads data for the current id', async () => {
  TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });

  const id = signal(0);
  const backend = TestBed.inject(HttpTestingController);
  const response = httpResource<number>(() => `/data/${id()}`, {
    injector: TestBed.inject(Injector),
  });

  TestBed.tick(); // let the resource send its request
  backend.expectOne('/data/0').flush(42);
  await TestBed.inject(ApplicationRef).whenStable();

  expect(response.value()).toBe(42);
});
```

## `httpResource` vs `HttpClient` vs `resource`

| | `httpResource()` | `HttpClient` | `resource()` |
|---|---|---|---|
| Returns | Signals | Observable | Signals |
| Starts | Immediately, re-runs on signal change | On subscribe | Immediately, re-runs on signal change |
| Cancels outdated requests | ✅ | With `switchMap` | ✅ (if you use `abortSignal`) |
| Interceptors | ✅ | ✅ | ❌ (unless you call `HttpClient` yourself) |
| Best for | GET requests in components/services | Mutations, complex RxJS flows | Non-HTTP async (IndexedDB, workers, SDKs) |

## Common mistakes

| Mistake | Fix |
|---|---|
| Using `httpResource` for POST/PUT/DELETE | Use `HttpClient` for writes |
| Reading `value().name` without `hasValue()` | Guard: `@if (user.hasValue())` |
| Building query strings by hand | Use `params` in a request object |
| Expecting `httpResource<User>` to validate data | Generics are compile-time only — use `parse` |
| Adding `withFetch()` | Not needed in v22 (fetch is the default; `withFetch` is deprecated) |
| Creating `httpResource` in a method | Create it as a field (injection context) or pass `{ injector }` |

## Key takeaways

- `httpResource(() => url)` = reactive GET with signals for value, status, errors, headers and progress.
- Return `undefined` to skip; use `chain` for dependent requests.
- Use `parse` for runtime validation and typing.
- Interceptors, the fetch backend and the SSR transfer cache all work automatically.
- Use `HttpClient` for writes.

## Next steps

- [Resource API](/modern/resource-api/) — statuses, chaining, streaming in depth
- [HTTP Client basics](/beginner/http/) — interceptors, errors, mutations
- [Signal Forms](/modern/signal-forms/) — `validateHttp()` uses `httpResource` under the hood
