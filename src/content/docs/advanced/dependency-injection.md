---
title: Advanced DI Patterns 🔧
description: Master Angular 22 dependency injection with @Service, injectAsync, InjectionToken, provider types, hierarchical injectors, resolution modifiers and initializers.
sidebar:
  order: 4
---

**Dependency injection (DI)** is how Angular hands your classes the things they need, such as services, configuration and browser APIs, without them creating those things themselves. You already know the basics: `inject(SomeService)`. This page goes deeper: the new `@Service()` decorator, lazy services with `injectAsync()`, tokens, every provider type, the injector tree and the tools for controlling it.

:::tip[New to DI?]
Start with [Services & DI basics](/beginner/services/), then come back here.
:::

## What you'll learn

- `@Service()` vs `@Injectable()`, including `factory` and `autoProvided: false`
- Lazy-loading services with `injectAsync()`
- `InjectionToken`s, provider types (`useClass`, `useValue`, `useFactory`, `useExisting`, `multi`) and `provideX()` helpers
- How hierarchical injectors resolve dependencies, and the `optional` / `self` / `skipSelf` / `host` modifiers
- App startup work with `provideAppInitializer()` and `provideEnvironmentInitializer()`
- Injection context, `runInInjectionContext()` and writing your own `injectX()` helpers

## `inject()` and the injection context

`inject()` works only in an **injection context**:

- Field initializers and the constructor of a class created by DI (components, directives, pipes, services)
- `useFactory` functions and `InjectionToken` factories
- Router guards, resolvers and `loadComponent`/`loadChildren` functions; HTTP interceptor functions
- Callbacks passed to `provideAppInitializer()` / `provideEnvironmentInitializer()`
- Code inside `runInInjectionContext()`

```ts
@Component({ selector: 'app-cart', template: `{{ cart.count() }} items` })
export class Cart {
  protected readonly cart = inject(CartStore); // ✅ field initializer

  addLater() {
    setTimeout(() => inject(CartStore)); // ❌ NG0203: not in an injection context
  }
}
```

## `@Service()`: the modern way to write services

In v22, `@Service()` (from `@angular/core`, stable) is the shortest way to create an app-wide singleton. It's equivalent to `@Injectable({ providedIn: 'root' })`:

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';

@Service()
export class CartStore {
  private readonly items = signal<string[]>([]);
  readonly count = computed(() => this.items().length);

  add(item: string) {
    this.items.update((list) => [...list, item]);
  }
}
```

A `@Service()` class is:

- a **singleton**, with one instance for the whole application,
- **available everywhere** without registering it anywhere,
- **tree-shakable**, so it's dropped from the bundle if nothing injects it.

### Swapping the implementation with `factory`

`factory` runs in an injection context, so it can `inject()` other things:

```ts title="analytics.ts"
import { InjectionToken, Service, inject, isDevMode } from '@angular/core';

export const ANALYTICS_ENABLED = new InjectionToken<boolean>('ANALYTICS_ENABLED', {
  factory: () => !isDevMode(),
});

@Service({
  factory: () => (inject(ANALYTICS_ENABLED) ? new GoogleAnalytics() : new Analytics()),
})
export class Analytics {
  track(event: string, data?: Record<string, unknown>) {
    // no-op by default
  }
}

class GoogleAnalytics extends Analytics {
  override track(event: string, data?: Record<string, unknown>) {
    console.log('send to GA', event, data);
  }
}
```

### Opting out of root with `autoProvided: false`

When each component (or route) should get **its own instance**, turn off auto-providing and list the class in `providers`:

```ts title="editor.ts"
import { Component, Service, inject, signal } from '@angular/core';

@Service({ autoProvided: false })
export class FormDraft {
  readonly value = signal('');
}

@Component({
  selector: 'app-editor',
  providers: [FormDraft], // a new FormDraft for every <app-editor>
  template: `<textarea [value]="draft.value()" (input)="update($event)"></textarea>`,
})
export class Editor {
  protected readonly draft = inject(FormDraft);

  protected update(e: Event) {
    this.draft.value.set((e.target as HTMLTextAreaElement).value);
  }
}
```

### `@Service()` or `@Injectable()`?

| Need | `@Service()` | `@Injectable()` |
| --- | --- | --- |
| Root singleton, `inject()`-based | ✅ default | `@Injectable({ providedIn: 'root' })` |
| Constructor injection | ❌ | ✅ |
| `factory` | ✅ `factory` | ✅ `useFactory` |
| `useClass` / `useValue` / `useExisting` in the decorator | ❌ | ✅ |
| Non-root scope such as `providedIn: 'platform'` | ❌ | ✅ |
| Libraries that must support Angular 21 or older | ❌ | ✅ |

`@Injectable()` is not deprecated. Use it when you need one of its extra features. Since v22.1 you can convert eligible classes automatically with `ng generate @angular/core:service`.

:::note[Angular 21 and earlier]
`@Service()` doesn't exist before v22. Use `@Injectable({ providedIn: 'root' })`. It behaves the same.
:::

## Lazy-loading services with `injectAsync()`

Some services pull in big libraries (spreadsheets, PDF, charts) but are rarely used. `injectAsync()` (stable since v22.0) moves such a service into its **own lazy chunk** and loads it on first use.

```ts title="report-exporter.ts"
import { Service } from '@angular/core';
import * as XLSX from 'xlsx'; // heavy dependency, only in the lazy chunk

@Service() // must be auto-provided (@Service or providedIn: 'root')
export class ReportExporter {
  export(rows: object[]) {
    /* build and download a spreadsheet with XLSX */
  }
}
```

```ts title="report.ts"
import { Component, injectAsync, onIdle } from '@angular/core';

@Component({
  selector: 'app-report',
  template: `<button (click)="export()">Export to Excel</button>`,
})
export class Report {
  private readonly exporter = injectAsync(
    () => import('./report-exporter').then((m) => m.ReportExporter),
    { prefetch: onIdle }, // optional: start downloading when the browser is idle
  );

  async export() {
    const exporter = await this.exporter(); // loads the chunk on the first call only
    exporter.export([{ id: 1 }]);
  }
}
```

- `injectAsync()` must be called in an injection context and returns a function that returns a `Promise` of the instance.
- If the service is the module's `export default`, pass the import directly: `injectAsync(() => import('./chart-exporter'))`.
- `prefetch` accepts any `() => Promise<void>`, for example `() => onIdle({ timeout: 2000 })` or your own hover trigger.

The lazy file must not be imported statically anywhere else, or the bundler can't split it out.

## Tokens and provider types

### `InjectionToken` for non-class values

Interfaces and primitive values don't exist at runtime, so they need a **token**:

```ts title="tokens.ts"
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  retries: number;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

Give a token a `factory` to make it **self-providing and tree-shakable** (it is `providedIn: 'root'` by default):

```ts
export const WINDOW = new InjectionToken<Window>('WINDOW', {
  factory: () => window,
});

export const API_BASE = new InjectionToken<string>('API_BASE', {
  factory: () => '/api', // can inject() other things here
});
```

Read it with `inject(API_BASE)`. You can still override it in `providers` (handy in tests).

### Provider recipes

```ts title="app.config.ts"
import { ApplicationConfig, inject, isDevMode } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // useClass: inject Logger, receive another class
    { provide: Logger, useClass: isDevMode() ? ConsoleLogger : SilentLogger },
    // useValue: a ready-made value
    { provide: APP_CONFIG, useValue: { apiUrl: '/api', retries: 2 } },
    // useExisting: an alias to another token (same instance)
    { provide: AuditLogger, useExisting: Logger },
    // useFactory: build the value in code (injection context!)
    {
      provide: ApiClient,
      useFactory: () => new ApiClient(inject(HttpClient), inject(APP_CONFIG).apiUrl),
    },
  ],
};
```

| Recipe | Use it when |
| --- | --- |
| `SomeClass` (shorthand for `useClass: SomeClass`) | Providing a class in a narrower scope |
| `useClass` | Swapping an implementation (mock, environment-specific) |
| `useValue` | Config objects, constants |
| `useFactory` | The value needs logic or other dependencies |
| `useExisting` | Two tokens should resolve to the **same** instance |

An **abstract class** makes a great token: it acts as both the type and the DI key, without an extra `InjectionToken`.

```ts
export abstract class Logger {
  abstract log(msg: string): void;
}
```

### Multi providers: plugin points

With `multi: true`, every provider for the token is **collected into an array**:

```ts
export interface SearchProvider {
  name: string;
  search(term: string): string[];
}

export const SEARCH_PROVIDERS = new InjectionToken<SearchProvider[]>('SEARCH_PROVIDERS');

export const searchProviders = [
  { provide: SEARCH_PROVIDERS, multi: true, useValue: docsSearch },
  { provide: SEARCH_PROVIDERS, multi: true, useValue: userSearch },
];

@Service()
export class SearchService {
  private readonly providers = inject(SEARCH_PROVIDERS); // SearchProvider[]

  search(term: string) {
    return this.providers.flatMap((p) => p.search(term));
  }
}
```

### Writing a `provideX()` function

Angular's own APIs (`provideRouter`, `provideHttpClient`) are plain functions returning providers. Do the same for your features, and wrap the result in `makeEnvironmentProviders()` so it can only be used at the application or route level (not in a component's `providers`):

```ts title="feature-flags.ts"
import { EnvironmentProviders, InjectionToken, Service, inject, makeEnvironmentProviders } from '@angular/core';

const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS');

@Service()
export class FeatureFlags {
  private readonly flags = inject(FEATURE_FLAGS, { optional: true }) ?? {};
  isOn(flag: string) {
    return this.flags[flag] ?? false;
  }
}

export function provideFeatureFlags(flags: Record<string, boolean>): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: FEATURE_FLAGS, useValue: flags }]);
}
```

```ts
bootstrapApplication(App, {
  providers: [provideFeatureFlags({ newDashboard: true })],
});
```

## The injector tree

Angular has **two** injector hierarchies, and it searches them in this order:

```text
          ┌────────────────────────── Element injectors ──────────────────────────┐
request → │ this element → parent element → … → root component's element           │
          └────────────────────────────────────────────────────────────────────────┘
                     not found ↓
          ┌──────────────────────── Environment injectors ────────────────────────┐
          │ route injector(s) → root (app) injector → platform injector → NullInjector │
          └────────────────────────────────────────────────────────────────────────┘
                     not found ↓  → error NG0201 (unless optional)
```

| Where you provide | Injector | Lifetime / scope |
| --- | --- | --- |
| `@Service()`, `providedIn: 'root'`, `bootstrapApplication` `providers` | Root environment injector | Whole app, singleton |
| Route `providers: [...]` | Route environment injector | That route and its children (created when first matched) |
| Component/directive `providers` | Element injector | That element and its children (content **and** view) |
| Component `viewProviders` | Element injector | Only that component's **own template**, not projected content |
| `providedIn: 'platform'` | Platform injector | Shared by all apps on the page |

### Route-level providers

```ts title="app.routes.ts"
export const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminStore, provideFeatureFlags({ newDashboard: true })],
    loadComponent: () => import('./admin-page').then((m) => m.AdminPage),
  },
];
```

`AdminStore` (declared with `@Service({ autoProvided: false })`) is shared by everything under `/admin`. By default the route injector is kept after you leave the route. See [Memory Management](/advanced/memory-management/#destroying-unused-route-injectors) for `withAutoCleanupInjectors()`.

### Component-level providers: one instance per component

```ts
@Component({
  selector: 'app-todo-list',
  providers: [TodoListStore], // every <app-todo-list> gets its own store
  template: `...`,
})
export class TodoList {
  private readonly store = inject(TodoListStore);
}
```

The instance is destroyed with the component, and its `ngOnDestroy` / `DestroyRef` callbacks run.

## Resolution modifiers

Pass options to `inject()` to change **where** Angular looks and **what happens if nothing is found**:

| Option | Effect |
| --- | --- |
| `optional: true` | Return `null` instead of throwing |
| `self: true` | Look only in the current element's injector |
| `skipSelf: true` | Start at the **parent** (ignore the current element's own providers) |
| `host: true` | Stop at the current component's boundary (its host element) |

You can't combine `self` with `skipSelf` or with `host`.

```ts
// A nestable form group: find the *parent* group, if any
@Component({
  selector: 'app-form-group',
  providers: [FormGroupState],
  template: `<ng-content />`,
})
export class FormGroupCmp {
  private readonly parent = inject(FormGroupState, { skipSelf: true, optional: true });
}

// A directive that works with or without a surrounding group
@Directive({ selector: '[appFormField]' })
export class FormFieldDir {
  private readonly group = inject(FormGroupState, { optional: true });
}
```

The classic recursive pattern, where a service whose parent is the nearest ancestor of the same type, combines `skipSelf` + `optional`:

```ts
{ provide: DEPTH, useFactory: () => inject(DEPTH, { skipSelf: true }) + 1 }
```

## Running code at startup

| Function | Runs | Async? |
| --- | --- | --- |
| `provideAppInitializer(fn)` | Before the app bootstraps (the first render waits) | ✅ return a `Promise` or `Observable` |
| `provideEnvironmentInitializer(fn)` | When an environment injector (app or route) is created | ❌ sync only |
| `providePlatformInitializer(fn)` | When the platform is created | ❌ sync only |

```ts title="app.config.ts"
import { ApplicationConfig, inject, provideAppInitializer, provideEnvironmentInitializer } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // Load remote config before the first render
    provideAppInitializer(() => inject(ConfigService).load()),
    // Eagerly create a service / run setup code
    provideEnvironmentInitializer(() => {
      inject(Analytics).track('app_start');
    }),
  ],
};
```

```ts title="config.service.ts"
@Service()
export class ConfigService {
  private readonly http = inject(HttpClient);
  readonly config = signal<AppConfig | null>(null);

  async load() {
    this.config.set(await firstValueFrom(this.http.get<AppConfig>('/config.json')));
  }
}
```

:::caution[Deprecated tokens]
`APP_INITIALIZER`, `ENVIRONMENT_INITIALIZER` and `PLATFORM_INITIALIZER` are deprecated. Use the `provide*Initializer()` functions above. Keep app initializers fast, because the user sees a blank page until they finish.
:::

## Injection context helpers

### `runInInjectionContext()`

Need `inject()` later, for example in a click handler? Capture the `Injector` up front and run code inside its context:

```ts
@Component({ selector: 'app-later', template: `` })
export class Later {
  private readonly injector = inject(Injector);

  onClick() {
    runInInjectionContext(this.injector, () => {
      const store = inject(CartStore);
      store.add('book');
    });
  }
}
```

Usually it's simpler to inject the dependency in a field. Use `runInInjectionContext` for utilities that **must** call `inject()`.

### Writing your own `injectX()` helpers

Functions that call `inject()` are a great way to share logic. Guard them with `assertInInjectionContext()` for a clear error message:

```ts title="inject-document-title.ts"
import { DestroyRef, assertInInjectionContext, inject, signal } from '@angular/core';

export function injectDocumentTitle(initial: string) {
  assertInInjectionContext(injectDocumentTitle);
  const destroyRef = inject(DestroyRef);
  const title = signal(initial);
  destroyRef.onDestroy(() => title.set(''));
  return title;
}
```

```ts
export class Home {
  protected readonly title = injectDocumentTitle('Home');
}
```

### Creating injectors manually

For plugin systems or tests you can build injectors yourself:

```ts
const child = createEnvironmentInjector([AdminStore], inject(EnvironmentInjector), 'plugin');
const store = child.get(AdminStore);
child.destroy(); // destroys services created by this injector

const elementLike = Injector.create({
  providers: [{ provide: THEME, useValue: 'dark' }],
  parent: inject(Injector),
});
```

## Debugging DI

| Error | Meaning | Fix |
| --- | --- | --- |
| `NG0201: No provider for X` | Nothing in the tree provides X | Add `@Service()`, a `providers` entry, or `optional: true` |
| `NG0203: inject() must be called from an injection context` | `inject()` was called too late | Move it to a field or use `runInInjectionContext()` |
| `NG0200: Circular dependency` | A needs B needs A | Extract the shared part into a third service, or inject lazily |

[Angular DevTools](/tools/devtools/) has an **Injector Tree** view that shows every injector, its providers and how a token was resolved.

## Common mistakes

- **Providing a root singleton again in a component's `providers`.** You silently get a *second* instance.
- **Calling `inject()` in lifecycle hooks (`ngOnInit`), event handlers, callbacks or after an `await`.** These aren't injection contexts. Inject in fields instead.
- **Using string tokens** (`{ provide: 'API_URL', ... }`). Use a typed `InjectionToken`.
- **Doing heavy async work in `provideAppInitializer`.** It delays the first paint.
- **Statically importing a service you meant to lazy-load** with `injectAsync()`. It ends up in the main bundle.
- **Putting `makeEnvironmentProviders()` results in component `providers`.** That's a compile error by design. Use them at the app or route level.

## Key takeaways

- `@Service()` is the default for singletons in v22. Keep `@Injectable()` for constructor DI, `use*` providers and non-root scopes.
- `injectAsync()` lazy-loads services into their own chunks, with optional prefetching.
- Tokens plus `useClass` / `useValue` / `useFactory` / `useExisting` / `multi` cover every provisioning need.
- Element injectors are searched first, then environment injectors (route → root → platform).
- Use `provideAppInitializer()` / `provideEnvironmentInitializer()` instead of the deprecated initializer tokens.

## Next steps

- [Memory Management](/advanced/memory-management/): `DestroyRef` and injector cleanup
- [Content Projection](/advanced/content-projection/): `providers` vs `viewProviders` with projected content
- [Bundle Optimization](/advanced/bundle-optimization/): tree-shakable providers and lazy chunks
- [Service Testing](/testing/service-testing/): overriding providers in tests
