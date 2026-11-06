---
title: Services & Dependency Injection 🔧
description: Learn Angular services and dependency injection - @Service(), inject(), sharing state, component-level providers and InjectionToken.
sidebar:
  order: 7
---

A **service** is a plain TypeScript class that holds logic or data that several parts of your app need — talking to a server, storing the shopping cart, logging, formatting. **Dependency injection (DI)** is how Angular creates those services and hands them to the components (and other services) that ask for them.

## What you'll learn

- Why we move logic out of components into services
- How to create a service with `@Service()` and use it with `inject()`
- How DI decides which instance you get (singletons vs. per-component instances)
- When you still need `@Injectable()`
- How to inject configuration values with `InjectionToken`

## Why services?

| Put it in a **component** | Put it in a **service** |
|---|---|
| What the user sees and clicks | Data shared by several components |
| Template-only state (is this panel open?) | Talking to APIs (`HttpClient`) |
| Wiring inputs and outputs | Business rules, validation, calculations |
| | Cross-cutting concerns (logging, auth, analytics) |

Components stay small and easy to test, and the same logic is reused everywhere.

## Creating a service

```bash
ng generate service cart-store
# short form
ng g s cart-store
```

The CLI creates `cart-store.ts` (and a `cart-store.spec.ts` test):

```ts title="cart-store.ts"
import { Service } from '@angular/core';

@Service()
export class CartStore {}
```

`@Service()` marks the class as a service **and** makes it available everywhere in the app as a **single shared instance** (a singleton). You don't have to register it anywhere. If nobody uses it, the build tools drop it from the bundle (it is *tree-shakable*).

:::note[Angular 21 and earlier]
`@Service()` is new in Angular 22. In earlier versions (and in lots of existing code) the same thing is written as:

```ts
@Injectable({ providedIn: 'root' })
export class CartStore {}
```

Both still work in v22. Run `ng generate @angular/core:service` to convert eligible `@Injectable` classes to `@Service`.
:::

## Using a service with `inject()`

Let's give the cart some state. Signals work great inside services:

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

  readonly items = this._items.asReadonly();               // read-only view for consumers
  readonly count = computed(() => this._items().length);
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price, 0));

  add(item: CartItem) {
    this._items.update((items) => [...items, item]);
  }

  remove(id: number) {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }

  clear() {
    this._items.set([]);
  }
}
```

Ask for the service with `inject()`:

```ts title="product-list.ts"
import { Component, inject } from '@angular/core';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-product-list',
  template: `
    @for (product of products; track product.id) {
      <p>
        {{ product.name }} — {{ product.price }} €
        <button type="button" (click)="cart.add(product)">Add</button>
      </p>
    }
  `,
})
export class ProductList {
  protected readonly cart = inject(CartStore);
  protected readonly products = [
    { id: 1, name: 'Coffee', price: 4 },
    { id: 2, name: 'Bagel', price: 3 },
  ];
}
```

```ts title="cart-badge.ts"
import { Component, inject } from '@angular/core';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-badge',
  template: `🛒 {{ cart.count() }} items · {{ cart.total() }} €`,
})
export class CartBadge {
  protected readonly cart = inject(CartStore);
}
```

`ProductList` and `CartBadge` receive the **same** `CartStore` instance, so adding a product instantly updates the badge — even though the two components know nothing about each other.

:::tip
Expose state as **read-only** signals (`asReadonly()` or `computed()`) and change it only through methods like `add()`. Then every change to your state goes through one place, which makes bugs much easier to find.
:::

### Services can use other services

```ts title="logger.ts"
import { Service } from '@angular/core';

@Service()
export class Logger {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}
```

```ts title="checkout.ts"
import { Service, inject } from '@angular/core';
import { CartStore } from './cart-store';
import { Logger } from './logger';

@Service()
export class Checkout {
  private readonly cart = inject(CartStore);
  private readonly logger = inject(Logger);

  placeOrder() {
    this.logger.log(`Ordering ${this.cart.count()} items for ${this.cart.total()} €`);
    this.cart.clear();
  }
}
```

### Where can I call `inject()`?

`inject()` works only while Angular is **creating** something — this is called the *injection context*:

- ✅ class field initializers (`private readonly http = inject(HttpClient);`)
- ✅ the constructor
- ✅ functions Angular runs for you: route guards, resolvers, interceptors, `provideAppInitializer()`, factory functions
- ❌ event handlers, `setTimeout`, `ngOnInit` or other lifecycle hooks

Calling it in the wrong place throws error **NG0203** (*"inject() must be called from an injection context"*). Fix it by moving the `inject()` call to a field.

## How dependency injection works

1. A class asks for a dependency: `inject(CartStore)`.
2. Angular looks for a **provider** of `CartStore` in an **injector**, starting from the current component and walking up to the application root.
3. The first injector that has a provider creates the instance (once) and returns it.

```text
Root (application) injector   ← @Service() classes, providers in app.config.ts
 └─ AppComponent injector
     └─ ProductList injector  ← providers: [...] in @Component
         └─ child components
```

Most services live in the **root injector** (that's what `@Service()` does), so the whole app shares one instance.

## One instance per component: component-level providers

Sometimes each component instance needs its **own** copy of a service — for example, every chat window or every wizard keeps separate state. List the service in the component's `providers`:

```ts title="counter-store.ts"
import { Service, signal } from '@angular/core';

@Service({ autoProvided: false }) // not global: must be provided explicitly
export class CounterStore {
  readonly value = signal(0);
  increment() {
    this.value.update((v) => v + 1);
  }
}
```

```ts title="counter-widget.ts"
import { Component, inject } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-counter-widget',
  providers: [CounterStore],       // a new CounterStore for each <app-counter-widget>
  template: `<button type="button" (click)="store.increment()">{{ store.value() }}</button>`,
})
export class CounterWidget {
  protected readonly store = inject(CounterStore);
}
```

```html
<!-- Two independent counters -->
<app-counter-widget />
<app-counter-widget />
```

The instance is shared by the component **and all its children**, and it is destroyed together with the component. `autoProvided: false` makes sure nobody accidentally injects a global copy — injecting it without a provider throws a clear error.

You can also scope a service to a group of routes with `providers` on a route — see [Advanced Routing](/intermediate/advanced-routing/).

## Configuration values with `InjectionToken`

DI isn't just for classes. To inject a string, number, object or function, create an **`InjectionToken`**:

```ts title="app.tokens.ts"
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  pageSize: number;
}

// Token that must be provided by the app
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// Token with a default value (no provider needed)
export const PAGE_TITLE_PREFIX = new InjectionToken<string>('PAGE_TITLE_PREFIX', {
  providedIn: 'root',
  factory: () => 'My Shop',
});
```

Provide the value in `app.config.ts`:

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { APP_CONFIG } from './app.tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: APP_CONFIG, useValue: { apiUrl: 'https://api.example.com', pageSize: 20 } },
  ],
};
```

And inject it like a service:

```ts title="product-api.ts"
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from './app.tokens';

export interface Product {
  id: number;
  name: string;
}

@Service()
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  list(page = 1) {
    return this.http.get<Product[]>(`${this.config.apiUrl}/products`, {
      params: { page, size: this.config.pageSize },
    });
  }
}
```

### Provider recipes

A provider tells an injector **how** to create the value for a token:

| Provider | Meaning | Example |
|---|---|---|
| `SomeClass` | Create an instance of this class | `providers: [CounterStore]` |
| `useValue` | Use this exact value | `{ provide: APP_CONFIG, useValue: config }` |
| `useClass` | Create a different class for this token | `{ provide: Logger, useClass: SilentLogger }` |
| `useFactory` | Call a function (it can `inject()` other things) | `{ provide: API_URL, useFactory: () => inject(APP_CONFIG).apiUrl }` |
| `useExisting` | Alias another token | `{ provide: OldLogger, useExisting: Logger }` |

`useClass` is very useful in tests: swap the real service for a fake one.

### Optional dependencies

If a dependency might not be provided, ask for it optionally — you get `null` instead of an error:

```ts
private readonly analytics = inject(Analytics, { optional: true });

track(event: string) {
  this.analytics?.track(event);
}
```

## When to use `@Injectable()` instead of `@Service()`

`@Service()` covers most app code. Keep using `@Injectable()` when you need:

| Need | Use |
|---|---|
| Constructor parameter injection (`constructor(private http: HttpClient)`) | `@Injectable()` — `@Service()` supports only `inject()` |
| Advanced root providers (`useClass`, `useValue`, `useExisting`, `useFactory` in the decorator) | `@Injectable({ providedIn: 'root', useClass: ... })` |
| Non-root scopes such as `providedIn: 'platform'` | `@Injectable({ providedIn: 'platform' })` |
| A library that must also work with Angular 21 or older | `@Injectable({ providedIn: 'root' })` |

To pick a different implementation at creation time, `@Service` has a `factory` option: `@Service({ factory: () => new ConsoleLogger() })`. The factory can call `inject()`.

:::tip[Lazy-loading a heavy service]
If a service pulls in a large library you rarely need (PDF export, charts), `injectAsync(() => import('./pdf-export').then(m => m.PdfExport))` loads its code only when you first use it. See [Dependency Injection](/advanced/dependency-injection/).
:::

## Practical example: a todo store

```ts title="todo-store.ts"
import { Service, computed, signal } from '@angular/core';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export type Filter = 'all' | 'active' | 'done';

@Service()
export class TodoStore {
  private readonly todos = signal<Todo[]>([]);
  private nextId = 1;

  readonly filter = signal<Filter>('all');
  readonly remaining = computed(() => this.todos().filter((t) => !t.done).length);
  readonly visible = computed(() => {
    const todos = this.todos();
    switch (this.filter()) {
      case 'active':
        return todos.filter((t) => !t.done);
      case 'done':
        return todos.filter((t) => t.done);
      default:
        return todos;
    }
  });

  add(title: string) {
    const trimmed = title.trim();
    if (trimmed) {
      this.todos.update((list) => [...list, { id: this.nextId++, title: trimmed, done: false }]);
    }
  }

  toggle(id: number) {
    this.todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  remove(id: number) {
    this.todos.update((list) => list.filter((t) => t.id !== id));
  }
}
```

```ts title="todo-page.ts"
import { Component, inject } from '@angular/core';
import { Filter, TodoStore } from './todo-store';

@Component({
  selector: 'app-todo-page',
  template: `
    <input #title placeholder="What needs doing?" (keyup.enter)="store.add(title.value); title.value = ''" />

    <nav>
      @for (f of filters; track f) {
        <button type="button" [class.active]="store.filter() === f" (click)="store.filter.set(f)">{{ f }}</button>
      }
    </nav>

    <ul>
      @for (todo of store.visible(); track todo.id) {
        <li>
          <label [class.done]="todo.done">
            <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
            {{ todo.title }}
          </label>
          <button type="button" (click)="store.remove(todo.id)" aria-label="Delete">✕</button>
        </li>
      } @empty {
        <li>Nothing here 🎉</li>
      }
    </ul>

    <p>{{ store.remaining() }} item(s) left</p>
  `,
  styles: `.done { text-decoration: line-through; } .active { font-weight: bold; }`,
})
export class TodoPage {
  protected readonly store = inject(TodoStore);
  protected readonly filters: Filter[] = ['all', 'active', 'done'];
}
```

## Common mistakes

| Mistake | Fix |
|---|---|
| `new CartStore()` in a component | Always use `inject(CartStore)` — otherwise each component gets its own unrelated copy and DI can't provide its dependencies. |
| NG0203 "inject() must be called from an injection context" | Call `inject()` in a field initializer or constructor, not in a method or callback. |
| A component-level `providers: [X]` when you wanted shared state | Remove it: each `providers` entry creates a **new** instance for that subtree. |
| NG0201 "No provider found for X" (`NullInjectorError` in older versions) | Provide it (`providers: [X]` or in `app.config.ts`), or use `@Service()` / `providedIn: 'root'`. |
| Exposing writable signals publicly | Expose `asReadonly()` / `computed()` and change state through methods. |

## Best practices

- Use `@Service()` for app-wide singletons and `inject()` everywhere.
- Name services by what they do: `CartStore`, `ProductApi`, `Logger` (no `Service` suffix needed).
- Keep each service focused on one responsibility.
- Store service state in signals; expose read-only signals.
- Use `InjectionToken` for configuration rather than hard-coding values.

## Key takeaways

- Services hold shared logic and data; DI creates them and hands them out.
- `@Service()` = singleton available everywhere (the v22 shorthand for `@Injectable({ providedIn: 'root' })`).
- `inject(Token)` gets a dependency — only inside an injection context.
- `providers: [X]` on a component gives that component (and its children) its own instance.
- `InjectionToken` lets you inject non-class values such as configuration.

## Next steps

1. [Routing](/beginner/routing/) — navigate between pages
2. [HTTP Client](/beginner/http/) — use a service to load data from a server
3. [Dependency Injection (advanced)](/advanced/dependency-injection/) — hierarchical injectors, `injectAsync`, multi providers
4. [State Management](/intermediate/state-management/) — patterns for larger apps
