---
title: Admin Dashboard 📊
description: Build an Angular 22 dashboard with a typed API, httpResource, signal-derived KPIs, accessible tables, responsive cards and lazy widgets.
sidebar:
  order: 6
---

This project builds a responsive product dashboard with summary cards, loading and error states, and a table. It uses Angular signals and `httpResource()` for reactive reads. The example uses DummyJSON's public product endpoint; do not treat demo API data as production data.

## 1. Create the project

```bash
ng new ng-dashboard --routing --style=css
cd ng-dashboard
ng serve
```

## 2. Define the API model

```ts title="src/app/dashboard/product.ts"
export interface Product {
  id: number;
  title: string;
  price: number;
  rating: number;
  stock: number;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
```

## 3. Configure HTTP

```ts title="src/app/app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(), provideRouter(routes)],
};
```

`httpResource()` uses Angular's HTTP infrastructure, so register `provideHttpClient()`. Fetch is the default backend in v22.

## 4. Create the dashboard

```ts title="src/app/dashboard/dashboard.ts"
import { CurrencyPipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ProductResponse } from './product';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe],
  template: `
    <main class="dashboard">
      <h1>Product dashboard</h1>
      @if (products.isLoading()) {
        <p role="status">Loading products…</p>
      } @else if (products.error()) {
        <p role="alert">Could not load products. Refresh to try again.</p>
      } @else if (products.hasValue()) {
        <section class="summary" aria-label="Summary">
          <article><h2>Products</h2><p>{{ products.value().total }}</p></article>
          <article><h2>In stock</h2><p>{{ inStock() }}</p></article>
          <article><h2>Average rating</h2><p>{{ averageRating() }}</p></article>
        </section>
        <table>
          <caption>Products in the catalog</caption>
          <thead><tr><th scope="col">Product</th><th scope="col">Price</th><th scope="col">Stock</th></tr></thead>
          <tbody>
            @for (product of products.value().products; track product.id) {
              <tr><th scope="row">{{ product.title }}</th><td>{{ product.price | currency }}</td><td>{{ product.stock }}</td></tr>
            }
          </tbody>
        </table>
      }
    </main>
  `,
  styles: [`
    .dashboard { max-width: 70rem; margin: auto; padding: 1rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 1rem; }
    article { padding: 1rem; border: 1px solid #ddd; border-radius: 0.75rem; }
    table { width: 100%; margin-top: 1.5rem; border-collapse: collapse; }
    th, td { padding: 0.75rem; border-bottom: 1px solid #ddd; text-align: start; }
    @media (max-width: 40rem) { table { font-size: 0.9rem; } }
  `],
})
export class Dashboard {
  protected readonly products = httpResource<ProductResponse>(
    () => 'https://dummyjson.com/products?limit=10',
  );
  protected readonly inStock = computed(() =>
    this.products.hasValue()
      ? this.products.value().products.filter((product) => product.stock > 0).length
      : 0,
  );
  protected readonly averageRating = computed(() => {
    const items = this.products.hasValue() ? this.products.value().products : [];
    return items.length
      ? (items.reduce((sum, product) => sum + product.rating, 0) / items.length).toFixed(1)
      : '—';
  });
}
```

The generated root component can render the dashboard directly, or add it to a route with `loadComponent`.

## 5. Defer a heavy widget

Move an expensive chart or report into a separate standalone component, then defer it:

```html
@defer (on viewport) {
  <app-sales-chart />
} @placeholder {
  <div aria-label="Sales chart loading area"></div>
} @loading (minimum 300ms) {
  <p role="status">Loading chart…</p>
} @error {
  <p role="alert">The chart could not be loaded.</p>
}
```

Use real chart data and a chart library only when the project needs one. A table should remain available for users who cannot interpret the visual chart.

## Production considerations

- Replace the demo API with your own authenticated API.
- Validate and format currency using the right locale.
- Add pagination and server-side filtering for large result sets.
- Show an explicit empty state when the API returns no products.
- Add tests for loading, success and error states with `HttpTestingController`.

## Next steps

- [HTTP Client](/beginner/http/)
- [Resource API](/modern/resource-api/)
- [Component Testing](/testing/component-testing/)
