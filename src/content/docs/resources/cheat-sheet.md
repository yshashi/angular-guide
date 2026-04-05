---
title: Angular Cheat Sheet 📋
description: Quick reference for Angular syntax, APIs, and common patterns
sidebar:
  order: 3
---

A quick-reference card for Angular 21 syntax and APIs. Bookmark this page for when you need to look something up fast.

## 🛠️ CLI Commands

```bash
# Create a new project
ng new my-app

# Generate components, services, etc.
ng generate component features/users/user-list
ng generate service core/auth
ng generate pipe shared/pipes/truncate
ng generate directive shared/directives/highlight
ng generate guard core/auth
ng generate interceptor core/api

# Serve, build, test
ng serve                     # Dev server on localhost:4200
ng build                     # Production build
ng test                      # Unit tests
ng e2e                       # End-to-end tests

# Useful flags
ng serve --port 4300         # Custom port
ng build --configuration=staging
ng generate component my-comp --inline-template --inline-style
```

## 🧩 Component Syntax

```typescript
import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>{{ title() }}</h1>`,
  styles: `h1 { color: blue; }`,
})
export class ExampleComponent {
  // Inputs
  title = input.required<string>();       // required
  count = input(0);                       // with default
  label = input('default', {              // with alias
    alias: 'buttonLabel'
  });

  // Two-way binding
  value = model(0);                       // model signal

  // Outputs
  clicked = output<MouseEvent>();
  closed = output<void>();

  // State
  isOpen = signal(false);

  // Derived state
  displayText = computed(() => `${this.title()} (${this.count()})`);
}
```

## 📝 Template Syntax

### Control Flow

```html
<!-- Conditional -->
@if (user()) {
  <p>Hello, {{ user()!.name }}</p>
} @else if (loading()) {
  <app-spinner />
} @else {
  <p>Please log in.</p>
}

<!-- Loops -->
@for (item of items(); track item.id) {
  <div>{{ $index + 1 }}. {{ item.name }}</div>
} @empty {
  <p>No items found.</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('active') { <span class="badge green">Active</span> }
  @case ('inactive') { <span class="badge red">Inactive</span> }
  @default { <span class="badge gray">Unknown</span> }
}

<!-- Local variable -->
@let fullName = firstName() + ' ' + lastName();
<p>{{ fullName }}</p>
```

### Bindings

```html
<!-- Property binding -->
<input [value]="name()" />
<div [class.active]="isActive()">...</div>
<div [style.color]="textColor()">...</div>
<img [attr.aria-label]="description()" />

<!-- Event binding -->
<button (click)="handleClick()">Click</button>
<input (input)="onInput($event)" />
<form (ngSubmit)="onSubmit()">...</form>

<!-- Two-way binding -->
<input [(ngModel)]="name" />
<app-slider [(value)]="volume" />

<!-- Template reference -->
<input #nameInput />
<button (click)="nameInput.focus()">Focus</button>
```

### Defer Blocks

```html
@defer (on viewport) {
  <app-heavy-widget />
} @placeholder {
  <div>Widget placeholder</div>
} @loading (minimum 200ms) {
  <app-spinner />
} @error {
  <p>Failed to load widget.</p>
}

<!-- Other triggers -->
@defer (on idle) { ... }
@defer (on interaction) { ... }
@defer (on hover) { ... }
@defer (on timer(3s)) { ... }
@defer (when condition()) { ... }
```

## 📡 Signals API

```typescript
import { signal, computed, effect, linkedSignal, untracked } from '@angular/core';

// Writable signal
const count = signal(0);
count();                    // read → 0
count.set(5);               // set
count.update(c => c + 1);   // update based on current

// Computed (read-only, auto-tracked)
const double = computed(() => count() * 2);

// Effect (side effects)
effect(() => {
  console.log('Count is now:', count());
});

// Linked signal (derived + writable)
const selectedIndex = linkedSignal(() => {
  // Re-derives when items change
  return items().length > 0 ? 0 : -1;
});
selectedIndex.set(3);       // can also be set manually

// Untracked reads (don't create dependency)
effect(() => {
  const c = count();
  const name = untracked(() => userName());
  console.log(c, name);
});

// Resource API (async data)
const usersResource = resource({
  request: () => ({ page: currentPage() }),
  loader: async ({ request }) => {
    const res = await fetch(`/api/users?page=${request.page}`);
    return res.json();
  },
});
usersResource.value();      // the data
usersResource.isLoading();  // loading state
usersResource.error();      // error state
usersResource.reload();     // trigger reload
```

## 💉 Dependency Injection

```typescript
// Injectable service
@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly http = inject(HttpClient);
}

// Injection token
const API_URL = new InjectionToken<string>('API_URL');

// inject() options
inject(MyService);                          // required
inject(MyService, { optional: true });      // nullable
inject(MyService, { self: true });          // only from self
inject(MyService, { skipSelf: true });      // skip self, check parent

// Providing values
const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: API_URL, useValue: 'https://api.example.com' },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: Config, useFactory: () => loadConfig() },
    { provide: Token, useExisting: OtherToken },
  ],
};
```

## 🧭 Routing

```typescript
// Route configuration
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  {
    path: 'products/:id',
    component: ProductDetailComponent,
    resolve: { product: productResolver },
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
  },
  { path: '**', component: NotFoundComponent },
];

// Functional guard
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// Functional resolver
export const productResolver: ResolveFn<Product> = (route) => {
  return inject(ProductService).getById(route.paramMap.get('id')!);
};
```

```html
<!-- Template -->
<a routerLink="/products" routerLinkActive="active">Products</a>
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>
<router-outlet />
```

## 📋 Forms

### Reactive Forms

```typescript
@Component({ /* ... */ })
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input formControlName="email" type="email" />
  @if (form.controls.email.errors?.['required']) {
    <span class="error">Email is required</span>
  }

  <input formControlName="password" type="password" />
  <label>
    <input formControlName="rememberMe" type="checkbox" /> Remember me
  </label>

  <button type="submit" [disabled]="form.invalid">Login</button>
</form>
```

## 🌐 HTTP

```typescript
// Using HttpClient
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}

// Using httpResource (Angular 21)
const usersResource = httpResource<User[]>('/api/users');
usersResource.value();       // User[] | undefined
usersResource.isLoading();   // boolean
usersResource.error();       // Error | undefined

// With reactive URL
const userResource = httpResource<User>(() => `/api/users/${userId()}`);

// Functional interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

## 🔄 Lifecycle Hooks

```typescript
export class MyComponent implements OnInit, OnDestroy {
  // In order of execution:
  // constructor        → DI resolution
  // ngOnChanges        → when input bindings change
  // ngOnInit           → after first ngOnChanges
  // ngDoCheck          → every change detection run
  // ngAfterContentInit → after content projection
  // ngAfterContentChecked
  // ngAfterViewInit    → after view initialization
  // ngAfterViewChecked
  // ngOnDestroy        → before component is destroyed

  ngOnInit() { /* one-time setup */ }
  ngOnDestroy() { /* cleanup */ }
}

// Modern alternative — DestroyRef
export class MyComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    someObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => { /* ... */ });
  }
}
```

## 🔧 Built-in Pipes

```html
<!-- Text transforms -->
{{ 'hello' | uppercase }}          <!-- HELLO -->
{{ 'HELLO' | lowercase }}          <!-- hello -->
{{ 'hello world' | titlecase }}    <!-- Hello World -->

<!-- Numbers -->
{{ 3.14159 | number:'1.2-2' }}     <!-- 3.14 -->
{{ 0.85 | percent }}               <!-- 85% -->
{{ 99.99 | currency:'USD' }}       <!-- $99.99 -->

<!-- Dates -->
{{ today | date:'short' }}         <!-- 1/15/25, 3:30 PM -->
{{ today | date:'fullDate' }}      <!-- Wednesday, January 15, 2025 -->
{{ today | date:'yyyy-MM-dd' }}    <!-- 2025-01-15 -->

<!-- Objects -->
{{ myObject | json }}              <!-- JSON string -->
{{ myObject | keyvalue }}          <!-- key-value pairs for @for -->

<!-- Async -->
{{ observable$ | async }}          <!-- unwrap observable -->

<!-- Array -->
{{ items | slice:0:5 }}            <!-- first 5 items -->
```

## 🧪 Testing Quick Reference

```typescript
// Component test setup
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        { provide: MyService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Hello');
  });
});

// Service test
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login', () => {
    service.login({ email: 'a@b.com', password: '123' }).subscribe(user => {
      expect(user.email).toBe('a@b.com');
    });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ email: 'a@b.com', name: 'Test' });
  });
});
```
