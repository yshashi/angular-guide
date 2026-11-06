---
title: Content Projection 📤
description: Build flexible Angular components with ng-content slots, fallback content, ngProjectAs, content queries, ng-template and ngTemplateOutlet.
sidebar:
  order: 3
---

**Content projection** lets the *user* of a component decide what goes inside it. A card, dialog, panel or layout component provides the frame, and the parent fills in the content. It's the Angular version of "slots" in Web Components or `children` in React.

This page covers `<ng-content>` slots, and then the more powerful **template-based** projection with `<ng-template>` and `ngTemplateOutlet`, which you need for lazy, conditional, repeated or data-driven content.

## What you'll learn

- Single-slot and multi-slot projection with `<ng-content select>`
- Fallback (default) content and `ngProjectAs`
- Why projected content always belongs to the parent
- Reading projected content with `contentChild()` / `contentChildren()`
- Passing templates with `<ng-template>` and rendering them with `ngTemplateOutlet`
- Typed item templates, templates as inputs and the `injector: 'outlet'` option

## Single-slot projection

Put `<ng-content />` where the content should appear:

```ts title="card.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content />
    </div>
  `,
  styles: `.card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }`,
})
export class Card {}
```

```html
<app-card>
  <h2>Hello</h2>
  <p>Anything goes here.</p>
</app-card>
```

Rendered DOM:

```html
<app-card>
  <div class="card">
    <h2>Hello</h2>
    <p>Anything goes here.</p>
  </div>
</app-card>
```

`<ng-content>` isn't a real element. It's a placeholder that the compiler resolves at **build time**. You can't add directives, classes or bindings to it.

## Multi-slot projection with `select`

Give each `<ng-content>` a CSS selector in `select`. Content goes to the first slot it matches. A slot **without** `select` collects everything else.

```ts title="panel.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-panel',
  template: `
    <header><ng-content select="[panel-title]">Untitled</ng-content></header>
    <section><ng-content /></section>
    <footer><ng-content select="app-panel-actions, .actions" /></footer>
  `,
})
export class Panel {}

@Component({
  selector: 'app-panel-actions',
  template: `<ng-content />`,
})
export class PanelActions {}
```

```html
<app-panel>
  <h2 panel-title>Settings</h2>
  <p>Body content</p>
  <app-panel-actions><button>Save</button></app-panel-actions>
</app-panel>
```

| `select` value | Matches |
| --- | --- |
| `select="app-panel-actions"` | Element (tag) name |
| `select="[panel-title]"` | Attribute |
| `select=".actions"` | CSS class |
| `select="button[primary]"` | Combination |
| `select="a, b"` | Either selector |

Content that doesn't match any slot and has no default slot to go to is **not rendered**.

:::note
The selector is matched against the elements you write in the parent template, **not** against the projected component's own internal DOM. Only top-level nodes are matched. Nested elements travel along with their parent.
:::

## Fallback content

Anything inside `<ng-content>` is shown only when nothing is projected into that slot:

```html
<!-- in app-panel's template -->
<header><ng-content select="[panel-title]">Untitled</ng-content></header>
```

```html
<app-panel>
  <p>No title given, so the header shows "Untitled"</p>
</app-panel>
```

## `ngProjectAs`: projecting into a slot under another name

Sometimes the element you want to project doesn't match the slot's selector, or you want to project **several** elements into one slot. Wrap them in an `<ng-container>` with `ngProjectAs`:

```html
<app-panel>
  <ng-container ngProjectAs="[panel-title]">
    <h2>Title</h2>
    <small>with a subtitle</small>
  </ng-container>
  <p>Only body</p>
</app-panel>
```

`ngProjectAs` takes a **static** selector string. It can't be bound to an expression.

## Projected content belongs to the parent

This is the most important rule to understand:

- **Creation:** projected content is created by the parent **even if the slot is hidden**. Putting `<ng-content>` inside `@if` doesn't stop the content's components from being created, and their constructors and `ngOnInit` still run.
- **Change detection:** projected content is checked as part of the **parent's** view. Making the receiving component OnPush (the default since v22) doesn't skip it.
- **Dependency injection:** projected content resolves dependencies from where it's **declared** (the parent template). It can see the receiving component's `providers` (it's inside that host element), but **not** its `viewProviders`.

```ts
@Component({
  selector: 'app-tabs',
  providers: [TabsState],      // visible to projected <app-tab> children
  viewProviders: [TabsTheme],  // only visible inside app-tabs' own template
  template: `<ng-content />`,
})
export class Tabs {}
```

:::danger[Don't project conditionally with `@if`]
`@if (open()) { <ng-content /> }` only hides the DOM. The content is still created up front, and it's created only once. To render content **lazily**, **conditionally** or **multiple times**, accept an `<ng-template>` instead (see [below](#lazy-conditional-and-repeated-content-with-ng-template)).
:::

## Reading projected content with content queries

A component can get references to its projected children with signal-based content queries:

```ts
readonly tabs = contentChildren(Tab);                      // Signal<readonly Tab[]>
readonly header = contentChild(PanelHeader);                // Signal<PanelHeader | undefined>
readonly icon = contentChild.required('icon');              // by template reference name
readonly all = contentChildren(Tab, { descendants: true }); // also search nested elements
readonly el = contentChild(Tab, { read: ElementRef });       // read a different token
```

`contentChildren` looks only at **direct** children by default. Pass `descendants: true` to search deeper. `contentChild` searches descendants by default. The results are signals, so you can use them in `computed()` and templates.

## Lazy, conditional and repeated content with `ng-template`

An `<ng-template>` is a piece of template that is **not rendered** until someone asks for it. The receiving component can render it zero, one or many times, whenever it wants, with `ngTemplateOutlet`.

### Example: tabs that render only the active panel

```ts title="tabs.ts"
import { Component, TemplateRef, computed, contentChildren, input, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-tab',
  // Wrap the projected content in a template, so it's only rendered on demand
  template: `<ng-template><ng-content /></ng-template>`,
})
export class Tab {
  readonly label = input.required<string>();
  readonly content = viewChild.required(TemplateRef);
}

@Component({
  selector: 'app-tabs',
  imports: [NgTemplateOutlet],
  template: `
    <div role="tablist">
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          role="tab"
          [attr.aria-selected]="i === active()"
          [class.active]="i === active()"
          (click)="active.set(i)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    <div role="tabpanel">
      @if (activeTab(); as tab) {
        <ng-container [ngTemplateOutlet]="tab.content()" />
      }
    </div>
  `,
})
export class Tabs {
  readonly tabs = contentChildren(Tab);
  protected readonly active = signal(0);
  protected readonly activeTab = computed(() => this.tabs()[this.active()]);
}
```

```html
<app-tabs>
  <app-tab label="Profile"><p>Profile form…</p></app-tab>
  <app-tab label="Billing"><p>Billing info…</p></app-tab>
</app-tabs>
```

The **DOM** for inactive tabs isn't rendered. Note that components written directly inside `<app-tab>` are still *created* by the parent (the rule above). For truly lazy panels, have users pass an `<ng-template>` themselves, or combine this with `@defer`. For a production-ready, accessible tabs pattern, see `@angular/aria` (stable in v22) or Angular Material.

:::tip[Accessible tabs]
This example shows the projection technique only. A real tab widget also needs arrow-key navigation, `aria-controls` / `id` wiring and focus management.
:::

### Example: a list with a customizable, typed item template

Libraries often let you customise how each item looks. A tiny **marker directive** finds the template and gives it a typed context.

```ts title="list.ts"
import { Component, Directive, TemplateRef, contentChild, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface ListItemContext<T> {
  $implicit: T; // let-user
  index: number; // let-i="index"
}

@Directive({ selector: 'ng-template[appListItem]' })
export class ListItem<T> {
  // Only used so TypeScript can infer T from the items you pass in
  readonly appListItem = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<ListItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(dir: ListItem<T>, ctx: unknown): ctx is ListItemContext<T> {
    return true;
  }
}

@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet],
  template: `
    <ul>
      @for (item of items(); track $index) {
        <li>
          <ng-container
            [ngTemplateOutlet]="itemTemplate()?.template ?? defaultItem"
            [ngTemplateOutletContext]="{ $implicit: item, index: $index }"
          />
        </li>
      } @empty {
        <li><ng-content select="[empty]">No items</ng-content></li>
      }
    </ul>
    <ng-template #defaultItem let-item>{{ item }}</ng-template>
  `,
})
export class List<T> {
  readonly items = input.required<readonly T[]>();
  protected readonly itemTemplate = contentChild(ListItem<T>);
}
```

```html
<app-list [items]="users()">
  <ng-template [appListItem]="users()" let-user let-i="index">
    {{ i + 1 }}. <strong>{{ user.name }}</strong>
  </ng-template>
  <p empty>No users yet</p>
</app-list>
```

Inside the template, `user` is typed as `User`, so `user.nmae` is a compile-time error. Without the guard it would be `any`.

### Passing a template as an input

You don't have to project a template. You can also pass a `TemplateRef` through an input:

```ts title="header-bar.ts"
import { Component, TemplateRef, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-header-bar',
  imports: [NgTemplateOutlet],
  template: `
    <div class="bar">
      @if (actions(); as tpl) {
        <ng-container *ngTemplateOutlet="tpl; context: { $implicit: title() }" />
      } @else {
        <span>{{ title() }}</span>
      }
    </div>
  `,
})
export class HeaderBar {
  readonly title = input('');
  readonly actions = input<TemplateRef<{ $implicit: string }>>();
}
```

```html
<app-header-bar title="Orders" [actions]="orderActions" />
<ng-template #orderActions let-t>
  <span>{{ t }}</span> <button>New order</button>
</ng-template>
```

### `ngTemplateOutlet` reference

| Microsyntax | Input | Purpose |
| --- | --- | --- |
| `*ngTemplateOutlet="tpl"` | `ngTemplateOutlet` | The `TemplateRef` to render (`null` renders nothing) |
| `context: {...}` | `ngTemplateOutletContext` | Values for `let-` variables. `$implicit` is the default |
| `injector: inj` | `ngTemplateOutletInjector` | Custom injector, or `'outlet'` (see below) |

## Which injector does a template use?

By default, a template's content resolves dependencies from where the `<ng-template>` was **declared**, not from where it's rendered. Sometimes you want the opposite.

### `injector: 'outlet'` (v21.2+)

Set `ngTemplateOutletInjector` to the string `'outlet'` to inherit the injector from the **outlet's location**. This is perfect for recursive templates, where each level should see the providers of the component it's rendered in:

```ts title="tree.ts"
import { Component, InjectionToken, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export const DEPTH = new InjectionToken<number>('DEPTH', { factory: () => 0 });

@Component({
  selector: 'app-tree-node',
  providers: [{ provide: DEPTH, useFactory: () => inject(DEPTH, { skipSelf: true }) + 1 }],
  template: `<div [style.padding-left.px]="depth * 16"><ng-content /></div>`,
})
export class TreeNode {
  protected readonly depth = inject(DEPTH);
}

interface TreeItem {
  name: string;
  children: TreeItem[];
}

@Component({
  selector: 'app-tree',
  imports: [NgTemplateOutlet, TreeNode],
  template: `
    <ng-template #node let-items>
      @for (item of items; track item.name) {
        <app-tree-node>
          {{ item.name }}
          <ng-container
            *ngTemplateOutlet="node; context: { $implicit: item.children }; injector: 'outlet'"
          />
        </app-tree-node>
      }
    </ng-template>

    <ng-container *ngTemplateOutlet="node; context: { $implicit: data() }" />
  `,
})
export class Tree {
  readonly data = input.required<TreeItem[]>();
}
```

Each nested `<app-tree-node>` gets `DEPTH` from the node it's rendered in, so the indentation grows by level.

### Passing an element's injector (v22.2+)

Since v22.2 you can read an element's `Injector` with a view or content query (`read: Injector`) and pass it to the outlet. Projected templates can then inject what a third-party component provides:

```ts
@Component({
  selector: 'app-custom-table',
  imports: [NgTemplateOutlet, ThirdPartyTable],
  template: `
    <app-third-party-table #inner>
      <ng-container [ngTemplateOutlet]="columns() ?? null" [ngTemplateOutletInjector]="innerInjector()" />
    </app-third-party-table>
  `,
})
export class CustomTable {
  readonly columns = contentChild(TemplateRef);
  protected readonly innerInjector = viewChild('inner', { read: Injector });
}
```

## Common mistakes

- **Wrapping `<ng-content>` in `@if` to make it lazy.** It isn't lazy. Use `<ng-template>` plus `ngTemplateOutlet`.
- **Using two `<ng-content>` slots without `select`.** Only one default slot works. The others stay empty.
- **Expecting `viewProviders` to reach projected content.** Use `providers` if projected children need the service.
- **Binding `ngProjectAs`.** It only accepts a static selector.
- **Untyped templates.** Without `ngTemplateContextGuard`, `let-` variables are `any`. Add a marker directive with a guard.
- **Projecting into library components that manage their children** (menus, lists). They may rely on content queries and break when items come from another view. Check the library docs first.

## Best practices

- Use `<ng-content>` for static "frame" content and `<ng-template>` for lazy, repeated or data-driven content.
- Give slots semantic attribute selectors (`[panel-title]`, `[card-footer]`) and provide fallback content.
- Query projected children with `contentChild()` / `contentChildren()` signals, and derive state with `computed()`.
- Type every template context with a marker directive and `ngTemplateContextGuard`.

## Key takeaways

- `<ng-content select>` places parent content into named slots. Fallback content fills empty slots.
- Projected content is created, checked and injected from the **parent's** perspective.
- `<ng-template>` + `ngTemplateOutlet` gives full control: lazy, conditional, repeated, with context.
- `ngTemplateOutletInjector` accepts a custom injector or `'outlet'`, and since v22.2 queries can read an element's `Injector`.

## Next steps

- [Custom Directives](/advanced/custom-directives/): structural directives and template guards
- [Dynamic Components](/advanced/dynamic-components/): pass projected nodes to dynamically created components
- [Advanced DI Patterns](/advanced/dependency-injection/): `providers` vs `viewProviders` in depth
- [Component Communication](/intermediate/component-communication/)
