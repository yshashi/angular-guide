---
title: Standalone Components 🏗️
description: Standalone components, directives and pipes in Angular 22 — imports, bootstrapping, lazy loading, providers, and migrating away from NgModules.
sidebar:
  order: 1
---

Every component, directive and pipe you create in Angular 22 is **standalone**. A standalone component lists what it needs in its own `imports` array, so you no longer need an `NgModule` to declare it, and the whole app starts from a single root component. Standalone is the default since v19, so you never have to write `standalone: true`.

## What you'll learn

- What "standalone" means and how the `imports` array works
- How a standalone app is bootstrapped (`main.ts` + `app.config.ts`)
- How to lazy load components and route groups without modules
- Where to register providers (app, route, component)
- How to keep using existing NgModules and migrate old code

## The idea in one example

A component declares its template dependencies directly:

```ts title="user-card.ts"
import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InitialsPipe } from './initials-pipe';
import { Highlight } from './highlight';

@Component({
  selector: 'app-user-card',
  imports: [DatePipe, InitialsPipe, Highlight],
  template: `
    <article appHighlight="lightblue">
      <h3>{{ name() | initials }}</h3>
      <p>Joined {{ joined() | date: 'mediumDate' }}</p>
    </article>
  `,
})
export class UserCard {
  readonly name = input.required<string>();
  readonly joined = input.required<Date>();
}
```

Directives and pipes are standalone too:

```ts title="initials-pipe.ts"
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('');
  }
}
```

```ts title="highlight.ts"
import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: { '[style.backgroundColor]': 'color()' },
})
export class Highlight {
  readonly color = input('yellow', { alias: 'appHighlight' });
}
```

To use `UserCard` somewhere else, import the class:

```ts
@Component({
  selector: 'app-team',
  imports: [UserCard],
  template: `<app-user-card name="Ada Lovelace" [joined]="since" />`,
})
export class Team {
  protected readonly since = new Date(2024, 0, 15);
}
```

:::tip
Components in these examples have no `changeDetection` setting. **OnPush is the default since v22**, which works perfectly with signals and `input()`.
:::

## What goes in `imports`?

| You use in the template… | Import… |
|---|---|
| Another component (`<app-user-card>`) | The component class (`UserCard`) |
| A custom directive (`appHighlight`) | The directive class (`Highlight`) |
| A pipe (`date`, `currency`, `async`) | The pipe class (`DatePipe`, `CurrencyPipe`, `AsyncPipe`) |
| Router links / outlet | `RouterLink`, `RouterLinkActive`, `RouterOutlet` |
| Reactive forms (`[formGroup]`) | `ReactiveFormsModule` (NgModules are allowed in `imports`) |
| Signal Forms (`[formField]`) | `FormField` |
| `@if`, `@for`, `@switch`, `@defer`, `@let` | **Nothing** — control flow is built into the template syntax |

You do **not** need `CommonModule` for control flow, and you can import only the pipes you use (for example `DatePipe`) instead of the whole module.

:::caution[Forgot an import?]
If you see `NG8001: 'app-user-card' is not a known element`, the component is missing from the `imports` array of the component whose template uses it. Unknown pipes and unknown property bindings are reported the same way at compile time.
:::

## Bootstrapping a standalone app

A new project (`ng new my-app`) starts the app from the root component and a config object:

```ts title="src/main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

```ts title="src/app/app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
  ],
};
```

```ts title="src/app/app.ts"
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav><a routerLink="/admin">Admin</a></nav>
    <router-outlet />
  `,
})
export class App {}
```

Features are turned on with `provide*()` functions instead of importing modules: `provideRouter()`, `provideHttpClient()`, `provideClientHydration()`, and so on. New apps are zoneless by default, so there is no `zone.js` polyfill — see [Zoneless Angular](/modern/zoneless/).

## Lazy loading without NgModules

### Lazy routes

Load a single component or a whole group of routes on demand:

```ts title="app.routes.ts"
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
];
```

```ts title="admin/admin.routes.ts"
import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./admin-home').then((m) => m.AdminHome) },
  { path: 'users', loadComponent: () => import('./user-admin').then((m) => m.UserAdmin) },
];
```

If the file uses a **default export** (`export default class Dashboard {}`), you can shorten it to `loadComponent: () => import('./dashboard/dashboard')`.

### Lazy parts of a template

Use `@defer` to split a component (and everything it imports) into its own chunk that loads when needed:

```html
@defer (on viewport) {
  <app-sales-chart />
} @placeholder {
  <div class="chart-skeleton"></div>
}
```

See [Control Flow → `@defer`](/modern/control-flow/#lazy-loading-with-defer) for all triggers.

### Lazy services

`injectAsync()` (stable in v22) downloads a service's code only when you first call it:

```ts
import { Component, injectAsync, onIdle } from '@angular/core';

@Component({
  selector: 'app-report',
  template: `<button type="button" (click)="export()">Export</button>`,
})
export class Report {
  private readonly exporter = injectAsync(
    () => import('./report-exporter').then((m) => m.ReportExporter),
    { prefetch: onIdle }, // optional: start downloading when the browser is idle
  );

  protected async export() {
    const exporter = await this.exporter();
    exporter.export();
  }
}
```

The lazy service must be auto-provided (`@Service()` or `@Injectable({ providedIn: 'root' })`).

## Where do providers go?

| Scope | Where | Lifetime |
|---|---|---|
| Whole app (singleton) | `@Service()` on the class — nothing else needed | App |
| Whole app, configured | `providers` in `app.config.ts` (`provideHttpClient()`, tokens, …) | App |
| One lazy area | `providers` on a `Route` | While that route tree exists (an environment injector per route) |
| One component and its children | `providers` in `@Component` | Per component instance |

```ts
import { Component, Service, inject, signal } from '@angular/core';

@Service()
export class CartStore {
  readonly items = signal<string[]>([]);
}

// Not auto-provided: each <app-editor> gets its own instance
@Service({ autoProvided: false })
export class EditorState {
  readonly dirty = signal(false);
}

@Component({
  selector: 'app-editor',
  providers: [EditorState],
  template: `…`,
})
export class Editor {
  private readonly cart = inject(CartStore);
  private readonly state = inject(EditorState);
}
```

:::note[Angular 21 and earlier]
`@Service()` is new in v22. Earlier versions use `@Injectable({ providedIn: 'root' })` for app-wide singletons and plain `@Injectable()` for services you provide yourself. Both still work in v22.
:::

## Working with existing NgModules

Standalone and NgModule code mix freely:

- **Use an NgModule inside a standalone component** — add it to `imports` (e.g. `ReactiveFormsModule` or a library's module).
- **Use a standalone component inside an NgModule** — add it to the module's `imports` (not `declarations`).
- **Use a module's providers at bootstrap** — wrap it with `importProvidersFrom()`:

```ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { LegacyModule } from './legacy/legacy-module';

export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(LegacyModule)],
};
```

Components that are still declared in an NgModule must say `standalone: false`. That is the only time you write the `standalone` flag.

## Migrating an NgModule app

The Angular CLI ships a schematic that does the work in three passes. Run it, check the app builds and tests pass, commit, then run the next pass:

```bash
ng generate @angular/core:standalone
# 1. "Convert all components, directives and pipes to standalone"
# 2. "Remove unnecessary NgModule classes"
# 3. "Bootstrap the application using standalone APIs"
```

Related migrations that pair well with it:

```bash
ng generate @angular/core:control-flow         # *ngIf/*ngFor → @if/@for
ng generate @angular/core:inject               # constructor injection → inject()
ng generate @angular/core:route-lazy-loading   # eager routes → loadComponent
ng generate @angular/core:cleanup-unused-imports
```

See [Migrating to Standalone](/migration/standalone/) for a step-by-step walkthrough.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing `standalone: true` | Remove it — it's the default. |
| Importing `CommonModule` just for `*ngIf`/`*ngFor` | Use `@if` / `@for` (no import needed). `NgIf`/`NgForOf` are deprecated. |
| Adding a standalone component to `declarations` | Put it in `imports` instead. |
| Importing a big module to use one pipe | Import the single pipe class (`DatePipe`). |
| Referencing a `@defer`-ed component elsewhere in the same file | Then it can't be split out; use it only inside the `@defer` block. |
| Expecting `HttpClientModule` / `RouterModule.forRoot()` | Use `provideHttpClient()` / `provideRouter()` in `app.config.ts`. |

## Key takeaways

- Every component, directive and pipe is standalone by default; never write `standalone: true`.
- A component's `imports` array lists exactly what its template uses.
- Apps start with `bootstrapApplication(App, appConfig)` and configure features with `provide*()` functions.
- Lazy load with `loadComponent`, `loadChildren`, `@defer`, and `injectAsync()`.
- NgModules still work and can be mixed in; `ng generate @angular/core:standalone` migrates old apps.

## Next steps

- [Angular Signals](/modern/signals/) — the reactive core of modern Angular
- [Control Flow](/modern/control-flow/) — `@if`, `@for`, `@switch`, `@defer`
- [Dependency Injection](/advanced/dependency-injection/) — providers and injectors in depth
