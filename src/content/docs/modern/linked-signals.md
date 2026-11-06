---
title: Linked Signals 🔗
description: linkedSignal() in Angular 22 — writable state that resets from a source, previous values, custom equality, and the custom set option added in v22.1.
sidebar:
  order: 5
---

`linkedSignal()` creates a **writable** signal whose value is **derived from other state**. It works like `computed()` — it recalculates when its source changes — but you can also `set()` it yourself. Use it for "a default the user can override, which resets when the context changes": the selected item in a list that can change, the current page that resets when the search changes, an editable copy of server data.

## What you'll learn

- Create a linked signal with the short and the `source`/`computation` forms
- Keep the user's choice when the source changes, using the previous value
- Use custom equality
- Redirect writes to a source of truth with the `set` option (new in v22.1)
- Choose between `signal`, `computed`, `linkedSignal` and `effect`

## The problem it solves

Imagine a shipping picker that selects the first option by default:

```ts
readonly options = input.required<ShippingMethod[]>();
readonly selected = signal(this.options()[0]); // ❌ only computed once!
```

If the parent passes new `options`, `selected` still holds an old option that may no longer exist. A `computed()` would follow the options, but then the user couldn't change it. `linkedSignal()` gives you both.

## Short form

```ts title="shipping-picker.ts"
import { Component, input, linkedSignal } from '@angular/core';

interface ShippingMethod {
  id: number;
  name: string;
}

@Component({
  selector: 'app-shipping-picker',
  template: `
    @for (option of options(); track option.id) {
      <label>
        <input
          type="radio"
          name="shipping"
          [checked]="option.id === selected().id"
          (change)="selected.set(option)"
        />
        {{ option.name }}
      </label>
    }
  `,
})
export class ShippingPicker {
  readonly options = input.required<ShippingMethod[]>();

  // Defaults to the first option, resets whenever options() changes,
  // and can be set by the user in between.
  protected readonly selected = linkedSignal(() => this.options()[0]);
}
```

Step by step:

```ts
const shippingOptions = signal(['Ground', 'Air', 'Sea']);
const selectedOption = linkedSignal(() => shippingOptions()[0]);

selectedOption();                 // 'Ground'  (derived)
selectedOption.set('Sea');        // user picks
selectedOption();                 // 'Sea'     (overridden)
shippingOptions.set(['Email', 'Will Call', 'Postal service']);
selectedOption();                 // 'Email'   (source changed → recomputed)
```

## Long form: `source` + `computation` with the previous value

Often you want to **keep the user's choice if it's still valid**. Split the signal into a `source` (what to watch) and a `computation` that receives the new source value and the `previous` state:

```ts title="shipping-picker.ts"
import { Component, input, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-shipping-picker',
  template: `{{ selected().name }}`,
})
export class ShippingPicker {
  readonly options = input.required<ShippingMethod[]>();

  protected readonly selected = linkedSignal<ShippingMethod[], ShippingMethod>({
    source: this.options,
    computation: (newOptions, previous) =>
      // keep the previous selection if it still exists, otherwise pick the first
      newOptions.find((o) => o.id === previous?.value.id) ?? newOptions[0],
  });
}
```

`previous` is `undefined` on the first run; afterwards it has:

| Property | Meaning |
|---|---|
| `previous.source` | The previous value of `source` |
| `previous.value` | The previous value of the linked signal (including a value you `set()`) |

:::tip
When you use the `previous` parameter, pass the two generic types explicitly: `linkedSignal<SourceType, ValueType>({...})`. TypeScript can't infer them reliably from the callback.
:::

## Pattern: reset the page when the query changes

```ts title="paged-list.ts"
import { Component, input, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-paged-list',
  template: `
    <p>Page {{ page() }}</p>
    <button type="button" (click)="page.update((p) => p + 1)">Next</button>
  `,
})
export class PagedList {
  readonly query = input('');

  // Goes back to page 1 every time the query changes
  protected readonly page = linkedSignal({
    source: this.query,
    computation: () => 1,
  });
}
```

Combine it with an [`httpResource`](/modern/http-resource-api/) that reads `query()` and `page()` and you have a paginated search with no effects at all.

## Pattern: an editable copy of server data

```ts title="profile-editor.ts"
import { Component, input, linkedSignal } from '@angular/core';

interface Profile {
  id: number;
  name: string;
}

@Component({
  selector: 'app-profile-editor',
  template: `
    <input [value]="draft().name" (input)="rename($event.target.value)" />
    <button type="button" (click)="draft.set(profile())">Discard changes</button>
  `,
})
export class ProfileEditor {
  readonly profile = input.required<Profile>();

  // A local draft that resets when a *different* profile is loaded
  protected readonly draft = linkedSignal(() => this.profile(), {
    equal: (a, b) => a.id === b.id,
  });

  protected rename(name: string) {
    this.draft.update((d) => ({ ...d, name }));
  }
}
```

The `equal` option controls when downstream consumers see a "new" value. Both the short and long forms accept it (`linkedSignal({ source, computation, equal })`).

:::note
For real forms, prefer [Signal Forms](/modern/signal-forms/): `form(this.draft)` gives you validation, dirty/touched state and submission on top of the same idea.
:::

## Custom `set`: write back to the source of truth (v22.1)

Since v22.1, `linkedSignal` accepts a `set` option. Instead of storing the written value locally, you can redirect `set()` and `update()` somewhere else — usually to the signal the value was derived from.

The function receives the new value and a `rawSet` function that performs the default behaviour (store it locally).

### Two-way unit conversion

```ts
import { linkedSignal, signal } from '@angular/core';

const tempC = signal(0);
const tempF = linkedSignal(() => (tempC() * 9) / 5 + 32, {
  set: (valF) => tempC.set(((valF - 32) * 5) / 9),
});

tempF();        // 32
tempF.set(212); // writes to tempC instead
tempC();        // 100
tempF();        // 212 (recomputed from tempC)
```

### Editing one property of a parent object

```ts
interface Order {
  id: number;
  shippingMethod: string;
}

const order = signal<Order>({ id: 42, shippingMethod: 'Ground' });

const shippingMethod = linkedSignal(() => order().shippingMethod, {
  set: (newMethod) => order.update((o) => ({ ...o, shippingMethod: newMethod })),
});

shippingMethod.set('Air');
order(); // { id: 42, shippingMethod: 'Air' }
```

### Syncing a form with a service

A store owns the data; the component's form model writes back to it:

```ts
@Service()
export class ProfileStore {
  private readonly _profile = signal({ name: '', email: '' });
  readonly profile = this._profile.asReadonly();

  save(value: { name: string; email: string }) {
    this._profile.set(value);
  }
}

@Component({ /* … */ })
export class ProfileForm {
  private readonly store = inject(ProfileStore);

  private readonly model = linkedSignal(() => this.store.profile(), {
    set: (value) => this.store.save(value),
  });

  protected readonly profileForm = form(this.model);
}
```

### Using `rawSet`

Call `rawSet(value)` to store the value directly (the normal behaviour). This is handy to validate or skip writes, or to avoid recomputing an expensive derivation when you already know the result:

```ts
const cents = linkedSignal(() => price() * 100, {
  set: (value, rawSet) => {
    if (value < 0) return; // ignore invalid writes
    rawSet(value);
  },
});
```

## Which one should I use?

| Situation | API |
|---|---|
| Plain state the user/app changes | `signal()` |
| Value fully calculated from other signals | `computed()` |
| Calculated default that the user can override, reset on source change | `linkedSignal()` |
| Calculated view of other state that writes back on `set()` | `linkedSignal({ set })` |
| Async data | `resource()` / `httpResource()` |
| Push state to a non-signal API | `effect()` |

## Common mistakes

| Mistake | Fix |
|---|---|
| `signal(this.input()[0])` — initialised once, goes stale | `linkedSignal(() => this.input()[0])` |
| An `effect()` that calls `set()` when a source changes | Replace with `linkedSignal()` |
| Using `previous` without generic types → type errors | `linkedSignal<S, D>({ … })` |
| Expecting user edits to survive a source change | They're reset by design — use the `previous` value to keep them |
| Mutating the object you got from the source | Always create new objects (`{ ...d, name }`) |

## Key takeaways

- `linkedSignal()` = `computed()` that you can also `set()`.
- It recomputes (and drops manual changes) whenever its source changes.
- The long form gives you the previous source and value so you can preserve selections.
- `set` (v22.1) redirects writes to a source of truth; `rawSet` keeps the default behaviour.
- `linkedSignal` is stable since v20.

## Next steps

- [Resource API](/modern/resource-api/) — async derived state
- [Signal Forms](/modern/signal-forms/) — forms built on writable signals
- [Effects](/modern/effects/)
