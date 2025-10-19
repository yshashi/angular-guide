---
title: Transformation Operators 🔄
description: Master RxJS transformation operators - map, switchMap, mergeMap, concatMap, and exhaustMap
sidebar:
  order: 4
---

Transformation operators change the data flowing through your Observables. These are the most commonly used operators in Angular applications.

## 🎯 The map Operator

The **map** operator transforms each value emitted by an Observable.

### Basic Example

```typescript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

// Transform numbers to their doubles
of(1, 2, 3, 4, 5)
  .pipe(
    map(value => value * 2)
  )
  .subscribe(result => console.log(result));

// Output: 2, 4, 6, 8, 10
```

### Real-World: Transform API Response

```typescript
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    @for (user of users(); track user.id) {
      <div class="user">
        <h3>{{ user.fullName }}</h3>
        <p>{{ user.email }}</p>
      </div>
    }
  `
})
export class UsersComponent {
  private http = inject(HttpClient);
  users = signal<User[]>([]);

  ngOnInit() {
    this.http.get<ApiUser[]>('/api/users')
      .pipe(
        map(apiUsers => apiUsers.map(user => ({
          id: user.id,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email
        })))
      )
      .subscribe(users => this.users.set(users));
  }
}
```

## 🎯 The switchMap Operator

**switchMap** cancels the previous Observable and switches to a new one. Perfect for search and navigation!

### When to Use switchMap

✅ **Use switchMap when:**
- User searches (cancel old search when typing new)
- Navigation (cancel old request when navigating)
- Auto-save (cancel old save when new changes come)

### Example: Search with Auto-Cancel

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
    
    @if (loading()) {
      <p>Searching...</p>
    }
    
    @for (result of results(); track result.id) {
      <div class="result">{{ result.name }}</div>
    }
  `
})
export class SearchComponent {
  private http = inject(HttpClient);
  
  searchControl = new FormControl('');
  results = signal<any[]>([]);
  loading = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(term => {
          this.loading.set(true);
          // Previous search is automatically cancelled!
          return this.http.get<any[]>(`/api/search?q=${term}`);
        }),
        takeUntilDestroyed()
      )
      .subscribe(results => {
        this.results.set(results);
        this.loading.set(false);
      });
  }
}
```

## 🎯 The mergeMap Operator

**mergeMap** runs all Observables concurrently. Good for parallel operations!

### When to Use mergeMap

✅ **Use mergeMap when:**
- Processing multiple items independently
- Order doesn't matter
- Want maximum concurrency

### Example: Upload Multiple Files

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  template: `
    <input type="file" multiple (change)="onFilesSelected($event)">
    
    @if (uploading()) {
      <p>Uploading {{ uploadedCount() }} / {{ totalFiles() }}</p>
    }
  `
})
export class FileUploadComponent {
  private http = inject(HttpClient);
  
  uploading = signal(false);
  uploadedCount = signal(0);
  totalFiles = signal(0);

  onFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    this.totalFiles.set(files.length);
    this.uploading.set(true);
    this.uploadedCount.set(0);

    // Upload all files in parallel
    from(files)
      .pipe(
        mergeMap(file => this.uploadFile(file))
      )
      .subscribe({
        next: () => this.uploadedCount.update(c => c + 1),
        complete: () => this.uploading.set(false)
      });
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('/api/upload', formData);
  }
}
```

## 🎯 The concatMap Operator

**concatMap** processes Observables one at a time, in order. Perfect when order matters!

### When to Use concatMap

✅ **Use concatMap when:**
- Order is important
- Need to process sequentially
- Want to queue operations

### Example: Sequential API Calls

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';

@Component({
  selector: 'app-batch-processor',
  standalone: true,
  template: `<button (click)="processBatch()">Process Batch</button>`
})
export class BatchProcessorComponent {
  private http = inject(HttpClient);

  processBatch() {
    const userIds = [1, 2, 3, 4, 5];

    // Process users one by one, in order
    from(userIds)
      .pipe(
        concatMap(id => 
          this.http.post(`/api/users/${id}/process`, {})
        )
      )
      .subscribe({
        next: (result) => console.log('Processed:', result),
        complete: () => console.log('All done!')
      });
  }
}
```

## 🎯 The exhaustMap Operator

**exhaustMap** ignores new values while processing the current one. Perfect for preventing duplicate actions!

### When to Use exhaustMap

✅ **Use exhaustMap when:**
- Preventing double-clicks
- Avoiding duplicate submissions
- Rate limiting user actions

### Example: Prevent Double Submit

```typescript
import { Component, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-form',
  standalone: true,
  template: `
    <form (submit)="onSubmit()">
      <input [(ngModel)]="name" name="name">
      <button type="submit" [disabled]="submitting()">
        {{ submitting() ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `
})
export class FormComponent {
  private http = inject(HttpClient);
  private submitSubject = new Subject<void>();
  
  name = '';
  submitting = signal(false);

  constructor() {
    // Ignore clicks while submitting
    this.submitSubject
      .pipe(
        exhaustMap(() => {
          this.submitting.set(true);
          return this.http.post('/api/submit', { name: this.name });
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: () => {
          console.log('Submitted!');
          this.submitting.set(false);
        },
        error: () => this.submitting.set(false)
      });
  }

  onSubmit() {
    this.submitSubject.next();
  }
}
```

## 📊 Quick Comparison

| Operator | Behavior | Use Case |
|----------|----------|----------|
| **map** | Transform values | Change data format |
| **switchMap** | Cancel previous | Search, navigation |
| **mergeMap** | Run all parallel | File uploads |
| **concatMap** | Run in sequence | Ordered operations |
| **exhaustMap** | Ignore while busy | Prevent duplicates |

## ✅ Simple Rules

```typescript
// 1. Transforming data? Use map
users$.pipe(map(user => user.name))

// 2. Search or navigation? Use switchMap
search$.pipe(switchMap(term => this.search(term)))

// 3. Multiple parallel tasks? Use mergeMap
files$.pipe(mergeMap(file => this.upload(file)))

// 4. Must be in order? Use concatMap
queue$.pipe(concatMap(task => this.process(task)))

// 5. Prevent double-click? Use exhaustMap
clicks$.pipe(exhaustMap(() => this.save()))
```

## 🎓 Learning Checklist

- [ ] Use map to transform data
- [ ] Use switchMap for search/navigation
- [ ] Use mergeMap for parallel operations
- [ ] Use concatMap when order matters
- [ ] Use exhaustMap to prevent duplicates
- [ ] Understand when to use each operator

## 🚀 Next Steps

1. **[Filtering Operators](/rxjs/filtering-operators/)** - Filter your data streams
2. **[Combination Operators](/rxjs/combination-operators/)** - Combine multiple streams
3. **[Error Handling](/rxjs/error-handling/)** - Handle errors gracefully

---

**Pro Tip**: Start with **map** and **switchMap** - they cover 80% of use cases! When in doubt, use switchMap for async operations! 🔄
