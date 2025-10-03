---
title: Performance Optimization ⚡
description: Optimize Angular applications for maximum performance - change detection, lazy loading, and rendering strategies
sidebar:
  order: 8
---

Performance optimization is crucial for delivering fast, responsive Angular applications. Master techniques to reduce load times, improve runtime performance, and enhance user experience.

## 🎯 Performance Fundamentals

**Key Metrics:**
- **FCP** (First Contentful Paint) - Time to first content
- **LCP** (Largest Contentful Paint) - Main content load time
- **TTI** (Time to Interactive) - When app becomes interactive
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FID** (First Input Delay) - Interactivity responsiveness

**Optimization Areas:**
- Bundle size reduction
- Change detection optimization
- Lazy loading strategies
- Rendering performance
- Memory management

## 🚀 Change Detection Optimization

### OnPush Change Detection

```typescript
import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

// ✅ OnPush - Only checks when inputs change or events fire
@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
    </div>
  `
})
export class UserCardComponent {
  user = input.required<User>();
}
```

### Signals for Fine-Grained Reactivity

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2>Count: {{ count() }}</h2>
      <p>Double: {{ doubled() }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `
})
export class DashboardComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(c => c + 1);
    // Only this component updates!
  }
}
```

### Detach Change Detection

```typescript
import { ChangeDetectorRef, inject } from '@angular/core';

@Component({
  selector: 'app-heavy-component',
  standalone: true
})
export class HeavyComponent {
  private cdr = inject(ChangeDetectorRef);
  
  ngOnInit() {
    // Detach from change detection
    this.cdr.detach();
    
    // Manually trigger when needed
    setInterval(() => {
      this.updateData();
      this.cdr.detectChanges();
    }, 5000);
  }
}
```

## 📦 Bundle Optimization

### Lazy Loading Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  }
];
```

### Lazy Load Heavy Libraries

```typescript
@Component({
  selector: 'app-chart',
  standalone: true
})
export class ChartComponent {
  async loadChart() {
    // Lazy load Chart.js only when needed
    const { Chart } = await import('chart.js');
    
    new Chart(this.canvas, {
      type: 'bar',
      data: this.chartData
    });
  }
}
```

### Tree Shaking

```typescript
// ✅ Good - Import only what you need
import { map, filter } from 'rxjs/operators';

// ❌ Avoid - Imports entire library
import * as _ from 'lodash';

// ✅ Good - Import specific functions
import debounce from 'lodash/debounce';
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Combine multiple optimization techniques for best results.</p>
</blockquote>

### 1. **Virtual Scrolling for Large Lists**

Let's implement virtual scrolling for rendering thousands of items efficiently.

```typescript
import { Component, signal } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-virtual-list',
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items()" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
    }
    .item {
      height: 50px;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
  `]
})
export class VirtualListComponent {
  items = signal(
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }))
  );
}
```

### 2. **Image Optimization**

Let's optimize image loading with NgOptimizedImage.

```typescript
import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div class="gallery">
      @for (image of images; track image.id) {
        <img 
          [ngSrc]="image.url"
          [alt]="image.alt"
          width="400"
          height="300"
          priority="{{ $index < 2 }}"
          loading="lazy"
        />
      }
    </div>
  `
})
export class GalleryComponent {
  images = [
    { id: 1, url: '/images/1.jpg', alt: 'Image 1' },
    { id: 2, url: '/images/2.jpg', alt: 'Image 2' },
    // ... more images
  ];
}
```

### 3. **Memoization for Expensive Computations**

Let's cache expensive calculations.

```typescript
@Component({
  selector: 'app-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculatorComponent {
  private cache = new Map<string, number>();
  
  input = signal(0);
  
  // Computed signal automatically memoizes
  result = computed(() => this.expensiveCalculation(this.input()));
  
  private expensiveCalculation(n: number): number {
    const key = `calc_${n}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    // Expensive operation
    let result = 0;
    for (let i = 0; i < n * 1000000; i++) {
      result += Math.sqrt(i);
    }
    
    this.cache.set(key, result);
    return result;
  }
}
```

### 4. **Debounced Search**

Let's optimize API calls with debouncing.

```typescript
import { Component, signal, effect } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input 
      [value]="searchTerm()"
      (input)="onSearch($event)"
      placeholder="Search..."
    />
    
    @if (loading()) {
      <div>Loading...</div>
    }
    
    @for (result of results(); track result.id) {
      <div>{{ result.name }}</div>
    }
  `
})
export class SearchComponent {
  searchTerm = signal('');
  results = signal<any[]>([]);
  loading = signal(false);
  
  private searchSubject = new Subject<string>();
  
  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }
  
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }
  
  async performSearch(term: string) {
    if (!term) {
      this.results.set([]);
      return;
    }
    
    this.loading.set(true);
    try {
      const response = await fetch(`/api/search?q=${term}`);
      const data = await response.json();
      this.results.set(data);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 5. **TrackBy for ngFor**

Let's optimize list rendering with trackBy.

```typescript
@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    @for (user of users(); track user.id) {
      <div class="user">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
    }
  `
})
export class UserListComponent {
  users = signal<User[]>([]);
  
  // Modern @for automatically uses track
  // Old ngFor needed trackBy function:
  // trackByUserId(index: number, user: User) {
  //   return user.id;
  // }
}
```

## ⚡ Runtime Performance

### Avoid Memory Leaks

```typescript
import { Component, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true
})
export class TimerComponent implements OnDestroy {
  private subscription?: Subscription;
  
  ngOnInit() {
    // ✅ Store subscription for cleanup
    this.subscription = interval(1000).subscribe(val => {
      console.log(val);
    });
  }
  
  ngOnDestroy() {
    // ✅ Clean up subscription
    this.subscription?.unsubscribe();
  }
}

// Or use takeUntilDestroyed (Angular 16+)
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-timer-modern',
  standalone: true
})
export class TimerModernComponent {
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(val => console.log(val));
  }
}
```

### Optimize Pipes

```typescript
// ✅ Pure pipe - Only recalculates when input changes
@Pipe({
  name: 'expensiveFilter',
  standalone: true,
  pure: true
})
export class ExpensiveFilterPipe implements PipeTransform {
  transform(items: any[], filter: string): any[] {
    return items.filter(item => item.name.includes(filter));
  }
}

// Use computed signals instead when possible
@Component({
  selector: 'app-list',
  standalone: true
})
export class ListComponent {
  items = signal<Item[]>([]);
  filter = signal('');
  
  filteredItems = computed(() => 
    this.items().filter(item => 
      item.name.includes(this.filter())
    )
  );
}
```

## ✅ Best Practices

### 1. **Use OnPush Change Detection**

```typescript
// ✅ Always use OnPush
@Component({
  selector: 'app-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 2. **Lazy Load Routes and Modules**

```typescript
// ✅ Lazy load heavy features
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes')
}
```

### 3. **Use Signals for Reactivity**

```typescript
// ✅ Signals provide fine-grained updates
count = signal(0);
doubled = computed(() => this.count() * 2);
```

### 4. **Optimize Images**

```typescript
// ✅ Use NgOptimizedImage
<img ngSrc="/image.jpg" width="400" height="300" priority>
```

### 5. **Avoid Unnecessary Re-renders**

```typescript
// ✅ Use trackBy with @for
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

## 🎯 Performance Checklist

- [ ] Enable OnPush change detection
- [ ] Use signals for state management
- [ ] Implement lazy loading for routes
- [ ] Optimize images with NgOptimizedImage
- [ ] Use virtual scrolling for large lists
- [ ] Debounce user inputs
- [ ] Clean up subscriptions
- [ ] Use trackBy with lists
- [ ] Minimize bundle size
- [ ] Enable production mode

## 🎓 Learning Checklist

- [ ] Understand change detection strategies
- [ ] Implement OnPush change detection
- [ ] Use signals for fine-grained reactivity
- [ ] Optimize bundle size with lazy loading
- [ ] Implement virtual scrolling
- [ ] Optimize images and assets
- [ ] Prevent memory leaks
- [ ] Use performance profiling tools

## 🚀 Next Steps

1. **[Memory Management](/advanced/memory-management/)** - Prevent memory leaks
2. **[Bundle Optimization](/advanced/bundle-optimization/)** - Reduce bundle sizes
3. **[Micro Frontends](/advanced/micro-frontends/)** - Scale your architecture

---

**Pro Tip**: Performance optimization is an ongoing process! Use Chrome DevTools, Lighthouse, and Angular DevTools to identify bottlenecks. Start with the biggest wins: OnPush change detection, lazy loading, and signals! ⚡
