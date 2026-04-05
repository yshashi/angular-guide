---
title: Signals Migration 🔄
description: Migrate from RxJS-heavy patterns to Angular Signals
sidebar:
  order: 3
---

Angular Signals provide a simpler, synchronous reactivity model that replaces many patterns previously requiring RxJS. This guide shows you exactly how to migrate each pattern — and when to keep RxJS.

## 🎯 Why Migrate to Signals?

Signals were introduced in Angular 16 and matured through v17–v21. They offer:

- **Simpler mental model** — synchronous reads, no subscriptions to manage
- **Fine-grained reactivity** — Angular tracks exactly which signals each component reads
- **Less boilerplate** — no `subscribe`, `unsubscribe`, `takeUntilDestroyed`, or `async` pipe
- **Better performance** — enables zoneless change detection with precise DOM updates
- **Framework integration** — signal-based `input()`, `output()`, `viewChild()`, and `model()` are first-class

## ⚖️ What to Migrate vs. What to Keep

Not everything should become a signal. Use this decision framework:

| Use Case | Use Signals | Use RxJS |
|----------|:-----------:|:--------:|
| Component state (counters, flags, form values) | ✅ | |
| Derived/computed values | ✅ | |
| Parent → child communication | ✅ (`input()`) | |
| Child → parent communication | ✅ (`output()`) | |
| DOM queries | ✅ (`viewChild()`) | |
| HTTP responses stored as state | ✅ (`resource()`) | |
| Real-time WebSocket streams | | ✅ |
| Complex event orchestration (debounce, retry, race) | | ✅ |
| Router events | | ✅ |
| Multi-source merge/combineLatest | | ✅ |

:::tip
**Rule of thumb:** If the value is synchronous state, use a signal. If the value is an asynchronous event stream, keep RxJS. For HTTP requests, `resource()` and `httpResource()` bridge both worlds.
:::

## 🔁 Migration Patterns

### BehaviorSubject → signal()

This is the most common migration. BehaviorSubjects that hold synchronous state map directly to signals.

**Before:**

```typescript
import { BehaviorSubject } from 'rxjs';

export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  addItem(item: CartItem) {
    const current = this.itemsSubject.value;
    this.itemsSubject.next([...current, item]);
  }

  get itemCount(): number {
    return this.itemsSubject.value.length;
  }
}
```

**After:**

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly itemCount = computed(() => this.items().length);

  addItem(item: CartItem) {
    this.items.update((current) => [...current, item]);
  }
}
```

Reading in a component is equally simplified:

```typescript
// Before: subscribe or async pipe
// <div>{{ items$ | async }}</div>

// After: just call the signal
// <div>{{ cartService.items() }}</div>
```

### combineLatest + map → computed()

When you derive a value from multiple observables, `computed()` replaces `combineLatest` + `map`:

**Before:**

```typescript
import { combineLatest, map } from 'rxjs';

class OrderSummaryComponent {
  total$ = combineLatest([this.cart.items$, this.pricing.tax$]).pipe(
    map(([items, taxRate]) => {
      const subtotal = items.reduce((sum, i) => sum + i.price, 0);
      return subtotal * (1 + taxRate);
    }),
  );
}
```

**After:**

```typescript
import { computed } from '@angular/core';

class OrderSummaryComponent {
  private cart = inject(CartService);
  private pricing = inject(PricingService);

  total = computed(() => {
    const subtotal = this.cart.items().reduce((sum, i) => sum + i.price, 0);
    return subtotal * (1 + this.pricing.tax());
  });
}
```

### Observable + async Pipe → Signal in Template

**Before:**

```typescript
@Component({
  template: `
    <div *ngIf="user$ | async as user">
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    </div>
  `,
})
export class ProfileComponent {
  user$ = this.userService.getCurrentUser();
  constructor(private userService: UserService) {}
}
```

**After with `resource()`:**

```typescript
import { Component, inject, resource } from '@angular/core';
import { UserService } from './user.service';

@Component({
  template: `
    @if (userResource.value(); as user) {
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    }
    @if (userResource.isLoading()) {
      <p>Loading...</p>
    }
    @if (userResource.error()) {
      <p>Error loading user</p>
    }
  `,
})
export class ProfileComponent {
  private userService = inject(UserService);

  userResource = resource({
    loader: () => this.userService.getCurrentUser(),
  });
}
```

:::note
`resource()` returns a `ResourceRef` with `value()`, `isLoading()`, `error()`, and `status()` signals. It handles loading and error states automatically — no custom flags needed.
:::

### @Input() → input()

The `input()` function replaces the `@Input` decorator with a signal-based API.

**Before:**

```typescript
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ displayName }}!</h1>`,
})
export class GreetingComponent implements OnChanges {
  @Input() name = '';
  @Input() title = '';
  displayName = '';

  ngOnChanges(changes: SimpleChanges) {
    this.displayName = this.title ? `${this.title} ${this.name}` : this.name;
  }
}
```

**After:**

```typescript
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ displayName() }}!</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreetingComponent {
  name = input('');
  title = input('');
  displayName = computed(() =>
    this.title() ? `${this.title()} ${this.name()}` : this.name(),
  );
}
```

Key differences:
- `input()` creates a **read-only signal** — call it with `()` to read
- `input.required<string>()` for required inputs (replaces runtime checks)
- `computed()` replaces `ngOnChanges` — it recomputes automatically when inputs change
- `input({ transform: numberAttribute })` for input transforms

### @Output() → output()

**Before:**

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `<input (keyup.enter)="onSearch($event)" />`,
})
export class SearchComponent {
  @Output() search = new EventEmitter<string>();

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }
}
```

**After:**

```typescript
import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `<input (keyup.enter)="onSearch($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  search = output<string>();

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }
}
```

The template binding stays the same: `<app-search (search)="handleSearch($event)" />`.

### @ViewChild() → viewChild()

**Before:**

```typescript
import { Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-canvas',
  template: `<canvas #myCanvas width="400" height="300"></canvas>`,
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    ctx?.fillRect(10, 10, 100, 100);
  }
}
```

**After:**

```typescript
import {
  Component, viewChild, afterNextRender, ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-canvas',
  template: `<canvas #myCanvas width="400" height="300"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent {
  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('myCanvas');

  constructor() {
    afterNextRender(() => {
      const ctx = this.canvasRef().nativeElement.getContext('2d');
      ctx?.fillRect(10, 10, 100, 100);
    });
  }
}
```

### Constructor DI → inject()

**Before:**

```typescript
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from './user.service';

@Component({ ... })
export class UserDetailComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
  ) {}
}
```

**After:**

```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from './user.service';

@Component({ ... })
export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
}
```

## 🌉 Bridge Utilities: toSignal() and toObservable()

For code that must interoperate between signals and RxJS, Angular provides bridge utilities.

### toSignal() — Observable → Signal

Converts an Observable into a read-only signal. Ideal for consuming existing RxJS-based services:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-product',
  template: `<h1>Product ID: {{ productId() }}</h1>`,
})
export class ProductComponent {
  private route = inject(ActivatedRoute);

  productId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: '' },
  );
}
```

:::caution
`toSignal()` subscribes immediately and manages the subscription lifecycle automatically. It must be called in an injection context (constructor, field initializer, or within `runInInjectionContext`).
:::

### toObservable() — Signal → Observable

Converts a signal into an Observable. Useful when a downstream API requires an Observable:

```typescript
import { signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, debounceTime } from 'rxjs';

const searchTerm = signal('');

const results$ = toObservable(searchTerm).pipe(
  debounceTime(300),
  switchMap((term) => this.searchService.search(term)),
);
```

## 📈 Gradual Migration Strategy

You don't have to migrate everything at once. Here's a phased approach:

### Phase 1: New Code Uses Signals

Write all new components and services with signals from day one. Use `inject()`, `input()`, `output()`, and `signal()`.

### Phase 2: Migrate Leaf Components

Start with simple, isolated components that have minimal dependencies. These are easiest to migrate and lowest risk.

### Phase 3: Migrate Shared Services

Convert `BehaviorSubject` state in services to `signal()`. Use `computed()` for derived values. Components consuming these services get simpler automatically.

### Phase 4: Migrate Complex Components

Tackle components with `ngOnChanges`, lifecycle hooks, and complex subscription management last. Use `computed()`, `effect()`, and `resource()` to simplify them.

### Phase 5: Use Automated Schematics

Angular CLI provides migration schematics for bulk changes:

```bash
# Migrate @Input to input()
ng generate @angular/core:signal-input

# Migrate @Output to output()
ng generate @angular/core:output

# Migrate @ViewChild/@ContentChild to viewChild()/contentChild()
ng generate @angular/core:signal-queries

# Migrate constructor injection to inject()
ng generate @angular/core:inject
```

:::tip
Run schematics with `--dry-run` first, then review the changes before committing. The schematics handle most cases correctly but may need manual fixes for complex patterns.
:::

## ✅ Migration Checklist

- [ ] All new components use `signal()`, `computed()`, `input()`, `output()`
- [ ] `BehaviorSubject` state holders converted to `signal()`
- [ ] `combineLatest` + `map` derivations replaced with `computed()`
- [ ] `@Input` decorators migrated to `input()` / `input.required()`
- [ ] `@Output` decorators migrated to `output()`
- [ ] `@ViewChild` / `@ContentChild` migrated to `viewChild()` / `contentChild()`
- [ ] Constructor injection replaced with `inject()`
- [ ] `ngOnChanges` replaced with `computed()` or `effect()`
- [ ] `async` pipe usages replaced with signal reads or `resource()`
- [ ] RxJS retained only where truly needed (streams, complex async orchestration)
- [ ] All tests pass after migration
