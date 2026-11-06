---
title: Custom Directives 🎯
description: Build attribute and structural directives in Angular 22 with host metadata, signal inputs, typed template contexts and the directive composition API.
sidebar:
  order: 1
---

A **directive** is a class that adds behaviour to an element that already exists in a template. Components are directives with their own template; everything else, such as highlighting, focusing, permission checks or click-outside detection, can be a small, reusable directive.

This page shows how to write your own directives in modern Angular (v22): signal inputs, the `host` property, structural directives with `<ng-template>`, typed template contexts and composing directives with `hostDirectives`.

## What you'll learn

- The three kinds of directives and when to write each one
- Attribute directives with `input()`, `output()` and `host` bindings and listeners
- Real-world directives: click outside, auto focus, lazy images, `exportAs`
- Structural directives with `TemplateRef`, `ViewContainerRef` and microsyntax
- Type-safe templates with `ngTemplateContextGuard` and `ngTemplateGuard_`
- Reusing behaviour with the directive composition API (`hostDirectives`)

## Kinds of directives

| Kind | What it does | Examples |
| --- | --- | --- |
| **Component** | A directive with its own template | `<app-user-card>` |
| **Attribute directive** | Changes the look or behaviour of its host element | `appHighlight`, `appAutoFocus` |
| **Structural directive** | Adds or removes DOM by rendering an `<ng-template>` | `*appHasRole`, `*ngTemplateOutlet` |

On top of these, **host directives** let a component or directive reuse other directives on its own host element. More on that [below](#composing-behaviour-with-hostdirectives).

:::tip
For simple conditions and loops, use the built-in control flow (`@if`, `@for`, `@switch`). See [Control Flow](/modern/control-flow/). Write a structural directive only when you need **reusable** rendering logic, such as a permission check.
:::

## Your first attribute directive

Generate a directive with the CLI:

```bash
ng generate directive highlight
```

This creates `highlight.ts` (and a spec file) with a class called `Highlight` and the selector `[appHighlight]`. Directives are standalone by default, so you just add them to a component's `imports`.

```ts title="highlight.ts"
import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'appHighlight() || "yellow"',
  },
})
export class Highlight {
  // The input has the same name as the selector, so you can write appHighlight="pink"
  readonly appHighlight = input('');
}
```

```ts title="highlight-demo.ts"
import { Component, signal } from '@angular/core';
import { Highlight } from './highlight';

@Component({
  selector: 'app-highlight-demo',
  imports: [Highlight],
  template: `
    <p appHighlight>Yellow by default</p>
    <p appHighlight="lightgreen">Light green</p>
    <p [appHighlight]="color()">Bound color</p>
  `,
})
export class HighlightDemo {
  protected readonly color = signal('orange');
}
```

How it works:

1. Angular finds every element that matches the CSS selector `[appHighlight]` in templates that import `Highlight`.
2. It creates one `Highlight` instance per matching element (the **host element**).
3. The `host` property binds `style.backgroundColor` on that host element to an expression that is evaluated against the directive instance.

:::note[Use `host`, not `@HostBinding` / `@HostListener`]
The `host` property in `@Directive` / `@Component` is the recommended way to bind to the host element. The `@HostBinding` and `@HostListener` decorators still work, but `host` keeps all host behaviour in one place and is type-checked (host binding type checking is on by default since v21).
:::

## Reacting to events

Add listeners with `'(event)': 'statement'` entries in `host`. Use a signal for internal state.

```ts title="hover-highlight.ts"
import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appHoverHighlight]',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '[style.backgroundColor]': 'hovered() ? color() : null',
    '[class.is-hovered]': 'hovered()',
  },
})
export class HoverHighlight {
  // Alias: the public name is appHoverHighlight, the class field is color
  readonly color = input('lightblue', { alias: 'appHoverHighlight' });
  protected readonly hovered = signal(false);
}
```

```html
<p appHoverHighlight="pink">Hover me</p>
<p appHoverHighlight>Hover me (default color)</p>
```

Template expressions in `host` can read `protected` members, so keep internal state `protected` rather than `public`.

## The `host` property cheat sheet

The `host` object accepts the same binding syntax you use in templates, applied to the host element:

```ts title="toggle.ts"
import { Directive, booleanAttribute, input, output, signal } from '@angular/core';

@Directive({
  selector: '[appToggle]',
  host: {
    role: 'switch',                                   // static attribute
    tabindex: '0',
    '[attr.aria-checked]': 'on()',                    // attribute binding
    '[class.toggle--on]': 'on()',                     // class binding
    '[style.cursor]': 'disabled() ? "not-allowed" : "pointer"', // style binding
    '(click)': 'toggle()',                            // event listener
    '(keydown.enter)': 'toggle()',                    // key event
    '(keydown.space)': 'toggle(); $event.preventDefault()',
  },
})
export class Toggle {
  // booleanAttribute lets you write <span appToggle disabled>
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly toggled = output<boolean>();
  protected readonly on = signal(false);

  protected toggle() {
    if (this.disabled()) return;
    this.on.update((v) => !v);
    this.toggled.emit(this.on());
  }
}
```

```html
<span appToggle (toggled)="log($event)">Wi-Fi</span>
<span appToggle disabled>Bluetooth</span>
```

| Key in `host` | Meaning |
| --- | --- |
| `'role': 'button'` | Static attribute |
| `'[prop]': 'expr'` | DOM property, e.g. `'[hidden]': 'collapsed()'` |
| `'[attr.x]': 'expr'` | Attribute (`null` removes it) |
| `'[class.x]': 'expr'` / `'[class]': 'expr'` | One class / many classes |
| `'[style.x]': 'expr'` / `'[style.width.px]': 'expr'` | Style, optionally with a unit |
| `'(event)': 'stmt'` | Event on the host; `$event` is available |
| `'(document:click)'`, `'(window:resize)'`, `'(body:keydown)'` | Global event targets |

Global listeners added through `host` are removed automatically when the directive is destroyed, so you don't need to clean them up yourself.

## Real-world attribute directives

### Click outside

Close dropdowns or popovers when the user clicks anywhere else. The directive listens on `document` and checks whether the click target is inside its host.

```ts title="click-outside.ts"
import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutside {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly appClickOutside = output<MouseEvent>();

  protected onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
```

```ts title="dropdown.ts"
import { Component, signal } from '@angular/core';
import { ClickOutside } from './click-outside';

@Component({
  selector: 'app-dropdown',
  imports: [ClickOutside],
  template: `
    <div class="dropdown" (appClickOutside)="open.set(false)">
      <button (click)="open.set(!open())">Menu</button>
      @if (open()) {
        <ul class="menu">
          <li>Profile</li>
          <li>Settings</li>
        </ul>
      }
    </div>
  `,
})
export class Dropdown {
  protected readonly open = signal(false);
}
```

An output can share the selector's name (`appClickOutside`), which gives you the neat `(appClickOutside)="..."` syntax.

### Auto focus

DOM APIs such as `focus()` only exist in the browser and only make sense after Angular has rendered the element. Use `afterNextRender`, which runs once after the next render and never runs during server-side rendering.

```ts title="auto-focus.ts"
import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocus {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.host.nativeElement.focus());
  }
}
```

```html
<input appAutoFocus placeholder="Search" />
```

### Lazy image with cleanup

This directive swaps in the real image only when it scrolls into view. It also shows how to **clean up** browser resources with `DestroyRef`.

```ts title="lazy-image.ts"
import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

@Directive({
  selector: 'img[appLazySrc]', // only matches <img> elements
  host: {
    '[attr.src]': 'loaded() ? appLazySrc() : placeholder()',
    '[class.loaded]': 'loaded()',
  },
})
export class LazyImage {
  readonly appLazySrc = input.required<string>();
  readonly placeholder = input('/assets/placeholder.svg');
  protected readonly loaded = signal(false);

  private readonly host = inject<ElementRef<HTMLImageElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.loaded.set(true);
          observer.disconnect();
        }
      });
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
```

```html
<img appLazySrc="/photos/large.jpg" alt="Mountain lake" />
```

:::tip
For real apps, prefer the built-in `NgOptimizedImage` directive (`<img ngSrc="..." />`), which lazy loads by default and adds many other optimizations. See [Performance Optimization](/advanced/performance/#optimize-images-with-ngoptimizedimage). This example is about learning directive patterns.
:::

### Exposing a directive to the template with `exportAs`

`exportAs` gives the directive instance a name you can grab with a template reference variable.

```ts title="collapse.ts"
import { Directive, signal } from '@angular/core';

@Directive({
  selector: '[appCollapse]',
  exportAs: 'appCollapse',
  host: { '[hidden]': 'collapsed()' },
})
export class Collapse {
  readonly collapsed = signal(false);
  toggle() {
    this.collapsed.update((c) => !c);
  }
}
```

```html
<button (click)="answer.toggle()">
  {{ answer.collapsed() ? 'Show' : 'Hide' }} answer
</button>
<p appCollapse #answer="appCollapse">Angular is a web framework.</p>
```

## Structural directives

A structural directive is applied to an `<ng-template>` and decides **whether and how often** to render it. It injects two things:

- `TemplateRef`: the content inside the `<ng-template>`
- `ViewContainerRef`: the place in the DOM where views can be inserted

### A permission directive: `*appHasRole`

```ts title="has-role.ts"
import {
  Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input, untracked,
} from '@angular/core';
import { AuthStore } from './auth-store';

@Directive({
  selector: '[appHasRole]',
})
export class HasRole {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthStore);

  readonly appHasRole = input.required<string>();
  readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null);

  private readonly allowed = computed(() => this.auth.roles().includes(this.appHasRole()));

  constructor() {
    // Re-render whenever the role, the else template or the user's roles change
    effect(() => {
      const template = this.allowed() ? this.templateRef : this.appHasRoleElse();
      // Create views outside the effect's tracking context
      untracked(() => {
        this.viewContainer.clear();
        if (template) {
          this.viewContainer.createEmbeddedView(template);
        }
      });
    });
  }
}
```

```ts title="auth-store.ts"
import { Service, signal } from '@angular/core';

@Service()
export class AuthStore {
  readonly roles = signal<string[]>(['user']);
}
```

```html
<a *appHasRole="'admin'; else noAccess" href="/admin">Admin panel</a>
<ng-template #noAccess><span>You need admin rights.</span></ng-template>
```

Because the directive reads signals inside `effect()`, the content updates automatically when the user's roles change. Wrapping the DOM work in `untracked()` makes sure that only `allowed()` and `appHasRoleElse()` are dependencies of the effect.

### The `*` shorthand (microsyntax)

The asterisk is shorthand. Angular wraps the element in an `<ng-template>` and moves the directive onto it. These two snippets are identical:

```html
<!-- Shorthand -->
<a *appHasRole="'admin'; else noAccess" href="/admin">Admin panel</a>

<!-- Long form -->
<ng-template appHasRole="admin" [appHasRoleElse]="noAccess">
  <a href="/admin">Admin panel</a>
</ng-template>
```

Rules of the microsyntax:

| Shorthand | Becomes |
| --- | --- |
| `*appX="expr"` | `[appX]="expr"` |
| `*appX="expr; else tpl"` | `[appX]="expr" [appXElse]="tpl"` (key is prefixed with the selector, PascalCase) |
| `*appX="let item from source"` | `let-item [appXFrom]="source"` (`item` gets the context's `$implicit`) |
| `*appX="expr; let i = index"` | `let-i="index"` (reads `index` from the context) |
| `*appX="expr as value"` | `let-value="appX"` (reads the `appX` property of the context) |

Only **one** structural directive is allowed per element. Wrap with `<ng-container>` if you need two.

### Passing data to the template with a typed context

The second argument of `createEmbeddedView()` is the **context**: values the template can read with `let-` variables. Add a static `ngTemplateContextGuard` so the template type checker knows the context type.

```ts title="load.ts"
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

export interface LoadContext<T> {
  $implicit: T; // let user
  appLoad: T;   // ... as user
}

@Directive({
  selector: '[appLoad]',
})
export class Load<T> {
  private readonly templateRef = inject<TemplateRef<LoadContext<T>>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appLoadFrom = input.required<() => Promise<T>>();

  constructor() {
    effect((onCleanup) => {
      const loader = this.appLoadFrom();
      let stale = false;
      onCleanup(() => (stale = true)); // ignore results of an outdated loader

      loader().then((data) => {
        if (stale) return;
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef, { $implicit: data, appLoad: data });
      });
    });
  }

  // Tells the type checker: the context of this template is LoadContext<T>
  static ngTemplateContextGuard<T>(dir: Load<T>, ctx: unknown): ctx is LoadContext<T> {
    return true;
  }
}
```

```ts title="profile.ts"
import { Component } from '@angular/core';
import { Load } from './load';

interface User {
  name: string;
  email: string;
}

@Component({
  selector: 'app-profile',
  imports: [Load],
  template: `<p *appLoad="let user from loadUser">{{ user.name }} ({{ user.email }})</p>`,
})
export class Profile {
  protected readonly loadUser = (): Promise<User> =>
    Promise.resolve({ name: 'Ada', email: 'ada@example.com' });
}
```

Thanks to the guard, `user` is typed as `User`. A typo like `user.nmae` is a **compile-time** error with strict templates.

:::tip
For loading data in real apps, use [`resource()` / `httpResource()`](/modern/resource-api/) with `@if`. Structural directives are best for reusable rendering rules.
:::

### Narrowing input types with `ngTemplateGuard_`

If your directive renders only when an input is truthy, tell the type checker with a static `ngTemplateGuard_<inputName>` property. The value `'binding'` means "inside the template, treat the bound expression as truthy".

```ts title="if-present.ts"
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input, untracked } from '@angular/core';

@Directive({ selector: '[appIfPresent]' })
export class IfPresent<T> {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  readonly appIfPresent = input.required<T>();

  static ngTemplateGuard_appIfPresent: 'binding';

  constructor() {
    effect(() => {
      const show = !!this.appIfPresent();
      untracked(() => {
        this.viewContainer.clear();
        if (show) this.viewContainer.createEmbeddedView(this.templateRef);
      });
    });
  }
}
```

```html
@let current = user();
<p *appIfPresent="current">{{ current.name }}</p> <!-- current is narrowed to User -->
```

Narrowing works on template variables and properties. A signal call like `user()` is a function call, so store it in a `@let` first. You can also write a type predicate instead of `'binding'`: `static ngTemplateGuard_appIfPresent(dir: IfPresent<unknown>, expr: User | null): expr is User`.

## Composing behaviour with `hostDirectives`

The **directive composition API** lets a component or directive apply other directives to its own host element, without the consumer adding extra attributes. It's a clean alternative to inheritance.

```ts title="behaviours.ts"
import { Directive, booleanAttribute, inject, input, output, signal } from '@angular/core';

@Directive({
  host: {
    '(mouseenter)': 'hovering.set(true)',
    '(mouseleave)': 'hovering.set(false)',
    '[class.hovering]': 'hovering()',
  },
})
export class HoverState {
  readonly hovering = signal(false);
}

@Directive({
  host: {
    '[attr.aria-disabled]': 'disabled()',
    '[class.disabled]': 'disabled()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
  },
})
export class Disableable {
  readonly disabled = input(false, { transform: booleanAttribute });
}

@Directive({
  host: { '(click)': 'onClick($event)' },
})
export class Pressable {
  readonly pressed = output<MouseEvent>();
  private readonly disableable = inject(Disableable, { optional: true });

  protected onClick(event: MouseEvent) {
    if (this.disableable?.disabled()) return;
    this.pressed.emit(event);
  }
}
```

```ts title="app-button.ts"
import { Component, inject } from '@angular/core';
import { Disableable, HoverState, Pressable } from './behaviours';

@Component({
  selector: 'app-button',
  hostDirectives: [
    HoverState,                                            // no public inputs/outputs
    { directive: Disableable, inputs: ['disabled'] },      // expose an input
    { directive: Pressable, outputs: ['pressed: press'] }, // expose an output with an alias
  ],
  host: { role: 'button' },
  template: `
    <ng-content />
    @if (hover.hovering()) {
      <span aria-hidden="true"> 👆</span>
    }
  `,
})
export class AppButton {
  protected readonly hover = inject(HoverState); // host directives are injectable
}
```

```html
<app-button (press)="save()">Save</app-button>
<app-button disabled (press)="save()">Delete</app-button>
```

Key rules:

- Host directives are applied **statically** at compile time. You can't add them at runtime.
- Their `selector` is ignored (it's optional, as in the examples above).
- Their inputs and outputs are **private by default**. List them in `inputs` / `outputs` to expose them, optionally with `'name: alias'`.
- The host and its host directives can `inject()` each other.
- Host directives run **first** (constructor, inputs, host bindings), so the component's own host bindings win on conflicts.
- Directives can have `hostDirectives` too, so you can build behaviour in layers:

```ts
@Directive({
  selector: '[appInteractive]',
  hostDirectives: [HoverState, { directive: Disableable, inputs: ['disabled'] }],
})
export class Interactive {}
```

:::note[New in v22: duplicate host directives are merged]
If the same directive ends up on an element more than once (for example two host directives both include `HoverState`), Angular now **de-duplicates** it into a single instance. If it is also matched by a selector in the template, the template match wins. Exposing the same input under two different aliases is a compile-time error (NG8024).
:::

## Testing a directive

Since v22.2, `TestBed.createDirective()` creates a directive on a plain host element, so you don't need a wrapper component. Combine it with `inputBinding()` to set inputs. The examples on this site use Vitest, the default test runner.

```ts title="highlight.spec.ts"
import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Highlight } from './highlight';

describe('Highlight', () => {
  it('uses the bound color', async () => {
    const fixture = TestBed.createDirective(Highlight, {
      tagName: 'p',
      bindings: [inputBinding('appHighlight', () => 'blue')],
    });
    await fixture.whenStable();

    const p = fixture.nativeElement as HTMLElement;
    expect(p.style.backgroundColor).toBe('blue');
  });
});
```

On older versions, render the directive through a small test component instead. See [Component Testing](/testing/component-testing/).

## Common mistakes

- **Manipulating the DOM in the constructor.** The element isn't rendered yet and the code breaks on the server. Use `host` bindings, or `afterNextRender()` for browser-only work.
- **Using `ElementRef.nativeElement.style = ...` instead of `host`.** Host bindings are declarative, SSR-safe and type-checked.
- **Forgetting to clean up.** Observers, timers and third-party widgets must be disposed with `DestroyRef.onDestroy()`. Listeners added through `host` are cleaned up for you.
- **Two structural directives on one element.** Use `<ng-container>` to nest them.
- **Writing a structural directive for a plain `if` or loop.** `@if` and `@for` are faster and need no imports.
- **Selectors without a prefix.** Use `app` (or your library prefix) to avoid clashing with native attributes and other libraries.

## Best practices

- Name the class after what it does (`Highlight`, `ClickOutside`) and prefix the selector (`[appHighlight]`).
- Use `input()`, `input.required()`, `output()` and `model()`. Use `transform: booleanAttribute` / `numberAttribute` for attribute-friendly inputs.
- Keep template-only members `protected`, and signals and injected services `readonly`.
- Restrict selectors when it makes sense (`img[appLazySrc]`, `button[appConfirm]`).
- Prefer `hostDirectives` over base classes for sharing behaviour.
- Add `ngTemplateContextGuard` to every structural directive that provides a context.

## Key takeaways

- Directives add behaviour to existing elements. Configure host bindings and listeners with the `host` property.
- Structural directives render an `<ng-template>` via `ViewContainerRef`. Signals plus `effect()` keep them reactive.
- Static template guards make custom structural directives fully type-safe.
- `hostDirectives` composes small behaviours into components and directives. Since v22, duplicates are merged automatically.

## Next steps

- [Content Projection](/advanced/content-projection/): pass templates and content into components
- [Dynamic Components](/advanced/dynamic-components/): create components and views from code
- [Advanced DI Patterns](/advanced/dependency-injection/): `inject()` options used by directives
- [Built-in Directives](/beginner/directives/): a refresher on the basics
