---
title: Reactive Forms 📋
description: Build strongly typed Angular reactive forms in v22 — FormControl, FormGroup, FormArray, validators, FormArrayDirective, signals interop and SignalFormControl.
sidebar:
  order: 4
---

**Reactive forms** describe a form in TypeScript as a tree of `FormControl`, `FormGroup` and `FormArray` objects, then connect that tree to the template. They are fully typed, synchronous, easy to test, and power a huge amount of existing Angular code. In Angular 22 they sit alongside the newer, stable **Signal Forms** — this page teaches reactive forms properly and shows how the two work together.

## What you'll learn

- When to choose Reactive Forms vs Signal Forms vs template-driven forms
- Build typed forms with `FormControl`, `FormGroup`, `FormBuilder` and `NonNullableFormBuilder`
- Validate with built-in, custom, cross-field and async validators
- Create dynamic lists with `FormArray` (and the `[formArray]` directive)
- Bridge reactive forms to signals for zoneless/OnPush apps
- Mix reactive forms with Signal Forms using `SignalFormControl`

## Which forms API should I use?

| | Signal Forms | Reactive Forms | Template-driven |
|---|---|---|---|
| Package | `@angular/forms/signals` | `@angular/forms` (`ReactiveFormsModule`) | `@angular/forms` (`FormsModule`) |
| Source of truth | Your own `signal()` model | `FormControl`/`FormGroup` tree | Component properties via `ngModel` |
| Types | Inferred from the model | Inferred from controls | Minimal |
| Reactivity | Signals | Observables (`valueChanges`, `events`) | Directives |
| Status | Stable since v22 | Stable | Stable |
| Best for | **New forms** in new/signal-based apps | Existing codebases, teams fluent in RxJS, very dynamic forms | Small, simple forms |

:::tip[New form in a v22 app?]
Start with [Signal Forms](/modern/signal-forms/) — they are stable, signal-native and need less code. Reach for Reactive Forms when you're extending an existing reactive-forms codebase, rely on RxJS pipelines over form values, or use libraries built around `FormControl`. You can mix both (see [Interop with Signal Forms](#interop-with-signal-forms)).
:::

## Setup

Import `ReactiveFormsModule` into the component that uses the form directives (`[formControl]`, `[formGroup]`, `formControlName`, …):

```ts
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  // ...
})
```

## A single `FormControl`

```ts title="name-editor.ts"
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-name-editor',
  imports: [ReactiveFormsModule],
  template: `
    <label for="name">Name</label>
    <input id="name" [formControl]="name" />
    <p>Value: {{ name.value }}</p>
    <button type="button" (click)="name.setValue('Ada')">Set to Ada</button>
  `,
})
export class NameEditor {
  protected readonly name = new FormControl('', { nonNullable: true });
}
```

The control owns the value. Typing updates `name.value`; calling `name.setValue()` updates the input. The type `FormControl<string>` is inferred from the initial value.

## Grouping controls with `FormGroup`

```ts title="profile-editor.ts"
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-editor',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="profile" (ngSubmit)="save()">
      <input formControlName="firstName" placeholder="First name" />
      <input formControlName="lastName" placeholder="Last name" />

      <fieldset formGroupName="address">
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
      </fieldset>

      <button type="submit" [disabled]="profile.invalid">Save</button>
    </form>
  `,
})
export class ProfileEditor {
  protected readonly profile = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true }),
    address: new FormGroup({
      street: new FormControl('', { nonNullable: true }),
      city: new FormControl('', { nonNullable: true }),
    }),
  });

  protected save() {
    const value = this.profile.getRawValue(); // fully typed
    console.log(value.address.city);           // string
  }
}
```

- `[formGroup]` binds the group to `<form>`; `formControlName` / `formGroupName` bind children **by key**.
- `(ngSubmit)` fires on submit (and prevents the browser's page reload).
- `setValue()` replaces the whole value (all keys required); `patchValue({ address: { city: 'Paris' } })` updates only what you pass.

## `FormBuilder` and `NonNullableFormBuilder`

For bigger forms, `FormBuilder` removes the `new FormControl(...)` noise. Inject `NonNullableFormBuilder` (or use `fb.nonNullable`) so every control resets to its initial value instead of `null`:

```ts title="signup.ts"
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { matchFields } from './validators';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    passwords: this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', Validators.required],
      },
      { validators: matchFields('password', 'confirm') }, // group-level validator
    ),
    terms: [false, Validators.requiredTrue],
  });

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // reveal all error messages
      return;
    }
    const { email, passwords } = this.form.getRawValue();
    console.log(email, passwords.password);
  }
}
```

```html title="signup.html"
<form [formGroup]="form" (ngSubmit)="submit()">
  <label>
    Email
    <input type="email" formControlName="email" />
  </label>
  @let emailCtrl = form.controls.email;
  @if (emailCtrl.invalid && emailCtrl.touched) {
    @if (emailCtrl.hasError('required')) {
      <small class="error">Email is required.</small>
    } @else if (emailCtrl.hasError('email')) {
      <small class="error">Enter a valid email.</small>
    }
  }

  <div formGroupName="passwords">
    <input type="password" formControlName="password" placeholder="Password" />
    @if (form.controls.passwords.controls.password.hasError('minlength')) {
      <small class="error">At least 8 characters.</small>
    }
    <input type="password" formControlName="confirm" placeholder="Confirm" />
    @if (form.controls.passwords.hasError('passwordMismatch')) {
      <small class="error">Passwords don't match.</small>
    }
  </div>

  <label><input type="checkbox" formControlName="terms" /> I accept the terms</label>

  <button type="submit">Create account</button>
</form>
```

Use `form.controls.email` (typed) rather than `form.get('email')` (returns `AbstractControl | null`).

## Typed forms in depth

Reactive forms have been strictly typed since v14. A few rules to remember:

**Nullability.** A plain `new FormControl('x')` is `FormControl<string | null>` because `reset()` sets it to `null`. Add `{ nonNullable: true }` (or use `NonNullableFormBuilder`) and `reset()` returns to the initial value instead.

```ts
const a = new FormControl('x');                       // FormControl<string | null>
const b = new FormControl('x', { nonNullable: true }); // FormControl<string>
const c = new FormControl<number | null>(null);       // explicit type
```

**`value` vs `getRawValue()`.** Disabled controls are *excluded* from `group.value`, so its type is `Partial<…>`. `getRawValue()` includes disabled controls and has the full type.

```ts
const form = new FormGroup({
  id: new FormControl({ value: 'u-42', disabled: true }, { nonNullable: true }),
  nickname: new FormControl('', { nonNullable: true }),
});

form.value;         // { id?: string; nickname?: string }
form.getRawValue(); // { id: string; nickname: string }
```

**Optional and dynamic keys.** Declare optional controls with an interface, or use `FormRecord` when keys are not known up front:

```ts
interface ContactForm {
  name: FormControl<string>;
  phone?: FormControl<string>; // may be added/removed
}

const contact = new FormGroup<ContactForm>({
  name: new FormControl('', { nonNullable: true }),
});
contact.addControl('phone', new FormControl('', { nonNullable: true }));

const permissions = new FormRecord<FormControl<boolean>>({});
permissions.addControl('canEdit', new FormControl(false, { nonNullable: true }));
```

`UntypedFormControl`/`UntypedFormGroup` exist only for migrating very old code — avoid them in new code.

## Validation

### Built-in validators

| Validator | Error key |
|---|---|
| `Validators.required` / `requiredTrue` | `required` |
| `Validators.email` | `email` |
| `Validators.minLength(n)` / `maxLength(n)` | `minlength` / `maxlength` (with `requiredLength`, `actualLength`) |
| `Validators.min(n)` / `max(n)` | `min` / `max` |
| `Validators.pattern(regex)` | `pattern` |

Read errors with `control.hasError('key')` and `control.getError('key')`. Angular also adds CSS classes such as `ng-valid`, `ng-invalid`, `ng-touched`, `ng-dirty`, `ng-pending` to bound elements, so you can style states in CSS.

### Custom and cross-field validators

A validator is a function that returns `null` (valid) or an errors object:

```ts title="validators.ts"
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function forbiddenName(forbidden: RegExp): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    forbidden.test(control.value) ? { forbiddenName: { value: control.value } } : null;
}

// Put cross-field validators on the *group*
export function matchFields(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const first = group.get(a)?.value;
    const second = group.get(b)?.value;
    return first === second ? null : { passwordMismatch: true };
  };
}
```

### Async validators

Async validators return an Observable or Promise. They run only after all sync validators pass; meanwhile the status is `PENDING`. Use `updateOn: 'blur'` to avoid a server call on every keystroke:

```ts title="username.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncValidatorFn, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { UserApi } from './user-api';
import { forbiddenName } from './validators';

export function usernameTaken(api: UserApi): AsyncValidatorFn {
  return (control) =>
    api.isTaken(control.value).pipe(map((taken) => (taken ? { usernameTaken: true } : null)));
}

@Component({
  selector: 'app-username',
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="username" />
    @if (status() === 'PENDING') {
      <small>Checking…</small>
    }
    @if (username.hasError('usernameTaken')) {
      <small class="error">That name is taken.</small>
    }
  `,
})
export class Username {
  private readonly api = inject(UserApi);

  protected readonly username = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, forbiddenName(/bob/i)],
    asyncValidators: [usernameTaken(this.api)],
    updateOn: 'blur',
  });

  // Turn status changes into a signal so the template refreshes when the check finishes
  protected readonly status = toSignal(this.username.statusChanges, {
    initialValue: this.username.status,
  });
}
```

You can also add/remove validators at runtime with `addValidators()`, `removeValidators()`, `setValidators()` — always call `updateValueAndValidity()` afterwards.

## Dynamic forms with `FormArray`

A `FormArray` holds any number of **unnamed** controls — perfect for "add another" lists.

```ts title="skills.ts"
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-skills',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Your name" />

      <div formArrayName="skills">
        @for (skill of form.controls.skills.controls; track skill; let i = $index) {
          <div>
            <input [formControlName]="i" placeholder="Skill {{ i + 1 }}" />
            <button type="button" (click)="removeSkill(i)">Remove</button>
          </div>
        }
      </div>
      <button type="button" (click)="addSkill()">Add skill</button>
    </form>
  `,
})
export class Skills {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: [''],
    skills: this.fb.array([this.fb.control('Angular')]),
  });

  protected addSkill() {
    this.form.controls.skills.push(this.fb.control(''));
  }

  protected removeSkill(index: number) {
    this.form.controls.skills.removeAt(index);
  }
}
```

- Track by the **control object** (`track skill`), not `$index`, so inputs keep focus when items are removed.
- For rows with several fields, push `FormGroup`s and bind each with `[formGroupName]="i"`.

### `[formArray]` for array-only forms

If the whole form *is* an array, bind it directly to the `<form>` with the `FormArrayDirective` (added in v21):

```ts title="tags.ts"
import { Component } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tags',
  imports: [ReactiveFormsModule],
  template: `
    <form [formArray]="tags">
      @for (tag of tags.controls; track tag; let i = $index) {
        <input [formControlName]="i" />
      }
    </form>
  `,
})
export class Tags {
  protected readonly tags = new FormArray([
    new FormControl('angular', { nonNullable: true }),
    new FormControl('signals', { nonNullable: true }),
  ]);
}
```

## Reacting to changes (and using signals)

Every control exposes Observables:

- `valueChanges` / `statusChanges` — the classic streams.
- `events` — **one** stream with `ValueChangeEvent`, `StatusChangeEvent`, `PristineChangeEvent`, `TouchedChangeEvent`, `FormResetEvent` and `FormSubmittedEvent`.

```ts
import { StatusChangeEvent } from '@angular/forms';
import { filter } from 'rxjs';

this.form.events
  .pipe(filter((e) => e instanceof StatusChangeEvent))
  .subscribe((e) => console.log('Status:', e.status));
```

### Zoneless and OnPush apps

New apps are zoneless and components are OnPush by default (since v22). User interaction (typing, blur, clicks) already triggers a re-render, but **changes that happen without a DOM event** — an async validator finishing, `patchValue()` after an HTTP call, `push()` from a timer — do *not* by themselves tell Angular to update the view. The clean fix is to expose what the template needs as a **signal** with `toSignal()`:

```ts
private readonly value = toSignal(this.form.valueChanges, {
  initialValue: this.form.getRawValue(),
});

protected readonly totalQty = computed(() =>
  (this.value().lines ?? []).reduce((sum, line) => sum + (line.qty ?? 0), 0),
);
```

`toSignal()` unsubscribes automatically when the component is destroyed. More in [RxJS in Angular](/intermediate/rxjs/).

## Managing control state

| Method | What it does |
|---|---|
| `disable()` / `enable()` | Disabled controls skip validation and are left out of `value` |
| `markAsTouched()` / `markAllAsTouched()` | Show errors without user interaction (e.g. on submit) |
| `markAsDirty()` / `markAsPristine()` | Track "has the user changed anything?" |
| `reset(value?)` | Reset value and state (non-nullable controls go back to the initial value) |
| `updateValueAndValidity()` | Re-run validation (e.g. after changing validators) |

Pass `{ emitEvent: false }` to `setValue`/`patchValue`/`disable` to avoid emitting `valueChanges`, and `{ onlySelf: true }` to skip updating parents.

:::caution[Don't use `[disabled]` with reactive controls]
Binding `[disabled]="…"` on an input that also has `formControlName` triggers a warning and can get out of sync. Call `control.disable()` / `enable()` instead (or create it with `{ value, disabled: true }`).
:::

## Custom form controls

A custom control written for Signal Forms — a component implementing `FormValueControl<T>` with a `value = model()` — works with `formControlName` and `[formControl]` **as-is**, no `ControlValueAccessor` needed (since v22):

```ts title="star-rating.ts"
import { Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-star-rating',
  template: `
    @for (s of [1, 2, 3, 4, 5]; track s) {
      <button type="button" [class.on]="s <= value()" (click)="value.set(s)">★</button>
    }
  `,
})
export class StarRating implements FormValueControl<number> {
  readonly value = model(0);
}
```

```html
<form [formGroup]="form">
  <app-star-rating formControlName="rating" />
</form>
```

Existing `ControlValueAccessor` implementations keep working. Don't implement both `ControlValueAccessor` and `FormValueControl` on the same component.

## Interop with Signal Forms

You don't have to migrate a whole form at once. `SignalFormControl` (from `@angular/forms/signals/compat`) is a Signal Forms field that **behaves like a `FormControl`** inside a `FormGroup`. Its rules use the Signal Forms schema API, and values sync both ways.

```ts title="newsletter.ts"
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, email, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';

@Component({
  selector: 'app-newsletter',
  imports: [ReactiveFormsModule, FormField],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" />

      <!-- Signal-based control: bind with [formField] and .fieldTree -->
      <input type="email" [formField]="emailControl.fieldTree" />
      @if (emailControl.fieldTree().invalid() && emailControl.fieldTree().touched()) {
        @for (err of emailControl.fieldTree().errors(); track err.kind) {
          <small class="error">{{ err.message }}</small>
        }
      }
    </form>
  `,
})
export class Newsletter {
  protected readonly saving = signal(false);

  protected readonly emailControl = new SignalFormControl('', (p) => {
    required(p, { message: 'Email is required' });
    email(p, { message: 'Enter a valid email' });
    disabled(p, { when: () => this.saving() });
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: this.emailControl, // part of the reactive form value
  });
}
```

- Bind it with `[formField]="emailControl.fieldTree"`, **not** `formControlName`/`[formControl]`.
- It takes a **raw value**, not a signal (read the internal signal via `emailControl.sourceValue`).
- Imperative `disable()`/`enable()` and `addValidators()`/`removeValidators()` throw — use rules like `disabled(p, { when })` instead.
- Going the other way, `compatForm()` lets a signal form contain existing `FormControl`s. See [Signal Forms](/modern/signal-forms/) and [Migrating to Signals](/migration/signals/).

## Common mistakes

- **Forgetting `ReactiveFormsModule`** in `imports` → "Can't bind to 'formGroup'".
- **Using `form.get('a.b')`** and losing types — prefer `form.controls.a.controls.b`.
- **Expecting `form.value` to include disabled fields** — use `getRawValue()`.
- **Nullable surprises after `reset()`** — use `nonNullable: true` / `NonNullableFormBuilder`.
- **Tracking `FormArray` rows by `$index`** — track the control object.
- **Template not updating after async changes** in zoneless apps — bridge with `toSignal()`.
- **Binding `[disabled]` on reactive inputs** — use `disable()`/`enable()`.

## Key takeaways

- Reactive forms model the form in TypeScript; types are inferred from the controls.
- Use `NonNullableFormBuilder`, `form.controls.x`, and `getRawValue()` for the best type safety.
- Validators are plain functions; put cross-field rules on the group and use `updateOn: 'blur'` for async checks.
- `FormArray` (and `[formArray]` for array-only forms) handles dynamic lists.
- In zoneless/OnPush apps, expose form streams to templates with `toSignal()`.
- For new forms prefer Signal Forms; `SignalFormControl` and `FormValueControl` let both systems live together.

## Next steps

- [Signal Forms](/modern/signal-forms/) — the signal-native forms API
- [Forms basics](/beginner/forms/) — template-driven forms refresher
- [RxJS in Angular](/intermediate/rxjs/) — `toSignal`, `debounceTime` and friends for form streams
- [Advanced Routing](/intermediate/advanced-routing/) — guard unsaved form changes with `canDeactivate`
