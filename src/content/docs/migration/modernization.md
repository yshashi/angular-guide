---
title: Codebase Modernization 🚀
description: Comprehensive guide to modernizing legacy Angular codebases to Angular 21
sidebar:
  order: 4
---

Modernizing a legacy Angular codebase isn't a weekend project — it's a structured, phased effort. This guide gives you a prioritized roadmap with concrete before/after examples for every pattern, so your team can modernize incrementally without breaking production.

## 🎯 Assessment: Identify Legacy Patterns

Before writing a single line of migration code, audit your codebase to understand its current state. Run these commands to quantify the work ahead:

```bash
# Count NgModule files
grep -rl "@NgModule" src/ --include="*.ts" | wc -l

# Count class-based @Input/@Output decorators
grep -rl "@Input()" src/ --include="*.ts" | wc -l
grep -rl "@Output()" src/ --include="*.ts" | wc -l

# Count constructor injection patterns
grep -rl "constructor(" src/ --include="*.ts" | wc -l

# Count old structural directives
grep -rl "\*ngIf" src/ --include="*.ts" --include="*.html" | wc -l
grep -rl "\*ngFor" src/ --include="*.ts" --include="*.html" | wc -l

# Count BehaviorSubject usage
grep -rl "BehaviorSubject" src/ --include="*.ts" | wc -l

# Count components without OnPush
grep -rl "ChangeDetectionStrategy.Default" src/ --include="*.ts" | wc -l
```

:::tip
Create a spreadsheet or tracking issue with these numbers. Re-run the counts after each migration phase to measure progress. Seeing the numbers shrink is motivating for the team.
:::

## 📋 Modernization Priority Order

Follow this order — each step builds on the previous one:

| Priority | Migration | Automated Schematic | Risk Level |
|----------|-----------|:-------------------:|:----------:|
| 1 | Standalone components | `@angular/core:standalone` | Low |
| 2 | Control flow (`@if`/`@for`) | `@angular/core:control-flow` | Low |
| 3 | `inject()` function | `@angular/core:inject` | Low |
| 4 | Signal inputs/outputs | `@angular/core:signal-input`, `@angular/core:output` | Medium |
| 5 | Signal queries | `@angular/core:signal-queries` | Medium |
| 6 | Signals for state | Manual | Medium |
| 7 | OnPush everywhere | Manual | Low |
| 8 | Zoneless preparation | Manual | High |

:::note
Start with the low-risk, high-tooling migrations at the top. These have automated schematics and are unlikely to introduce bugs. Save manual, higher-risk migrations for later.
:::

## 1️⃣ Standalone Migration

This is the foundation — all other modernizations become easier once NgModules are removed.

**Before:**

```typescript
// app.module.ts
@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**After:**

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
});
```

```bash
# Automated migration
ng generate @angular/core:standalone
```

See the [Standalone Migration](/migration/standalone/) guide for detailed steps.

## 2️⃣ Control Flow Migration

Replace `*ngIf`, `*ngFor`, and `*ngSwitch` with the built-in `@if`, `@for`, and `@switch` syntax.

**Before:**

```html
<div *ngIf="users.length > 0; else empty">
  <div *ngFor="let user of users; trackBy: trackById">
    <span *ngIf="user.active">{{ user.name }}</span>
  </div>
</div>
<ng-template #empty>
  <p>No users found</p>
</ng-template>
```

**After:**

```html
@if (users().length > 0) {
  @for (user of users(); track user.id) {
    @if (user.active) {
      <span>{{ user.name }}</span>
    }
  } @empty {
    <p>No users found</p>
  }
} @else {
  <p>No users found</p>
}
```

Key benefits:
- No need to import `CommonModule` or `NgIf`/`NgFor` directives
- `@for` **requires** a `track` expression (better performance by default)
- `@empty` block is built into `@for` — no need for separate templates

```bash
# Automated migration
ng generate @angular/core:control-flow
```

The `@switch` replacement:

**Before:**

```html
<div [ngSwitch]="status">
  <span *ngSwitchCase="'active'">Active</span>
  <span *ngSwitchCase="'inactive'">Inactive</span>
  <span *ngSwitchDefault>Unknown</span>
</div>
```

**After:**

```html
@switch (status()) {
  @case ('active') { <span>Active</span> }
  @case ('inactive') { <span>Inactive</span> }
  @default { <span>Unknown</span> }
}
```

## 3️⃣ inject() Function

Replace constructor-based dependency injection with the `inject()` function.

**Before:**

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-product', template: `...` })
export class ProductComponent {
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe((p) => this.loadProduct(p['id']));
  }

  private loadProduct(id: string) { /* ... */ }
}
```

**After:**

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-product', template: `...` })
export class ProductComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.route.params.subscribe((p) => this.loadProduct(p['id']));
  }

  private loadProduct(id: string) { /* ... */ }
}
```

```bash
# Automated migration
ng generate @angular/core:inject
```

Benefits of `inject()`:
- Works in functions, not just classes — enables utility functions with DI
- No need to declare types twice (parameter type + assignment)
- Easier to use with inheritance (no `super()` constructor chaining)

## 4️⃣ Signal Inputs and Outputs

Replace decorator-based `@Input()` and `@Output()` with signal-based `input()` and `output()`.

**Before:**

```typescript
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h3>{{ fullName }}</h3>
      <span class="role">{{ role }}</span>
      <button (click)="onSelect()">Select</button>
    </div>
  `,
})
export class UserCardComponent implements OnChanges {
  @Input() firstName = '';
  @Input() lastName = '';
  @Input() role = 'user';
  @Output() selected = new EventEmitter<string>();

  fullName = '';

  ngOnChanges() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }

  onSelect() {
    this.selected.emit(this.fullName);
  }
}
```

**After:**

```typescript
import {
  Component, input, output, computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h3>{{ fullName() }}</h3>
      <span class="role">{{ role() }}</span>
      <button (click)="onSelect()">Select</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  firstName = input('');
  lastName = input('');
  role = input('user');
  selected = output<string>();

  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

  onSelect() {
    this.selected.emit(this.fullName());
  }
}
```

```bash
# Automated migration
ng generate @angular/core:signal-input
ng generate @angular/core:output
```

## 5️⃣ Signal Queries

Replace `@ViewChild`, `@ViewChildren`, `@ContentChild`, and `@ContentChildren` with their signal equivalents.

**Before:**

```typescript
import { Component, ViewChild, ViewChildren, AfterViewInit, QueryList, ElementRef } from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-dashboard',
  template: `
    <input #searchInput />
    <app-chart *ngFor="let data of datasets" [data]="data" />
  `,
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren(ChartComponent) charts!: QueryList<ChartComponent>;

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
    this.charts.forEach((chart) => chart.render());
  }
}
```

**After:**

```typescript
import {
  Component, viewChild, viewChildren, afterNextRender,
  ElementRef, ChangeDetectionStrategy,
} from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-dashboard',
  template: `
    <input #searchInput />
    @for (data of datasets(); track data.id) {
      <app-chart [data]="data" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  charts = viewChildren(ChartComponent);

  constructor() {
    afterNextRender(() => {
      this.searchInput().nativeElement.focus();
      this.charts().forEach((chart) => chart.render());
    });
  }
}
```

```bash
# Automated migration
ng generate @angular/core:signal-queries
```

## 6️⃣ Signals for Component State

Replace imperative state management with signals. This is a manual migration — no schematic exists because every component is unique.

**Before:**

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count }}</p>
    <p>Double: {{ count * 2 }}</p>
    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `,
})
export class CounterComponent {
  count = 0;

  increment() { this.count++; }
  decrement() { this.count--; }
  reset() { this.count = 0; }
}
```

**After:**

```typescript
import {
  Component, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment() { this.count.update((c) => c + 1); }
  decrement() { this.count.update((c) => c - 1); }
  reset() { this.count.set(0); }
}
```

For services with BehaviorSubject state, see the [Signals Migration](/migration/signals/) guide.

## 7️⃣ OnPush Change Detection Everywhere

With signals and signal inputs, `OnPush` becomes safe to use everywhere. It prevents unnecessary change detection cycles by only checking when inputs change or signals are read.

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush, // add this
})
export class MyComponent {}
```

:::caution
If your component mutates objects or arrays in place (without creating new references), `OnPush` may miss changes. Fix mutations first:

```typescript
// ❌ Mutation — OnPush won't detect this
this.items.push(newItem);

// ✅ New reference — OnPush detects this
this.items = [...this.items, newItem];

// ✅ Even better — use signals
this.items.update((list) => [...list, newItem]);
```
:::

## 8️⃣ Zoneless Preparation

Angular 20+ defaults to zoneless for new projects. Preparing your existing app for zoneless ensures you can remove `zone.js` and get the best performance.

### Step 1: Enable Zoneless Experimentally

```typescript
// main.ts
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    // ... other providers
  ],
});
```

### Step 2: Remove zone.js

```typescript
// angular.json — remove zone.js from polyfills
{
  "polyfills": []
}
```

### Step 3: Ensure All State Uses Signals

Zoneless change detection relies on signals to know when to re-render. Ensure:
- All component state is in signals
- All inputs use `input()`
- All template expressions read signals
- `OnPush` is set on every component
- No direct DOM manipulation outside of Angular's awareness

## 📊 Measuring Improvement

Track these metrics before and after each migration phase:

### Bundle Size

```bash
# Build with stats
ng build --stats-json

# Analyze with source-map-explorer
npx source-map-explorer dist/browser/*.js
```

### Build Time

```bash
# Time the build
time ng build
```

### Runtime Performance

Use Angular DevTools (Chrome extension) to profile:
- Change detection cycle count
- Component render time
- Signal graph visualization

## 🗓️ Timeline for Large Codebases

For a large application (500+ components), here's a realistic timeline:

| Phase | Duration | Approach |
|-------|----------|----------|
| Standalone migration | 1–2 weeks | Automated schematic + manual fixes |
| Control flow | 1 week | Automated schematic |
| `inject()` migration | 1 week | Automated schematic |
| Signal inputs/outputs | 2–3 weeks | Schematic + manual review |
| Signal queries | 1 week | Schematic + manual review |
| Signals for state | 3–4 weeks | Manual, component by component |
| OnPush everywhere | 1–2 weeks | Manual, test carefully |
| Zoneless preparation | 2–4 weeks | Manual, needs thorough testing |

:::tip
Don't block feature work on modernization. Establish a **boy scout rule**: every time you touch a file, modernize it. This creates steady progress without dedicated migration sprints.
:::

## 🤖 Running All Schematics

Here's the complete set of automated migration commands in recommended order:

```bash
# 1. Standalone migration (3 phases)
ng generate @angular/core:standalone --mode=convert-to-standalone
ng generate @angular/core:standalone --mode=prune-modules
ng generate @angular/core:standalone --mode=standalone-bootstrap

# 2. Control flow
ng generate @angular/core:control-flow

# 3. Inject function
ng generate @angular/core:inject

# 4. Signal inputs
ng generate @angular/core:signal-input

# 5. Signal outputs
ng generate @angular/core:output

# 6. Signal queries
ng generate @angular/core:signal-queries
```

:::caution
Run `ng build` and your test suite after **each** schematic. Do not batch all schematics together — if something breaks, you need to know which migration caused it.
:::

## ✅ Final Modernization Checklist

- [ ] Zero `@NgModule` declarations (except third-party wrappers)
- [ ] All templates use `@if`, `@for`, `@switch` — no `*ngIf`/`*ngFor`/`*ngSwitch`
- [ ] All DI uses `inject()` — no constructor parameters for injection
- [ ] All inputs use `input()` / `input.required()`
- [ ] All outputs use `output()`
- [ ] All view/content queries use `viewChild()` / `contentChild()` / `viewChildren()` / `contentChildren()`
- [ ] Component state uses `signal()` and `computed()`
- [ ] All components use `ChangeDetectionStrategy.OnPush`
- [ ] `zone.js` removed, using `provideZonelessChangeDetection()`
- [ ] Bundle size reduced compared to pre-migration baseline
- [ ] All tests pass
- [ ] Performance benchmarks maintained or improved
