---
title: Angular Signals 🔄
description: Master Angular Signals - the new reactivity model for modern Angular applications
sidebar:
  order: 2
---

Signals are like smart variables that automatically tell your UI when they change. Think of them as "reactive data containers" that make your Angular apps faster and easier to understand!

## 🎯 What are Signals?

**A signal is a wrapper around a value that notifies consumers when that value changes.** It's like a smart variable that automatically updates your UI whenever its data changes.

**Key Features:**
- **🔄 Reactive** - Automatically notify when values change
- **⚡ Performance** - Only update what actually changed
- **🎯 Fine-grained** - Precise change detection, not full app scanning
- **🧠 Simple** - Easy to read, write, and understand
- **🔗 Composable** - Can be combined and chained together
- **🚀 Future-Ready** - Angular's new reactivity foundation

```typescript
import { signal } from '@angular/core';

// ✅ Create a signal
const count = signal(0);

// ✅ Read the signal value
console.log(count()); // 0

// ✅ Update the signal
count.set(5);
console.log(count()); // 5

// ✅ Update based on current value
count.update(value => value + 1);
console.log(count()); // 6
```

## 🆚 Before vs After

### ❌ Old Way (Zone.js Change Detection)

```typescript
@Component({
  template: `
    <div>Count: {{ count }}</div>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = 0;
  
  increment() {
    this.count++; // Zone.js detects this
    // Angular checks ALL components for changes 😱
  }
}
```

### ✅ New Way (Signals)

```typescript
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
    // Only this component updates! ⚡
  }
}
```

## 🚀 Common Patterns

### 1. **Basic Counter**

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <h2>Count: {{ count() }}</h2>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update(value => value + 1);
  }

  decrement() {
    this.count.update(value => value - 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### 2. **User Profile Management**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="profile">
      <h2>{{ user().name }}</h2>
      <p>Email: {{ user().email }}</p>
      <p>Status: {{ user().isActive ? 'Active' : 'Inactive' }}</p>
      
      <button (click)="toggleStatus()">
        {{ user().isActive ? 'Deactivate' : 'Activate' }}
      </button>
      
      <button (click)="updateEmail()">Update Email</button>
    </div>
  `
})
export class UserProfileComponent {
  user = signal<User>({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true
  });

  toggleStatus() {
    this.user.update(user => ({
      ...user,
      isActive: !user.isActive
    }));
  }

  updateEmail() {
    const newEmail = prompt('Enter new email:');
    if (newEmail) {
      this.user.update(user => ({
        ...user,
        email: newEmail
      }));
    }
  }
}
```

### 3. **Todo List**

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo-list',
  template: `
    <div class="todo-app">
      <h2>Todo List ({{ todos().length }} items)</h2>
      
      <div class="add-todo">
        <input #todoInput placeholder="Add new todo..." />
        <button (click)="addTodo(todoInput.value); todoInput.value = ''">
          Add
        </button>
      </div>
      
      <ul class="todo-list">
        @for (todo of todos(); track todo.id) {
          <li [class.completed]="todo.completed">
            <input 
              type="checkbox" 
              [checked]="todo.completed"
              (change)="toggleTodo(todo.id)"
            />
            <span>{{ todo.text }}</span>
            <button (click)="removeTodo(todo.id)">Delete</button>
          </li>
        }
      </ul>
    </div>
  `
})
export class TodoListComponent {
  todos = signal<Todo[]>([
    { id: 1, text: 'Learn Angular Signals', completed: false },
    { id: 2, text: 'Build awesome apps', completed: false }
  ]);

  private nextId = 3;

  addTodo(text: string) {
    if (text.trim()) {
      this.todos.update(todos => [
        ...todos,
        { id: this.nextId++, text: text.trim(), completed: false }
      ]);
    }
  }

  toggleTodo(id: number) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  removeTodo(id: number) {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }
}
```

### 4. **Loading States**

```typescript
@Component({
  selector: 'app-data-loader',
  template: `
    <div>
      @if (loading()) {
        <div class="spinner">Loading...</div>
      } @else if (error()) {
        <div class="error">
          Error: {{ error() }}
          <button (click)="retry()">Retry</button>
        </div>
      } @else {
        <div class="data">
          <h3>Data loaded successfully!</h3>
          <p>{{ data() }}</p>
        </div>
      }
      
      <button (click)="loadData()">Load Data</button>
    </div>
  `
})
export class DataLoaderComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<string | null>(null);

  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (Math.random() > 0.7) {
        throw new Error('Random API failure');
      }
      
      this.data.set('Successfully loaded data from API!');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }

  retry() {
    this.loadData();
  }
}
```

## ✅ Best Practices

### 1. **Use Descriptive Names**

```typescript
// ✅ Good - Clear, descriptive names
const userProfile = signal<User | null>(null);
const isLoading = signal(false);
const errorMessage = signal<string | null>(null);

// ❌ Avoid - Generic or unclear names
const data = signal(null);
const flag = signal(false);
const msg = signal('');
```

### 2. **Initialize with Proper Types**

```typescript
// ✅ Good - Explicit types and proper initialization
const users = signal<User[]>([]);
const selectedUser = signal<User | null>(null);
const count = signal(0);

// ❌ Avoid - Unclear types
const stuff = signal(undefined);
const things = signal(null);
```

### 3. **Use Update for Complex Changes**

```typescript
// ✅ Good - Use update for transformations
this.user.update(user => ({ ...user, isActive: !user.isActive }));

// ✅ Good - Use set for complete replacement
this.user.set(newUserFromAPI);

// ❌ Avoid - Don't mutate signal values directly
this.user().isActive = true; // This won't trigger updates!
```

## 🎯 Quick Checklist

- [ ] Use `signal()` to create reactive state
- [ ] Call signals as functions to read values: `count()`
- [ ] Use `set()` to replace the entire value
- [ ] Use `update()` to transform the current value
- [ ] Initialize signals with proper types
- [ ] Use descriptive names for your signals
- [ ] Don't mutate signal values directly

## 🚀 Next Steps

1. **[Computed Signals](/modern/computed-signals/)** - Create derived state
2. **[Effects API](/modern/effects/)** - Handle side effects with signals
3. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns

---

**Remember**: Signals are the foundation of modern Angular reactivity! Start using them in new components and gradually migrate existing ones. The performance benefits and developer experience improvements are incredible! 🚀
