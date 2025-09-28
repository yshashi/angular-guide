---
title: Reactive Forms 📋
description: Build complex forms with Angular reactive forms
sidebar:
  order: 4
---

Reactive forms provide powerful, flexible form handling with explicit data flow and validation. Build complex, dynamic forms with full control over form state.

## 🎯 Core Concepts

- **FormControl** - Individual form field
- **FormGroup** - Collection of controls
- **FormArray** - Dynamic array of controls
- **Validators** - Built-in and custom validation
- **Signals Integration** - Modern reactive patterns

## 🚀 Basic Reactive Form

```typescript
@Component({
  selector: 'app-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <div>
        <label for="name">Name:</label>
        <input id="name" formControlName="name">
        @if (nameControl.invalid && nameControl.touched) {
          <div>Name is required</div>
        }
      </div>

      <div>
        <label for="email">Email:</label>
        <input id="email" type="email" formControlName="email">
        @if (emailControl.invalid && emailControl.touched) {
          <div>Valid email required</div>
        }
      </div>

      <button type="submit" [disabled]="userForm.invalid">
        Submit
      </button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  // Easy access to controls
  get nameControl() { return this.userForm.get('name')!; }
  get emailControl() { return this.userForm.get('email')!; }

  onSubmit() {
    if (this.userForm.valid) {
      console.log(this.userForm.value);
    }
  }
}
```

## 🔧 Advanced Form with Signals

```typescript
@Component({
  selector: 'app-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
      <div>
        <label>First Name:</label>
        <input formControlName="firstName">
        @if (firstNameErrors()) {
          <div>{{firstNameErrors()}}</div>
        }
      </div>

      <div>
        <label>Last Name:</label>
        <input formControlName="lastName">
      </div>

      <div>
        <label>Email:</label>
        <input formControlName="email">
        @if (emailErrors()) {
          <div>{{emailErrors()}}</div>
        }
      </div>

      <div>
        <p>Full Name: {{fullName()}}</p>
        <p>Form Valid: {{isFormValid()}}</p>
      </div>

      <button type="submit" [disabled]="!isFormValid()">
        {{isSubmitting() ? 'Saving...' : 'Save Profile'}}
      </button>
    </form>
  `
})
export class ProfileFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  // Signal-based computed values
  firstNameErrors = computed(() => {
    const control = this.profileForm.get('firstName');
    if (control?.errors && control.touched) {
      return control.errors['required'] ? 'First name is required' : null;
    }
    return null;
  });

  emailErrors = computed(() => {
    const control = this.profileForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Invalid email format';
    }
    return null;
  });

  fullName = computed(() => {
    const firstName = this.profileForm.get('firstName')?.value || '';
    const lastName = this.profileForm.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim();
  });

  isFormValid = computed(() => this.profileForm.valid);
  isSubmitting = signal(false);

  ngOnInit() {
    // Watch form changes
    this.profileForm.valueChanges.subscribe(() => {
      // Trigger change detection for computed signals
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isSubmitting.set(true);
      
      // Simulate API call
      setTimeout(() => {
        console.log('Profile saved:', this.profileForm.value);
        this.isSubmitting.set(false);
      }, 2000);
    }
  }
}
```

## 📋 Dynamic Forms with FormArray

```typescript
@Component({
  selector: 'app-skills-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="skillsForm" (ngSubmit)="onSubmit()">
      <h3>Skills</h3>
      
      <div formArrayName="skills">
        @for (skill of skillControls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Enter skill">
            <button type="button" (click)="removeSkill($index)">Remove</button>
          </div>
        }
      </div>

      <button type="button" (click)="addSkill()">Add Skill</button>
      <button type="submit" [disabled]="skillsForm.invalid">Save</button>

      <div>
        <h4>Current Skills:</h4>
        @for (skill of currentSkills(); track $index) {
          <span>{{skill}}</span>
        }
      </div>
    </form>
  `
})
export class SkillsFormComponent {
  private fb = inject(FormBuilder);

  skillsForm = this.fb.group({
    skills: this.fb.array([
      this.fb.control('', Validators.required)
    ])
  });

  get skillsArray() {
    return this.skillsForm.get('skills') as FormArray;
  }

  get skillControls() {
    return this.skillsArray.controls;
  }

  currentSkills = computed(() => {
    return this.skillsArray.value.filter((skill: string) => skill.trim());
  });

  addSkill() {
    this.skillsArray.push(this.fb.control('', Validators.required));
  }

  removeSkill(index: number) {
    if (this.skillsArray.length > 1) {
      this.skillsArray.removeAt(index);
    }
  }

  onSubmit() {
    if (this.skillsForm.valid) {
      const skills = this.skillsArray.value.filter((skill: string) => skill.trim());
      console.log('Skills:', skills);
    }
  }
}
```

## ✅ Custom Validators

```typescript
// Custom validator functions
export class CustomValidators {
  static passwordStrength(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    const isLongEnough = value.length >= 8;

    const valid = hasNumber && hasUpper && hasLower && hasSpecial && isLongEnough;
    
    if (!valid) {
      return {
        passwordStrength: {
          hasNumber,
          hasUpper,
          hasLower,
          hasSpecial,
          isLongEnough
        }
      };
    }
    
    return null;
  }

  static confirmPassword(passwordField: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;
      
      if (password !== confirmPassword) {
        return { confirmPassword: true };
      }
      
      return null;
    };
  }
}

// Usage in component
@Component({
  selector: 'app-register-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <div>
        <label>Password:</label>
        <input type="password" formControlName="password">
        @if (passwordErrors()) {
          <div>
            <div>Password must contain:</div>
            <ul>
              <li [class.valid]="passwordErrors()?.hasNumber">Number</li>
              <li [class.valid]="passwordErrors()?.hasUpper">Uppercase letter</li>
              <li [class.valid]="passwordErrors()?.hasLower">Lowercase letter</li>
              <li [class.valid]="passwordErrors()?.hasSpecial">Special character</li>
              <li [class.valid]="passwordErrors()?.isLongEnough">At least 8 characters</li>
            </ul>
          </div>
        }
      </div>

      <div>
        <label>Confirm Password:</label>
        <input type="password" formControlName="confirmPassword">
        @if (confirmPasswordErrors()) {
          <div>Passwords do not match</div>
        }
      </div>

      <button type="submit" [disabled]="registerForm.invalid">Register</button>
    </form>
  `
})
export class RegisterFormComponent {
  private fb = inject(FormBuilder);

  registerForm = this.fb.group({
    password: ['', [Validators.required, CustomValidators.passwordStrength]],
    confirmPassword: ['', [Validators.required, CustomValidators.confirmPassword('password')]]
  });

  passwordErrors = computed(() => {
    const control = this.registerForm.get('password');
    return control?.errors?.['passwordStrength'] || null;
  });

  confirmPasswordErrors = computed(() => {
    const control = this.registerForm.get('confirmPassword');
    return control?.errors?.['confirmPassword'] || null;
  });

  onSubmit() {
    if (this.registerForm.valid) {
      console.log('Registration data:', this.registerForm.value);
    }
  }
}
```

## 🎨 Complete Example: Contact Form

```typescript
@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
      <h2>Contact Us</h2>

      <div>
        <label>Name:</label>
        <input formControlName="name">
        @if (getFieldError('name')) {
          <div>{{getFieldError('name')}}</div>
        }
      </div>

      <div>
        <label>Email:</label>
        <input formControlName="email">
        @if (getFieldError('email')) {
          <div>{{getFieldError('email')}}</div>
        }
      </div>

      <div>
        <label>Subject:</label>
        <select formControlName="subject">
          <option value="">Select subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Support</option>
          <option value="sales">Sales</option>
        </select>
        @if (getFieldError('subject')) {
          <div>{{getFieldError('subject')}}</div>
        }
      </div>

      <div>
        <label>Message:</label>
        <textarea formControlName="message" rows="4"></textarea>
        @if (getFieldError('message')) {
          <div>{{getFieldError('message')}}</div>
        }
      </div>

      <div>
        <label>
          <input type="checkbox" formControlName="newsletter">
          Subscribe to newsletter
        </label>
      </div>

      <div>
        <button type="submit" [disabled]="contactForm.invalid || isSubmitting()">
          {{isSubmitting() ? 'Sending...' : 'Send Message'}}
        </button>
      </div>

      @if (submitMessage()) {
        <div [class.success]="submitSuccess()" [class.error]="!submitSuccess()">
          {{submitMessage()}}
        </div>
      }
    </form>
  `
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);

  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
    newsletter: [false]
  });

  isSubmitting = signal(false);
  submitMessage = signal('');
  submitSuccess = signal(false);

  getFieldError(fieldName: string): string | null {
    const control = this.contactForm.get(fieldName);
    if (control?.errors && control.touched) {
      const errors = control.errors;
      
      if (errors['required']) return `${fieldName} is required`;
      if (errors['email']) return 'Invalid email format';
      if (errors['minlength']) {
        const requiredLength = errors['minlength'].requiredLength;
        return `Minimum ${requiredLength} characters required`;
      }
    }
    return null;
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting.set(true);
      this.submitMessage.set('');

      // Simulate API call
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate
        
        this.isSubmitting.set(false);
        this.submitSuccess.set(success);
        
        if (success) {
          this.submitMessage.set('Message sent successfully!');
          this.contactForm.reset();
        } else {
          this.submitMessage.set('Failed to send message. Please try again.');
        }
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      this.contactForm.markAllAsTouched();
    }
  }
}
```

## ✅ Best Practices

### 1. **Use FormBuilder for Complex Forms**
```typescript
// ✅ Good - FormBuilder
contactForm = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]]
});

// ❌ Avoid - Manual FormGroup creation
contactForm = new FormGroup({
  name: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email])
});
```

### 2. **Combine Signals with Reactive Forms**
```typescript
// ✅ Good - Signal-based computed validation
fieldErrors = computed(() => {
  const control = this.form.get('field');
  return control?.errors && control.touched ? 'Error message' : null;
});
```

### 3. **Use Typed Forms**
```typescript
// ✅ Good - Typed form interface
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

contactForm: FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  message: FormControl<string>;
}>;
```

## 🎯 Quick Checklist

- [ ] Use ReactiveFormsModule
- [ ] Implement proper validation
- [ ] Handle form submission states
- [ ] Use FormBuilder for complex forms
- [ ] Combine with signals for reactive UI
- [ ] Create reusable custom validators
- [ ] Handle dynamic form arrays
- [ ] Provide clear error messages
- [ ] Use OnPush change detection

## 🚀 Next Steps

1. **[Advanced Routing](/intermediate/advanced-routing/)** - Route-based form handling
2. **[State Management](/intermediate/state-management/)** - Form state patterns
3. **[Testing](/intermediate/testing/)** - Form testing strategies

---

**Remember**: Reactive forms provide powerful control over form state and validation. Use them for complex, dynamic forms with custom validation requirements! 📋
