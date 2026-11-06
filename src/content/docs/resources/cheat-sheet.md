---
title: Angular Cheat Sheet ⚡
description: A practical Angular 22 quick reference for CLI commands, components, signals, templates, DI, routing, HTTP, Signal Forms, testing and SSR.
sidebar:
  order: 3
---

Use this page as a compact reference while working through the guide. It targets Angular 22.2; check the short version notes when maintaining an older project.

## Create and run a project

```bash
ng new my-app                 # standalone, zoneless, Vitest by default
cd my-app
ng serve                      # development server
ng test                       # Vitest unit tests
ng build                      # production build
ng update @angular/core @angular/cli
```

Add SSR to an existing app with `ng add @angular/ssr`. Generate code with `ng generate component products/product-list`, `ng generate service data/catalog`, or `ng generate ai-config`.

Angular 22 supports Node.js `^22.22.3 || ^24.15.0 || ^26` and TypeScript `>=6.0 <6.1`. See [Setup](/setup/) and [Version Upgrades](/migration/version-upgrade/).

## Component

```ts title="counter.ts"
import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button type="button" (click)="decrement()">−</button>
    <span>{{ count() }} / {{ doubled() }}</span>
    <button type="button" (click)="increment()">+</button>
  `,
})
export class Counter {
  readonly initial = input(0);
  readonly changed = output<number>();
  protected readonly count = signal(this.initial());
  protected readonly doubled = computed(() => this.count() * 2);

  protected increment() {
    this.count.update((value) => value + 1);
    this.changed.emit(this.count());
  }

  protected decrement() {
    this.count.update((value) => value - 1);
    this.changed.emit(this.count());
  }
}
```

Standalone is the default: do not add `standalone: true`. OnPush is the default in Angular 22, so explicit change-detection metadata is usually unnecessary. For template-only members use `protected`.

| API | Use |
|---|---|
| `input<T>(initial)` | Optional signal input |
| `input.required<T>()` | Required signal input |
| `output<T>()` | Event output |
| `model<T>(initial)` | Two-way model input/output |
| `viewChild(locator)` / `viewChildren(locator)` | Signal-based view queries |
| `contentChild(locator)` / `contentChildren(locator)` | Signal-based content queries |

## Signals and reactive state

```ts
const count = signal(0);
const double = computed(() => count() * 2);
count.set(1);
count.update((value) => value + 1);
```

Use `linkedSignal()` for writable state that resets when its source changes. Use `effect()` for side effects such as syncing to `localStorage`, not for copying one signal into another. `resource()`, `rxResource()` and `httpResource()` are stable in v22; `debounced()` is experimental.

## Template control flow

```html
@if (user(); as currentUser) {
  <p>Hello, {{ currentUser.name }}</p>
} @else {
  <p>Please sign in.</p>
}

@for (product of products(); track product.id) {
  <app-product-card [product]="product" />
} @empty {
  <p>No products found.</p>
}

@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error /> }
  @default { <app-results /> }
}

@let total = price() * quantity();
<p>{{ total | currency }}</p>
```

`NgIf`, `NgFor` and `NgSwitch` are deprecated; use `@if`, `@for` and `@switch`. Always use a stable `track` key for repeated items.

## Dependency injection

```ts
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Service()
export class CatalogApi {
  private readonly http = inject(HttpClient);
}
```

Use `@Service()` for a root-provided service in v22. `@Injectable({ providedIn: 'root' })` remains available, including for constructor injection and older-version compatibility. `inject()` must run in an injection context, such as a field initializer, provider factory or constructor.

## Routing

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'products/:id', loadComponent: () => import('./product/product').then((m) => m.Product) },
  { path: '**', redirectTo: '' },
];
```

Register with `provideRouter(routes, withComponentInputBinding())`. Route parameters can then bind to `input()` properties. In v22, `paramsInheritanceStrategy` defaults to `'always'`.

## HTTP

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

`HttpClient` uses Fetch by default. `withFetch()` is deprecated; use `withXhr()` only when upload progress reporting is required. Use `httpResource()` for reactive reads, `HttpClient` for imperative requests and mutations, and functional interceptors with `withInterceptors()`.

## Signal Forms

```ts
import { form, FormField, required } from '@angular/forms/signals';
import { Component, signal } from '@angular/core';

@Component({
  imports: [FormField],
  template: `
    <form (submit)="save($event)">
      <label>
        Email
        <input type="email" [formField]="profileForm.email" />
      </label>
      @if (profileForm.email().touched() && profileForm.email().invalid()) {
        <p>{{ profileForm.email().errors()[0]?.message }}</p>
      }
      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileEditor {
  private readonly model = signal({ email: '' });
  protected readonly profileForm = form(this.model, (path) => {
    required(path.email);
  });

  protected save(event: SubmitEvent) {
    event.preventDefault();
    if (this.profileForm().valid()) console.log(this.model());
  }
}
```

Signal Forms are stable in v22. Import `FormField` and bind with `[formField]` (not `[field]`). See [Signal Forms](/modern/signal-forms/) for validation, async operations, custom controls and submission.

## Testing with Vitest

```ts
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Counter } from './counter';

describe('Counter', () => {
  it('creates', async () => {
    await TestBed.configureTestingModule({ imports: [Counter] }).compileComponents();
    const fixture = TestBed.createComponent(Counter);
    fixture.componentRef.setInput('initial', 2);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

New projects use Vitest by default since Angular 21. For HTTP tests, provide `provideHttpClient()` and `provideHttpClientTesting()`, then inject `HttpTestingController`. See [Unit Testing](/testing/unit-testing/).

## SSR and hydration

- Add SSR: `ng new my-app --ssr` or `ng add @angular/ssr`.
- Configure per-route rendering with `RenderMode.Server`, `RenderMode.Prerender` or `RenderMode.Client`.
- Enable hydration using `provideClientHydration()`. Incremental hydration is enabled by default with hydration in v22.
- Use `afterNextRender()` or `isPlatformBrowser()` for browser-only APIs.

## Version notes

- **Angular 21 and earlier:** OnPush is not the default; add `changeDetection: ChangeDetectionStrategy.OnPush` when appropriate. `@Service()` is not available before v22; use `@Injectable({ providedIn: 'root' })`.
- **Angular 20 and earlier:** Vitest is not the default until v21. Zone.js-based change detection is the default.
- For removed APIs and version compatibility, see [Version Upgrades](/migration/version-upgrade/).
