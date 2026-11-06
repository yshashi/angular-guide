---
title: Standalone Migration 📦
description: Migrate NgModule-based Angular apps to standalone components with ng g @angular/core:standalone, replace CommonModule, and move providers to app.config.ts.
sidebar:
  order: 2
---

Standalone components declare their own dependencies in an `imports` array — no `NgModule` needed. They've been the **default since Angular 19**, and every project created with `ng new` in v22 is fully standalone. If your app still has `AppModule`, `SharedModule` and friends, this guide takes you from NgModules to standalone with the official schematic and explains how to finish the job by hand.

**What you'll learn**

- Why standalone is simpler than NgModules
- How to run the three-step `ng g @angular/core:standalone` migration
- How to replace `CommonModule` with exact imports
- How to move module providers (`HttpClientModule`, `RouterModule.forRoot`, interceptors …) to `app.config.ts`
- How to convert lazy-loaded modules, `SharedModule`/`CoreModule`, and tests

## Why migrate?

| | NgModule-based | Standalone |
|---|---|---|
| Where dependencies are declared | In a module's `declarations`/`imports` | In each component's `imports` |
| Finding what a template can use | Search for the module that declares it | Look at the component file |
| Lazy loading | `loadChildren` + a feature module | `loadComponent` or a routes file |
| App bootstrap | `platformBrowser().bootstrapModule(AppModule)` | `bootstrapApplication(App, appConfig)` |
| Boilerplate | Module + component | Component only |
| Default | Before v19 | **v19 and later** |

Standalone is also the foundation for the other modernizations — [signals](/migration/signals/), [control flow and zoneless](/migration/modernization/) are all easier once modules are gone.

:::note[`standalone: true` is no longer needed]
Since v19, components, directives and pipes are standalone unless they say `standalone: false`. In an NgModule-based app you'll see `standalone: false` on every declared class — that's what the migration removes.
:::

## Automatic migration (recommended)

```bash
ng generate @angular/core:standalone
```

The schematic asks which **mode** to run. Run the three modes **in this order**, and build + test + commit after each one:

| Step | Mode (`--mode`) | What it does |
|---|---|---|
| 1 | `convert-to-standalone` | Removes `standalone: false` from components, directives and pipes and adds what each template needs to its `imports` |
| 2 | `prune-ng-modules` | Deletes NgModules that are now empty and removes references to them |
| 3 | `standalone-bootstrap` | Replaces `bootstrapModule(AppModule)` with `bootstrapApplication(...)`, copies root providers, and deletes `AppModule` |

```bash
# Step 1
ng g @angular/core:standalone --mode=convert-to-standalone
npx ng build && npx ng test --no-watch && git commit -am "standalone: convert declarations"

# Step 2
ng g @angular/core:standalone --mode=prune-ng-modules
npx ng build && npx ng test --no-watch && git commit -am "standalone: prune NgModules"

# Step 3
ng g @angular/core:standalone --mode=standalone-bootstrap
npx ng build && npx ng test --no-watch && git commit -am "standalone: bootstrapApplication"
```

Add `--path=src/app/feature` to migrate one folder at a time in a large codebase.

**Before you start**, make sure the project builds without errors (the schematic analyses compiled code), every file is included by a `tsconfig`, and you're on a clean Git branch.

### Step 1 — convert declarations

```ts title="Before: shared.module.ts + greeter.ts"
@NgModule({
  imports: [CommonModule],
  declarations: [Greeter],
  exports: [Greeter],
})
export class SharedModule {}

@Component({
  selector: 'app-greeter',
  template: '<div *ngIf="showGreeting">Hello</div>',
  standalone: false,
})
export class Greeter {
  showGreeting = true;
}
```

```ts title="After"
@NgModule({
  imports: [CommonModule, Greeter], // standalone classes are imported, not declared
  exports: [Greeter],
})
export class SharedModule {}

@Component({
  selector: 'app-greeter',
  template: '<div *ngIf="showGreeting">Hello</div>',
  imports: [NgIf],
})
export class Greeter {
  showGreeting = true;
}
```

Modules that bootstrap a component (your root `AppModule`) are left alone in this step — step 3 handles them.

### Step 2 — remove unnecessary NgModules

A module is deleted when it has no `declarations`, no `providers`, no `bootstrap` components, no class members, and doesn't import a `ModuleWithProviders` (like `RouterModule.forChild(...)`) or another module that must stay. References the schematic can't remove are marked with:

```ts
/* TODO(standalone-migration): clean up removed NgModule reference manually */
```

### Step 3 — switch to `bootstrapApplication`

```ts title="Before: main.ts"
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((e) => console.error(e));
```

```ts title="After: main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((e) => console.error(e));
```

The schematic copies as much of `AppModule`'s `providers` and `imports` as it can into the `bootstrapApplication` call (module imports may end up wrapped in `importProvidersFrom(...)`). Tidy them up afterwards: move them into `app.config.ts` and replace module imports with provider functions (see [Moving module providers](#2-moving-module-providers-to-appconfigts)).

### Limitations

- Code that can't be statically analysed (dynamic metadata, custom wrappers around `TestBed.configureTestingModule`) is skipped.
- Unit tests aren't AOT-compiled, so `imports` added in specs may need manual fixes.
- Generated code may not match your formatting — run Prettier/lint afterwards.

## Replace `CommonModule` with exact imports

After step 1, many components still import `CommonModule` (or every directive like `NgIf`). Two schematics clean this up:

```bash
# 1. Replace CommonModule with the individual directives and pipes each template uses
ng generate @angular/core:common-to-standalone

# 2. Replace *ngIf / *ngFor / *ngSwitch with @if / @for / @switch (no imports needed)
ng generate @angular/core:control-flow
```

```ts title="Before"
@Component({
  selector: 'app-example',
  imports: [CommonModule],
  template: `<div *ngIf="show">{{ data | async | json }}</div>`,
})
export class Example {
  show = true;
  data = Promise.resolve({ message: 'Hello' });
}
```

```ts title="After both schematics (plus signals)"
import { Component, signal } from '@angular/core';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-example',
  imports: [AsyncPipe, JsonPipe],
  template: `
    @if (show()) {
      {{ data | async | json }}
    }
  `,
})
export class Example {
  protected readonly show = signal(true);
  protected readonly data = Promise.resolve({ message: 'Hello' });
}
```

Built-in control flow needs no imports, so after the control-flow migration only **pipes** (and any `NgTemplateOutlet`, `NgComponentOutlet`, etc.) stay in `imports`. Finally, remove anything the compiler reports as unused:

```bash
ng generate @angular/core:cleanup-unused-imports
```

## Manual migration, step by step

For small apps — or to finish what the schematic left — here's what to do by hand.

### 1. Make a component standalone

Delete `standalone: false`, then add every component, directive and pipe its template uses to `imports`:

```ts title="hero-list.ts"
import { Component, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Hero {
  id: number;
  name: string;
}

@Component({
  selector: 'app-hero-card',
  template: `<p>{{ hero().name }}</p>`,
})
export class HeroCard {
  readonly hero = input.required<Hero>();
}

@Component({
  selector: 'app-hero-list',
  imports: [DatePipe, RouterLink, HeroCard],
  template: `
    <h2>Heroes</h2>
    @for (hero of heroes(); track hero.id) {
      <app-hero-card [hero]="hero" />
    } @empty {
      <p>No heroes yet.</p>
    }
    <a routerLink="/heroes/new">Add hero</a>
    <p>Last updated: {{ lastUpdated | date: 'short' }}</p>
  `,
})
export class HeroList {
  protected readonly heroes = signal<Hero[]>([
    { id: 1, name: 'Windstorm' },
    { id: 2, name: 'Bombasto' },
  ]);
  protected readonly lastUpdated = new Date();
}
```

Third-party libraries that still ship NgModules (for example `MatButtonModule`) can go straight into a standalone component's `imports` array.

### 2. Moving module providers to `app.config.ts`

```ts title="Before: app.module.ts"
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

```ts title="After: app.config.ts"
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { GlobalErrorHandler } from './global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
```

Common module → provider replacements:

| NgModule-era code | Standalone replacement |
|---|---|
| `BrowserModule` | Nothing — `bootstrapApplication` includes it |
| `HttpClientModule` (deprecated) | `provideHttpClient()` |
| `HTTP_INTERCEPTORS` class interceptors | `withInterceptors([fn])` (or keep classes with `withInterceptorsFromDi()`) |
| `RouterModule.forRoot(routes, options)` | `provideRouter(routes, withXxx())` features |
| `RouterModule.forChild(routes)` | Export a `Routes` array and lazy-load it with `loadChildren` |
| `APP_INITIALIZER` (deprecated) | `provideAppInitializer(() => ...)` |
| `BrowserAnimationsModule` | Prefer native CSS with `animate.enter`/`animate.leave` (the animations package is deprecated) |
| `ServiceWorkerModule.register(...)` | `provideServiceWorker(...)` |
| Library `XxxModule.forRoot(config)` without a `provideXxx()` function | `importProvidersFrom(XxxModule.forRoot(config))` |

:::tip[Services don't need registering]
Services decorated with `@Service()` (or `@Injectable({ providedIn: 'root' })`) are available everywhere automatically. Delete them from old `providers` arrays — listing them again creates a **second instance**.
:::

### 3. Convert class interceptors to functions

```ts title="Before"
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();
    return next.handle(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
  }
}
```

```ts title="After: auth.interceptor.ts"
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

Can't convert them all yet? Keep the classes registered with `HTTP_INTERCEPTORS` and use `provideHttpClient(withInterceptorsFromDi())` in the meantime.

### 4. Lazy-load components and route files instead of modules

```ts title="Before"
{ path: 'admin', loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule) }
```

```ts title="After: app.routes.ts"
import { Routes } from '@angular/router';

export const routes: Routes = [
  // A single lazy page
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard) },
  // A lazy section with its own child routes
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
];
```

Providers that used to live in a lazy feature module move to the route — they're created when the route is first visited and shared by its children:

```ts title="admin/admin.routes.ts"
import { Routes } from '@angular/router';
import { AdminApi } from './admin-api';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [AdminApi],
    children: [
      { path: '', loadComponent: () => import('./admin-dashboard').then((m) => m.AdminDashboard) },
      { path: 'users', loadComponent: () => import('./user-management').then((m) => m.UserManagement) },
    ],
  },
];
```

`AdminApi` here is declared with `@Service({ autoProvided: false })` (or a plain `@Injectable()`), so it exists only where it's provided.

Already standalone but still eagerly loading route components? The `route-lazy-loading` schematic converts `component: X` routes to `loadComponent` for you:

```bash
ng generate @angular/core:route-lazy-loading
```

### 5. Dissolve `SharedModule` and `CoreModule`

- **`SharedModule`** usually re-exports `CommonModule`, `FormsModule` and a few components. Delete it; each component imports exactly what it uses (for example `imports: [ReactiveFormsModule, Spinner, TruncatePipe]`).
- **`CoreModule`** usually holds singletons and app-wide providers. Root services need nothing (`@Service()`); move the rest (`ErrorHandler`, tokens, interceptors) into `app.config.ts`.

### 6. Update tests

Standalone components go in TestBed's **`imports`**, not `declarations`:

```ts title="hero-list.spec.ts"
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeroList } from './hero-list';

describe('HeroList', () => {
  it('renders heroes', async () => {
    TestBed.configureTestingModule({
      imports: [HeroList],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(HeroList);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Windstorm');
  });
});
```

Replace `RouterTestingModule` (deprecated) with `provideRouter(...)` — or run `ng generate @angular/core:router-testing-module-migration`.

## Common pitfalls

| Problem | Cause | Fix |
|---|---|---|
| `NG8001: 'app-hero-card' is not a known element` | The child isn't in the component's `imports` | Import the component |
| `NG8004: No pipe found with name 'date'` | Pipe not imported | Add `DatePipe` to `imports` |
| `Can't bind to 'formGroup'` | Forms module missing | Add `ReactiveFormsModule` to `imports` |
| A service has two instances | Root service also listed in a `providers` array | Remove it from `providers` |
| `NullInjectorError` after pruning a module | That module had `providers` | Move them to `app.config.ts` or the route's `providers` |
| Circular import between two components | They import each other | Extract shared UI into a third component; `forwardRef()` as a last resort |

## Migration checklist

- [ ] All three schematic modes run, with a build/test/commit after each
- [ ] `main.ts` uses `bootstrapApplication(App, appConfig)`
- [ ] Providers live in `app.config.ts` or route `providers`, using `provideXxx()` functions
- [ ] No `CommonModule` imports left (`common-to-standalone` + `control-flow` run)
- [ ] Lazy routes use `loadComponent` or routes files
- [ ] `SharedModule`/`CoreModule` removed
- [ ] Tests import standalone components and use `provideRouter`
- [ ] `ng build` and `ng test` pass

## Key takeaways

- Run `ng g @angular/core:standalone` three times: `convert-to-standalone` → `prune-ng-modules` → `standalone-bootstrap`.
- Follow up with `common-to-standalone`, `control-flow` and `cleanup-unused-imports`.
- Module providers become `provideXxx()` calls in `app.config.ts`; feature providers move to routes.
- Root services (`@Service()`) never need to be listed in `providers`.

## Next steps

1. **[Signals Migration](/migration/signals/)** — convert `@Input`, `@Output` and queries to signals
2. **[Codebase Modernization](/migration/modernization/)** — control flow, class bindings, zoneless and more
3. **[Standalone Components](/modern/standalone-components/)** — deeper guide to the standalone model
