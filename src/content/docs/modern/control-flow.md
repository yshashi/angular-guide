---
title: Template Control Flow (@if, @for, @switch) 🔄
description: Render conditional and repeated template content with Angular's built-in control-flow blocks.
sidebar:
  order: 7
---

Angular's built-in control-flow blocks let templates render conditional content, iterate over collections and choose between cases without importing `NgIf`, `NgFor` or `NgSwitch`.

## Conditional content with `@if`

Use `@if`, `@else if` and `@else` for mutually exclusive template branches:

```html
@if (user(); as currentUser) {
  <h2>Welcome, {{ currentUser.name }}</h2>
} @else if (loading()) {
  <p>Loading your profile…</p>
} @else {
  <p>Your profile is unavailable.</p>
}
```

The optional `as` alias captures the condition's evaluated value for use in the block. The `@if` condition still follows JavaScript truthiness; if `0`, `false` or an empty string is meaningful, test the condition explicitly instead of relying on truthiness.

## Render collections with `@for`

Every `@for` block requires a `track` expression. Track by a stable unique key so Angular can reuse DOM nodes when items are inserted, removed or reordered:

```html
@for (product of products(); track product.id) {
  <article>
    <h2>{{ product.name }}</h2>
    <p>{{ product.price | currency }}</p>
  </article>
} @empty {
  <p>No products are available.</p>
}
```

`$index`, `$first`, `$last`, `$even`, `$odd` and `$count` are available as contextual variables. Alias them when a nested loop needs to refer to an outer loop's values:

```html
@for (group of groups(); track group.id; let groupIndex = $index) {
  <h2>{{ group.name }}</h2>
  @for (item of group.items; track item.id; let itemIndex = $index) {
    <p>{{ groupIndex + 1 }}.{{ itemIndex + 1 }} — {{ item.name }}</p>
  }
}
```

Avoid `track $index` when a collection can be reordered or updated in place; Angular cannot reliably associate existing DOM nodes with their data in those cases.

## Choose a branch with `@switch`

Use `@switch` when a value selects among distinct views:

```html
@switch (order().status) {
  @case ('pending') {
    <p>Your order is being prepared.</p>
  }
  @case ('shipped') {
    <p>Your order is on its way.</p>
  }
  @case ('delivered') {
    <p>Your order has arrived.</p>
  }
  @default {
    <p>Order status is unavailable.</p>
  }
}
```

`@switch` compares values using strict equality (`===`). Cases do not fall through, and you can stack multiple `@case` clauses for the same block:

```html
@switch (role()) {
  @case ('admin') {
    <p>Full administrative access.</p>
  }
  @case ('editor')
  @case ('reviewer') {
    <p>Can edit and review content.</p>
  }
  @default {
    <p>Read-only access.</p>
  }
}
```

### Exhaustive type checking (`@default never;`)

When switching over a TypeScript union type, use `@default never;` (introduced in Angular 21.2) so the compiler fails the build if a new union member is added and not handled:

```html
@let currentStatus = status();
@switch (currentStatus) {
  @case ('idle') { <p>Idle</p> }
  @case ('loading') { <p>Loading…</p> }
  @case ('success') { <p>Done</p> }
  @case ('error') { <p>Failed</p> }
  @default never;
}
```

## Deferrable views (`@defer`)

`@defer` splits heavy, standalone components into separate JavaScript chunks and loads them only when a trigger fires:

```html
@defer (on viewport; prefetch on idle) {
  <app-analytics-chart [data]="series()" />
} @placeholder (minimum 300ms) {
  <div class="chart-skeleton">Chart loads when scrolled into view</div>
} @loading (after 100ms; minimum 500ms) {
  <p role="status">Loading chart…</p>
} @error {
  <p role="alert">Could not load the chart.</p>
}
```

Common triggers include:

- `on idle` or `on idle(500)` (with an idle timeout in ms, added in Angular 22)
- `on viewport` or `on viewport({ rootMargin: '200px', threshold: 0.25 })`
- `on interaction` / `on hover` (on the placeholder or a template reference `#trigger`)
- `on timer(2s)`, `on immediate`, or `when someSignal()`

## Template error boundaries (`@boundary`, developer preview)

:::caution[Developer preview in Angular 22.2]
`@boundary` is in developer preview in Angular 22.2.
:::

`@boundary` catches rendering errors inside a template subtree and renders an `@error` fallback with `$error` and a `$reset()` callback:

```html
@boundary {
  <app-live-widget />
} @error {
  <p role="alert">Widget failed: {{ $error.message }}</p>
  <button type="button" (click)="$reset()">Retry</button>
}
```

## Migration from structural directives

The built-in blocks are part of template syntax and do not require `CommonModule` for control flow. Existing `*ngIf`, `*ngFor` and `*ngSwitch` directives remain supported; migrate when it is useful for your codebase, not because they have been removed.

For an existing workspace, Angular CLI provides a migration:

```bash
ng generate @angular/core:control-flow
```

Review the changes and run the project's template checks and tests after the migration. See [Template Syntax](/modern/template-syntax/) for `@let` and other template features.
