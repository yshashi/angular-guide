---
title: Standalone Migration 📦
description: Migrate from NgModule-based to standalone Angular components
sidebar:
  order: 2
---

Since Angular 19, standalone components are the default — new components no longer need `standalone: true` in their decorator. If your codebase still relies on `NgModule`-based architecture, migrating to standalone gives you simpler code, better tree-shaking, and alignment with Angular's future direction.

## 🎯 Why Migrate to Standalone?

NgModules served Angular well for years, but they introduced coupling, boilerplate, and indirection that standalone components eliminate:

| Aspect | NgModule-based | Standalone |
|--------|---------------|------------|
| Declaration location | Registered in a module | Self-contained in component |
| Dependency imports | Module-level imports array | Component-level imports array |
| Tree-shaking | Module-level (coarse) | Component-level (fine-grained) |
| Boilerplate | High (module + component) | Low (component only) |
| Lazy loading | Requires loadChildren with module | Direct loadComponent |
| Default since | — | Angular 19 |

:::tip
Standalone migration is the **first step** in any Angular modernization effort. Once your components are standalone, other migrations (signals, inject, control flow) become easier.
:::

## 🤖 Automated Migration with Schematics

Angular provides an official schematic that automates most of the migration. This is the recommended approach for any project with more than a handful of components.

```bash
# Run the standalone migration schematic
ng generate @angular/core:standalone
```

The schematic runs in three phases — it will prompt you to choose which phase to execute:

1. **Convert declarations to standalone** — adds `imports` to each component/directive/pipe
2. **Remove unnecessary NgModules** — deletes modules that only re-export standalone components
3. **Bootstrap with standalone API** — replaces `platformBrowserDynamic().bootstrapModule()` with `bootstrapApplication()`

:::note
Run each phase separately and verify your app builds after each one. This makes it easier to catch and fix issues incrementally.
:::

```bash
# Phase 1: Convert components to standalone
ng generate @angular/core:standalone --mode=convert-to-standalone

# Verify
ng build

# Phase 2: Remove empty NgModules
ng generate @angular/core:standalone --mode=prune-modules

# Verify
ng build

# Phase 3: Switch to standalone bootstrap
ng generate @angular/core:standalone --mode=standalone-bootstrap

# Verify
ng build
```

## 📝 Manual Migration: Step by Step

For smaller projects or when you want full control, here's the manual approach.

### Step 1: Convert a Component to Standalone

**Before (NgModule-based):**

```typescript
// hero.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true, // was needed pre-v19
  template: `<h1>{{ title }}</h1>`,
})
export class HeroComponent {
  title = 'Hero Works!';
}

// hero.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero.component';

@NgModule({
  declarations: [HeroComponent],
  imports: [CommonModule],
  exports: [HeroComponent],
})
export class HeroModule {}
```

**After (Standalone, Angular 19+):**

```typescript
// hero.component.ts — that's it, no module needed
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  template: `<h1>{{ title }}</h1>`,
})
export class HeroComponent {
  title = 'Hero Works!';
}
```

Notice that in Angular 19+, you don't even need `standalone: true` — it's the default.

### Step 2: Add Direct Imports to Components

Standalone components must import their own dependencies directly, instead of relying on a parent module:

```typescript
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HeroCardComponent } from './hero-card.component';

@Component({
  selector: 'app-hero-list',
  imports: [DatePipe, RouterLink, MatButtonModule, HeroCardComponent],
  template: `
    <h2>Heroes</h2>
    @for (hero of heroes; track hero.id) {
      <app-hero-card [hero]="hero" />
    }
    <a routerLink="/add">Add Hero</a>
    <p>Last updated: {{ lastUpdated | date:'short' }}</p>
  `,
})
export class HeroListComponent {
  heroes = [
    { id: 1, name: 'Windstorm' },
    { id: 2, name: 'Bombasto' },
  ];
  lastUpdated = new Date();
}
```

### Step 3: Migrate Module Providers

NgModules often provide services and configuration. These move to the `bootstrapApplication()` call or to route-level providers.

**Before (NgModule providers):**

```typescript
// app.module.ts
@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    MyService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**After (Standalone bootstrap):**

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
});
```

:::tip
Replace class-based interceptors with functional interceptors when migrating. The `withInterceptors()` helper works with the modern `HttpInterceptorFn` type.
:::

### Step 4: Migrate Interceptors to Functional Style

**Before (Class-based interceptor):**

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next.handle(authReq);
  }
}
```

**After (Functional interceptor):**

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};
```

### Step 5: Migrate Lazy-Loaded Modules to Lazy Components

**Before (Lazy module loading):**

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
  },
];
```

**After (Lazy component routes):**

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin.component').then((m) => m.AdminComponent),
  },
  // Or load child routes directly
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
];
```

The route file for child routes looks like this:

```typescript
// dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics.component').then((m) => m.AnalyticsComponent),
  },
];
```

## ⚡ Migrating Common Module Patterns

### SharedModule → Direct Imports

**Before:**

```typescript
@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  declarations: [SpinnerComponent, HighlightDirective, TruncatePipe],
  exports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    SpinnerComponent, HighlightDirective, TruncatePipe,
  ],
})
export class SharedModule {}
```

**After:** Delete `SharedModule` entirely. Each consumer imports exactly what it needs:

```typescript
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, SpinnerComponent, TruncatePipe],
  template: `...`,
})
export class ProfileComponent {}
```

### CoreModule Providers → bootstrapApplication

**Before:**

```typescript
@NgModule({
  providers: [
    AuthService,
    LoggingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
})
export class CoreModule {}
```

**After:** Move these to `bootstrapApplication()` providers:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    // AuthService and LoggingService use providedIn: 'root' — no registration needed
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
});
```

:::note
Services using `providedIn: 'root'` don't need to be listed anywhere — they're automatically available. Only register services that use custom providers or factory functions.
:::

### Feature Modules → Route-Level Providers

```typescript
// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [AdminService, AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./user-management.component').then((m) => m.UserManagementComponent),
      },
    ],
  },
];
```

## 🐛 Common Pitfalls

### Missing Imports

The most common issue: a component uses a directive or pipe in its template but doesn't list it in `imports`. The compiler will give you a clear error:

```
NG8001: 'app-hero-card' is not a known element.
```

Fix: add the missing component to the `imports` array.

### Circular Dependencies

When two standalone components import each other, you'll get circular dependency errors. Solutions:
- Extract shared logic into a separate component or service
- Use `forwardRef()` as a last resort

### Duplicate Providers

When migrating from modules to standalone, be careful not to provide the same service in multiple places (both `bootstrapApplication` and route-level providers), which can create multiple instances.

## ✅ Migration Verification Checklist

After migrating, verify the following:

- [ ] `ng build` succeeds with zero errors
- [ ] No remaining `@NgModule` declarations (except third-party)
- [ ] `main.ts` uses `bootstrapApplication()` instead of `platformBrowserDynamic()`
- [ ] All lazy routes use `loadComponent` or `loadChildren` with route files
- [ ] All unit tests pass
- [ ] Application boots and renders correctly
- [ ] Services with `providedIn: 'root'` are not manually registered
- [ ] No `SharedModule` or `CoreModule` remaining
