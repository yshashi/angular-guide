---
title: Components Basics 🧩
description: Learn how Angular components work - the class, template, styles, inputs, outputs, model(), host bindings and how to compose them into an app.
sidebar:
  order: 4
---

Components are the building blocks of every Angular app. Each component owns one piece of the screen: it has a **TypeScript class** (data and behaviour), an **HTML template** (what is rendered) and optional **CSS styles** (how it looks). You build an app by putting small components inside bigger ones, like LEGO bricks.

## What you'll learn

- The anatomy of a component and the most useful `@Component` options
- How to create, import and use a component
- How to keep state in signals and react to user events
- How to pass data in with `input()`, send events out with `output()` and share a value two-ways with `model()`
- How to style a component and its host element
- Which change detection mode Angular uses by default (OnPush since v22)

## Anatomy of a component

```ts title="user-card.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-card',                 // the HTML tag you use: <app-user-card />
  template: `<h2>Hello, {{ name }}!</h2>`,  // what gets rendered
  styles: `h2 { color: rebeccapurple; }`,    // styles scoped to this component
})
export class UserCard {
  protected name = 'Ada';                     // data the template can read
}
```

| Part | What it does |
|---|---|
| `@Component({...})` | Decorator that turns a plain class into a component and holds its configuration (metadata). |
| `selector` | The CSS selector used to place the component in another template. Use a prefix such as `app-` to avoid clashes with real HTML elements. |
| `template` / `templateUrl` | Inline HTML template, or a path to a separate `.html` file. Use one of them. |
| `styles` / `styleUrl` | Inline CSS, or a path to a `.css`/`.scss` file. `styleUrls: [...]` (array) also works when you need several files. |
| `imports` | Other components, directives and pipes that this component's template uses. |
| The class | Properties and methods the template can read and call. |

:::tip
Components are **standalone** by default — you never need `standalone: true` and you don't need an `NgModule`. A component simply lists what its template uses in `imports`.
:::

## Creating a component

### With the Angular CLI (recommended)

```bash
ng generate component user-profile
# short form
ng g c user-profile
# inside a folder
ng g c features/users/user-profile
```

The CLI creates four files using the modern file naming style (no `.component` suffix):

```text
user-profile/
├── user-profile.ts        # class UserProfile
├── user-profile.html      # template
├── user-profile.css       # styles
└── user-profile.spec.ts   # unit test (Vitest)
```

Useful flags: `--inline-template` (`-t`), `--inline-style` (`-s`), `--skip-tests`.

### With separate files

```ts title="user-profile.ts"
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile {
  protected readonly name = signal('Jane Smith');
  protected readonly email = signal('jane@example.com');
  protected readonly showEmail = signal(false);

  protected toggleEmail() {
    this.showEmail.update((visible) => !visible);
  }
}
```

```html title="user-profile.html"
<article class="card">
  <h2>{{ name() }}</h2>
  @if (showEmail()) {
    <p>{{ email() }}</p>
  }
  <button type="button" (click)="toggleEmail()">
    {{ showEmail() ? 'Hide' : 'Show' }} email
  </button>
</article>
```

```css title="user-profile.css"
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  max-width: 300px;
}
```

## Using a component inside another component

To use a component, **import it into the parent's `imports` array** and then write its selector in the parent's template:

```ts title="app.ts"
import { Component } from '@angular/core';
import { UserProfile } from './user-profile/user-profile';

@Component({
  selector: 'app-root',
  imports: [UserProfile],                 // 1. make it available
  template: `
    <h1>Team</h1>
    <app-user-profile />                  <!-- 2. use it -->
    <app-user-profile />
  `,
})
export class App {}
```

Each `<app-user-profile />` creates a **separate instance** with its own state. Self-closing tags (`<app-user-profile />`) are supported for components.

:::caution[Forgot to import?]
If you use `<app-user-profile />` without adding `UserProfile` to `imports`, the compiler reports an error such as *"'app-user-profile' is not a known element"*. This is the most common beginner mistake.
:::

### Selector types

| Selector | Usage |
|---|---|
| `'app-header'` (element — most common) | `<app-header />` |
| `'[appToolbar]'` (attribute) | `<div appToolbar></div>` |
| `'button[app-button]'` (element + attribute) | `<button app-button>Save</button>` |

Attribute selectors are handy when you want to keep the native element, e.g. a `<button>` that stays accessible.

## State, signals and events

Keep component state in **signals**. A signal is a value container that tells Angular when it changes, so Angular knows exactly what to re-render.

```ts title="counter.ts"
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }} (double: {{ double() }})</p>
    <button type="button" (click)="decrement()">-</button>
    <button type="button" (click)="increment()">+</button>
    <button type="button" (click)="count.set(0)">Reset</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);                         // writable state
  protected readonly double = computed(() => this.count() * 2); // derived state

  protected increment() {
    this.count.update((c) => c + 1);
  }

  protected decrement() {
    this.count.update((c) => c - 1);
  }
}
```

- Read a signal by **calling it**: `count()`.
- Change it with `.set(value)` or `.update(fn)`.
- `computed()` creates read-only values derived from other signals; they update automatically.

Learn more in [Signals](/modern/signals/).

### Why signals matter: OnPush is the default

Since **Angular 22**, components that don't set `changeDetection` use the **`OnPush`** strategy. Angular re-checks an OnPush component only when:

- a **signal** read in its template changes,
- one of its **inputs** receives a new value, or
- an **event** bound in its template (or a child's template) fires.

So if you change a plain (non-signal) property inside a `setTimeout`, a promise or an observable callback, the screen will **not** update. Signals solve this — always store changing state in signals and everything just works.

:::note[Angular 21 and earlier]
Older versions checked every component on every change detection cycle (the `Default` strategy) unless you opted into `ChangeDetectionStrategy.OnPush`. When you run `ng update` to v22, a migration adds `changeDetection: ChangeDetectionStrategy.Eager` to existing components so they keep the old behaviour. `Eager` is the new name for the deprecated `Default`. In new code, leave `changeDetection` out.
:::

## Passing data in with `input()`

Inputs let a **parent** give data to a **child**. Declare them with the `input()` function:

```ts title="greeting.ts"
import { Component, booleanAttribute, computed, input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `
    <p [class.loud]="loud()">{{ message() }}</p>
  `,
  styles: `.loud { font-weight: bold; text-transform: uppercase; }`,
})
export class Greeting {
  readonly name = input.required<string>();                  // must be provided
  readonly greeting = input('Hello');                         // optional, with a default
  readonly loud = input(false, { transform: booleanAttribute }); // <app-greeting loud />

  protected readonly message = computed(() => `${this.greeting()}, ${this.name()}!`);
}
```

```html
<!-- Parent template -->
<app-greeting name="Ada" />
<app-greeting [name]="currentUser()" greeting="Welcome back" loud />
```

- `input.required<T>()` — the parent **must** bind it, or the build fails.
- `input(defaultValue)` — optional; the type is inferred from the default.
- An input is a **read-only signal**: read it with `name()` in the class and the template.
- `transform` converts the incoming value. `booleanAttribute` lets you write a bare attribute (`loud`) instead of `[loud]="true"`; `numberAttribute` does the same for numbers.
- `alias` renames the public name: `input('', { alias: 'label' })`.

:::tip
Use `computed()` to derive values from inputs (like `message` above). Don't copy an input into a separate field — you would lose updates.
:::

## Sending events out with `output()`

Outputs let a **child** tell its **parent** that something happened:

```ts title="like-button.ts"
import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-like-button',
  template: `<button type="button" (click)="like()">👍 {{ likes() }}</button>`,
})
export class LikeButton {
  readonly liked = output<number>();     // emits a number
  protected readonly likes = signal(0);

  protected like() {
    this.likes.update((n) => n + 1);
    this.liked.emit(this.likes());
  }
}
```

```html
<!-- Parent template: $event is the emitted value -->
<app-like-button (liked)="onLiked($event)" />
```

Use `output<void>()` and `.emit()` with no argument when you don't need to send a value.

:::note[Older decorator syntax]
You will see `@Input() name = '';` and `@Output() liked = new EventEmitter<number>();` in older code. They still work, but `input()`/`output()` are the recommended, signal-friendly API. The [signals migration](/migration/signals/) can convert them for you.
:::

## Two-way binding with `model()`

Sometimes a child needs to **read and update** a value owned by the parent (a toggle, a rating, a custom input). Use `model()`:

```ts title="star-rating.ts"
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  template: `
    @for (star of stars; track star) {
      <button type="button" (click)="rating.set(star)" [attr.aria-label]="star + ' stars'">
        {{ star <= rating() ? '★' : '☆' }}
      </button>
    }
  `,
})
export class StarRating {
  readonly rating = model(0);          // a writable signal shared with the parent
  protected readonly stars = [1, 2, 3, 4, 5];
}
```

```ts title="review-form.ts"
import { Component, signal } from '@angular/core';
import { StarRating } from './star-rating';

@Component({
  selector: 'app-review-form',
  imports: [StarRating],
  template: `
    <app-star-rating [(rating)]="score" />
    <p>You rated: {{ score() }} / 5</p>
  `,
})
export class ReviewForm {
  protected readonly score = signal(3);
}
```

`[(rating)]` (the "banana in a box") binds the input **and** listens to the automatically created `ratingChange` output. When the child calls `rating.set(...)`, the parent's `score` signal updates too.

## The host element

Every component renders inside its **host element** — the `<app-...>` tag itself. Configure attributes, classes, styles and event listeners on it with the `host` property:

```ts title="chip.ts"
import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-chip',
  template: `<ng-content />`,
  host: {
    role: 'button',                           // static attribute
    tabindex: '0',
    class: 'chip',                            // static class
    '[class.selected]': 'selected()',         // class binding
    '[attr.aria-pressed]': 'selected()',      // attribute binding
    '[style.--chip-color]': 'color()',        // style binding
    '(click)': 'toggle()',                    // event listener
    '(keydown.enter)': 'toggle()',
  },
  styles: `
    :host { display: inline-block; padding: 4px 12px; border-radius: 16px;
            border: 1px solid var(--chip-color); cursor: pointer; }
    :host(.selected) { background: var(--chip-color); color: white; }
  `,
})
export class Chip {
  readonly color = input('steelblue');
  readonly selected = model(false);

  protected toggle() {
    this.selected.update((s) => !s);
  }
}
```

```html
<app-chip [(selected)]="isVegan">Vegan</app-chip>
```

- `:host` in your CSS targets the host element; `:host(.selected)` applies only when it has that class.
- Prefer `host: {}` over the older `@HostBinding` / `@HostListener` decorators.
- `<ng-content />` shows whatever the parent puts between the tags (here, "Vegan"). See [Content Projection](/advanced/content-projection/).

## Styling components

By default Angular uses **emulated view encapsulation**: styles you write in `styles` / `styleUrl` only apply to that component's own template. A `p { color: red }` in one component does not leak into others.

```ts
@Component({
  selector: 'app-alert',
  template: `<p><ng-content /></p>`,
  styles: `
    :host { display: block; }
    p { padding: 0.75rem; border-left: 4px solid orange; }
  `,
})
export class Alert {}
```

| `encapsulation` | Behaviour |
|---|---|
| `ViewEncapsulation.Emulated` (default) | Styles are scoped by adding unique attributes to elements. |
| `ViewEncapsulation.ShadowDom` | Uses the browser's native Shadow DOM. |
| `ViewEncapsulation.None` | Styles become global. Use sparingly. |

Put truly global styles (fonts, resets, CSS variables) in `src/styles.css`.

## Lifecycle in one minute

Angular creates, updates and destroys components for you. The hooks beginners use most:

```ts title="clock.ts"
import { Component, DestroyRef, OnInit, afterNextRender, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<p>{{ label() }}: {{ time() }}</p>`,
})
export class Clock implements OnInit {
  readonly label = input('Local time');
  protected readonly time = signal(new Date().toLocaleTimeString());

  constructor() {
    // Runs once in the browser after the first render: safe to touch the DOM here.
    afterNextRender(() => console.log('Clock rendered'));

    const id = setInterval(() => this.time.set(new Date().toLocaleTimeString()), 1000);
    // Clean up when the component is destroyed.
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  ngOnInit() {
    // Inputs are available here: good for one-time setup that needs input values.
    console.log('Clock label is', this.label());
  }
}
```

Because `time` is a signal, the clock keeps updating even though it changes inside `setInterval` (remember: OnPush is the default).

With signals you often don't need `ngOnChanges` at all — `computed()` reacts to input changes automatically. Full details: [Lifecycle Hooks](/intermediate/lifecycle-hooks/).

## Putting it together: a product list

```ts title="product-card.ts"
import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

export interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  template: `
    <h3>{{ product().name }}</h3>
    <p>{{ product().price | currency }}</p>
    @if (!product().inStock) {
      <p class="badge">Out of stock</p>
    }
    <button type="button" [disabled]="!product().inStock" (click)="addToCart.emit(product())">
      Add to cart
    </button>
  `,
  host: { '[class.out-of-stock]': '!product().inStock' },
  styles: `
    :host { display: block; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
    :host(.out-of-stock) { opacity: 0.6; }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
```

```ts title="product-list.ts"
import { Component, computed, signal } from '@angular/core';
import { Product, ProductCard } from './product-card';

@Component({
  selector: 'app-product-list',
  imports: [ProductCard],
  template: `
    <p>🛒 {{ cartCount() }} item(s) in cart</p>
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" (addToCart)="add($event)" />
    } @empty {
      <p>No products yet.</p>
    }
  `,
})
export class ProductList {
  protected readonly products = signal<Product[]>([
    { id: 1, name: 'Keyboard', price: 49, inStock: true },
    { id: 2, name: 'Mouse', price: 19, inStock: false },
    { id: 3, name: 'Monitor', price: 199, inStock: true },
  ]);
  private readonly cart = signal<Product[]>([]);
  protected readonly cartCount = computed(() => this.cart().length);

  protected add(product: Product) {
    this.cart.update((items) => [...items, product]); // new array, never mutate
  }
}
```

Data flows **down** through inputs (`[product]`) and events flow **up** through outputs (`(addToCart)`). When several components need the same data, move it into a service — for example a `@Service()` class — covered in [Services & DI](/beginner/services/).

## Common mistakes

| Mistake | Fix |
|---|---|
| "is not a known element" error | Add the child component to the parent's `imports`. |
| Writing `{{ product.name }}` for an input | Inputs are signals: `{{ product().name }}`. |
| Trying to `set()` an `input()` | Inputs are read-only. Use `model()` if the child must change it, or emit an `output()`. |
| UI not updating after `setTimeout`/HTTP callback | Store the value in a `signal` (OnPush is the default). |
| Mutating arrays: `items().push(x)` | Create a new array: `items.update(list => [...list, x])`. |
| Adding `standalone: true` or `changeDetection: OnPush` everywhere | Both are defaults now — leave them out. |

## Best practices

- Keep components **small and focused** on one job; split big templates into child components.
- Use `protected` for members only the template needs, `readonly` for signals, inputs and outputs.
- Derive values with `computed()` rather than methods called from the template.
- Use `host: {}` instead of `@HostBinding` / `@HostListener`, and `[class.x]` / `[style.x]` instead of `ngClass` / `ngStyle`.
- Name files and classes with the modern style: `user-card.ts` → `UserCard`, selector `app-user-card`.

## Key takeaways

- A component = class + template + (optional) styles, configured with `@Component`.
- Import child components in `imports`, then use their selector.
- Store state in `signal()`, derive with `computed()` — this is what makes OnPush (the v22 default) work.
- `input()` passes data down, `output()` sends events up, `model()` gives two-way binding.
- Use `host` metadata and `:host` CSS to style and wire up the host element.

## Next steps

1. [Templates & Data Binding](/beginner/templates/) — everything you can write inside a template
2. [Directives](/beginner/directives/) — add behaviour to existing elements
3. [Services & DI](/beginner/services/) — share data and logic between components
4. [Component Communication](/intermediate/component-communication/) — more patterns for parent/child communication
