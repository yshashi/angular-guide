---
title: Advanced Components 🧩
description: Content projection, template fragments, dynamic components, host bindings, host directives, inheritance, styling and OnPush in Angular 22.
sidebar:
  order: 1
---

Once you can build a basic component, the next step is making components that are **flexible and reusable**: cards that accept any content, lists that let the parent decide how rows look, dialogs created from code, and buttons that style their own host element. This page covers the patterns you will use every day in real Angular apps.

## What you'll learn

- Project content into components with `<ng-content>` (single slot, multi-slot, fallback content)
- Let parents customise rendering with `<ng-template>` and `NgTemplateOutlet`
- Render components dynamically with `@defer`, `NgComponentOutlet` and `ViewContainerRef.createComponent()`
- Style and listen on the host element with the `host` property, and compose behaviour with `hostDirectives`
- Share logic with inheritance and choose a view-encapsulation mode
- Understand how `OnPush` (the default since v22) decides when a component re-renders

## Content projection with `<ng-content>`

**Content projection** lets the parent pass HTML *into* a child component. The child marks where that content goes with `<ng-content />`. It works like the native `<slot>` element.

```ts title="card.ts"
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <article class="card">
      <h3>{{ title() }}</h3>
      <ng-content />
    </article>
  `,
})
export class Card {
  readonly title = input.required<string>();
}
```

```html
<!-- parent template -->
<app-card title="User profile">
  <p>Ada Lovelace</p>
  <button type="button">Edit</button>
</app-card>
```

Everything between `<app-card>` and `</app-card>` is rendered where `<ng-content />` is. Angular calls this the component's **content**; the elements in the component's own template are its **view**.

### Multiple slots with `select`

Add a `select` attribute (any CSS selector) to create named slots. A `<ng-content />` **without** `select` catches everything that didn't match another slot.

```ts title="panel.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-panel',
  template: `
    <section class="panel">
      <header>
        <ng-content select="[panel-title]">Untitled</ng-content>
      </header>
      <div class="body">
        <ng-content />
      </div>
      <footer>
        <ng-content select="[panel-actions]" />
      </footer>
    </section>
  `,
})
export class Panel {}
```

```html
<app-panel>
  <h2 panel-title>Delete project?</h2>
  <p>This cannot be undone.</p>
  <div panel-actions>
    <button type="button">Cancel</button>
    <button type="button">Delete</button>
  </div>
</app-panel>
```

- **Fallback content**: anything you put *inside* `<ng-content>` (like `Untitled` above) is shown when the parent provides nothing for that slot.
- **`ngProjectAs`**: project an element into a slot it wouldn't normally match, e.g. `<ng-container ngProjectAs="[panel-title]">…</ng-container>`. The value must be static.
- If there is no catch-all `<ng-content />`, content that matches no slot is **not rendered**.

### Reacting to projected content

Use a signal query to check what the parent projected:

```ts title="tile.ts"
import { Component, Directive, contentChild } from '@angular/core';

@Directive({ selector: '[appCardIcon]' })
export class CardIcon {}

@Component({
  selector: 'app-tile',
  template: `
    <div class="tile" [class.has-icon]="icon()">
      <ng-content select="[appCardIcon]" />
      <ng-content />
    </div>
  `,
})
export class Tile {
  protected readonly icon = contentChild(CardIcon);
}
```

:::caution[Don't wrap `<ng-content>` in `@if`]
Angular **always** creates projected content, even when its `<ng-content>` is inside a hidden `@if` or `@for`. Its components are instantiated and their lifecycle hooks run. If the child should decide *whether* content renders, accept an `<ng-template>` instead (next section).
:::

Two more things to know: projected content belongs to the **parent's view** (it is change-detected with the parent and gets its dependencies from the parent's injector), and some library components (menus, tabs) expect to own their children directly, so wrapping their items in extra projection layers can break keyboard navigation. For a deep dive see [Content Projection](/advanced/content-projection/).

## Template fragments: `<ng-template>` + `NgTemplateOutlet`

An `<ng-template>` is a chunk of template that is **not rendered until you ask for it**. Passing one to a child lets the parent control *how* something looks while the child controls *when* and *where* it renders — perfect for lists, tables and dropdowns.

```ts title="list.ts"
import { Component, TemplateRef, contentChild, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface RowContext<T> {
  $implicit: T;
  index: number;
}

@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet],
  template: `
    <ul>
      @for (item of items(); track $index) {
        <li>
          @if (rowTemplate(); as tpl) {
            <ng-container
              [ngTemplateOutlet]="tpl"
              [ngTemplateOutletContext]="{ $implicit: item, index: $index }"
            />
          } @else {
            {{ item }}
          }
        </li>
      } @empty {
        <li>Nothing here yet.</li>
      }
    </ul>
  `,
})
export class List<T> {
  readonly items = input.required<T[]>();
  protected readonly rowTemplate = contentChild<TemplateRef<RowContext<T>>>(TemplateRef);
}
```

```html
<!-- parent: decides how each row looks -->
<app-list [items]="products()">
  <ng-template let-product let-i="index">
    {{ i + 1 }}. <strong>{{ product.name }}</strong> – {{ product.price }}
  </ng-template>
</app-list>
```

- `$implicit` in the context becomes the value of `let-product` (a `let-` with no value).
- Other keys are read with `let-name="key"` (here `let-i="index"`).
- By default a fragment uses the injector from **where it was declared**. Pass `[ngTemplateOutletInjector]="'outlet'"` (since v21.2) to inherit the injector from where it is rendered instead, or pass your own `Injector`.

## Dynamic components

Sometimes you don't know which component to show until runtime. Pick the simplest tool that works:

| Need | Use |
|---|---|
| Load a known component lazily (smaller bundle) | `@defer` block in the template |
| Pick one of several components based on state | `NgComponentOutlet` |
| Create/destroy components from TypeScript (toasts, plugin systems) | `ViewContainerRef.createComponent()` |
| Render outside the component tree (overlay attached to `document.body`) | `createComponent()` + `hostElement` |

:::tip
If you only want to delay loading a heavy component, use [`@defer`](/modern/control-flow/). It code-splits automatically and needs no manual imports.
:::

### `NgComponentOutlet`

```ts title="user-bio.ts"
import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AdminBio } from './admin-bio';
import { StandardBio } from './standard-bio';

@Component({
  selector: 'app-user-bio',
  imports: [NgComponentOutlet],
  template: `
    <ng-container *ngComponentOutlet="bioComponent(); inputs: { name: name() }" />
  `,
})
export class UserBio {
  readonly name = input.required<string>();
  readonly isAdmin = input(false);

  protected readonly bioComponent = computed(() => (this.isAdmin() ? AdminBio : StandardBio));
}
```

`NgComponentOutlet` also accepts `injector` (custom providers), `content` (projected nodes) and exposes the created instance via `#outlet="ngComponentOutlet"` → `outlet.componentInstance`.

You can combine it with a dynamic `import()` to lazy-load a component on demand:

```ts title="settings.ts"
import { Component, Type, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-settings',
  imports: [NgComponentOutlet],
  template: `
    @if (advanced(); as cmp) {
      <ng-container *ngComponentOutlet="cmp" />
    } @else {
      <button type="button" (click)="loadAdvanced()">Show advanced settings</button>
    }
  `,
})
export class Settings {
  protected readonly advanced = signal<Type<unknown> | null>(null);

  protected async loadAdvanced() {
    const { AdvancedSettings } = await import('./advanced-settings');
    this.advanced.set(AdvancedSettings);
  }
}
```

### `ViewContainerRef.createComponent()` with bindings

A **view container** is a spot in the DOM where Angular can insert views. Get one with a view query (`{ read: ViewContainerRef }`) or by injecting `ViewContainerRef` (inserts next to the current element).

Since v20 you can wire up inputs, outputs and two-way bindings **at creation time** with `inputBinding()`, `outputBinding()` and `twoWayBinding()`. Signal bindings stay live — when `message` changes, the toast updates.

```ts title="toast.ts"
import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-toast',
  template: `
    @if (open()) {
      <div class="toast" [class]="type()">
        {{ message() }}
        <button type="button" (click)="open.set(false); dismissed.emit()">×</button>
      </div>
    }
  `,
})
export class Toast {
  readonly message = input.required<string>();
  readonly type = input<'info' | 'error'>('info');
  readonly open = model(true);
  readonly dismissed = output<void>();
}
```

```ts title="toast-host.ts"
import {
  Component, ComponentRef, ViewContainerRef, inputBinding, outputBinding,
  signal, twoWayBinding, viewChild,
} from '@angular/core';
import { Toast } from './toast';

@Component({
  selector: 'app-toast-host',
  template: `
    <button type="button" (click)="show()">Show toast</button>
    <button type="button" (click)="clear()">Clear</button>
    <ng-container #toasts />
  `,
})
export class ToastHost {
  private readonly toasts = viewChild.required('toasts', { read: ViewContainerRef });
  protected readonly message = signal('Saved!');
  protected readonly open = signal(true);

  protected show() {
    const ref: ComponentRef<Toast> = this.toasts().createComponent(Toast, {
      bindings: [
        inputBinding('message', this.message),      // live signal binding
        inputBinding('type', () => 'info'),         // any function works
        twoWayBinding('open', this.open),            // like [(open)]
        outputBinding('dismissed', () => ref.destroy()),
      ],
    });
  }

  protected clear() {
    this.toasts().clear(); // destroys every component in the container
  }
}
```

The options object also accepts `directives` (attach directives to the new host element), `injector`, `projectableNodes` and `index`.

### Rendering outside the tree with `createComponent()`

For overlays you may want the component attached to `document.body`. The standalone `createComponent()` function creates the component without inserting it anywhere; you attach it to change detection with `ApplicationRef`:

```ts title="popup.service.ts"
import {
  ApplicationRef, EnvironmentInjector, Service, createComponent, inject,
  inputBinding, outputBinding,
} from '@angular/core';
import { Popup } from './popup';

@Service()
export class PopupService {
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  show(message: string) {
    const host = document.createElement('div');

    const ref = createComponent(Popup, {
      environmentInjector: this.injector,
      hostElement: host,
      bindings: [
        inputBinding('message', () => message),
        outputBinding('closed', () => {
          this.appRef.detachView(ref.hostView);
          ref.destroy();
          host.remove();
        }),
      ],
    });

    this.appRef.attachView(ref.hostView); // join change detection
    document.body.appendChild(host);     // make it visible
  }
}
```

:::tip
For production overlays, prefer the CDK `Overlay` or Angular Material `MatDialog` — they handle positioning, focus trapping and scroll blocking for you. See [Angular Material](/intermediate/material/).
:::

:::note[Removed in v22]
`ComponentFactoryResolver` and `ComponentFactory` no longer exist. Pass the component class directly to `ViewContainerRef.createComponent(MyComponent)` or `createComponent(MyComponent, {...})`. Setting inputs with `ref.setInput('name', value)` still works if you prefer it over `bindings`.
:::

More patterns (registries, plugin systems, error handling with `onError`) are in [Dynamic Components](/advanced/dynamic-components/).

## Binding to the host element

The element that matches a component's selector (e.g. `<app-toggle>`) is its **host element**. Use the `host` property to add attributes, classes, styles and event listeners to it:

```ts title="toggle.ts"
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  template: `<span class="thumb"></span>`,
  host: {
    role: 'switch',
    tabindex: '0',
    '[attr.aria-checked]': 'checked()',
    '[class.on]': 'checked()',
    '(click)': 'toggle()',
    '(keydown.space)': 'toggle(); $event.preventDefault()',
  },
})
export class Toggle {
  readonly checked = model(false);

  protected toggle() {
    this.checked.update((v) => !v);
  }
}
```

- Static keys (`role`) set plain attributes; `[...]` keys are bindings; `(...)` keys are listeners.
- Global listeners: `'(window:resize)'`, `'(document:keydown.escape)'`.
- Host bindings are type-checked (default since v21).
- Read a **static** attribute once with `inject(new HostAttributeToken('variant'))` — cheaper than an input when the value never changes.

:::note[Legacy]
`@HostBinding()` and `@HostListener()` still work but exist only for backwards compatibility. Always prefer the `host` property.
:::

## Composing behaviour with `hostDirectives`

The **directive composition API** applies directives to a component's host from *inside* the component. It is a great alternative to inheritance for reusable behaviour (hover state, tooltips, focus handling).

```ts title="chip.ts"
import { Component, Directive, inject, input, signal } from '@angular/core';

@Directive({
  host: {
    '[class.hovered]': 'hovered()',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class Hoverable {
  readonly hovered = signal(false);
}

@Directive({
  host: { '[attr.title]': 'tooltip()' },
})
export class Tooltip {
  readonly tooltip = input('');
}

@Component({
  selector: 'app-chip',
  template: `<ng-content />`,
  hostDirectives: [
    Hoverable,
    { directive: Tooltip, inputs: ['tooltip: hint'] }, // expose + rename the input
  ],
})
export class Chip {
  private readonly hoverable = inject(Hoverable); // host directives are injectable
  protected readonly isHovered = this.hoverable.hovered;
}
```

```html
<app-chip hint="Angular">ng</app-chip>
```

Rules: host directives are applied at compile time, their `selector` is ignored, and their inputs/outputs are **private** unless you list them. Since v22, if the same directive ends up applied more than once (e.g. two host directives both include it), Angular de-duplicates it into a single instance instead of throwing.

## Inheritance

Components are classes, so they can extend a base class. A child inherits inputs, outputs, host bindings, lifecycle hooks and `inject()` fields; it uses its **own** selector and template. Mark a base class that has Angular features but no template with `@Directive()`:

```ts title="base-field.ts"
import { Directive, input, output } from '@angular/core';

@Directive()
export abstract class BaseField {
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly changed = output<string>();

  protected emit(value: string) {
    if (!this.disabled()) this.changed.emit(value);
  }
}
```

```ts title="text-field.ts"
import { Component } from '@angular/core';
import { BaseField } from './base-field';

@Component({
  selector: 'app-text-field',
  template: `
    <label>
      {{ label() }}
      <input #box [disabled]="disabled()" (input)="emit(box.value)" />
    </label>
  `,
})
export class TextField extends BaseField {}
```

If the child also defines a lifecycle hook such as `ngOnInit`, it **overrides** the parent's — call `super.ngOnInit()` to keep both. Prefer composition (`hostDirectives`, services) over deep inheritance chains.

## Styling and view encapsulation

By default component styles are **scoped**: Angular adds unique attributes so `.badge` in one component can't affect another.

```ts title="badge.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  template: `<span class="badge"><ng-content /></span>`,
  styles: `
    :host { display: inline-block; }
    :host(.large) .badge { font-size: 1.25rem; }
    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--badge-bg, #e0e7ff); /* themeable from outside */
    }
  `,
})
export class Badge {}
```

| `encapsulation` | Behaviour |
|---|---|
| `ViewEncapsulation.Emulated` (default) | Styles scoped with generated attributes. Global styles can still reach in. |
| `ViewEncapsulation.ShadowDom` | Uses the browser's Shadow DOM. Also changes event propagation and `<slot>` behaviour. |
| `ViewEncapsulation.ExperimentalIsolatedShadowDom` | Like `ShadowDom`, but guarantees that *only* the component's own styles apply. Experimental. |
| `ViewEncapsulation.None` | Styles become global. Use sparingly (e.g. a theme stylesheet component). |

- `:host` styles the host element; `:host(.large)` styles it only when it has the `large` class.
- To let parents customise a component, expose **CSS custom properties** (`--badge-bg`) rather than reaching inside with `::ng-deep`, which the Angular team strongly discourages.

## Change detection: OnPush by default

**OnPush is the default since v22** — you don't need to write `changeDetection` any more. An OnPush component re-renders only when:

1. A **signal** read in its template changes,
2. One of its **inputs** receives a new value (compared with `Object.is`),
3. An **event listener** in the component (or its children) runs, or
4. It is explicitly marked dirty (`ChangeDetectorRef.markForCheck()`, or the `async` pipe).

That means **mutating** objects or arrays in place won't update the screen. Create new references instead:

```ts
readonly items = signal<string[]>([]);

add(item: string) {
  // ❌ this.items().push(item);  — same array, no update
  this.items.update((list) => [...list, item]); // ✅ new array
}
```

:::note[Angular 21 and earlier]
Components without `changeDetection` used the `Default` strategy (check on every cycle). `ng update` to v22 adds `changeDetection: ChangeDetectionStrategy.Eager` (the new name for `Default`) to existing components that relied on it. `ChangeDetectionStrategy.Default` is deprecated.
:::

## Common mistakes

- **Conditionally rendering `<ng-content>`** — projected components are still created. Use an `<ng-template>` input/query instead.
- **Using `ComponentFactoryResolver`** from old tutorials — it was removed in v22.
- **Forgetting to clean up** components created with standalone `createComponent()` — call `appRef.detachView()` and `ref.destroy()`.
- **Mutating arrays/objects** held in signals or inputs — OnPush won't see the change.
- **Reaching into children with `::ng-deep`** — expose CSS custom properties or inputs instead.
- **Deep inheritance trees** — prefer `hostDirectives` and services for sharing behaviour.

## Key takeaways

- `<ng-content>` projects content; `select` creates slots; fallback content fills empty slots.
- `<ng-template>` + `NgTemplateOutlet` let the parent decide *how* something renders.
- Prefer `@defer` → `NgComponentOutlet` → `ViewContainerRef.createComponent()` (in that order) for dynamic UI; use `inputBinding`/`outputBinding`/`twoWayBinding` for wiring.
- Use the `host` property and `hostDirectives` instead of `@HostBinding`/`@HostListener` and inheritance.
- OnPush is the default since v22 — use signals and immutable updates and your components will just work.

## Next steps

- [Component Communication](/intermediate/component-communication/) — inputs, outputs, `model()` and queries
- [Lifecycle Hooks](/intermediate/lifecycle-hooks/) — when your code runs
- [Content Projection](/advanced/content-projection/) and [Dynamic Components](/advanced/dynamic-components/) — deeper dives
- [Custom Directives](/advanced/custom-directives/) — build your own attribute and structural directives
