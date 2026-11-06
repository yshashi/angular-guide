---
title: Angular Elements 🧩
description: Turn Angular components into framework-agnostic custom elements (Web Components) with createApplication and createCustomElement in Angular 22.
sidebar:
  order: 6
---

**Angular Elements** (`@angular/elements`) packages an Angular component as a **custom element**, a standard Web Component that works in any HTML page: a CMS, a server-rendered site, a React or Vue app, or a plain `index.html`. The page just writes `<star-rating value="4"></star-rating>`, and Angular takes care of rendering, inputs, events and change detection.

## What you'll learn

- When Angular Elements is (and isn't) the right tool
- Creating custom elements with `createApplication()` and `createCustomElement()`
- How inputs map to attributes and properties, and outputs to DOM events
- Style isolation with Shadow DOM and content projection
- TypeScript typings for custom elements
- Building and embedding the bundle in another page

## When to use Angular Elements

| Good fit | Not a good fit |
| --- | --- |
| Embedding Angular widgets in non-Angular pages (CMS, legacy apps, static sites) | Reusing components **inside** an Angular app (just import the component) |
| Sharing a widget across teams using different frameworks | Complex apps with routing, which are better as a full Angular app |
| Gradual migration from another framework | Many tiny widgets on one page from *different* Angular builds |

## How it works

`createCustomElement()` turns a component class into a custom element **class**. You register it with the browser's built-in `customElements.define()`. From then on, every time the browser sees that tag:

1. it creates the element and an Angular component instance for it,
2. attributes and properties are forwarded to the component's **inputs**,
3. the component's **outputs** are dispatched as DOM `CustomEvent`s,
4. when the element is removed from the DOM, the component is destroyed (after a short delay, so moving an element within the page doesn't destroy it).

## Step 1: install

```bash
npm install @angular/elements
```

## Step 2: write a normal component

Nothing special is needed. Use signal inputs and outputs as usual. Attribute values are always **strings**, so use input transforms such as `numberAttribute` and `booleanAttribute`.

```ts title="star-rating.ts"
import {
  Component, ViewEncapsulation, booleanAttribute, computed, input, numberAttribute, output,
} from '@angular/core';

@Component({
  selector: 'app-star-rating',
  encapsulation: ViewEncapsulation.ShadowDom, // isolate styles from the host page
  template: `
    <div role="radiogroup" [attr.aria-label]="label()">
      @for (star of stars(); track star) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="star === value()"
          [class.filled]="star <= value()"
          [disabled]="readonly()"
          (click)="rated.emit(star)"
        >
          ★
        </button>
      }
    </div>
  `,
  styles: `
    button { background: none; border: none; font-size: 1.5rem; color: #ccc; cursor: pointer; }
    button.filled { color: gold; }
  `,
})
export class StarRating {
  readonly value = input(0, { transform: numberAttribute });
  readonly max = input(5, { transform: numberAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly label = input('Rating');
  readonly rated = output<number>();

  protected readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
}
```

## Step 3: register the element in `main.ts`

Instead of `bootstrapApplication()`, create the application environment with `createApplication()` (from `@angular/platform-browser`). It sets up the injector and providers without rendering a root component. Then pass its injector to `createCustomElement()`:

```ts title="main.ts"
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideHttpClient } from '@angular/common/http';
import { StarRating } from './app/star-rating';
import { Greeting } from './app/greeting';

createApplication({
  providers: [provideHttpClient()], // app-wide providers, like in app.config.ts
})
  .then((app) => {
    customElements.define('star-rating', createCustomElement(StarRating, { injector: app.injector }));
    customElements.define('hello-greeting', createCustomElement(Greeting, { injector: app.injector }));
  })
  .catch((err) => console.error(err));
```

- One `createApplication()` can register **many** elements. They share the same root injector, so a `@Service()` is a singleton across all of them.
- Like `bootstrapApplication()`, `createApplication()` is **zoneless** by default (since v21). Signals, `output()` and `setInput()` all schedule change detection automatically.

:::caution[Use a different tag name than the component selector]
Register the element under a name that is **not** the component's `selector` (here `star-rating` vs `app-star-rating`). If they match and the component is also used in an Angular template, Angular can create two component instances for one element. Custom element names must contain a hyphen.
:::

## Step 4: use it anywhere

```html title="any-page.html"
<link rel="stylesheet" href="/widgets/styles.css" />
<script type="module" src="/widgets/main.js"></script>

<star-rating value="3" max="5" label="Rate this article"></star-rating>
<hello-greeting name="Ada">Welcome back.</hello-greeting>

<script type="module">
  const rating = document.querySelector('star-rating');

  rating.addEventListener('rated', (event) => {
    console.log('User picked', event.detail, 'stars');
    rating.value = event.detail; // set an input through a property
  });
</script>
```

## Inputs, attributes and properties

Each component input becomes **both** an HTML attribute and a JavaScript property:

| Component | Attribute (strings) | Property (any type) |
| --- | --- | --- |
| `value = input(0)` | `value="3"` | `el.value = 3` |
| `maxStars = input(5)` | `max-stars="10"` (camelCase → dash-case) | `el.maxStars = 10` |
| `x = input('', { alias: 'myInputProp' })` | `my-input-prop="..."` | `el.myInputProp = '...'` |

Properties can carry objects and arrays, which attributes can't.

:::note[Changed in v21: signal inputs are plain properties]
Since Angular 21, signal inputs are read and written like any other property: `el.value` returns the current value. Before v21 you had to call `el.value()` to read a signal input from outside. Update such code when upgrading.
:::

## Outputs become DOM events

Each `output()` is dispatched as a `CustomEvent` whose **name is the output name** (or its alias) and whose **`detail`** is the emitted value:

```ts
// component
readonly rated = output<number>();             // event "rated"
readonly closed = output<void>({ alias: 'close' }); // event "close"
```

```ts
// outside Angular
el.addEventListener('rated', (event) => {
  const stars = (event as CustomEvent<number>).detail;
});
```

The events don't bubble. Listen on the element itself.

## Styles and content projection

- With `ViewEncapsulation.ShadowDom`, the component's styles live inside a shadow root, so host-page CSS can't break the widget and the widget's CSS can't leak out. CSS custom properties (`--brand-color`) still pass through, which makes them a good theming API.
- With the default `Emulated` encapsulation, component styles are added to the document `<head>`.
- Children written inside the tag are projected into the component's `<ng-content>` slots **once**, when the element is connected. Later changes to those children aren't re-projected. With Shadow DOM you can use a native `<slot>` instead, which stays live.

```ts title="greeting.ts"
@Component({
  selector: 'app-greeting',
  template: `<p>Hello, {{ name() }}! <ng-content /></p>`,
})
export class Greeting {
  readonly name = input('friend');
}
```

## TypeScript typings

`document.createElement('star-rating')` returns a plain `HTMLElement`, because TypeScript doesn't know about your element. Teach it once by augmenting `HTMLElementTagNameMap` with `NgElement` and `WithProperties` from `@angular/elements`:

```ts title="custom-elements.d.ts"
import { NgElement, WithProperties } from '@angular/elements';

declare global {
  interface HTMLElementTagNameMap {
    'star-rating': NgElement & WithProperties<{ value: number; max: number; readonly: boolean; label: string }>;
  }
}
```

```ts
const el = document.createElement('star-rating');
el.value = 3;       // ✅ typed as number
el.value = 'three'; // ❌ compile error
```

For one-off cases, cast instead: `document.querySelector('hello-greeting') as NgElement & WithProperties<{ name: string }>`.

## Using custom elements inside Angular templates

If an Angular app consumes custom elements (yours or someone else's), add `CUSTOM_ELEMENTS_SCHEMA` to the component that uses them so the compiler accepts the unknown tag:

```ts
@Component({
  selector: 'app-host',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<star-rating [value]="3" (rated)="onRated($event)"></star-rating>`,
})
export class Host {
  onRated(e: Event) {
    console.log((e as CustomEvent<number>).detail);
  }
}
```

## Building and embedding

A dedicated project for your widgets keeps the bundle small:

```bash
ng new rating-widgets --routing=false --ssr=false --style=css
cd rating-widgets
npm install @angular/elements
```

Replace `src/main.ts` with the `createApplication()` code above, then build:

```bash
ng build --output-hashing=none
```

`dist/rating-widgets/browser/` then contains `main.js` (plus lazy `chunk-*.js` files, if any) and `styles.css`. The application builder outputs **ES modules**, so:

- load it with `<script type="module" src=".../main.js">`,
- deploy all files from the folder together, because `main.js` imports its chunks by relative path,
- include `styles.css` only if you use global styles.

`--output-hashing=none` keeps stable file names for the embedding page. If you keep hashing on, use cache-busting through your deployment instead.

## Limitations and tips

- **Bundle size:** each Angular Elements build includes the Angular runtime. Several widgets from one build share it, but widgets from **separate** builds each ship their own copy. Prefer one build that registers all your elements.
- **Inputs only, no two-way binding:** `model()` inputs work as inputs, and their changes are emitted as `<name>Change` events.
- **Removing and re-adding:** the component is destroyed shortly after the element leaves the DOM. Re-adding it later creates a **new** component instance, so its state is lost.
- **SSR:** custom elements are created in the browser. Server-rendered host pages show the tag empty until the script loads.
- **Register once:** calling `customElements.define()` twice with the same name throws. Guard it with `if (!customElements.get('star-rating'))` when scripts may load twice.

## Key takeaways

- `createApplication()` + `createCustomElement()` + `customElements.define()` turns any component into a Web Component.
- Inputs map to dash-case attributes and camelCase properties. Outputs become `CustomEvent`s with the value in `detail`.
- Since v21, signal inputs are read directly as properties (`el.value`).
- Use Shadow DOM for style isolation and `HTMLElementTagNameMap` for typings.
- Build with the application builder and load `main.js` as an ES module.

## Next steps

- [Micro Frontends](/advanced/micro-frontends/): combine independently deployed apps
- [Dynamic Components](/advanced/dynamic-components/): render components from code inside Angular
- [Bundle Optimization](/advanced/bundle-optimization/): keep widget bundles small
