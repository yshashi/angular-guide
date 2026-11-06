---
title: HTTP Client 🌐
description: Learn to talk to servers with Angular - HttpClient, httpResource, toSignal, POST/PUT/DELETE, functional interceptors and error handling.
sidebar:
  order: 10
---

Most apps load and save data on a server. Angular's `HttpClient` (from `@angular/common/http`) sends HTTP requests, parses JSON for you, and plugs into signals and RxJS. On top of it, **`httpResource()`** gives you a reactive, signal-based way to *read* data with built-in loading and error states.

## What you'll learn

- How `HttpClient` is set up (and what changed in v22: Fetch by default)
- How to **read** data with `httpResource()` and with `HttpClient` + `toSignal()`
- How to **write** data with `post`, `put`, `patch` and `delete`
- How to handle loading and errors
- How to write functional interceptors (auth headers, logging, error handling)

## Setup

`HttpClient` is **available out of the box** — you can `inject(HttpClient)` without any configuration. Call `provideHttpClient()` in `app.config.ts` when you want to **configure** it, for example to add interceptors:

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

Since **Angular 22**, `HttpClient` sends requests with the browser's **Fetch API** by default.

| Option | When to use |
|---|---|
| `provideHttpClient()` | Default — uses `fetch`. |
| `withInterceptors([...])` | Add functional interceptors. |
| `withXhr()` | Switch back to `XMLHttpRequest`, e.g. if you need **upload** progress events (fetch can't report them). Not for server-side rendering. |

:::note[Angular 21 and earlier]
`HttpClient` used `XMLHttpRequest` by default and you opted into fetch with `provideHttpClient(withFetch())`. In v22 `withFetch()` is **deprecated** — fetch is already the default, so just delete it. `HttpClientModule` is deprecated too; use `provideHttpClient()`. When you update, `ng update` adds `withXhr()` to apps that were still using `XMLHttpRequest`, so their behaviour doesn't change; remove it if you don't need upload progress.
:::

## Choosing the right tool

| Task | Use |
|---|---|
| **Read** data that depends on signals (an id from the route, a search term) | `httpResource()` |
| Read data once, as a signal | `HttpClient` + `toSignal()` |
| **Create / update / delete** (POST, PUT, PATCH, DELETE) | `HttpClient` methods, usually inside a service |
| Complex streams (polling, combining, debouncing with RxJS) | `HttpClient` + RxJS operators (see [RxJS in Angular](/rxjs/angular-patterns/)) |

## Reading data with `httpResource()`

`httpResource()` makes a GET request and exposes the result as **signals**. It re-fetches automatically whenever a signal used in its URL changes.

```ts title="user-list.ts"
import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  template: `
    @if (users.isLoading()) {
      <p>Loading users…</p>
    } @else if (users.error()) {
      <p>Could not load users. <button type="button" (click)="users.reload()">Retry</button></p>
    } @else if (users.hasValue()) {
      <ul>
        @for (user of users.value(); track user.id) {
          <li>{{ user.name }} — {{ user.email }}</li>
        }
      </ul>
    }
  `,
})
export class UserList {
  protected readonly users = httpResource<User[]>(() => 'https://jsonplaceholder.typicode.com/users');
}
```

A resource gives you:

| Signal / method | Meaning |
|---|---|
| `value()` | The parsed response (`undefined` until loaded). Reading it in the error state **throws** — guard with `hasValue()`. |
| `hasValue()` | `true` when a value is available |
| `isLoading()` | `true` while a request is in flight |
| `error()` | The error, if the request failed |
| `status()` | `'idle'`, `'loading'`, `'reloading'`, `'resolved'`, `'error'` or `'local'` |
| `reload()` | Fetch again |
| `headers()`, `statusCode()` | Response metadata |

Use `defaultValue` to avoid `undefined` — handy for lists:

```ts
protected readonly users = httpResource<User[]>(() => '/api/users', { defaultValue: [] });
```

### Reactive requests

Read signals inside the function and the request re-runs when they change. Return `undefined` to **skip** the request:

```ts title="user-detail.ts"
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-user-detail',
  template: `
    @if (user.hasValue()) {
      <h2>{{ user.value().name }}</h2>
      <p>📧 {{ user.value().email }} · 📞 {{ user.value().phone }}</p>
    } @else if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p>User not found.</p>
    }
  `,
})
export class UserDetail {
  // e.g. from the route /users/:id with withComponentInputBinding()
  readonly id = input.required<string>();

  protected readonly user = httpResource<User>(() =>
    this.id() ? `https://jsonplaceholder.typicode.com/users/${this.id()}` : undefined,
  );
}
```

When `id` changes, any pending request is **cancelled** and a new one starts.

For query parameters and headers, return a request object:

```ts
protected readonly page = signal(1);
protected readonly posts = httpResource<Post[]>(() => ({
  url: 'https://jsonplaceholder.typicode.com/posts',
  params: { _page: this.page(), _limit: 10 },
  headers: { 'X-Client': 'ng-guide' },
}));
```

:::tip
`httpResource()` is for **reading**. Don't use it for POST/PUT/DELETE — use `HttpClient` methods for those.
:::

## Using `HttpClient` directly

Put HTTP calls in a **service** so components stay simple and the code is reusable and testable:

```ts title="post-api.ts"
import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export type NewPost = Omit<Post, 'id'>;

@Service()
export class PostApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://jsonplaceholder.typicode.com/posts';

  list(userId?: number): Observable<Post[]> {
    const params = userId ? new HttpParams().set('userId', userId) : undefined;
    return this.http.get<Post[]>(this.baseUrl, { params });
  }

  get(id: number) {
    return this.http.get<Post>(`${this.baseUrl}/${id}`);
  }

  create(post: NewPost) {
    return this.http.post<Post>(this.baseUrl, post);
  }

  update(post: Post) {
    return this.http.put<Post>(`${this.baseUrl}/${post.id}`, post);
  }

  rename(id: number, title: string) {
    return this.http.patch<Post>(`${this.baseUrl}/${id}`, { title });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

- `get<T>()` tells TypeScript the shape of the JSON. (It doesn't check it at runtime — use the `parse` option of `httpResource` with a schema library if you need that.)
- Pass query parameters with `params` (an object or `HttpParams`) and headers with `headers`.
- Other useful options: `responseType: 'text' | 'blob' | 'arraybuffer'`, `observe: 'response'` (full response with status and headers), `timeout: 5000` (ms).

:::caution[Observables are lazy]
`HttpClient` methods return **cold Observables**: *nothing is sent until you subscribe* (or convert with `toSignal()` / `firstValueFrom()`). Each subscription sends a new request.
:::

### Turning a request into a signal with `toSignal()`

```ts title="post-list.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PostApi } from './post-api';

@Component({
  selector: 'app-post-list',
  template: `
    @for (post of posts(); track post.id) {
      <article>
        <h3>{{ post.title }}</h3>
        <p>{{ post.body }}</p>
      </article>
    } @empty {
      <p>Loading…</p>
    }
  `,
})
export class PostList {
  private readonly api = inject(PostApi);
  protected readonly posts = toSignal(this.api.list(), { initialValue: [] });
}
```

`toSignal()` subscribes for you and unsubscribes when the component is destroyed.

### Sending data (POST, PUT, PATCH, DELETE)

For actions triggered by the user, subscribe (or `await firstValueFrom(...)`) and store the result in signals:

```ts title="new-post.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PostApi } from './post-api';

@Component({
  selector: 'app-new-post',
  template: `
    <input #title placeholder="Title" />
    <button type="button" [disabled]="saving()" (click)="save(title.value)">
      {{ saving() ? 'Saving…' : 'Publish' }}
    </button>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (created(); as post) {
      <p>Created post #{{ post.id }}: {{ post.title }}</p>
    }
  `,
})
export class NewPost {
  private readonly api = inject(PostApi);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly created = signal<{ id: number; title: string } | null>(null);

  protected save(title: string) {
    this.saving.set(true);
    this.error.set(null);

    this.api.create({ userId: 1, title, body: '…' }).subscribe({
      next: (post) => {
        this.created.set(post);
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Could not save (status ${err.status})`);
        this.saving.set(false);
      },
    });
  }
}
```

After a write, refresh any `httpResource` that shows the same data with `.reload()`, or update it locally with `.update(...)`.

## Handling errors

Every failure arrives as an **`HttpErrorResponse`**:

| `status` | Meaning |
|---|---|
| `0` | Network error, CORS problem, or timeout — the server didn't answer |
| `400`–`499` | Client error (bad input, `401` not logged in, `403` forbidden, `404` not found) |
| `500`–`599` | Server error |

Handle errors where you can do something useful:

- **In the template** with `httpResource` → check `resource.error()`.
- **In a service** with RxJS operators:

```ts title="safe-post-api.ts"
import { Service, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, throwError } from 'rxjs';
import { Post } from './post-api';

@Service()
export class SafePostApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts').pipe(
      retry(2),                                    // retry flaky network failures twice
      catchError((err: HttpErrorResponse) => {
        const message =
          err.status === 0 ? 'Network error — are you offline?' : `Server returned ${err.status}`;
        return throwError(() => new Error(message));
      }),
    );
  }
}
```

- **Globally** with an interceptor (see below) — e.g. redirect to login on `401`.

## Interceptors

An **interceptor** is a function that sees **every** request (and its response). Use it for cross-cutting concerns: auth headers, logging, error handling, loading indicators.

```bash
ng generate interceptor auth
```

### Adding an auth header

```ts title="auth-interceptor.ts"
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthToken } from './auth-token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthToken).value();
  if (!token) {
    return next(req);
  }
  // Requests are immutable: clone them to change them
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authReq);
};
```

```ts title="auth-token.ts"
import { Service, signal } from '@angular/core';

@Service()
export class AuthToken {
  readonly value = signal<string | null>(null);
}
```

### Logging and error handling

```ts title="logging-interceptor.ts"
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
    finalize(() => console.log(`${req.method} ${req.urlWithParams} took ${Math.round(performance.now() - started)} ms`)),
  );
};
```

Register interceptors in order — requests pass through them **first to last**, responses come back last to first:

```ts
provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]));
```

- Interceptors run in an injection context, so `inject()` works inside them.
- Interceptors also apply to `httpResource()` requests (it uses `HttpClient` under the hood).
- Prefer these **functional** interceptors. Old class-based interceptors (`HttpInterceptor` + `withInterceptorsFromDi()`) still work but are no longer recommended.

## Practical example: searchable post browser

```ts title="post-browser.ts"
import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Post } from './post-api';

@Component({
  selector: 'app-post-browser',
  template: `
    <label>
      Author
      <select (change)="userId.set(+select.value)" #select>
        @for (id of authorIds; track id) {
          <option [value]="id">User {{ id }}</option>
        }
      </select>
    </label>
    <input #search placeholder="Filter titles…" (input)="filter.set(search.value)" />

    @if (posts.isLoading()) {
      <p>Loading…</p>
    }
    @if (posts.error()) {
      <p>Something went wrong. <button type="button" (click)="posts.reload()">Retry</button></p>
    }

    <p>{{ visible().length }} post(s)</p>
    <ul>
      @for (post of visible(); track post.id) {
        <li>{{ post.title }}</li>
      }
    </ul>
  `,
})
export class PostBrowser {
  protected readonly authorIds = [1, 2, 3, 4, 5];
  protected readonly userId = signal(1);
  protected readonly filter = signal('');

  // Re-fetches whenever userId changes
  protected readonly posts = httpResource<Post[]>(
    () => ({
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: { userId: this.userId() },
    }),
    { defaultValue: [] },
  );

  // Filters locally whenever posts or filter change — no extra requests
  protected readonly visible = computed(() => {
    const term = this.filter().toLowerCase();
    return this.posts.hasValue()
      ? this.posts.value().filter((p) => p.title.toLowerCase().includes(term))
      : [];
  });
}
```

## Testing HTTP code

Use `provideHttpClient()` together with `provideHttpClientTesting()` and `HttpTestingController` to fake the server in unit tests — no real network calls. See [Service Testing](/testing/service-testing/).

## Common mistakes

| Mistake | Fix |
|---|---|
| Nothing happens when calling `http.get()` | Observables are lazy — subscribe, use `toSignal()`, or use `httpResource()`. |
| Adding `withFetch()` | Not needed in v22 (fetch is the default) — it's deprecated. |
| Importing `HttpClientModule` | Deprecated: use `provideHttpClient()` (only needed for configuration). |
| `value()` throws an error | The resource is in the error state — check `hasValue()` first. |
| Using `httpResource` for POST/DELETE | Use `HttpClient` methods for writes. |
| Mutating `req` in an interceptor | Requests are immutable: `req.clone({...})`. |
| CORS error / status `0` | The server must allow your origin (configure CORS on the server, or use the dev-server proxy). |

## Best practices

- Wrap `HttpClient` calls in `@Service()` classes; keep components focused on the UI.
- Use `httpResource()` for reactive reads and always render loading and error states.
- Type every request (`get<User[]>`), and keep API URLs in configuration (e.g. an `InjectionToken`, see [Services](/beginner/services/#configuration-values-with-injectiontoken)).
- Use functional interceptors for auth, logging and global error handling.
- Never put secrets (API keys with write access) in front-end code.

## Key takeaways

- `HttpClient` works without setup; `provideHttpClient(withInterceptors([...]))` configures it. Fetch is the default since v22 and `withFetch()` is deprecated.
- `httpResource()` = signal-based GET with `value()`, `isLoading()`, `error()`, `reload()`.
- Use `HttpClient` methods for writes; they return lazy Observables.
- Errors are `HttpErrorResponse`s; handle them in the template, the service or an interceptor.
- Interceptors are plain functions: `(req, next) => next(req.clone(...))`.

## Next steps

1. [httpResource API](/modern/http-resource-api/) — parsing, response types, progress and more
2. [Resource API](/modern/resource-api/) — `resource()` and `rxResource()` for any async data
3. [RxJS in Angular](/rxjs/angular-patterns/) — combine, debounce and cancel requests
4. [Service Testing](/testing/service-testing/) — test HTTP services with `HttpTestingController`
