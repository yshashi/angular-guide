---
title: Effects API 🎭
description: Run side effects with effect() and afterRenderEffect() in Angular 22 — injection context, cleanup, timing, render phases, and when NOT to use effects.
sidebar:
  order: 4
---

An **effect** is a function that runs whenever the signals it reads change. Use effects to push signal state **out** into things that aren't signals: `localStorage`, analytics, a canvas, a third-party chart. Effects are powerful but they should be the *last* tool you reach for — most "reactions" are better written as `computed()`, `linkedSignal()` or a resource.

## What you'll learn

- Create effects with `effect()` and understand when they run
- Clean up timers and subscriptions with `onCleanup`
- Create effects outside a constructor and destroy them manually
- Work with the DOM after rendering using `afterRenderEffect()` and its phases
- Recognise when you **shouldn't** use an effect

## Your first effect

```ts title="theme-toggle.ts"
import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  template: `<button type="button" (click)="toggle()">Theme: {{ theme() }}</button>`,
})
export class ThemeToggle {
  protected readonly theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark' | null) ?? 'light',
  );

  constructor() {
    // Runs once, then again every time theme() changes
    effect(() => {
      localStorage.setItem('theme', this.theme());
    });
  }

  protected toggle() {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
```

How an effect behaves:

- It **always runs at least once**, to discover which signals it reads.
- It tracks the signals read in its **latest** run (dynamic dependencies, like `computed`).
- It runs **asynchronously**, as part of change detection — not immediately when you call `set()`. Several changes in a row produce one run.

## When to use effects (and when not to)

Good uses:

- Logging or analytics when state changes
- Syncing to storage: `localStorage`, `sessionStorage`, cookies, IndexedDB
- Imperative DOM work that templates can't express
- Driving a non-Angular library: charts, maps, canvas, editors

:::danger[Don't use effects to propagate state]
If your effect reads signal A and calls `set()` on signal B, you almost certainly want a `computed()` (or a `linkedSignal()` if B must also be user-editable). Copying state with effects causes extra change detection cycles, `ExpressionChangedAfterItHasBeenChecked` errors, and infinite loops.
:::

```ts
// ❌ Effect copying derived data
readonly first = signal('Ada');
readonly last = signal('Lovelace');
readonly fullName = signal('');
constructor() {
  effect(() => this.fullName.set(`${this.first()} ${this.last()}`));
}

// ✅ Derive it
readonly fullName = computed(() => `${this.first()} ${this.last()}`);
```

| You want to… | Use instead of an effect |
|---|---|
| Calculate a value from signals | `computed()` |
| Reset a writable value when something else changes | `linkedSignal()` |
| Fetch data when a signal changes | `resource()` / `httpResource()` |
| React to a form value | Signal Forms rules (`validate`, `disabled`, `hidden`, …) |

## Injection context

`effect()` needs an [injection context](/advanced/dependency-injection/) because it registers itself with the component (or service) so Angular can destroy it automatically. The easiest place is a constructor or a field initializer:

```ts
@Component({ /* … */ })
export class Analytics {
  readonly page = input.required<string>();

  constructor() {
    effect(() => console.log('Viewed', this.page()));
  }
}
```

To create an effect later (for example after a button click), pass an `Injector`:

```ts title="later.ts"
import { Component, EffectRef, Injector, effect, inject, signal } from '@angular/core';

@Component({ selector: 'app-later', template: '' })
export class Later {
  private readonly injector = inject(Injector);
  private readonly count = signal(0);
  private ref?: EffectRef;

  startLogging() {
    this.ref = effect(() => console.log(this.count()), { injector: this.injector });
  }

  stopLogging() {
    this.ref?.destroy();
  }
}
```

`effect()` returns an `EffectRef` with a `destroy()` method. Pass `{ manualCleanup: true }` if you want to manage the lifetime yourself — then you **must** call `destroy()`.

## Cleaning up

Effects that start long-running work (timers, subscriptions, sockets) should cancel it before the next run and when the component is destroyed. Your effect function receives an `onCleanup` callback:

```ts title="clock.ts"
import { Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<p>{{ now() }}</p>`,
})
export class Clock {
  readonly intervalMs = input(1000);
  protected readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    effect((onCleanup) => {
      const id = setInterval(() => this.now.set(new Date().toLocaleTimeString()), this.intervalMs());
      onCleanup(() => clearInterval(id)); // runs before the next run and on destroy
    });
  }
}
```

## Reading without tracking

Use [`untracked()`](/modern/signals/#reading-without-tracking-untracked) for reads that shouldn't re-trigger the effect, and to call code that might read signals internally:

```ts
effect(() => {
  const page = this.page(); // tracked
  untracked(() => {
    this.visits.update((v) => v + 1);       // not tracked
    console.log(`Viewed ${page} (visit #${this.visits()})`);
  });
});
```

## Effects and `async`

Only signals read **before** the first `await` are tracked:

```ts
effect(async () => {
  const currentTheme = theme(); // ✅ tracked
  const data = await fetchUserData();
  console.log(data.name, currentTheme);
});
```

Remember an async effect can still be running when the next run starts — prefer a [resource](/modern/resource-api/) for fetching data, which handles cancellation for you.

## When do effects run?

Effects are scheduled through change detection:

| Kind | Created in | Runs | Destroyed when |
|---|---|---|---|
| **View effect** | A component/directive (or a service provided by one) | Before that component is checked | The component is destroyed |
| **Root effect** | A root service (`@Service()`) | Before any component is checked | The app is destroyed |

If an effect changes one of its own dependencies, it runs again before change detection continues.

## DOM work: `afterRenderEffect()`

`effect()` runs **before** Angular updates the DOM. If you need to read or write the DOM *after* rendering — measuring elements, updating a third-party widget — use `afterRenderEffect()`. It tracks signals like `effect()`, but runs after the DOM has been updated, and only in the browser (never during SSR).

```ts title="chart.ts"
import { Component, ElementRef, afterNextRender, afterRenderEffect, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-chart',
  template: `<canvas #canvas></canvas>`,
})
export class Chart {
  readonly data = input.required<number[]>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: ChartInstance;

  constructor() {
    // Once: create the chart
    afterNextRender({
      write: () => {
        this.chart = createChart(this.canvas().nativeElement, this.data());
      },
    });

    // Every time data() changes, after the DOM is updated
    afterRenderEffect({
      write: () => {
        this.chart?.update(this.data());
      },
    });
  }
}
```

### Render phases

To avoid layout thrashing (forced reflows), split DOM work into phases. Angular runs every component's `earlyRead`, then every `write`, then `mixedReadWrite`, then `read`:

| Phase | Use it to |
|---|---|
| `earlyRead` | Read layout *before* writing (e.g. measure an element) |
| `write` | Write to the DOM. **Never read** here. |
| `mixedReadWrite` | Read and write together — avoid if you can split the work |
| `read` | Read from the DOM. **Never write** here. |

Each phase receives the previous phase's return value **as a signal**, plus an `onCleanup` function:

```ts title="auto-size.ts"
import { Component, ElementRef, afterRenderEffect, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-autosize',
  template: `<textarea #box [value]="text()"></textarea>`,
})
export class AutoSize {
  readonly text = input('');
  private readonly box = viewChild.required<ElementRef<HTMLTextAreaElement>>('box');

  constructor() {
    afterRenderEffect({
      earlyRead: () => {
        this.text(); // track text so this re-runs when it changes
        return this.box().nativeElement.scrollHeight;
      },
      write: (scrollHeight) => {
        this.box().nativeElement.style.height = `${scrollHeight()}px`;
      },
    });
  }
}
```

:::caution
If you pass a plain function (`afterRenderEffect(() => …)`), it runs in the `mixedReadWrite` phase, which can cause extra reflows. Prefer the phase object. And before reaching for either, check whether a `ResizeObserver`, `IntersectionObserver` or `MutationObserver` solves the problem more directly.
:::

`afterNextRender()` (run once) and `afterEveryRender()` (run after every render, not signal-driven) use the same phases.

## Testing effects

Effects run during change detection. In tests, flush them with `TestBed.tick()` or `await fixture.whenStable()` before asserting. See [Testing Signals](/testing/testing-signals/).

## Common mistakes

| Mistake | Fix |
|---|---|
| Copying state between signals in an effect | `computed()` / `linkedSignal()` |
| Fetching data in an effect and writing the result to a signal | `resource()` / `httpResource()` |
| Forgetting to clear timers/subscriptions | Use `onCleanup` |
| Calling `effect()` in `ngOnInit` or a click handler without an injector | Create it in the constructor or pass `{ injector }` |
| Expecting an effect to run synchronously after `set()` | Effects run during the next change detection |
| Reading/writing DOM in `effect()` | Use `afterRenderEffect()` with phases |

:::note[Older versions]
Before v19 you needed `{ allowSignalWrites: true }` to set signals inside an effect. That option is deprecated and does nothing — signal writes are allowed by default (but see the warning above about using them).
:::

## Key takeaways

- `effect()` syncs signal state to the non-signal world; it runs at least once and then on changes.
- Create effects in an injection context; they're destroyed with their owner.
- Use `onCleanup` for timers, listeners and subscriptions.
- Use `afterRenderEffect()` with phases for DOM work after rendering.
- If you're calculating or fetching, you don't need an effect.

## Next steps

- [Linked Signals](/modern/linked-signals/) — writable derived state (often replaces effects)
- [Resource API](/modern/resource-api/) — async data without effects
- [Zoneless Angular](/modern/zoneless/)
