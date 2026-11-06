---
title: Custom Decorators 🏷️
description: How decorators work in Angular 22, which built-in decorators are replaced by functions, and how to write safe custom method and class decorators.
sidebar:
  order: 5
---

Decorators are the `@Something()` annotations you see all over Angular code: `@Component`, `@Directive`, `@Service`. They're a TypeScript feature, and you can write your own. But in modern Angular you should reach for them **less often** than you might think. This page explains how decorators really work in an Angular project, what Angular has replaced with plain functions, and the few custom decorator patterns that are safe and useful.

## What you'll learn

- What a decorator is and when it runs
- How Angular's own decorators are handled by the compiler
- Which member decorators are replaced by functions (`input()`, `inject()`, ...)
- How to write safe **method** and **class** decorators (log, measure, memoize, debounce, registry)
- The pitfalls: property decorators, injection, change detection and class replacement

## What is a decorator?

A decorator is a **function** that TypeScript calls **once, when the class is defined** (not when an instance is created). It receives the class, or a member of the class, and can annotate it or wrap it.

```ts
function Sealed(): ClassDecorator {
  return (target) => {
    Object.seal(target);
    Object.seal(target.prototype);
  };
}

@Sealed() // runs once, while the module is loading
class Point {}
```

Angular CLI projects compile with `"experimentalDecorators": true` in `tsconfig.json`. Leave it on. Your custom decorators therefore use TypeScript's **experimental (legacy) decorator signatures**: `ClassDecorator`, `MethodDecorator`, `PropertyDecorator` and `ParameterDecorator`. They don't use the newer TC39 standard `(value, context)` form.

## How Angular uses decorators

Angular's decorators (`@Component`, `@Directive`, `@Pipe`, `@Service`, `@Injectable`, `@NgModule`, ...) are **not** ordinary runtime decorators. The Angular compiler reads them at **build time** and turns them into static definitions on the class. That's why their metadata must be statically analyzable:

```ts
@Component({
  selector: 'app-hello',
  template: `<p>Hello {{ name() }}</p>`, // the compiler turns this into code at build time
})
export class Hello {
  readonly name = input('world');
}
```

### Member decorators you no longer need

Modern Angular replaced most **member** decorators with functions. They're easier to type, work with signals and need no special compiler magic:

| Older decorator | Modern replacement |
| --- | --- |
| `@Input()` | `input()`, `input.required()`, `model()` |
| `@Output()` + `EventEmitter` | `output()` |
| `@ViewChild` / `@ViewChildren` | `viewChild()` / `viewChildren()` |
| `@ContentChild` / `@ContentChildren` | `contentChild()` / `contentChildren()` |
| `@HostBinding` / `@HostListener` | `host: { ... }` in the decorator |
| `@Inject(TOKEN)` / `@Optional()` / `@Self()` / `@SkipSelf()` / `@Host()` in constructors | `inject(TOKEN, { optional, self, skipSelf, host })` |
| `@Injectable({ providedIn: 'root' })` | `@Service()` (v22) |

The old decorators still work, but new code shouldn't use them. Automatic migrations exist for inputs, outputs, queries and `inject()`. See [Migrating to Signals](/migration/signals/).

## Before writing a custom decorator, try a function

Most things people build with custom decorators have a simpler, type-safe Angular-native solution:

| Goal | Better tool |
| --- | --- |
| Share logic that needs services | An `injectX()` helper function ([example](/advanced/dependency-injection/#writing-your-own-injectx-helpers)) |
| Reusable host behaviour | A directive or [`hostDirectives`](/advanced/custom-directives/#composing-behaviour-with-hostdirectives) |
| Derived or cached values | `computed()` |
| Debounce user input | `debounced()` (experimental), RxJS `debounceTime`, or the Signal Forms `debounce()` rule |
| Log or modify HTTP calls | An HTTP interceptor function |
| Persist state to `localStorage` | An `effect()` that writes the signal |
| Format values in templates | A pure pipe |

Custom decorators are still handy for **cross-cutting, framework-independent** concerns on methods: logging, timing, memoizing a pure calculation, or registering classes in a registry. Those are the patterns below.

## Method decorators

A method decorator receives the prototype, the method name and its **property descriptor**. Replace `descriptor.value` with a wrapper function, and always call the original with the right `this`.

### `@Log()`: trace calls

```ts title="decorators.ts"
export function Log(label?: string): MethodDecorator {
  return (_target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const name = label ?? String(key);

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      console.log(`→ ${name}`, args);
      const result = original.apply(this, args);
      console.log(`← ${name}`, result);
      return result;
    };
  };
}
```

### `@Measure()`: time a method

```ts
export function Measure(): MethodDecorator {
  return (_target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const start = performance.now();
      try {
        return original.apply(this, args);
      } finally {
        console.log(`${String(key)} took ${(performance.now() - start).toFixed(1)} ms`);
      }
    };
  };
}
```

### `@Memoize()`: cache a pure, single-argument method

The decorator runs once per **class**, so per-instance state must be keyed by `this`. A `WeakMap` does that without leaking memory: the cache disappears with the instance.

```ts
export function Memoize(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (arg: unknown) => unknown;
    const caches = new WeakMap<object, Map<unknown, unknown>>();

    descriptor.value = function (this: object, arg: unknown) {
      let cache = caches.get(this);
      if (!cache) {
        cache = new Map();
        caches.set(this, cache);
      }
      if (!cache.has(arg)) {
        cache.set(arg, original.call(this, arg));
      }
      return cache.get(arg);
    };
  };
}
```

### `@Debounce(ms)`: wait until calls stop

```ts
export function Debounce(ms: number): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => void;
    const timers = new WeakMap<object, ReturnType<typeof setTimeout>>();

    descriptor.value = function (this: object, ...args: unknown[]) {
      clearTimeout(timers.get(this));
      timers.set(this, setTimeout(() => original.apply(this, args), ms));
    };
  };
}
```

### Using them in a component

```ts title="product-search.ts"
import { Component, Service, inject, signal } from '@angular/core';
import { Debounce, Log, Measure, Memoize } from './decorators';

@Service()
export class ProductApi {
  search(term: string) {
    return Promise.resolve([`${term} 1`, `${term} 2`]);
  }
}

@Component({
  selector: 'app-product-search',
  template: `
    <input #q (input)="onInput(q.value)" placeholder="Search" />
    @for (r of results(); track r) {
      <p>{{ r }} – {{ priceLabel(r.length) }}</p>
    }
  `,
})
export class ProductSearch {
  private readonly api = inject(ProductApi); // inject in a field, not in the decorator
  protected readonly results = signal<string[]>([]);

  @Debounce(300)
  protected onInput(term: string) {
    this.load(term);
  }

  @Log('load products')
  private async load(term: string) {
    this.results.set(await this.api.search(term)); // a signal update tells Angular to re-render
  }

  @Memoize()
  protected priceLabel(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  @Measure()
  sortResults() {
    this.results.update((r) => [...r].sort());
  }
}
```

:::caution[Change detection after a delayed call]
Angular apps are zoneless by default (since v21) and components are OnPush by default (since v22). Angular doesn't notice changes made inside a `setTimeout` by itself. A debounced method must update a **signal** (as above), or the view won't refresh.
:::

## Class decorators

A class decorator receives the constructor. The safe pattern is to **annotate or register** the class and return nothing:

```ts title="widget-registry.ts"
import { Type } from '@angular/core';

export const WIDGET_REGISTRY = new Map<string, Type<unknown>>();

export function Widget(name: string): ClassDecorator {
  return (target) => {
    WIDGET_REGISTRY.set(name, target as unknown as Type<unknown>);
  };
}
```

```ts
@Widget('product-search')
@Component({ selector: 'app-product-search', template: `...` })
export class ProductSearch {}
```

The registry can then feed [dynamic components](/advanced/dynamic-components/): `vcr.createComponent(WIDGET_REGISTRY.get('product-search')!)`.

Keep in mind that the decorator only runs if the file is **imported**. A class that nobody imports is never registered (and tree shaking removes it anyway). For lazy loading, a map of `() => import(...)` loaders is usually the better registry.

:::danger[Never replace an Angular class]
A class decorator *can* return a new class (for example `return class extends target {...}`). **Don't do this** for components, directives, pipes or services. The Angular compiler attaches its generated definitions to the class you wrote and doesn't know about the replacement. To add behaviour, use `hostDirectives`, composition or `inject()` helpers.
:::

## Property and parameter decorators: avoid them

**Property decorators** that install a getter/setter on the prototype (for example a `@LocalStorage()` decorator) silently stop working with modern class fields. New Angular projects target ES2022, where class fields are defined directly on the instance, so the field **shadows** the accessor on the prototype:

```ts
class Settings {
  @LocalStorage('theme') theme = 'light'; // ❌ the field wins, so the decorator's getter/setter is never called
}
```

They also don't mix with signal fields such as `input()`, `model()` or `signal()`. Use a signal plus an `effect()` instead:

```ts
@Service()
export class Settings {
  readonly theme = signal(localStorage.getItem('theme') ?? 'light');

  constructor() {
    effect(() => localStorage.setItem('theme', this.theme()));
  }
}
```

**Parameter decorators** only make sense for constructor injection (`@Inject`, `@Optional`). With `inject()` you don't need them.

## Rules for custom decorators in Angular

1. **No `inject()` inside a decorator.** The decorator body runs at class-definition time, and the wrapped method runs later, during an event. Neither is an injection context. Inject dependencies in a field and use them through `this`.
2. **Preserve `this` and the return value.** Use `function (this: ...)` (not an arrow function) and `original.apply(this, args)`.
3. **Store per-instance state in a `WeakMap` keyed by `this`.** Closure variables are shared by all instances.
4. **Update signals** so the UI re-renders in zoneless/OnPush apps.
5. **Order matters.** With experimental decorators, the decorator closest to the member runs first (bottom-up).
6. **Keep them pure TypeScript.** Decorators that don't depend on Angular are easy to unit-test and reuse.

## Key takeaways

- Angular's built-in decorators are compiled away at build time. Most member decorators are now replaced by functions like `input()`, `output()`, `viewChild()` and `inject()`.
- Angular projects use TypeScript's experimental decorators. Write custom ones with the `MethodDecorator` / `ClassDecorator` signatures.
- Safe uses: wrapping methods (log, measure, memoize, debounce) and registering classes.
- Avoid property decorators, class replacement and `inject()` inside decorators. Prefer signals, directives and `injectX()` helpers.

## Next steps

- [Advanced DI Patterns](/advanced/dependency-injection/): `injectX()` helpers instead of decorators
- [Custom Directives](/advanced/custom-directives/): reusable behaviour with `hostDirectives`
- [Signals](/modern/signals/): state that keeps the UI in sync
