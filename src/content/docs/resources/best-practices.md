---
title: Angular Best Practices ✅
description: The definitive Angular 22 best practices — components, signals, DI with @Service, control flow, Signal Forms, routing, HTTP, a11y, security and testing.
sidebar:
  order: 1
---

This page collects the rules the Angular team and experienced Angular developers follow when writing **Angular 22** apps. Each rule has a short "why" and a small, type-checked example. Use it as a checklist when you start a project or review a pull request.

**What you'll learn**

- How to write small, signal-based, standalone components the modern way
- How to manage state with `signal`, `computed`, `linkedSignal` and the `resource` APIs
- How to organise services with `@Service()` and `inject()`
- Template, forms (Signal Forms), routing and HTTP rules for v22
- Accessibility, security, error-handling and testing habits that scale

:::tip[The short version]
Standalone components · no `standalone: true` · no `changeDetection` (OnPush is the default since v22) · `input()`/`output()`/`model()` · signals + `computed()` · `@if`/`@for`/`@switch` · `@Service()` + `inject()` · `[class.x]`/`[style.x]` instead of `ngClass`/`ngStyle` · `host: {}` instead of `@HostBinding`/`@HostListener` · Signal Forms for new forms · lazy routes · `provideHttpClient()` without `withFetch()` · Vitest for tests.
:::

## 🧰 Project setup

| Do | Why |
|---|---|
| Create apps with `ng new` and keep the defaults (standalone, zoneless, strict mode, Vitest, `@angular/build:application`) | You get the configuration the Angular team tests and optimises for |
| Keep TypeScript **strict** and `strictTemplates` on | Most bugs are caught at compile time, including inside templates |
| Update regularly with `ng update @angular/core @angular/cli` | Every major ships automatic migrations; skipping majors makes updates harder |
| Use Prettier (added by `ng new` since v21.2) and [angular-eslint](/tools/eslint/) | Consistent formatting and template lint rules (including a11y rules) |
| Run `ng generate ai-config` if you use AI assistants | Generates `AGENTS.md`/`CLAUDE.md`-style instruction files and Angular MCP server config so assistants write modern Angular |

Angular 22 needs **Node.js `^22.22.3`, `^24.15.0` or `>=26`** and **TypeScript `>=6.0 <6.1`**. See [Version upgrade](/migration/version-upgrade/) for the full update checklist.

## 🗂️ Naming and project structure (2025 style guide)

Since v20 the official style guide drops type suffixes. New projects generate `app.ts` with a class named `App`.

| Rule | Example |
|---|---|
| Hyphenate file names | `user-profile.ts` |
| File name matches the main class, **no `.component`/`.service` suffix** | `UserProfile` → `user-profile.ts` |
| Template, styles and tests share the base name | `user-profile.html`, `user-profile.css`, `user-profile.spec.ts` |
| Tests live next to the code they test | not in a separate `tests/` folder |
| Organise by **feature**, not by type | `src/app/checkout/payment-form/` — not `components/`, `services/` |
| One concept per file; avoid `utils.ts`, `helpers.ts`, `common.ts` | `price-format.ts` |
| Component selectors use an app prefix | `app-user-card` |
| Attribute directive selectors use camelCase + prefix | `[appTooltip]` |

```text
src/
├─ main.ts
├─ styles.css
└─ app/
   ├─ app.ts / app.html / app.config.ts / app.routes.ts
   ├─ catalog/
   │  ├─ product-list/          (product-list.ts, .html, .css, .spec.ts)
   │  ├─ product-detail/
   │  ├─ product-api.ts
   │  └─ catalog.routes.ts
   └─ checkout/
      ├─ cart/
      ├─ payment-form/
      └─ cart-store.ts
```

:::note[Older projects]
Projects created before v20 (or with `ng new --file-name-style-guide=2016`) keep generating `user-profile.component.ts` / `UserProfileComponent`. Both styles work — just be consistent inside one project.
:::

## 🧩 Components

### Keep components small, standalone and presentation-focused

Components should mostly deal with what is shown on screen. Move data access, validation rules and calculations into services or plain functions.

```ts title="user-card.ts"
import { Component, computed, input, model, output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  host: {
    class: 'user-card',
    '[class.selected]': 'selected()',
    '(click)': 'toggleSelected()',
  },
  template: `
    <h3>{{ fullName() }}</h3>
    <button type="button" (click)="removeUser($event)">Remove</button>
  `,
})
export class UserCard {
  readonly user = input.required<User>();   // data in
  readonly selected = model(false);        // two-way: [(selected)]
  readonly removed = output<number>();     // events out

  protected readonly fullName = computed(() => `${this.user().firstName} ${this.user().lastName}`);

  protected toggleSelected() {
    this.selected.update((value) => !value);
  }

  protected removeUser(event: MouseEvent) {
    event.stopPropagation();
    this.removed.emit(this.user().id);
  }
}
```

What this example shows:

- **No `standalone: true`** — components are standalone by default (since v19).
- **No `changeDetection`** — components are `OnPush` by default since v22. Only add `ChangeDetectionStrategy.Eager` for legacy code that mutates plain fields.
- **`input()`, `input.required()`, `output()`, `model()`** instead of `@Input`/`@Output` decorators. Use `model()` for two-way binding instead of an `input()` + `output()` pair.
- **`readonly`** on everything Angular sets (inputs, outputs, models, queries, injected services).
- **`protected`** for members used only by the template — they are not part of the public API.
- **`host: {}`** instead of `@HostBinding`/`@HostListener`.
- Event handlers are named after **what they do** (`removeUser`), not the DOM event (`handleClick`).

### More component rules

| Do | Avoid |
|---|---|
| Put Angular-specific members (injected deps, inputs, outputs, queries) at the top of the class | Mixing them between methods |
| Inline templates for small components; `templateUrl: './user-card.html'` (relative path) for bigger ones | Very long inline templates |
| Import only what the template uses (`DatePipe`, `NgOptimizedImage`, child components) | Importing `CommonModule` |
| `[class.active]="isActive()"`, `[class]="{ active: isActive() }"`, `[style.width.px]="width()"` | `ngClass`, `ngStyle` (slower and deprecated in style) |
| Signal queries: `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()` | `@ViewChild`/`@ContentChild` decorators in new code |
| Keep lifecycle hooks short — call well-named methods from them; implement `OnInit`, `OnDestroy`… interfaces | Long logic inside `ngOnInit` |
| Use `DestroyRef` / `takeUntilDestroyed()` for cleanup | Manual `Subject` + `ngOnDestroy` boilerplate |

## 📡 Signals and state

### Pick the right reactive primitive

| Need | Use |
|---|---|
| Local, writable state | `signal()` |
| A value derived from other signals | `computed()` |
| Derived state the user can also override (resets when the source changes) | `linkedSignal()` |
| Async data that depends on signals | `resource()`, `httpResource()`, `rxResource()` |
| A side effect (logging, `localStorage`, imperative DOM/3rd-party APIs) | `effect()` / `afterRenderEffect()` |
| Turn an Observable into a signal (or back) | `toSignal()` / `toObservable()` |

```ts
// ✅ derived state → computed
readonly fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

constructor() {
  // ✅ effect only for side effects that leave the signal world
  effect(() => localStorage.setItem('lastName', this.lastName()));
}
```

:::caution[Don't use `effect()` to copy one signal into another]
`effect(() => this.total.set(this.price() * this.qty()))` causes extra change-detection passes and glitches. Use `computed()` — or `linkedSignal()` if the value must stay writable.
:::

```ts
// linkedSignal: default to the first option, reset when options change
readonly options = input.required<string[]>();
readonly selected = linkedSignal(() => this.options()[0]);
```

### Keep state immutable and expose it read-only

```ts title="cart-store.ts"
import { Service, computed, signal } from '@angular/core';

@Service()
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly total = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  add(item: CartItem) {
    this._items.update((items) => [...items, item]); // new array → consumers update
  }

  remove(id: number) {
    this._items.update((items) => items.filter((item) => item.id !== id));
  }
}
```

- Use `set()` / `update()` with **new** objects and arrays. Signals compare with `Object.is`, so mutating an array in place does not notify anyone (and `mutate()` no longer exists).
- Only the owner writes; everyone else gets `asReadonly()` or `computed()` signals.
- Reach for a state library such as NgRx SignalStore only when plain signal services become hard to manage — see [State management](/intermediate/state-management/).

### Load async data with resources

`resource`, `rxResource` and `httpResource` are **stable since v22**. They re-run automatically when the signals they read change and expose `value()`, `status()`, `error()`, `isLoading()`, `hasValue()` and `reload()`.

```ts
@Component({
  selector: 'app-user-profile',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p role="alert">Could not load the user.</p>
      <button type="button" (click)="user.reload()">Retry</button>
    } @else if (user.hasValue()) {
      <h2>{{ user.value().firstName }}</h2>
    }
  `,
})
export class UserProfile {
  readonly userId = input.required<number>();
  protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```

- Use resources (or `httpResource`) for **reading** data; use `HttpClient` methods for **writes** (POST/PUT/DELETE).
- Guard reads with `hasValue()` — reading `value()` of a resource in the `error` state throws.
- In `rxResource`, never swallow errors with `catchError(() => EMPTY)`; that causes [NG0991](/resources/troubleshooting/#ng0991-resource-completed-before-producing-a-value).

Learn more: [Signals](/modern/signals/), [Linked signals](/modern/linked-signals/), [Resource API](/modern/resource-api/), [httpResource](/modern/http-resource-api/).

## 💉 Services and dependency injection

### Use `@Service()` for app-wide singletons

`@Service()` (stable in v22) is shorthand for `@Injectable({ providedIn: 'root' })`: one tree-shakable instance for the whole app.

```ts
import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Service()
export class FeatureFlags {
  private readonly http = inject(HttpClient);
  readonly flags = signal<Record<string, boolean>>({});

  async load() {
    this.flags.set(await firstValueFrom(this.http.get<Record<string, boolean>>('/api/flags')));
  }
}
```

| Situation | Use |
|---|---|
| App-wide singleton that uses `inject()` | `@Service()` |
| Service provided per component/route (`providers: [...]`) | `@Service({ autoProvided: false })` or `@Injectable()` |
| Constructor-parameter injection, `useClass`/`useValue`/`useExisting`, `providedIn: 'platform'` | `@Injectable(...)` |
| Code that must also run on Angular 21 or earlier (libraries) | `@Injectable({ providedIn: 'root' })` |

Migrate existing services automatically with `ng generate @angular/core:service` (v22.1+). It only converts classes that are safe to convert.

### Other DI rules

- **Use `inject()`**, not constructor parameters. It reads better, infers types and works in functions (guards, interceptors, resolvers). Convert old code with `ng generate @angular/core:inject`.
- Call `inject()` only in an **injection context**: field initializers, the constructor, provider factories, or inside `runInInjectionContext()`. Calling it in `ngOnInit` or a click handler throws [NG0203](/resources/troubleshooting/#ng0203-inject-must-be-called-from-an-injection-context).
- Use an `InjectionToken` for configuration objects and other non-class values.
- Run startup work with `provideAppInitializer(() => …)` — `APP_INITIALIZER` is deprecated.
- Lazy-load heavy, rarely used services with `injectAsync()` so their code lands in a separate chunk.

```ts title="app.config.ts"
export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: APP_SETTINGS, useValue: { apiUrl: '/api', featureFlags: {} } },
    provideAppInitializer(() => inject(FeatureFlags).load()),
  ],
};
```

```ts
// Load a big exporter (e.g. a spreadsheet library) only when it is needed
export class Report {
  private readonly exporter = injectAsync(
    () => import('./report-exporter').then((m) => m.ReportExporter),
    { prefetch: onIdle }, // optional: download when the browser is idle
  );

  protected async exportReport() {
    (await this.exporter()).export();
  }
}
```

Learn more: [Services](/beginner/services/), [Dependency injection](/advanced/dependency-injection/).

## 📝 Templates

- Use built-in control flow — **`@if`, `@for`, `@switch`** — instead of `*ngIf`, `*ngFor`, `*ngSwitch` (those directives are deprecated). Migrate with `ng generate @angular/core:control-flow`.
- Always `track` a **unique, stable key** in `@for` (`track item.id`). Use `$index` only for static lists. Tracking the object itself (`track item`) re-creates DOM when you replace objects immutably ([NG0956](/resources/troubleshooting/#ng0955--ng0956-track-expression-warnings)).
- Use `@let` to name a value once instead of repeating a long expression.
- Keep templates simple. Move anything non-trivial into a `computed()`.
- Calling **signals** in templates is fine and fast. Avoid calling **plain methods that do heavy work** — they run on every change-detection pass.
- Use `@switch` with `@default never;` on union types so the compiler tells you when a case is missing.
- Use `@defer` to lazy-load heavy, below-the-fold parts of a page.
- Don't rely on globals in templates (`new Date()`, `window`) — expose what you need from the class.

```html
@let visible = visibleTodos();
<p>{{ visible.length }} of {{ todos().length }} shown</p>
<ul>
  @for (todo of visible; track todo.id; let i = $index) {
    <li [class.done]="todo.done">{{ i + 1 }}. {{ todo.title }}</li>
  } @empty {
    <li>Nothing to do 🎉</li>
  }
</ul>

@let s = status();
@switch (s) {
  @case ('idle') { <p>Idle</p> }
  @case ('loading') { <p>Loading</p> }
  @case ('done') { <p>Done</p> }
  @default never;
}
```

:::note[`private` members in templates]
Since v22.2 templates can read TypeScript `private` members (not `#private` fields). We still recommend **`protected`** for template-only members: it states the intent and works on every version.
:::

Learn more: [Control flow](/modern/control-flow/), [Template syntax](/modern/template-syntax/).

## 📋 Forms

- **New forms → Signal Forms** (`@angular/forms/signals`, stable since v22). The model is a signal, validation lives in one schema, and every field exposes signals such as `value()`, `valid()`, `touched()` and `errors()`.
- **Existing forms → typed Reactive Forms** are still fully supported. Prefer Reactive over template-driven forms for anything non-trivial.
- Bind controls with **`[formField]`** and submit with **`FormRoot`** (`[formRoot]`), which adds `novalidate`, prevents the page reload and runs your `submission.action`.
- Show errors only after the user has interacted (`touched()`), and connect them to the input for screen readers.

```ts title="sign-up-form.ts"
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="signUpForm">
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="signUpForm.email" />
      @if (signUpForm.email().touched() && signUpForm.email().invalid()) {
        @for (error of signUpForm.email().errors(); track error.kind) {
          <p class="error">{{ error.message }}</p>
        }
      }

      <label for="password">Password</label>
      <input id="password" type="password" [formField]="signUpForm.password" />

      <button type="submit" [disabled]="signUpForm().submitting()">Create account</button>
    </form>
  `,
})
export class SignUpForm {
  private readonly http = inject(HttpClient);
  protected readonly model = signal({ name: '', email: '', password: '' });

  protected readonly signUpForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email' });
      required(path.password);
      minLength(path.password, 8, { message: 'At least 8 characters' });
    },
    {
      submission: {
        action: async (field) => {
          await firstValueFrom(this.http.post('/api/sign-up', field().value()));
        },
      },
    },
  );
}
```

Learn more: [Signal Forms](/modern/signal-forms/), [Reactive forms](/intermediate/reactive-forms/).

## 🧭 Routing

- **Lazy-load** feature areas with `loadComponent` / `loadChildren`. Convert eager routes with `ng generate @angular/core:route-lazy-loading`.
- Write guards and resolvers as **functions** (`CanActivateFn`, `ResolveFn`) that use `inject()`. Return a `UrlTree` (or a `RedirectCommand`) to redirect.
- Enable `withComponentInputBinding()` so route params, query params and `data` arrive as component `input()`s.
- Give every route a `title` for accessibility and SEO.
- Add a `**` wildcard route last for a "not found" page.

```ts title="app.routes.ts"
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return isLoggedIn() || router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'users/:id',
    title: 'User',
    loadComponent: () => import('./users/user-page').then((m) => m.UserPage),
  },
  { path: '**', loadComponent: () => import('./not-found').then((m) => m.NotFound) },
];
```

```ts title="users/user-page.ts"
@Component({ selector: 'app-user-page', template: `<p>User {{ id() }}</p>` })
export class UserPage {
  readonly id = input.required<string>(); // filled from :id by withComponentInputBinding()
}
```

:::note[Changed in v22]
`paramsInheritanceStrategy` now defaults to `'always'`: child routes see their parents' params. Pass `withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' })` to restore the old behaviour.
:::

Learn more: [Routing](/beginner/routing/), [Advanced routing](/intermediate/advanced-routing/).

## 🌐 HTTP

- Register the client with **`provideHttpClient()`**. Since v22 it uses the **Fetch API by default**, so `withFetch()` is deprecated and can be removed. `HttpClientModule` is deprecated.
- Use **functional interceptors** with `withInterceptors([...])` for auth headers, logging and error mapping.
- Type every response: `http.get<User[]>('/api/users')`.
- Need **upload progress** events? Use `provideHttpClient(withXhr())` — the fetch backend can't report upload progress. Use `reportUploadProgress` / `reportDownloadProgress` (the old `reportProgress` option is deprecated). Don't use `withXhr()` on the server (SSR).
- Handle errors where the request is made (show a message, retry, fall back). Use an interceptor only for cross-cutting concerns such as redirecting to login on `401`.

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
```

Learn more: [HTTP client](/beginner/http/).

## ⚡ Performance

The defaults already do a lot (zoneless, OnPush, esbuild, tree-shaking). The biggest remaining wins:

1. Lazy-load routes and `@defer` heavy, below-the-fold UI.
2. Use signals everywhere so Angular updates only what changed.
3. `track` by a unique id in every `@for`.
4. Use `NgOptimizedImage` (`ngSrc`) for static images and mark the LCP image `priority`.
5. Use SSR + hydration for content-heavy, public pages (incremental hydration is on by default in v22).
6. Keep bundle budgets in `angular.json` and fail the build when they are exceeded.
7. Measure before optimising — Angular DevTools profiler and the Chrome DevTools "Angular" track.

See the full [Performance checklist](/resources/performance-checklist/).

## ♿ Accessibility

Angular's own guidance: every page should **pass AXE checks and meet WCAG 2 AA** — focus management, colour contrast and correct ARIA.

- **Prefer native elements.** A `<button>` gives you focus, keyboard and role for free. Build components on top of native elements with attribute selectors (`button[appButton]`) instead of re-creating them with `<div>`.
- **Label everything.** Every input has a `<label for>`; icon-only buttons get `aria-label`.
- **Bind ARIA attributes directly**: `[aria-label]="label()"` or `[attr.aria-expanded]="open()"`.
- **Use Angular Aria** (`@angular/aria`, stable since v22) for complex widgets — tabs, menus, listbox, combobox, select, tree, grid, accordion, toolbar. It handles keyboard interaction, ARIA attributes and focus; you provide the HTML and CSS.
- **Use the CDK a11y package** for `LiveAnnouncer`, `cdkTrapFocus` and `FocusMonitor`.
- **Manage focus on navigation**: move focus to the main heading after each route change, and mark the active link with `ariaCurrentWhenActive="page"`.
- **Announce lazy content**: wrap `@defer` blocks that load important content in an `aria-live` region.

```ts title="settings-tabs.ts"
import { Component, signal } from '@angular/core';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';

@Component({
  selector: 'app-settings-tabs',
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  template: `
    <div ngTabs>
      <ul ngTabList [(selectedTab)]="selectedTab">
        <li ngTab value="profile">Profile</li>
        <li ngTab value="security">Security</li>
      </ul>
      <div ngTabPanel value="profile">
        <ng-template ngTabContent>Profile settings…</ng-template>
      </div>
      <div ngTabPanel value="security">
        <ng-template ngTabContent>Security settings…</ng-template>
      </div>
    </div>
  `,
})
export class SettingsTabs {
  protected readonly selectedTab = signal('profile');
}
```

```html
<nav aria-label="Main">
  <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page">Home</a>
  <a routerLink="/about" routerLinkActive="active" ariaCurrentWhenActive="page">About</a>
</nav>
```

```ts title="Move focus after navigation"
export class Shell {
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('pageHeading'); // <h1 #pageHeading tabindex="-1">
  private readonly announcer = inject(LiveAnnouncer);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.heading().nativeElement.focus();
        this.announcer.announce('Page loaded');
      });
  }
}
```

## 🛡️ Security

- **Trust Angular's sanitization.** Interpolation and property bindings escape untrusted values automatically. `[innerHTML]` is sanitized.
- **Avoid `DomSanitizer.bypassSecurityTrust*`** unless the value is truly trusted (never user input), and never build HTML strings or use `ElementRef.nativeElement.innerHTML` directly.
- **Use AOT** (the default) — never compile templates from user-provided strings.
- **Enable a Content Security Policy.** With static hosting, set `"security": { "autoCsp": true }` in `angular.json` to hash inline scripts; with SSR you can use a nonce (`ngCspNonce` / `CSP_NONCE`). Consider Trusted Types.
- **CSRF/XSRF protection** is built into `HttpClient` for same-origin mutating requests (cookie `XSRF-TOKEN` → header `X-XSRF-TOKEN`); configure names with `withXsrfConfiguration()`.
- **SSR: configure `allowedHosts`.** Since v22 requests with an unknown `Host` header get **400 Bad Request** instead of falling back to client-side rendering.
- **Never put secrets in the client bundle** (environment files are public). Keep API keys on the server.
- **Keep Angular up to date** — security fixes land in supported versions only.

## 🚨 Error handling

- Handle expected errors **where they happen**: `try/catch` around `await`, `catchError` in RxJS, or the `error()` state of a resource.
- Use a custom `ErrorHandler` only to **report** unexpected errors (to logging/monitoring), not to recover.
- Keep `provideBrowserGlobalErrorListeners()` (added by `ng new`) so uncaught errors and unhandled promise rejections reach your `ErrorHandler`.
- `@boundary { … } @error { … }` blocks (**developer preview**, v22.2) can show fallback UI when part of a template throws.

```ts
export class GlobalErrorHandler implements ErrorHandler {
  private readonly telemetry = inject(Telemetry);
  private readonly router = inject(Router);

  handleError(error: unknown): void {
    this.telemetry.report({ url: this.router.url, error });
    console.error(error);
  }
}

// app.config.ts → providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
```

## 🧪 Testing

- **Vitest is the default test runner since v21** (`ng test`). Use `describe`/`it`/`expect`, `vi.fn()`, `vi.spyOn()` and `vi.useFakeTimers()`. Migrate Jasmine specs with `ng g @schematics/angular:refactor-jasmine-vitest`.
- Test **behaviour through the DOM**, not private implementation details.
- After changing state, `await fixture.whenStable()` to let Angular render, then assert on the DOM.
- Pass inputs with `TestBed.createComponent(Cmp, { bindings: [inputBinding('name', value)] })`.
- Mock HTTP with `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`.
- Test routing with `RouterTestingHarness`; use component harnesses for Angular Material/CDK and Aria widgets.
- `fakeAsync`/`tick` require Zone.js and **don't work with Vitest** — use Vitest fake timers instead.

```ts title="user-card.spec.ts"
import { TestBed } from '@angular/core/testing';
import { inputBinding, signal } from '@angular/core';
import { UserCard } from './user-card';

describe('UserCard', () => {
  it('emits the user id when Remove is clicked', async () => {
    const user = signal({ id: 7, firstName: 'Ada', lastName: 'Lovelace', avatarUrl: '' });
    const fixture = TestBed.createComponent(UserCard, {
      bindings: [inputBinding('user', user)],
    });
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button').click();

    expect(removed).toHaveBeenCalledWith(7);
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
  });
});
```

Learn more: [Unit testing](/testing/unit-testing/), [Component testing](/testing/component-testing/).

## ❌ Common mistakes

| Mistake | Fix |
|---|---|
| `standalone: true` / `changeDetection: ChangeDetectionStrategy.OnPush` boilerplate | Remove both — they are the defaults |
| Mutating an array/object and expecting the view to update | `update(list => [...list, item])` |
| Copying signals into signals with `effect()` | `computed()` or `linkedSignal()` |
| `inject()` inside `ngOnInit` or an event handler | Move it to a field initializer or constructor |
| `@for` without a stable `track` key | `track item.id` |
| Subscribing manually and forgetting to unsubscribe | `toSignal()`, `async` pipe or `takeUntilDestroyed()` |
| `withFetch()`, `HttpClientModule`, `APP_INITIALIZER` | `provideHttpClient()`, `provideAppInitializer()` |
| `*ngIf` / `*ngFor` / `ngClass` / `ngStyle` | `@if` / `@for` / `[class.x]` / `[style.x]` |
| Importing `CommonModule` | Import the specific pipe/directive |
| `bypassSecurityTrustHtml(userInput)` | Let Angular sanitize, or sanitize on the server |

## 🔑 Key takeaways

- Write **standalone, OnPush-by-default, signal-based** components with `input()`/`output()`/`model()`.
- Derive with `computed()`, reset with `linkedSignal()`, load with `resource`/`httpResource`, and keep `effect()` for side effects.
- Use `@Service()` + `inject()` for singletons; `@Injectable` only for the special cases.
- Native control flow, unique `track` keys, Signal Forms for new forms, lazy routes, `provideHttpClient()`.
- Accessibility (AXE + WCAG AA), security (sanitization, CSP, `allowedHosts`) and Vitest tests are part of "done".

## ➡️ Next steps

- [Design patterns](/resources/patterns/) — facade, container/presentational, strategy and more with signals
- [Cheat sheet](/resources/cheat-sheet/) — every v22 API on one page
- [Performance checklist](/resources/performance-checklist/)
- [Troubleshooting](/resources/troubleshooting/) — fixes for common v22 errors
