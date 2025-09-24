---
title: Forms Introduction 📝
description: Get started with Angular forms and user input handling
sidebar:
  order: 9
---

Forms are essential for collecting user input in web applications. Angular provides two powerful approaches: Template-driven forms (simple) and Reactive forms (advanced). This guide covers template-driven forms to get you started.

## 🎯 What are Angular Forms?

Angular forms help you:
- **Capture user input** with validation
- **Track form state** (valid, invalid, touched, etc.)
- **Handle form submission** and data processing
- **Display validation messages** to users
- **Manage complex form interactions**

## 📋 Template-Driven Forms

Template-driven forms use directives in the template to create and manage form controls. They're perfect for simple forms and quick prototypes.

### Basic Setup
```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-form',
  imports: [FormsModule, CommonModule],
  template: `
    <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)">
      <div class="form-group">
        <label for="name">Name:</label>
        <input 
          type="text" 
          id="name"
          name="name"
          [(ngModel)]="user.name"
          #name="ngModel"
          required
          minlength="2">
        
        @if (name.invalid && name.touched) {
          <div class="error">
            @if (name.errors?.['required']) {
              <span>Name is required</span>
            }
            @if (name.errors?.['minlength']) {
              <span>Name must be at least 2 characters</span>
            }
          </div>
        }
      </div>

      <button type="submit" [disabled]="contactForm.invalid">
        Submit
      </button>
    </form>
  `
})
export class ContactForm {
  user = {
    name: '',
    email: '',
    message: ''
  };

  onSubmit(form: any) {
    if (form.valid) {
      console.log('Form submitted:', this.user);
      // Process form data
    }
  }
}
```

## 🔧 Form Controls and Validation

### Built-in Validators
```html
<form #userForm="ngForm">
  <!-- Required field -->
  <input 
    type="text" 
    name="username"
    [(ngModel)]="user.username"
    #username="ngModel"
    required>

  <!-- Email validation -->
  <input 
    type="email" 
    name="email"
    [(ngModel)]="user.email"
    #email="ngModel"
    required
    email>

  <!-- Min/Max length -->
  <input 
    type="password" 
    name="password"
    [(ngModel)]="user.password"
    #password="ngModel"
    required
    minlength="8"
    maxlength="20">

  <!-- Pattern validation -->
  <input 
    type="text" 
    name="phone"
    [(ngModel)]="user.phone"
    #phone="ngModel"
    pattern="[0-9]{10}">

  <!-- Number validation -->
  <input 
    type="number" 
    name="age"
    [(ngModel)]="user.age"
    #age="ngModel"
    min="18"
    max="100">
</form>
```

### Form State Properties
```html
<form #myForm="ngForm">
  <input name="email" [(ngModel)]="email" #emailField="ngModel" required email>
  
  <!-- Form states -->
  <div>Form Valid: {{myForm.valid}}</div>
  <div>Form Invalid: {{myForm.invalid}}</div>
  <div>Form Touched: {{myForm.touched}}</div>
  <div>Form Dirty: {{myForm.dirty}}</div>
  
  <!-- Field states -->
  <div>Email Valid: {{emailField.valid}}</div>
  <div>Email Touched: {{emailField.touched}}</div>
  <div>Email Dirty: {{emailField.dirty}}</div>
  <div>Email Errors: {{emailField.errors | json}}</div>
</form>
```

## 🎨 Practical Example: Registration Form

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registration',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="registration-form">
      <h2>Create Account</h2>
      
      <form #registrationForm="ngForm" (ngSubmit)="onSubmit(registrationForm)">
        <!-- Personal Information -->
        <fieldset>
          <legend>Personal Information</legend>
          
          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input 
              type="text" 
              id="firstName"
              name="firstName"
              [(ngModel)]="user.firstName"
              #firstName="ngModel"
              required
              minlength="2"
              [class.error]="firstName.invalid && firstName.touched">
            
            @if (firstName.invalid && firstName.touched) {
              <div class="error-message">
                @if (firstName.errors?.['required']) {
                  <span>First name is required</span>
                }
                @if (firstName.errors?.['minlength']) {
                  <span>First name must be at least 2 characters</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input 
              type="text" 
              id="lastName"
              name="lastName"
              [(ngModel)]="user.lastName"
              #lastName="ngModel"
              required
              minlength="2"
              [class.error]="lastName.invalid && lastName.touched">
            
            @if (lastName.invalid && lastName.touched) {
              <div class="error-message">
                @if (lastName.errors?.['required']) {
                  <span>Last name is required</span>
                }
                @if (lastName.errors?.['minlength']) {
                  <span>Last name must be at least 2 characters</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              type="email" 
              id="email"
              name="email"
              [(ngModel)]="user.email"
              #email="ngModel"
              required
              email
              [class.error]="email.invalid && email.touched">
            
            @if (email.invalid && email.touched) {
              <div class="error-message">
                @if (email.errors?.['required']) {
                  <span>Email is required</span>
                }
                @if (email.errors?.['email']) {
                  <span>Please enter a valid email</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="phone">Phone</label>
            <input 
              type="tel" 
              id="phone"
              name="phone"
              [(ngModel)]="user.phone"
              #phone="ngModel"
              pattern="[0-9]{10}"
              placeholder="1234567890"
              [class.error]="phone.invalid && phone.touched">
            
            @if (phone.invalid && phone.touched) {
              <div class="error-message">
                @if (phone.errors?.['pattern']) {
                  <span>Please enter a valid 10-digit phone number</span>
                }
              </div>
            }
          </div>
        </fieldset>

        <!-- Account Information -->
        <fieldset>
          <legend>Account Information</legend>
          
          <div class="form-group">
            <label for="username">Username *</label>
            <input 
              type="text" 
              id="username"
              name="username"
              [(ngModel)]="user.username"
              #username="ngModel"
              required
              minlength="3"
              maxlength="20"
              pattern="[a-zA-Z0-9_]+"
              [class.error]="username.invalid && username.touched">
            
            @if (username.invalid && username.touched) {
              <div class="error-message">
                @if (username.errors?.['required']) {
                  <span>Username is required</span>
                }
                @if (username.errors?.['minlength']) {
                  <span>Username must be at least 3 characters</span>
                }
                @if (username.errors?.['maxlength']) {
                  <span>Username cannot exceed 20 characters</span>
                }
                @if (username.errors?.['pattern']) {
                  <span>Username can only contain letters, numbers, and underscores</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input 
              type="password" 
              id="password"
              name="password"
              [(ngModel)]="user.password"
              #password="ngModel"
              required
              minlength="8"
              [class.error]="password.invalid && password.touched">
            
            @if (password.invalid && password.touched) {
              <div class="error-message">
                @if (password.errors?.['required']) {
                  <span>Password is required</span>
                }
                @if (password.errors?.['minlength']) {
                  <span>Password must be at least 8 characters</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password *</label>
            <input 
              type="password" 
              id="confirmPassword"
              name="confirmPassword"
              [(ngModel)]="user.confirmPassword"
              #confirmPassword="ngModel"
              required
              [class.error]="confirmPassword.invalid && confirmPassword.touched || passwordMismatch">
            
            @if (confirmPassword.invalid && confirmPassword.touched) {
              <div class="error-message">
                @if (confirmPassword.errors?.['required']) {
                  <span>Please confirm your password</span>
                }
              </div>
            }
            @if (passwordMismatch && confirmPassword.touched) {
              <div class="error-message">
                <span>Passwords do not match</span>
              </div>
            }
          </div>
        </fieldset>

        <!-- Preferences -->
        <fieldset>
          <legend>Preferences</legend>
          
          <div class="form-group">
            <label for="country">Country</label>
            <select 
              id="country"
              name="country"
              [(ngModel)]="user.country">
              <option value="">Select Country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="uk">United Kingdom</option>
              <option value="au">Australia</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox"
                name="newsletter"
                [(ngModel)]="user.newsletter">
              Subscribe to newsletter
            </label>
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox"
                name="terms"
                [(ngModel)]="user.terms"
                #terms="ngModel"
                required>
              I agree to the terms and conditions *
            </label>
            
            @if (terms.invalid && terms.touched) {
              <div class="error-message">
                <span>You must agree to the terms and conditions</span>
              </div>
            }
          </div>
        </fieldset>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="submit" 
            [disabled]="registrationForm.invalid || passwordMismatch"
            class="submit-btn">
            Create Account
          </button>
          <button 
            type="button" 
            (click)="resetForm(registrationForm)"
            class="reset-btn">
            Reset
          </button>
        </div>

        <!-- Form Debug Info (Development only) -->
        <div class="debug-info" *ngIf="showDebug">
          <h4>Form Debug Info:</h4>
          <p>Form Valid: {{registrationForm.valid}}</p>
          <p>Form Value: {{registrationForm.value | json}}</p>
          <p>Password Match: {{!passwordMismatch}}</p>
        </div>
      </form>
    </div>
  `,
})
export class RegistrationForm {
  showDebug = false; // Set to true for development

  user = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    newsletter: false,
    terms: false
  };

  get passwordMismatch(): boolean {
    return this.user.password !== this.user.confirmPassword && 
           this.user.confirmPassword.length > 0;
  }

  onSubmit(form: any) {
    if (form.valid && !this.passwordMismatch) {
      console.log('Registration form submitted:', this.user);
      // Here you would typically send the data to your backend
      alert('Account created successfully!');
      this.resetForm(form);
    } else {
      console.log('Form is invalid');
      this.markAllFieldsAsTouched(form);
    }
  }

  resetForm(form: any) {
    this.user = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      country: '',
      newsletter: false,
      terms: false
    };
    form.resetForm();
  }

  private markAllFieldsAsTouched(form: any) {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
  }
}
```

## 🔄 Form Input Types

### Text Inputs
```html
<!-- Basic text -->
<input type="text" name="name" [(ngModel)]="user.name">

<!-- Email with validation -->
<input type="email" name="email" [(ngModel)]="user.email" email required>

<!-- Password -->
<input type="password" name="password" [(ngModel)]="user.password" minlength="8">

<!-- Number -->
<input type="number" name="age" [(ngModel)]="user.age" min="0" max="120">

<!-- Date -->
<input type="date" name="birthdate" [(ngModel)]="user.birthdate">

<!-- URL -->
<input type="url" name="website" [(ngModel)]="user.website">
```

### Select Dropdowns
```html
<!-- Basic select -->
<select name="country" [(ngModel)]="user.country">
  <option value="">Choose Country</option>
  <option value="us">United States</option>
  <option value="ca">Canada</option>
  <option value="uk">United Kingdom</option>
</select>

<!-- Dynamic options -->
<select name="city" [(ngModel)]="user.city">
  <option value="">Choose City</option>
  @for (city of cities; track city.id) {
    <option [value]="city.id">{{city.name}}</option>
  }
</select>

<!-- Multiple select -->
<select name="skills" [(ngModel)]="user.skills" multiple>
  @for (skill of availableSkills; track skill) {
    <option [value]="skill">{{skill}}</option>
  }
</select>
```

### Radio Buttons
```html
<div class="radio-group">
  <label>
    <input type="radio" name="gender" value="male" [(ngModel)]="user.gender">
    Male
  </label>
  <label>
    <input type="radio" name="gender" value="female" [(ngModel)]="user.gender">
    Female
  </label>
  <label>
    <input type="radio" name="gender" value="other" [(ngModel)]="user.gender">
    Other
  </label>
</div>
```

### Checkboxes
```html
<!-- Single checkbox -->
<label>
  <input type="checkbox" name="newsletter" [(ngModel)]="user.newsletter">
  Subscribe to newsletter
</label>

<!-- Multiple checkboxes -->
<div class="checkbox-group">
  @for (interest of interests; track interest.id) {
    <label>
      <input 
        type="checkbox" 
        [value]="interest.id"
        (change)="onInterestChange(interest.id, $event)">
      {{interest.name}}
    </label>
  }
</div>
```

## ✅ Best Practices

### 1. **Always Use Form Validation**
```html
<!-- ✅ With validation -->
<input type="email" name="email" [(ngModel)]="email" required email>

<!-- ❌ Without validation -->
<input type="email" name="email" [(ngModel)]="email">
```

### 2. **Provide Clear Error Messages**
```html
@if (emailField.invalid && emailField.touched) {
  <div class="error">
    @if (emailField.errors?.['required']) {
      <span>Email is required</span>
    }
    @if (emailField.errors?.['email']) {
      <span>Please enter a valid email address</span>
    }
  </div>
}
```

### 3. **Use Proper Input Types**
```html
<!-- ✅ Semantic input types -->
<input type="email" name="email">
<input type="tel" name="phone">
<input type="date" name="birthdate">

<!-- ❌ Generic text for everything -->
<input type="text" name="email">
```

### 4. **Disable Submit When Invalid**
```html
<button type="submit" [disabled]="myForm.invalid">
  Submit
</button>
```

### 5. **Handle Form Reset Properly**
```typescript
resetForm(form: NgForm) {
  this.user = { name: '', email: '' }; // Reset model
  form.resetForm(); // Reset form state
}
```

## 🎯 Quick Checklist

- [ ] Import `FormsModule` for template-driven forms
- [ ] Use `[(ngModel)]` for two-way data binding
- [ ] Add `name` attribute to all form controls
- [ ] Use template reference variables (`#name="ngModel"`)
- [ ] Implement proper validation (required, email, minlength, etc.)
- [ ] Display validation error messages
- [ ] Check form state (valid, invalid, touched, dirty)
- [ ] Disable submit button when form is invalid
- [ ] Handle form submission properly
- [ ] Provide form reset functionality

## 🚀 Next Steps

1. **[Routing Basics](/beginner/routing/)** - Navigate between components
2. **[HTTP Client](/beginner/http/)** - Send form data to servers
3. **[Reactive Forms](/intermediate/reactive-forms/)** - Advanced form handling

---

**Remember**: Forms are the gateway between users and your application. Make them user-friendly with proper validation, clear error messages, and intuitive design! 📝
