---
title: RxJS & Observables 🌊
description: Master reactive programming with RxJS in Angular
sidebar:
  order: 6
---

RxJS (Reactive Extensions for JavaScript) is a powerful library for reactive programming using observables. It's the foundation of Angular's reactive patterns and enables elegant handling of asynchronous data streams.

## 🎯 Why RxJS?

**Think of observables like water flowing through pipes** - you can transform, filter, and combine the flow of data as it moves through your application. Unlike promises that handle single values, observables can emit multiple values over time.

**Key Benefits:**
- **Composable** - Chain operations together
- **Lazy** - Only execute when subscribed
- **Cancellable** - Unsubscribe to stop execution
- **Powerful operators** - Transform data streams easily

## 🚀 Observable Basics

### Creating Observables

```typescript
import { Observable, of, from, interval } from 'rxjs';

// Simple observable that emits values
const numbers$ = of(1, 2, 3, 4, 5);

// From array - converts array to observable
const fromArray$ = from([10, 20, 30]);

// Interval - emits numbers every second
const timer$ = interval(1000);

// Custom observable
const custom$ = new Observable(subscriber => {
  subscriber.next('Hello');
  subscriber.next('World');
  subscriber.complete();
});

// Using in component
@Component({
  selector: 'app-basic-observable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Observable Values:</h3>
      @for (value of values(); track $index) {
        <p>{{value}}</p>
      }
    </div>
  `
})
export class BasicObservableComponent implements OnInit, OnDestroy {
  values = signal<number[]>([]);
  private subscription?: Subscription;

  ngOnInit() {
    // Subscribe to observable and update signal
    this.subscription = numbers$.subscribe(value => {
      this.values.update(current => [...current, value]);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### Understanding Subscription

**Think of subscription like turning on a faucet** - the water (data) only flows when you turn it on (subscribe), and you need to turn it off (unsubscribe) to stop the flow.

```typescript
@Component({
  selector: 'app-subscription-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="startTimer()">Start Timer</button>
      <button (click)="stopTimer()">Stop Timer</button>
      <p>Timer: {{currentTime()}}</p>
    </div>
  `
})
export class SubscriptionDemoComponent {
  currentTime = signal(0);
  private timerSubscription?: Subscription;

  startTimer() {
    // Stop existing timer first
    this.stopTimer();
    
    // Start new timer - emits every second
    this.timerSubscription = interval(1000).subscribe(value => {
      this.currentTime.set(value);
    });
  }

  stopTimer() {
    // Always unsubscribe to prevent memory leaks
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
  }
}
```

## 🔧 Essential Operators

### Map - Transform Data

**Map is like a factory conveyor belt** - it takes each item and transforms it into something else.

```typescript
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-map-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>User Names:</h3>
      @for (name of userNames(); track $index) {
        <p>{{name}}</p>
      }
    </div>
  `
})
export class MapDemoComponent implements OnInit {
  userNames = signal<string[]>([]);
  private userService = inject(UserService);

  ngOnInit() {
    // Transform user objects to just names
    this.userService.getUsers().pipe(
      map(users => users.map(user => user.name)) // Extract names from user objects
    ).subscribe(names => {
      this.userNames.set(names);
    });
  }
}
```

### Filter - Select Specific Data

**Filter is like a security checkpoint** - only items that meet certain criteria can pass through.

```typescript
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-filter-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <input [(ngModel)]="minAge" type="number" placeholder="Minimum age">
      <h3>Adults ({{minAge}}+ years):</h3>
      @for (user of adults(); track user.id) {
        <p>{{user.name}} ({{user.age}})</p>
      }
    </div>
  `
})
export class FilterDemoComponent implements OnInit {
  adults = signal<User[]>([]);
  minAge = 18;
  private userService = inject(UserService);

  ngOnInit() {
    this.userService.getUsers().pipe(
      map(users => users.filter(user => user.age >= this.minAge)) // Only adults
    ).subscribe(adults => {
      this.adults.set(adults);
    });
  }
}
```

### CombineLatest - Merge Multiple Streams

**CombineLatest is like a recipe** - it waits for ingredients from different sources and combines them when all are available.

```typescript
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-combine-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Search Results:</h3>
      <input [(ngModel)]="searchTerm" placeholder="Search term">
      <select [(ngModel)]="category">
        <option value="">All Categories</option>
        <option value="tech">Technology</option>
        <option value="health">Health</option>
      </select>
      
      @for (product of filteredProducts(); track product.id) {
        <div>{{product.name}} - {{product.category}}</div>
      }
    </div>
  `
})
export class CombineDemoComponent implements OnInit {
  filteredProducts = signal<Product[]>([]);
  searchTerm = '';
  category = '';
  
  private productService = inject(ProductService);
  private searchTerm$ = new BehaviorSubject('');
  private category$ = new BehaviorSubject('');

  ngOnInit() {
    // Combine search term and category changes
    combineLatest([
      this.productService.getProducts(),
      this.searchTerm$,
      this.category$
    ]).pipe(
      map(([products, search, cat]) => {
        return products.filter(product => {
          const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
          const matchesCategory = !cat || product.category === cat;
          return matchesSearch && matchesCategory;
        });
      })
    ).subscribe(filtered => {
      this.filteredProducts.set(filtered);
    });
  }

  onSearchChange() {
    this.searchTerm$.next(this.searchTerm);
  }

  onCategoryChange() {
    this.category$.next(this.category);
  }
}
```

## 🎨 Practical Example: Real-time Search

**This example shows how to build a search that responds as you type** - like Google's search suggestions.

```typescript
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div>
      <input 
        [(ngModel)]="searchQuery"
        (input)="onSearchInput()"
        placeholder="Search users...">
      
      @if (isLoading()) {
        <div>Searching...</div>
      }
      
      @if (searchResults().length > 0) {
        <div>
          <h3>Results:</h3>
          @for (user of searchResults(); track user.id) {
            <div>{{user.name}} - {{user.email}}</div>
          }
        </div>
      } @else if (hasSearched() && !isLoading()) {
        <div>No results found</div>
      }
    </div>
  `
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  searchResults = signal<User[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);
  
  private searchSubject = new Subject<string>();
  private subscription?: Subscription;
  private userService = inject(UserService);

  ngOnInit() {
    // Create a smart search pipeline
    this.subscription = this.searchSubject.pipe(
      debounceTime(300),        // Wait 300ms after user stops typing
      distinctUntilChanged(),   // Only search if query actually changed
      switchMap(query => {      // Cancel previous search, start new one
        if (!query.trim()) {
          return of([]);
        }
        
        this.isLoading.set(true);
        return this.userService.searchUsers(query).pipe(
          catchError(() => of([])) // Handle errors gracefully
        );
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
      this.hasSearched.set(true);
    });
  }

  onSearchInput() {
    // Emit search query to the pipeline
    this.searchSubject.next(this.searchQuery);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

## 🔄 Error Handling

**Error handling in RxJS is like having a safety net** - when something goes wrong, you can catch it and decide what to do next.

```typescript
import { catchError, retry } from 'rxjs/operators';

@Component({
  selector: 'app-error-handling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="loadData()">Load Data</button>
      
      @if (isLoading()) {
        <div>Loading...</div>
      }
      
      @if (error()) {
        <div>
          Error: {{error()}}
          <button (click)="loadData()">Retry</button>
        </div>
      }
      
      @if (data()) {
        <div>Data loaded: {{data()?.length}} items</div>
      }
    </div>
  `
})
export class ErrorHandlingComponent {
  data = signal<any[] | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private dataService = inject(DataService);

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.dataService.getData().pipe(
      retry(2), // Automatically retry up to 2 times
      catchError(error => {
        console.error('Failed to load data:', error);
        this.error.set('Failed to load data. Please try again.');
        return of(null); // Return fallback value
      })
    ).subscribe(result => {
      this.data.set(result);
      this.isLoading.set(false);
    });
  }
}
```

## 🎭 Subjects - Two-way Communication

**Subjects are like radio stations** - they can both broadcast (emit) and receive (subscribe) messages.

```typescript
import { BehaviorSubject, Subject } from 'rxjs';

// Service for managing global state
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // BehaviorSubject remembers the last value
  private messageSubject = new BehaviorSubject<string>('');
  message$ = this.messageSubject.asObservable();
  
  // Subject for events (no initial value)
  private eventSubject = new Subject<NotificationEvent>();
  events$ = this.eventSubject.asObservable();

  showMessage(message: string) {
    this.messageSubject.next(message);
  }

  emitEvent(event: NotificationEvent) {
    this.eventSubject.next(event);
  }
}

// Component that sends notifications
@Component({
  selector: 'app-sender',
  template: `
    <div>
      <input [(ngModel)]="message" placeholder="Enter message">
      <button (click)="sendMessage()">Send Message</button>
      <button (click)="sendEvent()">Send Event</button>
    </div>
  `
})
export class SenderComponent {
  message = '';
  private notificationService = inject(NotificationService);

  sendMessage() {
    this.notificationService.showMessage(this.message);
    this.message = '';
  }

  sendEvent() {
    this.notificationService.emitEvent({
      type: 'info',
      message: 'Button clicked!',
      timestamp: new Date()
    });
  }
}

// Component that receives notifications
@Component({
  selector: 'app-receiver',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Current Message: {{currentMessage()}}</h3>
      <h3>Recent Events:</h3>
      @for (event of recentEvents(); track event.timestamp) {
        <div>{{event.type}}: {{event.message}} at {{event.timestamp | date:'short'}}</div>
      }
    </div>
  `
})
export class ReceiverComponent implements OnInit, OnDestroy {
  currentMessage = signal('');
  recentEvents = signal<NotificationEvent[]>([]);
  
  private subscriptions = new Subscription();
  private notificationService = inject(NotificationService);

  ngOnInit() {
    // Subscribe to messages
    this.subscriptions.add(
      this.notificationService.message$.subscribe(message => {
        this.currentMessage.set(message);
      })
    );

    // Subscribe to events
    this.subscriptions.add(
      this.notificationService.events$.subscribe(event => {
        this.recentEvents.update(events => [event, ...events.slice(0, 4)]);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

## ✅ Best Practices

### 1. **Always Unsubscribe**
```typescript
// ✅ Good - Proper cleanup
export class Component implements OnDestroy {
  private subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.service.getData().subscribe(data => {
        // Handle data
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Prevents memory leaks
  }
}

// ✅ Better - Use takeUntil pattern
export class Component implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.service.getData().pipe(
      takeUntil(this.destroy$) // Automatically unsubscribe
    ).subscribe(data => {
      // Handle data
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 2. **Use Async Pipe When Possible**
```typescript
// ✅ Good - Async pipe handles subscription automatically
@Component({
  template: `
    @if (users$ | async; as users) {
      @for (user of users; track user.id) {
        <div>{{user.name}}</div>
      }
    }
  `
})
export class Component {
  users$ = this.userService.getUsers();
}
```

### 3. **Combine with Signals**
```typescript
// ✅ Modern approach - Convert observables to signals
export class Component {
  private userService = inject(UserService);
  
  // Convert observable to signal
  users = toSignal(this.userService.getUsers(), { initialValue: [] });
  
  // Use computed for derived state
  userCount = computed(() => this.users().length);
}
```

## 🎯 Quick Checklist

- [ ] Understand observables vs promises
- [ ] Always unsubscribe to prevent memory leaks
- [ ] Use operators to transform data streams
- [ ] Handle errors with catchError
- [ ] Use subjects for component communication
- [ ] Combine observables with combineLatest/merge
- [ ] Use debounceTime for search inputs
- [ ] Convert observables to signals when appropriate
- [ ] Use async pipe in templates when possible

## 🚀 Next Steps

1. **[State Management](/intermediate/state-management/)** - Managing complex application state
2. **[Testing](/intermediate/testing/)** - Testing reactive code
3. **[Advanced Patterns](/advanced/reactive-patterns/)** - Complex RxJS patterns

---

**Remember**: RxJS is powerful but can be complex. Start with basic operators and gradually build up to more advanced patterns. Think of data as streams flowing through your application! 🌊
