---
title: Templates & Data Binding 🎨
description: Learn Angular template syntax - interpolation, property, attribute, class, style and event binding, two-way binding, @let, pipes and control flow.
sidebar:
  order: 5
---

A template is the HTML that a component renders. Angular extends normal HTML with a small set of extra syntax so that your template can **show data**, **react to the user** and **render conditionally**. This page is a tour of everything you can write inside a template.

## What you'll learn

- Interpolation `{{ }}` and what you can (and can't) write in a template expression
- Property, attribute, class and style bindings with `[ ]`
- Event binding with `( )` and two-way binding with `[( )]`
- Template reference variables (`#ref`) and local variables (`@let`)
- A first look at pipes and control flow (`@if`, `@for`, `@switch`)

## Quick reference

| Syntax | Name | Direction | Example |
|---|---|---|---|
| `{{ value }}` | Interpolation | class → view | `<h1>{{ title() }}</h1>` |
| `[property]="expr"` | Property binding | class → view | `<img [src]="url()" />` |
| `[attr.name]="expr"` | Attribute binding | class → view | `<td [attr.colspan]="span()">` |
| `[class.name]="expr"` | Class binding | class → view | `<li [class.done]="todo.done">` |
| `[style.prop]="expr"` | Style binding | class → view | `<div [style.width.px]="w()">` |
| `(event)="statement"` | Event binding | view → class | `<button (click)="save()">` |
| `[(prop)]="signal"` | Two-way binding | both | `<input [(ngModel)]="name" />` |
| `#ref` | Template reference | — | `<input #box />` |
| `@let x = expr;` | Local variable | — | `@let total = price() * qty();` |
| `value \| pipe` | Pipe | — | `{{ today \| date }}` |

## Interpolation

Use double curly braces to render a value as text. Signals are read by **calling** them:

```ts title="welcome.ts"
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-welcome',
  template: `
    <h1>Welcome, {{ userName() }}!</h1>
    <p>You have {{ messages() }} new {{ messages() === 1 ? 'message' : 'messages' }}.</p>
  `,
})
export class Welcome {
  protected readonly userName = signal('Ada');
  protected readonly messages = signal(3);
}
```

Angular converts the result to a string and **escapes** it, so `{{ '<b>hi</b>' }}` shows the literal text, not bold text. This protects you from XSS attacks.

### Template expressions

Template expressions look like JavaScript, with a few differences:

| ✅ Supported | ❌ Not supported |
|---|---|
| Arithmetic, comparison, logical operators: `a + b`, `a > b && c` | `new`, `class`, `function`, `let`/`const` declarations |
| Ternary and nullish coalescing: `x ? a : b`, `name ?? 'Guest'` | Bitwise operators (`&`, `^`, `~`) |
| Optional chaining: `user?.address?.city` | Destructuring |
| Object/array literals and **spread**: `{...opts, open: true}`, `[...a, ...b]` | Globals such as `Math`, `Date`, `console`, `window` |
| Template literals: `` `Hi ${name()}` `` | Arrow functions with a `{ block }` body |
| `typeof`, `in`, `instanceof` | Assignments (`=`, `+=`) — allowed only in event bindings |
| **Arrow functions** with an expression body: `items().filter(i => i.done)` | |

```html
<!-- Arrow function: count completed tasks -->
<p>{{ tasks().filter(t => t.done).length }} of {{ tasks().length }} done</p>

<!-- Template literal -->
<p>{{ `Logged in as ${userName()}` }}</p>

<!-- Spread: pass a modified copy of an object to a child input -->
<app-chart [options]="{ ...defaultOptions, title: 'Sales' }" />
```

:::tip
If an expression gets long, move it into a `computed()` signal in the class. Templates stay readable and the value is cached.
:::

To use a global like `Math` or `Date`, expose it from the class:

```ts
protected readonly year = new Date().getFullYear();
```

:::note[Optional chaining changed in Angular 22]
`user?.name` now returns `undefined` (just like JavaScript) when `user` is `null`/`undefined`. Before v22 it returned `null`. `ng update` wraps existing expressions in `$safeNavigationMigration(...)` to keep the old behaviour; you can remove the wrapper once your code doesn't depend on `null` vs `undefined`.
:::

### Which class members can a template use?

Templates can read `public` and `protected` members. Mark template-only members as **`protected`** — it tells readers "used by the template, not by other code". (Since v22.2 templates can also read TypeScript `private` members, but `protected` works on every version and is the recommended convention. JavaScript `#private` fields are never accessible.)

## Property binding `[ ]`

Square brackets set a **DOM property** (or a component input) to the result of an expression:

```ts title="product-image.ts"
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-product-image',
  template: `
    <img [src]="imageUrl()" [alt]="description()" width="200" />
    <button type="button" [disabled]="isSaving()">Save</button>
    <input [value]="description()" readonly />
  `,
})
export class ProductImage {
  protected readonly imageUrl = signal('https://picsum.photos/200');
  protected readonly description = signal('Random photo');
  protected readonly isSaving = signal(false);
}
```

- Without brackets the value is a **plain string**: `alt="description()"` sets the literal text `description()`.
- You can also interpolate inside an attribute value: `alt="Photo of {{ name() }}"` — handy for building strings.
- Binding to a child component's input uses the same syntax: `<app-user-card [user]="selectedUser()" />`.

### Attribute binding `[attr.x]`

Some HTML attributes have no matching DOM property (`colspan`, `role`, `data-*`, most SVG attributes). Use the `attr.` prefix:

```html
<td [attr.colspan]="columns()">Total</td>
<div [attr.data-testid]="testId()" [attr.role]="isDialog() ? 'dialog' : null"></div>
<button type="button" [aria-label]="closeLabel()">✕</button>
```

Binding `null` or `undefined` **removes** the attribute. ARIA attributes such as `aria-label` can be bound directly (`[aria-label]`), or with `[attr.aria-label]` — both work.

## Class and style bindings

```html
<!-- Toggle one class -->
<li [class.done]="task.done">{{ task.title }}</li>

<!-- Several classes from a string, array or object -->
<div [class]="'card ' + theme()"></div>
<div [class]="['card', size()]"></div>
<div [class]="{ active: isActive(), disabled: isDisabled() }"></div>

<!-- One style property, optionally with a unit -->
<p [style.color]="textColor()">Coloured text</p>
<div [style.width.px]="width()"></div>
<div [style.--accent]="accentColor()"></div>  <!-- CSS custom property -->

<!-- Several styles from an object -->
<div [style]="{ 'font-size': '1.25rem', color: textColor() }"></div>
```

Static `class="..."` attributes and `[class...]` bindings are **merged** together, so `<div class="card" [class.active]="isActive()">` keeps `card`.

:::tip[Use bindings, not ngClass/ngStyle]
`[class]` and `[style]` bindings replace the `NgClass` and `NgStyle` directives in almost all cases — no import needed. When you bind an object or array, give Angular a **new** object (e.g. from `computed()`); mutating the same object won't be noticed.
:::

## Event binding `( )`

Parentheses listen to DOM events (or component outputs) and run a **statement** when they fire:

```ts title="click-counter.ts"
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-click-counter',
  template: `
    <button type="button" (click)="increment()">Clicked {{ count() }} times</button>

    <!-- $event is the native event object -->
    <div (mousemove)="trackMouse($event)">Move over me: {{ x() }}, {{ y() }}</div>

    <!-- Key modifiers: only fire on Enter, or Shift+Enter -->
    <input #box (keyup.enter)="add(box.value); box.value = ''" (keyup.shift.enter)="clear()" />

    <ul>
      @for (item of items(); track $index) {
        <li>{{ item }}</li>
      }
    </ul>
  `,
})
export class ClickCounter {
  protected readonly count = signal(0);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly items = signal<string[]>([]);

  protected increment() {
    this.count.update((c) => c + 1);
  }

  protected trackMouse(event: MouseEvent) {
    this.x.set(event.offsetX);
    this.y.set(event.offsetY);
  }

  protected add(value: string) {
    if (value.trim()) {
      this.items.update((list) => [...list, value.trim()]);
    }
  }

  protected clear() {
    this.items.set([]);
  }
}
```

- Statements **can** assign values and call several methods separated by `;`.
- Key modifiers: `keyup.enter`, `keydown.escape`, `keydown.control.s`, `keyup.shift.enter` (modifiers: `alt`, `control`, `meta`, `shift`).
- To stop a link or form from doing its default action, call `event.preventDefault()` in your handler.
- `$event.target.value` doesn't type-check (the target could be any element). Use a template reference variable (`#box` above) or cast in the class: `(event.target as HTMLInputElement).value`.

## Two-way binding `[( )]`

Two-way binding keeps a class value and a view value in sync. It's shorthand for a property binding **plus** an event binding:

```html
<!-- These two lines do the same thing -->
<app-star-rating [(rating)]="score" />
<app-star-rating [rating]="score()" (ratingChange)="score.set($event)" />
```

You can bind a **writable signal** directly — Angular reads and writes it for you.

**With form inputs** use `ngModel` from `FormsModule`:

```ts title="name-editor.ts"
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-name-editor',
  imports: [FormsModule],
  template: `
    <label>Name: <input [(ngModel)]="name" /></label>
    <label>
      Plan:
      <select [(ngModel)]="plan">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
    </label>
    <p>Hello {{ name() || 'stranger' }} — you picked {{ plan() }}.</p>
  `,
})
export class NameEditor {
  protected readonly name = signal('');
  protected readonly plan = signal('free');
}
```

**With your own components** declare a `model()` in the child (see [Components](/beginner/components/#two-way-binding-with-model)).

:::note
For real forms with validation, use **Signal Forms** and `[formField]` — see [Forms](/beginner/forms/).
:::

## Template reference variables `#ref`

`#name` gives a name to an element (or component) so you can use it elsewhere in the same template:

```html
<input #email type="email" placeholder="you@example.com" />
<button type="button" (click)="subscribe(email.value)">Subscribe</button>
<p>{{ email.value.length }} characters</p>

<!-- Reference a child component and call its public methods -->
<app-video-player #player />
<button type="button" (click)="player.play()">▶ Play</button>
```

On a plain element, `#ref` points to the DOM element (e.g. `HTMLInputElement`). On a component, it points to the component instance. To access a reference from the **class**, use a signal query such as `viewChild('email')` — see [Advanced Components](/intermediate/advanced-components/).

:::caution
`{{ email.value.length }}` only refreshes when Angular checks the component (e.g. after an event). For live values, store them in a signal instead.
:::

## Local variables with `@let`

`@let` declares a read-only variable inside the template. It's great for avoiding repetition and for naming a value you read many times:

```html
@let user = currentUser();
@let fullName = user.firstName + ' ' + user.lastName;
@let total = price() * quantity();

<h2>{{ fullName }}</h2>
<p>Total: {{ total }}</p>

@if (user.isAdmin) {
  <a href="/admin">Admin panel for {{ fullName }}</a>
}
```

- A `@let` is visible to the rest of the template **after** its declaration (and inside nested blocks).
- You can't reassign it; it recalculates automatically when its inputs change.
- Keep business logic in the class (`computed()`); use `@let` for small, template-only conveniences.

## Pipes — formatting values

A **pipe** transforms a value for display without changing the original. Use the `|` operator and pass arguments after `:`.

```ts title="order-summary.ts"
import { Component, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, JsonPipe, TitleCasePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe, DatePipe, JsonPipe, TitleCasePipe, UpperCasePipe],
  template: `
    <h2>{{ customer() | titlecase }}</h2>
    <p>Order placed: {{ placedAt() | date: 'medium' }}</p>
    <p>Total: {{ total() | currency: 'EUR' }}</p>
    <p>Status: {{ status() | uppercase }}</p>
    <pre>{{ items() | json }}</pre>
  `,
})
export class OrderSummary {
  protected readonly customer = signal('ada lovelace');
  protected readonly placedAt = signal(new Date());
  protected readonly total = signal(42.5);
  protected readonly status = signal('shipped');
  protected readonly items = signal([{ sku: 'A1', qty: 2 }]);
}
```

| Pipe | Example | Output |
|---|---|---|
| `uppercase` / `lowercase` / `titlecase` | `{{ 'hello world' \| titlecase }}` | Hello World |
| `date` | `{{ today \| date: 'shortDate' }}` | 11/6/26 |
| `currency` | `{{ 9.5 \| currency: 'USD' }}` | $9.50 |
| `number` / `percent` | `{{ 0.256 \| percent: '1.0-1' }}` | 25.6% |
| `slice` | `{{ list \| slice: 0 : 3 }}` | first 3 items |
| `json` | `{{ obj \| json }}` | pretty-printed JSON (debugging) |
| `async` | `{{ data$ \| async }}` | latest value of an Observable/Promise |
| `keyvalue` | `@for (e of obj \| keyvalue; track e.key)` | iterate an object |

Pipes are standalone: import each pipe class you use (`DatePipe`, `CurrencyPipe`, ...) into the component's `imports`. Pipes can be chained: `{{ name() | lowercase | titlecase }}`. Learn to build your own in [Pipes](/intermediate/pipes/).

## Control flow — a first look

Built-in blocks decide **what** to render. No imports are needed.

```html
<!-- Conditionals -->
@if (user(); as u) {
  <p>Welcome back, {{ u.name }}!</p>
} @else if (isLoading()) {
  <p>Loading…</p>
} @else {
  <button type="button" (click)="login()">Log in</button>
}

<!-- Loops: track tells Angular how to identify each item -->
<ul>
  @for (task of tasks(); track task.id; let i = $index, last = $last) {
    <li [class.last]="last">{{ i + 1 }}. {{ task.title }}</li>
  } @empty {
    <li>Nothing to do 🎉</li>
  }
</ul>

<!-- Switch -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <p>Something went wrong.</p> }
  @default { <app-results /> }
}
```

- `@for` **requires** `track`. Use a unique id (`track task.id`); use `track $index` only for static lists of primitives.
- Loop variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.
- `@defer` lazy-loads part of a template; `@switch` can also do exhaustive type checks. See [Control Flow](/modern/control-flow/).

:::note[Legacy syntax]
`*ngIf`, `*ngFor` and `*ngSwitch` are **deprecated**. Run `ng generate @angular/core:control-flow` to migrate old templates automatically.
:::

## Putting it together: a shopping list

```ts title="shopping-list.ts"
import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface Item {
  id: number;
  name: string;
  price: number;
  bought: boolean;
}

@Component({
  selector: 'app-shopping-list',
  imports: [CurrencyPipe],
  template: `
    <h2>Shopping list ({{ remaining() }} left)</h2>

    <form (submit)="$event.preventDefault(); add(name.value, +price.value); name.value = ''">
      <input #name placeholder="Item" required />
      <input #price type="number" min="0" step="0.01" placeholder="Price" />
      <button type="submit">Add</button>
    </form>

    @let list = items();
    <ul>
      @for (item of list; track item.id) {
        <li [class.bought]="item.bought">
          <label>
            <input type="checkbox" [checked]="item.bought" (change)="toggle(item.id)" />
            {{ item.name }} — {{ item.price | currency }}
          </label>
        </li>
      } @empty {
        <li>Your list is empty.</li>
      }
    </ul>

    @if (list.length > 0) {
      <p [style.font-weight]="remaining() === 0 ? 'bold' : 'normal'">
        Total: {{ total() | currency }}
      </p>
    }
  `,
  styles: `.bought { text-decoration: line-through; opacity: 0.6; }`,
})
export class ShoppingList {
  protected readonly items = signal<Item[]>([
    { id: 1, name: 'Milk', price: 1.2, bought: false },
    { id: 2, name: 'Bread', price: 2.5, bought: true },
  ]);
  protected readonly remaining = computed(() => this.items().filter((i) => !i.bought).length);
  protected readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));
  private nextId = 3;

  protected add(name: string, price: number) {
    if (!name.trim()) return;
    this.items.update((list) => [...list, { id: this.nextId++, name: name.trim(), price: price || 0, bought: false }]);
  }

  protected toggle(id: number) {
    this.items.update((list) => list.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i)));
  }
}
```

This one component uses interpolation, property, class and style bindings, event binding, template references, `@let`, a pipe, `@if` and `@for`.

## Common mistakes

| Mistake | Fix |
|---|---|
| `{{ count }}` shows `[Signal: 0]` or a function | Call the signal: `{{ count() }}`. |
| `src="imageUrl()"` shows a broken image | Use brackets: `[src]="imageUrl()"`. |
| `@for` without `track` | `track` is required — use a unique id. |
| `$event.target.value` type error | Use `#ref.value` or cast in the class. |
| Pipe "not found" error | Import the pipe class (e.g. `DatePipe`) into `imports`. |
| Mutating an object bound with `[class]="obj"` | Produce a new object (e.g. with `computed()`). |

## Best practices

- Keep templates **declarative**: move non-trivial logic into `computed()` signals.
- Prefer `[class.x]` / `[style.x]` over `ngClass` / `ngStyle`.
- Always `track` by a stable unique id in `@for`.
- Mark template-only members `protected`.
- Prefer built-in control flow over the deprecated `*ngIf` / `*ngFor`.

## Key takeaways

- `{{ }}` renders text, `[ ]` sets properties/attributes/classes/styles, `( )` listens to events, `[( )]` does both.
- Template expressions are JavaScript-like and now support arrow functions, spread and template literals — but keep them short.
- `#ref` names an element; `@let` names a value.
- Pipes format values; control flow blocks (`@if`, `@for`, `@switch`) decide what renders.

## Next steps

1. [Directives](/beginner/directives/) — add reusable behaviour to elements
2. [Control Flow](/modern/control-flow/) — `@if`, `@for`, `@switch` and `@defer` in depth
3. [Template Syntax](/modern/template-syntax/) — more modern template features
4. [Forms](/beginner/forms/) — collect and validate user input
