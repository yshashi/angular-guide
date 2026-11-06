---
title: Angular Design Patterns 🏗️
description: Proven design patterns for Angular 22 — container/presentational, facade, signal store, adapter, strategy via DI, composition, interceptors and more.
sidebar:
  order: 2
---

Design patterns are named, reusable answers to common design problems. In Angular they are built from three tools you already know: **components**, **dependency injection** and **signals**. This page shows the patterns that matter most in real Angular 22 apps, each with a short, type-checked example and advice on when to use it.

**What you'll learn**

- How to split UI into container (smart) and presentational (dumb) components
- How to hide data access and state behind a facade or a signal store
- How to swap implementations with DI: adapter, strategy, plugins
- How to compose behaviour with `hostDirectives`, interceptors and reusable form schemas
- Which pattern to reach for (and when a pattern is overkill)

:::note
All examples follow Angular 22 defaults: standalone components (no `standalone: true`), OnPush change detection by default (no `changeDetection` needed), `@Service()` for singletons and `inject()` for dependencies.
:::

## 🎭 Container / presentational components

Split components into two roles:

| | Presentational ("dumb") | Container ("smart") |
|---|---|---|
| Gets data from | `input()` | Services / stores / router |
| Talks back via | `output()` / `model()` | Calling service methods |
| Knows about HTTP, routing, state? | No | Yes |
| Easy to reuse and test? | Very | Less |

```ts title="product-card.ts (presentational)"
import { Component, input, output } from '@angular/core';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, NgOptimizedImage],
  template: `
    <article>
      <img [ngSrc]="product().imageUrl" [alt]="product().name" width="200" height="200" />
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
      <button type="button" (click)="addToCart.emit(product())">Add to cart</button>
    </article>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
```

```ts title="product-list.ts (container)"
@Component({
  selector: 'app-product-list',
  imports: [ProductCard],
  template: `
    <input type="search" [value]="catalog.search()" (input)="onSearch($event)" aria-label="Search products" />
    <p>🛒 {{ catalog.cartCount() }}</p>

    @if (catalog.error(); as message) {
      <p role="alert">{{ message }}</p>
    }
    @for (product of catalog.products(); track product.id) {
      <app-product-card [product]="product" (addToCart)="catalog.addToCart($event)" />
    } @empty {
      @if (!catalog.loading()) {
        <p>No products found.</p>
      }
    }
  `,
})
export class ProductList {
  protected readonly catalog = inject(CatalogFacade);

  protected onSearch(event: Event) {
    this.catalog.search.set((event.target as HTMLInputElement).value);
  }
}
```

:::tip
Presentational components work perfectly with the OnPush default: they only re-render when an input changes or one of their own events fires.
:::

## 🎭 Facade with signals

A **facade** is a service that gives components one simple API — signals to read and methods to call — and hides *how* data is fetched, cached and combined. Components never touch `HttpClient` or state internals directly, so you can change the backend or adopt a state library later without touching the UI.

```ts title="catalog-facade.ts"
import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Service()
export class CatalogFacade {
  private readonly http = inject(HttpClient);

  readonly search = signal('');
  private readonly cart = signal<Product[]>([]);

  // Re-fetches automatically whenever search() changes
  private readonly productsResource = httpResource<Product[]>(
    () => ({ url: '/api/products', params: { q: this.search() } }),
    { defaultValue: [], parse: (raw) => (raw as ProductDto[]).map(toProduct) },
  );

  // Public, read-only API
  readonly products = this.productsResource.value;
  readonly loading = this.productsResource.isLoading;
  readonly error = computed(() => (this.productsResource.error() ? 'Could not load products' : null));
  readonly cartCount = computed(() => this.cart().length);

  addToCart(product: Product) {
    this.cart.update((items) => [...items, product]);
  }

  async checkout() {
    await firstValueFrom(this.http.post('/api/orders', { items: this.cart().map((p) => p.id) }));
    this.cart.set([]);
  }
}
```

**Use it when** several components need the same data and actions, or when the data layer is likely to change. **Skip it** for a single component that loads one thing — an `httpResource` inside the component is enough.

## 🗄️ Signal store

A **store** is a service that owns one piece of state, exposes it as read-only signals and changes it only through named methods. It is the facade pattern focused on state.

### Plain service store

```ts title="todo-store.ts"
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'open' | 'done';
}

@Service()
export class TodoStore {
  private readonly state = signal<TodoState>({ todos: [], filter: 'all' });

  readonly todos = computed(() => this.state().todos);
  readonly filter = computed(() => this.state().filter);
  readonly visible = computed(() => {
    const { todos, filter } = this.state();
    return filter === 'all' ? todos : todos.filter((t) => (filter === 'done' ? t.done : !t.done));
  });
  readonly remaining = computed(() => this.todos().filter((t) => !t.done).length);

  add(title: string) {
    this.patch((s) => ({ todos: [...s.todos, { id: Date.now(), title, done: false }] }));
  }

  toggle(id: number) {
    this.patch((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }

  setFilter(filter: TodoState['filter']) {
    this.patch(() => ({ filter }));
  }

  private patch(fn: (s: TodoState) => Partial<TodoState>) {
    this.state.update((s) => ({ ...s, ...fn(s) }));
  }
}
```

Rules that keep stores healthy:

- **One writer.** Only the store calls `set`/`update`; everyone else reads signals.
- **Immutable updates.** Always return new objects/arrays.
- **Derive, don't duplicate.** `visible` and `remaining` are `computed()`, never stored.
- **Scope it.** Use `@Service()` for global state; use `@Service({ autoProvided: false })` and `providers: [TodoStore]` on a route or component when each instance needs its own copy.

### NgRx SignalStore

For larger apps, [NgRx SignalStore](https://ngrx.io/guide/signals/signal-store) (`@ngrx/signals`) gives you the same idea with less boilerplate and extras such as entity helpers and devtools:

```ts title="todo-signal-store.ts"
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const TodoSignalStore = signalStore(
  { providedIn: 'root' },
  withState<TodoState>({ todos: [], filter: 'all' }),
  withComputed(({ todos, filter }) => ({
    visible: computed(() =>
      filter() === 'all' ? todos() : todos().filter((t) => (filter() === 'done' ? t.done : !t.done)),
    ),
  })),
  withMethods((store) => ({
    add(title: string) {
      patchState(store, (s) => ({ todos: [...s.todos, { id: Date.now(), title, done: false }] }));
    },
    setFilter(filter: TodoState['filter']) {
      patchState(store, { filter });
    },
  })),
);

// In a component: protected readonly store = inject(TodoSignalStore);
```

See [State management](/intermediate/state-management/) for a deeper comparison.

## 🔌 Adapter

An **adapter** converts one interface into another. In Angular you meet it in two places.

### 1. Map API data (DTOs) to your domain model

Keep backend naming and quirks out of your components:

```ts title="product-adapter.ts"
interface ProductDto {
  product_id: number;
  title: string;
  price_cents: number;
  image: string | null;
}

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.product_id,
    name: dto.title,
    price: dto.price_cents / 100,
    imageUrl: dto.image ?? '/assets/placeholder.png',
  };
}
```

`httpResource` accepts it directly through its `parse` option (see the facade above). With `HttpClient`, use `.pipe(map((list) => list.map(toProduct)))`.

### 2. Wrap a browser or third-party API behind an abstraction

Use an **abstract class as the DI token**, so components depend on the abstraction and you choose the implementation in `providers`:

```ts title="storage-adapter.ts"
export abstract class StorageAdapter {
  abstract get<T>(key: string): T | null;
  abstract set<T>(key: string, value: T): void;
}

@Service({ autoProvided: false })
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

@Service({ autoProvided: false })
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly data = new Map<string, unknown>();
  get<T>(key: string): T | null {
    return (this.data.get(key) as T) ?? null;
  }
  set<T>(key: string, value: T) {
    this.data.set(key, value);
  }
}

// app.config.ts (browser):  { provide: StorageAdapter, useClass: LocalStorageAdapter }
// app.config.server.ts / tests: { provide: StorageAdapter, useClass: MemoryStorageAdapter }
```

This is also how you keep SSR safe: the server gets an implementation that doesn't touch `localStorage`.

## ♟️ Strategy via DI tokens

The **strategy** pattern lets you choose an algorithm at runtime. In Angular, register every strategy under one `InjectionToken` with `multi: true`, then pick one.

```ts title="payment-strategies.ts"
export interface PaymentStrategy {
  readonly id: 'card' | 'paypal';
  readonly label: string;
  pay(amount: number): Promise<string>;
}

export const PAYMENT_STRATEGIES = new InjectionToken<PaymentStrategy[]>('PAYMENT_STRATEGIES');

@Service({ autoProvided: false })
export class CardPayment implements PaymentStrategy {
  readonly id = 'card';
  readonly label = 'Credit card';
  async pay(amount: number) {
    return `card-${amount}`;
  }
}

@Service({ autoProvided: false })
export class PaypalPayment implements PaymentStrategy {
  readonly id = 'paypal';
  readonly label = 'PayPal';
  async pay(amount: number) {
    return `paypal-${amount}`;
  }
}

export const paymentProviders = [
  { provide: PAYMENT_STRATEGIES, useClass: CardPayment, multi: true },
  { provide: PAYMENT_STRATEGIES, useClass: PaypalPayment, multi: true },
];
```

```ts title="checkout.ts"
@Component({
  selector: 'app-checkout',
  providers: [paymentProviders],
  template: `
    @for (strategy of strategies; track strategy.id) {
      <label>
        <input type="radio" name="payment" [checked]="selectedId() === strategy.id" (change)="selectedId.set(strategy.id)" />
        {{ strategy.label }}
      </label>
    }
    <button type="button" (click)="payNow()">Pay</button>
  `,
})
export class Checkout {
  protected readonly strategies = inject(PAYMENT_STRATEGIES);
  protected readonly selectedId = signal<PaymentStrategy['id']>('card');
  private readonly selected = computed(
    () => this.strategies.find((s) => s.id === this.selectedId()) ?? this.strategies[0],
  );

  protected async payNow() {
    await this.selected().pay(42);
  }
}
```

Adding a new payment method now means adding one class and one provider — `Checkout` never changes (open/closed principle). The same `multi: true` technique powers **plugin systems** (validators, menu items, analytics sinks).

### Choosing a strategy once, at startup

When the choice depends on configuration, let `@Service({ factory })` pick the implementation. The factory runs in an injection context, so it can `inject()` tokens:

```ts title="logger.ts"
export const IS_PRODUCTION = new InjectionToken<boolean>('IS_PRODUCTION', { factory: () => false });

@Service({
  factory: () => (inject(IS_PRODUCTION) ? new RemoteLogger() : new Logger()),
})
export class Logger {
  log(message: string) {
    console.log(message);
  }
}

class RemoteLogger extends Logger {
  override log(message: string) {
    navigator.sendBeacon('/api/logs', message);
  }
}
```

## 🧱 Composition with `hostDirectives` (decorator pattern)

Instead of inheritance, **compose** small behaviours onto a component with the Directive Composition API. Each directive adds one capability; the host chooses which inputs to expose.

```ts title="app-button.ts"
@Directive({
  selector: '[appDisabled]',
  host: { '[attr.aria-disabled]': 'disabled()', '[class.is-disabled]': 'disabled()' },
})
export class Disableable {
  readonly disabled = input(false);
}

@Directive({
  selector: '[appTooltip]',
  host: { '[attr.title]': 'tooltip()' },
})
export class Tooltip {
  readonly tooltip = input('', { alias: 'appTooltip' });
}

@Component({
  selector: 'button[appButton]',
  hostDirectives: [
    { directive: Disableable, inputs: ['disabled'] },
    { directive: Tooltip, inputs: ['appTooltip: tooltip'] },
  ],
  template: `<ng-content />`,
})
export class AppButton {}
```

```html
<button appButton [disabled]="true" tooltip="Save the file">Save</button>
```

Notice the selector `button[appButton]`: the component **enhances a native `<button>`** instead of replacing it, so keyboard support and accessibility come for free.

## ⛓️ Chain of responsibility: HTTP interceptors

Functional interceptors form a chain: each one can change the request, pass it on with `next(req)`, or handle the response. Order matters — they run in the order you list them.

```ts title="interceptors.ts"
export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  req.method === 'GET' ? next(req).pipe(retry({ count: 2, delay: () => timer(500) })) : next(req);

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        void router.navigate(['/login']);
      }
      return throwError(() => error); // always re-throw — never swallow with EMPTY
    }),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([retryInterceptor, unauthorizedInterceptor]));
```

## 📋 Reusable form schemas (Signal Forms)

With Signal Forms, validation rules live in **schemas**. Wrap rules you use in many places with `schema()` and attach them to any part of a model with `apply()`.

```ts title="order-form.ts"
import { FormField, apply, form, minLength, pattern, required, schema } from '@angular/forms/signals';

export const addressSchema = schema<Address>((address) => {
  required(address.street);
  required(address.city);
  pattern(address.zip, /^\d{5}$/, { message: 'Use 5 digits' });
});

@Component({
  selector: 'app-order-form',
  imports: [FormField],
  template: `
    <input [formField]="orderForm.name" aria-label="Name" />
    <input [formField]="orderForm.shipping.street" aria-label="Street" />
    <input [formField]="orderForm.billing.zip" aria-label="Billing ZIP" />
  `,
})
export class OrderForm {
  protected readonly model = signal({
    name: '',
    shipping: { street: '', city: '', zip: '' },
    billing: { street: '', city: '', zip: '' },
  });

  protected readonly orderForm = form(this.model, (path) => {
    required(path.name);
    minLength(path.name, 2);
    apply(path.shipping, addressSchema);
    apply(path.billing, addressSchema);
  });
}
```

Use `applyWhen()` / `applyWhenValue()` to activate a schema only under a condition (for example, only validate a US ZIP when `country === 'US'`). See [Signal Forms](/modern/signal-forms/).

## 🔁 Two-way bound custom controls with `model()`

When a component both receives and changes a value, expose a `model()` — the parent can then use banana-in-a-box `[( )]` syntax with a signal:

```ts title="rating.ts"
@Component({
  selector: 'app-rating',
  template: `
    @for (star of stars; track star) {
      <button type="button" [attr.aria-pressed]="star <= value()" (click)="value.set(star)">★</button>
    }
  `,
})
export class Rating {
  readonly value = model(0);
  protected readonly stars = [1, 2, 3, 4, 5];
}

// Parent template: <app-rating [(value)]="score" />   with   score = signal(3)
```

Because `Rating` already has a `value` model, it can also plug straight into Signal Forms: add `implements FormValueControl<number>` (from `@angular/forms/signals`) and bind it with `<app-rating [formField]="reviewForm.stars" />`. See [Signal Forms](/modern/signal-forms/).

## 💤 Lazy proxy with `injectAsync()`

A **proxy** stands in for an object that is expensive to create. `injectAsync()` (stable since v22) is a built-in lazy proxy for services: the service's code is split into its own chunk and only downloaded the first time you call it.

```ts title="chart-page.ts"
@Component({
  selector: 'app-chart-page',
  template: `<button type="button" (click)="renderChart()">Show chart</button>`,
})
export class ChartPage {
  private readonly charts = injectAsync(() =>
    import('./chart-service').then((m) => m.ChartService),
  );

  protected async renderChart() {
    const charts = await this.charts();
    charts.render([1, 2, 3]);
  }
}
```

The lazy service must be auto-provided (`@Service()` or `@Injectable({ providedIn: 'root' })`). For lazy **UI**, use `@defer` or lazy routes instead.

## 🗺️ Which pattern should I use?

| Problem | Pattern | Angular tool |
|---|---|---|
| Component does too much (UI + data) | Container / presentational | `input()`, `output()`, `model()` |
| Many components share data + actions | Facade | `@Service()` + signals + `httpResource` |
| Shared state with rules for changing it | Signal store | `signal` + `computed`, or NgRx SignalStore |
| Backend shape ≠ UI shape | Adapter (DTO mapping) | `parse` option, `map()` |
| Need to swap an implementation (browser/server/test) | Adapter / abstraction | Abstract class token + `providers` |
| Choose behaviour at runtime | Strategy | `InjectionToken` + `multi: true` |
| Choose implementation once from config | Factory | `@Service({ factory })` |
| Reuse behaviour across components | Composition | `hostDirectives` |
| Cross-cutting HTTP logic | Chain of responsibility | Functional interceptors |
| Same validation in many forms | Reusable schema | `schema()` + `apply()` |
| Expensive service used rarely | Lazy proxy | `injectAsync()` |

:::caution[Don't over-engineer]
Patterns add indirection. A small feature with one component and one request doesn't need a facade, a store **and** an adapter. Start simple — a component with an `httpResource` — and extract a pattern when duplication or complexity actually appears.
:::

## 🔑 Key takeaways

- Separate **presentation** (inputs/outputs) from **orchestration** (services, router, state).
- Facades and stores expose **read-only signals + methods**; only they write state.
- DI is Angular's superpower for patterns: abstract-class tokens for adapters, `multi: true` for strategies/plugins, `@Service({ factory })` for config-based choices.
- Prefer **composition** (`hostDirectives`, schemas, interceptors) over inheritance.
- Use the simplest pattern that removes real pain.

## ➡️ Next steps

- [Best practices](/resources/best-practices/)
- [State management](/intermediate/state-management/)
- [Component communication](/intermediate/component-communication/)
- [Dependency injection](/advanced/dependency-injection/)
