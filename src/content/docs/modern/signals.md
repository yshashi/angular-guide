---
title: Angular Signals 🔄
description: Learn Angular signals in v22 — signal(), set/update, computed, reactive contexts, untracked, equality, asReadonly and how signals drive change detection.
sidebar:
  order: 2
---

A **signal** is a box around a value that tells Angular when the value changes. You read it by calling it like a function, and Angular remembers *who* read it. When you change the value, only the templates, `computed()`s and effects that actually read it are updated. Signals are the foundation of modern Angular: inputs, queries, forms, resources and zoneless change detection are all built on them.

## What you'll learn

- Create, read and update writable signals with `signal()`, `set()` and `update()`
- Derive values with `computed()` and expose read-only state with `asReadonly()`
- Understand reactive contexts and when Angular tracks a read
- Read without tracking using `untracked()`
- Control change notifications with custom equality functions
- Avoid the common mistakes (mutating objects, async reads, effects for derived state)

## Your first signal

```ts title="counter.ts"
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button type="button" (click)="increment()">+1</button>
    <button type="button" (click)="reset()">Reset</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly double = computed(() => this.count() * 2);

  protected increment() {
    this.count.update((c) => c + 1);
  }

  protected reset() {
    this.count.set(0);
  }
}
```

Three things to notice:

1. **Read** a signal by calling it: `count()` (in the template *and* in TypeScript).
2. **Write** with `set(newValue)` or `update(old => new)`.
3. The template updates automatically. The component is OnPush (the default since v22) and there is no zone.js — the signal tells Angular exactly which view to refresh.

## Writable signals

`signal(initialValue)` returns a `WritableSignal<T>`. The type is inferred, or you can pass it explicitly:

```ts
import { signal, WritableSignal } from '@angular/core';

const count = signal(0);                          // WritableSignal<number>
const name = signal<string | null>(null);         // explicit type
const tags: WritableSignal<string[]> = signal([]);

console.log(count());      // read: 0
count.set(3);              // replace the value
count.update((c) => c + 1); // compute from the previous value → 4
```

| Method | Use it when |
|---|---|
| `set(value)` | You know the new value (`name.set('Ada')`) |
| `update(fn)` | The new value depends on the old one (`count.update(c => c + 1)`) |
| `asReadonly()` | You want to hand out a read-only view (see below) |

### Objects and arrays: always create a new value

Signals compare values with `Object.is()` by default. If you mutate an object in place, the reference doesn't change, so **nothing updates**. Always produce a new object or array:

```ts title="todo-list.ts"
import { Component, computed, signal } from '@angular/core';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

@Component({
  selector: 'app-todo-list',
  template: `
    <ul>
      @for (todo of todos(); track todo.id) {
        <li>
          <label>
            <input type="checkbox" [checked]="todo.done" (change)="toggle(todo.id)" />
            {{ todo.title }}
          </label>
        </li>
      }
    </ul>
    <p>{{ remaining() }} left</p>
    <button type="button" (click)="add('New task')">Add</button>
  `,
})
export class TodoList {
  protected readonly todos = signal<Todo[]>([{ id: 1, title: 'Learn signals', done: false }]);
  protected readonly remaining = computed(() => this.todos().filter((t) => !t.done).length);

  protected add(title: string) {
    this.todos.update((list) => [...list, { id: Date.now(), title, done: false }]);
  }

  protected toggle(id: number) {
    this.todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
}
```

```ts
// ❌ Mutation: same array reference, no update is triggered
this.todos().push(newTodo);

// ✅ New array
this.todos.update((list) => [...list, newTodo]);
```

:::note
Older previews had a `mutate()` method. It was removed before signals became stable — use `update()` with an immutable change.
:::

## Computed signals

`computed()` creates a **read-only** signal derived from other signals. It is lazy (runs only when read) and memoized (re-runs only when a dependency changed):

```ts
import { computed, signal } from '@angular/core';

const price = signal(100);
const quantity = signal(2);
const total = computed(() => price() * quantity()); // Signal<number>

console.log(total()); // 200
quantity.set(3);
console.log(total()); // 300
```

Use `computed()` for anything you can *calculate* from other state: filtered lists, totals, flags like `isValid`. It has its own page: [Computed Signals](/modern/computed-signals/).

## Exposing read-only state with `asReadonly()`

A common pattern is a service that owns writable state but only lets others read it:

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';

@Service()
export class CartStore {
  private readonly _items = signal<string[]>([]);

  readonly items = this._items.asReadonly(); // Signal<string[]>
  readonly count = computed(() => this._items().length);

  add(item: string) {
    this._items.update((items) => [...items, item]);
  }
}
```

```ts title="cart-badge.ts"
import { Component, inject } from '@angular/core';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-badge',
  template: `<span>🛒 {{ cart.count() }}</span>`,
})
export class CartBadge {
  protected readonly cart = inject(CartStore);
}
```

Consumers can call `cart.items()` but not `cart.items.set(...)` — that is a compile error. The read-only signal always reflects the latest value of the original.

:::caution
`asReadonly()` prevents `set()`/`update()`, but it does **not** deep-freeze the value. Code could still mutate the array it reads. Treat signal values as immutable.
:::

## Signals you already use

Many Angular APIs return signals, so everything on this page applies to them too:

| API | Returns |
|---|---|
| `input()`, `input.required()` | `InputSignal<T>` (read-only) |
| `model()` | `ModelSignal<T>` (writable, two-way bindable) |
| `viewChild()`, `contentChild()`, `viewChildren()`, `contentChildren()` | read-only signals |
| `computed()` | `Signal<T>` |
| `linkedSignal()` | `WritableSignal<T>` — see [Linked Signals](/modern/linked-signals/) |
| `resource()`, `httpResource()` | `value`, `status`, `error`, `isLoading` signals — see [Resource API](/modern/resource-api/) |
| `toSignal(observable$)` | `Signal<T>` from RxJS — see [RxJS & Angular patterns](/rxjs/angular-patterns/) |
| `form()` (Signal Forms) | field state signals — see [Signal Forms](/modern/signal-forms/) |

## Reactive contexts: when are reads tracked?

A **reactive context** is code that Angular watches. Any signal you read synchronously inside it becomes a dependency. Angular creates a reactive context when it:

- renders a component template (including `host` bindings),
- evaluates a `computed()` or `linkedSignal()`,
- runs an `effect()` or `afterRenderEffect()`,
- evaluates a resource's `params` function.

Outside those places (event handlers, `ngOnInit`, plain methods called from a click) reading a signal just returns its value — nothing is tracked.

Dependencies are **dynamic**: only signals actually read during the *last* run are tracked.

```ts
const showCount = signal(false);
const count = signal(0);

const message = computed(() => (showCount() ? `The count is ${count()}` : 'Nothing to see here'));
// While showCount() is false, changing count() does NOT recompute `message`.
```

### Reads after `await` are not tracked

Tracking only works for synchronous code. Read your signals **before** the first `await`:

```ts
// ❌ theme() is read after await → not a dependency
effect(async () => {
  const data = await fetchUserData();
  console.log(data.name, theme());
});

// ✅ read first, then await
effect(async () => {
  const currentTheme = theme();
  const data = await fetchUserData();
  console.log(data.name, currentTheme);
});
```

### Reading without tracking: `untracked()`

Sometimes you need a signal's current value inside a reactive context but don't want changes to it to re-run your code. Wrap the read with `untracked()`:

```ts
import { effect, signal, untracked } from '@angular/core';

const currentUser = signal('ada');
const counter = signal(0);

// Re-runs only when currentUser changes, not when counter changes
effect(() => {
  console.log(`User: ${currentUser()}, counter: ${untracked(counter)}`);
});

// Also useful to call code that might read signals internally
effect(() => {
  const user = currentUser();
  untracked(() => {
    logger.log(`User changed to ${user}`); // signal reads inside log() aren't tracked
  });
});
```

If you write a helper that must never run in a reactive context (for example because it subscribes to something), guard it with `assertNotInReactiveContext(myHelper)`; it throws a clear error if someone calls it from a `computed` or template.

## Equality functions

By default a signal only notifies when the new value is not `Object.is()`-equal to the old one. Setting the same primitive twice does nothing:

```ts
const n = signal(1);
n.set(1); // no notification
```

You can supply your own `equal` function to `signal()`, `computed()` and `linkedSignal()`:

```ts
interface User {
  id: number;
  name: string;
}

// Treat users with the same id as "the same" value
const user = signal<User>({ id: 1, name: 'Ada' }, { equal: (a, b) => a.id === b.id });

user.set({ id: 1, name: 'Ada Lovelace' }); // equal → no update!
```

:::caution
A custom `equal` that returns `true` means the new value is **ignored for notification purposes** — dependents keep showing the old one. Only use it when "equal" really means "nothing visible changed" (for example a deep-equal check on arrays).
:::

## Debugging helpers

```ts
import { isSignal, isWritableSignal, signal, computed } from '@angular/core';

const clicks = signal(0, { debugName: 'clicks' }); // name shown in Angular DevTools
const doubled = computed(() => clicks() * 2, { debugName: 'doubled' });

isSignal(clicks);          // true
isWritableSignal(doubled); // false
```

Angular DevTools can display the **signal graph** of a component — which signals, computeds and effects depend on each other. See [Angular DevTools](/tools/devtools/).

## Debouncing a signal (experimental)

`debounced(source, ms)` turns a fast-changing signal (like a search box) into a **resource** whose value only settles after the source stops changing:

```ts title="search.ts"
import { Component, debounced, resource, signal } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `
    <input (input)="query.set($event.target.value)" />
    @if (results.isLoading()) {
      <p>Searching…</p>
    }
    <ul>
      @for (item of results.value(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  `,
})
export class Search {
  protected readonly query = signal('');
  protected readonly debouncedQuery = debounced(this.query, 300);

  protected readonly results = resource({
    params: () => this.debouncedQuery.value(),
    loader: ({ params }) => fetchResults(params),
    defaultValue: [],
  });
}
```

While the timer is running, `debouncedQuery.status()` is `'loading'` and `value()` keeps the previous settled value. It must be created in an injection context (or given `{ injector }`), and Angular cancels the timer automatically when the component is destroyed.

:::caution[Experimental]
`debounced()` was added in v22.0 as **experimental** — the API may change in a minor release. For forms, use the stable `debounce()` rule from Signal Forms instead.
:::

## Signals and change detection

When a template reads a signal, Angular registers that component's view as a consumer. When the signal changes, Angular marks **that component** for refresh and schedules change detection — components whose signals didn't change are skipped. That is why signals work so well with:

- **OnPush** components (the default since v22) — no need for `markForCheck()`.
- **Zoneless** apps (the default since v21) — signals are one of the notifications Angular listens to. See [Zoneless Angular](/modern/zoneless/).

## Common mistakes

| Mistake | Why it's a problem | Fix |
|---|---|---|
| `{{ count }}` instead of `{{ count() }}` | Prints the function, not the value | Call the signal |
| `this.items().push(x)` | Mutation doesn't change the reference → no update | `this.items.update(l => [...l, x])` |
| Copying one signal into another with `effect()` | Extra change detection cycles, glitches, loops | Use `computed()` or `linkedSignal()` |
| Reading signals after `await` in an effect | Not tracked | Read them first |
| Using a custom `equal` that's too loose | Real changes are swallowed | Keep default equality unless you're sure |
| Creating signals inside a template expression or getter | New signal every check | Create signals once as class fields |

## Version notes

- Signals (`signal`, `computed`) became stable in v17; `effect`, `linkedSignal` and `toSignal` in v20.
- Resources (`resource`, `rxResource`, `httpResource`) became stable in v22.
- `debounced()` and `resourceFromSnapshots()` are experimental in v22.

## Key takeaways

- `signal()` holds state; call it to read, `set()`/`update()` to write.
- `computed()` derives state lazily and caches it; prefer it over effects.
- Only synchronous reads inside reactive contexts are tracked; use `untracked()` to opt out.
- Treat values as immutable — new objects/arrays on every change.
- Expose state with `asReadonly()` from services.

## Next steps

- [Computed Signals](/modern/computed-signals/) — derived state in depth
- [Effects](/modern/effects/) — side effects, and when *not* to use them
- [Linked Signals](/modern/linked-signals/) — writable state that resets from a source
- [Testing Signals](/testing/testing-signals/)
