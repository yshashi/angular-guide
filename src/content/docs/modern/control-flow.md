---
title: Control Flow (@if, @for, @switch) 🔄
description: Master the new Angular control flow syntax
sidebar:
  order: 7
---

Angular's new control flow syntax is like upgrading from a flip phone to a smartphone - everything becomes cleaner, more intuitive, and more powerful. Think of `@if`, `@for`, and `@switch` as your new best friends for creating dynamic, responsive templates.

## 🎯 Why New Control Flow?

**The new control flow syntax replaces structural directives** with a more readable and performant approach. It's like replacing complex assembly language with modern programming - same power, better experience.

**Key Benefits:**
- **~45% Better Performance** - Direct internal API usage vs structural directives
- **Improved Readability** - Cleaner, more intuitive syntax
- **Type Safety** - Better TypeScript integration
- **Less Boilerplate** - Cleaner syntax without structural directive prefixes
- **Enhanced Developer Experience** - Better IDE support and autocomplete

## 🚀 Performance Under the Hood

**How it works internally:**
- **New way (`@if`)**: Uses direct internal APIs → `conditional()` instruction → directly creates/destroys views
- This eliminates the extra steps of setting properties and checking for changes, making it significantly faster.

:::note[Legacy: Structural Directives]
The old structural directive syntax (`*ngIf`, `*ngFor`, `*ngSwitch`) used the `ViewContainerRef` API with extra indirection, resulting in roughly 45% slower performance than the new control flow. If your project still uses them, run the migration schematic:

```bash
ng g @angular/core:control-flow
```
:::

## 🔀 @if - Conditional Rendering

### Basic @if Usage

**Think of @if like a smart bouncer** - it only lets content through when conditions are met.

```typescript
@Component({
  template: `
    <!-- Simple conditional rendering -->
    @if (user()) {
      <div class="user-info">
        <h4>Welcome, {{ user()?.name }}!</h4>
        <p>Email: {{ user()?.email }}</p>
      </div>
    }

    <!-- Loading state -->
    @if (isLoading()) {
      <div class="loading">Loading user profile...</div>
    }

    <!-- Error state -->
    @if (error()) {
      <div class="error">
        <p>{{ error() }}</p>
        <button (click)="retry()">Try Again</button>
      </div>
    }
  `
})
export class UserProfileComponent {
  user = signal<User | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  retry() {
    this.loadUser();
  }
}
```

### @if with @else

**Think of @if/@else like a smart traffic light** - it shows different content based on conditions.

```typescript
@Component({
  template: `
    <div class="shopping-cart">
      <h3>Shopping Cart</h3>
      
      @if (cartItems().length > 0) {
        <div class="cart-content">
          <h4>{{ cartItems().length }} items in your cart</h4>
          
          @for (item of cartItems(); track item.id) {
            <div class="cart-item">
              <span>{{ item.name }} - ${{ item.price }}</span>
              <button (click)="removeItem(item.id)">Remove</button>
            </div>
          }
          
          <div class="total">
            <strong>Total: ${{ calculateTotal() }}</strong>
          </div>
        </div>
      } @else {
        <div class="empty-cart">
          <h4>🛒 Your cart is empty</h4>
          <p>Add some items to get started!</p>
        </div>
      }
    </div>
  `
})
export class ShoppingCartComponent {
  cartItems = signal<CartItem[]>([]);

  calculateTotal(): number {
    return this.cartItems().reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
  }

  removeItem(id: string) {
    this.cartItems.update(items => items.filter(item => item.id !== id));
  }
}
```

## 🔁 @for - List Rendering

### Basic @for Usage

**Think of @for like a smart assembly line** - it efficiently creates components for each item in your list.

```typescript
@Component({
  template: `
    <div class="task-list">
      <h3>My Tasks</h3>
      
      <!-- List with @for and track -->
      @for (task of tasks(); track task.id) {
        <div class="task-item">
          <input 
            type="checkbox" 
            [checked]="task.completed"
            (change)="toggleTask(task.id)"
          />
          <span [class.completed]="task.completed">
            {{ task.title }}
          </span>
          <button (click)="deleteTask(task.id)">Delete</button>
        </div>
      } @empty {
        <div class="no-tasks">
          <h4>🎉 No tasks yet!</h4>
          <p>Create your first task to get started.</p>
        </div>
      }
    </div>
  `
})
export class TaskListComponent {
  tasks = signal<Task[]>([
    { id: '1', title: 'Learn Angular Control Flow', completed: false },
    { id: '2', title: 'Build a todo app', completed: true }
  ]);

  toggleTask(taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  deleteTask(taskId: string) {
    this.tasks.update(tasks => tasks.filter(task => task.id !== taskId));
  }
}
```

## 🔄 @switch - Multiple Conditions

### Basic @switch Usage

**Think of @switch like a smart receptionist** - it directs you to the right place based on your needs.

```typescript
@Component({
  template: `
    <div class="dashboard">
      <h3>User Dashboard</h3>
      
      <!-- Navigation tabs -->
      <div class="tabs">
        <button (click)="setActiveTab('profile')">Profile</button>
        <button (click)="setActiveTab('settings')">Settings</button>
        <button (click)="setActiveTab('notifications')">Notifications</button>
      </div>

      <!-- Dynamic content based on active tab -->
      @switch (activeTab()) {
        @case ('profile') {
          <div class="profile-section">
            <h4>Profile Information</h4>
            <input 
              type="text" 
              [value]="userProfile().name"
              placeholder="Name"
            />
            <input 
              type="email" 
              [value]="userProfile().email"
              placeholder="Email"
            />
          </div>
        }

        @case ('settings') {
          <div class="settings-section">
            <h4>Application Settings</h4>
            <label>
              <input 
                type="checkbox" 
                [checked]="settings().darkMode"
              />
              Dark Mode
            </label>
            <label>
              <input 
                type="checkbox" 
                [checked]="settings().notifications"
              />
              Email Notifications
            </label>
          </div>
        }

        @case ('notifications') {
          <div class="notifications-section">
            <h4>Recent Notifications</h4>
            @for (notification of notifications(); track notification.id) {
              <div class="notification">
                @switch (notification.type) {
                  @case ('success') { ✅ }
                  @case ('warning') { ⚠️ }
                  @case ('error') { ❌ }
                }
                <span>{{ notification.message }}</span>
              </div>
            }
          </div>
        }

        @default {
          <div>Welcome! Select a tab above.</div>
        }
      }
    </div>
  `
})
export class DashboardComponent {
  activeTab = signal<string>('profile');
  
  userProfile = signal({
    name: 'John Doe',
    email: 'john@example.com'
  });

  settings = signal({
    darkMode: false,
    notifications: true
  });

  notifications = signal([
    { id: '1', type: 'success', message: 'Profile updated successfully!' },
    { id: '2', type: 'warning', message: 'Password expires in 7 days' }
  ]);

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}
```

## ✅ Best Practices

### 1. **Use Track Functions for Performance**

```typescript
// ✅ Good - Always use track for @for
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// ❌ Avoid - Missing track function
@for (item of items()) {
  <div>{{ item.name }}</div>
}
```

### 2. **Handle Empty States**

```typescript
// ✅ Good - Handle empty states
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div class="empty-state">No items found</div>
}

// ❌ Avoid - No empty state handling
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

### 3. **Use Meaningful Conditions**

```typescript
// ✅ Good - Clear, readable conditions
@if (user() && user()!.isActive) {
  <div>Welcome back!</div>
}

// ❌ Avoid - Complex inline logic
@if (user() && user()!.status === 'active' && user()!.lastLogin > Date.now() - 86400000) {
  <div>Welcome back!</div>
}
```

## 🎯 Quick Checklist

- [ ] Use `@if` for conditional rendering
- [ ] Use `@for` with track functions for lists
- [ ] Use `@switch` for multiple conditions
- [ ] Handle empty states with `@empty`
- [ ] Use `@else` for alternative content
- [ ] Keep conditions simple and readable
- [ ] Leverage computed signals for complex logic
- [ ] Test all control flow branches

## 🚀 Next Steps

1. **[Zoneless Angular](/modern/zoneless/)** - Performance optimization
2. **[New Template Syntax](/modern/template-syntax/)** - @let and more
3. **[Signal Forms](/modern/signal-forms/)** - Modern form handling

---

**Remember**: The new control flow syntax is like having a smart assistant that makes your templates cleaner and more performant. Use `@if`, `@for`, and `@switch` to create dynamic, responsive user interfaces! 🔄
