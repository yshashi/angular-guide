---
title: Angular DevTools 🔍
description: Debug and profile Angular applications using Angular DevTools browser extension
sidebar:
  order: 3
---

Angular DevTools is an official browser extension that gives you deep insight into your Angular application's component tree, change detection performance, dependency injection, and routing. It is an essential tool for understanding and optimizing Angular apps.

## 🎯 Installation

Angular DevTools is available as a browser extension:

- **Chrome**: Search "Angular DevTools" in the [Chrome Web Store](https://chromewebstore.google.com/) and click **Add to Chrome**
- **Edge**: Install the same extension from the Edge Add-ons store or the Chrome Web Store
- **Firefox**: Angular DevTools is available from Firefox Add-ons

Once installed, open your browser DevTools (`F12` or `Cmd+Option+I` / `Ctrl+Shift+I`) and look for the **Angular** tab.

:::note
Angular DevTools only activates on pages running Angular in **development mode**. Production builds with optimizations enabled will not be detected.
:::

## 🌳 Component Explorer

The Component Explorer is the primary panel in Angular DevTools. It displays the full component tree of your application.

### Viewing the Component Tree

Open the **Angular** tab in browser DevTools to see:

- The hierarchical tree of all components on the current page
- Each component's name, selector, and nesting level
- A visual indicator of the currently selected component

Click any component in the tree to inspect it in detail.

### Inspecting Component State

When you select a component, the right panel shows:

- **Properties** — All class properties and their current values
- **Inputs** — Signal inputs and their current values
- **Outputs** — Output emitters defined on the component
- **Signals** — Signal values with real-time updates
- **View Encapsulation** — The encapsulation mode in use
- **Change Detection** — Whether `OnPush` or `Default` is active

```typescript
// Given this component:
@Component({
  selector: 'app-user-card',
  template: `<h2>{{ name() }}</h2>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  name = input.required<string>();
  isOnline = signal(false);
  clickCount = signal(0);
}
```

DevTools displays all signals (`name`, `isOnline`, `clickCount`) with their current values and lets you observe changes in real time.

### Editing State

You can directly modify component properties from the DevTools panel:

1. Select a component in the tree
2. Find the property you want to change
3. Click the value and type a new one
4. The component re-renders immediately with the new value

This is especially useful for testing edge cases without modifying code.

### Navigating Between DevTools and Elements

- **Select component → Jump to DOM**: Right-click a component and select "Inspect DOM element"
- **Select DOM element → Jump to component**: Use the component picker icon (crosshair) in the Angular DevTools toolbar, then click an element on the page

## ⚡ Profiler

The Profiler helps you identify performance bottlenecks by recording change detection cycles.

### Recording a Profile

1. Switch to the **Profiler** tab in Angular DevTools
2. Click the **Record** button (circle icon)
3. Interact with your application — click buttons, navigate, trigger events
4. Click **Stop** to end the recording

### Understanding the Flame Chart

After recording, the Profiler displays:

- **Change Detection Cycles** — Each bar represents one change detection run
- **Component Breakdown** — Which components were checked in each cycle
- **Time Spent** — Duration for each component's change detection
- **Lifecycle Hooks** — Time spent in hooks like `ngOnInit`, `ngDoCheck`, `ngAfterViewInit`

### Identifying Slow Components

Look for:

- Components that take a disproportionately long time during change detection
- Components that are checked even when they shouldn't be (consider using `OnPush`)
- Unnecessary change detection cycles triggered by events

:::tip
If you see components being checked on every cycle without actual changes, switch them to `ChangeDetectionStrategy.OnPush` and use signals for state management. This is the single most impactful performance optimization.
:::

### Profiler Bar Chart View

Switch between views:

- **Flame Chart** — Shows the hierarchical breakdown of time per component
- **Bar Chart** — Compares component change detection times side by side
- **Tree Map** — Visual representation of time distribution

## 🔌 Dependency Injection Inspector

Angular DevTools includes a DI inspector that lets you explore the injector hierarchy:

- View the **injector tree** for any component
- See which providers are available at each level
- Understand where a service instance is created vs. inherited
- Identify `providedIn: 'root'` services vs. component-level providers

This is particularly useful for debugging issues where a service is unexpectedly shared or duplicated.

## 🗺️ Router Tree View

The Router tab displays your application's routing configuration:

- Visual tree of all routes and nested routes
- Current active route highlighted
- Route parameters and data
- Lazy-loaded routes and their loading status
- Route guards attached to each route

This helps you verify that your routing configuration is correct and understand which routes are active.

## 📡 Signal Debugging

Angular DevTools has first-class support for debugging signals:

### Viewing Signal Values

- All signals in a component are displayed with their current values
- Signal values update in real time as your app changes state
- Computed signals show their derived values
- Effects and their dependencies are visible

### Tracking Signal Changes

When debugging reactive state:

1. Select a component with signals
2. Observe signal values in the properties panel
3. Interact with your app to trigger changes
4. Watch how signal values propagate through the component tree

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubleCount() }}</p>
    <button (click)="increment()">+1</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

In DevTools, you'll see both `count` and `doubleCount` update together when the button is clicked.

## 💡 Tips for Effective Debugging

### Use the Component Picker

Click the **crosshair icon** in the Angular tab toolbar, then click any element on the page. DevTools jumps directly to that component in the tree — much faster than manually searching.

### Filter Components

Use the search/filter box at the top of the Component Explorer to find components by name. This is essential in large applications with deep component trees.

### Check Change Detection Strategy

In the component details, verify that performance-critical components use `OnPush`. If they don't, change detection runs on every cycle for those components.

### Profile Before and After Optimization

1. Record a profile with the current code
2. Make your optimization (e.g., add `OnPush`, use `trackBy` with `@for`)
3. Record another profile
4. Compare the two recordings

### Common Issues DevTools Helps Diagnose

| Issue | What to Look For |
|-------|-----------------|
| Slow page | Profiler shows components taking >16ms |
| Unnecessary re-renders | Components checked without state changes |
| Missing data | Inspect inputs to see if values are passed correctly |
| Wrong service instance | DI inspector shows unexpected injector hierarchy |
| Route not matching | Router tree shows route configuration mismatch |

:::caution
Angular DevTools consumes memory while profiling. For long recording sessions, the browser may slow down. Keep profiling sessions focused and short for the best experience.
:::
