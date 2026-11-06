---
title: Lifecycle Hooks 🔄
description: Angular component lifecycle in v22 — ngOnInit, typed ngOnChanges, DestroyRef, afterNextRender, afterEveryRender, afterRenderEffect and signal alternatives.
sidebar:
  order: 3
---

Every component goes through a **lifecycle**: Angular creates it, sets its inputs, renders its template, checks it for changes, and finally destroys it. **Lifecycle hooks** let you run code at each of those moments. In modern Angular, signals handle most of what hooks used to do, so this page also shows you *when you don't need a hook at all*.

## What you'll learn

- The order Angular runs lifecycle hooks in
- When to use the constructor vs `ngOnInit`
- How to react to input changes with typed `SimpleChanges` — and the signal alternative
- How to clean up with `ngOnDestroy`, `DestroyRef` and `takeUntilDestroyed()`
- How to touch the DOM safely with `afterNextRender`, `afterEveryRender` and `afterRenderEffect`

## The lifecycle at a glance

| Phase | Hook | Runs | Typical use today |
|---|---|---|---|
| Creation | `constructor` | Once, when the class is instantiated | `inject()`, create signals, register `effect()`, `afterNextRender()`, `DestroyRef` callbacks |
| Change detection | `ngOnChanges` | Before `ngOnInit` and whenever a template-bound input changes | Rarely needed — prefer `computed()`/`effect()` on signal inputs |
| | `ngOnInit` | Once, after inputs are first set | One-time setup that needs input values |
| | `ngDoCheck` | On every check of this component | Almost never — custom change detection |
| | `ngAfterContentInit` | Once, after projected content is ready | Rarely needed with signal `contentChild()` queries |
| | `ngAfterContentChecked` | After every content check | Almost never |
| | `ngAfterViewInit` | Once, after the component's view (and child views) is ready | Rarely needed with signal `viewChild()` queries |
| | `ngAfterViewChecked` | After every view check | Almost never |
| Rendering | `afterNextRender()` | Once, after the next time the **whole app** has rendered to the DOM | DOM measurement, focus, 3rd-party library init |
| | `afterEveryRender()` | After every app render | Keeping manual DOM work in sync |
| | `afterRenderEffect()` | After render, when signals it reads change | Updating 3rd-party widgets when data changes |
| Destruction | `ngOnDestroy` / `DestroyRef` | Once, before the component is removed | Cleanup: timers, listeners, subscriptions |

**Order during initialization:** `constructor` → `ngOnChanges` (if inputs are bound) → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → *(DOM rendered)* → `afterNextRender` → `afterEveryRender`.

**On later updates:** `ngOnChanges` (if inputs changed) → `ngDoCheck` → `ngAfterContentChecked` → `ngAfterViewChecked` → *(DOM rendered)* → `afterEveryRender`.

:::note
Class-method hooks (`ngOnInit`, …) belong to one component instance. The render functions (`afterNextRender`, `afterEveryRender`, `afterRenderEffect`) are **application-wide**: they run after Angular has rendered *all* components. They must be called in an injection context (usually the constructor) and **never run on the server** (SSR/prerendering), which makes them the safe place for browser-only code.
:::

Implementing the matching interface (`OnInit`, `OnChanges`, `OnDestroy`, `AfterViewInit`, …) is optional but catches typos like `ngOnInt`.

## Constructor vs `ngOnInit`

Inputs are **not set yet** in the constructor. Reading a required input there throws error `NG0950` ("Required input is accessed before a value is set").

```ts title="greeting.ts"
import { Component, OnInit, input, signal } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<p>{{ message() }}</p>`,
})
export class Greeting implements OnInit {
  readonly name = input.required<string>();
  protected readonly message = signal('');

  constructor() {
    // ❌ this.name() would throw NG0950 here
  }

  ngOnInit() {
    this.message.set(`Hello, ${this.name()}!`); // ✅ inputs are ready
  }
}
```

But usually you don't need either — derive the value with `computed()`. It stays correct even when `name` changes later (which the `ngOnInit` version doesn't!):

```ts
@Component({
  selector: 'app-greeting',
  template: `<p>{{ message() }}</p>`,
})
export class Greeting {
  readonly name = input.required<string>();
  protected readonly message = computed(() => `Hello, ${this.name()}!`);
}
```

**Rule of thumb:** constructor (or field initializers) for wiring things up; `ngOnInit` only for one-time work that needs the *initial* input values; signals for everything that should stay in sync.

## Reacting to input changes

### `ngOnChanges` with typed `SimpleChanges`

`ngOnChanges` receives a `SimpleChanges` object with `previousValue`, `currentValue` and `firstChange` for each input that changed. Pass your class as the generic (`SimpleChanges<Price>`) and the values are **fully typed** — even for signal inputs.

```ts title="price.ts"
import { Component, OnChanges, SimpleChanges, input } from '@angular/core';

@Component({
  selector: 'app-price',
  template: `{{ amount() }} {{ currency() }}`,
})
export class Price implements OnChanges {
  readonly amount = input(0);
  readonly currency = input('EUR');

  ngOnChanges(changes: SimpleChanges<Price>) {
    const amount = changes.amount; // SimpleChange<number> | undefined
    if (amount && !amount.firstChange) {
      console.log(`Price changed by ${amount.currentValue - amount.previousValue}`);
    }
  }
}
```

- `ngOnChanges` only fires for changes coming from **template bindings** (not when you set a property in code).
- Keys are the **class property names**, even if the input has an alias.

### The signal way: `computed()` and `effect()`

With signal inputs you rarely need `ngOnChanges`. Use `computed()` for derived values and `effect()` for side effects:

```ts title="price.ts"
import { Component, effect, input } from '@angular/core';

@Component({
  selector: 'app-price',
  template: `{{ amount() }}`,
})
export class Price {
  readonly amount = input(0);

  constructor() {
    let previous: number | undefined;
    effect(() => {
      const current = this.amount();
      if (previous !== undefined) console.log(`Price changed by ${current - previous}`);
      previous = current;
    });
  }
}
```

Need to reset local state when an input changes? Use [`linkedSignal()`](/modern/linked-signals/). Need to load data when an input changes? Use [`resource()` / `httpResource()`](/modern/resource-api/).

## Cleaning up: `ngOnDestroy` and `DestroyRef`

Angular destroys a component when it leaves the page (an `@if` turns false, you navigate away, …). Anything that would keep running — timers, global event listeners, manual subscriptions — must be stopped.

### `DestroyRef` (recommended)

Inject `DestroyRef` and register a callback **right next to the setup code**:

```ts title="clock.ts"
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clock',
  imports: [DatePipe],
  template: `{{ now() | date: 'mediumTime' }}`,
})
export class Clock {
  protected readonly now = signal(new Date());

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
```

Because `DestroyRef` is injectable, you can build **reusable helpers** that clean up after themselves:

```ts title="use-interval.ts"
import { DestroyRef, inject } from '@angular/core';

export function useInterval(ms: number, fn: () => void) {
  const id = setInterval(fn, ms);
  inject(DestroyRef).onDestroy(() => clearInterval(id)); // needs an injection context
}
```

More `DestroyRef` features:

- `onDestroy()` returns a function that **unregisters** the callback.
- `destroyRef.destroyed` is `true` once the component is gone — check it after an `await` to avoid touching a destroyed component:

```ts
private readonly destroyRef = inject(DestroyRef);

async save() {
  await this.api.save();
  if (this.destroyRef.destroyed) return; // user navigated away meanwhile
  this.saved.set(true);
}
```

- For RxJS subscriptions use `takeUntilDestroyed()` (it uses `DestroyRef` under the hood):

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

constructor() {
  interval(1000).pipe(takeUntilDestroyed()).subscribe(() => console.log('tick'));
}
```

### `ngOnDestroy`

The classic hook still works and is fine for simple cases:

```ts
export class LegacyClock implements OnInit, OnDestroy {
  protected readonly now = signal(new Date());
  private id?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.id = setInterval(() => this.now.set(new Date()), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.id);
  }
}
```

:::tip[What you don't need to clean up]
Angular cleans up automatically: template event listeners, `host` listeners, `output()` subscriptions, `effect()`, `computed()`, `toSignal()`, `resource()`/`httpResource()`, the `async` pipe, and the render hooks (`afterNextRender`, …) registered in a component.
:::

## Working with the DOM after render

Angular updates the DOM for you, but sometimes you must touch it yourself: focus an input, measure an element, start a chart or map library. Do it **after rendering**, using the render functions.

### `afterNextRender` — run once

```ts title="auto-focus.ts"
import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({
  selector: 'app-auto-focus',
  template: `<input #field />`,
})
export class AutoFocus {
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterNextRender(() => this.field().nativeElement.focus());
  }
}
```

This replaces the old `ngAfterViewInit` + `@ViewChild` pattern, and it is SSR-safe (it simply doesn't run on the server).

### Read/write phases and `afterEveryRender`

Mixing DOM reads and writes causes *layout thrashing*. Split your work into **phases**; Angular runs them in the order `earlyRead` → `write` → `mixedReadWrite` → `read` across all components. A value returned from one phase is passed to the next.

```ts title="measure.ts"
import { Component, ElementRef, afterEveryRender, afterNextRender, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-measure',
  template: `
    <div #box class="box"><ng-content /></div>
    <p>Height: {{ height() }}px</p>
  `,
})
export class Measure {
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  protected readonly height = signal(0);

  constructor() {
    afterNextRender({
      write: () => {
        this.box().nativeElement.style.minHeight = '120px';
      },
      read: () => {
        this.height.set(this.box().nativeElement.getBoundingClientRect().height);
      },
    });

    // Runs after *every* render of the app — keep it cheap!
    afterEveryRender({
      read: () => {
        const h = this.box().nativeElement.offsetHeight;
        if (h !== this.height()) this.height.set(h);
      },
    });
  }
}
```

If you omit the phase (`afterNextRender(() => …)`), the callback runs in `mixedReadWrite`. For size changes, a `ResizeObserver` is often a better fit than `afterEveryRender`.

### `afterRenderEffect` — run after render when signals change

`effect()` runs **before** the DOM is updated. `afterRenderEffect()` is an effect that runs **after** rendering, and only when the signals it reads change. It's ideal for keeping a third-party widget in sync with inputs:

```ts title="sales-chart.ts"
import {
  Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect,
  inject, input, viewChild,
} from '@angular/core';
import { ChartInstance, createChart } from './chart'; // your wrapper around a DOM charting library

@Component({
  selector: 'app-sales-chart',
  template: `<canvas #canvas width="400" height="200"></canvas>`,
})
export class SalesChart {
  readonly data = input.required<number[]>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: ChartInstance;

  constructor() {
    // 1. Create the chart once, after the first render
    afterNextRender({
      write: () => {
        this.chart = createChart(this.canvas().nativeElement, this.data());
      },
    });

    // 2. Update it after render whenever `data` changes
    afterRenderEffect({
      write: () => {
        this.chart?.update(this.data());
      },
    });

    // 3. Destroy it with the component
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
```

Phase callbacks of `afterRenderEffect` receive the previous phase's result **as a signal** plus an `onCleanup` function, and re-run only when their tracked signals change.

### Calling render hooks outside the constructor

Outside an injection context, pass an injector:

```ts
private readonly injector = inject(Injector);

start() {
  afterNextRender(() => console.log('rendered'), { injector: this.injector });
}
```

## The "checked" hooks and `ngDoCheck`

`ngDoCheck`, `ngAfterContentChecked` and `ngAfterViewChecked` run on **every** change detection pass of the component. They are easy to make slow and are almost never needed with signals and OnPush (the default since v22). Avoid them unless you are integrating code that can't notify Angular any other way.

Also avoid changing state that a template has *already rendered* inside `ngAfterViewInit`/`ngAfterContentInit` — that causes `ExpressionChangedAfterItHasBeenCheckedError` (`NG0100`). Signals and the render functions avoid this problem.

## Old pattern → modern pattern

| Old | Modern (v22) |
|---|---|
| `ngOnChanges` to compute a value | `computed(() => …)` from signal inputs |
| `ngOnChanges` to reset local state | `linkedSignal()` |
| `ngOnInit` to fetch data | `httpResource()` / `resource()` (or `toSignal()`) |
| `@ViewChild` + `ngAfterViewInit` | `viewChild()` + `afterNextRender()` |
| `@ContentChildren` + `ngAfterContentInit` | `contentChildren()` signal |
| `ngOnDestroy` + `Subject` + `takeUntil` | `DestroyRef.onDestroy()` / `takeUntilDestroyed()` |
| `ngAfterViewChecked` to sync a widget | `afterRenderEffect()` |
| `if (isPlatformBrowser(...))` around DOM code | `afterNextRender()` (never runs on the server) |

## Common mistakes

- **Reading required inputs in the constructor** → `NG0950`. Use `computed()`, the template, or `ngOnInit`.
- **Doing DOM work in `effect()`** — it runs before the DOM is updated. Use `afterRenderEffect()` or `afterNextRender()`.
- **Forgetting cleanup** for `setInterval`, `addEventListener` on `window`/`document`, or manual `subscribe()`.
- **Heavy work in `afterEveryRender` or `ngDoCheck`** — they run very often.
- **Relying on hook order between a component and directives on the same element** — Angular doesn't guarantee it.

## Key takeaways

- Constructor for wiring (`inject()`, signals, effects, render hooks); `ngOnInit` only when you need initial input values.
- Signals (`computed`, `effect`, `linkedSignal`, resources) replace most uses of `ngOnChanges` and `ngOnInit`.
- `DestroyRef` keeps cleanup next to setup and enables reusable helpers; `takeUntilDestroyed()` for RxJS.
- `afterNextRender` / `afterEveryRender` / `afterRenderEffect` are the safe, SSR-friendly place for DOM work — use the `read`/`write` phases.

## Next steps

- [Effects](/modern/effects/) — `effect()` in depth
- [Reactive Forms](/intermediate/reactive-forms/) — build forms with typed controls
- [RxJS in Angular](/intermediate/rxjs/) — `takeUntilDestroyed`, `toSignal` and friends
- [Memory Management](/advanced/memory-management/) — avoiding leaks in larger apps
