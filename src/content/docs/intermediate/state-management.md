---
title: State Management 🗃️
description: Manage state in Angular 22 with signals, signal-based services, resources and NgRx SignalStore — plus when you actually need a library.
sidebar:
  order: 7
---

**State** is the data your app remembers: the logged-in user, items in a cart, which tab is open, the list loaded from the server. *State management* is deciding **where each piece lives and who may change it**. With signals, Angular 22 gives you everything you need for most apps out of the box — this page shows the built-in patterns first, then NgRx SignalStore for when you want more structure.

## What you'll learn

- The different kinds of state and where each one belongs
- Build a signal-based store service (private writable, public read-only, `computed`, methods)
- Scope stores to a component or route, and persist state
- Treat server data with resources
- Use NgRx SignalStore (`signalStore`, `withState`, `withComputed`, `withMethods`, `rxMethod`, entities)
- Decide when a library is worth it

## Kinds of state

| Kind | Example | Where it lives |
|---|---|---|
| **Local UI state** | Is the dropdown open? Current input text | `signal()` in the component |
| **Shared state** | Cart, current user, theme | A service with signals (`@Service()`), or a SignalStore |
| **Feature/scoped state** | Multi-step wizard, an editor page | Service provided on the component or route |
| **Server state** | Products from an API | `httpResource()` / `resource()` (often inside a store) |
| **URL state** | Current page, filters, selected id | The router (params, query params) |
| **Form state** | Field values, validity, touched | Signal Forms / Reactive Forms |

**Start local and lift state up only when two or more distant components need it.** Keep state that should survive a refresh or be shareable as a link in the URL.

## Local state: signals in the component

```ts title="counter.ts"
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button type="button" (click)="count.update((c) => c - 1)">−</button>
    {{ count() }} (double: {{ double() }})
    <button type="button" (click)="count.update((c) => c + 1)">+</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly double = computed(() => this.count() * 2);
}
```

If only this component (and its children via inputs) uses the state, stop here.

## Shared state: a signal store service

The most useful pattern in modern Angular is a small **store service**:

1. **Private writable** signals hold the state.
2. **Public read-only** signals (`asReadonly()`) and `computed()` values expose it.
3. **Methods** are the *only* way to change it.

```ts title="todo-store.ts"
import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export type Filter = 'all' | 'active' | 'done';

@Service()
export class TodoStore {
  private readonly http = inject(HttpClient);

  // 1. private, writable state
  private readonly _todos = signal<Todo[]>([]);
  private readonly _filter = signal<Filter>('all');

  // 2. public, read-only state
  readonly todos = this._todos.asReadonly();
  readonly filter = this._filter.asReadonly();

  // 3. derived state
  readonly visible = computed(() => {
    const todos = this._todos();
    switch (this._filter()) {
      case 'active':
        return todos.filter((t) => !t.done);
      case 'done':
        return todos.filter((t) => t.done);
      default:
        return todos;
    }
  });
  readonly remaining = computed(() => this._todos().filter((t) => !t.done).length);

  // 4. methods — the only way to change state
  setFilter(filter: Filter) {
    this._filter.set(filter);
  }

  add(title: string) {
    const todo: Todo = { id: Date.now(), title, done: false };
    this._todos.update((list) => [...list, todo]);
  }

  toggle(id: number) {
    this._todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  async remove(id: number) {
    const previous = this._todos();
    this._todos.update((list) => list.filter((t) => t.id !== id)); // optimistic update
    try {
      await firstValueFrom(this.http.delete(`/api/todos/${id}`));
    } catch {
      this._todos.set(previous); // roll back on failure
    }
  }
}
```

```ts title="todo-list.ts"
import { Component, inject } from '@angular/core';
import { TodoStore } from './todo-store';

@Component({
  selector: 'app-todo-list',
  template: `
    <input #title placeholder="What needs doing?"
           (keydown.enter)="store.add(title.value); title.value = ''" />
    @for (todo of store.visible(); track todo.id) {
      <label>
        <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
        {{ todo.title }}
      </label>
    }
    <p>{{ store.remaining() }} left</p>
    <button type="button" (click)="store.setFilter('active')">Active</button>
  `,
})
export class TodoList {
  protected readonly store = inject(TodoStore);
}
```

Why this works so well:

- **Encapsulation** — components can't put the store into an invalid state.
- **Fine-grained updates** — only templates that read a changed signal re-render, which is exactly what OnPush (the default since v22) wants.
- **Immutable updates** — always create new arrays/objects (`[...list, todo]`, `{ ...t, done }`). Mutating in place won't notify signals.

:::note[Angular 21 and earlier]
For Angular 21 and earlier, use `@Injectable({ providedIn: 'root' })`; `@Service()` is available starting in v22. In v22, choose `@Service()` for a straightforward root-provided service and `@Injectable()` when you need constructor injection or advanced provider configuration.
:::

## Server state: resources inside stores

Data that comes from a server has extra concerns: loading, errors, refetching when inputs change. Let a [resource](/modern/resource-api/) handle them:

```ts title="catalog-store.ts"
import { Service, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Service()
export class CatalogStore {
  readonly category = signal('books');

  // Refetches automatically when `category` changes
  readonly products = httpResource<Product[]>(() => `/api/products?category=${this.category()}`, {
    defaultValue: [],
  });

  readonly cheapest = computed(() =>
    this.products.hasValue()
      ? [...this.products.value()].sort((a, b) => a.price - b.price)[0]
      : undefined,
  );
}
```

Components read `store.products.value()`, `store.products.isLoading()` and `store.products.error()`, and call `store.category.set('games')` to switch. See [httpResource](/modern/http-resource-api/).

## Scoping a store to a component or route

A root service lives for the whole app. For state that should be **fresh each time** a page or widget opens (a wizard, an editor), provide the store on the component. Opt out of root provisioning with `autoProvided: false`:

```ts title="wizard.ts"
import { Component, Service, inject, signal } from '@angular/core';

@Service({ autoProvided: false })
export class WizardStore {
  readonly step = signal(1);
  readonly data = signal<{ name?: string; email?: string }>({});

  next() {
    this.step.update((s) => s + 1);
  }
}

@Component({
  selector: 'app-wizard',
  providers: [WizardStore], // new instance per <app-wizard>, destroyed with it
  template: `Step {{ store.step() }} <button type="button" (click)="store.next()">Next</button>`,
})
export class Wizard {
  protected readonly store = inject(WizardStore);
}
```

Child components of `<app-wizard>` that `inject(WizardStore)` get the same instance. You can also put stores in a route's `providers: [...]` to share them across a lazy-loaded feature.

## Persisting state

An `effect()` is a simple way to save state whenever it changes:

```ts title="settings-store.ts"
import { Service, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Service()
export class SettingsStore {
  readonly theme = signal<Theme>(
    (globalThis.localStorage?.getItem('theme') as Theme | null) ?? 'light',
  );

  constructor() {
    effect(() => globalThis.localStorage?.setItem('theme', this.theme()));
  }
}
```

`globalThis.localStorage?.` keeps the code safe during server-side rendering, where `localStorage` doesn't exist.

## NgRx SignalStore

[NgRx SignalStore](https://ngrx.io/guide/signals) (`@ngrx/signals`) is a small, signal-based library that gives the store-service pattern a standard, composable shape. It's a great choice for teams that want consistent conventions, entity helpers and reusable store "features".

```bash
npm install @ngrx/signals
```

### A basic store

```ts title="books-store.ts"
import { computed, inject } from '@angular/core';
import {
  patchState, signalStore, withComputed, withHooks, withMethods, withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import { Book, BooksApi } from './books-api';

type BooksState = {
  books: Book[];
  query: string;
  isLoading: boolean;
};

const initialState: BooksState = { books: [], query: '', isLoading: false };

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ books, query }) => ({
    count: computed(() => books().length),
    hasQuery: computed(() => query().length > 0),
  })),
  withMethods((store, api = inject(BooksApi)) => ({
    updateQuery(query: string) {
      patchState(store, { query });
    },
    // rxMethod: a method that accepts a value, a signal or an Observable
    searchByQuery: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          api.search(query).pipe(
            tap((books) => patchState(store, { books, isLoading: false })),
            catchError(() => {
              patchState(store, { isLoading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.searchByQuery(store.query); // re-runs whenever the query signal changes
    },
  }),
);
```

```ts title="books.ts"
import { Component, inject } from '@angular/core';
import { BooksStore } from './books-store';

@Component({
  selector: 'app-books',
  template: `
    <input #q [value]="store.query()" (input)="store.updateQuery(q.value)" />
    @if (store.isLoading()) {
      <p>Loading…</p>
    }
    <p>{{ store.count() }} books</p>
    @for (book of store.books(); track book.id) {
      <p>{{ book.title }}</p>
    }
  `,
})
export class Books {
  protected readonly store = inject(BooksStore);
}
```

How it fits together:

| Building block | Purpose |
|---|---|
| `signalStore(...features)` | Creates an injectable store class. `{ providedIn: 'root' }` makes it global; omit it and add the store to `providers` to scope it. |
| `withState(initial)` | State slices — each property becomes a read-only signal (`store.query()`) |
| `withComputed(...)` | Derived signals |
| `withMethods(...)` | Methods; use `patchState(store, partial)` to update state immutably |
| `withHooks({ onInit, onDestroy })` | Run code when the store is created/destroyed |
| `withProps(...)` | Extra (non-state) properties, e.g. injected services or resources |
| `rxMethod<T>(pipe(...))` | RxJS-powered method (debounce, switchMap, …) from `@ngrx/signals/rxjs-interop` |
| `signalStoreFeature(...)` | Bundle features into reusable building blocks |
| `getState(store)` / `watchState(store, fn)` | Snapshot / observe the whole state |

State is **protected** by default: only the store's own methods can call `patchState()` on it.

### Entities

`@ngrx/signals/entities` manages collections normalised by `id`:

```ts title="todos-store.ts"
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { Filter, Todo } from './todo';

export const TodosStore = signalStore(
  withEntities<Todo>(), // adds ids(), entityMap(), entities()
  withState({ filter: 'all' as Filter }),
  withComputed(({ entities, filter }) => ({
    visible: computed(() => {
      const f = filter();
      return f === 'all' ? entities() : entities().filter((t) => (f === 'done' ? t.done : !t.done));
    }),
  })),
  withMethods((store) => ({
    add(title: string) {
      const todo: Todo = { id: Date.now(), title, done: false };
      patchState(store, addEntity(todo));
    },
    toggle(id: number) {
      patchState(store, updateEntity({ id, changes: (t) => ({ done: !t.done }) }));
    },
    remove(id: number) {
      patchState(store, removeEntity(id));
    },
    setAll(todos: Todo[]) {
      patchState(store, setAllEntities(todos));
    },
  })),
);
```

```ts
@Component({
  selector: 'app-todos-page',
  providers: [TodosStore], // scoped to this page
  template: `…`,
})
export class TodosPage {
  protected readonly store = inject(TodosStore);
}
```

For small, component-local objects, `signalState({ sort: 'name', page: 1 })` gives you the same `patchState()` ergonomics without a full store.

## NgRx Store (Redux)

The classic [NgRx Store](https://ngrx.io/guide/store) (`@ngrx/store` + `@ngrx/effects`) uses the Redux pattern: components **dispatch actions**, pure **reducers** compute new state, **effects** handle side effects, and **selectors** read state (`store.selectSignal(selector)` returns a signal). Set it up with `provideStore()`, `provideState()` and `provideEffects()`.

It adds more code but gives you a strict, event-driven architecture and excellent time-travel debugging with Redux DevTools. Choose it for very large apps with many teams, or if you already use it. For new projects, start with signal services or SignalStore.

## Choosing an approach

| Situation | Recommendation |
|---|---|
| State used by one component | `signal()` / `computed()` in the component |
| A few shared values (user, theme, cart) | Signal store service with `@Service()` |
| Data from an API | `httpResource()` / `resource()`, optionally inside a store |
| Many stores, want conventions, entities, plugins | NgRx SignalStore |
| Huge app, strict event-driven architecture, existing NgRx | NgRx Store + Effects |

## Common mistakes

- **Making everything global** — most state is local or feature-scoped.
- **Exposing writable signals** from services — expose `asReadonly()` and methods instead.
- **Mutating arrays/objects** (`list.push(x)`) — signals won't notice; create new references.
- **Duplicating server data** into hand-written loading/error flags — use resources.
- **Copying derived values into state** — use `computed()` so they can never get out of sync.
- **Using `effect()` to copy one signal into another** — use `computed()` or `linkedSignal()`; keep effects for side effects (storage, logging, DOM).
- **Storing URL-worthy state only in memory** — put filters and ids in the URL so users can share and refresh.

## Key takeaways

- Signals + `computed()` + a service with private writable state and public read-only signals cover most apps.
- Use resources for server data, the router for URL state, and component/route providers for scoped state.
- NgRx SignalStore standardises the same ideas with `withState`, `withComputed`, `withMethods`, `rxMethod` and entities.
- Reach for NgRx Store only when you need its strict, action-based architecture.

## Next steps

- [Signals](/modern/signals/), [Computed Signals](/modern/computed-signals/) and [Linked Signals](/modern/linked-signals/)
- [Resource API](/modern/resource-api/) — async state
- [Component Communication](/intermediate/component-communication/) — when inputs/outputs are enough
- [Dependency Injection](/advanced/dependency-injection/) — provider scopes in depth
