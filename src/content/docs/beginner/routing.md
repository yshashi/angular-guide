---
title: Routing Basics 🗺️
description: Learn Angular routing - provideRouter, routes, lazy loading with loadComponent, RouterLink, route params as inputs, and functional guards.
sidebar:
  order: 8
---

Routing lets a single-page application show different **pages** for different URLs — `/products`, `/products/42`, `/about` — without reloading the browser. The Angular Router maps each URL to a component and renders it inside a `<router-outlet>`.

## What you'll learn

- How to set up the router with `provideRouter()` and a `routes` array
- How to lazy-load pages with `loadComponent`
- How to navigate with `RouterLink` and from code with `Router`
- How to read route and query parameters as component **inputs**
- How to protect routes with functional guards
- Nested routes, redirects, 404 pages and page titles

## How routing works

```text
URL: /products/42
        │
        ▼
routes: [{ path: 'products/:id', loadComponent: ... }]   ← match the URL
        │
        ▼
<router-outlet />  →  renders ProductDetail with id = '42'
```

## Setting up the router

A project created with `ng new` already has routing set up. Here are the three pieces.

### 1. Define routes

```ts title="app.routes.ts"
import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },
  {
    path: 'about',
    title: 'About us',
    loadComponent: () => import('./about/about').then((m) => m.About), // lazy loaded
  },
  {
    path: 'products',
    title: 'Products',
    loadComponent: () => import('./products/product-list').then((m) => m.ProductList),
  },
  {
    path: 'products/:id',            // :id is a route parameter
    title: 'Product details',
    loadComponent: () => import('./products/product-detail').then((m) => m.ProductDetail),
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',                      // wildcard: anything not matched above
    title: 'Page not found',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound),
  },
];
```

- `path` has **no leading slash**. `''` is the home page.
- `title` sets the browser tab title (important for accessibility).
- The router uses the **first** route that matches, so put the `**` wildcard **last**.
- `redirectTo` with `pathMatch: 'full'` redirects only when the whole URL matches.

### 2. Provide the router

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

```ts title="main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

`withComponentInputBinding()` lets the router pass URL parameters straight into component **inputs** — we'll use it below. (`ng new` doesn't add it by default; add it yourself.)

### 3. Add a router outlet and navigation

```ts title="app.ts"
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
         ariaCurrentWhenActive="page">Home</a>
      <a routerLink="/products" routerLinkActive="active" ariaCurrentWhenActive="page">Products</a>
      <a routerLink="/about" routerLinkActive="active" ariaCurrentWhenActive="page">About</a>
    </nav>

    <main>
      <router-outlet />   <!-- the matched page renders here -->
    </main>
  `,
  styles: `.active { font-weight: bold; text-decoration: underline; }`,
})
export class App {}
```

## Lazy loading with `loadComponent`

`loadComponent` loads a page's code **only when the user visits it**, which keeps the first download small. Use it for most pages.

```ts
// Named export
{ path: 'about', loadComponent: () => import('./about/about').then((m) => m.About) },

// If the component is the file's default export, the .then() isn't needed
{ path: 'faq', loadComponent: () => import('./faq/faq') },
```

```ts title="faq.ts"
import { Component } from '@angular/core';

@Component({ selector: 'app-faq', template: `<h1>FAQ</h1>` })
export default class Faq {}
```

To lazy-load a whole group of routes, use `loadChildren`:

```ts
{ path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes) },
```

:::tip
`ng generate @angular/core:route-lazy-loading` converts eagerly loaded `component:` routes to `loadComponent` automatically.
:::

## Navigating

### With `RouterLink`

```html
<!-- Static path -->
<a routerLink="/about">About</a>

<!-- Path built from segments: /products/42 -->
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>

<!-- With query params and fragment: /products?sort=price&page=2#top -->
<a routerLink="/products" [queryParams]="{ sort: 'price', page: 2 }" fragment="top">Cheapest first</a>

<!-- Relative link (without a leading slash) from the current route -->
<a routerLink="reviews">Reviews</a>
```

Always use `routerLink` instead of `href` for internal links: `href` reloads the whole app.

### `RouterLinkActive`

`routerLinkActive="active"` adds the class when the link's route is active. By default a link to `/products` is also active on `/products/42`; add `[routerLinkActiveOptions]="{ exact: true }"` for an exact match (always do this for the `/` link). `ariaCurrentWhenActive="page"` sets `aria-current` for screen readers.

### From code with `Router`

```ts title="product-search.ts"
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-search',
  template: `
    <input #q placeholder="Search…" (keyup.enter)="search(q.value)" />
    <button type="button" (click)="openProduct(42)">Open product 42</button>
  `,
})
export class ProductSearch {
  private readonly router = inject(Router);

  protected search(term: string) {
    // /products?q=term
    this.router.navigate(['/products'], { queryParams: { q: term } });
  }

  protected openProduct(id: number) {
    this.router.navigate(['/products', id]);   // or: this.router.navigateByUrl(`/products/${id}`)
  }
}
```

`navigate()` and `navigateByUrl()` return a `Promise<boolean>` that resolves to `true` when navigation succeeds.

## Reading route parameters as inputs

With `withComponentInputBinding()` enabled, the router sets component **inputs** whose names match:

- route parameters (`:id`),
- query parameters (`?sort=price`),
- static `data` and resolved data of the route.

```ts title="product-detail.ts"
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink],
  template: `
    <h1>Product #{{ id() }}</h1>
    <p>Showing tab: {{ tab() ?? 'overview' }}</p>
    <a [routerLink]="['/products', nextId()]">Next product →</a>
  `,
})
export class ProductDetail {
  readonly id = input.required<string>();   // from :id  (URL values are always strings)
  readonly tab = input<string>();           // from ?tab=reviews
  protected readonly nextId = computed(() => Number(this.id()) + 1);
}
```

When you click "Next product", Angular **reuses** the same component and simply updates the `id` input. Because inputs are signals, anything derived with `computed()` (or loaded with `httpResource()`, see [HTTP](/beginner/http/)) updates automatically.

To convert the string, use an input `transform`:

```ts
import { numberAttribute } from '@angular/core';

readonly id = input.required({ transform: numberAttribute }); // id() is a number
```

:::note[Without input binding: `ActivatedRoute`]
You can also read parameters by injecting `ActivatedRoute`:

```ts
private readonly route = inject(ActivatedRoute);
protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
// or a one-off read: this.route.snapshot.paramMap.get('id')
```

Input binding is shorter and is the recommended approach.
:::

## Nested (child) routes

A route can have `children`. The parent component renders its own `<router-outlet />` for the child:

```ts title="settings.routes.ts"
import { Routes } from '@angular/router';
import { SettingsLayout } from './settings-layout';
import { Profile } from './profile';
import { Security } from './security';

export const settingsRoutes: Routes = [
  {
    path: 'settings',
    component: SettingsLayout,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: Profile, title: 'Profile settings' },     // /settings/profile
      { path: 'security', component: Security, title: 'Security settings' }, // /settings/security
    ],
  },
];
```

```ts title="settings-layout.ts"
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <aside>
      <a routerLink="profile" routerLinkActive="active">Profile</a>
      <a routerLink="security" routerLinkActive="active">Security</a>
    </aside>
    <section>
      <router-outlet />
    </section>
  `,
})
export class SettingsLayout {}
```

### Parameter inheritance (changed in v22)

Since Angular 22, a child route **inherits the parameters and data of all its parent routes** by default (`paramsInheritanceStrategy: 'always'`). For example, with `users/:userId` → child `posts/:postId`, the child component can declare both `userId` and `postId` inputs.

:::note[Angular 21 and earlier]
The old default was `'emptyOnly'`: children only inherited parent params in special cases (empty-path or component-less parents). To keep that behaviour in v22, use `provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }))`.
:::

## Protecting routes with guards

A **guard** is a function the router calls before entering (or leaving) a route. It can return:

| Return value | Effect |
|---|---|
| `true` | Allow navigation |
| `false` | Cancel navigation |
| A `UrlTree` (e.g. `router.createUrlTree(['/login'])`) or `RedirectCommand` | Redirect somewhere else |
| A `Promise` or `Observable` of the above | Wait for an async answer |

### `canActivate`: may the user enter?

```bash
ng generate guard auth   # choose CanActivate
```

```ts title="auth-guard.ts"
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  // Redirect to /login?returnUrl=/the/page/they/wanted
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

```ts title="auth.ts"
import { Service, signal } from '@angular/core';

@Service()
export class Auth {
  readonly isLoggedIn = signal(false);
}
```

```ts
{
  path: 'account',
  canActivate: [authGuard],
  loadComponent: () => import('./account/account').then((m) => m.Account),
},
```

Guards are plain functions, so you can use `inject()` inside them. Redirect by **returning** a `UrlTree` — don't call `router.navigate()` and return `false`.

### `canDeactivate`: may the user leave?

```ts title="unsaved-changes-guard.ts"
import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;
```

```ts
{ path: 'editor', component: Editor, canDeactivate: [unsavedChangesGuard] },
```

Other guard types: `canActivateChild` (runs for every child route) and `canMatch` (decides whether a route is even considered — useful for feature flags). See [Advanced Routing](/intermediate/advanced-routing/).

:::caution[Guards are UX, not security]
Guards run in the browser and can be bypassed. Always check permissions on the server too.
:::

## Practical example: a small catalogue

```ts title="catalog.routes.ts"
import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: 'catalog',
    title: 'Catalog',
    loadComponent: () => import('./catalog-list').then((m) => m.CatalogList),
  },
  {
    path: 'catalog/:slug',
    title: 'Product',
    loadComponent: () => import('./catalog-item').then((m) => m.CatalogItem),
  },
];
```

```ts title="catalog-data.ts"
export interface CatalogItemData {
  slug: string;
  name: string;
  description: string;
}

export const CATALOG: CatalogItemData[] = [
  { slug: 'keyboard', name: 'Keyboard', description: 'Clicky mechanical keyboard.' },
  { slug: 'mouse', name: 'Mouse', description: 'Wireless and ergonomic.' },
];
```

```ts title="catalog-list.ts"
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATALOG } from './catalog-data';

@Component({
  selector: 'app-catalog-list',
  imports: [RouterLink],
  template: `
    <a routerLink="." [queryParams]="{ sort: 'name' }">Sort by name</a>
    <ul>
      @for (item of items(); track item.slug) {
        <li><a [routerLink]="[item.slug]">{{ item.name }}</a></li>
      }
    </ul>
  `,
})
export class CatalogList {
  readonly sort = input<string>();   // ?sort=name
  protected readonly items = computed(() =>
    this.sort() === 'name' ? [...CATALOG].sort((a, b) => a.name.localeCompare(b.name)) : CATALOG,
  );
}
```

```ts title="catalog-item.ts"
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATALOG } from './catalog-data';

@Component({
  selector: 'app-catalog-item',
  imports: [RouterLink],
  template: `
    @if (item(); as item) {
      <h1>{{ item.name }}</h1>
      <p>{{ item.description }}</p>
    } @else {
      <p>Sorry, we couldn't find "{{ slug() }}".</p>
    }
    <a routerLink="/catalog">← Back to catalog</a>
  `,
})
export class CatalogItem {
  readonly slug = input.required<string>();   // :slug
  protected readonly item = computed(() => CATALOG.find((i) => i.slug === this.slug()));
}
```

## Common mistakes

| Mistake | Fix |
|---|---|
| `path: '/about'` | No leading slash in route paths: `path: 'about'`. |
| Wildcard `**` route first | Put it **last** — the first match wins. |
| `href="/about"` for internal links | Use `routerLink` (no full page reload). |
| Route inputs are always `undefined` | Add `withComponentInputBinding()` and make sure input names match the param names. |
| "Can't bind to 'routerLink'" | Import `RouterLink` (and `RouterOutlet`, `RouterLinkActive`) in the component. |
| Home link always "active" | Add `[routerLinkActiveOptions]="{ exact: true }"`. |
| Returning `false` then calling `navigate()` in a guard | Return `router.createUrlTree([...])` instead. |

## Best practices

- Lazy load pages with `loadComponent` / `loadChildren`.
- Give every route a `title`.
- Use `withComponentInputBinding()` and `input()` for params; derive data with `computed()` or `httpResource()`.
- Keep guards small and functional (`CanActivateFn`), using `inject()` for services.
- Always have a `**` "not found" route.

## Key takeaways

- `provideRouter(routes)` + `<router-outlet />` + `routerLink` is all you need to start.
- `loadComponent` lazy-loads a page; `children` creates nested layouts.
- With `withComponentInputBinding()`, route params, query params and data arrive as component inputs.
- Since v22, child routes inherit all parent params by default.
- Guards return `true`, `false` or a redirect `UrlTree`.

## Next steps

1. [Forms](/beginner/forms/) — collect user input
2. [HTTP Client](/beginner/http/) — load data for your pages
3. [Advanced Routing](/intermediate/advanced-routing/) — resolvers, `canMatch`, route providers, preloading and view transitions
