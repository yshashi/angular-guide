---
title: Signal Forms 📝
description: Build type-safe, reactive Angular 22 forms from signal models with FormField, schema validation, dynamic arrays, custom controls and asynchronous submission.
sidebar:
  order: 8
---

Signal Forms is Angular's signal-based form API, **stable in Angular 22** (`@angular/forms/signals`). It synchronizes a writable signal model with a strongly typed field tree, provides reactive field state and lets you define validation, disabled/hidden rules and submission handling in a schema.

:::note[Version note]
Signal Forms shipped as **experimental** in Angular 21 and became **stable in Angular 22**. Early v21 previews used a `Field` directive with `[field]`; the stable v22 API uses **`FormField`** with **`[formField]`**.
:::

## Create a form

The form model is an ordinary writable signal. `form()` derives a field tree from that model, and its optional schema callback is where you attach validation and state rules.

```ts title="contact-form.ts"
import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-contact-form',
  imports: [FormField],
  template: `
    <label>
      Name
      <input autocomplete="name" [formField]="contactForm.name" />
    </label>

    <label>
      Email
      <input type="email" autocomplete="email" [formField]="contactForm.email" />
    </label>

    <p>Current model: {{ contactModel().name }} ({{ contactModel().email }})</p>
  `,
})
export class ContactForm {
  protected readonly contactModel = signal({
    name: '',
    email: '',
  });

  protected readonly contactForm = form(this.contactModel, (path) => {
    required(path.name, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });
}
```

Import `FormField` in every component that uses `[formField]`. `[formField]` binds native `<input>`, `<textarea>`, `<select>`, checkboxes, radio buttons and custom form controls.

## FieldTree vs FieldState

Understanding the difference between a **field node** in the tree and its **state** prevents the most common compiler errors:

| Expression | What it is | When to use it |
| --- | --- | --- |
| `contactForm.email` | `FieldTree<string>` (a node in the tree) | Pass to `[formField]="contactForm.email"` or schema rules |
| `contactForm.email()` | `FieldState<string>` (obtained by calling the node) | Read reactive signals in templates and code |
| `contactForm.email().value()` | `string` (the field's current value) | Read or `.set()` the field value |
| `contactForm.email().valid()` / `invalid()` | `boolean` | Check validity |
| `contactForm.email().touched()` / `dirty()` | `boolean` | Check user interaction |
| `contactForm.email().errors()` | `ValidationError[]` | Loop over all active errors on the field |
| `contactForm.email().getError('required')` | Specific error or `undefined` | Check for one error kind |
| `contactForm().errorSummary()` | All errors across the form and its descendants | Build an error summary or focus the first invalid control |

Show errors after the user has interacted with a field:

```html
@if (contactForm.email().touched() && contactForm.email().invalid()) {
  @for (error of contactForm.email().errors(); track error.kind) {
    <p role="alert" class="error">{{ error.message }}</p>
  }
}
```

## Built-in, custom and cross-field validation

Built-in schema rules cover common checks. Use `validate()` for custom synchronous rules and cross-field comparisons (`valueOf()` reads another field reactively):

```ts title="signup-form.ts"
import { Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';

@Component({
  selector: 'app-signup-form',
  imports: [FormField],
  template: `
    <input [formField]="signupForm.username" placeholder="Username" />
    <input type="email" [formField]="signupForm.email" placeholder="Email" />
    <input type="password" [formField]="signupForm.password" placeholder="Password" />
    <input type="password" [formField]="signupForm.confirmPassword" placeholder="Confirm password" />
  `,
})
export class SignupForm {
  protected readonly model = signal({
    username: '',
    email: '',
    age: 18,
    postalCode: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly signupForm = form(this.model, (s) => {
    required(s.username, { message: 'Username is required.' });
    minLength(s.username, 3, { message: 'At least 3 characters.' });
    maxLength(s.username, 30);
    required(s.email);
    email(s.email, { message: 'Enter a valid email.' });
    min(s.age, 18);
    max(s.age, 120);
    pattern(s.postalCode, /^[0-9]{5}$/, { message: 'Use a 5-digit ZIP code.' });

    validate(s.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(s.password)
        ? null
        : { kind: 'passwordMismatch', message: 'Passwords do not match.' },
    );
  });
}
```

### Conditional state rules (`disabled`, `hidden`, `readonly`, `debounce`)

Control field availability declaratively in the schema rather than toggling attributes in the template:

```ts
import { debounce, disabled, form, hidden, readonly, required } from '@angular/forms/signals';

readonly orderForm = form(this.orderModel, (s) => {
  readonly(s.orderId);
  disabled(s.coupon, {
    when: ({ valueOf }) => (valueOf(s.total) < 50 ? 'Coupons require a $50 minimum order' : false),
  });
  hidden(s.companyVat, { when: ({ valueOf }) => !valueOf(s.isBusinessOrder) });
  required(s.companyVat, { when: ({ valueOf }) => valueOf(s.isBusinessOrder) });
  debounce(s.username, 300);
});
```

When you use `[formField]`, do **not** also bind `[disabled]`, `[readonly]`, `[min]`, `[max]` or `[value]` on the same element — configure those rules in the schema instead (otherwise Angular reports `NG8022`).

## Asynchronous and HTTP validation

Use `validateHttp()` to check a server endpoint (paired with `debounce()` or the `debounce` option) or `validateAsync()` with a `resource()`:

```ts
import { form, required, validateHttp } from '@angular/forms/signals';

readonly usernameForm = form(this.model, (s) => {
  required(s.username);
  validateHttp(s.username, {
    debounce: 300,
    request: ({ value }) =>
      value().length >= 3 ? `/api/users/check?u=${encodeURIComponent(value())}` : undefined,
    onSuccess: (res: { available: boolean }) =>
      res.available ? null : { kind: 'taken', message: 'That username is already taken.' },
    onError: () => ({ kind: 'network', message: 'Could not verify username availability.' }),
  });
});
```

While an async validator is running, `usernameForm.username().pending()` is `true`. You can re-trigger the check manually with `usernameForm.username().reloadValidation()`.

## Reusable schemas, arrays (`applyEach`) and `applyWhen`

Break large forms into reusable schemas with `schema()` and `apply()`, validate array items with `applyEach()`, and apply whole-group rules conditionally with `applyWhen()`:

```ts title="order-items.ts"
import { Component, signal } from '@angular/core';
import {
  apply,
  applyEach,
  applyWhen,
  form,
  FormField,
  min,
  minLength,
  required,
  schema,
  SchemaPathTree,
  validateTree,
} from '@angular/forms/signals';

interface Address {
  street: string;
  city: string;
}

interface LineItem {
  name: string;
  quantity: number;
}

const addressSchema = schema<Address>((a) => {
  required(a.street, { message: 'Street is required.' });
  required(a.city, { message: 'City is required.' });
});

function lineItemSchema(item: SchemaPathTree<LineItem>) {
  required(item.name, { message: 'Item name is required.' });
  min(item.quantity, 1, { message: 'Quantity must be at least 1.' });
}

@Component({
  selector: 'app-order-items',
  imports: [FormField],
  template: `
    @for (item of orderForm.items; track item) {
      <div>
        <input [formField]="item.name" placeholder="Item name" />
        <input type="number" [formField]="item.quantity" />
        <button type="button" (click)="removeItem($index)">Remove</button>
      </div>
    }
    <button type="button" (click)="addItem()">Add item</button>

    <input [formField]="orderForm.shipping.street" placeholder="Street" />
    <input [formField]="orderForm.shipping.city" placeholder="City" />
  `,
})
export class OrderItems {
  protected readonly model = signal({
    items: [{ name: 'Keyboard', quantity: 1 }],
    shipping: { street: '', city: '' },
    expressDelivery: false,
  });

  protected readonly orderForm = form(this.model, (s) => {
    applyEach(s.items, lineItemSchema);
    apply(s.shipping, addressSchema);
    applyWhen(
      s.shipping,
      ({ valueOf }) => valueOf(s.expressDelivery),
      (shipping) => minLength(shipping.street, 5),
    );
    validateTree(s, ({ value, fieldTree }) =>
      value().items.length === 0
        ? { kind: 'noItems', message: 'Add at least one item.', fieldTree: fieldTree.items }
        : null,
    );
  });

  protected addItem() {
    this.model.update((m) => ({ ...m, items: [...m.items, { name: '', quantity: 1 }] }));
  }

  protected removeItem(index: number) {
    this.model.update((m) => ({ ...m, items: m.items.filter((_, i) => i !== index) }));
  }
}
```

If your project already uses a Standard Schema library such as **Zod**, you can also validate with `validateStandardSchema(s, zodSchema)`.

## Submit and reset a form

Use `FormRoot` (`[formRoot]`) to wire a `<form>` element to Signal Forms submission, or call `submit(form, action)` directly. Its `action` runs only after synchronous and asynchronous validators pass:

```ts title="feedback-form.ts"
import { Component, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';

declare function saveFeedback(data: { message: string }): Promise<{ ok: boolean }>;

@Component({
  selector: 'app-feedback-form',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="feedbackForm">
      <label>
        Message
        <textarea [formField]="feedbackForm.message"></textarea>
      </label>

      @if (feedbackForm.message().touched() && feedbackForm.message().errors().length) {
        <p role="alert">{{ feedbackForm.message().errors()[0].message }}</p>
      }

      <button type="submit" [disabled]="feedbackForm().submitting()">
        @if (feedbackForm().submitting()) { Sending… } @else { Send feedback }
      </button>
    </form>
  `,
})
export class FeedbackForm {
  protected readonly feedbackModel = signal({ message: '' });

  protected readonly feedbackForm = form(
    this.feedbackModel,
    (path) => required(path.message, { message: 'Enter a message.' }),
    {
      submission: {
        action: async (field) => {
          const response = await saveFeedback(field().value());
          if (!response.ok) {
            return { kind: 'serverError', message: 'Your message could not be sent.' };
          }
          field().reset({ message: '' });
        },
        onInvalid: (field) => {
          field().errorSummary()[0]?.fieldTree().focusBoundControl();
        },
      },
    },
  );
}
```

## Custom controls (`FormValueControl` and `FormCheckboxControl`)

Any component can work with `[formField]` by implementing `FormValueControl<T>` (a `value = model<T>()` signal) or `FormCheckboxControl` (a `checked = model<boolean>()` signal) — no `ControlValueAccessor` boilerplate needed:

```ts title="star-rating.ts"
import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-star-rating',
  template: `
    @for (star of stars; track star) {
      <button
        type="button"
        [disabled]="disabled()"
        [attr.aria-pressed]="star <= value()"
        (click)="value.set(star)"
        (blur)="touch.emit()"
      >
        ★
      </button>
    }
  `,
})
export class StarRating implements FormValueControl<number> {
  readonly value = model(0);
  readonly touch = output<void>();
  readonly disabled = input(false);
  protected readonly stars = [1, 2, 3, 4, 5];
}
```

## Interop with Reactive Forms

Migrating gradually? `@angular/forms/signals/compat` provides `SignalFormControl`, which lets you embed a Signal Form field inside an existing `FormGroup` while binding it in the template with `[formField]="control.fieldTree"`.

## Choosing a form API

| API | Use it when |
| --- | --- |
| **Signal Forms** | Building a new form in Angular 22 and want a signal-first model, schema validation and trivial custom controls. |
| **Reactive Forms** | Working in an existing `FormGroup`/`FormControl` codebase or integrating with a library built around `ControlValueAccessor`. |
| **Template-driven Forms** | A small form where `[(ngModel)]` in the template is all you need. |

## Related guides

- [Forms Introduction](/beginner/forms/)
- [Reactive Forms](/intermediate/reactive-forms/)
- [Angular Signals](/modern/signals/)
