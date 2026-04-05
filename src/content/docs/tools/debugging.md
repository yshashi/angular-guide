---
title: Debugging Angular Apps 🐛
description: Techniques and tools for debugging Angular applications effectively
sidebar:
  order: 4
---

Debugging is one of the most important skills for Angular developers. Whether you're tracking down a change detection issue, diagnosing a failing HTTP request, or fixing a memory leak, knowing the right tools and techniques saves hours of frustration. This guide covers browser DevTools, Angular-specific debugging utilities, signal debugging, and common debugging scenarios.

## 🎯 Browser DevTools Essentials

Every modern browser ships with powerful DevTools. Here's how to use each panel effectively for Angular development.

### Elements Panel

- Inspect the rendered DOM structure of your components
- Verify that bindings produce the expected HTML attributes and content
- Check computed styles to debug CSS issues in component templates
- Right-click an element and select **Break on → Subtree modifications** to catch unexpected DOM changes

### Console Panel

The Console is your primary debugging interface. Use `console` methods strategically:

```typescript
@Component({
  selector: 'app-debug-demo',
  template: `<button (click)="handleClick()">Click</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugDemoComponent {
  private items = signal<string[]>([]);

  handleClick() {
    console.log('Items:', this.items());
    console.table(this.items());        // Tabular display
    console.time('operation');
    // ... expensive operation
    console.timeEnd('operation');        // Measure duration
    console.trace('Call stack');         // Print call stack
  }
}
```

:::tip
Use `console.table()` for arrays and objects — it renders data in a readable table format. Use `console.group()` / `console.groupEnd()` to organize related log messages.
:::

### Network Panel

Essential for debugging HTTP issues:

- **Filter by XHR/Fetch** to see only API calls
- Click a request to see headers, payload, response body, and timing
- Check the **Timing** tab to identify slow requests
- Use **Throttling** to simulate slow network conditions
- Look for CORS errors in failed requests (red entries with no response)

### Sources Panel

The Sources panel is where you set breakpoints and step through code:

1. Open Sources → find your TypeScript files under `webpack://` or `localhost`
2. Click a line number to set a breakpoint
3. Refresh or trigger the action
4. Use the controls to **Step Over** (F10), **Step Into** (F11), or **Step Out** (Shift+F11)

## 🔍 Breakpoint Debugging

### Source Maps

Angular development builds include source maps by default, mapping compiled JavaScript back to your TypeScript source. Verify source maps are working:

1. Open DevTools → Sources
2. Look for your `.ts` files in the file tree
3. If missing, check that `sourceMap: true` is set in `angular.json` under the development configuration

### Types of Breakpoints

| Breakpoint Type | How to Set | Use Case |
|----------------|-----------|----------|
| Line breakpoint | Click line number in Sources | Pause at a specific line |
| Conditional | Right-click line → "Add conditional" | Pause only when condition is true |
| Logpoint | Right-click line → "Add logpoint" | Log without pausing execution |
| DOM breakpoint | Elements → right-click → "Break on" | Catch unexpected DOM mutations |
| XHR/Fetch | Sources → XHR Breakpoints | Pause on specific API calls |
| Event listener | Sources → Event Listener Breakpoints | Pause on click, keydown, etc. |

### Conditional Breakpoints

Conditional breakpoints are invaluable when debugging loops or frequently called methods:

```typescript
// Right-click the line number in Sources panel
// Set condition: item.id === 42
@for (item of items(); track item.id) {
  <app-item [data]="item" />  // Breaks only when item.id === 42
}
```

## 🅰️ Angular-Specific Debugging

Angular provides built-in debugging utilities accessible from the browser console.

### `ng.getComponent()`

Get a reference to the Angular component instance from a DOM element:

```javascript
// In browser console:
// 1. Select an element in the Elements panel
// 2. Run:
const component = ng.getComponent($0);
console.log(component);
```

`$0` refers to the currently selected element in the Elements panel. This gives you access to all component properties, signals, and methods.

### `ng.applyChanges()`

Force Angular to run change detection on a component:

```javascript
// After modifying a component's state in the console:
const el = document.querySelector('app-user-profile');
const component = ng.getComponent(el);
component.name.set('New Name');  // Modify a signal
ng.applyChanges(el);             // Trigger change detection
```

### Other Angular Debug Utilities

```javascript
// Get the component's injector
ng.getOwningComponent($0);

// Get directive instances on an element
ng.getDirectives($0);

// Get the root components
document.querySelectorAll('[ng-version]');
```

:::note
These `ng.*` utilities are only available in development mode. Production builds strip them out for security and performance.
:::

## 📡 Signal Debugging Techniques

Signals are the future of Angular state management. Here's how to debug them effectively.

### Inspecting Signal Values

```typescript
@Component({
  selector: 'app-signal-debug',
  template: `<p>{{ fullName() }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalDebugComponent {
  firstName = signal('John');
  lastName = signal('Doe');
  fullName = computed(() => {
    console.log('fullName computed');  // Logs when recomputed
    return `${this.firstName()} ${this.lastName()}`;
  });
}
```

Adding `console.log` inside `computed()` helps you verify when recalculations happen. The log should only fire when `firstName` or `lastName` actually changes.

### Debugging Signal Effects

```typescript
export class DataService {
  private data = signal<Item[]>([]);

  constructor() {
    effect(() => {
      console.log('Data changed:', this.data());
      console.trace('Changed from:');  // Shows what triggered the change
    });
  }
}
```

### Common Signal Issues

| Problem | Diagnosis |
|---------|-----------|
| Computed not updating | Check that you're calling the signal (e.g., `count()` not `count`) |
| Effect running too often | Check if the effect reads more signals than necessary |
| Stale values in template | Ensure component uses `OnPush` + signals (not plain properties) |

## 🔥 Common Debugging Scenarios

### Change Detection Issues

**Symptom**: UI not updating after data changes.

**Debug steps**:

1. Check if the component uses `OnPush` — if so, ensure state uses signals or inputs
2. Use Angular DevTools Profiler to see if the component is checked
3. Verify that data mutations create new references (not mutating arrays/objects in place)

```typescript
// ❌ Mutating in place — OnPush won't detect this
this.items().push(newItem);

// ✅ Creating a new reference — OnPush detects this
this.items.update(items => [...items, newItem]);
```

### Routing Problems

**Symptom**: Route not loading, wrong component displayed, or infinite redirects.

**Debug steps**:

1. Open Angular DevTools → Router tab to see the route tree
2. Add logging to route guards:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  console.log('Guard checking route:', state.url);
  console.log('Is authenticated:', authService.isAuthenticated());

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
```

3. Check for wildcard route order — `**` must be last

### HTTP Errors

**Symptom**: API calls failing or returning unexpected data.

**Debug steps**:

1. Open Network panel → filter by Fetch/XHR
2. Check request URL, method, headers, and body
3. Add an HTTP interceptor for centralized logging:

```typescript
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`, req.body);
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`[HTTP] ${req.url} → ${event.status}`, event.body);
        }
      },
      error: (error) => {
        console.error(`[HTTP] ${req.url} → ERROR`, error);
      },
    }),
  );
};
```

### Memory Leaks

**Symptom**: App becomes slower over time, memory usage climbs.

**Debug steps**:

1. Open DevTools → **Memory** panel
2. Take a heap snapshot, perform actions, take another snapshot
3. Compare snapshots to find growing object counts
4. Common causes in Angular:
   - Subscriptions not cleaned up (use `takeUntilDestroyed()`)
   - Event listeners not removed
   - `setInterval` / `setTimeout` not cleared

```typescript
export class DataComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(tick => console.log(tick));
  }
}
```

:::caution
Always use `takeUntilDestroyed()` or the `DestroyRef` pattern for subscriptions. Manual `unsubscribe()` in `ngOnDestroy` is error-prone.
:::

## 🌐 Debugging SSR Hydration Issues

When using Angular SSR, hydration mismatches are a common issue.

**Symptom**: Console warning about node mismatch during hydration.

**Debug steps**:

1. Look for `NG0500` or `NG0502` errors in the console
2. Common causes:
   - Browser-only APIs (`window`, `document`, `localStorage`) used during server rendering
   - Date/time values that differ between server and client
   - Random values generated differently on server vs. client

```typescript
// ❌ Causes hydration mismatch
@Component({
  template: `<p>{{ currentTime }}</p>`,
})
export class TimeComponent {
  currentTime = new Date().toLocaleTimeString();
}

// ✅ Use afterNextRender to set browser-only values
@Component({
  template: `<p>{{ currentTime() }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeComponent {
  currentTime = signal('');

  constructor() {
    afterNextRender(() => {
      this.currentTime.set(new Date().toLocaleTimeString());
    });
  }
}
```

## 🔨 Debugging Build Errors

### Common Build Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `NG0301: Export not found` | Missing export in module | Check that the symbol is exported |
| `NG2003: Missing injectable` | No `@Injectable()` decorator | Add `@Injectable({ providedIn: 'root' })` |
| `NG8001: Unknown element` | Component not imported | Import the component in the consuming component |
| `TS2307: Cannot find module` | Missing or wrong import path | Check the path and install missing packages |
| `Budget exceeded` | Bundle too large | Analyze with `--stats-json` and optimize |

### Reading Build Output

When `ng build` fails, read the error from the bottom up:

1. The **last line** usually has the concise error message
2. The **file path and line number** point to the source
3. The **error code** (e.g., `NG8001`) is searchable in Angular docs

```bash
# Get more verbose output
ng build --verbose
```

:::tip
For mysterious build errors, try clearing the Angular cache:
```bash
ng cache clean
npm install
ng build
```
:::
