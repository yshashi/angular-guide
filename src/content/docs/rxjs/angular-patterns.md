---
title: RxJS Patterns in Angular 🎨
description: Master common RxJS patterns and best practices for Angular development
sidebar:
  order: 10
---

Learn proven RxJS patterns that make your Angular code cleaner, more maintainable, and easier to understand. These are battle-tested solutions to common problems!

## 🎯 Why Patterns Matter

**Good RxJS patterns:**
- Make asynchronous streams predictable and easy to compose
- Prevent memory leaks and race conditions
- Bridge cleanly with **Angular Signals** (`toSignal()`, `toObservable()`, `rxResource()`)
- Improve performance and testability

:::tip[Signals + RxJS in Angular 22]
In modern Angular 22 apps, use **`signal()` and `computed()`** for synchronous state, and **RxJS** for event streams, debouncing, cancellation (`switchMap`), WebSockets and complex async coordination. Connect the two with `toSignal()`, `toObservable()` and `rxResource()` from `@angular/core/rxjs-interop`.
:::

**This guide shows you:**
- ✅ What to do (good patterns)
- ❌ What to avoid (anti-patterns)
- 🎨 Real-world examples

## 🎨 Pattern 1: Service with State (RxJS + Signal Interop)

**Problem:** You need to share reactive state or event streams across multiple components.

**Solution:** Use a `BehaviorSubject` (or signals) in a `@Service()` and expose read-only streams/signals.

```typescript
import { Service, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Service()
export class CartService {
  // Private state
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  
  // Public Observable
  cart$ = this.cartSubject.asObservable();
  
  // Derived state
  total$ = this.cart$.pipe(
    map(items => items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    ))
  );
  
  itemCount$ = this.cart$.pipe(
    map(items => items.reduce((sum, item) => 
      sum + item.quantity, 0
    ))
  );

  // Signal views for templates that prefer signals over AsyncPipe
  readonly total = toSignal(this.total$, { initialValue: 0 });
  readonly itemCount = toSignal(this.itemCount$, { initialValue: 0 });

  // Actions
  addItem(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(i => i.id === item.id);
    
    if (existingItem) {
      this.cartSubject.next(
        currentCart.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      );
    } else {
      this.cartSubject.next([...currentCart, item]);
    }
  }

  removeItem(itemId: number) {
    const currentCart = this.cartSubject.value;
    this.cartSubject.next(currentCart.filter(i => i.id !== itemId));
  }

  clear() {
    this.cartSubject.next([]);
  }
}

// Usage in component
@Component({
  selector: 'app-cart-summary',
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    <div class="cart-summary">
      <p>Items: {{ itemCount$ | async }}</p>
      <p>Total: {{ total$ | async | currency }}</p>
    </div>
  `
})
export class CartSummaryComponent {
  private cartService = inject(CartService);
  
  cart$ = this.cartService.cart$;
  total$ = this.cartService.total$;
  itemCount$ = this.cartService.itemCount$;
}
```

## 🎨 Pattern 2: Declarative Data Loading

**Problem:** Loading data imperatively makes code hard to follow.

**Solution:** Declare data streams, let RxJS handle the flow.

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { debounceTime, switchMap, startWith, map } from 'rxjs/operators';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <div class="filters">
      <input [formControl]="searchControl" placeholder="Search...">
      <select [formControl]="categoryControl">
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
    </div>
    
    @if (products$ | async; as products) {
      @for (product of products; track product.id) {
        <div class="product">
          <h3>{{ product.name }}</h3>
          <p>{{ product.category }} - \${{ product.price }}</p>
        </div>
      }
    }
  `
})
export class ProductListComponent {
  private http = inject(HttpClient);
  
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  
  // Declarative data stream
  products$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300)
    ),
    this.categoryControl.valueChanges.pipe(
      startWith('')
    )
  ]).pipe(
    switchMap(([search, category]) => 
      this.http.get<Product[]>('/api/products', {
        params: { search: search || '', category: category || '' }
      })
    )
  );
}
```

## 🎨 Pattern 3: Action Stream Pattern

**Problem:** Handling user actions reactively.

**Solution:** Use Subject to create action streams.

```typescript
import { Component, signal } from '@angular/core';
import { Subject, merge } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo-list',
  template: `
    <input #input (keyup.enter)="addTodo(input.value); input.value=''">
    
    @for (todo of todos(); track todo.id) {
      <div class="todo">
        <input 
          type="checkbox" 
          [checked]="todo.completed"
          (change)="toggleTodo(todo.id)"
        >
        <span [class.completed]="todo.completed">{{ todo.text }}</span>
        <button (click)="removeTodo(todo.id)">Delete</button>
      </div>
    }
  `
})
export class TodoListComponent {
  todos = signal<Todo[]>([]);
  
  // Action streams
  private addAction$ = new Subject<string>();
  private toggleAction$ = new Subject<number>();
  private removeAction$ = new Subject<number>();
  
  constructor() {
    // Combine all actions into state
    merge(
      this.addAction$.pipe(
        map(text => (todos: Todo[]) => [
          ...todos,
          { id: Date.now(), text, completed: false }
        ])
      ),
      this.toggleAction$.pipe(
        map(id => (todos: Todo[]) =>
          todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        )
      ),
      this.removeAction$.pipe(
        map(id => (todos: Todo[]) => todos.filter(t => t.id !== id))
      )
    ).pipe(
      startWith([]),
      scan((todos, updateFn) => updateFn(todos), [] as Todo[]),
      takeUntilDestroyed()
    ).subscribe(todos => this.todos.set(todos));
  }
  
  addTodo(text: string) {
    if (text.trim()) this.addAction$.next(text);
  }
  
  toggleTodo(id: number) {
    this.toggleAction$.next(id);
  }
  
  removeTodo(id: number) {
    this.removeAction$.next(id);
  }
}
```

## 🎨 Pattern 4: Smart & Dumb Components

**Problem:** Components doing too much - hard to test and reuse.

**Solution:** Separate smart (container) and dumb (presentational) components.

```typescript
// Dumb Component - Pure presentation
@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <img [src]="user().avatar" [alt]="user().name">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      <button (click)="edit.emit(user())">Edit</button>
      <button (click)="delete.emit(user().id)">Delete</button>
    </div>
  `
})
export class UserCardComponent {
  user = input.required<User>();
  edit = output<User>();
  delete = output<number>();
}

// Smart Component - Handles data and logic
@Component({
  selector: 'app-user-list-container',
  imports: [UserCardComponent, AsyncPipe],
  template: `
    @if (users$ | async; as users) {
      @for (user of users; track user.id) {
        <app-user-card 
          [user]="user"
          (edit)="onEdit($event)"
          (delete)="onDelete($event)"
        />
      }
    }
  `
})
export class UserListContainerComponent {
  private userService = inject(UserService);
  
  users$ = this.userService.getUsers();
  
  onEdit(user: User) {
    // Handle edit logic
    this.userService.updateUser(user).subscribe();
  }
  
  onDelete(userId: number) {
    // Handle delete logic
    this.userService.deleteUser(userId).subscribe();
  }
}
```

## ❌ Common Anti-Patterns

### Anti-Pattern 1: Nested Subscriptions

```typescript
// ❌ BAD - Nested subscriptions
this.userService.getUser(id).subscribe(user => {
  this.postService.getPosts(user.id).subscribe(posts => {
    this.commentService.getComments(posts[0].id).subscribe(comments => {
      // Callback hell!
    });
  });
});

// ✅ GOOD - Use switchMap
this.userService.getUser(id).pipe(
  switchMap(user => this.postService.getPosts(user.id)),
  switchMap(posts => this.commentService.getComments(posts[0].id))
).subscribe(comments => {
  // Clean and flat!
});
```

### Anti-Pattern 2: Not Unsubscribing

```typescript
// ❌ BAD - Memory leak!
ngOnInit() {
  this.dataService.getData().subscribe(data => {
    this.data = data;
  });
}

// ✅ GOOD - Use takeUntilDestroyed
constructor() {
  this.dataService.getData()
    .pipe(takeUntilDestroyed())
    .subscribe(data => this.data.set(data));
}

// ✅ GOOD - Use async pipe
data$ = this.dataService.getData();
```

### Anti-Pattern 3: Subscribing in Templates

```typescript
// ❌ BAD - Multiple subscriptions!
<div>{{ (data$ | async)?.name }}</div>
<div>{{ (data$ | async)?.email }}</div>
<div>{{ (data$ | async)?.phone }}</div>

// ✅ GOOD - Subscribe once with @if
@if (data$ | async; as data) {
  <div>{{ data.name }}</div>
  <div>{{ data.email }}</div>
  <div>{{ data.phone }}</div>
}
```

### Anti-Pattern 4: Manual State Management

```typescript
// ❌ BAD - Manually managing state
loading = false;
error = null;
data = null;

loadData() {
  this.loading = true;
  this.http.get('/api/data').subscribe({
    next: (data) => {
      this.data = data;
      this.loading = false;
    },
    error: (err) => {
      this.error = err;
      this.loading = false;
    }
  });
}

// ✅ GOOD - Declarative with signals
data$ = this.http.get('/api/data').pipe(
  catchError(err => {
    this.error.set(err);
    return of(null);
  }),
  finalize(() => this.loading.set(false))
);
```

## ✅ Best Practices Summary

```typescript
// 1. Always unsubscribe
constructor() {
  obs$.pipe(takeUntilDestroyed()).subscribe();
}

// 2. Use async pipe when possible
data$ = this.service.getData();

// 3. Use operators, not nested subscriptions
obs1$.pipe(
  switchMap(val => obs2$)
).subscribe();

// 4. Handle errors
obs$.pipe(
  catchError(err => of(defaultValue))
).subscribe();

// 5. Use BehaviorSubject for state
private state$ = new BehaviorSubject(initialState);

// 6. Expose Observables, not Subjects
public state$ = this.stateSubject.asObservable();

// 7. Use shareReplay for expensive operations
expensive$ = this.compute().pipe(shareReplay(1));
```

## 🎓 Learning Checklist

- [ ] Use BehaviorSubject for state management
- [ ] Build declarative data streams
- [ ] Implement action stream pattern
- [ ] Separate smart and dumb components
- [ ] Avoid nested subscriptions
- [ ] Always unsubscribe properly
- [ ] Use async pipe in templates
- [ ] Handle errors gracefully
- [ ] Follow naming conventions ($suffix)

## 🚀 Next Steps

1. **[Testing](/testing/unit-testing/)** - Test your RxJS code
2. **[State Management](/intermediate/state-management/)** - Advanced patterns
3. **[Performance](/advanced/performance/)** - Optimize your app

---

**Pro Tip**: Think in **streams**, not events! Use **declarative** patterns instead of imperative code. Let RxJS do the heavy lifting - your code will be cleaner and easier to maintain! 🎨
