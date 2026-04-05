---
title: Angular Best Practices ✅
description: Essential Angular best practices for building maintainable, performant, and scalable applications
sidebar:
  order: 1
---

Following consistent best practices is the difference between an Angular app that scales gracefully and one that becomes a maintenance nightmare. This guide covers the essential patterns and conventions recommended for Angular 21 applications.

## 🧩 Component Best Practices

### Keep Components Small and Focused

Each component should have a single responsibility. If a component grows beyond ~100 lines of template, it's time to extract child components.

```typescript
// ✅ Good — focused component
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      [src]="avatarUrl()"
      [alt]="name() + ' avatar'"
      class="avatar"
      [class.large]="size() === 'large'"
    />
  `,
})
export class UserAvatarComponent {
  name = input.required<string>();
  size = input<'small' | 'medium' | 'large'>('medium');

  private readonly baseUrl = 'https://api.example.com/avatars';

  avatarUrl = computed(() => `${this.baseUrl}/${this.name()}.png`);
}
```

### Always Use OnPush Change Detection

OnPush tells Angular to only check the component when its inputs change or a signal updates. This dramatically improves performance.

```typescript
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush, // always set this
  template: `
    <div class="card">
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
      <button (click)="addToCart.emit(product())">Add to Cart</button>
    </div>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
  addToCart = output<Product>();
}
```

### Use Signals for Component State

Signals provide fine-grained reactivity and work beautifully with OnPush change detection.

```typescript
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ doubleCount() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }

  decrement() {
    this.count.update(c => c - 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### Use `input()` and `output()` Functions

The function-based API is type-safe and integrates naturally with signals.

```typescript
// ✅ Good — function-based inputs and outputs
export class TodoItemComponent {
  todo = input.required<Todo>();
  editable = input(false);

  toggled = output<Todo>();
  deleted = output<string>();
}

// ❌ Bad — decorator-based (legacy)
export class TodoItemComponent {
  @Input() todo!: Todo;
  @Input() editable = false;

  @Output() toggled = new EventEmitter<Todo>();
  @Output() deleted = new EventEmitter<string>();
}
```

## 🏗️ Service Best Practices

### Use `providedIn: 'root'` for Singleton Services

This makes the service tree-shakable — if no component injects it, it's removed from the bundle.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  login(credentials: LoginCredentials) {
    return this.http.post<User>('/api/auth/login', credentials).pipe(
      tap(user => this.currentUser.set(user)),
    );
  }

  logout() {
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
```

### Use `inject()` Instead of Constructor Injection

The `inject()` function is more concise and works in any injection context.

```typescript
// ✅ Good — inject() function
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
}

// ❌ Bad — constructor injection (verbose)
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}
}
```

### Expose Read-Only Signals from Services

Prevent external code from modifying internal state by exposing readonly signals.

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartItem[]>([]);

  // Expose readonly versions
  readonly cartItems = this.items.asReadonly();
  readonly totalPrice = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  addItem(product: Product) {
    this.items.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        return items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { productId: product.id, price: product.price, quantity: 1 }];
    });
  }

  removeItem(productId: string) {
    this.items.update(items => items.filter(i => i.productId !== productId));
  }
}
```

## 📝 Template Best Practices

### Use Native Control Flow

Always use the built-in `@if`, `@for`, and `@switch` blocks instead of structural directives.

```html
<!-- ✅ Good — native control flow -->
@if (user()) {
  <app-user-profile [user]="user()!" />
} @else {
  <app-login-prompt />
}

@for (item of items(); track item.id) {
  <app-list-item [item]="item" />
} @empty {
  <p>No items found.</p>
}

<!-- ❌ Bad — structural directives -->
<app-user-profile *ngIf="user$ | async as user" [user]="user" />
<app-list-item *ngFor="let item of items; trackBy: trackById" [item]="item" />
```

### Always Use `track` in `@for`

The `track` expression is required and enables efficient DOM updates.

```html
<!-- Track by unique identifier — best for most cases -->
@for (product of products(); track product.id) {
  <app-product-card [product]="product" />
}

<!-- Track by index — only when items have no unique ID -->
@for (item of simpleList(); track $index) {
  <span>{{ item }}</span>
}
```

### Avoid Complex Logic in Templates

Move calculations to `computed()` signals or component methods.

```typescript
// ✅ Good — logic in computed signal
filteredProducts = computed(() =>
  this.products().filter(p => p.price <= this.maxPrice())
);

// Template is clean:
// @for (product of filteredProducts(); track product.id) { ... }

// ❌ Bad — complex logic in template
// @for (product of products().filter(p => p.price <= maxPrice()); track product.id) { ... }
```

## ⚡ Performance Best Practices

### Lazy Load Feature Routes

Split your app into lazy-loaded feature routes to reduce the initial bundle size.

```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list.component')
        .then(m => m.ProductListComponent),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes')
        .then(m => m.adminRoutes),
    canActivate: [authGuard],
  },
];
```

### Use `@defer` for Heavy Components

Defer blocks let you lazy-load parts of a template based on triggers.

```html
<!-- Load when visible in viewport -->
@defer (on viewport) {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-skeleton">Loading chart...</div>
} @loading (minimum 300ms) {
  <app-spinner />
}

<!-- Load on interaction -->
@defer (on interaction) {
  <app-comment-section [postId]="post().id" />
} @placeholder {
  <button>Load Comments</button>
}
```

### Use `NgOptimizedImage` for Images

The `NgOptimizedImage` directive optimizes image loading with lazy loading, priority hints, and size warnings.

```html
<!-- Priority image (above the fold) -->
<img ngSrc="/assets/hero.jpg" width="1200" height="600" priority />

<!-- Lazy-loaded image (default behavior) -->
<img ngSrc="/assets/product.jpg" width="400" height="300" />
```

:::tip
Always set `priority` on your Largest Contentful Paint (LCP) image — typically the hero image or main product image.
:::

## 🏛️ Architecture Best Practices

### Feature-Based Folder Structure

Organize code by feature, not by type. Each feature folder contains its own components, services, and routes.

```
src/app/
├── core/                  # Singleton services, guards, interceptors
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   └── api.interceptor.ts
├── shared/                # Reusable components, pipes, directives
│   ├── components/
│   ├── pipes/
│   └── directives/
├── features/
│   ├── products/
│   │   ├── product-list.component.ts
│   │   ├── product-detail.component.ts
│   │   ├── product.service.ts
│   │   └── products.routes.ts
│   ├── cart/
│   │   ├── cart.component.ts
│   │   ├── cart-item.component.ts
│   │   ├── cart.service.ts
│   │   └── cart.routes.ts
│   └── admin/
│       └── ...
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

### Use Environment-Specific Configuration

Leverage Angular's `APP_INITIALIZER` or injection tokens for runtime configuration.

```typescript
// config.token.ts
export interface AppConfig {
  apiUrl: string;
  production: boolean;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        apiUrl: environment.apiUrl,
        production: environment.production,
      } satisfies AppConfig,
    },
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
};
```

## 🛡️ Error Handling Best Practices

### Use HTTP Interceptors for Global Error Handling

Centralize error handling with a functional interceptor.

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          router.navigate(['/login']);
          break;
        case 403:
          notification.error('You do not have permission to perform this action.');
          break;
        case 404:
          notification.error('The requested resource was not found.');
          break;
        case 500:
          notification.error('A server error occurred. Please try again later.');
          break;
      }
      return throwError(() => error);
    }),
  );
};
```

### Handle Errors in Components Gracefully

Always account for error states in your templates.

```typescript
@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="error-banner">
        <p>{{ error() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else if (loading()) {
      <app-skeleton-loader />
    } @else if (user()) {
      <h2>{{ user()!.name }}</h2>
      <p>{{ user()!.email }}</p>
    }
  `,
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);

  userId = input.required<string>();

  user = signal<User | null>(null);
  error = signal<string | null>(null);
  loading = signal(true);

  constructor() {
    effect(() => {
      this.loadUser(this.userId());
    });
  }

  private loadUser(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUser(id).subscribe({
      next: user => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load user profile.');
        this.loading.set(false);
      },
    });
  }

  retry() {
    this.loadUser(this.userId());
  }
}
```

## ♿ Accessibility Best Practices

### Use Semantic HTML and ARIA Attributes

Angular components should produce accessible HTML. Use the `host` property in decorators for host-level ARIA bindings.

```typescript
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'alert',
    '[attr.aria-live]': 'polite',
  },
  template: `
    <div [class]="'alert alert-' + type()">
      <ng-content />
    </div>
  `,
})
export class AlertComponent {
  type = input<'info' | 'warning' | 'error'>('info');
}
```

### Manage Focus for Dynamic Content

When content changes dynamically (modals, route changes), manage focus programmatically.

```typescript
@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label for="search-input">Search</label>
    <input
      id="search-input"
      type="search"
      [attr.aria-expanded]="showResults()"
      aria-controls="search-results"
      (input)="onSearch($event)"
    />
    @if (showResults()) {
      <ul id="search-results" role="listbox">
        @for (result of results(); track result.id) {
          <li role="option">{{ result.name }}</li>
        }
      </ul>
    }
  `,
})
export class SearchComponent {
  results = signal<SearchResult[]>([]);
  showResults = computed(() => this.results().length > 0);

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    // search logic...
  }
}
```

:::caution
Never remove focus outlines (`outline: none`) without providing an alternative visible focus indicator. This breaks keyboard navigation for users who rely on it.
:::

## 📋 Quick Summary

| Practice | Do | Don't |
|---|---|---|
| **Change Detection** | `OnPush` always | Default change detection |
| **State** | Signals + `computed()` | Manual change detection |
| **Inputs/Outputs** | `input()` / `output()` | `@Input` / `@Output` |
| **DI** | `inject()` function | Constructor injection |
| **Control Flow** | `@if` / `@for` / `@switch` | `*ngIf` / `*ngFor` |
| **Services** | `providedIn: 'root'` | Module-level providers |
| **Images** | `NgOptimizedImage` | Plain `<img>` tags |
| **Styling** | `class` / `style` bindings | `ngClass` / `ngStyle` |
| **Host bindings** | `host` property | `@HostBinding` / `@HostListener` |
