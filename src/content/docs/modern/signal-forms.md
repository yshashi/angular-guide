---
title: Signal Forms (Experimental) 📝
description: Master Angular's revolutionary Signal Forms - the future of reactive form handling
sidebar:
  order: 12
---

Angular's new Signal Forms represent a revolutionary leap forward in form handling! Coming in Angular 21, they bridge the gap between Angular's reactive signals and user interactions, creating a seamless, type-safe, and highly performant form experience.

## 🎯 What are Signal Forms?

**Signal Forms are the next generation of Angular forms built entirely on signals.** They provide reactive form handling with automatic change detection, type safety, and seamless integration with Angular's modern signal-based architecture.

**Key Revolutionary Features:**
- **🔄 Signal-Based** - Built entirely on Angular's signal system
- **⚡ Automatic Reactivity** - No manual change detection needed
- **🎯 Type-Safe** - Full TypeScript support with compile-time validation
- **🧹 Clean API** - Simplified, intuitive form creation and management
- **🚀 Performance** - Optimized for modern Angular applications
- **🔗 Seamless Integration** - Works perfectly with standalone components and signals

## 🆚 Traditional vs Signal Forms

### ❌ Traditional Reactive Forms

```typescript
// Complex setup with FormBuilder
export class UserFormComponent {
  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    age: [0, [Validators.required, Validators.min(18)]]
  });

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    if (this.userForm.valid) {
      console.log(this.userForm.value);
    }
  }
}
```

### ✅ Modern Signal Forms

```typescript
import { form, required, minLength, email, min, submit } from '@angular/forms/signals';

export class UserFormComponent {
  // Simple, type-safe form creation
  user = signal({ name: '', email: '', age: 0 });
  
  userForm = form(this.user, (path) => {
    required(path.name);
    minLength(path.name, 3);
    required(path.email);
    email(path.email);
    required(path.age);
    min(path.age, 18);
  });

  onSubmit() {
    submit(this.userForm, async (form) => {
      // Automatically validated - only runs if form is valid
      console.log(form().value());
      return null; // No errors
    });
  }
}
```

## 🚀 Basic Signal Form Setup

### 1. **Simple Contact Form**

```typescript
import { Component, signal } from '@angular/core';
import { form, required, email, minLength, Control } from '@angular/forms/signals';

interface Contact {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact-form',
  imports: [Control],
  template: `
    <form class="contact-form">
      <div class="form-group">
        <label for="name">Name</label>
        <input [control]="contactForm.name" id="name" />
        @if (contactForm.name().errors().length > 0) {
          <div class="error">{{ contactForm.name().errors()[0].message }}</div>
        }
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input [control]="contactForm.email" id="email" type="email" />
        @if (contactForm.email().errors().length > 0) {
          <div class="error">{{ contactForm.email().errors()[0].message }}</div>
        }
      </div>

      <div class="form-group">
        <label for="message">Message</label>
        <textarea [control]="contactForm.message" id="message"></textarea>
        @if (contactForm.message().errors().length > 0) {
          <div class="error">{{ contactForm.message().errors()[0].message }}</div>
        }
      </div>

      <button 
        type="button" 
        (click)="onSubmit()" 
        [disabled]="contactForm().invalid()">
        Send Message
      </button>
    </form>
  `
})
export class ContactFormComponent {
  contact = signal<Contact>({
    name: '',
    email: '',
    message: ''
  });

  contactForm = form(this.contact, (path) => {
    required(path.name);
    minLength(path.name, 2);
    required(path.email);
    email(path.email);
    required(path.message);
    minLength(path.message, 10);
  });

  onSubmit() {
    submit(this.contactForm, async (form) => {
      console.log('Sending message:', form().value());
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Message sent successfully!');
      return null;
    });
  }
}
```

### 2. **Custom Validators**

```typescript
import { validate, customError, FieldPath } from '@angular/forms/signals';

// Custom validator function
function validateUsername(path: FieldPath<string>) {
  validate(path, (ctx) => {
    const value = ctx.value();
    const forbidden = ['admin', 'root', 'user'];
    
    if (forbidden.includes(value.toLowerCase())) {
      return customError({
        kind: 'forbidden_username',
        message: `Username "${value}" is not allowed`,
        value,
        forbidden
      });
    }
    return null;
  });
}

// Usage in form
userForm = form(this.user, (path) => {
  required(path.username);
  minLength(path.username, 3);
  validateUsername(path.username);
});
```

## 🔄 Advanced Features

### 1. **Conditional Validation**

```typescript
import { Component, signal } from '@angular/core';
import { applyEach, Control, form, minLength, required, schema, submit } from '@angular/forms/signals';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TodoList {
  title: string;
  items: TodoItem[];
}

// Schema for individual todo items
const todoItemSchema = schema<TodoItem>((path) => {
  required(path.text);
  minLength(path.text, 3);
  required(path.priority);
});

@Component({
  template: `
    <form class="todo-form">
      <div class="form-group">
        <label>List Title</label>
        <input [control]="todoForm.title" />
      </div>

      <fieldset>
        <legend>Todo Items</legend>
        @for (item of todoForm.items; track item; let i = $index) {
          <div class="todo-item">
            <input [control]="item.text" placeholder="Todo text" />
            <select [control]="item.priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input type="checkbox" [control]="item.completed" />
            <button type="button" (click)="removeItem(i)">Remove</button>
          </div>
        }
        <button type="button" (click)="addItem()">Add Todo</button>
      </fieldset>

      <button type="button" (click)="saveTodos()" [disabled]="todoForm().invalid()">
        Save Todos
      </button>
    </form>
  `,
  imports: [Control]
})
export class TodoFormComponent {
  todoList = signal<TodoList>({
    title: '',
    items: []
  });

  todoForm = form(this.todoList, (path) => {
    required(path.title);
    minLength(path.title, 3);
    applyEach(path.items, todoItemSchema);
  });

  addItem() {
    const items = this.todoForm.items();
    items.value.update(current => [
      ...current,
      {
        id: Date.now(),
        text: '',
        completed: false,
        priority: 'medium' as const
      }
    ]);
  }

  removeItem(index: number) {
    const items = this.todoForm.items();
    items.value.update(current =>
      current.filter((_, i) => i !== index)
    );
  }

  saveTodos() {
    submit(this.todoForm, async (form) => {
      console.log('Saving todos:', form().value());
      return null;
    });
  }
}
```

### 2. **Nested Object Forms**

```typescript
interface Address {
  street: string;
  city: string;
  country: string;
  zipCode: string;
}

interface Company {
  name: string;
  address: Address;
  employees: number;
}

const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
  required(path.country);
  required(path.zipCode);
});

@Component({
  template: `
    <form class="company-form">
      <fieldset>
        <legend>Company Information</legend>
        <input [control]="companyForm.name" placeholder="Company Name" />
        <input [control]="companyForm.employees" type="number" placeholder="Employees" />
      </fieldset>

      <fieldset>
        <legend>Address</legend>
        <input [control]="companyForm.address.street" placeholder="Street" />
        <input [control]="companyForm.address.city" placeholder="City" />
        <input [control]="companyForm.address.country" placeholder="Country" />
        <input [control]="companyForm.address.zipCode" placeholder="ZIP Code" />
      </fieldset>
    </form>
  `
})
export class CompanyFormComponent {
  company = signal<Company>({
    name: '',
    address: {
      street: '',
      city: '',
      country: '',
      zipCode: ''
    },
    employees: 0
  });

  companyForm = form(this.company, (path) => {
    required(path.name);
    required(path.employees);
    min(path.employees, 1);
    apply(path.address, addressSchema);
  });
}
```

## 🎨 Form State Management

### 1. **Form Status and Properties**

```typescript
@Component({
  template: `
    <div class="form-status">
      <p>Form Valid: {{ userForm().valid() }}</p>
      <p>Form Dirty: {{ userForm().dirty() }}</p>
      <p>Form Touched: {{ userForm().touched() }}</p>
      <p>Form Pending: {{ userForm().pending() }}</p>
    </div>

    <div class="field-status">
      <p>Name Valid: {{ userForm.name().valid() }}</p>
      <p>Name Dirty: {{ userForm.name().dirty() }}</p>
      <p>Name Touched: {{ userForm.name().touched() }}</p>
      <p>Name Errors: {{ userForm.name().errors().length }}</p>
    </div>

    <!-- Error Summary for entire form -->
    <div class="error-summary">
      @for (error of userForm().errorSummary(); track error) {
        <div class="error">{{ error.message }}</div>
      }
    </div>
  `
})
export class FormStatusComponent {
  // Form implementation...
}
```

### 2. **Conditional Field States**

```typescript
import { disabled, hidden, readonly } from '@angular/forms/signals';

userForm = form(this.user, (path) => {
  required(path.userType);
  
  // Conditionally disable admin fields
  disabled(path.adminLevel, (ctx) => ctx.valueOf(path.userType) !== 'admin');
  
  // Hide sensitive fields for regular users
  hidden(path.secretKey, (ctx) => ctx.valueOf(path.userType) !== 'admin');
  
  // Make email readonly after verification
  readonly(path.email, (ctx) => ctx.valueOf(path.emailVerified));
});
```

## ✅ Best Practices

### 1. **Schema Organization**

```typescript
// ✅ Good - Separate schemas for reusability
export const userSchema = schema<User>((path) => {
  required(path.name);
  email(path.email);
});

export const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
});

// ✅ Good - Compose schemas
export const userWithAddressSchema = schema<UserWithAddress>((path) => {
  apply(path.user, userSchema);
  apply(path.address, addressSchema);
});
```

### 2. **Error Handling**

```typescript
// ✅ Good - Centralized error display component
@Component({
  selector: 'app-field-errors',
  template: `
    @for (error of errors; track error) {
      <div class="error" [attr.data-error-kind]="error.kind">
        {{ getErrorMessage(error) }}
      </div>
    }
  `
})
export class FieldErrorsComponent {
  @Input() errors: ValidationError[] = [];

  getErrorMessage(error: ValidationError): string {
    switch (error.kind) {
      case 'required': return 'This field is required';
      case 'email': return 'Please enter a valid email';
      case 'minLength': return `Minimum length is ${error.minLength}`;
      default: return error.message || 'Invalid value';
    }
  }
}
```

### 3. **Form Submission**

```typescript
// ✅ Good - Proper error handling in submit
async onSubmit() {
  submit(this.userForm, async (form) => {
    try {
      const result = await this.userService.saveUser(form().value());
      this.router.navigate(['/users', result.id]);
      return null; // Success
    } catch (error) {
      if (error.status === 409) {
        return {
          kind: 'duplicate_email',
          message: 'Email already exists',
          field: form().field.email
        };
      }
      return {
        kind: 'server_error',
        message: 'Failed to save user. Please try again.'
      };
    }
  });
}
```

## 🎯 Quick Migration Guide

### From Reactive Forms to Signal Forms

```typescript
// ❌ Old Reactive Forms
export class OldComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}

// ✅ New Signal Forms
export class NewComponent {
  user = signal({ name: '', email: '' });
  
  form = form(this.user, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
  });

  onSubmit() {
    submit(this.form, async (form) => {
      console.log(form().value());
      return null;
    });
  }
}
```

## 🚀 Next Steps

1. **[Angular Signals](/modern/signals/)** - Master the foundation of Signal Forms
2. **[Computed Signals](/modern/computed-signals/)** - Reactive derived state
3. **[Effects API](/modern/effects/)** - Handle side effects with signals

---

**Remember**: Signal Forms are currently **experimental in Angular 21** but represent the future of form handling in Angular. They provide a cleaner, more reactive, and type-safe approach to building complex forms! 📝✨
