---
title: Forms Introduction 📝
description: Learn the three ways to build forms in Angular - Signal Forms, template-driven forms and reactive forms - and when to use each one.
sidebar:
  order: 9
---

Forms are how users log in, sign up, search, check out and edit data. Angular gives you three ways to build them. This page introduces all three with the **same small example**, so you can compare them side by side and pick the right one.

## What you'll learn

- The three form approaches: **Signal Forms**, **template-driven** and **reactive**
- How to build a validated form with Signal Forms (`form()`, `[formField]`, validation rules, `FormRoot`)
- How the same form looks with template-driven (`ngModel`) and reactive (`FormGroup`) forms
- When to choose which approach

## The three approaches at a glance

| | **Signal Forms** | **Template-driven** | **Reactive** |
|---|---|---|---|
| Import from | `@angular/forms/signals` | `@angular/forms` (`FormsModule`) | `@angular/forms` (`ReactiveFormsModule`) |
| Source of truth | A `signal()` holding your data model | Properties bound with `[(ngModel)]` | `FormGroup` / `FormControl` objects |
| Validation | Schema function in the class (`required(path)`) | HTML attributes (`required`, `minlength`) | `Validators.*` functions |
| State | Signals (`value()`, `errors()`, `touched()`) | `NgModel` / `NgForm` properties | Properties + Observables (`valueChanges`) |
| Status | **Stable since v22** — recommended for new forms | Stable | Stable |
| Best for | New apps, signal-based code | Very simple forms | Existing apps, RxJS-heavy forms |

:::tip[Which one should I learn first?]
Start with **Signal Forms**. They fit naturally with signals (which you use everywhere else in modern Angular), are fully type-safe and need the least code. Learn the other two so you can read and maintain existing projects.
:::

## Signal Forms (recommended)

Signal Forms build a form **on top of a signal that holds your data**. You describe validation once, in TypeScript, and bind inputs with the `[formField]` directive.

### Step 1: a model, a form and some inputs

```ts title="newsletter.ts"
import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';

interface Subscriber {
  name: string;
  email: string;
}

@Component({
  selector: 'app-newsletter',
  imports: [FormField, JsonPipe],
  template: `
    <label>Name <input [formField]="signupForm.name" /></label>
    <label>Email <input type="email" [formField]="signupForm.email" /></label>

    <p>Hello {{ signupForm.name().value() || 'stranger' }}!</p>
    <pre>{{ model() | json }}</pre>  <!-- debug: watch the model update as you type -->
  `,
})
export class Newsletter {
  // 1. The data model is a plain signal
  protected readonly model = signal<Subscriber>({ name: '', email: '' });

  // 2. form() turns it into a tree of fields
  protected readonly signupForm = form(this.model);
}
```

- `form(model)` returns a **field tree** that mirrors your data: `signupForm.name`, `signupForm.email`.
- `[formField]` binds an input to a field — **two-way**. Typing updates `model()`; calling `model.set(...)` updates the input.
- **Call** a field to read its state: `signupForm.email()` gives you signals such as `value()`, `valid()`, `errors()`, `touched()`, `dirty()`.

### Step 2: add validation

Pass a **schema function** as the second argument of `form()`. It receives a *path* to each field; attach rules to those paths:

```ts
import { email, form, required } from '@angular/forms/signals';

protected readonly signupForm = form(this.model, (path) => {
  required(path.name, { message: 'Please tell us your name' });
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'That doesn’t look like an email address' });
});
```

Built-in rules: `required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`, plus `validate()` for your own rules (and `validateAsync()` / `validateHttp()` for server checks).

Show errors only after the user has touched the field:

```html
<label>
  Email
  <input type="email" [formField]="signupForm.email" />
</label>
@if (signupForm.email().touched() && signupForm.email().invalid()) {
  @for (error of signupForm.email().errors(); track error.kind) {
    <p class="error">{{ error.message }}</p>
  }
}
```

Every field (and the whole form) exposes the same state signals:

| Signal | `true` when… |
|---|---|
| `valid()` / `invalid()` | All rules pass / at least one rule fails |
| `touched()` | The user focused and left the field |
| `dirty()` | The user changed the value |
| `pending()` | An async validator is running |
| `disabled()` / `readonly()` | The field is disabled / read-only |
| `errors()` | Returns the list of errors (`{ kind, message }`) |

### Step 3: submit with `FormRoot`

Add the `FormRoot` directive to your `<form>` and a `submission` option to `form()`. On submit, Angular marks all fields as touched (so errors appear), stops if the form is invalid, and otherwise runs your `action`:

```ts title="signup.ts"
import { Component, signal } from '@angular/core';
import { email, form, FormField, FormRoot, minLength, required, validate } from '@angular/forms/signals';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  plan: 'free' | 'pro';
  acceptTerms: boolean;
}

@Component({
  selector: 'app-signup',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="signupForm">
      <label>Name <input [formField]="signupForm.name" /></label>
      @if (signupForm.name().touched() && signupForm.name().invalid()) {
        <p class="error">{{ signupForm.name().errors()[0].message }}</p>
      }

      <label>Email <input type="email" [formField]="signupForm.email" /></label>
      @if (signupForm.email().touched() && signupForm.email().invalid()) {
        <p class="error">{{ signupForm.email().errors()[0].message }}</p>
      }

      <label>Password <input type="password" [formField]="signupForm.password" /></label>
      @if (signupForm.password().touched() && signupForm.password().invalid()) {
        <p class="error">{{ signupForm.password().errors()[0].message }}</p>
      }

      <label>Confirm password <input type="password" [formField]="signupForm.confirmPassword" /></label>
      @if (signupForm.confirmPassword().touched() && signupForm.confirmPassword().invalid()) {
        <p class="error">{{ signupForm.confirmPassword().errors()[0].message }}</p>
      }

      <label>
        Plan
        <select [formField]="signupForm.plan">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </label>

      <label>
        <input type="checkbox" [formField]="signupForm.acceptTerms" />
        I accept the terms
      </label>

      <button type="submit" [disabled]="signupForm().submitting()">
        {{ signupForm().submitting() ? 'Creating account…' : 'Sign up' }}
      </button>
    </form>

    @if (done()) {
      <p>🎉 Welcome, {{ model().name }}!</p>
    }
  `,
  styles: `label { display: block; margin-top: .75rem; } .error { color: crimson; margin: .25rem 0; }`,
})
export class Signup {
  protected readonly done = signal(false);

  protected readonly model = signal<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'free',
    acceptTerms: false,
  });

  protected readonly signupForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Name is required' });
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email' });
      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Use at least 8 characters' });

      // Cross-field rule: compare with another field using valueOf()
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() === valueOf(path.password) ? null : { kind: 'mismatch', message: 'Passwords do not match' },
      );

      // Custom rule on a checkbox
      validate(path.acceptTerms, ({ value }) =>
        value() ? null : { kind: 'terms', message: 'You must accept the terms' },
      );
    },
    {
      submission: {
        action: async (field) => {
          await fakeApiCall(field().value());   // send the data to your server
          this.done.set(true);
          // return an error object here (e.g. { kind: 'server', message: '…' }) if the server rejects it
        },
      },
    },
  );
}

function fakeApiCall(data: SignupData) {
  return new Promise((resolve) => setTimeout(() => resolve(data), 1000));
}
```

What happens here:

- `[formRoot]` prevents the page reload, adds `novalidate` (Signal Forms validate, not the browser) and calls `submit()` for you.
- `submitting()` is `true` while the `action` runs — perfect for disabling the button.
- `validate()` returns `null` when valid, or an error `{ kind, message }`.
- `<input type="number">`, checkboxes, radios, `<select>` and `<textarea>` all work with `[formField]`; values are converted to the right type (numbers, booleans).

:::note[Signal Forms in Angular 21]
Signal Forms first shipped as **experimental** in v21 and became **stable in v22**. Early v21 releases named the directive `Field` with a `[field]` binding — in v22 the directive is **`FormField`** with the **`[formField]`** binding.
:::

There's much more: async validation, disabling fields, dynamic arrays, custom controls and testing. Continue with [Signal Forms in depth](/modern/signal-forms/).

## Template-driven forms

Template-driven forms put most of the logic **in the template**, using `ngModel` and standard HTML validation attributes. They are quick for tiny forms.

```ts title="newsletter-td.ts"
import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-newsletter-td',
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="subscribe(f)">
      <label>
        Name
        <input name="name" [(ngModel)]="name" required minlength="2" #nameCtrl="ngModel" />
      </label>
      @if (nameCtrl.invalid && nameCtrl.touched) {
        @if (nameCtrl.errors?.['required']) { <p class="error">Name is required</p> }
        @if (nameCtrl.errors?.['minlength']) { <p class="error">At least 2 characters</p> }
      }

      <label>
        Email
        <input name="email" type="email" [(ngModel)]="email" required email #emailCtrl="ngModel" />
      </label>
      @if (emailCtrl.invalid && emailCtrl.touched) {
        <p class="error">Enter a valid email</p>
      }

      <button type="submit" [disabled]="f.invalid">Subscribe</button>
    </form>
  `,
})
export class NewsletterTd {
  protected readonly name = signal('');
  protected readonly email = signal('');

  protected subscribe(form: NgForm) {
    console.log('Subscribing', { name: this.name(), email: this.email() });
    form.resetForm();
  }
}
```

Key points:

- Import `FormsModule`. Each `ngModel` inside a `<form>` **needs a `name` attribute**.
- `#nameCtrl="ngModel"` gives you the control's state: `valid`, `invalid`, `touched`, `dirty`, `errors`.
- `#f="ngForm"` gives you the whole form; `(ngSubmit)` fires on submit (without reloading the page).
- Validation uses attributes: `required`, `minlength`, `maxlength`, `email`, `pattern`, `min`, `max`.
- `[(ngModel)]` can bind directly to a writable signal.

## Reactive forms

Reactive forms define the form **in the class** as a tree of `FormControl`s. They're very explicit, fully typed, and have been the standard choice for complex forms for years — you'll see them in most existing apps.

```ts title="newsletter-reactive.ts"
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-newsletter-reactive',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="subscribe()">
      <label>Name <input formControlName="name" /></label>
      @if (form.controls.name.invalid && form.controls.name.touched) {
        <p class="error">Name is required (min. 2 characters)</p>
      }

      <label>Email <input type="email" formControlName="email" /></label>
      @if (form.controls.email.invalid && form.controls.email.touched) {
        <p class="error">Enter a valid email</p>
      }

      <button type="submit">Subscribe</button>
    </form>
  `,
})
export class NewsletterReactive {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  protected subscribe() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();   // reveal all errors
      return;
    }
    const value = this.form.getRawValue(); // typed: { name: string; email: string }
    console.log('Subscribing', value);
    this.form.reset();
  }
}
```

Key points:

- Import `ReactiveFormsModule`; bind the group with `[formGroup]` and each input with `formControlName`.
- `NonNullableFormBuilder` creates typed controls that reset to their initial values (not `null`).
- Use `Validators.required`, `Validators.email`, `Validators.minLength(n)`, … or your own validator functions.
- Changes are available as Observables (`form.valueChanges`) and as signals via `toSignal()`.

Dive deeper in [Reactive Forms](/intermediate/reactive-forms/). Already have reactive forms and want to adopt Signal Forms gradually? `SignalFormControl` (from `@angular/forms/signals/compat`) lets the two work together — see [Signal Forms](/modern/signal-forms/).

## When to use which?

| Situation | Choose |
|---|---|
| New app or new form | **Signal Forms** |
| A one-field search box or a two-field newsletter form | Template-driven (or Signal Forms) |
| Existing codebase full of `FormGroup`s | Reactive forms (migrate gradually) |
| Complex dynamic forms in a signal-based app | Signal Forms |
| Heavy RxJS pipelines on `valueChanges` | Reactive forms |

Don't mix approaches **inside one form**; pick one per form.

## Common mistakes

| Mistake | Fix |
|---|---|
| `Can't bind to 'formField'` | Import `FormField` from `@angular/forms/signals`. |
| Using `[field]` or `[control]` for Signal Forms | The v22 binding is `[formField]`. |
| Reading `signupForm.email.value()` | Call the field first: `signupForm.email().value()`. |
| `ngModel` in a `<form>` without `name` | Add a `name` attribute to every `ngModel` control. |
| `Can't bind to 'formGroup'` | Import `ReactiveFormsModule`. |
| Errors visible before the user typed anything | Show errors only when `touched()` (or after submit). |
| Relying only on client-side validation | Always validate again on the server. |

## Best practices

- Use **Signal Forms** for new forms; keep the data model a plain interface in a `signal()`.
- Give every input a visible `<label>`, use the right `type` (`email`, `number`, `password`) and `autocomplete` attributes.
- Show clear, specific error messages next to the field.
- Disable the submit button while submitting to prevent double submissions.

## Key takeaways

- Angular has three form systems: **Signal Forms** (stable since v22, recommended), **template-driven** and **reactive**.
- Signal Forms = `signal(model)` + `form(model, schema)` + `[formField]`; state is read via signals such as `valid()` and `errors()`.
- `FormRoot` + `submission.action` handles submit, touched state and the `submitting()` flag.
- Template-driven forms use `[(ngModel)]` + HTML validators; reactive forms use `FormGroup` + `Validators`.

## Next steps

1. [Signal Forms in depth](/modern/signal-forms/) — async validation, arrays, custom controls
2. [Reactive Forms](/intermediate/reactive-forms/) — typed forms, `FormArray`, custom validators
3. [HTTP Client](/beginner/http/) — send your form data to a server
