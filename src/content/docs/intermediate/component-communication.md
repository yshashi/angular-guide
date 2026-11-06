---
title: Component Communication 💬
description: Share data between Angular components with input(), output(), model(), signal queries, template references and signal-based services.
sidebar:
  order: 2
---

Real apps are trees of components that constantly pass data around: a list hands a user to a card, the card reports a click back, a cart icon in the header needs to know what was added on a product page. This page shows every modern way components talk to each other in Angular 22 and, just as importantly, **when to use which**.

## What you'll learn

- Pass data down with `input()` (required inputs, transforms, aliases)
- Send events up with `output()`
- Build two-way bindable components with `model()`
- Call into children with template reference variables and `viewChild()` / `viewChildren()`
- Work with projected children using `contentChild()` / `contentChildren()` and injection
- Share state between unrelated components with a signal-based service

## Which pattern should I use?

| Situation | Pattern |
|---|---|
| Parent gives data to a child | `input()` |
| Child tells parent something happened | `output()` |
| Parent and child edit the same value (custom form controls, toggles, pickers) | `model()` + `[(value)]` |
| Parent calls a method on a child in its template | Template reference variable `#ref` |
| Parent's TypeScript needs a child instance or DOM element | `viewChild()` / `viewChildren()` |
| Component works with children projected by *its* parent (tabs, accordions) | `contentChildren()` + inject parent |
| Siblings or far-apart components share state | Service with signals |
| Data comes from the URL | Route params bound to inputs (see [Advanced Routing](/intermediate/advanced-routing/)) |

## Parent → child: `input()`

An input is a **read-only signal** whose value is set by the parent's template.

```ts title="user-card.ts"
import { Component, input, output } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-user-card',
  template: `
    <article [class.admin]="user().isAdmin">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      @if (showActions()) {
        <button type="button" (click)="edit.emit(user())">Edit</button>
        <button type="button" (click)="remove.emit(user().id)">Delete</button>
      }
    </article>
  `,
})
export class UserCard {
  readonly user = input.required<User>(); // parent MUST bind it
  readonly showActions = input(false);    // optional, defaults to false

  readonly edit = output<User>();
  readonly remove = output<number>();
}
```

```ts title="user-list.ts"
import { Component, signal } from '@angular/core';
import { User, UserCard } from './user-card';

@Component({
  selector: 'app-user-list',
  imports: [UserCard],
  template: `
    @for (user of users(); track user.id) {
      <app-user-card
        [user]="user"
        [showActions]="canEdit()"
        (edit)="selected.set($event)"
        (remove)="deleteUser($event)"
      />
    }
    @if (selected(); as user) {
      <p>Editing {{ user.name }}</p>
    }
  `,
})
export class UserList {
  protected readonly users = signal<User[]>([
    { id: 1, name: 'Ada', email: 'ada@example.com', isAdmin: true },
    { id: 2, name: 'Linus', email: 'linus@example.com', isAdmin: false },
  ]);
  protected readonly canEdit = signal(true);
  protected readonly selected = signal<User | null>(null);

  protected deleteUser(id: number) {
    this.users.update((list) => list.filter((u) => u.id !== id));
  }
}
```

Key points:

- Read an input by **calling it**: `user()`. Because inputs are signals you can use them in `computed()` and `effect()`.
- `input.required<T>()` makes the compiler report an error if the parent forgets the binding.
- Inputs are read-only inside the child — you can't call `.set()` on them.

### Transforms, aliases and derived values

```ts title="progress-bar.ts"
import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="bar" [class.done]="isComplete()" [style.width.%]="value()"></div>
    <span>{{ label() }} – {{ value() }}%</span>
  `,
  host: { '[class.compact]': 'compact()' },
})
export class ProgressBar {
  readonly value = input(0, { transform: clamp });                          // 150 → 100
  readonly label = input('Progress', { alias: 'progressLabel' });            // public name differs
  readonly compact = input(false, { transform: booleanAttribute });          // <x compact>
  readonly max = input(100, { transform: numberAttribute });                 // max="200" → 200

  protected readonly isComplete = computed(() => this.value() >= 100);
}
```

```html
<app-progress-bar [value]="progress()" progressLabel="Upload" compact max="200" />
```

- **Transforms** must be pure functions. `booleanAttribute` treats presence (and any string except `"false"`) as `true`; `numberAttribute` parses strings to numbers.
- **Aliases** are rarely needed — use them only to keep a public name stable while renaming internally.
- **Derived values** belong in `computed()`, not in transforms.

### Editable local copy of an input: `linkedSignal()`

Inputs are read-only. When a child needs a *draft* it can edit but that resets whenever the parent sends a new value, use [`linkedSignal()`](/modern/linked-signals/):

```ts title="rename.ts"
import { Component, input, linkedSignal, output } from '@angular/core';

@Component({
  selector: 'app-rename',
  template: `
    <input #box [value]="draft()" (input)="draft.set(box.value)" />
    <button type="button" (click)="saved.emit(draft())">Save</button>
    <button type="button" (click)="draft.set(name())">Reset</button>
  `,
})
export class Rename {
  readonly name = input.required<string>();
  readonly saved = output<string>();
  protected readonly draft = linkedSignal(() => this.name()); // resets when name changes
}
```

## Child → parent: `output()`

`output<T>()` declares a custom event. Call `.emit(value)`; the parent listens with `(eventName)="handler($event)"` (see `UserCard` above).

Naming rules:

- Use camelCase (`itemSelected`), **don't** prefix with `on`, and don't reuse DOM event names like `click` or `change`.
- Use `output<void>()` for events without data and call `.emit()`.

When you create a component dynamically you can subscribe in code — Angular cleans up automatically when the component is destroyed:

```ts
const sub = cardRef.instance.edit.subscribe((user) => console.log(user.name));
sub.unsubscribe(); // optional manual cleanup
```

Have an Observable you want to expose as an output? Use `outputFromObservable()` — see [RxJS in Angular](/intermediate/rxjs/).

:::tip[Catch typos in event names]
`(edti)="…"` silently does nothing. Since v22.2 you can enable `"strictUnclaimedEventNames": true` in `angularCompilerOptions` to get a compile error for event bindings that match neither a known DOM event nor an output.
:::

## Two-way binding: `model()`

A **model input** is an input the child can also *write* to. Angular automatically creates a matching `<name>Change` output, so the parent can use the "banana-in-a-box" syntax `[( )]`.

```ts title="rating.ts"
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    @for (star of stars; track star) {
      <button
        type="button"
        [class.filled]="star <= value()"
        [attr.aria-label]="star + ' stars'"
        (click)="value.set(star)"
      >
        ★
      </button>
    }
  `,
})
export class Rating {
  readonly value = model(0);
  protected readonly stars = [1, 2, 3, 4, 5];
}
```

```ts title="review.ts"
import { Component, signal } from '@angular/core';
import { Rating } from './rating';

@Component({
  selector: 'app-review',
  imports: [Rating],
  template: `
    <app-rating [(value)]="rating" />
    <p>You chose {{ rating() }} stars</p>
  `,
})
export class Review {
  protected readonly rating = signal(3);
}
```

- Pass the **signal itself** (`[(value)]="rating"`), not its value (`rating()`).
- You can also bind a plain property: `[(value)]="score"`.
- You can listen to only the change: `(valueChange)="save($event)"`.
- `model()` supports `model.required()` and aliases, but **not** transforms.
- Use `model()` for components whose job is editing a value (pickers, toggles, custom inputs). For full form-control integration see [Signal Forms](/modern/signal-forms/).

## Parent calls the child: template reference variables

The simplest way for a parent *template* to reach a child is a template reference variable:

```ts title="stopwatch.ts"
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-stopwatch',
  template: `{{ seconds() }}s`,
})
export class Stopwatch {
  readonly seconds = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  start() {
    this.timer ??= setInterval(() => this.seconds.update((s) => s + 1), 1000);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
```

```html
<app-stopwatch #watch />
<button type="button" (click)="watch.start()">Start</button>
<button type="button" (click)="watch.stop()">Stop</button>
```

`#watch` refers to the component instance (on a plain element it refers to the DOM element).

## Parent reads children in TypeScript: `viewChild()` / `viewChildren()`

**View queries** return signals that update as elements appear and disappear (for example inside `@if` or `@for`).

```ts title="search-box.ts"
import { Component, ElementRef, computed, viewChild, viewChildren } from '@angular/core';
import { Stopwatch } from './stopwatch';

@Component({
  selector: 'app-search-box',
  imports: [Stopwatch],
  template: `
    <input #query placeholder="Search…" />
    <button type="button" (click)="focusSearch()">Focus</button>

    @for (n of [1, 2, 3]; track n) {
      <app-stopwatch />
    }
    <p>Total: {{ total() }}s</p>
  `,
})
export class SearchBox {
  private readonly query = viewChild.required<ElementRef<HTMLInputElement>>('query');
  private readonly watches = viewChildren(Stopwatch);

  protected readonly total = computed(() =>
    this.watches().reduce((sum, w) => sum + w.seconds(), 0),
  );

  protected focusSearch() {
    this.query().nativeElement.focus();
  }
}
```

- Query by **component/directive class** (`Stopwatch`) or by **template reference name** (`'query'`).
- `viewChild()` returns `T | undefined`; `viewChild.required()` returns `T` (throws if missing when read).
- Use the `read` option to get something else from the element: `viewChild('box', { read: ViewContainerRef })`. Since v22.2 you can also `read: Injector` to get that element's injector.
- Query results are available once the view is created — read them in event handlers, `computed()`, `effect()` or `afterNextRender()`, **not** in the constructor.

## Projected children: `contentChildren()` + injecting the parent

When a component receives children through `<ng-content>` (like `<app-tab>` inside `<app-tabs>`), use **content queries**. The child can also `inject()` its parent component directly — both live in the same element injector tree.

```ts title="tabs.ts"
import { Component, computed, contentChildren, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-tab',
  template: `
    @if (isActive()) {
      <ng-content />
    }
  `,
})
export class Tab {
  readonly label = input.required<string>();
  private readonly tabs = inject(Tabs); // the enclosing <app-tabs>
  protected readonly isActive = computed(() => this.tabs.active() === this);
}

@Component({
  selector: 'app-tabs',
  template: `
    <div role="tablist">
      @for (tab of tabs(); track tab) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="tab === active()"
          (click)="select(tab)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    <ng-content />
  `,
})
export class Tabs {
  readonly tabs = contentChildren(Tab);
  private readonly selected = signal<Tab | undefined>(undefined);
  readonly active = computed(() => this.selected() ?? this.tabs()[0]);

  protected select(tab: Tab) {
    this.selected.set(tab);
  }
}
```

```html
<app-tabs>
  <app-tab label="Profile"><p>Profile content</p></app-tab>
  <app-tab label="Settings"><p>Settings content</p></app-tab>
</app-tabs>
```

By default `contentChildren()` only finds **direct** children; pass `{ descendants: true }` to search deeper. For production-grade accessible tabs, menus and listboxes, look at the headless components in `@angular/aria` (see [Angular Material](/intermediate/material/)).

## Unrelated components: a shared signal service

When components are siblings or far apart, don't pass data through five layers of inputs. Put the state in a service and inject it wherever it's needed.

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';

export interface CartItem {
  id: number;
  name: string;
  price: number;
}

@Service()
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();   // public, read-only
  readonly count = computed(() => this._items().length);
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price, 0));

  add(item: CartItem) {
    this._items.update((items) => [...items, item]);
  }

  remove(id: number) {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }
}
```

```ts title="cart-badge.ts"
import { Component, inject } from '@angular/core';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-badge',
  template: `🛒 {{ cart.count() }} ({{ cart.total() }} €)`,
})
export class CartBadge {
  protected readonly cart = inject(CartStore);
}
```

Any component that calls `cart.add(...)` instantly updates every `CartBadge`. `@Service()` (new in v22) registers the class as an app-wide singleton. For bigger apps see [State Management](/intermediate/state-management/).

:::note[Angular 21 and earlier]
For Angular 21 and earlier, use `@Injectable({ providedIn: 'root' })`; `@Service()` was added in v22. Older code also uses `@Input()`, `@Output() x = new EventEmitter()` and `@ViewChild()` decorators. They still work, but signal-based `input()`, `output()`, `model()` and `viewChild()` are preferred for new code. Check the [migration guide](/migration/signals/) before applying a schematic.
:::

## Common mistakes

- **Forgetting the parentheses**: `{{ user.name }}` instead of `{{ user().name }}` — inputs are signals.
- **Trying to `.set()` an input** — inputs are read-only. Use `model()` for two-way, or `linkedSignal()` for a local draft.
- **Passing `rating()` to `[(value)]`** — two-way binding needs the signal itself.
- **Reading queries in the constructor** — the view doesn't exist yet.
- **Writing state into a child via `viewChild()`** — prefer inputs. Writing into parents/children from queries causes `ExpressionChangedAfterItHasBeenChecked` errors.
- **Event-bus services with `Subject<any>`** — they hide data flow. Prefer typed signal services with clear methods.

## Key takeaways

- **Down** with `input()`, **up** with `output()`, **both ways** with `model()`.
- Use `computed()` for values derived from inputs and `linkedSignal()` for editable copies.
- Template references and `viewChild()` let parents call child methods; `contentChildren()` + `inject(Parent)` power compound components like tabs.
- Shared signal services (`@Service()`) are the go-to for sibling communication.

## Next steps

- [Lifecycle Hooks](/intermediate/lifecycle-hooks/) — when inputs and queries become available
- [Advanced Components](/intermediate/advanced-components/) — projection, dynamic components, host bindings
- [State Management](/intermediate/state-management/) — scaling shared state
- [Signals](/modern/signals/) — the reactive primitive behind all of this
