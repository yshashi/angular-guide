---
title: Subjects & BehaviorSubject 📢
description: Master Subjects in RxJS - multicast Observables for Angular state management and communication
sidebar:
  order: 3
---

Subjects are special types of Observables that allow multicasting to multiple Observers. Learn how to use Subjects, BehaviorSubject, ReplaySubject, and AsyncSubject in Angular applications.

## 🎯 What is a Subject?

A **Subject** is both an Observable and an Observer. It can multicast values to multiple subscribers.

**Subject Types:**
- **Subject** - No initial value, only emits new values
- **BehaviorSubject** - Has initial value, emits last value to new subscribers
- **ReplaySubject** - Replays specified number of values to new subscribers
- **AsyncSubject** - Emits only the last value when completed

## 🚀 Subject Basics

### Basic Subject

```typescript
import { Subject } from 'rxjs';

const subject$ = new Subject<number>();

// Subscribe before emitting
subject$.subscribe(value => console.log('Observer 1:', value));

subject$.next(1);
subject$.next(2);

// Subscribe after some emissions
subject$.subscribe(value => console.log('Observer 2:', value));

subject$.next(3);

// Output:
// Observer 1: 1
// Observer 1: 2
// Observer 1: 3
// Observer 2: 3
```

### BehaviorSubject

```typescript
import { BehaviorSubject } from 'rxjs';

// Requires initial value
const behaviorSubject$ = new BehaviorSubject<number>(0);

behaviorSubject$.subscribe(value => console.log('Observer 1:', value));
// Immediately logs: Observer 1: 0

behaviorSubject$.next(1);
behaviorSubject$.next(2);

// New subscriber gets last value immediately
behaviorSubject$.subscribe(value => console.log('Observer 2:', value));
// Immediately logs: Observer 2: 2

behaviorSubject$.next(3);

// Output:
// Observer 1: 0
// Observer 1: 1
// Observer 1: 2
// Observer 2: 2
// Observer 1: 3
// Observer 2: 3
```

## 🎨 Real-World Examples

### 1. **State Management Service**

```typescript
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: number;
}

@Injectable({ providedIn: 'root' })
export class StateService {
  private stateSubject = new BehaviorSubject<AppState>({
    user: null,
    theme: 'light',
    notifications: 0
  });

  // Expose as Observable
  state$ = this.stateSubject.asObservable();

  // Get current state
  get currentState(): AppState {
    return this.stateSubject.value;
  }

  // Update state
  updateState(partial: Partial<AppState>) {
    this.stateSubject.next({
      ...this.currentState,
      ...partial
    });
  }

  // Specific updates
  setUser(user: User | null) {
    this.updateState({ user });
  }

  setTheme(theme: 'light' | 'dark') {
    this.updateState({ theme });
  }

  incrementNotifications() {
    this.updateState({
      notifications: this.currentState.notifications + 1
    });
  }
}
```

### 2. **Component Communication**

```typescript
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private messageSubject = new Subject<Message>();
  
  messages$ = this.messageSubject.asObservable();

  showSuccess(text: string) {
    this.messageSubject.next({ type: 'success', text });
  }

  showError(text: string) {
    this.messageSubject.next({ type: 'error', text });
  }

  showInfo(text: string) {
    this.messageSubject.next({ type: 'info', text });
  }
}

// Usage in component
@Component({
  selector: 'app-message-display',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (message$ | async; as message) {
      <div [class]="'alert alert-' + message.type">
        {{ message.text }}
      </div>
    }
  `
})
export class MessageDisplayComponent {
  private messageService = inject(MessageService);
  message$ = this.messageService.messages$;
}
```

### 3. **ReplaySubject for Caching**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataCacheService {
  private http = inject(HttpClient);
  private cache = new ReplaySubject<any[]>(1); // Cache last 1 value
  private loaded = false;

  getData(): Observable<any[]> {
    if (!this.loaded) {
      this.http.get<any[]>('/api/data')
        .pipe(
          tap(data => {
            this.cache.next(data);
            this.loaded = true;
          })
        )
        .subscribe();
    }
    
    return this.cache.asObservable();
  }
}
```

## ✅ Best Practices

### 1. **Use BehaviorSubject for State**

```typescript
// ✅ Good - BehaviorSubject for state with initial value
private userSubject = new BehaviorSubject<User | null>(null);
user$ = this.userSubject.asObservable();

// ❌ Avoid - Subject for state (no initial value)
private userSubject = new Subject<User | null>();
```

### 2. **Complete Subjects**

```typescript
@Injectable({ providedIn: 'root' })
export class DataService implements OnDestroy {
  private dataSubject = new Subject<any>();
  
  ngOnDestroy() {
    // ✅ Complete subject to prevent memory leaks
    this.dataSubject.complete();
  }
}
```

### 3. **Expose as Observable**

```typescript
// ✅ Good - Expose as Observable (read-only)
private stateSubject = new BehaviorSubject<State>(initialState);
state$ = this.stateSubject.asObservable();

// ❌ Avoid - Exposing Subject directly
state$ = new BehaviorSubject<State>(initialState);
```

## 🎓 Learning Checklist

- [ ] Understand Subject vs Observable
- [ ] Use BehaviorSubject for state
- [ ] Implement ReplaySubject for caching
- [ ] Use AsyncSubject when needed
- [ ] Complete Subjects properly
- [ ] Expose Subjects as Observables
- [ ] Build state management services
- [ ] Implement component communication

## 🚀 Next Steps

1. **[Transformation Operators](/rxjs/transformation-operators/)** - Transform data streams
2. **[Filtering Operators](/rxjs/filtering-operators/)** - Filter data
3. **[Error Handling](/rxjs/error-handling/)** - Handle errors gracefully

---

**Pro Tip**: Use BehaviorSubject for state management in services! It provides the current value immediately to new subscribers and is perfect for sharing state across components! 📢
