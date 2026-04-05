---
title: Signal Forms 📝
description: Master Angular's Signal Forms - the reactive, type-safe form API built on signals in Angular 21
sidebar:
  order: 12
---

Signal Forms are the recommended approach for handling forms in Angular 21+. Built entirely on signals, they provide a reactive, type-safe, and model-driven way to manage form state — replacing `FormBuilder`, `FormGroup`, and `FormControl` entirely.

## What Are Signal Forms?

Signal Forms create form state directly from a signal model. The form structure mirrors your data — no builder, no form groups, no form controls.

- 🔄 **Signal-Based** — form state is reactive signals with automatic change detection
- 🎯 **Type-Safe** — full TypeScript inference from your model
- 📦 **Model-Driven** — form structure derived from your data signal
- ⚡ **No Builder** — no `FormBuilder`, `FormGroup`, or `FormControl`
- 🧩 **Schema Validation** — declarative, composable validation rules

## Imports

Everything comes from `@angular/forms/signals`:

```typescript
import {
  // Core
  form, FormField, submit,

  // Validators
  required, email, min, max,
  minLength, maxLength, pattern,

  // Field state rules
  disabled, hidden, readonly, debounce,

  // Schema helpers
  schema, applyWhen, applyEach,

  // Custom validation
  validate, validateAsync,
  validateHttp, validateStandardSchema,

  // Metadata
  metadata,
} from '@angular/forms/signals';
```

## Creating a Form

Use the `form()` function with a signal model. The form structure mirrors your data shape automatically.

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, FormField, required, email, min } from '@angular/forms/signals';

@Component({
  selector: 'app-user',
  imports: [FormField],
  template: `
    <input [formField]="userForm.name" />
    <input [formField]="userForm.email" type="email" />
    <input [formField]="userForm.age" type="number" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  // Define your model with initial values — NEVER use null
  userModel = signal({
    name: '',
    email: '',
    age: 0,
    address: { street: '', city: '' },
    hobbies: [] as string[],
  });

  // Create the form — structure is inferred from the model
  userForm = form(this.userModel, (s) => {
    required(s.name);
    required(s.email);
    email(s.email);
    min(s.age, 18);
  });
}
```

:::danger[Never Use Null]
Signal Forms do **not** support `null` or `undefined` as initial values. Always use empty defaults:
- Strings → `''`
- Numbers → `0`
- Booleans → `false`
- Arrays → `[] as Type[]`
:::

## Template Binding with `[formField]`

Import `FormField` and bind using the `[formField]` directive. It automatically handles `disabled`, `readonly`, `hidden`, and `name` attributes.

```html
<!-- Text input -->
<input [formField]="userForm.name" />

<!-- Checkbox (boolean fields only) -->
<input type="checkbox" [formField]="userForm.isAdmin" />

<!-- Select -->
<select [formField]="userForm.country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>

<!-- Radio buttons -->
<label><input type="radio" value="economy" [formField]="userForm.tier" /> Economy</label>
<label><input type="radio" value="business" [formField]="userForm.tier" /> Business</label>

<!-- Multi-select for array fields -->
<select multiple [formField]="userForm.tags">
  <option value="angular">Angular</option>
  <option value="typescript">TypeScript</option>
</select>
```

:::caution[Forbidden HTML Attributes]
When using `[formField]`, do **not** set these attributes on the element:
- `min`, `max`, `[attr.min]`, `[attr.max]` — use validator rules in the schema instead
- `value`, `[value]`, `[attr.value]` — already handled by `[formField]`
- `[disabled]`, `[readonly]` — use `disabled()` / `readonly()` rules in the schema
:::

## FormField vs FieldState

This is the most important concept in Signal Forms. A **FormField** is the structural tree you navigate. You **must call it as a function** to get the **FieldState** with reactive signals.

```typescript
const f = form(signal({ cat: { name: 'Whiskers', age: 5 } }));

// FormField (structural) — navigate to fields
f.cat.name;              // FormField — NO state signals here

// FieldState (reactive) — CALL the field to get state
f.cat.name();            // FieldState — has .value(), .valid(), etc.
f.cat.name().touched();  // ✅ Signal<boolean>
f.cat.name().value();    // ✅ Signal<string>

// ❌ Common mistakes
f.cat.name.touched();    // ❌ touched() doesn't exist on FormField
f.cat().name.touched();  // ❌ f.cat() is FieldState, not navigable
```

In templates:

```html
<!-- ✅ Correct — call the field first, then access state -->
@if (userForm.email().touched() && userForm.email().errors().length) {
  <span class="error">{{ userForm.email().errors()[0].message }}</span>
}

<!-- ❌ Wrong — missing function call on the field -->
@if (userForm.email.touched()) { ... }
```

## Validation

Add validators in the schema function passed to `form()`:

```typescript
import {
  form, required, email, min, max,
  minLength, maxLength, pattern,
} from '@angular/forms/signals';

userForm = form(this.userModel, (s) => {
  required(s.name, { message: 'Name is required' });
  required(s.email, { message: 'Email is required' });
  email(s.email, { message: 'Invalid email address' });

  min(s.age, 18);
  max(s.age, 100);

  minLength(s.password, 8);
  maxLength(s.bio, 500);

  pattern(s.zipCode, /^\d{5}$/);
});
```

### Conditional Required

Only `required()` supports the `when` option:

```typescript
userForm = form(this.userModel, (s) => {
  required(s.driversLicense, {
    when({ valueOf }) {
      return valueOf(s.age) >= 16;
    },
  });
});
```

:::note
The `when` option is **only** available on `required()`. For conditional validation on other rules, use `applyWhen()` instead.
:::

## Custom Validation

Use `validate()` for synchronous custom validators:

```typescript
import { validate } from '@angular/forms/signals';

userForm = form(this.userModel, (s) => {
  validate(s.username, ({ value }) => {
    const forbidden = ['admin', 'root', 'system'];
    if (forbidden.includes(value().toLowerCase())) {
      return { kind: 'forbidden', message: `"${value()}" is reserved` };
    }
    return undefined; // No error — return undefined, NOT null
  });
});
```

### Validator Context

The callback receives a context object with utilities for cross-field validation:

```typescript
validate(s.confirmPassword, ({ value, valueOf, state, stateOf, pathKeys }) => {
  // value     — Signal<T>: current field value
  // valueOf   — (path) => T: read OTHER fields' values
  // state     — FieldState<T>: this field's state (valid, dirty, touched)
  // stateOf   — (path) => FieldState: other fields' state
  // pathKeys  — Signal<string[]>: path from root to this field

  if (value() !== valueOf(s.password)) {
    return { kind: 'mismatch', message: 'Passwords do not match' };
  }
  return undefined;
});
```

:::danger[Paths Are NOT Signals]
Inside the `form()` schema callback, `s` and its children (e.g. `s.email`) are schema paths — **not** signals. You cannot call them directly.

```typescript
// ❌ Wrong — s.email is a path, not callable
validate(s.name, () => s.email() === '...');

// ✅ Correct — use valueOf() from the context
validate(s.name, ({ valueOf }) => {
  if (valueOf(s.email) === '') { ... }
});
```
:::

## Async Validation

Use `validateAsync()` for server-side validation. All four options — `params`, `factory`, `onSuccess`, `onError` — are required:

```typescript
import { resource } from '@angular/core';
import { validateAsync } from '@angular/forms/signals';

userForm = form(this.userModel, (s) => {
  validateAsync(s.username, {
    // params MUST be a function
    params: ({ value }) => value(),

    // Factory creates a resource for the async check
    factory: (username) => resource({
      params: username,
      loader: async ({ params: val }) => {
        const res = await fetch(`/api/check-username?name=${val}`);
        return res.json();
      },
    }),

    // Map success result to validation error (or undefined)
    onSuccess: (result) =>
      result.taken
        ? { kind: 'taken', message: 'Username already taken' }
        : undefined,

    // Handle request errors — THIS IS REQUIRED
    onError: () => ({ kind: 'error', message: 'Validation check failed' }),
  });
});
```

:::caution[validateAsync Rules]
- `params` must be a **function**: `({ value }) => value()`, not `s.field`
- `onError` is **required** — omitting it is a compile error
- Uses `resource()` with `params` (not `request`) for the input signal
:::

## Accessing Form State

```typescript
// Form-level state — call the form root
const isValid = userForm().valid();       // Signal<boolean>
const isInvalid = userForm().invalid();   // Signal<boolean>
const isDirty = userForm().dirty();       // Signal<boolean>
const isTouched = userForm().touched();   // Signal<boolean>
const isPending = userForm().pending();   // Signal<boolean>
const errors = userForm().errors();       // Signal<ValidationError[]>
const formValue = userForm().value();     // Full model value

// Field-level state — call the field
const nameValid = userForm.name().valid();
const nameDirty = userForm.name().dirty();
const nameTouched = userForm.name().touched();
const nameErrors = userForm.name().errors();
const nameValue = userForm.name().value();

// Reset the form
userForm().reset();

// Array length — structural, NO parentheses
const count = userForm.items.length;      // ✅ No ()
```

## Field State Rules

Control field availability using schema rules:

```typescript
import { disabled, hidden, readonly, debounce } from '@angular/forms/signals';

userForm = form(this.userModel, (s) => {
  // Conditionally disabled
  disabled(s.adminLevel, ({ valueOf }) => valueOf(s.role) !== 'admin');

  // Conditionally hidden (marks field, doesn't remove from model)
  hidden(s.shippingAddress, ({ valueOf }) => valueOf(s.sameAsBilling));

  // Always readonly
  readonly(s.createdAt);

  // Debounce model sync by 300ms
  debounce(s.searchQuery, 300);
});
```

Check hidden state in the template before rendering:

```html
@if (!userForm.shippingAddress().hidden()) {
  <fieldset>
    <legend>Shipping Address</legend>
    <input [formField]="userForm.shippingAddress.street" />
    <input [formField]="userForm.shippingAddress.city" />
  </fieldset>
}
```

## Submitting

Use the `submit()` function. It marks all fields as touched, then runs your callback **only if the form is valid**.

```typescript
import { submit } from '@angular/forms/signals';

onSubmit() {
  // Callback MUST be async
  submit(this.userForm, async () => {
    await this.userService.save(this.userModel());
    this.router.navigate(['/success']);
  });
}
```

Disable the submit button reactively:

```html
<button [disabled]="userForm().invalid() || userForm().pending()">Submit</button>
```

:::caution[Submit Rules]
- The callback **must** be `async`
- It only runs when the form is **valid**
- All fields are automatically marked as **touched** before validation
:::

## Reusable Schemas

Extract and compose validation schemas for reusability across forms:

```typescript
import { schema } from '@angular/forms/signals';

const addressSchema = schema<Address>((s) => {
  required(s.street);
  required(s.city);
  required(s.zipCode);
  pattern(s.zipCode, /^\d{5}$/);
});

const userSchema = schema<User>((s) => {
  required(s.name);
  email(s.email);
});

// Compose schemas into a larger form
orderForm = form(this.orderModel, (s) => {
  required(s.customerName);
  apply(s.billingAddress, addressSchema);
  apply(s.shippingAddress, addressSchema);
});
```

## Arrays with `applyEach`

Use `applyEach` to validate each item in an array. The callback takes **one argument** — the item path:

```typescript
import { applyEach } from '@angular/forms/signals';

orderForm = form(this.orderModel, (s) => {
  applyEach(s.items, (item) => {
    required(item.name);
    min(item.quantity, 1);
    min(item.price, 0);
  });
});
```

Iterate in the template with `@for`:

```html
@for (item of orderForm.items; track $index) {
  <div class="line-item">
    <input [formField]="item.name" placeholder="Item name" />
    <input [formField]="item.quantity" type="number" />
    <button type="button" (click)="removeItem($index)">Remove</button>
  </div>
}
<button type="button" (click)="addItem()">Add Item</button>
```

Add and remove items by updating the **model signal**:

```typescript
addItem() {
  this.orderModel.update((m) => ({
    ...m,
    items: [...m.items, { name: '', quantity: 1, price: 0 }],
  }));
}

removeItem(index: number) {
  this.orderModel.update((m) => ({
    ...m,
    items: m.items.filter((_, i) => i !== index),
  }));
}
```

:::tip[Nested @for Loops]
Angular has no `$parent`. In nested `@for` loops, store the outer index with `let`:

```html
@for (group of form.groups; track $index; let groupIdx = $index) {
  @for (item of group.items; track $index) {
    <button (click)="remove(groupIdx, $index)">Remove</button>
  }
}
```
:::

## Conditional Validation with `applyWhen`

Apply rules only when a condition is met:

```typescript
import { applyWhen } from '@angular/forms/signals';

form(this.model, (s) => {
  applyWhen(
    s.spouse,                                                    // path
    ({ valueOf }) => valueOf(s.maritalStatus) === 'married',     // condition
    (spousePath) => {                                            // schema
      required(spousePath.name);
      required(spousePath.email);
      email(spousePath.email);
    },
  );
});
```

## Complete Example: Booking Form

A full example demonstrating nested objects, arrays, conditional fields, and validation.

### Component

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form, FormField, submit,
  required, email, min,
  hidden, applyEach, validate,
} from '@angular/forms/signals';

@Component({
  selector: 'app-booking',
  imports: [FormField],
  templateUrl: './booking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent {
  model = signal({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      age: 0,
    },
    tripDetails: {
      destination: 'Mars',
      launchDate: '',
    },
    package: {
      tier: 'economy',
      extras: [] as string[],
    },
    companions: [] as Array<{ name: string; relation: string }>,
  });

  bookingForm = form(this.model, (s) => {
    required(s.personalInfo.firstName, { message: 'First name required' });
    required(s.personalInfo.lastName, { message: 'Last name required' });
    required(s.personalInfo.email, { message: 'Email required' });
    email(s.personalInfo.email, { message: 'Invalid email' });
    required(s.personalInfo.age, { message: 'Age required' });
    min(s.personalInfo.age, 18, { message: 'Must be 18+' });

    required(s.tripDetails.destination);
    required(s.tripDetails.launchDate);
    validate(s.tripDetails.launchDate, ({ value }) => {
      const date = new Date(value());
      if (isNaN(date.getTime())) return undefined;
      if (date < new Date()) {
        return { kind: 'pastDate', message: 'Must be a future date' };
      }
      return undefined;
    });

    hidden(s.package.extras, ({ valueOf }) =>
      valueOf(s.package.tier) === 'economy'
    );

    applyEach(s.companions, (companion) => {
      required(companion.name, { message: 'Name required' });
      required(companion.relation, { message: 'Relation required' });
    });
  });

  addCompanion() {
    this.model.update((m) => ({
      ...m,
      companions: [...m.companions, { name: '', relation: '' }],
    }));
  }

  removeCompanion(index: number) {
    this.model.update((m) => ({
      ...m,
      companions: m.companions.filter((_, i) => i !== index),
    }));
  }

  onSubmit() {
    submit(this.bookingForm, async () => {
      console.log('Booking confirmed:', this.model());
    });
  }
}
```

### Template

```html
<form (submit)="onSubmit(); $event.preventDefault()">
  <h2>Personal Info</h2>
  <label>
    First Name
    <input [formField]="bookingForm.personalInfo.firstName" />
    @if (bookingForm.personalInfo.firstName().touched() &&
         bookingForm.personalInfo.firstName().errors().length) {
      <span class="error">
        {{ bookingForm.personalInfo.firstName().errors()[0].message }}
      </span>
    }
  </label>

  <label>
    Last Name
    <input [formField]="bookingForm.personalInfo.lastName" />
    @if (bookingForm.personalInfo.lastName().touched() &&
         bookingForm.personalInfo.lastName().errors().length) {
      <span class="error">
        {{ bookingForm.personalInfo.lastName().errors()[0].message }}
      </span>
    }
  </label>

  <label>
    Email
    <input type="email" [formField]="bookingForm.personalInfo.email" />
    @if (bookingForm.personalInfo.email().touched() &&
         bookingForm.personalInfo.email().errors().length) {
      <span class="error">
        {{ bookingForm.personalInfo.email().errors()[0].message }}
      </span>
    }
  </label>

  <label>
    Age
    <input type="number" [formField]="bookingForm.personalInfo.age" />
    @if (bookingForm.personalInfo.age().touched() &&
         bookingForm.personalInfo.age().errors().length) {
      <span class="error">
        {{ bookingForm.personalInfo.age().errors()[0].message }}
      </span>
    }
  </label>

  <h2>Trip Details</h2>
  <label>
    Destination
    <select [formField]="bookingForm.tripDetails.destination">
      <option value="Mars">Mars</option>
      <option value="Moon">Moon</option>
      <option value="Titan">Titan</option>
    </select>
  </label>

  <label>
    Launch Date
    <input type="date" [formField]="bookingForm.tripDetails.launchDate" />
    @if (bookingForm.tripDetails.launchDate().touched() &&
         bookingForm.tripDetails.launchDate().errors().length) {
      <span class="error">
        {{ bookingForm.tripDetails.launchDate().errors()[0].message }}
      </span>
    }
  </label>

  <h2>Package</h2>
  <label><input type="radio" value="economy" [formField]="bookingForm.package.tier" /> Economy</label>
  <label><input type="radio" value="business" [formField]="bookingForm.package.tier" /> Business</label>
  <label><input type="radio" value="first" [formField]="bookingForm.package.tier" /> First Class</label>

  @if (!bookingForm.package.extras().hidden()) {
    <h3>Extras</h3>
    <select multiple [formField]="bookingForm.package.extras">
      <option value="wifi">WiFi</option>
      <option value="gym">Gym</option>
    </select>
  }

  <h2>Companions</h2>
  <button type="button" (click)="addCompanion()">Add Companion</button>

  @for (companion of bookingForm.companions; track $index) {
    <div>
      <input [formField]="companion.name" placeholder="Name" />
      @if (companion.name().touched() && companion.name().errors().length) {
        <span class="error">{{ companion.name().errors()[0].message }}</span>
      }

      <input [formField]="companion.relation" placeholder="Relation" />
      @if (companion.relation().touched() && companion.relation().errors().length) {
        <span class="error">{{ companion.relation().errors()[0].message }}</span>
      }

      <button type="button" (click)="removeCompanion($index)">Remove</button>
    </div>
  }

  <button [disabled]="bookingForm().invalid()">Submit Booking</button>
</form>
```

## Migration: Reactive Forms → Signal Forms

```typescript
// ❌ Legacy Reactive Forms
export class OldComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}

// ✅ Modern Signal Forms
export class NewComponent {
  model = signal({ name: '', email: '' });

  userForm = form(this.model, (s) => {
    required(s.name);
    required(s.email);
    email(s.email);
  });

  onSubmit() {
    submit(this.userForm, async () => {
      console.log(this.model());
    });
  }
}
```

## Common Pitfalls

| Mistake | ❌ Wrong | ✅ Correct |
|---------|----------|-----------|
| Access field state | `form.field.valid()` | `form.field().valid()` |
| Access value | `form.field.value()` | `form.field().value()` |
| Set value | `form.field.set('x')` | `this.model.update(...)` |
| Root form state | `form.invalid()` | `form().invalid()` |
| Array length | `form.items().length` | `form.items.length` |
| Null in model | `signal({ name: null })` | `signal({ name: '' })` |
| Submit callback | `submit(form, () => {})` | `submit(form, async () => {})` |
| Async params | `params: s.field` | `params: ({ value }) => value()` |
| Async onError | _(omitting it)_ | `onError` is **required** |
| `when` option | `pattern(s.x, /.../, { when })` | `when` only works with `required()` |
| Call paths | `s.foo()` inside schema | Use `valueOf(s.foo)` from context |
| `applyEach` args | `(item, index) => {}` | `(item) => {}` — one argument only |
| Nested `@for` | `$parent.$index` | `let outerIdx = $index` |
| HTML attributes | `<input min="1" [formField]>` | Use `min()` rule in schema |
| Checkbox arrays | `<input type="checkbox" [formField]="form.tags">` | Checkboxes bind to `boolean` only |

## Troubleshooting Build Errors

### `Property 'value' does not exist on type 'FieldTree'`

You're accessing state without calling the field first:

```typescript
// ❌ form.name.value()
// ✅ form.name().value()
```

### `Property 'set' does not exist on type 'FieldTree'`

Signal Forms are model-driven — update the model signal, not the form:

```typescript
// ❌ this.form.name.set('John')
// ✅ this.model.update(m => ({ ...m, name: 'John' }))
```

### `NG8022: Setting 'readonly/min/max/value' is not allowed`

Remove HTML attributes that conflict with `[formField]`:

```html
<!-- ❌ --> <input min="18" [formField]="form.age" />
<!-- ✅ --> <input [formField]="form.age" />
<!-- Add min(s.age, 18) in the schema instead -->
```

### `Type 'string[]' is not assignable to type 'boolean'`

Checkboxes only bind to `boolean` fields. Use `<select multiple>` for arrays:

```html
<!-- ❌ --> <input type="checkbox" [formField]="form.tags" />
<!-- ✅ --> <select multiple [formField]="form.tags">...</select>
```

### `'when' does not exist in type` for pattern/email/min

`when` only works with `required()`. Use `applyWhen()` for conditional non-required rules:

```typescript
// ❌ pattern(s.ssn, /^\d{3}-\d{2}-\d{4}$/, { when: condition })
// ✅ applyWhen(s.ssn, condition, (ssnPath) => {
//      pattern(ssnPath, /^\d{3}-\d{2}-\d{4}$/);
//    });
```

### `Module has no exported member 'FormState'`

`FormState` does not exist. Access state through calling the field:

```typescript
// ❌ import { FormState } from '@angular/forms/signals';
// ✅ Use form.field().valid(), form.field().touched(), etc.
```

## Next Steps

1. **[Angular Signals](/modern/signals/)** — The foundation of Signal Forms
2. **[Computed Signals](/modern/computed-signals/)** — Derive reactive state
3. **[Resource API](/modern/resource-api/)** — Data fetching with signals

---

Signal Forms are the recommended approach for all new form development in Angular 21. They replace `FormBuilder`, `FormGroup`, and `FormControl` with a cleaner, signal-native API. 📝
