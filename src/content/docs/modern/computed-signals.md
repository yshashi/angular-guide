---
title: Computed Signals ⚡
description: Derive state with computed() in Angular 22 — lazy, memoized, read-only signals with dynamic dependencies, custom equality and real-world patterns.
sidebar:
  order: 3
---

A **computed signal** is a read-only signal whose value is calculated from other signals. Think of a spreadsheet formula: `=B1*B2` updates whenever `B1` or `B2` changes, and you never type into the formula cell yourself. In Angular, `computed()` is the default tool for any value you can *derive* — totals, filtered lists, labels, `isValid` flags.

## What you'll learn

- Create computed signals and read them in templates and code
- Understand that computeds are lazy, memoized and read-only
- How dynamic dependency tracking works
- Build real-world derived state (filtering, sorting, totals)
- When to reach for `linkedSignal()` instead

## Creating a computed signal

```ts
import { computed, signal, Signal } from '@angular/core';

const count = signal(2);
const double: Signal<number> = computed(() => count() * 2);

console.log(double()); // 4
count.set(5);
console.log(double()); // 10
```

The function you pass is the **derivation**. Every signal it reads becomes a dependency.

## Three rules of `computed()`

### 1. It's lazy

The derivation doesn't run until someone reads the computed. If nothing reads it, it never runs.

### 2. It's memoized

After the first read, the result is cached. Reading it again returns the cached value **without recalculating** — until one of its dependencies changes. That makes it safe to do expensive work like filtering a large array.

### 3. It's read-only

A computed has no `set()` or `update()`:

```ts
double.set(3); // ❌ compile error: Property 'set' does not exist on type 'Signal<number>'
```

If you need a value that is derived **but can also be overwritten** by the user (and resets when the source changes), use [`linkedSignal()`](/modern/linked-signals/).

## Dependencies are dynamic

Only the signals read during the **most recent** run are tracked:

```ts
const showCount = signal(false);
const count = signal(0);

const message = computed(() => (showCount() ? `The count is ${count()}` : 'Nothing to see here'));
```

- While `showCount()` is `false`, `count` isn't read, so changing `count` doesn't recompute `message`.
- Once `showCount` becomes `true`, `count` is read and becomes a dependency.
- Set `showCount` back to `false` and `count` is dropped again.

## Real-world example: search, sort and totals

```ts title="product-list.ts"
import { Component, computed, input, signal } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
  category: 'books' | 'games' | 'music';
}

@Component({
  selector: 'app-product-list',
  template: `
    <input placeholder="Search" [value]="search()" (input)="search.set($event.target.value)" />

    <select (change)="sortBy.set($any($event.target).value)">
      <option value="name">Name</option>
      <option value="price">Price</option>
    </select>

    <p>Showing {{ visible().length }} of {{ products().length }} products</p>

    @for (p of visible(); track p.id) {
      <div>{{ p.name }} — {{ p.price }}</div>
    } @empty {
      <p>No products match “{{ search() }}”.</p>
    }

    <p>Total: {{ total() }}</p>
  `,
})
export class ProductList {
  readonly products = input.required<Product[]>();

  protected readonly search = signal('');
  protected readonly sortBy = signal<'name' | 'price'>('name');

  protected readonly visible = computed(() => {
    const term = this.search().toLowerCase();
    const filtered = this.products().filter((p) => p.name.toLowerCase().includes(term));
    const key = this.sortBy();
    return [...filtered].sort((a, b) =>
      key === 'price' ? a.price - b.price : a.name.localeCompare(b.name),
    );
  });

  protected readonly total = computed(() => this.visible().reduce((sum, p) => sum + p.price, 0));
}
```

Notes:

- `products` is a signal input, so it's a dependency just like `search`.
- `[...filtered].sort()` copies before sorting — never sort the input array in place.
- `total` depends on `visible`, so computeds can be **chained**.

## Chaining computeds

```ts
const price = signal(100);
const quantity = signal(2);
const taxRate = signal(0.2);

const subtotal = computed(() => price() * quantity());
const tax = computed(() => subtotal() * taxRate());
const grandTotal = computed(() => subtotal() + tax());
```

Small, named computeds are easier to read and test than one giant function, and Angular only recalculates the parts whose inputs changed.

## Example: cart summary from an input

```ts title="cart-summary.ts"
import { Component, computed, input } from '@angular/core';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

@Component({
  selector: 'app-cart-summary',
  template: `
    <p>{{ itemCount() }} items</p>
    <p>Subtotal: {{ subtotal() }}</p>
    @if (freeShipping()) {
      <p>🎉 Free shipping!</p>
    } @else {
      <p>Add {{ 50 - subtotal() }} more for free shipping</p>
    }
  `,
})
export class CartSummary {
  readonly items = input<CartItem[]>([]);

  protected readonly itemCount = computed(() => this.items().reduce((n, i) => n + i.qty, 0));
  protected readonly subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + i.price * i.qty, 0),
  );
  protected readonly freeShipping = computed(() => this.subtotal() >= 50);
}
```

## Custom equality

A computed notifies its dependents only when its **result** changes (by `Object.is()`). If your derivation returns a new array every time, you can tell Angular when two results should count as equal:

```ts
const items = signal([{ id: 1 }, { id: 2 }]);

const ids = computed(() => items().map((i) => i.id), {
  equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
});
```

Now replacing `items` with new objects that have the same ids doesn't wake up anything that reads `ids`.

You can also give a computed a `debugName` (`computed(fn, { debugName: 'ids' })`) to identify it in Angular DevTools.

## `computed()` vs `linkedSignal()` vs `effect()`

| You need… | Use |
|---|---|
| A value calculated from other signals, never set directly | `computed()` |
| A value that starts from / resets to a derived value but the user can change | `linkedSignal()` |
| Async data that depends on signals (HTTP, etc.) | `resource()` / `httpResource()` |
| To push a value **out** to a non-signal API (localStorage, a chart library, logging) | `effect()` |

## Common mistakes

| Mistake | Fix |
|---|---|
| Side effects inside `computed()` (HTTP calls, `set()` on other signals, DOM changes) | Keep derivations pure; use `effect()` or a resource for side effects |
| Using `effect()` to copy a derived value into another signal | Replace the second signal with a `computed()` |
| Sorting/mutating an input array inside `computed()` | Copy first: `[...list].sort(...)` |
| Calling an expensive method in the template instead of a computed | Move it into a `computed()` so it's cached |
| Reading a signal after `await` inside a computed | Computeds must be synchronous; use a resource for async work |

## Key takeaways

- `computed()` creates read-only, lazy, memoized derived state.
- Dependencies are tracked automatically and dynamically.
- Chain small computeds for readable derived state.
- Prefer `computed()` over `effect()` whenever you're *calculating* something.
- Need it writable? Use `linkedSignal()`.

## Next steps

- [Effects](/modern/effects/) — the right way to run side effects
- [Linked Signals](/modern/linked-signals/) — writable derived state
- [Resource API](/modern/resource-api/) — derived **async** state
