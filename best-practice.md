# Angular 22 Code Example Guidelines

Use these conventions in NG Guide examples unless a page explicitly teaches migration or older-version code. The site's version baseline is Angular 22.2.

## Components and templates

- Use standalone components; do not write `standalone: true`.
- OnPush is the default change-detection strategy in Angular 22. Omit `changeDetection` unless the example explains a deliberate exception or legacy behavior.
- Use `input()`, `input.required()`, `output()` and `model()` instead of `@Input()` and `@Output()` in new code.
- Use signal queries (`viewChild`, `viewChildren`, `contentChild`, `contentChildren`) when a query is needed.
- Prefer `protected` for template-only members and `readonly` for injected dependencies and signals.
- Use native control flow (`@if`, `@for` with a stable `track` expression, `@switch`, `@let`, `@defer`) instead of the deprecated `NgIf`, `NgFor` and `NgSwitch` directives.
- Use class and style bindings instead of `ngClass` and `ngStyle`.
- Put host bindings and listeners in the component or directive `host` metadata, not `@HostBinding` or `@HostListener`.
- Use `NgOptimizedImage` for static images where appropriate.

## Reactivity and dependency injection

- Use signals for local state, `computed()` for derived values, and `linkedSignal()` for writable dependent state.
- Use `effect()` for external side effects only; do not copy one signal into another with an effect.
- Use `resource()`, `rxResource()` and `httpResource()` for reactive asynchronous reads. Label `debounced()` experimental.
- Use `@Service()` for new root-provided services when its API fits. Keep `@Injectable()` examples when teaching compatibility, constructor injection or advanced provider configurations.
- Use `inject()` in field initializers, factories or other valid injection contexts. Do not call it from an arbitrary method.
- Prefer lazy feature routes and `@defer` when they improve loading behavior.

## Forms, HTTP and testing

- Teach Signal Forms as the preferred option for new Angular 22 forms. Bind fields with `FormField` and `[formField]`.
- Continue to explain typed Reactive Forms and template-driven forms where they are appropriate or already used.
- Configure HTTP with `provideHttpClient()`. Fetch is the default in Angular 22; do not add deprecated `withFetch()` unless documenting a migration. Use `withXhr()` only when upload progress is needed.
- Use functional interceptors and handle loading, success and error states explicitly.
- Use Vitest for tests in new Angular projects. Prefer `vi.fn()` and `vi.spyOn()` over Jasmine-only APIs.
- Use `TestBed`, `fixture.componentRef.setInput()`, `fixture.whenStable()`, `RouterTestingHarness` and `HttpTestingController` where appropriate.

## TypeScript and documentation examples

- Enable strict typing and avoid `any`; use `unknown` and narrow it when data is not known.
- Keep examples small and complete enough to understand imports, types and injection.
- Verify version-sensitive APIs in the installed Angular package declarations or official documentation before publishing.
- Mark developer-preview and experimental APIs explicitly; mention stability changes only when verified.
- For older projects, use a short version note instead of mixing legacy and current patterns in the main example.
