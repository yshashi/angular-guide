---
title: Standalone Components 🏗️
description: Learn about Angular standalone components - the future of Angular architecture
sidebar:
  order: 1
---

Standalone components are Angular's **default and recommended approach** for building modern applications! Think of them as independent LEGO blocks that don't need a big box (NgModule) to organize them. They're now the standard way to build Angular apps - simpler, more modular, and future-ready!

## 🎯 What are Standalone Components?

**Standalone components are Angular components that work independently without NgModules.** They manage their own dependencies and can be imported directly where needed.

**Why Standalone is Now the Standard:**
- **🎯 Default by Design** - New Angular projects use standalone by default
- **🚫 No NgModules** - Skip the module boilerplate entirely
- **📦 Direct Imports** - Import exactly what you need, where you need it
- **🌳 Better Tree Shaking** - Smaller bundles with unused code elimination
- **⚡ Simpler Architecture** - Less complexity, easier to understand
- **🔄 Easy Migration** - Can coexist with existing NgModule components
- **🚀 Angular's Future** - The official direction for all new development

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  standalone: true, // ✅ Default in new Angular projects
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

## 🆚 Legacy vs Modern Angular

### ❌ Legacy Approach (NgModules)

```typescript
// user.module.ts - Extra boilerplate file
@NgModule({
  declarations: [UserProfileComponent],
  imports: [CommonModule, FormsModule],
  exports: [UserProfileComponent]
})
export class UserModule { }

// app.module.ts - Complex module configuration
@NgModule({
  imports: [UserModule], // Import entire module
  // ...
})
export class AppModule { }
```

### ✅ Modern Angular (Standalone - Default)

```typescript
// Just import the component directly - no modules needed!
import { UserProfileComponent } from './user-profile.component';

@Component({
  standalone: true, // Default in new projects
  imports: [UserProfileComponent], // Direct import
  template: `<app-user-profile></app-user-profile>`
})
export class AppComponent { }
```

## 🎯 Angular CLI Default Behavior

**New Angular projects now generate standalone components by default!**

```bash
# Create a new Angular project (standalone by default)
ng new my-app

# Generate a new component (automatically standalone)
ng generate component user-profile
# Creates: user-profile.component.ts with standalone: true

# Generate a new project with explicit standalone flag
ng new my-app --standalone
```

**Generated component structure:**
```typescript
// Automatically generated with standalone: true
@Component({
  selector: 'app-user-profile',
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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

- [ ] Add `standalone: true` to your component decorator
- [ ] Import necessary modules in the `imports` array
- [ ] Remove component from NgModule declarations
- [ ] Import the component directly where needed
- [ ] Use `loadComponent` for lazy loading
- [ ] Provide services using `providedIn: 'root'` or component providers

## 🚀 Next Steps

1. **[Angular Signals](/modern/signals/)** - Modern reactivity with standalone components
2. **[Computed Signals](/modern/computed-signals/)** - Derived state in standalone apps
3. **[Control Flow](/modern/control-flow/)** - New template syntax with standalone components

---

**Remember**: Standalone components are now Angular's **default and standard approach**! All new projects use them automatically. If you're working with legacy NgModule projects, consider migrating to enjoy the benefits of simpler, more modular code! 🌟
