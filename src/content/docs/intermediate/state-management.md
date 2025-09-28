---
title: State Management 🗃️
description: Learn state management patterns in Angular applications
sidebar:
  order: 7
---

State management is like organizing your home - you need to know where everything is and keep things tidy so everyone can find what they need. In Angular applications, managing state effectively ensures your app remains predictable, maintainable, and scalable.

## 🎯 What is State Management?

**Think of state as your app's memory** - it remembers user preferences, loaded data, current page, form inputs, and more. Good state management is like having a well-organized filing system where everything has its place.

**Types of State:**
- **Local State** - Component-specific data (like form inputs)
- **Shared State** - Data used by multiple components (like user profile)
- **Global State** - App-wide data (like authentication status)
- **Server State** - Data from APIs (like user lists, products)

## 🏠 Local State with Signals

**Local state is like your personal desk** - only you use it, and you organize it however works best for you.

```typescript
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Counter: {{count()}}</h3>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
      
      <div>
        <p>Double: {{doubleCount()}}</p>
        <p>Is Even: {{isEven() ? 'Yes' : 'No'}}</p>
      </div>
    </div>
  `
})
export class CounterComponent {
  // Local state using signals
  count = signal(0);
  
  // Computed values automatically update when count changes
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);

  increment() {
    this.count.update(current => current + 1);
  }

  decrement() {
    this.count.update(current => current - 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

## 🤝 Shared State with Services

**Shared state is like a family refrigerator** - multiple people need access to it, so you need clear rules about what goes where.

```typescript
// Simple shared state service
@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Private signals for internal state
  private items = signal<CartItem[]>([]);
  private isLoading = signal(false);
  
  // Public readonly signals
  cartItems = this.items.asReadonly();
  loading = this.isLoading.asReadonly();
  
  // Computed values
  totalItems = computed(() => 
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  
  totalPrice = computed(() => 
    this.items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  addItem(product: Product) {
    this.items.update(current => {
      const existingItem = current.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item exists
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [...current, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          quantity: 1 
        }];
      }
    });
  }

  removeItem(itemId: string) {
    this.items.update(current => current.filter(item => item.id !== itemId));
  }

  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    
    this.items.update(current =>
      current.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  clearCart() {
    this.items.set([]);
  }
}

// Component using shared state
@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2>Shopping Cart ({{cartService.totalItems()}} items)</h2>
      
      @if (cartService.cartItems().length === 0) {
        <p>Your cart is empty</p>
      } @else {
        @for (item of cartService.cartItems(); track item.id) {
          <div>
            <span>{{item.name}} - ${{item.price}}</span>
            <input 
              type="number" 
              [value]="item.quantity"
              (change)="updateQuantity(item.id, $event)"
              min="0">
            <button (click)="cartService.removeItem(item.id)">Remove</button>
          </div>
        }
        
        <div>
          <strong>Total: ${{cartService.totalPrice()}}</strong>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  cartService = inject(CartService);

  updateQuantity(itemId: string, event: Event) {
    const quantity = parseInt((event.target as HTMLInputElement).value);
    this.cartService.updateQuantity(itemId, quantity);
  }
}
```

## 🌐 Global State Patterns

**Global state is like a city's traffic control system** - it coordinates information that affects the entire application.

```typescript
// User authentication state
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal(false);
  private isLoading = signal(false);
  
  // Public readonly access
  user = this.currentUser.asReadonly();
  authenticated = this.isAuthenticated.asReadonly();
  loading = this.isLoading.asReadonly();
  
  // Computed permissions
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  canEdit = computed(() => {
    const user = this.currentUser();
    return user?.role === 'admin' || user?.role === 'editor';
  });

  private http = inject(HttpClient);

  async login(email: string, password: string): Promise<boolean> {
    this.isLoading.set(true);
    
    try {
      const response = await this.http.post<LoginResponse>('/api/login', {
        email,
        password
      }).toPromise();
      
      if (response?.user && response?.token) {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        localStorage.setItem('auth_token', response.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  logout() {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('auth_token');
  }

  // Check if user is already logged in (on app startup)
  checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.isLoading.set(true);
      
      this.http.get<User>('/api/me').subscribe({
        next: user => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.logout(); // Token is invalid
          this.isLoading.set(false);
        }
      });
    }
  }
}

// App component using global auth state
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <nav>
        @if (authService.authenticated()) {
          <span>Welcome, {{authService.user()?.name}}!</span>
          @if (authService.isAdmin()) {
            <a routerLink="/admin">Admin Panel</a>
          }
          <button (click)="authService.logout()">Logout</button>
        } @else {
          <a routerLink="/login">Login</a>
        }
      </nav>
      
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);

  ngOnInit() {
    // Check if user is already logged in
    this.authService.checkAuthStatus();
  }
}
```

## 📊 Complex State with Custom Store

**A custom store is like a smart warehouse manager** - it knows where everything is, tracks changes, and can tell you the history of what happened.

```typescript
// Generic store pattern
export abstract class Store<T> {
  private state = signal<T>(this.initialState());
  
  // Public readonly access to state
  readonly state$ = this.state.asReadonly();
  
  protected abstract initialState(): T;
  
  protected setState(newState: T) {
    this.state.set(newState);
  }
  
  protected updateState(updater: (current: T) => T) {
    this.state.update(updater);
  }
  
  protected patchState(partial: Partial<T>) {
    this.state.update(current => ({ ...current, ...partial }));
  }
}

// Todo store implementation
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TodoStore extends Store<TodoState> {
  // Computed selectors
  todos = computed(() => this.state$().todos);
  filter = computed(() => this.state$().filter);
  isLoading = computed(() => this.state$().isLoading);
  error = computed(() => this.state$().error);
  
  // Filtered todos based on current filter
  filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  });
  
  // Statistics
  totalTodos = computed(() => this.todos().length);
  activeTodos = computed(() => this.todos().filter(todo => !todo.completed).length);
  completedTodos = computed(() => this.todos().filter(todo => todo.completed).length);

  private http = inject(HttpClient);

  protected initialState(): TodoState {
    return {
      todos: [],
      filter: 'all',
      isLoading: false,
      error: null
    };
  }

  // Actions
  async loadTodos() {
    this.patchState({ isLoading: true, error: null });
    
    try {
      const todos = await this.http.get<Todo[]>('/api/todos').toPromise();
      this.patchState({ 
        todos: todos || [], 
        isLoading: false 
      });
    } catch (error) {
      this.patchState({ 
        isLoading: false, 
        error: 'Failed to load todos' 
      });
    }
  }

  addTodo(text: string) {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date()
    };
    
    this.updateState(state => ({
      ...state,
      todos: [...state.todos, newTodo]
    }));
  }

  toggleTodo(id: string) {
    this.updateState(state => ({
      ...state,
      todos: state.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }));
  }

  deleteTodo(id: string) {
    this.updateState(state => ({
      ...state,
      todos: state.todos.filter(todo => todo.id !== id)
    }));
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this.patchState({ filter });
  }

  clearCompleted() {
    this.updateState(state => ({
      ...state,
      todos: state.todos.filter(todo => !todo.completed)
    }));
  }
}

// Component using the store
@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2>Todo List</h2>
      
      <div>
        <input 
          [(ngModel)]="newTodoText" 
          (keyup.enter)="addTodo()"
          placeholder="What needs to be done?">
        <button (click)="addTodo()">Add</button>
      </div>
      
      <div>
        <button 
          (click)="todoStore.setFilter('all')"
          [class.active]="todoStore.filter() === 'all'">
          All ({{todoStore.totalTodos()}})
        </button>
        <button 
          (click)="todoStore.setFilter('active')"
          [class.active]="todoStore.filter() === 'active'">
          Active ({{todoStore.activeTodos()}})
        </button>
        <button 
          (click)="todoStore.setFilter('completed')"
          [class.active]="todoStore.filter() === 'completed'">
          Completed ({{todoStore.completedTodos()}})
        </button>
      </div>
      
      @if (todoStore.isLoading()) {
        <div>Loading todos...</div>
      }
      
      @if (todoStore.error()) {
        <div>Error: {{todoStore.error()}}</div>
      }
      
      @for (todo of todoStore.filteredTodos(); track todo.id) {
        <div>
          <input 
            type="checkbox" 
            [checked]="todo.completed"
            (change)="todoStore.toggleTodo(todo.id)">
          <span [class.completed]="todo.completed">{{todo.text}}</span>
          <button (click)="todoStore.deleteTodo(todo.id)">Delete</button>
        </div>
      }
      
      @if (todoStore.completedTodos() > 0) {
        <button (click)="todoStore.clearCompleted()">
          Clear Completed ({{todoStore.completedTodos()}})
        </button>
      }
    </div>
  `
})
export class TodoListComponent implements OnInit {
  todoStore = inject(TodoStore);
  newTodoText = '';

  ngOnInit() {
    this.todoStore.loadTodos();
  }

  addTodo() {
    if (this.newTodoText.trim()) {
      this.todoStore.addTodo(this.newTodoText.trim());
      this.newTodoText = '';
    }
  }
}
```

## ✅ Best Practices

### 1. **Choose the Right State Level**
```typescript
// ✅ Good - Local state for component-specific data
@Component({})
export class FormComponent {
  formData = signal({ name: '', email: '' }); // Local to this form
}

// ✅ Good - Shared state for cross-component data
@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser = signal<User | null>(null); // Shared across app
}
```

### 2. **Use Immutable Updates**
```typescript
// ✅ Good - Immutable update
updateUser(userId: string, changes: Partial<User>) {
  this.users.update(current =>
    current.map(user =>
      user.id === userId ? { ...user, ...changes } : user
    )
  );
}

// ❌ Avoid - Mutating existing objects
updateUser(userId: string, changes: Partial<User>) {
  const user = this.users().find(u => u.id === userId);
  Object.assign(user, changes); // Mutates original object
}
```

### 3. **Use Computed for Derived State**
```typescript
// ✅ Good - Computed values automatically update
export class ProductStore {
  products = signal<Product[]>([]);
  searchTerm = signal('');
  
  filteredProducts = computed(() =>
    this.products().filter(p =>
      p.name.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );
}
```

## 🎯 Quick Checklist

- [ ] Use local state for component-specific data
- [ ] Use services for shared state between components
- [ ] Implement global state for app-wide concerns
- [ ] Use signals for reactive state management
- [ ] Create computed values for derived state
- [ ] Always use immutable update patterns
- [ ] Keep state updates predictable and traceable
- [ ] Use readonly signals for public state access
- [ ] Implement proper error handling in state operations

## 🚀 Next Steps

1. **[Testing](/intermediate/testing/)** - Testing state management logic
2. **[Advanced Patterns](/advanced/ngrx/)** - NgRx for complex applications
3. **[Performance](/advanced/performance/)** - Optimizing state updates

---

**Remember**: Good state management is like good organization - it makes everything easier to find, understand, and maintain. Start simple with signals and grow your patterns as your app becomes more complex! 🗃️
