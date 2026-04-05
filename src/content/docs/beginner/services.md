---
title: Services & Dependency Injection 🔧
description: Master Angular services and dependency injection patterns
sidebar:
  order: 7
---

Services are classes that handle business logic, data access, and shared functionality. Dependency Injection (DI) is Angular's way of providing services to components automatically.

## 🎯 What are Services?

Services are **singleton classes** that:
- Handle business logic
- Manage data and state
- Communicate with APIs
- Share functionality between components
- Keep components focused on presentation

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  getUsers() {
    return this.users;
  }

  getUserById(id: number) {
    return this.users.find(user => user.id === id);
  }

  addUser(user: any) {
    const newUser = { ...user, id: Date.now() };
    this.users.push(newUser);
    return newUser;
  }
}
```

## 🏗️ Creating Services

### Using Angular CLI (Recommended)
```bash
# Generate a new service
ng generate service user
ng generate service services/data

# Short form
ng g s user
ng g s services/data
```

### Manual Creation
```typescript
// user.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'  // Available app-wide
})
export class UserService {
  // Service logic here
}
```

## 🔧 Dependency Injection Basics

### Injecting Services into Components
```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <div>
      @for (user of users; track user.id) {
        <div class="user-card">
          <h3>{{user.name}}</h3>
          <p>{{user.email}}</p>
        </div>
      }
    </div>
  `
})
export class UserList {
  private userService = inject(UserService);
  
  users = this.userService.getUsers();
  
  // Alternative: Constructor injection (still supported)
  // constructor(private userService: UserService) {
  //   this.users = this.userService.getUsers();
  // }
}
```

## 📊 Service Patterns

### 1. Data Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = [
    { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
    { id: 2, name: 'Book', price: 29, category: 'Education' }
  ];

  getAllProducts() {
    return [...this.products]; // Return copy to prevent mutation
  }

  getProductsByCategory(category: string) {
    return this.products.filter(p => p.category === category);
  }

  addProduct(product: Omit<Product, 'id'>) {
    const newProduct = { ...product, id: this.generateId() };
    this.products.push(newProduct);
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates };
      return this.products[index];
    }
    return null;
  }

  deleteProduct(id: number) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      return this.products.splice(index, 1)[0];
    }
    return null;
  }

  private generateId(): number {
    return Math.max(...this.products.map(p => p.id), 0) + 1;
  }
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}
```

### 2. State Management Service with Signals
**Note:** This pattern uses Signals for reactive state. We'll cover signals in more depth in the modern Angular section.
```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Using signals for reactive state
  private cartItems = signal<CartItem[]>([]);
  
  // Computed values
  items = this.cartItems.asReadonly();
  totalItems = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );
  totalPrice = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  addToCart(product: Product, quantity = 1) {
    const existingItem = this.cartItems().find(item => item.id === product.id);
    
    if (existingItem) {
      this.updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      this.cartItems.update(items => [...items, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      }]);
    }
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(item => item.id !== productId));
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cartItems.update(items =>
      items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}
```

### 3. Utility Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  formatDate(date: Date | string, format = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: format as any
    }).format(dateObj);
  }

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
```

## 🎯 Provider Scopes

### 1. Root Level (App-wide Singleton)
```typescript
@Injectable({
  providedIn: 'root'  // Single instance for entire app
})
export class GlobalService { }
```

### 2. Component Level
```typescript
@Component({
  selector: 'app-feature',
  providers: [FeatureService],  // New instance per component
  template: `...`
})
export class FeatureComponent {
  private featureService = inject(FeatureService);
}
```

### 3. Module Level (Legacy)
```typescript
@NgModule({
  providers: [ModuleService]  // Single instance per module
})
export class FeatureModule { }
```

## 🔄 Service Communication

### 1. Parent-Child via Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageSubject = new BehaviorSubject<string>('');
  message$ = this.messageSubject.asObservable();

  sendMessage(message: string) {
    this.messageSubject.next(message);
  }

  clearMessage() {
    this.messageSubject.next('');
  }
}

// Component A
export class ComponentA {
  private messageService = inject(MessageService);

  sendMessage() {
    this.messageService.sendMessage('Hello from Component A!');
  }
}

// Component B
export class ComponentB {
  private messageService = inject(MessageService);
  message$ = this.messageService.message$;
}
```

### 2. Event Bus Pattern
```typescript
@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<AppEvent>();
  events$ = this.eventSubject.asObservable();

  emit(event: AppEvent) {
    this.eventSubject.next(event);
  }

  on(eventType: string) {
    return this.events$.pipe(
      filter(event => event.type === eventType)
    );
  }
}

interface AppEvent {
  type: string;
  data?: any;
}

// Usage
export class SomeComponent {
  private eventBus = inject(EventBusService);

  ngOnInit() {
    this.eventBus.on('user-login').subscribe(event => {
      console.log('User logged in:', event.data);
    });
  }

  login() {
    this.eventBus.emit({
      type: 'user-login',
      data: { userId: 123, name: 'John' }
    });
  }
}
```

## 🎨 Practical Example: Todo Service

```typescript
import { Injectable, signal, computed } from '@angular/core';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private todos = signal<Todo[]>([
    { id: 1, text: 'Learn Angular Services', completed: false, createdAt: new Date() },
    { id: 2, text: 'Build Todo App', completed: false, createdAt: new Date() }
  ]);

  // Computed properties
  allTodos = this.todos.asReadonly();
  activeTodos = computed(() => this.todos().filter(todo => !todo.completed));
  completedTodos = computed(() => this.todos().filter(todo => todo.completed));
  totalCount = computed(() => this.todos().length);
  activeCount = computed(() => this.activeTodos().length);
  completedCount = computed(() => this.completedTodos().length);

  addTodo(text: string) {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: this.generateId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };

    this.todos.update(todos => [...todos, newTodo]);
  }

  toggleTodo(id: number) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  updateTodo(id: number, text: string) {
    if (!text.trim()) return;

    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, text: text.trim() } : todo
      )
    );
  }

  deleteTodo(id: number) {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }

  clearCompleted() {
    this.todos.update(todos => todos.filter(todo => !todo.completed));
  }

  toggleAll() {
    const allCompleted = this.todos().every(todo => todo.completed);
    this.todos.update(todos =>
      todos.map(todo => ({ ...todo, completed: !allCompleted }))
    );
  }

  private generateId(): number {
    const ids = this.todos().map(todo => todo.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}
```

### Using the Todo Service
```typescript
import { Component, inject } from '@angular/core';
import { TodoService } from './todo.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="todo-app">
      <h1>Todo App</h1>
      
      <!-- Add todo -->
      <div class="add-todo">
        <input 
          [(ngModel)]="newTodoText"
          (keyup.enter)="addTodo()"
          placeholder="What needs to be done?">
        <button (click)="addTodo()">Add</button>
      </div>

      <!-- Stats -->
      <div class="stats">
        <span>Total: {{todoService.totalCount()}}</span>
        <span>Active: {{todoService.activeCount()}}</span>
        <span>Completed: {{todoService.completedCount()}}</span>
      </div>

      <!-- Todo list -->
      <div class="todo-list">
        @for (todo of filteredTodos(); track todo.id) {
          <div class="todo-item" [class.completed]="todo.completed">
            <input 
              type="checkbox" 
              [checked]="todo.completed"
              (change)="todoService.toggleTodo(todo.id)">
            <span class="todo-text">{{todo.text}}</span>
            <button (click)="todoService.deleteTodo(todo.id)">Delete</button>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="actions">
        <button (click)="todoService.toggleAll()">Toggle All</button>
        <button (click)="todoService.clearCompleted()">Clear Completed</button>
      </div>
    </div>
  `
})
export class TodoList {
  todoService = inject(TodoService);
  newTodoText = '';
  filter: 'all' | 'active' | 'completed' = 'all';

  filteredTodos = computed(() => {
    switch (this.filter) {
      case 'active':
        return this.todoService.activeTodos();
      case 'completed':
        return this.todoService.completedTodos();
      default:
        return this.todoService.allTodos();
    }
  });

  addTodo() {
    if (this.newTodoText.trim()) {
      this.todoService.addTodo(this.newTodoText);
      this.newTodoText = '';
    }
  }
}
```

## ✅ Best Practices

### 1. **Single Responsibility**
Each service should have one clear purpose.

### 2. **Use inject() Function**
```typescript
// ✅ Modern approach
private userService = inject(UserService);

// ❌ Legacy (still works)
constructor(private userService: UserService) {}
```

### 3. **Provide at Root Level**
```typescript
@Injectable({
  providedIn: 'root'  // Preferred for most services
})
```

### 4. **Use Signals for State**
```typescript
// ✅ Reactive with signals
private state = signal(initialState);

// ❌ Manual change detection
private state = initialState;
```

### 5. **Return Copies, Not References**
```typescript
// ✅ Prevent external mutation
getUsers() {
  return [...this.users];
}

// ❌ Exposes internal state
getUsers() {
  return this.users;
}
```

### 6. **Use TypeScript Interfaces**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

## 🎯 Quick Checklist

- [ ] Understand what services are and their purpose
- [ ] Know how to create services with `@Injectable()`
- [ ] Use `inject()` function for modern DI
- [ ] Implement different service patterns (data, state, utility)
- [ ] Understand provider scopes (root, component, module)
- [ ] Use signals for reactive state management
- [ ] Follow single responsibility principle
- [ ] Return copies to prevent mutation
- [ ] Use TypeScript for type safety

## 🚀 Next Steps

1. **[Routing Basics](/beginner/routing/)** - Navigate between components
2. **[Forms Introduction](/beginner/forms/)** - Handle user input
3. **[HTTP Client](/beginner/http/)** - Communicate with APIs

---

**Remember**: Services are the backbone of Angular applications. They keep your components clean and enable powerful patterns like dependency injection and reactive programming! 🔧
