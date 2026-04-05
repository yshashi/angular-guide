---
title: Observables & Observers 📡
description: Master Observables and Observers in RxJS - creation, subscription, and lifecycle management
sidebar:
  order: 2
---

Observables are the heart of RxJS! They represent data streams that emit values over time. Master Observables and you'll master reactive programming in Angular.

## 🎯 What is an Observable?

An **Observable** is like a **stream of data** that flows over time. Think of it as a pipe where values can flow through - you can listen to that pipe and react when values arrive.

**Simple analogy:**
- **Promise** = A box that will contain one value in the future
- **Observable** = A stream that can deliver multiple values over time

**Real-world examples:**
- User typing in a search box → Stream of search terms
- HTTP request → Stream with one response value
- WebSocket connection → Stream of messages
- Mouse movements → Stream of position coordinates

## 🎯 Why Observables Matter

**Observable Characteristics:**

- **Lazy** - Doesn't start until someone subscribes (saves resources!)
- **Push-based** - Data is pushed to you when ready (no polling needed)
- **Cancellable** - Unsubscribe anytime to stop receiving values
- **Multiple values** - Can emit 0, 1, or infinite values
- **Composable** - Chain operators to transform data easily

**Compared to Promises:**

| Feature | Promise | Observable |
|---------|---------|------------|
| Values | Single | Multiple |
| Cancellable | ❌ No | ✅ Yes |
| Lazy | ❌ No (eager) | ✅ Yes |
| Operators | Limited | 100+ operators |
| Use in Angular | Sometimes | Everywhere! |

## 🚀 Creating Observables

### 1. **Using Observable Constructor**

```typescript
import { Observable } from 'rxjs';

// Create a custom Observable
const customObservable$ = new Observable<string>(subscriber => {
  // Emit values
  subscriber.next('First value');
  subscriber.next('Second value');
  
  // Simulate async operation
  setTimeout(() => {
    subscriber.next('Async value');
    subscriber.complete();
  }, 1000);
  
  // Cleanup function (optional)
  return () => {
    console.log('Cleanup: Observable unsubscribed');
  };
});

// Subscribe
customObservable$.subscribe({
  next: (value) => console.log('Received:', value),
  complete: () => console.log('Stream completed'),
  error: (err) => console.error('Error:', err)
});
```

### 2. **Creation Operators**

```typescript
import { of, from, interval, timer, range, generate } from 'rxjs';

// of() - Emit values in sequence, then complete
of(1, 2, 3, 4, 5).subscribe(console.log);

// from() - Convert array, promise, or iterable
from([10, 20, 30]).subscribe(console.log);
from(Promise.resolve('Hello')).subscribe(console.log);

// interval() - Emit incrementing numbers at intervals
interval(1000).subscribe(val => console.log('Tick:', val));

// timer() - Emit after delay, optionally repeat
timer(2000, 1000).subscribe(val => console.log('Timer:', val));

// range() - Emit sequence of numbers
range(1, 5).subscribe(val => console.log('Range:', val));

// generate() - Generate values with condition
generate(
  0,                    // Initial value
  x => x < 5,          // Condition
  x => x + 1,          // Iterate
  x => x * 2           // Result selector
).subscribe(console.log); // 0, 2, 4, 6, 8
```

## 🎨 Observer Pattern

### Complete Observer Object

```typescript
import { Observable } from 'rxjs';

const observable$ = new Observable<number>(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.error(new Error('Something went wrong!'));
  subscriber.next(3); // Won't be emitted after error
});

// Full observer object
observable$.subscribe({
  next: (value) => {
    console.log('Next:', value);
  },
  error: (err) => {
    console.error('Error:', err.message);
  },
  complete: () => {
    console.log('Complete!');
  }
});

// Shorthand (only next callback)
observable$.subscribe(value => console.log(value));
```

## 🎨 Real-World Examples

### 1. **User Authentication Service**

Let's create an authentication service using Observables.

```typescript
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // Expose as Observable
  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated = signal(false);

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<User>('/api/auth/login', credentials)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isAuthenticated.set(true);
          localStorage.setItem('user', JSON.stringify(user));
        }),
        catchError(error => {
          console.error('Login failed:', error);
          return throwError(() => new Error('Login failed'));
        })
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {})
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.isAuthenticated.set(false);
          localStorage.removeItem('user');
        })
      );
  }

  checkAuth(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUserSubject.next(user);
      this.isAuthenticated.set(true);
    }
  }
}
```

### 2. **Real-Time Data Stream**

Let's create a real-time data service.

```typescript
import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map, share } from 'rxjs/operators';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class StockService {
  // Simulate real-time stock prices
  getStockPrice(symbol: string): Observable<StockPrice> {
    return interval(2000).pipe(
      map(() => ({
        symbol,
        price: 100 + Math.random() * 50,
        change: (Math.random() - 0.5) * 5,
        timestamp: new Date()
      })),
      share() // Share subscription among multiple subscribers
    );
  }
}

// Component usage
@Component({
  selector: 'app-stock-ticker',
  imports: [AsyncPipe, DecimalPipe, DatePipe],
  template: `
    <div class="stock-ticker">
      @if (stock$ | async; as stock) {
        <h3>{{ stock.symbol }}</h3>
        <p class="price">\${{ stock.price | number:'1.2-2' }}</p>
        <p [class.positive]="stock.change > 0" 
           [class.negative]="stock.change < 0">
          {{ stock.change > 0 ? '+' : '' }}{{ stock.change | number:'1.2-2' }}
        </p>
        <small>{{ stock.timestamp | date:'short' }}</small>
      }
    </div>
  `
})
export class StockTickerComponent {
  private stockService = inject(StockService);
  stock$ = this.stockService.getStockPrice('AAPL');
}
```

### 3. **Infinite Scroll**

Let's implement infinite scroll with Observables.

```typescript
import { Component, ElementRef, viewChild, signal } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Post {
  id: number;
  title: string;
  content: string;
}

@Component({
  selector: 'app-infinite-scroll',
  template: `
    <div class="posts" #scrollContainer>
      @for (post of posts(); track post.id) {
        <div class="post-card">
          <h3>{{ post.title }}</h3>
          <p>{{ post.content }}</p>
        </div>
      }
      
      @if (loading()) {
        <div class="loading">Loading more...</div>
      }
    </div>
  `
})
export class InfiniteScrollComponent {
  private http = inject(HttpClient);
  scrollContainer = viewChild<ElementRef>('scrollContainer');
  
  posts = signal<Post[]>([]);
  loading = signal(false);
  page = signal(1);

  constructor() {
    this.setupInfiniteScroll();
    this.loadPosts();
  }

  setupInfiniteScroll() {
    // Wait for view to initialize
    afterNextRender(() => {
      const container = this.scrollContainer()?.nativeElement;
      
      if (container) {
        fromEvent(container, 'scroll')
          .pipe(
            debounceTime(200),
            map(() => {
              const { scrollTop, scrollHeight, clientHeight } = container;
              return scrollTop + clientHeight >= scrollHeight - 100;
            }),
            filter(atBottom => atBottom && !this.loading()),
            distinctUntilChanged(),
            takeUntilDestroyed()
          )
          .subscribe(() => {
            this.page.update(p => p + 1);
            this.loadPosts();
          });
      }
    });
  }

  loadPosts() {
    this.loading.set(true);
    
    this.http.get<Post[]>(`/api/posts?page=${this.page()}`)
      .subscribe({
        next: (newPosts) => {
          this.posts.update(current => [...current, ...newPosts]);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }
}
```

### 4. **Autocomplete Search**

Let's create an autocomplete with Observables.

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  filter 
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SearchResult {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-autocomplete',
  imports: [ReactiveFormsModule],
  template: `
    <div class="autocomplete">
      <input 
        [formControl]="searchControl"
        placeholder="Search..."
      >
      
      @if (loading()) {
        <div class="spinner">Searching...</div>
      }
      
      <div class="results">
        @for (result of results(); track result.id) {
          <div class="result-item" (click)="selectResult(result)">
            <h4>{{ result.name }}</h4>
            <p>{{ result.description }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class AutocompleteComponent {
  private http = inject(HttpClient);
  
  searchControl = new FormControl('');
  results = signal<SearchResult[]>([]);
  loading = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),                    // Wait 300ms after typing
        distinctUntilChanged(),               // Only if value changed
        filter(term => term !== null && term.length >= 2), // Min 2 chars
        switchMap(term => {
          this.loading.set(true);
          return this.http.get<SearchResult[]>(`/api/search?q=${term}`);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (results) => {
          this.results.set(results);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  selectResult(result: SearchResult) {
    console.log('Selected:', result);
    this.searchControl.setValue(result.name);
    this.results.set([]);
  }
}
```

## ✅ Best Practices

### 1. **Cold vs Hot Observables**

```typescript
import { Observable, share } from 'rxjs';

// Cold Observable - Creates new execution for each subscriber
const cold$ = new Observable(subscriber => {
  console.log('Cold Observable executed');
  subscriber.next(Math.random());
});

cold$.subscribe(val => console.log('Sub 1:', val));
cold$.subscribe(val => console.log('Sub 2:', val));
// Logs "Cold Observable executed" twice, different values

// Hot Observable - Shares execution among subscribers
const hot$ = cold$.pipe(share());

hot$.subscribe(val => console.log('Sub 1:', val));
hot$.subscribe(val => console.log('Sub 2:', val));
// Logs "Cold Observable executed" once, same value
```

### 2. **Proper Cleanup**

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-timer'
})
export class TimerComponent implements OnDestroy {
  private subscriptions = new Subscription();

  ngOnInit() {
    // Add multiple subscriptions
    this.subscriptions.add(
      interval(1000).subscribe(val => console.log('Timer 1:', val))
    );
    
    this.subscriptions.add(
      interval(2000).subscribe(val => console.log('Timer 2:', val))
    );
  }

  ngOnDestroy() {
    // Unsubscribe all at once
    this.subscriptions.unsubscribe();
  }
}
```

### 3. **Error Handling**

```typescript
import { catchError, retry, of } from 'rxjs';

// Retry failed requests
this.http.get('/api/data')
  .pipe(
    retry(3),  // Retry up to 3 times
    catchError(error => {
      console.error('Failed after retries:', error);
      return of([]); // Return fallback value
    })
  )
  .subscribe(data => console.log(data));
```

## 🎓 Learning Checklist

- [ ] Understand Observable lifecycle
- [ ] Create Observables with constructors
- [ ] Use creation operators (of, from, interval)
- [ ] Implement proper subscription management
- [ ] Handle errors in Observables
- [ ] Understand cold vs hot Observables
- [ ] Use share() for multicasting
- [ ] Implement cleanup functions
- [ ] Work with async operations
- [ ] Build real-world features

## 🚀 Next Steps

1. **[Subjects & BehaviorSubject](/rxjs/subjects/)** - Multicast Observables
2. **[Transformation Operators](/rxjs/transformation-operators/)** - Transform streams
3. **[Filtering Operators](/rxjs/filtering-operators/)** - Filter data

---

**Pro Tip**: Master the difference between cold and hot Observables! Use share() when you want multiple subscribers to receive the same values. Always clean up subscriptions to prevent memory leaks! 📡
