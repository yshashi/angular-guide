---
title: Combination Operators 🔗
description: Master RxJS combination operators - combineLatest, forkJoin, merge, zip, and withLatestFrom
sidebar:
  order: 6
---

Combination operators let you work with multiple Observables at once. Perfect for coordinating data from different sources!

## 🎯 The combineLatest Operator

**combineLatest** waits for all Observables to emit at least once, then emits whenever ANY of them emits.

### Example: Combine Form Values

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-price-calculator',
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <label>Price: <input type="number" [formControl]="priceControl"></label>
      <label>Quantity: <input type="number" [formControl]="quantityControl"></label>
      <label>Tax Rate: <input type="number" [formControl]="taxControl"></label>
      
      <h3>Total: ${{ total() }}</h3>
    </div>
  `
})
export class PriceCalculatorComponent {
  priceControl = new FormControl(100);
  quantityControl = new FormControl(1);
  taxControl = new FormControl(0.1);
  
  total = signal(0);

  constructor() {
    combineLatest([
      this.priceControl.valueChanges,
      this.quantityControl.valueChanges,
      this.taxControl.valueChanges
    ]).pipe(
      map(([price, qty, tax]) => {
        const subtotal = (price || 0) * (qty || 0);
        return subtotal + (subtotal * (tax || 0));
      }),
      takeUntilDestroyed()
    ).subscribe(total => this.total.set(total));
  }
}
```

### Real-World: Combine Multiple API Calls

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest } from 'rxjs';

interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: string;
  language: string;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <h2>Welcome {{ user()?.name }}</h2>
      <p>Theme: {{ settings()?.theme }}</p>
    </div>
  `
})
export class DashboardComponent {
  private http = inject(HttpClient);
  
  user = signal<User | null>(null);
  settings = signal<Settings | null>(null);

  ngOnInit() {
    combineLatest([
      this.http.get<User>('/api/user'),
      this.http.get<Settings>('/api/settings')
    ]).subscribe(([user, settings]) => {
      this.user.set(user);
      this.settings.set(settings);
    });
  }
}
```

## 🎯 The forkJoin Operator

**forkJoin** waits for ALL Observables to complete, then emits all final values at once. Like Promise.all()!

### Example: Load Multiple Resources

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-data-loader',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else {
      <div>
        <h3>Users: {{ users().length }}</h3>
        <h3>Posts: {{ posts().length }}</h3>
        <h3>Comments: {{ comments().length }}</h3>
      </div>
    }
  `
})
export class DataLoaderComponent {
  private http = inject(HttpClient);
  
  loading = signal(true);
  users = signal<any[]>([]);
  posts = signal<any[]>([]);
  comments = signal<any[]>([]);

  ngOnInit() {
    forkJoin({
      users: this.http.get<any[]>('/api/users'),
      posts: this.http.get<any[]>('/api/posts'),
      comments: this.http.get<any[]>('/api/comments')
    }).subscribe(result => {
      this.users.set(result.users);
      this.posts.set(result.posts);
      this.comments.set(result.comments);
      this.loading.set(false);
    });
  }
}
```

### Example: Batch Delete

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-batch-delete',
  template: `<button (click)="deleteSelected()">Delete Selected</button>`
})
export class BatchDeleteComponent {
  private http = inject(HttpClient);
  selectedIds = [1, 2, 3, 4, 5];

  deleteSelected() {
    const deleteRequests = this.selectedIds.map(id =>
      this.http.delete(`/api/items/${id}`)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => console.log('All deleted!'),
      error: (err) => console.error('Some failed:', err)
    });
  }
}
```

## 🎯 The merge Operator

**merge** combines multiple Observables and emits values as they come. No waiting!

### Example: Multiple Event Sources

```typescript
import { Component, signal } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-activity-tracker',
  template: `
    <div>
      <p>Last activity: {{ lastActivity() }}</p>
      <p>Activity count: {{ activityCount() }}</p>
    </div>
  `
})
export class ActivityTrackerComponent {
  lastActivity = signal('');
  activityCount = signal(0);

  constructor() {
    const clicks$ = fromEvent(document, 'click').pipe(map(() => 'click'));
    const keypress$ = fromEvent(document, 'keypress').pipe(map(() => 'keypress'));
    const scroll$ = fromEvent(document, 'scroll').pipe(map(() => 'scroll'));

    merge(clicks$, keypress$, scroll$)
      .pipe(takeUntilDestroyed())
      .subscribe(activity => {
        this.lastActivity.set(activity);
        this.activityCount.update(c => c + 1);
      });
  }
}
```

## 🎯 The zip Operator

**zip** pairs values from multiple Observables in order. Like a zipper!

### Example: Pair Questions with Answers

```typescript
import { Component, signal } from '@angular/core';
import { of, zip } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-quiz',
  template: `
    @for (qa of questionsAndAnswers(); track $index) {
      <div>
        <p>Q: {{ qa.question }}</p>
        <p>A: {{ qa.answer }}</p>
      </div>
    }
  `
})
export class QuizComponent {
  questionsAndAnswers = signal<any[]>([]);

  ngOnInit() {
    const questions$ = of('What is Angular?', 'What is RxJS?', 'What is TypeScript?');
    const answers$ = of('A framework', 'A library', 'A language').pipe(delay(1000));

    zip(questions$, answers$)
      .subscribe(([question, answer]) => {
        this.questionsAndAnswers.update(qa => [
          ...qa,
          { question, answer }
        ]);
      });
  }
}
```

## 🎯 The withLatestFrom Operator

**withLatestFrom** combines the source Observable with the latest value from another Observable.

### Example: Add User Context to Actions

```typescript
import { Component, signal } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-action-logger',
  template: `
    <button (click)="performAction('save')">Save</button>
    <button (click)="performAction('delete')">Delete</button>
    
    @for (log of logs(); track $index) {
      <p>{{ log }}</p>
    }
  `
})
export class ActionLoggerComponent {
  private actionSubject = new Subject<string>();
  private currentUser$ = new BehaviorSubject<User>({
    id: 1,
    name: 'John Doe'
  });
  
  logs = signal<string[]>([]);

  constructor() {
    this.actionSubject
      .pipe(
        withLatestFrom(this.currentUser$),
        takeUntilDestroyed()
      )
      .subscribe(([action, user]) => {
        const log = `${user.name} performed: ${action}`;
        this.logs.update(logs => [...logs, log]);
      });
  }

  performAction(action: string) {
    this.actionSubject.next(action);
  }
}
```

## 📊 Quick Comparison

| Operator | When It Emits | Use Case |
|----------|---------------|----------|
| **combineLatest** | When ANY emits (after all emit once) | Live updates from multiple sources |
| **forkJoin** | When ALL complete | Parallel API calls |
| **merge** | When ANY emits (immediately) | Multiple event sources |
| **zip** | When ALL emit (in pairs) | Pairing related data |
| **withLatestFrom** | When source emits | Add context to actions |

## ✅ Simple Rules

```typescript
// Need all results at once? Use forkJoin
forkJoin([api1$, api2$, api3$])

// Need live updates? Use combineLatest
combineLatest([filter$, sort$, search$])

// Merging events? Use merge
merge(clicks$, touches$, keys$)

// Pairing data? Use zip
zip(questions$, answers$)

// Adding context? Use withLatestFrom
actions$.pipe(withLatestFrom(user$))
```

## 🎓 Learning Checklist

- [ ] Use combineLatest for live updates
- [ ] Use forkJoin for parallel requests
- [ ] Use merge for multiple events
- [ ] Use zip for pairing data
- [ ] Use withLatestFrom for context
- [ ] Understand when each emits

## 🚀 Next Steps

1. **[Error Handling](/rxjs/error-handling/)** - Handle errors gracefully
2. **[Higher-Order Observables](/rxjs/higher-order-observables/)** - Advanced patterns
3. **[RxJS Patterns](/rxjs/angular-patterns/)** - Common patterns

---

**Pro Tip**: **forkJoin** is like Promise.all() - use it when you need to wait for multiple HTTP requests! **combineLatest** is for live reactive updates! 🔗
