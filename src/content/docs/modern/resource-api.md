---
title: Resource API 🧪
description: Load async data with resource() and rxResource() in Angular 22 — params, loader, status, chaining, streaming, SSR caching and snapshots. Stable since v22.
sidebar:
  order: 6
---

Signals are synchronous, but data usually arrives asynchronously — from a server, IndexedDB, a Web Worker. A **resource** connects the two worlds: you describe *which* data you need with signals, and Angular loads it, tracks the loading state, cancels outdated requests, and exposes the result as signals you can read synchronously in templates and `computed()`s. Resources are **stable in Angular 22**.

## What you'll learn

- Create a resource with `params` and `loader`
- Read `value`, `hasValue`, `status`, `error` and `isLoading`
- Make a resource idle, reload it, and set values locally
- Cancel requests with `AbortSignal`
- Chain resources, stream values, and use `rxResource()` with Observables
- Cache results across SSR and hydration, and compose resources with snapshots

:::tip
Fetching JSON over HTTP? Use [`httpResource()`](/modern/http-resource-api/) — it's a resource built on `HttpClient` (interceptors included). This page explains the general `resource()` that everything else builds on.
:::

## Your first resource

```ts title="user-profile.ts"
import { Component, computed, input, resource } from '@angular/core';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-profile',
  template: `
    @switch (user.status()) {
      @case ('loading') {
        <p>Loading…</p>
      }
      @case ('error') {
        <p>Could not load user.</p>
        <button type="button" (click)="user.reload()">Retry</button>
      }
      @default {
        @if (user.hasValue()) {
          <h2>{{ user.value().name }}</h2>
        }
      }
    }
  `,
})
export class UserProfile {
  readonly userId = input.required<number>();

  protected readonly user = resource({
    // 1. Reactive params: re-run whenever userId() changes
    params: () => ({ id: this.userId() }),

    // 2. Async loader: receives the params and an AbortSignal
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(`/api/users/${params.id}`, { signal: abortSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as User;
    },
  });

  protected readonly firstName = computed(() =>
    this.user.hasValue() ? this.user.value().name.split(' ')[0] : '',
  );
}
```

How it works:

1. `params` is a reactive function (like `computed`). Every time its result changes, the resource calls `loader`.
2. If a previous load is still running, it is **aborted** (the `abortSignal` fires) and only the newest result is kept.
3. The result is exposed through signals — no subscriptions, no `async` pipe.

## Resource options

| Option | Description |
|---|---|
| `params` | Reactive function returning the request parameters. Return `undefined` to make the resource idle. |
| `loader` | `async ({ params, abortSignal, previous }) => value` — loads once per params value. |
| `stream` | Alternative to `loader` for values that keep arriving (see [Streaming](#streaming-resources)). |
| `defaultValue` | Value used instead of `undefined` while idle/loading. |
| `equal` | Custom equality for the loaded value. |
| `id` | Cache key for SSR → hydration transfer (see [SSR caching](#caching-across-ssr-and-hydration)). |
| `injector` | Create the resource outside an injection context. |
| `debugName` | Name shown in Angular DevTools. |

The loader receives:

| Property | Meaning |
|---|---|
| `params` | The current value of `params` (never `undefined`) |
| `abortSignal` | An `AbortSignal` that fires when the request becomes outdated or the resource is destroyed |
| `previous.status` | The resource status before this load started |

## Reading a resource

| Signal / method | What it gives you |
|---|---|
| `value()` | The latest value (or `defaultValue`/`undefined`). **Throws** in the `'error'` state. |
| `hasValue()` | `true` if there's a usable value. Also a type guard that removes `undefined`. |
| `error()` | The last error, or `undefined` |
| `isLoading()` | `true` while loading or reloading |
| `status()` | One of the statuses below |
| `snapshot()` | `{ status, value }` or `{ status: 'error', error }` in one object |

### Statuses

| `status()` | `value()` | Meaning |
|---|---|---|
| `'idle'` | default value | No valid params; the loader hasn't run |
| `'loading'` | default value | Loading because `params` changed |
| `'reloading'` | previous value | Loading because you called `reload()` |
| `'resolved'` | loaded value | Loader finished successfully |
| `'error'` | **throws** | The loader threw / rejected |
| `'local'` | the value you set | You called `set()` / `update()` |

:::caution[Guard `value()` with `hasValue()`]
Reading `value()` in the error state throws. In templates and `computed()`s, check `hasValue()` first (as in the examples). This also narrows the type from `User | undefined` to `User`.
:::

## Making a resource idle

Return `undefined` from `params` and the loader doesn't run; the status becomes `'idle'`:

```ts
protected readonly query = signal('');

protected readonly results = resource({
  params: () => (this.query().length >= 2 ? this.query() : undefined),
  loader: async ({ params: q }) => {
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
    return (await res.json()) as User[];
  },
  defaultValue: [], // value() is User[], never undefined
});
```

### Special params statuses (v22)

Since v22 you can also **throw** a status from `params` to put the resource into that state without running the loader:

```ts
import { resource, ResourceParamsStatus, signal } from '@angular/core';

protected readonly ready = signal(false);
protected readonly query = signal('');

protected readonly data = resource({
  params: () => {
    if (!this.ready()) throw ResourceParamsStatus.LOADING; // show as loading
    if (!this.query()) throw ResourceParamsStatus.IDLE;    // nothing to load
    return this.query();
  },
  loader: async ({ params }) => params.toUpperCase(),
});
```

| Thrown value | Resulting status |
|---|---|
| `ResourceParamsStatus.IDLE` | `'idle'` |
| `ResourceParamsStatus.LOADING` | `'loading'` |

This is what the `chain()` helper below uses under the hood.

## Reload, set and destroy

```ts
this.user.reload();                          // re-run the loader with the same params ('reloading')
this.todos.set(['a', 'b']);                  // set locally ('local')
this.todos.update((list) => [...list, 'c']); // same, from the previous value
this.user.destroy();                         // cancel and stop reacting (automatic on component destroy)
```

`set()`/`update()` are handy for **optimistic updates**: update the UI immediately, then send the change with `HttpClient`, and `reload()` if it fails.

## Chaining resources

When one request needs the result of another, use the `chain` helper passed to `params`:

```ts
protected readonly user = resource({
  params: () => this.userId(),
  loader: ({ params }) => fetchUser(params),
});

protected readonly company = resource({
  params: ({ chain }) => chain(this.user)?.companyId,
  loader: ({ params: companyId }) => fetchCompany(companyId),
});
```

`chain(this.user)` returns the user's value only when it is `'resolved'` or `'local'`. Otherwise it **copies the upstream status**:

| `user` status | `company` becomes |
|---|---|
| idle | idle |
| loading / reloading | loading (loader doesn't run) |
| error | error (`error()` is a `ResourceDependencyError`) |
| resolved / local | runs with `companyId` |

:::tip
Return the chained value directly (`chain(this.user)?.companyId`), not wrapped in an object. `{ companyId: undefined }` is a defined value, so the loader would run; a bare `undefined` correctly makes the resource idle.
:::

If you just need to *derive* something synchronously from a resource, use `computed()` instead of a second resource.

## Streaming resources

For data that keeps arriving (WebSockets, Server-Sent Events, Firestore listeners), use `stream` instead of `loader`. It returns a signal of `{ value }` or `{ error }` items:

```ts title="ticker.ts"
import { Component, input, resource, signal } from '@angular/core';

@Component({
  selector: 'app-ticker',
  template: `{{ price.value() }}`,
})
export class Ticker {
  readonly symbol = input('NG');

  protected readonly price = resource({
    params: () => this.symbol(),
    stream: async ({ params, abortSignal }) => {
      const value = signal<{ value: number } | { error: Error }>({ value: 0 });
      const socket = new WebSocket(`wss://example.com/prices/${params}`);
      socket.onmessage = (e) => value.set({ value: Number(e.data) });
      socket.onerror = () => value.set({ error: new Error('Connection lost') });
      abortSignal.addEventListener('abort', () => socket.close());
      return value;
    },
  });
}
```

Since v22 the stream function may also return the signal **synchronously** (no `async`/Promise needed): `resource({ stream: () => updates })`.

## `rxResource()` for Observables

If your data comes from an Observable (for example an existing service using `HttpClient`), use `rxResource` from `@angular/core/rxjs-interop`. It has the same options, but `stream` returns an Observable:

```ts title="rx-user.ts"
import { Component, Service, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Service()
export class UserApi {
  private readonly http = inject(HttpClient);

  getUser(id: number) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}

@Component({ selector: 'app-rx-user', template: `…` })
export class RxUser {
  private readonly api = inject(UserApi);
  readonly userId = input.required<number>();

  protected readonly user = rxResource({
    params: () => this.userId(),
    stream: ({ params }) => this.api.getUser(params),
  });
}
```

Every emission updates `value()`. The Observable must emit at least once (or error) before it completes — completing without a value throws error `NG0991`.

## Caching across SSR and hydration

With server-side rendering, the loader runs on the server to produce HTML, and normally runs **again** in the browser during hydration. Give the resource an `id` to transfer the server result instead (new in v22):

```ts
protected readonly user = resource({
  params: () => this.userId(),
  loader: ({ params }) => fetchUser(params),
  id: 'user-profile', // unique in the app, identical on server and client
});
```

The browser starts in the `'resolved'` state with the server's value.

:::danger
The cached value is serialized into the page HTML. Don't set `id` on resources that load **user-specific or private data** if the rendered HTML can be cached or shared between users.
:::

`httpResource()` uses the HTTP transfer cache instead — see [HttpResource API](/modern/http-resource-api/#ssr-and-the-transfer-cache).

## Snapshots and composition

Every resource has a `snapshot` signal combining status and value:

```ts
const snap = this.user.snapshot();
if (snap.status === 'error') {
  console.error(snap.error);
} else {
  console.log(snap.status, snap.value);
}
```

With `resourceFromSnapshots()` you can build a **new** resource from a signal of snapshots — for example a wrapper that keeps showing the previous value while the next one loads:

```ts
import { linkedSignal, Resource, resourceFromSnapshots, ResourceSnapshot } from '@angular/core';

export function withPreviousValue<T>(input: Resource<T>): Resource<T> {
  const derived = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: input.snapshot,
    computation: (snap, previous) => {
      if (snap.status === 'loading' && previous && previous.value.status !== 'error') {
        return { status: 'loading' as const, value: previous.value.value };
      }
      return snap;
    },
  });
  return resourceFromSnapshots(derived);
}

// usage
protected readonly user = withPreviousValue(httpResource<User>(() => `/api/users/${this.userId()}`));
```

:::caution[Experimental]
`resourceFromSnapshots()` is **experimental** in v22. The `snapshot` property itself is stable.
:::

## Where resources fit

| Need | Tool |
|---|---|
| GET JSON/text/blob over HTTP | `httpResource()` |
| Any Promise-based async read (fetch, IndexedDB, worker) | `resource({ loader })` |
| Observable-based read | `rxResource({ stream })` |
| Continuous updates | `resource({ stream })` |
| **Writes** (POST/PUT/DELETE) | `HttpClient` directly, then `reload()` or `set()` |
| Debounced input → resource | `debounced()` (experimental) — see [Signals](/modern/signals/#debouncing-a-signal-experimental) |

## Common mistakes

| Mistake | Fix |
|---|---|
| Reading `value()` without checking `hasValue()` | It throws in the error state — guard it |
| Using a resource for mutations | Resources are for reading; call `HttpClient` for writes |
| Ignoring `abortSignal` in `fetch` | Pass it so outdated requests are really cancelled |
| Wrapping chained params in an object | Return the value directly so `undefined` → idle |
| Reading signals inside `loader` expecting them to be tracked | Only `params` is reactive — put every dependency in `params` |
| Creating resources in methods without an injector | Create them as fields, or pass `{ injector }` |

:::note[Before Angular 22]
Resources were **experimental** before v22. In v19 the options were called `request` and `loader` (also for `rxResource`); v20 renamed them to `params` and `loader` (`stream` for `rxResource`). v22 made the API stable and added `chain`, `ResourceParamsStatus`, SSR `id` caching and synchronous streams.
:::

## Key takeaways

- `resource()` turns async reads into signals: `value`, `hasValue`, `status`, `error`, `isLoading`.
- `params` is reactive; changing it aborts the old load and starts a new one.
- `undefined` params (or `ResourceParamsStatus.IDLE`) → idle.
- `chain()` links dependent resources and propagates their status.
- Use `rxResource` for Observables, `stream` for live data, `id` for SSR caching.

## Next steps

- [HttpResource API](/modern/http-resource-api/) — the HTTP flavour you'll use most
- [Linked Signals](/modern/linked-signals/)
- [Signal Forms async validation](/modern/signal-forms/#async-validation)
