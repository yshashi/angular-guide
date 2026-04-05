---
title: Troubleshooting Guide 🔧
description: Solutions to common Angular development issues and error messages
sidebar:
  order: 5
---

When Angular throws an error, the error code (e.g., `NG0100`) is your best friend. This guide covers the most common errors, explains why they happen, and shows you how to fix them.

## 🔴 NG0100 — ExpressionChangedAfterItHasBeenChecked

**The Error:**
```
Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError:
Expression has changed after it was checked. Previous value: 'false'. Current value: 'true'.
```

**Why It Happens:** Angular checks bindings twice in development mode. If a value changes between the first and second check, Angular throws this error because it indicates unstable state.

**Common Causes:**
- Modifying state inside `ngAfterViewInit` or `ngAfterContentInit`
- A parent component updating a child's input during change detection
- A service changing state during a template read

**The Fix:**

```typescript
// ❌ Bad — modifying state in lifecycle hook
ngAfterViewInit() {
  this.isVisible = true; // changes after check!
}

// ✅ Fix 1 — use a signal (preferred)
isVisible = signal(false);

ngAfterViewInit() {
  // Signals schedule an update for the next cycle
  this.isVisible.set(true);
}

// ✅ Fix 2 — use afterNextRender for DOM-dependent work
constructor() {
  afterNextRender(() => {
    this.isVisible.set(true);
  });
}
```

:::tip
In most cases, switching to signals resolves this error because signal updates are batched and scheduled properly.
:::

## 🔴 NG0200 — Circular Dependency in DI

**The Error:**
```
Error: NG0200: Circular dependency in DI detected for ServiceA.
```

**Why It Happens:** Service A injects Service B, and Service B injects Service A (directly or through a chain).

**The Fix:**

```typescript
// ❌ Bad — circular dependency
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService); // UserService also injects AuthService!
}

// ✅ Fix 1 — extract shared logic into a third service
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = inject(AuthStateService);
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly authState = inject(AuthStateService);
}

// ✅ Fix 2 — use lazy injection with inject() inside a method
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly injector = inject(Injector);

  private getUserService(): UserService {
    return this.injector.get(UserService);
  }
}
```

## 🔴 NG0300 — Selector Collision

**The Error:**
```
Error: NG0300: Multiple components match node with tagname app-header.
```

**Why It Happens:** Two components have the same `selector` value and are both available in the same context.

**The Fix:**
- Rename one of the selectors to be unique.
- Check your `imports` array — you may be importing two modules that export components with the same selector.

```typescript
// Ensure unique selectors
@Component({ selector: 'app-main-header' })   // ✅
@Component({ selector: 'app-admin-header' })   // ✅
// instead of both being 'app-header'
```

## 🔴 NG0303 — Element Not Known

**The Error:**
```
Error: NG0303: Can't bind to 'ngModel' since it isn't a known property of 'input'.
```

**Why It Happens:** The component or directive you're trying to use isn't imported in the current component's `imports` array.

**The Fix:**

```typescript
// ❌ Missing import
@Component({
  selector: 'app-login',
  template: `<input [(ngModel)]="email" />`,
  // FormsModule is not imported!
})
export class LoginComponent { }

// ✅ Add the missing import
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `<input [(ngModel)]="email" />`,
})
export class LoginComponent { }
```

:::note
With standalone components, every dependency (other components, directives, pipes) must be listed in the `imports` array. There's no shared NgModule to provide them automatically.
:::

## 🔴 NullInjectorError

**The Error:**
```
NullInjectorError: No provider for HttpClient!
```

**Why It Happens:** You're injecting a service that hasn't been provided. Common culprits: `HttpClient`, `Router`, `FormBuilder`, or custom services.

**The Fix:**

```typescript
// ❌ Missing provider — HttpClient not configured
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // HttpClient not provided!
  ],
};

// ✅ Add the provider
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

For custom services, ensure they use `providedIn: 'root'` or are listed in a `providers` array:

```typescript
// Option 1 — providedIn (preferred)
@Injectable({ providedIn: 'root' })
export class MyService { }

// Option 2 — provide in route or component
{
  path: 'feature',
  providers: [MyService],
  component: FeatureComponent,
}
```

## 🔴 Can't Bind to 'X' — Unknown Property

**The Error:**
```
Can't bind to 'routerLink' since it isn't a known property of 'a'.
```

**Why It Happens:** Same as NG0303 — a directive or component is missing from imports.

**Common Missing Imports:**

| Error mentions | Import needed |
|---|---|
| `routerLink` / `routerLinkActive` | `RouterLink`, `RouterLinkActive` |
| `ngModel` | `FormsModule` |
| `formGroup` / `formControlName` | `ReactiveFormsModule` |
| `ngClass` / `ngStyle` | `NgClass`, `NgStyle` (but prefer `class`/`style` bindings) |
| `ngSrc` | `NgOptimizedImage` |
| Custom component tags | The component class itself |

```typescript
@Component({
  imports: [RouterLink, RouterLinkActive],
  template: `<a routerLink="/home" routerLinkActive="active">Home</a>`,
})
```

## 🔴 CORS Errors

**The Error (browser console):**
```
Access to XMLHttpRequest at 'http://api.example.com/data' from origin
'http://localhost:4200' has been blocked by CORS policy.
```

**Why It Happens:** The browser blocks cross-origin requests unless the server includes proper CORS headers. This is a **server-side** issue, not an Angular issue.

**The Fix:**

1. **Development — use a proxy** (recommended):

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json
```

2. **Production — configure CORS on your server:**

```typescript
// Express.js example
app.use(cors({
  origin: 'https://your-angular-app.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

:::caution
Never use `Access-Control-Allow-Origin: *` with credentials in production. It's a security risk.
:::

## 🔴 Hydration Mismatch Errors (SSR)

**The Error:**
```
Angular has detected that this component's DOM structure was generated by the server,
but the client-side content doesn't match.
```

**Why It Happens:** The HTML rendered on the server differs from what Angular renders on the client. Common causes: browser-only APIs, random values, date/time differences.

**The Fix:**

```typescript
// ❌ Bad — using browser API directly
@Component({
  template: `<p>Width: {{ window.innerWidth }}px</p>`,
})
export class MyComponent { }

// ✅ Fix — guard platform-specific code
@Component({
  template: `
    @if (screenWidth()) {
      <p>Width: {{ screenWidth() }}px</p>
    }
  `,
})
export class MyComponent {
  private readonly platformId = inject(PLATFORM_ID);
  screenWidth = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      this.screenWidth.set(window.innerWidth);
    });
  }
}

// ✅ Or skip hydration for dynamic content
@Component({
  host: { ngSkipHydration: 'true' },
  // ...
})
export class DynamicWidgetComponent { }
```

## 🔴 Zone.js Issues

**The Error:**
```
Error: Expected to be running in 'ProxyZone', but it was not found.
```

**Why It Happens:** Usually a testing issue — Zone.js test helpers aren't loaded properly, or async operations are escaping the zone.

**The Fix:**

```typescript
// For tests — ensure proper async handling
it('should load data', async () => {
  // Use async/await or fakeAsync
  const fixture = TestBed.createComponent(MyComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Data');
});

// For production — if third-party code runs outside the zone
export class MyComponent {
  private readonly ngZone = inject(NgZone);

  initThirdPartyLib() {
    this.ngZone.runOutsideAngular(() => {
      // Third-party code that shouldn't trigger change detection
      initHeavyLibrary();
    });
  }

  onThirdPartyEvent(data: string) {
    this.ngZone.run(() => {
      // Back in the zone — triggers change detection
      this.data.set(data);
    });
  }
}
```

## 🔴 Build and Compilation Errors

### "Cannot find module" Errors

```
Error: Cannot find module './environments/environment'
```

**The Fix:** Check that the file exists and the path is correct. With `fileReplacements` in `angular.json`, ensure both the base and replacement files exist.

### Type Errors in Templates

```
Error: Type 'string | undefined' is not assignable to type 'string'.
```

**The Fix:** Use the non-null assertion operator or handle the undefined case:

```html
<!-- ✅ Use @if to narrow the type -->
@if (user(); as user) {
  <app-profile [name]="user.name" />
}

<!-- ✅ Or use the ! operator when you're certain -->
<app-profile [name]="user()!.name" />
```

### "Circular dependency detected" Build Warning

```
Warning: Circular dependency detected:
src/app/a.ts -> src/app/b.ts -> src/app/a.ts
```

**The Fix:**
- Extract shared interfaces into a separate file
- Use injection tokens instead of direct imports
- Restructure to break the cycle

```typescript
// shared/types.ts — break the cycle by extracting shared types
export interface UserData {
  id: string;
  name: string;
}
```

## 🔍 Debugging Tips

1. **Use Angular DevTools** — Install the browser extension to inspect component trees, signal values, and change detection.

2. **Enable source maps** — In `angular.json`, set `"sourceMap": true` for development builds.

3. **Use `ng.getComponent()`** — In the browser console, select a DOM element and run:
```javascript
ng.getComponent($0) // returns the component instance
```

4. **Check the Angular error reference** — Every `NGxxxx` error code has a detailed explanation at `angular.dev/errors/NGxxxx`.

5. **Read the stack trace bottom-up** — The most relevant frame is usually near the top, but the root cause context is at the bottom.
