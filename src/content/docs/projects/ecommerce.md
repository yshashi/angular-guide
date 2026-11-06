---
title: E-commerce Store 🛒
description: Build a small Angular 22 store with routes, reactive product data, a signal cart, checkout validation and an SSR-ready architecture.
sidebar:
  order: 7
---

Build a small product storefront with a product list, details, a cart and a checkout form. This guide focuses on Angular structure; connect a trusted commerce backend before handling real orders or payments.

## 1. Create an app with routing

```bash
ng new ng-store --routing --style=css
cd ng-store
```

For a rendered storefront, add SSR with `ng add @angular/ssr`. See [SSR Introduction](/ssr/introduction/).

## 2. Define product routes

```ts title="src/app/app.routes.ts"
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./catalog/catalog').then((m) => m.Catalog) },
  { path: 'products/:id', loadComponent: () => import('./product/product').then((m) => m.ProductPage) },
  { path: 'cart', loadComponent: () => import('./cart/cart-page').then((m) => m.CartPage) },
  { path: 'checkout', loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout) },
];
```

Enable router input binding with `provideRouter(routes, withComponentInputBinding())`, then read an `id` route parameter using `input.required<string>()`.

## 3. Load product data with `httpResource`

```ts
import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Product {
  id: number;
  title: string;
  price: number;
}

@Component({
  imports: [CurrencyPipe],
  template: `
    @if (product.isLoading()) { <p role="status">Loading product…</p> }
    @else if (product.error()) { <p role="alert">Could not load the product.</p> }
    @else if (product.hasValue()) {
      <h1>{{ product.value().title }}</h1>
      <p>{{ product.value().price | currency }}</p>
      <button type="button" (click)="addToCart()">Add to cart</button>
    }
  `,
})
export class ProductPage {
  readonly id = input.required<string>();
  protected readonly product = httpResource<Product>(
    () => `https://dummyjson.com/products/${this.id()}`,
  );

  protected addToCart() {
    // Call the injected CartStore with the validated product.
  }
}
```

`httpResource()` tracks the route input and reloads when it changes. Check `error()` and `hasValue()` before reading `value()`.

## 4. Store cart state with signals

Create a root cart store using `@Service()`. Keep the cart immutable and derive totals with `computed()`:

```ts
import { Service, computed, signal } from '@angular/core';

interface CartLine { id: number; title: string; price: number; quantity: number; }

@Service()
export class CartStore {
  private readonly linesState = signal<CartLine[]>([]);
  readonly lines = this.linesState.asReadonly();
  readonly itemCount = computed(() => this.linesState().reduce((n, line) => n + line.quantity, 0));
  readonly total = computed(() => this.linesState().reduce((sum, line) => sum + line.price * line.quantity, 0));

  add(product: Omit<CartLine, 'quantity'>) {
    this.linesState.update((lines) => {
      const current = lines.find((line) => line.id === product.id);
      return current
        ? lines.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...lines, { ...product, quantity: 1 }];
    });
  }
}
```

If persisting a non-sensitive cart, access browser storage after rendering and handle unavailable storage. Never store payment credentials or trust client-side totals during checkout.

## 5. Validate checkout and protect routes

For a new Angular 22 form, use Signal Forms (`form()`, `FormField`, `[formField]`) and validate required fields and email format. See the complete [Signal Forms guide](/modern/signal-forms/). Send submitted data to the backend for authoritative validation.

A route guard can improve navigation—for example, redirecting a user with an empty cart. A client-side guard is not an authorization boundary: the server must check permissions and verify every order.

## SSR and images

Product pages can benefit from SSR or prerendering when the product data is public and stable. Use route-level render modes and a server-render-safe data source. Use `NgOptimizedImage` for product images and provide meaningful alternative text.

## Next steps

- [Routing Basics](/beginner/routing/)
- [Signal Forms](/modern/signal-forms/)
- [Deployment Strategies](/deployment/strategies/)
