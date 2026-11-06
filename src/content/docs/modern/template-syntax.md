---
title: Template Syntax and @let 📝
description: Use Angular template expressions, bindings, event handlers and @let local variables clearly and safely.
sidebar:
  order: 9
---

Angular templates use HTML with a concise expression language for reading component state, binding properties, listening to events and rendering dynamic content. This guide focuses on `@let`, a way to name a template expression locally.

## Declare a template variable with `@let`

Use `@let` when a template repeats a value or expression:

```html
@let currentUser = user();

@if (currentUser) {
  <h1>Welcome, {{ currentUser.name }}</h1>
  <p>Signed in as {{ currentUser.email }}</p>
} @else {
  <p>Please sign in.</p>
}
```

Template variables are read-only and remain connected to their expressions: when a signal read by the expression changes, Angular updates uses of the variable. Use component `computed()` for derived state that is needed by multiple templates or belongs to the component's domain logic.

## Scope and syntax

A variable is available after its declaration in the current view and its descendant views. It is not available before its declaration or outside its scope.

```html
@let subtotal = cartTotal();
@let tax = subtotal * taxRate();

<p>Subtotal: {{ subtotal | currency }}</p>
<p>Tax: {{ tax | currency }}</p>
<p>Total: {{ subtotal + tax | currency }}</p>
```

Each declaration ends with a semicolon. You cannot assign a new value to a template variable:

```html
@let label = 'Products';
<!-- label = 'Orders' is not allowed -->
```

Avoid long chains of `@let` declarations or moving important business rules into a template. A short descriptive alias improves readability; complicated transformations belong in the component.

## Bindings and events

Use interpolation for text, property binding for element or component properties, and event binding for user actions:

```html
<h1>{{ pageTitle() }}</h1>
<button [disabled]="isSaving()" (click)="save()">Save</button>
<img [src]="product().imageUrl" [alt]="product().name" />
```

Use class and style bindings for conditional presentation:

```html
<p [class.warning]="isLowStock()" [style.opacity]="isArchived() ? 0.6 : 1">
  {{ product().name }}
</p>
```

For two-way binding, use the binding supported by the control or component. Do not mix direct DOM manipulation with Angular bindings for the same property.

## Safe template expressions

Templates support common expressions, including property access, function calls, arithmetic, comparison, logical operators, nullish coalescing and ternaries. Keep expressions simple and side-effect free. Angular does not allow arbitrary JavaScript statements or declarations in interpolation.

Use null-safe access and explicit fallbacks when data may not be available:

```html
@let displayName = user()?.name ?? 'Guest';
<p>Hello, {{ displayName }}</p>
```

### Modern JavaScript expressions in templates

Recent Angular releases expanded what you can write directly inside template expressions:

```html
<!-- Template literals -->
<p>{{ `Hello, ${name()}!` }}</p>

<!-- Arrow functions (Angular 21.2+) — great for quick array lookups -->
<p>Featured: {{ items().find((item) => item.featured)?.name ?? 'None' }}</p>

<!-- Spread syntax (Angular 21.1+) -->
<p>{{ sum(...scores()) }}</p>

<!-- typeof, in, instanceof (Angular 21.2+) and regex literals -->
@if (typeof value() === 'string') {
  <p>Code valid: {{ /^\d{6}$/.test(code()) }}</p>
}

<!-- Compound assignment in event listeners -->
<button type="button" (click)="clicks += 1">Clicked {{ clicks }}</button>
```

Keep inline arrow functions small and free of side effects. In Angular 22+, templates can also read TypeScript `private` members of their component class, though `protected` remains a clear convention for template-facing members.

Do not use `@let` as an escape hatch for complex logic. Move formatting into a pipe, and reusable or stateful logic into the component or a service.

## When to use `@let`

Use it to:

- Give a readable name to a repeated expression.
- Keep a template from calling the same expression repeatedly.
- Capture an observable value or signal value for a block.

Avoid it when:

- The expression appears only once and is already clear.
- The value represents domain logic or needs to be shared outside the template.
- Several aliases make the template harder to understand than the original expression.

See [Template Control Flow](/modern/control-flow/) for `@if`, `@for` and `@switch`.
