---
title: Angular Architecture 🏗️
description: How an Angular 22 app fits together — components, templates, services, dependency injection, the router, signals, change detection and bootstrapping.
sidebar:
  order: 2
---

Before writing lots of code, it helps to see the big picture: which pieces an Angular app is made
of, how they talk to each other, and what happens when the app starts. This page gives you that
mental map, with one small feature built from every piece.

## What you'll learn

- The building blocks of an Angular app and what each one is for
- How data flows between components (inputs down, outputs up, services across)
- How dependency injection provides services to components
- How Angular decides when to update the screen in Angular 22
- What happens, step by step, when your app starts

## The big picture

```text
┌──────────────────────────── Application ─────────────────────────────┐
│  main.ts ─► bootstrapApplication(App, appConfig)                     │
│                                                                      │
│  appConfig.providers ─► router, HttpClient, error listeners, …       │
│                                                                      │
│  App (root component)                                                │
│   ├── <nav> with routerLink                                          │
│   └── <router-outlet> ─► ProductList (page chosen by the route)      │
│                          ├── ProductCard  ──(output)──► ProductList  │
│                          └── ProductCard  ◄──(input)─── ProductList  │
│                                                                      │
│  Services (CartStore, ProductApi, …) ◄── inject() ── any component   │
└──────────────────────────────────────────────────────────────────────┘
```

- An app is a **tree of components**, starting from one root component.
- **Templates** describe what each component renders.
- **Services** hold shared logic and state, and are delivered to components by **dependency
  injection**.
- The **router** decides which page component to show for the current URL.
- **Signals** tell Angular exactly what changed so it can update the screen efficiently.

## The building blocks

| Building block | What it is | Example |
| --- | --- | --- |
| **Component** | A TypeScript class + HTML template + CSS, marked with `@Component` | `ProductCard`, `App` |
| **Template** | HTML with Angular syntax: `{{ }}`, `[prop]`, `(event)`, `@if`, `@for` | `<h3>{{ product().name }}</h3>` |
| **Directive** | Adds behaviour to an existing element | `RouterLink`, a custom `appHighlight` |
| **Pipe** | Formats a value in a template | `{{ price \| currency }}` |
| **Service** | A class for shared logic or state, usually marked with `@Service()` | `CartStore`, `ProductApi` |
| **Provider** | Tells the injector how to create something | `provideRouter(routes)`, `provideHttpClient()` |
| **Router** | Maps URLs to components, supports lazy loading and guards | `{ path: 'about', loadComponent: … }` |
| **Signal** | A reactive value that notifies Angular when it changes | `signal(0)`, `computed(…)` |

Every component is **standalone**: it lists the components, directives and pipes its template uses
in its own `imports` array. There is no central module to register things in.

## One feature, every building block

Let's build a tiny product catalogue with a cart to see how the pieces connect.

### 1. A model (plain TypeScript)

```ts title="product.ts"
export interface Product {
  id: number;
  name: string;
  price: number;
}
```

### 2. A service holds shared state

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';
import { Product } from './product';

@Service()
export class CartStore {
  private readonly items = signal<Product[]>([]);

  readonly count = computed(() => this.items().length);
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  add(product: Product) {
    this.items.update((items) => [...items, product]);
  }
}
```

`@Service()` (new in Angular 22) makes `CartStore` available everywhere as a **single shared
instance** — every component that injects it gets the same cart.

:::note[Angular 21 and earlier]
For Angular 21 and earlier, use `@Injectable({ providedIn: 'root' })`; the `@Service()` shorthand was added in Angular 22. `@Injectable()` also remains useful in v22 when its constructor injection or provider configuration fits the service better.
:::

### 3. A presentational component: inputs in, outputs out

```ts title="product-card.ts"
import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from './product';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  template: `
    <h3>{{ product().name }}</h3>
    <p>{{ product().price | currency }}</p>
    <button type="button" (click)="addToCart.emit(product())">Add to cart</button>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
```

`ProductCard` doesn't know where products come from or what "add to cart" does. It receives data
through an **input** and reports user actions through an **output**. That makes it easy to reuse
and test.

### 4. A page component: injects services, composes children

```ts title="product-list.ts"
import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartStore } from './cart-store';
import { Product } from './product';
import { ProductCard } from './product-card';

@Component({
  selector: 'app-product-list',
  imports: [ProductCard, CurrencyPipe],
  template: `
    <p>🛒 {{ cart.count() }} items · {{ cart.total() | currency }}</p>

    @for (product of products(); track product.id) {
      <app-product-card [product]="product" (addToCart)="cart.add($event)" />
    } @empty {
      <p>No products yet.</p>
    }
  `,
})
export class ProductList {
  protected readonly cart = inject(CartStore);

  protected readonly products = signal<Product[]>([
    { id: 1, name: 'Keyboard', price: 49 },
    { id: 2, name: 'Mouse', price: 19 },
  ]);
}
```

`inject(CartStore)` asks Angular's **dependency injection** system for the cart. `[product]`
passes data **down**; `(addToCart)` listens for events coming **up**.

### 5. Routes map URLs to pages

```ts title="app.routes.ts"
import { Routes } from '@angular/router';
import { ProductList } from './product-list';

export const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'about', loadComponent: () => import('./about').then((m) => m.About) },
];
```

`loadComponent` **lazy-loads** the About page: its code is downloaded only when someone visits
`/about`.

### 6. The root component hosts the router outlet

```ts title="app.ts"
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="/">Products</a>
      <a routerLink="/about">About</a>
    </nav>
    <router-outlet />
  `,
})
export class App {}
```

### 7. App-wide providers and bootstrapping

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
  ],
};
```

```ts title="main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { App } from './app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

`provideRouter()` turns on routing (`withComponentInputBinding()` lets route parameters flow into
component inputs) and `provideHttpClient()` makes `HttpClient` available for API calls.

## How data flows

```text
           ProductList (parent)
          [product]   ▲ (addToCart)
       input ↓        │ output
           ProductCard (child)

  ProductList ──inject()──► CartStore ◄──inject()── CartBadge
                         (one shared instance)
```

| Pattern | Use it when | Syntax |
| --- | --- | --- |
| **Input** (parent → child) | A child needs data from its parent | `input()`, `input.required()`; `[product]="p"` |
| **Output** (child → parent) | A child reports that something happened | `output()`; `(addToCart)="add($event)"` |
| **Two-way** (both) | Parent and child edit the same value | `model()`; `[(value)]="name"` |
| **Service** (anywhere ↔ anywhere) | Unrelated components share state or logic | `inject(CartStore)` |
| **Router** | Data comes from the URL | route params → inputs with `withComponentInputBinding()` |

## Dependency injection in one minute

**Dependency injection (DI)** means a class _asks_ for what it needs instead of creating it:

```ts
protected readonly cart = inject(CartStore); // ✅ Angular gives you the shared instance
// const cart = new CartStore();             // ❌ a separate cart nobody else sees
```

Angular keeps **injectors** in a hierarchy:

- The **root (environment) injector** holds app-wide services — anything with `@Service()` and
  everything in `appConfig.providers`.
- **Element injectors** come from a component's own `providers: [...]` array. Use them when each
  component instance needs its own copy of a service.

When a component calls `inject()`, Angular looks in the component's injector first, then walks up
the tree to the root. You'll learn more in [Services & DI](/beginner/services/) and
[Advanced DI Patterns](/advanced/dependency-injection/).

## How Angular updates the screen

Angular keeps the DOM in sync with your data through **change detection**. In Angular 22 two
defaults make this efficient:

- **Zoneless** (default since v21): Angular doesn't use `zone.js` to guess when something might
  have changed. Instead it waits for clear **notifications**.
- **`OnPush` by default** (since v22): a component is only re-checked when it has been told it
  needs to be.

Angular schedules an update when:

1. A **signal read in a template** changes (e.g. `count.set(1)`).
2. A **template or host event listener** runs (e.g. `(click)`).
3. An **input** of the component receives a new value.
4. `ChangeDetectorRef.markForCheck()` is called (the `async` pipe does this for you).

That's why this guide stores component state in **signals**. If you change a plain class field
from a `setTimeout` or a subscription, Angular isn't notified and the screen won't update.

```ts title="clock.ts"
import { Component, DestroyRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<p>{{ now().toLocaleTimeString() }}</p>`,
})
export class Clock {
  // ❌ `protected now = new Date();` updated inside setInterval would NOT refresh the view
  protected readonly now = signal(new Date()); // ✅ setting a signal notifies Angular

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
```

:::note[Angular 21 and earlier]
Components without a `changeDetection` setting used the "Default" strategy (now called
`ChangeDetectionStrategy.Eager`), and apps created before v21 used `zone.js`. `ng update` adds
`changeDetection: ChangeDetectionStrategy.Eager` to existing components so they keep working
exactly as before.
:::

## What happens when the app starts

1. The browser loads **`index.html`**, which contains `<app-root></app-root>` and the script tags
   added by the build.
2. **`main.ts`** runs `bootstrapApplication(App, appConfig)`.
3. Angular creates the **root injector** from `appConfig.providers` (router, HTTP, …).
4. Angular finds `<app-root>` (the selector of `App`), creates the `App` component and renders its
   template.
5. The **router** reads the URL and renders the matching page inside `<router-outlet>`
   (downloading lazy-loaded code if needed).
6. From then on, Angular listens for **signal changes, events and inputs** and updates only what's
   needed.

## Build time: compilation

When you run `ng serve` or `ng build`, the Angular CLI:

- **Compiles templates ahead of time (AOT)** into fast JavaScript instructions and type-checks them
  (strict templates are on by default).
- **Bundles** your code with esbuild (and serves it with Vite during development).
- **Splits** lazy-loaded routes and `@defer` blocks into separate chunks.
- **Tree-shakes** anything you don't use, such as services that are never injected.

## What about NgModules?

Before standalone components, every component had to be declared in an `NgModule`:

```ts
// Older style — you'll still see this in existing apps
@NgModule({
  declarations: [ProductCardComponent],
  imports: [CommonModule],
  exports: [ProductCardComponent],
})
export class ProductsModule {}
```

NgModules still work, but **new code doesn't need them**. Components are standalone by default
(since v19) and import what they use directly. See the
[Standalone Migration](/migration/standalone/) guide to convert older code.

## Common mistakes

- **Creating services with `new`.** You get a separate instance that no other component shares —
  use `inject()`.
- **Forgetting to add a component to `imports`.** If the template uses `<app-product-card>`, the
  component class `ProductCard` must be in `imports` — otherwise the compiler reports an
  "unknown element" error.
- **Keeping state in plain fields that change asynchronously.** With zoneless + `OnPush`, use
  signals so Angular knows to update.
- **Putting everything in one component.** Split UI into small presentational components (inputs
  and outputs) and move shared logic into services.

## Key takeaways

- An Angular app is a **tree of standalone components**, bootstrapped from `main.ts` with
  `bootstrapApplication(App, appConfig)`.
- **Inputs** pass data down, **outputs** send events up, **services** share state across the app.
- **Dependency injection** (`inject()`, `@Service()`, `providers`) delivers services to components.
- In Angular 22, apps are **zoneless** and components are **`OnPush` by default**: signals, events
  and inputs tell Angular when to update.

## Next steps

1. **[Your First App](/beginner/first-app/)** — put these pieces together in a working app
2. **[Components Basics](/beginner/components/)** — everything about components
3. **[Services & DI](/beginner/services/)** — share logic with dependency injection
