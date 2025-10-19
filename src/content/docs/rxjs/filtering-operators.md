---
title: Filtering Operators 🔍
description: Master RxJS filtering operators - filter, debounceTime, distinctUntilChanged, take, and more
sidebar:
  order: 5
---

Filtering operators help you control which values pass through your Observable streams. Perfect for search, forms, and user interactions!

## 🎯 The filter Operator

**filter** only emits values that pass a condition - just like Array.filter()!

### Basic Example

```typescript
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

// Only emit even numbers
of(1, 2, 3, 4, 5, 6)
  .pipe(
    filter(num => num % 2 === 0)
  )
  .subscribe(console.log);

// Output: 2, 4, 6
```

### Real-World: Filter Valid Inputs

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-email-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="emailControl" placeholder="Enter email">
    <p>Valid email: {{ validEmail() }}</p>
  `
})
export class EmailInputComponent {
  emailControl = new FormControl('');
  validEmail = signal('');

  constructor() {
    this.emailControl.valueChanges
      .pipe(
        filter(email => email !== null && email.includes('@')),
        takeUntilDestroyed()
      )
      .subscribe(email => this.validEmail.set(email));
  }
}
```

## 🎯 The debounceTime Operator

**debounceTime** waits for a pause before emitting. Perfect for search boxes!

### Example: Search with Delay

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="searchControl" placeholder="Search...">
    
    @for (result of results(); track result.id) {
      <div>{{ result.name }}</div>
    }
  `
})
export class SearchComponent {
  private http = inject(HttpClient);
  
  searchControl = new FormControl('');
  results = signal<any[]>([]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        switchMap(term => this.http.get<any[]>(`/api/search?q=${term}`)),
        takeUntilDestroyed()
      )
      .subscribe(results => this.results.set(results));
  }
}
```

## 🎯 The distinctUntilChanged Operator

**distinctUntilChanged** only emits when the value actually changes. Prevents duplicate API calls!

### Example: Avoid Duplicate Calls

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <select [formControl]="categoryControl">
      <option value="all">All</option>
      <option value="tech">Tech</option>
      <option value="sports">Sports</option>
    </select>
    <p>Selected: {{ category() }}</p>
  `
})
export class FilterComponent {
  categoryControl = new FormControl('all');
  category = signal('all');

  constructor() {
    this.categoryControl.valueChanges
      .pipe(
        distinctUntilChanged(), // Only emit if value changed
        takeUntilDestroyed()
      )
      .subscribe(value => {
        this.category.set(value || 'all');
        console.log('Category changed to:', value);
      });
  }
}
```

## 🎯 The take Operator

**take** emits only the first N values, then completes.

### Example: Take First 3 Items

```typescript
import { Component, signal } from '@angular/core';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-countdown',
  standalone: true,
  template: `<p>Count: {{ count() }}</p>`
})
export class CountdownComponent {
  count = signal(0);

  ngOnInit() {
    // Only take first 3 values
    interval(1000)
      .pipe(take(3))
      .subscribe({
        next: val => this.count.set(val),
        complete: () => console.log('Done!')
      });
    
    // Output: 0, 1, 2, then completes
  }
}
```

## 🎯 The takeUntil Operator

**takeUntil** emits values until another Observable emits. Perfect for cleanup!

### Example: Stop on Button Click

```typescript
import { Component, signal } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `
    <p>Timer: {{ count() }}</p>
    <button (click)="stop()">Stop</button>
  `
})
export class TimerComponent {
  count = signal(0);
  private stopSubject = new Subject<void>();

  ngOnInit() {
    interval(1000)
      .pipe(
        takeUntil(this.stopSubject) // Stop when stopSubject emits
      )
      .subscribe(val => this.count.set(val));
  }

  stop() {
    this.stopSubject.next(); // Trigger stop
    this.stopSubject.complete();
  }
}
```

## 🎯 The throttleTime Operator

**throttleTime** emits first value, then ignores for specified time. Good for scroll/resize events!

### Example: Throttle Scroll Events

```typescript
import { Component, ElementRef, viewChild, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-scroll-tracker',
  standalone: true,
  template: `
    <div #scrollContainer style="height: 400px; overflow-y: scroll;">
      <div style="height: 2000px;">
        <p>Scroll position: {{ scrollPosition() }}</p>
      </div>
    </div>
  `
})
export class ScrollTrackerComponent {
  scrollContainer = viewChild<ElementRef>('scrollContainer');
  scrollPosition = signal(0);

  constructor() {
    afterNextRender(() => {
      const container = this.scrollContainer()?.nativeElement;
      
      if (container) {
        fromEvent(container, 'scroll')
          .pipe(
            throttleTime(200), // Only emit once every 200ms
            map(() => container.scrollTop),
            takeUntilDestroyed()
          )
          .subscribe(position => this.scrollPosition.set(position));
      }
    });
  }
}
```

## 🎯 The first Operator

**first** emits only the first value (or first that matches condition), then completes.

### Example: Get First Match

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, first } from 'rxjs/operators';

@Component({
  selector: 'app-user-finder',
  standalone: true,
  template: `<p>Admin: {{ admin() }}</p>`
})
export class UserFinderComponent {
  private http = inject(HttpClient);
  admin = signal('');

  ngOnInit() {
    this.http.get<any[]>('/api/users')
      .pipe(
        map(users => users.find(u => u.role === 'admin')),
        first() // Take first emission and complete
      )
      .subscribe(admin => this.admin.set(admin?.name || 'None'));
  }
}
```

## 📊 Quick Comparison

| Operator | Purpose | Common Use |
|----------|---------|------------|
| **filter** | Emit if condition true | Validate inputs |
| **debounceTime** | Wait for pause | Search boxes |
| **distinctUntilChanged** | Skip duplicates | Avoid duplicate calls |
| **take** | First N values | Limit results |
| **takeUntil** | Until signal | Cleanup subscriptions |
| **throttleTime** | Rate limit | Scroll/resize events |
| **first** | First value only | One-time fetch |

## ✅ Common Patterns

```typescript
// Pattern 1: Search Box
searchControl.valueChanges.pipe(
  debounceTime(300),           // Wait for typing pause
  distinctUntilChanged(),      // Skip if same value
  filter(term => term.length >= 2), // Min 2 characters
  switchMap(term => this.search(term))
)

// Pattern 2: Scroll Events
fromEvent(window, 'scroll').pipe(
  throttleTime(200),           // Max once per 200ms
  map(() => window.scrollY)
)

// Pattern 3: Component Cleanup
someObservable$.pipe(
  takeUntilDestroyed()         // Auto cleanup
)
```

## 🎓 Learning Checklist

- [ ] Use filter for conditions
- [ ] Apply debounceTime for search
- [ ] Use distinctUntilChanged to skip duplicates
- [ ] Understand take vs first
- [ ] Use takeUntil for cleanup
- [ ] Apply throttleTime for events
- [ ] Combine operators effectively

## 🚀 Next Steps

1. **[Combination Operators](/rxjs/combination-operators/)** - Combine multiple streams
2. **[Error Handling](/rxjs/error-handling/)** - Handle errors gracefully
3. **[RxJS Patterns](/rxjs/angular-patterns/)** - Common patterns

---

**Pro Tip**: The combo **debounceTime + distinctUntilChanged + filter** is perfect for search! It waits for pauses, skips duplicates, and validates input! 🔍
