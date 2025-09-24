---
title: Templates & Data Binding 🎨
description: Master Angular templates and data binding - the foundation of dynamic user interfaces
sidebar:
  order: 5
---

Angular templates are HTML files with Angular-specific markup that define how your component's view should be rendered. Combined with data binding, they create dynamic, interactive user interfaces.

## 🎯 What are Templates?

Templates are HTML files that tell Angular how to render a component. They combine regular HTML with Angular markup such as:

- **Interpolation** - Display component data
- **Property binding** - Set element properties  
- **Event binding** - Listen to user actions
- **Two-way binding** - Combine property and event binding
- **Directives** - Add behavior to elements

## 🔗 Interpolation

Display component data in templates using double curly braces:

```html
<h1>Welcome, {{userName}}!</h1>
<p>You have {{messageCount}} new messages</p>
<div>Current time: {{getCurrentTime()}}</div>
```

```typescript
export class User {
  userName = 'John Doe';
  messageCount = 5;
  
  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }
}
```

### Expressions in Interpolation
```html
<!-- Simple expressions -->
<p>Total: {{price + tax}}</p>
<p>Full name: {{firstName + ' ' + lastName}}</p>
<p>Is admin: {{user.role === 'admin'}}</p>

<!-- Method calls -->
<p>Formatted price: {{formatPrice(price)}}</p>

<!-- Conditional expressions -->
<p>Status: {{isOnline ? 'Online' : 'Offline'}}</p>
```

## ⬇️ Property Binding

Bind component properties to element attributes using square brackets:

```html
<!-- Bind to element properties -->
<img [src]="imageUrl" [alt]="imageDescription">
<button [disabled]="isLoading">Submit</button>
<div [class]="cssClass" [style.color]="textColor">Content</div>

<!-- Bind to component properties -->
<app-user-card [user]="selectedUser" [showDetails]="true"></app-user-card>
```

```typescript
export class Product {
  imageUrl = 'https://example.com/product.jpg';
  imageDescription = 'Product image';
  isLoading = false;
  cssClass = 'highlight';
  textColor = 'blue';
  selectedUser = { name: 'Jane', email: 'jane@example.com' };
}
```

### Class and Style Binding
```html
<!-- Class binding -->
<div [class.active]="isActive">Toggle class</div>
<div [class]="'btn btn-' + buttonType">Dynamic classes</div>
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">Multiple classes</div>

<!-- Style binding -->
<div [style.color]="textColor">Colored text</div>
<div [style.font-size.px]="fontSize">Sized text</div>
<!-- This below is going to be deprecated in future -->
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">Multiple styles</div>
```

## ⬆️ Event Binding

Listen to DOM events using parentheses:

```html
<!-- Basic event binding -->
<button (click)="handleClick()">Click me</button>
<input (keyup)="onKeyUp($event)" (blur)="onBlur()">
<form (submit)="onSubmit($event)">

<!-- Pass event data -->
<button (click)="selectItem(item.id)">Select</button>
<input (input)="updateValue($event.target.value)">
```

```typescript
export class Event {
  handleClick(): void {
    console.log('Button clicked!');
  }
  
  onKeyUp(event: KeyboardEvent): void {
    console.log('Key pressed:', event.key);
  }
  
  selectItem(id: number): void {
    console.log('Selected item:', id);
  }
  
  updateValue(value: string): void {
    console.log('Input value:', value);
  }
  
  onSubmit(event: Event): void {
    event.preventDefault();
    console.log('Form submitted');
  }
}
```

## 🔄 Two-Way Data Binding

Combine property and event binding with `[(ngModel)]`:

```html
<!-- Two-way binding with forms -->
<input [(ngModel)]="username" placeholder="Enter username">
<textarea [(ngModel)]="description"></textarea>
<select [(ngModel)]="selectedOption">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

<!-- Display bound values -->
<p>Username: {{username}}</p>
<p>Description: {{description}}</p>
<p>Selected: {{selectedOption}}</p>
```

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  // ... template
})
export class FormComponent {
  username = '';
  description = '';
  selectedOption = 'option1';
}
```

## 📍 Template Reference Variables

Create references to DOM elements or components:

```html
<!-- Reference to input element -->
<input #nameInput type="text" placeholder="Enter name">
<button (click)="greet(nameInput.value)">Greet</button>

<!-- Reference to component -->
<app-counter #counterRef></app-counter>
<button (click)="counterRef.reset()">Reset Counter</button>

<!-- Use in template -->
<p>Input length: {{nameInput.value.length}}</p>
```

```typescript
export class TemplateRefComponent {
  greet(name: string): void {
    alert(`Hello, ${name}!`);
  }
}
```

## 🔧 Pipes

Transform displayed data without changing the original:

```html
<!-- Built-in pipes -->
<p>{{message | uppercase}}</p>
<p>{{price | currency:'USD':'symbol':'1.2-2'}}</p>
<p>{{today | date:'fullDate'}}</p>
<p>{{users | json}}</p>

<!-- Chaining pipes -->
<p>{{message | lowercase | titlecase}}</p>

<!-- Pipe with parameters -->
<p>{{longText | slice:0:50}}...</p>
```

```typescript
export class PipeComponent {
  message = 'Hello World';
  price = 99.99;
  today = new Date();
  users = [{name: 'John'}, {name: 'Jane'}];
  longText = 'This is a very long text that needs to be truncated...';
}
```

### Common Built-in Pipes
- `uppercase` / `lowercase` - Text case
- `currency` - Format currency
- `date` - Format dates
- `json` - Display object as JSON
- `slice` - Extract portion of array/string
- `async` - Handle observables/promises

## 🎨 Conditional Rendering

Show/hide elements based on conditions using the new control flow syntax:

```html
<!-- Modern @if syntax (Angular 17+) -->
@if (isLoggedIn) {
  <div>Welcome back!</div>
} @else {
  <div>Please log in</div>
}

<!-- @if with else if -->
@if (isLoading) {
  <div>Loading...</div>
} @else if (hasError) {
  <div>Error occurred!</div>
} @else {
  <div>Content loaded!</div>
}

<!-- Simple conditional -->
@if (hasData) {
  <p>Data available</p>
}
```

### Traditional *ngIf (Still Supported)
```html
<!-- Legacy syntax - still works but not recommended -->
<div *ngIf="isLoggedIn">Welcome back!</div>
<div *ngIf="!isLoggedIn">Please log in</div>

<div *ngIf="isLoading; else content">Loading...</div>
<ng-template #content>
  <p>Content loaded!</p>
</ng-template>
```

## 🔁 Lists and Loops

Repeat elements using the new @for syntax:

```html
<!-- Modern @for syntax (Angular 17+) -->
<ul>
  @for (item of items; track item.id) {
    <li>{{item.name}}</li>
  }
</ul>

<!-- @for with index -->
<div>
  @for (user of users; track $index) {
    <div>{{$index + 1}}. {{user.name}}</div>
  }
</div>

<!-- @for with empty state -->
@for (product of products; track product.id) {
  <div>{{product.name}} - ${{product.price}}</div>
} @empty {
  <div>No products available</div>
}

<!-- @for with multiple variables -->
@for (item of items; track item.id; let isFirst = $first, isLast = $last) {
  <div [class.first]="isFirst" [class.last]="isLast">
    {{item.name}}
  </div>
}
```

### Traditional *ngFor (Still Supported)
```html
<!-- Legacy syntax - still works but not recommended -->
<ul>
  <li *ngFor="let item of items; trackBy: trackByItemId">{{item.name}}</li>
</ul>

<div *ngFor="let user of users; let i = index">
  {{i + 1}}. {{user.name}}
</div>
```

```typescript
export class List {
  items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];
  
  users = [
    { name: 'John Doe' },
    { name: 'Jane Smith' }
  ];
  
  products = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Phone', price: 599 }
  ];
  
  // Only needed for legacy *ngFor
  trackByItemId(index: number, item: any): number {
    return item.id;
  }
}
```

## 🎯 Practical Example: User Profile Form

```html
<div class="profile-form">
  <h2>User Profile</h2>
  
  <!-- Profile picture -->
  <div class="profile-pic">
    <img [src]="user.avatar || defaultAvatar" [alt]="user.name + ' avatar'">
    <button (click)="uploadAvatar()" [disabled]="isUploading">
      {{isUploading ? 'Uploading...' : 'Change Photo'}}
    </button>
  </div>
  
  <!-- Form fields -->
  <form (submit)="saveProfile($event)">
    <div class="form-group">
      <label for="name">Name:</label>
      <input 
        #nameInput
        id="name"
        [(ngModel)]="user.name" 
        [class.error]="!isValidName(user.name)"
        (blur)="validateName()">
      <span *ngIf="!isValidName(user.name)" class="error-msg">
        Name is required
      </span>
    </div>
    
    <div class="form-group">
      <label for="email">Email:</label>
      <input 
        id="email"
        type="email"
        [(ngModel)]="user.email"
        [disabled]="!canEditEmail">
    </div>
    
    <div class="form-group">
      <label for="role">Role:</label>
      <select [(ngModel)]="user.role">
        @for (role of availableRoles; track role.value) {
          <option [value]="role.value">{{role.label}}</option>
        }
      </select>
    </div>
    
    <!-- Skills -->
    <div class="form-group">
      <label>Skills:</label>
      <div class="skills">
        @for (skill of user.skills; track $index) {
          <span 
            class="skill-tag"
            (click)="removeSkill($index)">
            {{skill}} ×
          </span>
        }
        <input 
          #skillInput
          placeholder="Add skill"
          (keyup.enter)="addSkill(skillInput.value); skillInput.value = ''">
      </div>
    </div>
    
    <!-- Actions -->
    <div class="form-actions">
      <button 
        type="submit"
        [disabled]="!isFormValid()"
        [class.loading]="isSaving">
        {{isSaving ? 'Saving...' : 'Save Profile'}}
      </button>
      <button type="button" (click)="resetForm()">Reset</button>
    </div>
  </form>
  
  <!-- Status messages -->
  @if (saveMessage) {
    <div 
      [class.success]="saveSuccess"
      [class.error]="!saveSuccess"
      class="message">
      {{saveMessage}}
    </div>
  }
</div>
```

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfile {
  defaultAvatar = '/assets/default-avatar.png';
  isUploading = false;
  canEditEmail = false;
  isSaving = false;
  saveMessage = '';
  saveSuccess = false;
  
  user = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'developer',
    avatar: '',
    skills: ['Angular', 'TypeScript', 'JavaScript']
  };
  
  availableRoles = [
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' }
  ];
  
  isValidName(name: string): boolean {
    return name && name.trim().length > 0;
  }
  
  validateName(): void {
    if (!this.isValidName(this.user.name)) {
      console.log('Name validation failed');
    }
  }
  
  addSkill(skill: string): void {
    if (skill.trim() && !this.user.skills.includes(skill.trim())) {
      this.user.skills.push(skill.trim());
    }
  }
  
  removeSkill(index: number): void {
    this.user.skills.splice(index, 1);
  }
  
  isFormValid(): boolean {
    return this.isValidName(this.user.name) && this.user.email.length > 0;
  }
  
  uploadAvatar(): void {
    this.isUploading = true;
    // Simulate upload
    setTimeout(() => {
      this.user.avatar = '/assets/new-avatar.png';
      this.isUploading = false;
    }, 2000);
  }
  
  saveProfile(event: Event): void {
    event.preventDefault();
    if (!this.isFormValid()) return;
    
    this.isSaving = true;
    // Simulate save
    setTimeout(() => {
      this.isSaving = false;
      this.saveSuccess = true;
      this.saveMessage = 'Profile saved successfully!';
      setTimeout(() => this.saveMessage = '', 3000);
    }, 1500);
  }
  
  resetForm(): void {
    this.user = {
      name: '',
      email: '',
      role: 'developer',
      avatar: '',
      skills: []
    };
  }
}
```

## ✅ Best Practices

### 1. **Keep Templates Simple**
Move complex logic to component methods:

```html
<!-- ❌ Avoid complex expressions in templates -->
@if (user && user.permissions && user.permissions.includes('admin') && user.isActive) {
  <div>Admin content</div>
}

<!-- ✅ Use computed properties -->
@if (isUserAdmin()) {
  <div>Admin content</div>
}
```

### 2. **Use TrackBy for Performance**
```typescript
// Helps Angular track list changes efficiently
trackByUserId(index: number, user: any): number {
  return user.id;
}
```

### 3. **Avoid Function Calls in Templates**
```html
<!-- ❌ Function called on every change detection -->
<p>{{formatDate(today)}}</p>

<!-- ✅ Use pipes or computed properties -->
<p>{{today | date:'short'}}</p>
```

### 4. **Use Safe Navigation**
```html
<!-- Prevent errors when data might be null -->
<p>{{user?.profile?.address?.city}}</p>
```

## 🎯 Quick Checklist

- [ ] Understand interpolation with `{{}}`
- [ ] Use property binding with `[]`
- [ ] Handle events with `()`
- [ ] Implement two-way binding with `[(ngModel)]`
- [ ] Create template reference variables with `#`
- [ ] Transform data with pipes
- [ ] Show/hide content with `@if` (modern) or `*ngIf` (legacy)
- [ ] Loop through lists with `@for` (modern) or `*ngFor` (legacy)
- [ ] Apply conditional styling with `[class]` and `[style]`
- [ ] Use `@empty` with `@for` for empty states

## 🚀 Next Steps

1. **[Directives](/beginner/directives/)** - Learn built-in and custom directives
2. **[Services & DI](/beginner/services/)** - Share data between components
3. **[Forms](/beginner/forms/)** - Handle user input and validation

---

**Remember**: Templates are where your data comes to life. Master data binding, and you'll create dynamic, interactive user interfaces! 🎨