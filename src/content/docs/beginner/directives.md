---
title: Directives 🎯
description: Learn Angular directives - built-in attribute directives, class and style bindings, control flow instead of NgIf/NgFor, and your first custom directive.
sidebar:
  order: 6
---

A **directive** is a class that adds behaviour to an element in a template. Components are actually directives *with* a template; plain directives have **no template of their own** — they enhance an element that already exists (change its look, listen to its events, add attributes).

## What you'll learn

- The kinds of directives in Angular and where control flow fits in
- Built-in directives you'll meet every day (and which ones you no longer need)
- Why `[class]` / `[style]` bindings replace `NgClass` / `NgStyle`
- Why `@if` / `@for` / `@switch` replace `*ngIf` / `*ngFor` / `*ngSwitch`
- How to write your own attribute directive with `input()`, `output()` and `host`

## Kinds of directives

| Kind | What it does | Examples |
|---|---|---|
| **Components** | Directives with their own template | `<app-user-card />` |
| **Attribute directives** | Change the appearance or behaviour of an existing element | `routerLink`, `ngModel`, your own `appHighlight` |
| **Structural directives** | Add or remove elements by rendering an `<ng-template>` (written with a `*`) | `*ngTemplateOutlet`, legacy `*ngIf` / `*ngFor` |

For conditionals and loops you no longer need structural directives: Angular has **built-in control flow blocks** (`@if`, `@for`, `@switch`) that are part of the template language itself.

## Built-in directives you'll use

Every directive is standalone — import the ones you use into the component's `imports`:

| Directive | Import from | Used for |
|---|---|---|
| `RouterLink`, `RouterLinkActive` | `@angular/router` | Navigation links and active-link styling ([Routing](/beginner/routing/)) |
| `FormField` (`[formField]`) | `@angular/forms/signals` | Signal Forms ([Forms](/beginner/forms/)) |
| `NgModel` via `FormsModule` | `@angular/forms` | Template-driven forms, `[(ngModel)]` |
| `NgOptimizedImage` (`ngSrc`) | `@angular/common` | Fast, best-practice image loading |
| `NgTemplateOutlet` | `@angular/common` | Render an `<ng-template>` somewhere else |
| `NgComponentOutlet` | `@angular/common` | Render a component chosen at runtime |
| `NgClass`, `NgStyle` | `@angular/common` | Still available, but `[class]` / `[style]` bindings are preferred |

Here is a quick taste of `NgOptimizedImage` and `NgTemplateOutlet`:

```ts title="profile-header.ts"
import { Component, input } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-profile-header',
  imports: [NgOptimizedImage, NgTemplateOutlet],
  template: `
    <!-- ngSrc requires width/height (or fill) and adds lazy loading & warnings for you -->
    <img [ngSrc]="avatarUrl()" width="64" height="64" alt="Avatar" />

    <ng-template #badge let-label>
      <span class="badge">{{ label }}</span>
    </ng-template>

    <h2>{{ name() }}</h2>
    <ng-container *ngTemplateOutlet="badge; context: { $implicit: 'PRO' }" />
    <ng-container *ngTemplateOutlet="badge; context: { $implicit: 'Verified' }" />
  `,
})
export class ProfileHeader {
  readonly name = input.required<string>();
  readonly avatarUrl = input.required<string>();
}
```

## Class and style bindings instead of `NgClass` / `NgStyle`

`NgClass` and `NgStyle` were the classic attribute directives. Today, Angular's built-in bindings do the same job with **no import** and better performance:

```html del={2,6} ins={3,7}
<!-- Classes -->
<div [ngClass]="{ active: isActive(), disabled: isDisabled() }">…</div>
<div [class]="{ active: isActive(), disabled: isDisabled() }">…</div>

<!-- Styles -->
<div [ngStyle]="{ 'font-size.px': size(), color: color() }">…</div>
<div [style.font-size.px]="size()" [style.color]="color()">…</div>
```

More forms of the bindings:

```html
<li [class.selected]="isSelected()">One class</li>
<div [class]="['card', theme()]">Array of classes</div>
<div [class]="'card ' + theme()">String of classes</div>
<p [style.width.%]="progress()">Style with a unit</p>
<div [style]="{ color: color(), 'background-color': bg() }">Style object</div>
```

:::tip[Automatic migration]
`ng generate @angular/core:ngclass-to-class` and `ng generate @angular/core:ngstyle-to-style` rewrite most `ngClass` / `ngStyle` usages for you.
:::

`NgClass` is still handy in one niche case: an object key that contains **several space-separated classes** (`{ 'btn btn-primary': isPrimary() }`), which `[class]` doesn't support.

## Control flow instead of `*ngIf` / `*ngFor` / `*ngSwitch`

The structural directives `NgIf`, `NgForOf` and `NgSwitch` are **deprecated**. Use the built-in blocks — they need no imports, type-check better and are faster.

| Deprecated directive | Built-in replacement |
|---|---|
| `<p *ngIf="user">…</p>` | `@if (user) { <p>…</p> }` |
| `*ngIf="user; else loading"` | `@if (user) { … } @else { … }` |
| `*ngIf="user$ \| async as user"` | `@if (user$ \| async; as user) { … }` |
| `<li *ngFor="let item of items; trackBy: trackById">` | `@for (item of items; track item.id) { <li>…</li> }` |
| `let i = index` | `let i = $index` (also `$first`, `$last`, `$even`, `$odd`, `$count`) |
| `[ngSwitch]` + `*ngSwitchCase` + `*ngSwitchDefault` | `@switch (x) { @case (a) {…} @default {…} }` |

```html
@if (orders().length > 0) {
  <ul>
    @for (order of orders(); track order.id; let odd = $odd) {
      <li [class.striped]="odd">#{{ order.id }} — {{ order.status }}</li>
    }
  </ul>
} @else {
  <p>No orders yet.</p>
}

@switch (role()) {
  @case ('admin') { <app-admin-panel /> }
  @case ('editor') { <app-editor-tools /> }
  @default { <p>Read-only access</p> }
}
```

Migrate an existing project with `ng generate @angular/core:control-flow`. Full details: [Control Flow](/modern/control-flow/).

## Your first custom attribute directive

Generate a directive with the CLI:

```bash
ng generate directive highlight
# creates highlight.ts (class Highlight, selector [appHighlight]) and highlight.spec.ts
```

### Step 1: style the host element

The element a directive sits on is its **host**. Use the `host` property to bind to it — no `ElementRef` or `Renderer2` needed:

```ts title="highlight.ts"
import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'appHighlight()',
  },
})
export class Highlight {
  // The input has the same name as the selector, so one attribute does both jobs.
  readonly appHighlight = input('yellow');
}
```

```ts title="app.ts"
import { Component } from '@angular/core';
import { Highlight } from './highlight';

@Component({
  selector: 'app-root',
  imports: [Highlight],
  template: `
    <p appHighlight>Default yellow</p>
    <p appHighlight="lightblue">Light blue</p>
    <p [appHighlight]="favouriteColor">Bound colour</p>
  `,
})
export class App {
  protected favouriteColor = 'pink';
}
```

### Step 2: react to events with signals

Let's highlight only while the mouse is over the element:

```ts title="hover-highlight.ts"
import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appHoverHighlight]',
  host: {
    '(mouseenter)': 'hovering.set(true)',
    '(mouseleave)': 'hovering.set(false)',
    '[style.backgroundColor]': 'hovering() ? appHoverHighlight() : null',
    '[style.transition]': '"background-color 150ms"',
  },
})
export class HoverHighlight {
  readonly appHoverHighlight = input('lightyellow');
  protected readonly hovering = signal(false);
}
```

```html
<li appHoverHighlight>Hover me</li>
<li appHoverHighlight="lightgreen">Hover me (green)</li>
```

### Step 3: emit events with `output()`

Directives can talk back to the parent template. This one tells you when the user clicks **outside** the host element — perfect for closing dropdowns:

```ts title="click-outside.ts"
import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutside {
  readonly appClickOutside = output<void>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.appClickOutside.emit();
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
      <button type="button" (click)="open.update(o => !o)" [attr.aria-expanded]="open()">
        Menu ▾
      </button>
      @if (open()) {
        <ul role="menu">
          <li role="menuitem">Profile</li>
          <li role="menuitem">Settings</li>
        </ul>
      }
    </div>
  `,
})
export class Dropdown {
  protected readonly open = signal(false);
}
```

`(document:click)` (and `window:` / `body:`) listens on a **global** target instead of the host element.

### Step 4: touch the DOM safely

When you really need the native element (focus, measure, third-party library), inject `ElementRef` and wait for the element to be rendered with `afterNextRender`:

```ts title="autofocus.ts"
import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.host.nativeElement.focus());
  }
}
```

```html
<input appAutofocus placeholder="I get focus when the page loads" />
```

`afterNextRender` only runs in the browser, so this is also safe with server-side rendering.

## A peek at custom structural directives

A structural directive receives an `<ng-template>` and decides when (and how often) to render it. The `*` is shorthand for wrapping the element in an `<ng-template>`:

```ts title="if-role.ts"
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

@Directive({ selector: '[appIfRole]' })
export class IfRole {
  readonly appIfRole = input.required<string>();     // required role
  readonly appIfRoleUser = input.required<string>(); // current user's role ("user:" in the microsyntax)

  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.appIfRole() === this.appIfRoleUser()) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
```

```html
<button *appIfRole="'admin'; user: currentRole()">Delete everything</button>
```

For everyday conditions and loops, prefer `@if` and `@for`. Write structural directives only for reusable rendering logic — see [Custom Directives](/advanced/custom-directives/).

## Common mistakes

| Mistake | Fix |
|---|---|
| Directive has no effect | Import it into the component's `imports`. |
| Using `@HostBinding` / `@HostListener` | Use the `host: {}` property instead. |
| Manipulating the DOM with `document.querySelector` | Use `host` bindings, or `ElementRef` + `afterNextRender`. |
| Two `*` directives on one element (`*ngIf` + `*ngFor`) | Not allowed — and unnecessary with `@if`/`@for` blocks. |
| Reaching for `ngClass` / `ngStyle` by habit | Use `[class.x]`, `[class]`, `[style.x]`, `[style]`. |

## Best practices

- Name the selector in camelCase with your prefix: `[appHighlight]`; name the class without a suffix: `Highlight`.
- Give the main input the **same name as the selector** so one attribute both applies and configures the directive.
- Prefer `host` bindings over `ElementRef`/`Renderer2` for styles, classes, attributes and events.
- Keep directives small and single-purpose — combine several on one element if needed (or with `hostDirectives`, see [Custom Directives](/advanced/custom-directives/)).

## Key takeaways

- Directives add behaviour to existing elements; components are directives with templates.
- Use `[class]` / `[style]` bindings instead of `NgClass` / `NgStyle`.
- `*ngIf`, `*ngFor` and `*ngSwitch` are deprecated — use `@if`, `@for` and `@switch`.
- A custom attribute directive = `@Directive` + `selector` + `input()` / `output()` + `host` bindings.

## Next steps

1. [Services & DI](/beginner/services/) — share logic and data across components
2. [Custom Directives](/advanced/custom-directives/) — structural directives, `hostDirectives` and more
3. [Control Flow](/modern/control-flow/) — master `@if`, `@for`, `@switch` and `@defer`
