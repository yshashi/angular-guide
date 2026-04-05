---
title: Error Handling ⚠️
description: Master error handling in RxJS - catchError, retry, retryWhen for robust Angular applications
sidebar:
  order: 7
---

Errors happen! Learn how to handle them gracefully in your RxJS streams so your Angular app stays stable and user-friendly.

## 🎯 Why Error Handling Matters

When an Observable throws an error:
- The stream **stops** - no more values are emitted
- Subscribers receive the error
- The Observable **completes** (in error state)

**Without error handling:**
- Your app might crash
- Users see broken features
- No way to recover

**With error handling:**
- Graceful degradation
- Retry failed operations
- Show user-friendly messages
- Keep app running

## 🎯 The catchError Operator

**catchError** catches errors and lets you handle them gracefully. You can return a fallback value or a new Observable.

### Example: Return Fallback Value

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-user-list',
  template: `
    @for (user of users(); track user.id) {
      <div>{{ user.name }}</div>
    }
    
    @if (users().length === 0) {
      <p>No users available</p>
    }
  `
})
export class UserListComponent {
  private http = inject(HttpClient);
  users = signal<any[]>([]);

  ngOnInit() {
    this.http.get<any[]>('/api/users')
      .pipe(
        catchError(error => {
          console.error('Failed to load users:', error);
          // Return empty array as fallback
          return of([]);
        })
      )
      .subscribe(users => this.users.set(users));
  }
}
```

### Example: Show Error Message

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-posts',
  template: `
    @if (error()) {
      <div class="error">{{ error() }}</div>
    }
    
    @for (post of posts(); track post.id) {
      <div>{{ post.title }}</div>
    }
  `
})
export class PostsComponent {
  private http = inject(HttpClient);
  
  posts = signal<any[]>([]);
  error = signal<string | null>(null);

  ngOnInit() {
    this.http.get<any[]>('/api/posts')
      .pipe(
        catchError(err => {
          this.error.set('Failed to load posts. Please try again.');
          return of([]); // Return empty array to keep stream alive
        })
      )
      .subscribe(posts => this.posts.set(posts));
  }
}
```

## 🎯 The retry Operator

**retry** automatically retries a failed Observable a specified number of times.

### Example: Retry Failed Request

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { retry, catchError, of } from 'rxjs';

@Component({
  selector: 'app-data-loader',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    }
    
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    
    <div>{{ data() }}</div>
  `
})
export class DataLoaderComponent {
  private http = inject(HttpClient);
  
  data = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.http.get('/api/data')
      .pipe(
        retry(3), // Retry up to 3 times
        catchError(err => {
          this.error.set('Failed after 3 attempts');
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe(data => {
        this.data.set(data);
        this.loading.set(false);
      });
  }
}
```

## 🎯 The retryWhen Operator

**retryWhen** gives you full control over retry logic - add delays, conditions, and limits.

### Example: Retry with Delay

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { retryWhen, delay, take, catchError, of } from 'rxjs';

@Component({
  selector: 'app-smart-retry',
  template: `
    <p>Attempt: {{ attempt() }}</p>
    <p>Status: {{ status() }}</p>
  `
})
export class SmartRetryComponent {
  private http = inject(HttpClient);
  
  attempt = signal(0);
  status = signal('Loading...');

  ngOnInit() {
    this.http.get('/api/data')
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            delay(2000),  // Wait 2 seconds before retry
            take(3),      // Max 3 retries
            tap(() => this.attempt.update(a => a + 1))
          )
        ),
        catchError(err => {
          this.status.set('Failed after retries');
          return of(null);
        })
      )
      .subscribe(data => {
        this.status.set('Success!');
      });
  }
}
```

## 🎯 Handle Specific Errors

You can handle different error types differently.

### Example: Handle HTTP Status Codes

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-error-handler',
  template: `
    @if (errorMessage()) {
      <div class="alert alert-{{ errorType() }}">
        {{ errorMessage() }}
      </div>
    }
  `
})
export class ErrorHandlerComponent {
  private http = inject(HttpClient);
  
  errorMessage = signal<string | null>(null);
  errorType = signal<'warning' | 'error'>('error');

  loadData() {
    this.http.get('/api/data')
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.errorMessage.set('Data not found');
            this.errorType.set('warning');
          } else if (error.status === 401) {
            this.errorMessage.set('Please log in');
            this.errorType.set('error');
          } else if (error.status === 500) {
            this.errorMessage.set('Server error. Try again later');
            this.errorType.set('error');
          } else {
            this.errorMessage.set('Something went wrong');
            this.errorType.set('error');
          }
          
          return throwError(() => error);
        })
      )
      .subscribe();
  }
}
```

## 🎯 The finalize Operator

**finalize** runs cleanup code whether the Observable succeeds or fails. Like try-finally!

### Example: Hide Loading Spinner

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, catchError, of } from 'rxjs';

@Component({
  selector: 'app-with-loading',
  template: `
    @if (loading()) {
      <div class="spinner">Loading...</div>
    }
    
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `
})
export class WithLoadingComponent {
  private http = inject(HttpClient);
  
  items = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  loadItems() {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<any[]>('/api/items')
      .pipe(
        catchError(err => {
          this.error.set('Failed to load items');
          return of([]);
        }),
        finalize(() => {
          // Always runs, success or error!
          this.loading.set(false);
        })
      )
      .subscribe(items => this.items.set(items));
  }
}
```

## 🎯 Global Error Handler

Create a service to handle errors consistently across your app.

### Example: Error Handler Service

```typescript
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    
    // Show user-friendly message
    this.showNotification(this.getUserFriendlyMessage(error.status));
    
    return throwError(() => new Error(errorMessage));
  }

  private getUserFriendlyMessage(status: number): string {
    switch (status) {
      case 400: return 'Invalid request';
      case 401: return 'Please log in';
      case 403: return 'Access denied';
      case 404: return 'Not found';
      case 500: return 'Server error';
      default: return 'Something went wrong';
    }
  }

  private showNotification(message: string) {
    // Show toast, snackbar, etc.
    console.log('Notification:', message);
  }
}

// Usage in component
@Component({
  selector: 'app-data'
})
export class DataComponent {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  loadData() {
    this.http.get('/api/data')
      .pipe(
        catchError(err => this.errorHandler.handleError(err))
      )
      .subscribe();
  }
}
```

## ✅ Best Practices

```typescript
// ✅ Good - Always handle errors
this.http.get('/api/data')
  .pipe(
    catchError(err => {
      console.error(err);
      return of([]); // Fallback value
    })
  )
  .subscribe();

// ❌ Bad - No error handling
this.http.get('/api/data')
  .subscribe(); // Will crash on error!

// ✅ Good - Use finalize for cleanup
this.http.get('/api/data')
  .pipe(
    finalize(() => this.loading.set(false))
  )
  .subscribe();

// ✅ Good - Retry transient errors
this.http.get('/api/data')
  .pipe(
    retry(3),
    catchError(err => of([]))
  )
  .subscribe();
```

## 🎓 Learning Checklist

- [ ] Use catchError for error handling
- [ ] Return fallback values
- [ ] Implement retry logic
- [ ] Use finalize for cleanup
- [ ] Handle specific error types
- [ ] Create global error handler
- [ ] Show user-friendly messages

## 🚀 Next Steps

1. **[Higher-Order Observables](/rxjs/higher-order-observables/)** - Advanced patterns
2. **[RxJS Patterns](/rxjs/angular-patterns/)** - Common patterns
3. **[Testing](/testing/unit-testing/)** - Test error handling

---

**Pro Tip**: Always use **catchError** to prevent your app from crashing! Use **finalize** to clean up (like hiding loading spinners) whether the request succeeds or fails! ⚠️
