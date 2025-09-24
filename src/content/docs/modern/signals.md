---
title: Angular Signals
description: Master Angular Signals - the new reactivity model for modern Angular applications
sidebar:
  order: 2
---

# Angular Signals 🔄

Angular Signals represent a revolutionary approach to reactivity in Angular applications. Introduced in Angular 16 and stabilized in Angular 17, signals provide a more intuitive and performant way to handle reactive state.

## 🎯 What are Signals?

A **signal** is a wrapper around a value that can notify interested consumers when that value changes. Think of it as a "smart variable" that automatically updates your UI when its value changes.

```typescript
import { signal } from '@angular/core';

// Create a signal
const count = signal(0);

// Read the signal value
console.log(count()); // 0

// Update the signal
count.set(5);
console.log(count()); // 5

// Update based on current value
count.update(value => value + 1);
console.log(count()); // 6
```

## 🌟 Why Signals?

### Problems with Traditional Change Detection
```typescript
// Traditional approach - Zone.js tracks everything
@Component({
  template: `
    <div>Count: {{ count }}</div>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = 0;
  
  increment() {
    this.count++; // Zone.js detects this change
    // Angular checks ALL components for changes
  }
}
```

### Signals Solution - Fine-grained Reactivity
```typescript
// Modern approach - Only update what actually changed
@Component({
  template: `
    <div>Count: {{ count() }}</div>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  
  increment() {
    this.count.update(c => c + 1);
    // Only this component updates!
  }
}
```

## 🔧 Creating Signals

### Basic Signal Creation
```typescript
import { signal } from '@angular/core';

// Number signal
const age = signal(25);

// String signal
const name = signal('John');

// Object signal
const user = signal({ 
  id: 1, 
  name: 'John', 
  email: 'john@example.com' 
});

// Array signal
const todos = signal([
  { id: 1, text: 'Learn Angular', done: false },
  { id: 2, text: 'Build an app', done: false }
]);

// Boolean signal
const isLoading = signal(false);
```

### Signal with Type Annotations
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Explicitly typed signal
const user = signal<User>({ 
  id: 1, 
  name: 'John', 
  email: 'john@example.com' 
});

// Optional signal
const selectedUser = signal<User | null>(null);

// Array with specific type
const users = signal<User[]>([]);
```

## 📖 Reading Signal Values

### In Templates
```typescript
@Component({
  template: `
    <!-- Call the signal as a function -->
    <h1>{{ title() }}</h1>
    <p>Count: {{ count() }}</p>
    
    <!-- Use in expressions -->
    <div [class.active]="isActive()">
      Status: {{ isActive() ? 'Active' : 'Inactive' }}
    </div>
    
    <!-- Use in structural directives -->
    <div *ngIf="user()">
      Welcome, {{ user()?.name }}!
    </div>
    
    <ul>
      <li *ngFor="let todo of todos()">
        {{ todo.text }}
      </li>
    </ul>
  `
})
export class MyComponent {
  title = signal('Angular Signals');
  count = signal(0);
  isActive = signal(true);
  user = signal<User | null>(null);
  todos = signal<Todo[]>([]);
}
```

### In Component Code
```typescript
export class MyComponent {
  count = signal(0);
  
  ngOnInit() {
    // Read current value
    const currentCount = this.count();
    console.log('Current count:', currentCount);
    
    // Use in calculations
    const doubled = this.count() * 2;
    
    // Use in conditions
    if (this.count() > 10) {
      console.log('Count is high!');
    }
  }
}
```

## ✏️ Updating Signals

### Using `set()`
```typescript
const count = signal(0);
const name = signal('John');
const user = signal<User | null>(null);

// Set new values
count.set(10);
name.set('Jane');
user.set({ id: 1, name: 'Alice', email: 'alice@example.com' });

// Set to null
user.set(null);
```

### Using `update()`
```typescript
const count = signal(0);
const todos = signal<Todo[]>([]);

// Update based on current value
count.update(current => current + 1);
count.update(current => current * 2);

// Update arrays
todos.update(current => [
  ...current,
  { id: Date.now(), text: 'New todo', done: false }
]);

// Update objects
const user = signal({ name: 'John', age: 25 });
user.update(current => ({ ...current, age: 26 }));
```

### Mutating Objects and Arrays
```typescript
const todos = signal([
  { id: 1, text: 'Learn Angular', done: false }
]);

// ❌ Don't mutate directly (won't trigger updates)
todos().push({ id: 2, text: 'Build app', done: false });

// ✅ Use update() for immutable updates
todos.update(current => [
  ...current,
  { id: 2, text: 'Build app', done: false }
]);

// ✅ Or use mutate() for direct mutations (Angular 17.1+)
todos.mutate(list => {
  list.push({ id: 2, text: 'Build app', done: false });
});
```

## 🎭 Signals in Components

### Complete Counter Example
```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <h2>Counter: {{ count() }}</h2>
      <div class="buttons">
        <button (click)="decrement()" [disabled]="count() <= 0">
          -
        </button>
        <button (click)="reset()">Reset</button>
        <button (click)="increment()">+</button>
      </div>
      <p>Status: {{ status() }}</p>
    </div>
  `,
  styles: [`
    .counter {
      text-align: center;
      padding: 2rem;
    }
    .buttons {
      margin: 1rem 0;
    }
    button {
      margin: 0 0.5rem;
      padding: 0.5rem 1rem;
    }
  `]
})
export class CounterComponent {
  count = signal(0);
  
  // Computed property based on signal
  status = computed(() => {
    const value = this.count();
    if (value === 0) return 'Zero';
    if (value > 0) return 'Positive';
    return 'Negative';
  });
  
  increment() {
    this.count.update(c => c + 1);
  }
  
  decrement() {
    this.count.update(c => Math.max(0, c - 1));
  }
  
  reset() {
    this.count.set(0);
  }
}
```

### Todo List with Signals
```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-todo-list',
  template: `
    <div class="todo-app">
      <h2>Todo List ({{ remainingCount() }} remaining)</h2>
      
      <form (ngSubmit)="addTodo()" #form="ngForm">
        <input 
          [(ngModel)]="newTodoText" 
          placeholder="Add a todo..."
          required
        >
        <button type="submit" [disabled]="!form.valid">Add</button>
      </form>
      
      <ul class="todo-list">
        <li *ngFor="let todo of todos()" 
            [class.done]="todo.done">
          <input 
            type="checkbox" 
            [checked]="todo.done"
            (change)="toggleTodo(todo.id)"
          >
          <span>{{ todo.text }}</span>
          <button (click)="removeTodo(todo.id)">×</button>
        </li>
      </ul>
      
      <div class="actions" *ngIf="todos().length > 0">
        <button (click)="clearCompleted()" 
                [disabled]="completedCount() === 0">
          Clear Completed ({{ completedCount() }})
        </button>
      </div>
    </div>
  `
})
export class TodoListComponent {
  todos = signal<Todo[]>([]);
  newTodoText = '';
  
  // Computed signals
  completedCount = computed(() => 
    this.todos().filter(todo => todo.done).length
  );
  
  remainingCount = computed(() => 
    this.todos().filter(todo => !todo.done).length
  );
  
  addTodo() {
    if (this.newTodoText.trim()) {
      this.todos.update(todos => [
        ...todos,
        {
          id: Date.now(),
          text: this.newTodoText.trim(),
          done: false
        }
      ]);
      this.newTodoText = '';
    }
  }
  
  toggleTodo(id: number) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }
  
  removeTodo(id: number) {
    this.todos.update(todos => 
      todos.filter(todo => todo.id !== id)
    );
  }
  
  clearCompleted() {
    this.todos.update(todos => 
      todos.filter(todo => !todo.done)
    );
  }
}
```

## 🔄 Signal Equality

### Default Equality
```typescript
const count = signal(5);

count.set(5); // No change notification (same value)
count.set(6); // Change notification
count.set(6); // No change notification (same value)
```

### Custom Equality
```typescript
interface User {
  id: number;
  name: string;
  lastLogin: Date;
}

const user = signal<User>(
  { id: 1, name: 'John', lastLogin: new Date() },
  {
    equal: (a, b) => a.id === b.id && a.name === b.name
    // Ignore lastLogin changes
  }
);
```

## ⚡ Performance Benefits

### Before Signals (Zone.js)
```typescript
// Every click triggers change detection for ALL components
@Component({
  template: `
    <div>{{ expensiveCalculation() }}</div>
    <button (click)="onClick()">Click</button>
  `
})
export class ExpensiveComponent {
  onClick() {
    // Some action
  }
  
  expensiveCalculation() {
    // This runs on EVERY change detection cycle
    return this.data.reduce((sum, item) => sum + item.value, 0);
  }
}
```

### With Signals
```typescript
// Only updates when dependencies change
@Component({
  template: `
    <div>{{ expensiveValue() }}</div>
    <button (click)="onClick()">Click</button>
  `
})
export class OptimizedComponent {
  data = signal([/* array of items */]);
  
  // Only recalculates when data changes
  expensiveValue = computed(() => 
    this.data().reduce((sum, item) => sum + item.value, 0)
  );
  
  onClick() {
    // This won't trigger expensiveValue recalculation
  }
}
```

## 🎯 Best Practices

### 1. Use Signals for Reactive State
```typescript
// ✅ Good - Use signals for reactive data
export class UserProfileComponent {
  user = signal<User | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
}

// ❌ Avoid - Regular properties for reactive data
export class UserProfileComponent {
  user: User | null = null;
  isLoading = false;
  error: string | null = null;
}
```

### 2. Keep Signals Simple
```typescript
// ✅ Good - Simple, focused signals
export class ShoppingCartComponent {
  items = signal<CartItem[]>([]);
  total = computed(() => 
    this.items().reduce((sum, item) => sum + item.price, 0)
  );
}

// ❌ Avoid - Complex nested objects
export class ShoppingCartComponent {
  cart = signal({
    items: [],
    user: { id: 1, name: 'John' },
    shipping: { address: '...', cost: 10 },
    payment: { method: 'card', details: '...' }
  });
}
```

### 3. Use Computed for Derived State
```typescript
export class ProductListComponent {
  products = signal<Product[]>([]);
  searchTerm = signal('');
  categoryFilter = signal<string | null>(null);
  
  // ✅ Computed for derived state
  filteredProducts = computed(() => {
    let filtered = this.products();
    
    const search = this.searchTerm();
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const category = this.categoryFilter();
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    
    return filtered;
  });
}
```

## 🚀 Migration from RxJS

### Before (RxJS)
```typescript
export class UserService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  
  setUser(user: User) {
    this.userSubject.next(user);
  }
  
  clearUser() {
    this.userSubject.next(null);
  }
}

@Component({
  template: `<div *ngIf="user$ | async as user">{{ user.name }}</div>`
})
export class UserComponent {
  user$ = this.userService.user$;
  
  constructor(private userService: UserService) {}
}
```

### After (Signals)
```typescript
export class UserService {
  private userSignal = signal<User | null>(null);
  user = this.userSignal.asReadonly();
  
  setUser(user: User) {
    this.userSignal.set(user);
  }
  
  clearUser() {
    this.userSignal.set(null);
  }
}

@Component({
  template: `<div *ngIf="user() as user">{{ user.name }}</div>`
})
export class UserComponent {
  user = this.userService.user;
  
  constructor(private userService: UserService) {}
}
```

## 🎓 Learning Outcomes

After mastering this section, you'll be able to:
- [ ] Create and use signals in Angular applications
- [ ] Update signals using `set()` and `update()` methods
- [ ] Read signal values in templates and components
- [ ] Understand the performance benefits of signals
- [ ] Apply signals best practices in your applications
- [ ] Migrate from RxJS observables to signals

## 🚀 What's Next?

Now that you understand basic signals, let's explore:

1. **[Computed Signals](/modern/computed-signals/)** - Create derived state
2. **[Effects API](/modern/effects/)** - Handle side effects with signals
3. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns

---

**Pro Tip**: Start using signals for new components and gradually migrate existing ones. The performance benefits and developer experience improvements are worth it! 🚀
