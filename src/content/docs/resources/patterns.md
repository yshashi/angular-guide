---
title: Angular Design Patterns 🏗️
description: Common design patterns for building scalable Angular applications
sidebar:
  order: 2
---

Design patterns provide reusable solutions to common software design challenges. In Angular, these patterns leverage dependency injection, signals, and the component model to create clean, maintainable architectures.

## 🎭 Smart/Dumb Component Pattern

Also known as **Container/Presentational**, this is the most fundamental Angular pattern. Smart components manage data and logic; dumb components only render UI based on inputs.

### Dumb (Presentational) Component

```typescript
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product-card">
      <img [ngSrc]="product().image" [alt]="product().name" width="200" height="200" />
      <h3>{{ product().name }}</h3>
      <p class="price">{{ product().price | currency }}</p>
      <button (click)="addToCart.emit(product())">Add to Cart</button>
    </div>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
  addToCart = output<Product>();
}
```

### Smart (Container) Component

```typescript
@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent],
  template: `
    @for (product of products(); track product.id) {
      <app-product-card
        [product]="product"
        (addToCart)="onAddToCart($event)"
      />
    } @empty {
      <p>No products available.</p>
    }
  `,
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  products = this.productService.products;

  onAddToCart(product: Product) {
    this.cartService.addItem(product);
  }
}
```

:::tip
A good rule of thumb: dumb components have **zero** injected services. They communicate exclusively through `input()` and `output()`.
:::

## 🎭 Facade Pattern

A facade service provides a simplified interface to a complex subsystem. In Angular, facades sit between components and multiple lower-level services, exposing a clean API of signals and methods.

```typescript
@Injectable({ providedIn: 'root' })
export class CheckoutFacade {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly notification = inject(NotificationService);

  // Expose unified state as readonly signals
  readonly cartItems = this.cartService.items;
  readonly total = this.cartService.totalPrice;
  readonly isProcessing = signal(false);
  readonly checkoutError = signal<string | null>(null);

  readonly canCheckout = computed(
    () => this.cartItems().length > 0 && !this.isProcessing()
  );

  async checkout(paymentDetails: PaymentDetails): Promise<boolean> {
    this.isProcessing.set(true);
    this.checkoutError.set(null);

    try {
      const paymentResult = await firstValueFrom(
        this.paymentService.processPayment(paymentDetails, this.total())
      );

      const order = await firstValueFrom(
        this.orderService.createOrder(this.cartItems(), paymentResult.transactionId)
      );

      this.cartService.clear();
      this.notification.success(`Order ${order.id} placed successfully!`);
      return true;
    } catch (err) {
      this.checkoutError.set('Checkout failed. Please try again.');
      return false;
    } finally {
      this.isProcessing.set(false);
    }
  }
}
```

The component stays thin by delegating to the facade:

```typescript
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Checkout</h2>
    @if (facade.checkoutError()) {
      <div class="error">{{ facade.checkoutError() }}</div>
    }
    <app-cart-summary [items]="facade.cartItems()" [total]="facade.total()" />
    <app-payment-form
      [disabled]="!facade.canCheckout() || facade.isProcessing()"
      (submitted)="onSubmit($event)"
    />
    @if (facade.isProcessing()) {
      <app-spinner />
    }
  `,
})
export class CheckoutComponent {
  protected readonly facade = inject(CheckoutFacade);

  async onSubmit(payment: PaymentDetails) {
    const success = await this.facade.checkout(payment);
    if (success) {
      inject(Router).navigate(['/order-confirmation']);
    }
  }
}
```

## 🔀 Strategy Pattern with DI

Use Angular's dependency injection to swap implementations at runtime or test time. Define a common interface with an injection token, then provide different strategies.

```typescript
// Define the strategy interface and token
export interface PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number;
}

export const PRICING_STRATEGY = new InjectionToken<PricingStrategy>('PricingStrategy');

// Strategy implementations
@Injectable()
export class RegularPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number {
    return basePrice * quantity;
  }
}

@Injectable()
export class BulkPricingStrategy implements PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number {
    const discount = quantity >= 10 ? 0.15 : quantity >= 5 ? 0.1 : 0;
    return basePrice * quantity * (1 - discount);
  }
}

@Injectable()
export class PremiumPricingStrategy implements PricingStrategy {
  private readonly authService = inject(AuthService);

  calculatePrice(basePrice: number, quantity: number): number {
    const memberDiscount = this.authService.isPremiumMember() ? 0.2 : 0;
    return basePrice * quantity * (1 - memberDiscount);
  }
}
```

Provide the strategy at the route or component level:

```typescript
// In route configuration — different pricing per route
export const routes: Routes = [
  {
    path: 'shop',
    component: ShopComponent,
    providers: [
      { provide: PRICING_STRATEGY, useClass: RegularPricingStrategy },
    ],
  },
  {
    path: 'wholesale',
    component: ShopComponent,
    providers: [
      { provide: PRICING_STRATEGY, useClass: BulkPricingStrategy },
    ],
  },
];
```

The consuming service doesn't care which strategy it gets:

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly pricing = inject(PRICING_STRATEGY);

  getItemTotal(item: CartItem): number {
    return this.pricing.calculatePrice(item.basePrice, item.quantity);
  }
}
```

## 📡 Observer Pattern with Signals

Signals provide a built-in reactive observer pattern. Use `signal()`, `computed()`, and `effect()` to create reactive data flows without manual subscriptions.

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(LocalStorageService);

  // Source signal
  private readonly _theme = signal<'light' | 'dark'>(
    this.storage.get('theme') ?? 'light'
  );

  // Public readonly access
  readonly theme = this._theme.asReadonly();

  // Derived signals — automatically update when theme changes
  readonly isDark = computed(() => this._theme() === 'dark');
  readonly icon = computed(() => (this.isDark() ? '🌙' : '☀️'));
  readonly cssClass = computed(() => `theme-${this._theme()}`);

  constructor() {
    // Side effect — persist theme changes to localStorage
    effect(() => {
      this.storage.set('theme', this._theme());
      document.body.className = this.cssClass();
    });
  }

  toggle() {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: 'light' | 'dark') {
    this._theme.set(theme);
  }
}
```

Components that inject `ThemeService` automatically react to changes:

```typescript
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="themeService.toggle()" [attr.aria-label]="'Switch to ' + nextTheme() + ' mode'">
      {{ themeService.icon() }}
    </button>
  `,
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly nextTheme = computed(() =>
    this.themeService.isDark() ? 'light' : 'dark'
  );
}
```

## 🗄️ Repository Pattern

The repository pattern abstracts data access behind a clean interface. This decouples your components and facades from the specifics of HTTP calls, caching, and data transformation.

```typescript
// Abstract repository
export abstract class ProductRepository {
  abstract getAll(): Observable<Product[]>;
  abstract getById(id: string): Observable<Product>;
  abstract search(query: string): Observable<Product[]>;
}

// HTTP implementation
@Injectable()
export class HttpProductRepository extends ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getAll(): Observable<Product[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products`).pipe(
      map(dtos => dtos.map(this.toProduct)),
    );
  }

  getById(id: string): Observable<Product> {
    return this.http.get<ProductDto>(`${this.apiUrl}/products/${id}`).pipe(
      map(this.toProduct),
    );
  }

  search(query: string): Observable<Product[]> {
    return this.http
      .get<ProductDto[]>(`${this.apiUrl}/products`, { params: { q: query } })
      .pipe(map(dtos => dtos.map(this.toProduct)));
  }

  private toProduct(dto: ProductDto): Product {
    return {
      id: dto.id,
      name: dto.name,
      price: dto.price_cents / 100,
      imageUrl: dto.image_url,
    };
  }
}

// Register in app config
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ProductRepository, useClass: HttpProductRepository },
    // Swap to MockProductRepository for testing
  ],
};
```

:::note
The repository pattern is especially useful when your API returns DTOs that differ from your domain models. The repository handles the mapping, keeping the rest of your app clean.
:::

## 🔗 Mediator Pattern with Services

A mediator service coordinates communication between components that don't know about each other. This avoids tight coupling through parent-child chains.

```typescript
// Event types
export interface AppEvent {
  type: string;
  payload?: unknown;
}

export interface ProductSelected extends AppEvent {
  type: 'product-selected';
  payload: Product;
}

export interface CartUpdated extends AppEvent {
  type: 'cart-updated';
  payload: { itemCount: number };
}

type EventMap = {
  'product-selected': Product;
  'cart-updated': { itemCount: number };
  'filter-changed': FilterCriteria;
};

// Mediator service
@Injectable({ providedIn: 'root' })
export class EventBusService {
  private readonly subjects = new Map<string, Subject<unknown>>();

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.getSubject(event).next(payload);
  }

  on<K extends keyof EventMap>(event: K): Observable<EventMap[K]> {
    return this.getSubject(event).asObservable() as Observable<EventMap[K]>;
  }

  private getSubject(event: string): Subject<unknown> {
    if (!this.subjects.has(event)) {
      this.subjects.set(event, new Subject<unknown>());
    }
    return this.subjects.get(event)!;
  }
}
```

Components communicate through the mediator without direct references:

```typescript
// Sender component
@Component({ /* ... */ })
export class ProductListComponent {
  private readonly eventBus = inject(EventBusService);

  selectProduct(product: Product) {
    this.eventBus.emit('product-selected', product);
  }
}

// Receiver component
@Component({ /* ... */ })
export class ProductDetailPanelComponent {
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);

  selectedProduct = signal<Product | null>(null);

  constructor() {
    this.eventBus
      .on('product-selected')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(product => this.selectedProduct.set(product));
  }
}
```

## 🏭 Builder Pattern for Forms

Use a builder service to construct complex reactive forms with consistent validation, keeping component code clean.

```typescript
@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  private readonly fb = inject(FormBuilder);

  buildAddressForm(defaults?: Partial<Address>): FormGroup {
    return this.fb.group({
      street: [defaults?.street ?? '', [Validators.required, Validators.minLength(3)]],
      city: [defaults?.city ?? '', Validators.required],
      state: [defaults?.state ?? '', Validators.required],
      zip: [defaults?.zip ?? '', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: [defaults?.country ?? 'US', Validators.required],
    });
  }

  buildUserRegistrationForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
      address: this.buildAddressForm(),
      preferences: this.fb.group({
        newsletter: [true],
        theme: ['light'],
      }),
    });
  }

  private passwordStrength(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    const valid = hasUpper && hasLower && hasNumber;
    return valid ? null : { passwordStrength: true };
  }
}
```

The component uses the builder to create forms declaratively:

```typescript
@Component({
  selector: 'app-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Full Name" />
      <input formControlName="email" type="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />

      <fieldset formGroupName="address">
        <legend>Address</legend>
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
        <input formControlName="state" placeholder="State" />
        <input formControlName="zip" placeholder="ZIP Code" />
      </fieldset>

      <button type="submit" [disabled]="form.invalid">Register</button>
    </form>
  `,
})
export class RegistrationComponent {
  private readonly formBuilderService = inject(FormBuilderService);

  form = this.formBuilderService.buildUserRegistrationForm();

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

## 📋 Pattern Selection Guide

| Pattern | Use When | Complexity |
|---|---|---|
| **Smart/Dumb** | Always — for any component with UI | Low |
| **Facade** | Multiple services needed by a feature | Medium |
| **Strategy** | Swappable algorithms or behaviors | Medium |
| **Observer (Signals)** | Reactive state that multiple consumers read | Low |
| **Repository** | Data access that needs abstraction/caching | Medium |
| **Mediator** | Sibling components need to communicate | Medium |
| **Builder** | Complex object/form construction | Low |

:::tip
Start with Smart/Dumb and Observer (Signals) — they cover most needs. Add Facade when a component injects more than 2-3 services. Reach for Strategy and Repository when you need testability and flexibility.
:::
