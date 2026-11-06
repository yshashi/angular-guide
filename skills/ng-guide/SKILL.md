---
name: ng-guide
description: Writes and reviews modern Angular 22 code following the NG Guide (ng-guide.letsprogram.in) conventions — signals, standalone components, OnPush-by-default, @Service() + inject(), native control flow, Signal Forms, httpResource, zoneless, SSR/hydration and Vitest. Use for any Angular component, service, routing, forms, HTTP, testing or migration task.
---

# NG Guide — Angular 22 coding rules

You write code for **Angular 22** (latest stable). Before writing code, check the project's Angular version in
`package.json`; if it is older than v22, follow the version notes at the end of this file.
For deeper explanations, fetch the relevant NG Guide page as Markdown (URLs listed below) or the whole guide at
https://ng-guide.letsprogram.in/llms-full.txt.

## Components

- Components are standalone by default. **Never** write `standalone: true`. Don't create NgModules.
- **OnPush is the default in v22.** Don't add `changeDetection` unless you deliberately need `ChangeDetectionStrategy.Eager`.
- Use `input()`, `input.required()`, `output()`, `model()`, never `@Input()`/`@Output()`.
- Use signal queries: `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`.
- Put host bindings and listeners in the `host: {}` metadata, never `@HostBinding`/`@HostListener`.
- Use `[class.x]`, `[class]`, `[style.x]` bindings, never `ngClass`/`ngStyle`.
- Use `protected` for members used only by the template, and `readonly` for signals and injected dependencies.
- Use the 2025 file naming style: `user-card.ts`, `user-card.html`, `user-card.css`, class `UserCard`.
- Use `NgOptimizedImage` (`ngSrc`) for static images.

## Templates

- Use native control flow: `@if`/`@else`, `@for (item of items(); track item.id)` with `@empty`, `@switch`/`@case`, `@let`, `@defer`.
  `*ngIf`, `*ngFor` and `*ngSwitch` are **deprecated**.
- Call signals in templates (`count()`). Keep logic out of templates: use `computed()`.
- Error boundaries: `@boundary { … } @error { … }` (developer preview in 22.2).

## Reactivity

- Use `signal()` for state, `computed()` for derived state, and `linkedSignal()` for derived state the user can also set.
  Never use `mutate`; use `set`/`update` with new references.
- Use `resource()`, `rxResource()` and `httpResource()` (stable in v22) for async data driven by signals.
  `debounced()` is experimental.
- Use `effect()` only for side effects (logging, localStorage, non-Angular DOM APIs). Never use it to copy one signal into another.
  Use `afterRenderEffect()` for DOM work after rendering.
- Interop with RxJS via `toSignal`, `toObservable`, `takeUntilDestroyed`, `outputFromObservable`.
- Apps are **zoneless** by default (since v21). Don't add zone.js or `NgZone`-based logic.

## Dependency injection

- Use `inject()`, never constructor injection.
- For app-wide singletons, use `@Service()` (v22): `@Service() export class Cart { … }`.
  Use `@Injectable()` only for constructor DI, advanced providers (`useClass`/`useFactory`…) or libraries that support older versions.
- Lazy-load heavy services with `injectAsync(() => import('./x').then(m => m.X))`.
- Use `InjectionToken` for configuration, and `provideAppInitializer()` instead of the deprecated `APP_INITIALIZER`.

## Routing

- Use `provideRouter(routes, withComponentInputBinding())` and read route params with `input()`.
- Lazy-load with `loadComponent` / `loadChildren`. Use functional guards and resolvers (`CanActivateFn`, `ResolveFn`).
- `paramsInheritanceStrategy` defaults to `'always'` in v22.

## HTTP

- Use `provideHttpClient()`; it uses the Fetch API by default in v22. `withFetch()` is deprecated, so remove it.
  Use `withXhr()` only if you need upload progress.
- Prefer `httpResource()` for reads and `HttpClient` for mutations. Use functional interceptors (`withInterceptors([...])`).

## Forms

- For new forms, use **Signal Forms** (stable in v22) from `@angular/forms/signals`:
  `form(model, schema)`, the `FormField` directive bound with `[formField]="f.email"`, validators such as `required`, `email`,
  `minLength`, `validate`, `validateHttp`, and `submit()`.
- Keep existing typed Reactive Forms where they already exist (`SignalFormControl` bridges both).

## Styling & animation

- Prefer component styles. Use Tailwind if the project has it (`ng new --style=tailwind`).
- Animate with native CSS plus `animate.enter` / `animate.leave`. The `@angular/animations` package is deprecated.

## SSR

- Use `@angular/ssr` with `AngularNodeAppEngine`, server routes (`RenderMode.Server | Prerender | Client`) and
  `provideClientHydration(withEventReplay())`. Incremental hydration is on by default in v22.
- Guard browser-only code with `afterNextRender()` or `isPlatformBrowser`.

## Testing

- Use **Vitest** (the default since v21) via `ng test`: `describe/it/expect`, `vi.fn()`, `vi.spyOn()`, `vi.useFakeTimers()`.
- Use `TestBed`. Set signal inputs with `fixture.componentRef.setInput()` and wait with `await fixture.whenStable()`.
- For HTTP, use `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`.
  For the router, use `RouterTestingHarness`. Use Playwright for E2E tests.

## Accessibility

- Follow WCAG AA. Use `@angular/aria` (stable in v22) for headless accessible widgets
  (menu, tabs, listbox, combobox, tree, grid, accordion, toolbar).

## Never generate (removed or deprecated)

`standalone: true` · `*ngIf`/`*ngFor`/`*ngSwitch` · `@Input`/`@Output`/`@HostBinding`/`@HostListener` · constructor injection ·
`ComponentFactoryResolver` (removed in v22) · `HttpClientModule` · `withFetch()` · `APP_INITIALIZER` ·
`provideExperimentalZonelessChangeDetection` · `@nguniversal/*` / `CommonEngine` · `RouterTestingModule` ·
`jasmine.createSpyObj` in new tests · `[field]`/`Field` for Signal Forms (it's `[formField]`/`FormField`).

## Version notes (older projects)

- **v21:** OnPush isn't the default, so add `changeDetection: ChangeDetectionStrategy.OnPush`. Use `@Injectable({ providedIn: 'root' })` because `@Service()` doesn't exist yet.
  Signal Forms and resources are experimental, and `withFetch()` is still useful.
- **v20:** v21 rules apply. Zone.js is used by default, Karma is the default test runner, and there are no Signal Forms.

## NG Guide pages (Markdown)

- Signals: https://ng-guide.letsprogram.in/modern/signals.md
- Resource / httpResource: https://ng-guide.letsprogram.in/modern/resource-api.md · https://ng-guide.letsprogram.in/modern/http-resource-api.md
- Signal Forms: https://ng-guide.letsprogram.in/modern/signal-forms.md
- Control flow: https://ng-guide.letsprogram.in/modern/control-flow.md
- Dependency injection: https://ng-guide.letsprogram.in/advanced/dependency-injection.md
- Routing: https://ng-guide.letsprogram.in/beginner/routing.md · https://ng-guide.letsprogram.in/intermediate/advanced-routing.md
- Testing: https://ng-guide.letsprogram.in/testing/unit-testing.md
- SSR: https://ng-guide.letsprogram.in/ssr/introduction.md
- Upgrading: https://ng-guide.letsprogram.in/migration/version-upgrade.md
- Cheat sheet: https://ng-guide.letsprogram.in/resources/cheat-sheet.md
- Everything: https://ng-guide.letsprogram.in/llms.txt
