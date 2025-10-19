---
title: RxJS Fundamentals 🔄
description: Master RxJS basics for Angular - reactive programming, streams, and asynchronous data handling
sidebar:
  order: 1
---

RxJS (Reactive Extensions for JavaScript) is the backbone of Angular's reactive programming model. Master the fundamentals of observables, streams, and reactive patterns essential for Angular development.

## 🎯 What is RxJS?

**RxJS** is a library for **reactive programming** using Observables, making it easier to compose asynchronous or callback-based code.

**Key Concepts:**
- **Observable** - A stream of data over time
- **Observer** - Consumes values from an Observable
- **Subscription** - Represents the execution of an Observable
- **Operators** - Pure functions to transform data
- **Subject** - Both Observable and Observer

**Why RxJS in Angular?**
- **HTTP Requests** - All HTTP calls return Observables
- **Forms** - Reactive forms use Observables
- **Router** - Navigation events are Observables
- **Event Handling** - DOM events as streams
- **State Management** - Reactive state patterns

## 🚀 Basic Observable

### Creating Your First Observable

```typescript
import { Observable } from 'rxjs';

// Create a simple Observable
const numbers$ = new Observable<number>(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

// Subscribe to the Observable
numbers$.subscribe({
  next: (value) => console.log('Value:', value),
  complete: () => console.log('Complete!')
});

// Output:
// Value: 1
// Value: 2
// Value: 3
// Complete!
```

### Observable vs Promise

```typescript
// ❌ Promise - Single value, eager execution
const promise = new Promise((resolve) => {
  console.log('Promise executed immediately!');
  resolve(42);
});

// ✅ Observable - Multiple values, lazy execution
const observable$ = new Observable(subscriber => {
  console.log('Observable executed only when subscribed!');
  subscriber.next(42);
});

// Observable doesn't execute until subscribed
observable$.subscribe(value => console.log(value));
```

## 🎨 RxJS in Angular Components

### 1. **HTTP Requests**

Let's use RxJS with Angular's HttpClient.

```typescript
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    <div class="users">
      <h2>Users</h2>
      
      @if (loading()) {
        <p>Loading...</p>
      }
      
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      
      @for (user of users(); track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
        </div>
      }
    </div>
  `
})
export class UsersComponent {
  private http = inject(HttpClient);
  
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    
    // HttpClient returns an Observable
    this.http.get<User[]>('https://api.example.com/users')
      .subscribe({
        next: (data) => {
          this.users.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load users');
          this.loading.set(false);
        }
      });
  }
}
```

### 2. **Reactive Forms**

Let's use RxJS with reactive forms.

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="search">
      <input 
        [formControl]="searchControl" 
        placeholder="Search..."
      >
      
      <div class="results">
        <p>Searching for: {{ searchTerm() }}</p>
      </div>
    </div>
  `
})
export class SearchComponent {
  searchControl = new FormControl('');
  searchTerm = signal('');

  ngOnInit() {
    // Listen to form value changes
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),           // Wait 300ms after typing
        distinctUntilChanged()       // Only if value changed
      )
      .subscribe(value => {
        this.searchTerm.set(value || '');
        this.performSearch(value || '');
      });
  }

  performSearch(term: string) {
    console.log('Searching for:', term);
    // Perform API call here
  }
}
```

### 3. **Event Streams**

Let's handle DOM events as Observables.

```typescript
import { Component, ElementRef, viewChild, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';

@Component({
  selector: 'app-click-tracker',
  standalone: true,
  template: `
    <div class="tracker">
      <button #clickBtn>Click Me!</button>
      <p>Clicks: {{ clickCount() }}</p>
      <p>Position: {{ position() }}</p>
    </div>
  `
})
export class ClickTrackerComponent {
  clickBtn = viewChild<ElementRef>('clickBtn');
  
  clickCount = signal(0);
  position = signal('');

  ngAfterViewInit() {
    const button = this.clickBtn()?.nativeElement;
    
    if (button) {
      // Convert DOM event to Observable
      fromEvent<MouseEvent>(button, 'click')
        .pipe(
          throttleTime(1000),  // Throttle clicks to once per second
          map(event => ({
            x: event.clientX,
            y: event.clientY
          }))
        )
        .subscribe(pos => {
          this.clickCount.update(count => count + 1);
          this.position.set(`X: ${pos.x}, Y: ${pos.y}`);
        });
    }
  }
}
```

## 🎨 Creation Operators

### Common Ways to Create Observables

```typescript
import { 
  of, from, interval, timer, 
  fromEvent, ajax 
} from 'rxjs';

// 1. of() - Emit values in sequence
of(1, 2, 3, 4, 5).subscribe(console.log);

// 2. from() - Convert array/promise to Observable
from([10, 20, 30]).subscribe(console.log);

// 3. interval() - Emit values at intervals
interval(1000).subscribe(val => console.log('Tick:', val));

// 4. timer() - Emit after delay
timer(2000).subscribe(() => console.log('2 seconds passed'));

// 5. fromEvent() - Convert DOM events
const clicks$ = fromEvent(document, 'click');
clicks$.subscribe(event => console.log('Clicked!'));

// 6. ajax() - HTTP requests
ajax('https://api.example.com/data')
  .subscribe(response => console.log(response));
```

## ✅ Best Practices

### 1. **Always Unsubscribe**

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `<p>Timer: {{ count }}</p>`
})
export class TimerComponent implements OnDestroy {
  count = 0;
  private subscription!: Subscription;

  ngOnInit() {
    // ✅ Store subscription
    this.subscription = interval(1000)
      .subscribe(val => this.count = val);
  }

  ngOnDestroy() {
    // ✅ Unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }
}
```

### 2. **Use Async Pipe**

```typescript
import { Component } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <!-- ✅ Async pipe auto-unsubscribes -->
    <p>Timer: {{ timer$ | async }}</p>
  `
})
export class TimerComponent {
  timer$: Observable<number> = interval(1000)
    .pipe(map(val => val + 1));
}
```

### 3. **Use takeUntilDestroyed**

```typescript
import { Component, signal } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `<p>Timer: {{ count() }}</p>`
})
export class TimerComponent {
  count = signal(0);

  constructor() {
    // ✅ Auto-unsubscribes when component destroys
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(val => this.count.set(val));
  }
}
```

### 4. **Naming Convention**

```typescript
// ✅ Good - Use $ suffix for Observables
const users$ = this.http.get<User[]>('/api/users');
const searchTerm$ = this.searchControl.valueChanges;

// ❌ Avoid - No clear indication it's an Observable
const users = this.http.get<User[]>('/api/users');
```

### 5. **Error Handling**

```typescript
import { catchError, of } from 'rxjs';

// ✅ Good - Handle errors gracefully
this.http.get<User[]>('/api/users')
  .pipe(
    catchError(error => {
      console.error('Error:', error);
      return of([]); // Return empty array as fallback
    })
  )
  .subscribe(users => console.log(users));
```

## 🎯 Observable Lifecycle

```typescript
import { Observable } from 'rxjs';

const observable$ = new Observable(subscriber => {
  console.log('1. Observable created');
  
  subscriber.next('Hello');
  subscriber.next('World');
  
  // Cleanup function
  return () => {
    console.log('4. Cleanup/Unsubscribe');
  };
});

console.log('2. Before subscribe');

const subscription = observable$.subscribe({
  next: (value) => console.log('3. Received:', value),
  complete: () => console.log('Complete'),
  error: (err) => console.error('Error:', err)
});

console.log('5. After subscribe');

// Later...
subscription.unsubscribe();

// Output:
// 2. Before subscribe
// 1. Observable created
// 3. Received: Hello
// 3. Received: World
// 5. After subscribe
// 4. Cleanup/Unsubscribe
```

## 🎓 Learning Checklist

- [ ] Understand Observable vs Promise
- [ ] Create Observables with creation operators
- [ ] Subscribe and unsubscribe properly
- [ ] Use async pipe in templates
- [ ] Handle errors in Observables
- [ ] Use takeUntilDestroyed for cleanup
- [ ] Follow naming conventions ($ suffix)
- [ ] Work with HttpClient Observables
- [ ] Handle form value changes
- [ ] Convert DOM events to Observables

## 🚀 Next Steps

1. **[Observables & Observers](/rxjs/observables/)** - Deep dive into Observables
2. **[Subjects & BehaviorSubject](/rxjs/subjects/)** - Multicast Observables
3. **[Transformation Operators](/rxjs/transformation-operators/)** - Transform data streams

---

**Pro Tip**: RxJS has a learning curve, but it's essential for Angular! Start with simple use cases like HTTP requests and form handling. Use the async pipe whenever possible to avoid manual subscription management! 🔄
