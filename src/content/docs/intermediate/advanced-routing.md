---
title: Advanced Routing 🗺️
description: Angular 22 router in depth — lazy loading, functional guards, resolvers, RedirectCommand, route resources, router events, named outlets, scrolling and view transitions.
sidebar:
  order: 5
---

You already know how to define routes and link between pages (see [Routing basics](/beginner/routing/)). Real apps need more: protecting pages, loading data before a page shows, splitting code per route, showing progress during navigation, side panels with their own URL, and smooth transitions. This page covers all of that with the Angular 22 router.

## What you'll learn

- Configure the router with features like `withComponentInputBinding()` and preloading
- Lazy-load components and child routes
- Protect routes with functional guards and redirect with `RedirectCommand`
- Load data with resolvers — and with the new route resources (developer preview)
- React to router events, use named outlets, control scrolling and add view transitions

## Router setup with features

Everything is configured in `app.config.ts` with `provideRouter()` plus optional **features**:

```ts title="app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules, provideRouter, withComponentInputBinding,
  withInMemoryScrolling, withPreloading,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),                 // route params/data → component inputs
      withPreloading(PreloadAllModules),           // download lazy routes in the background
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
```

| Feature | What it does |
|---|---|
| `withComponentInputBinding(options?)` | Binds path params, query params, `data` and resolved data to component `input()`s |
| `withPreloading(PreloadAllModules)` | Preloads lazy routes after the app is stable |
| `withInMemoryScrolling({...})` | Scroll to top / restore position / scroll to `#anchor` |
| `withNavigationErrorHandler(fn)` | One place to handle navigation errors |
| `withRouterConfig({...})` | Options like `paramsInheritanceStrategy`, `onSameUrlNavigation` |
| `withViewTransitions()` | Animate between routes with the View Transitions API (developer preview) |
| `withRouterResources()` | Enable route `resources` (developer preview, v22.2) |
| `withHashLocation()` | `/#/path` URLs for static hosts without rewrite rules |
| `withDebugTracing()` | Log every router event to the console (development only) |

## Lazy loading

Lazy loading splits each feature into its own JavaScript chunk that is downloaded only when the user visits it.

```ts title="app.routes.ts"
import { Routes } from '@angular/router';
import { Home } from './home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },                 // eager: landing page
  { path: 'settings', loadComponent: () => import('./settings/settings') },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes') },
  { path: '**', loadComponent: () => import('./not-found') },
];
```

```ts title="settings/settings.ts"
@Component({ selector: 'app-settings', template: `…` })
export default class Settings {} // default export → no `.then(m => m.Settings)` needed
```

```ts title="admin/admin.routes.ts"
import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./admin-home') },
  { path: 'users', loadComponent: () => import('./admin-users') },
] satisfies Routes;
```

- Use **eager** routes for the landing page and **lazy** routes for everything else.
- Loader functions run in the route's injection context, so you can `inject()` services inside them (e.g. pick a component based on a feature flag).
- Route-level `providers: [...]` create services scoped to that part of the app.
- To lazy-load *part* of a page instead of a whole route, use [`@defer`](/modern/control-flow/).

## Route data as component inputs

With `withComponentInputBinding()`, a routed component can receive path params, query params, static `data` and resolved data as inputs — no `ActivatedRoute` needed:

```ts title="user-detail.ts"
import { Component, input } from '@angular/core';
import { User } from './user';

@Component({
  selector: 'app-user-detail',
  template: `<h1>{{ user().name }}</h1> <p>Tab: {{ tab() ?? 'overview' }}</p>`,
})
export class UserDetail {
  readonly id = input.required<string>(); // from path  users/:id
  readonly tab = input<string>();         // from query ?tab=…
  readonly user = input.required<User>(); // from resolve: { user: … }
}
```

Options (since v22): `withComponentInputBinding({ queryParams: false })` stops binding query params, and `unmatchedInputBehavior: 'undefinedIfStale'` only resets inputs the router previously set.

:::note[Changed in v22: params inheritance]
`paramsInheritanceStrategy` now defaults to `'always'`: child routes see **all** parent params, data and resolved data (e.g. `orgId` in `/org/:orgId/projects/:projectId`). To restore the old behaviour use `withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' })`.
:::

## Guards

**Guards** are functions that decide whether navigation may continue. Generate one with `ng generate guard auth`.

| Guard | Runs when | Typical use |
|---|---|---|
| `canActivate` | Entering a route | Login / permission checks |
| `canActivateChild` | Entering any child of a route | Protect a whole section |
| `canDeactivate` | Leaving a route | "You have unsaved changes" |
| `canMatch` | While matching the URL | Feature flags, role-based variants, keep lazy code from loading |

A guard can return:

- `true` → continue, `false` → cancel (for `canMatch`, `false` means "try the next route"),
- a `UrlTree` or `RedirectCommand` → **redirect**,
- a `Promise` or `Observable` of any of these (the first emitted value is used).

```ts title="auth.guard.ts"
import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : new RedirectCommand(router.parseUrl(`/login?returnUrl=${encodeURIComponent(state.url)}`));
};

// A guard factory: parameterise guards with a plain function
export function roleGuard(role: string): CanActivateFn {
  return () => inject(AuthService).hasRole(role) || inject(Router).parseUrl('/forbidden');
}
```

```ts title="unsaved-changes.guard.ts"
import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;
```

```ts title="feature.guard.ts"
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { FeatureFlags } from './feature-flags';

// v22: the third argument (currentSnapshot) is always passed
export const newDashboardMatch: CanMatchFn = (route, segments, currentSnapshot) =>
  inject(FeatureFlags).newDashboard();
```

```ts title="app.routes.ts"
export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    canActivateChild: [adminChildGuard],
    loadChildren: () => import('./admin/admin.routes'),
  },
  { path: 'profile/edit', component: ProfileEdit, canDeactivate: [unsavedChangesGuard] },

  // Same path, different component depending on a flag
  { path: 'dashboard', component: NewDashboard, canMatch: [newDashboardMatch] },
  { path: 'dashboard', component: OldDashboard },
];
```

Things to know:

- Guards in an array **start together** (async guards run concurrently). The first guard in array order that doesn't return `true` decides the result, so don't make one guard depend on work done by another — share a service instead.
- To redirect, **return** a `UrlTree`/`RedirectCommand`. Don't return `false` and call `router.navigate()` yourself.
- `RedirectCommand` also accepts navigation options: `new RedirectCommand(url, { skipLocationChange: true })`.

:::danger[Guards are not security]
Guard code runs in the user's browser and can be bypassed. Always enforce authorization on the server too.
:::

:::note[Angular 21 and earlier / legacy]
Passing guard or resolver *classes* (e.g. `canActivate: [AuthGuard]`) is deprecated in favour of plain functions, and `canLoad` is deprecated in favour of `canMatch`. Wrap old classes with `mapToCanActivate([AuthGuard])` / `mapToResolve(MyResolver)` while migrating. `router.getCurrentNavigation()` is deprecated too — use the `currentNavigation()` signal. In v22 class implementations of `CanMatch` must declare the third `currentSnapshot` parameter (an `ng update` migration adds it).
:::

## Redirects

```ts
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },        // empty path: always use 'full'
  { path: 'old-users/:id', redirectTo: 'users/:id' },          // params are carried over
  {
    path: 'docs',
    pathMatch: 'full',
    // A redirect function gets a partial snapshot: params, queryParams, data, …
    redirectTo: ({ queryParams }) => (queryParams['v'] === '1' ? '/docs/legacy' : '/docs/latest'),
  },
];
```

Redirect functions may return a string, a `UrlTree`, or a Promise/Observable of those, and they run in an injection context (`inject()` works).

**Throwing `RedirectCommand` (v22.2).** Besides *returning* a `RedirectCommand` from guards and resolvers, you can now *throw* one during a navigation — handy deep inside async code such as a resolver or route-resource loader. The router cancels the current navigation and redirects.

## Resolvers

A **resolver** loads data *before* the route activates, so the component renders with data already available.

```ts title="user.resolver.ts"
import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { User, UserApi } from './user-api';

export const userResolver: ResolveFn<User | RedirectCommand> = async (route) => {
  const api = inject(UserApi);
  const router = inject(Router);
  const user = await api.getUser(route.paramMap.get('id')!);
  return user ?? new RedirectCommand(router.parseUrl('/not-found'));
};

export const userTitle: ResolveFn<string> = (route) => `User ${route.paramMap.get('id')}`;
```

```ts title="app.routes.ts"
{
  path: 'users/:id',
  component: UserDetail,
  resolve: { user: userResolver }, // → input `user` (with withComponentInputBinding)
  title: userTitle,                 // page title can be static or resolved
}
```

Handle failures in one place with `withNavigationErrorHandler()`. Returning a `RedirectCommand` from the handler turns the error into a redirect:

```ts
provideRouter(
  routes,
  withNavigationErrorHandler((error) => {
    console.error('Navigation failed', error.error);
    return new RedirectCommand(inject(Router).parseUrl('/error'));
  }),
);
```

**Trade-offs:** resolvers **block** navigation (show a progress bar — see [Router events](#router-events-and-navigation-state)), and nested resolvers run **one after another**, parent first. If that's a problem, use route resources (next) or load data inside the component with [`httpResource()`](/modern/http-resource-api/).

## Route resources (developer preview)

:::caution[Developer preview — v22.2]
`withRouterResources()`, the `resources` route property and `nonBlocking()` are in developer preview. The API may still change.
:::

Route resources declare signal-based [resources](/modern/resource-api/) on a route. Compared to resolvers they load **in parallel** across all matched routes, can be **non-blocking**, and can be **reloaded** without navigating again.

```ts title="app.config.ts"
provideRouter(routes, withComponentInputBinding(), withRouterResources());
```

```ts title="app.routes.ts"
import { inject, resource } from '@angular/core';
import { RedirectCommand, Router, Routes, nonBlocking } from '@angular/router';

export const routes: Routes = [
  {
    path: 'u/:id',
    component: UserPage,
    resources: (ctx) => {
      const api = inject(UserApi);
      const router = inject(Router);
      return {
        user: resource({
          params: () => ctx.params()['id'] as string, // read only what you need
          loader: async ({ params: id }) => {
            const user = await api.getUser(id);
            if (!user) throw new RedirectCommand(router.parseUrl('/not-found'));
            return user;
          },
        }),
      };
    },
  },
  {
    path: 'reports',
    component: Reports,
    resources: () => ({
      report: nonBlocking(resource({ loader: () => fetchReport() })),
    }),
  },
];
```

- `ctx` exposes `params`, `queryParams`, `fragment` and `data` as **signals**.
- **Blocking** (default): navigation waits; the component input receives the **value** (`input.required<User>()`).
- **`nonBlocking()`**: the page shows immediately; the input receives the **`Resource`** so you can render loading/error states:

```ts title="reports.ts"
@Component({
  selector: 'app-reports',
  template: `
    @if (report().isLoading()) {
      <p>Loading…</p>
    } @else if (report().error()) {
      <p>Could not load the report.</p>
    } @else if (report().hasValue()) {
      <p>Total: {{ report().value().total }}</p>
    }
  `,
})
export class Reports {
  readonly report = input.required<Resource<Report>>();
}
```

To refresh without navigating, read the resource from `ActivatedRoute`: `inject(ActivatedRoute).resources?.['user']?.reload()`.

## Router events and navigation state

The router exposes navigation state as **signals** and a stream of **events**.

```ts title="app.ts"
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (isNavigating()) {
      <div class="progress-bar" role="progressbar" aria-label="Loading page"></div>
    }
    <router-outlet />
  `,
})
export class App {
  private readonly router = inject(Router);

  // currentNavigation() is a signal: non-null while a navigation is in progress
  protected readonly isNavigating = computed(() => !!this.router.currentNavigation());

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => console.log('page view', e.urlAfterRedirects)); // analytics
  }
}
```

Main events in order: `NavigationStart` → `RoutesRecognized` → `GuardsCheckStart/End` → `ResolveStart/End` → `ActivationEnd` → `NavigationEnd`. A navigation can also end with `NavigationCancel`, `NavigationError` or `NavigationSkipped`. `RouteConfigLoadStart/End` fire around lazy loading, and `Scroll` after navigation. `router.lastSuccessfulNavigation()` is a signal too (since v21).

## Named outlets (secondary routes)

A page can have several `<router-outlet>`s. Extra outlets have a **name** and their own segment in the URL, e.g. `/inbox(side:chat/42)` — great for chat panels or side drawers that should survive a refresh.

```html
<main><router-outlet /></main>
<aside><router-outlet name="side" /></aside>

<a [routerLink]="[{ outlets: { side: ['chat', 42] } }]">Open chat</a>
<a [routerLink]="[{ outlets: { side: null } }]">Close chat</a>
```

```ts
{ path: 'chat/:id', component: Chat, outlet: 'side' }

// in code
this.router.navigate([{ outlets: { side: ['chat', id] } }]);
```

Outlets also emit `(activate)` / `(deactivate)` events with the component instance.

## Scroll behaviour

By default the router does **not** touch the scroll position. Enable it with `withInMemoryScrolling()`:

- `scrollPositionRestoration: 'enabled'` — scroll to top on new pages, **restore** the previous position on Back/Forward. (`'top'` always scrolls to top.)
- `anchorScrolling: 'enabled'` — scroll to `#fragment` targets.

Since v21.1 you can opt out per navigation, e.g. when only a tab query param changes:

```ts
this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge', scroll: 'manual' });
```

If your page loads content asynchronously, listen for the `Scroll` router event and call `ViewportScroller.scrollToPosition()` once data has arrived.

## View transitions (developer preview)

:::caution[Developer preview]
`withViewTransitions()` is in developer preview. It uses the browser's View Transitions API and simply navigates without animation in browsers that don't support it.
:::

```ts
provideRouter(
  routes,
  withViewTransitions({
    onViewTransitionCreated: ({ transition }) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        transition.skipTransition(); // respect the user's motion settings
      }
    },
  }),
);
```

The default is a cross-fade. Customise it in your **global** stylesheet (component styles are encapsulated and can't reach the pseudo-elements):

```css title="styles.css"
.hero { view-transition-name: hero; }

::view-transition-old(root) { animation: 150ms ease-out both fade-out; }
::view-transition-new(root) { animation: 250ms ease-in both fade-in; }

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }
```

:::note
The old `@angular/animations`-based route animations still work but the package is deprecated. Prefer view transitions or CSS with `animate.enter` / `animate.leave`.
:::

## Common mistakes

- **Missing `pathMatch: 'full'`** on empty-path redirects → every URL matches.
- **Wildcard `**` route not last** → routes after it are never reached.
- **Navigating inside a guard** instead of returning a `UrlTree`/`RedirectCommand`.
- **Relying on guards for security** — the server must check permissions too.
- **Heavy, nested resolvers** that make navigation feel frozen — show progress, or use non-blocking resources / `httpResource()`.
- **Reading whole param objects** in route-resource `params` (`ctx.params()`) — read the specific key to avoid refetching.
- **Defining view-transition CSS in component styles** — put it in global styles.

## Key takeaways

- Configure the router with features: `withComponentInputBinding()`, `withPreloading()`, `withInMemoryScrolling()`, `withNavigationErrorHandler()`.
- Lazy-load with `loadComponent` / `loadChildren` and default exports.
- Guards are small functions; redirect by returning (or, since 22.2, throwing) a `RedirectCommand`.
- Resolvers block navigation; route resources (developer preview) load in parallel and can be non-blocking.
- `router.currentNavigation()` is a signal — perfect for progress bars.

## Next steps

- [Routing basics](/beginner/routing/) — refresher on routes, links and params
- [Resource API](/modern/resource-api/) — the signal-based async primitive behind route resources
- [RxJS in Angular](/intermediate/rxjs/) — working with `router.events`
- [Rendering modes](/ssr/render-modes/) — per-route SSR, prerendering and CSR
