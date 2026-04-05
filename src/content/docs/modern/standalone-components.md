---
title: Standalone Components 🏗️
description: Learn about Angular standalone components - the default architecture since Angular 19
sidebar:
  order: 1
---

Standalone components are Angular's **default and recommended approach** for building modern applications! Since Angular 19, standalone is the default for all components, directives, and pipes — you no longer need to set `standalone: true` explicitly. Think of them as independent LEGO blocks that don't need a big box (NgModule) to organize them.

## 🎯 What are Standalone Components?

**Standalone components are Angular components that work independently without NgModules.** They manage their own dependencies and can be imported directly where needed. Since Angular 19, all components are standalone by default — no flag needed.

**Why Standalone is Now the Standard:**
- **🎯 Default by Design** - All new components are standalone automatically (since Angular 19)
- **🚫 No NgModules** - Skip the module boilerplate entirely
- **📦 Direct Imports** - Import exactly what you need, where you need it
- **🌳 Better Tree Shaking** - Smaller bundles with unused code elimination
- **⚡ Simpler Architecture** - Less complexity, easier to understand
- **🔄 Easy Migration** - Can coexist with existing NgModule components
- **🚀 Angular's Direction** - The standard for all Angular development

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule], // Direct imports
  template: `
    <div class="profile">
      <h1>{{ user.name }}</h1>
      <input [(ngModel)]="user.email" placeholder="Email">
      <button (click)="save()">Save</button>
    </div>
  `
})
export class UserProfileComponent {
  user = { name: 'John Doe', email: 'john@example.com' };
  
  save() {
    console.log('Saving user:', this.user);
  }
}
```

:::note[Legacy: NgModule-based Components]
In older Angular projects (pre-19), components required `standalone: true` in the decorator to opt into standalone mode. If you're working in a legacy codebase that still uses NgModules, you may need to set this flag explicitly or set `standalone: false` to declare a component inside an NgModule.

```typescript
// user.module.ts - Extra boilerplate file (legacy pattern)
@NgModule({
  declarations: [UserProfileComponent],
  imports: [CommonModule, FormsModule],
  exports: [UserProfileComponent]
})
export class UserModule { }

// app.module.ts - Complex module configuration (legacy pattern)
@NgModule({
  imports: [UserModule], // Import entire module
  // ...
})
export class AppModule { }
```
:::

### ✅ Modern Angular (Standalone - Default)

```typescript
// Just import the component directly - no modules needed!
import { UserProfileComponent } from './user-profile.component';

@Component({
  imports: [UserProfileComponent], // Direct import
  template: `<app-user-profile></app-user-profile>`
})
export class AppComponent { }
```

## 🎯 Angular CLI Default Behavior

**New Angular projects generate standalone components by default — no flags needed!**

```bash
# Create a new Angular project (standalone by default)
ng new my-app

# Generate a new component (standalone by default since Angular 19)
ng generate component user-profile
# Creates: user-profile.component.ts — standalone automatically
```

**Generated component structure:**
```typescript
// Generated component — standalone by default, no flag needed
@Component({
  selector: 'app-user-profile',
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent { }
```

## 🚀 Common Patterns

### 1. **Basic Standalone Component**

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
    </div>
  `
})
export class CounterComponent {
  count = 0;

  increment() { this.count++; }
  decrement() { this.count--; }
}
```

### 2. **Standalone with Services**

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  getUsers() {
    return ['Alice', 'Bob', 'Charlie'];
  }
}

@Component({
  selector: 'app-user-list',
  imports: [CommonModule],
  template: `
    <ul>
      @for (user of users; track user) {
        <li>{{ user }}</li>
      }
    </ul>
  `
})
export class UserListComponent {
  users = inject(UserService).getUsers();
}
```

### 3. **Standalone with Child Components**

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
  `,
  inputs: ['user']
})
export class UserCardComponent {
  user!: { name: string; email: string };
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, UserCardComponent], // Import child component
  template: `
    <div class="dashboard">
      <h2>User Dashboard</h2>
      @for (user of users; track user.id) {
        <app-user-card [user]="user"></app-user-card>
      }
    </div>
  `
})
export class DashboardComponent {
  users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];
}
```

### 4. **Standalone Routing**

```typescript
// routes.ts
export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./user-list.component').then(c => c.UserListComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./user-profile.component').then(c => c.UserProfileComponent)
  }
];

// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // ✅ No RouterModule needed
    provideHttpClient()    // ✅ No HttpClientModule needed
  ]
});
```

## ✅ Best Practices

### 1. **Import What You Need**

```typescript
// ✅ Good - Import specific modules
@Component({
  imports: [CommonModule, FormsModule, RouterModule],
  // ...
})

// ❌ Avoid - Don't create unnecessary modules
@NgModule({
  imports: [CommonModule, FormsModule],
  exports: [CommonModule, FormsModule]
})
export class SharedModule { } // Not needed with standalone!
```

### 2. **Use Providers Array**

```typescript
// ✅ Good - Provide services directly
@Component({
  providers: [UserService], // Component-level service
  // ...
})

// ✅ Better - Use providedIn: 'root' for global services
@Injectable({ providedIn: 'root' })
export class UserService { }
```

### 3. **Organize Imports**

```typescript
// ✅ Good - Group imports logically
@Component({
  imports: [
    // Angular modules
    CommonModule,
    FormsModule,
    RouterModule,
    
    // Your components
    UserCardComponent,
    LoadingSpinnerComponent
  ],
  // ...
})
```

## 🎯 Quick Checklist

- [ ] Components are standalone by default — no flag needed (Angular 19+)
- [ ] Import necessary modules in the `imports` array
- [ ] Import the component directly where needed
- [ ] Use `loadComponent` for lazy loading
- [ ] Provide services using `providedIn: 'root'` or component providers
- [ ] For legacy NgModule projects, consider migrating with `ng generate @angular/core:standalone`

## 🚀 Next Steps

1. **[Angular Signals](/modern/signals/)** - Modern reactivity with standalone components
2. **[Computed Signals](/modern/computed-signals/)** - Derived state in standalone apps
3. **[Control Flow](/modern/control-flow/)** - New template syntax with standalone components

---

**Remember**: Standalone components are Angular's **default architecture** since Angular 19! All new components are standalone automatically — no flag needed. If you're working with legacy NgModule projects, consider migrating with `ng generate @angular/core:standalone` to enjoy simpler, more modular code! 🌟
