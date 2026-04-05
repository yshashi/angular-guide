---
title: Higher-Order Observables 🎯
description: Master higher-order mapping operators - switchMap, mergeMap, concatMap, exhaustMap deep dive
sidebar:
  order: 8
---

Higher-order Observables are Observables that emit other Observables. Understanding when to use each mapping operator is crucial for Angular development!

## 🎯 What Are Higher-Order Observables?

A **higher-order Observable** emits Observables as values (instead of regular values like numbers or strings).

**Think of it like this:**
- Regular Observable: Emits numbers → `1, 2, 3`
- Higher-Order Observable: Emits Observables → `Observable1, Observable2, Observable3`

**Why do we need them?**
- User types → Trigger search (Observable)
- Click button → Make API call (Observable)
- Route changes → Load data (Observable)

**The flattening operators** (switchMap, mergeMap, concatMap, exhaustMap) help us manage these inner Observables.

## 🎯 Visual Comparison

```
User Input:    A-------B---C-----------D-->
               |       |   |           |
switchMap:     a1--a2  b1  c1--c2--c3  d1--d2-->
               (cancels previous when new arrives)

mergeMap:      a1--a2--b1--c1--c2--c3--d1--d2-->
               (runs all in parallel)

concatMap:     a1--a2--b1--c1--c2--c3--d1--d2-->
               (waits for each to complete)

exhaustMap:    a1--a2--------------d1--d2-->
               (ignores new while busy)
```

## 🎯 When to Use Each Operator

### switchMap - The Default Choice

**Use when:** You want to cancel previous operations when a new one starts.

**Perfect for:**
- Search (cancel old search when user types)
- Navigation (cancel old page load)
- Auto-save (cancel old save)

### mergeMap - Parallel Processing

**Use when:** You want all operations to run in parallel.

**Perfect for:**
- File uploads (upload multiple files at once)
- Independent API calls
- Logging/analytics

### concatMap - Sequential Processing

**Use when:** Order matters and you need to wait for each to finish.

**Perfect for:**
- Queue processing
- Sequential animations
- Ordered API calls

### exhaustMap - Ignore Duplicates

**Use when:** You want to ignore new requests while processing.

**Perfect for:**
- Prevent double-click
- Login/submit buttons
- Rate limiting

## 🎨 Real-World Examples

### Example 1: Search with switchMap

```typescript
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="searchControl" placeholder="Search products...">
    
    @for (product of products(); track product.id) {
      <div class="product">
        <h3>{{ product.name }}</h3>
        <p>\${{ product.price }}</p>
      </div>
    }
  `
})
export class ProductSearchComponent {
  private http = inject(HttpClient);
  
  searchControl = new FormControl('');
  products = signal<any[]>([]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          // Previous search is automatically cancelled!
          return this.http.get<any[]>(`/api/products?search=${term}`);
        }),
        takeUntilDestroyed()
      )
      .subscribe(products => this.products.set(products));
  }
}
```

### Example 2: File Upload with mergeMap

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { from } from 'rxjs';
import { mergeMap, filter, map } from 'rxjs/operators';

interface UploadProgress {
  file: string;
  progress: number;
  complete: boolean;
}

@Component({
  selector: 'app-multi-upload',
  template: `
    <input type="file" multiple (change)="onFilesSelected($event)">
    
    @for (upload of uploads(); track upload.file) {
      <div class="upload-item">
        <span>{{ upload.file }}</span>
        <progress [value]="upload.progress" max="100"></progress>
        <span>{{ upload.progress }}%</span>
      </div>
    }
  `
})
export class MultiUploadComponent {
  private http = inject(HttpClient);
  uploads = signal<UploadProgress[]>([]);

  onFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    
    // Initialize progress tracking
    this.uploads.set(files.map(f => ({
      file: f.name,
      progress: 0,
      complete: false
    })));

    // Upload all files in parallel with mergeMap
    from(files)
      .pipe(
        mergeMap(file => this.uploadFile(file), 3) // Max 3 concurrent uploads
      )
      .subscribe();
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post('/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      filter(event => event.type === HttpEventType.UploadProgress || 
                      event.type === HttpEventType.Response),
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.updateProgress(file.name, progress, false);
        } else if (event.type === HttpEventType.Response) {
          this.updateProgress(file.name, 100, true);
        }
        return event;
      })
    );
  }

  updateProgress(fileName: string, progress: number, complete: boolean) {
    this.uploads.update(uploads =>
      uploads.map(u => u.file === fileName
        ? { ...u, progress, complete }
        : u
      )
    );
  }
}
```

### Example 3: Sequential Tasks with concatMap

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';

@Component({
  selector: 'app-task-processor',
  template: `
    <button (click)="processTasks()">Process Tasks</button>
    
    @for (log of logs(); track $index) {
      <div>{{ log }}</div>
    }
  `
})
export class TaskProcessorComponent {
  private http = inject(HttpClient);
  logs = signal<string[]>([]);

  processTasks() {
    const tasks = [
      { id: 1, name: 'Initialize' },
      { id: 2, name: 'Process Data' },
      { id: 3, name: 'Generate Report' },
      { id: 4, name: 'Send Email' }
    ];

    from(tasks)
      .pipe(
        concatMap(task => {
          this.addLog(`Starting: ${task.name}`);
          
          // Process each task in order, waiting for completion
          return this.http.post(`/api/tasks/${task.id}/process`, {}).pipe(
            delay(1000) // Simulate processing time
          );
        })
      )
      .subscribe({
        next: () => this.addLog('Task completed'),
        complete: () => this.addLog('All tasks finished!')
      });
  }

  addLog(message: string) {
    this.logs.update(logs => [...logs, `${new Date().toLocaleTimeString()}: ${message}`]);
  }
}
```

### Example 4: Prevent Double-Submit with exhaustMap

```typescript
import { Component, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { exhaustMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-payment-form',
  template: `
    <form (submit)="onSubmit($event)">
      <input [(ngModel)]="amount" type="number" placeholder="Amount">
      
      <button type="submit" [disabled]="processing()">
        {{ processing() ? 'Processing...' : 'Pay Now' }}
      </button>
    </form>
    
    @if (message()) {
      <div class="message">{{ message() }}</div>
    }
  `
})
export class PaymentFormComponent {
  private http = inject(HttpClient);
  private submitSubject = new Subject<void>();
  
  amount = 0;
  processing = signal(false);
  message = signal('');

  constructor() {
    // exhaustMap ignores new submissions while processing
    this.submitSubject
      .pipe(
        tap(() => {
          this.processing.set(true);
          this.message.set('');
        }),
        exhaustMap(() => 
          this.http.post('/api/payment', { amount: this.amount })
        ),
        takeUntilDestroyed()
      )
      .subscribe({
        next: () => {
          this.message.set('Payment successful!');
          this.processing.set(false);
        },
        error: () => {
          this.message.set('Payment failed');
          this.processing.set(false);
        }
      });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.submitSubject.next(); // Ignored if already processing!
  }
}
```

## 📊 Decision Tree

```
Do you need to flatten inner Observables?
│
├─ Yes → Which behavior do you need?
│   │
│   ├─ Cancel previous? → switchMap
│   │   (search, navigation, auto-save)
│   │
│   ├─ Run all in parallel? → mergeMap
│   │   (file uploads, independent calls)
│   │
│   ├─ Must be in order? → concatMap
│   │   (queue, sequential tasks)
│   │
│   └─ Ignore while busy? → exhaustMap
│       (prevent double-click, rate limit)
│
└─ No → Use map
    (simple transformations)
```

## ✅ Quick Reference

```typescript
// switchMap - Cancel previous
search$.pipe(
  switchMap(term => this.search(term))
)

// mergeMap - All parallel
files$.pipe(
  mergeMap(file => this.upload(file))
)

// concatMap - Sequential
tasks$.pipe(
  concatMap(task => this.process(task))
)

// exhaustMap - Ignore duplicates
clicks$.pipe(
  exhaustMap(() => this.save())
)
```

## 🎓 Learning Checklist

- [ ] Understand higher-order Observables
- [ ] Use switchMap as default
- [ ] Use mergeMap for parallel operations
- [ ] Use concatMap when order matters
- [ ] Use exhaustMap to prevent duplicates
- [ ] Know when to use each operator

## 🚀 Next Steps

1. **[Schedulers & Testing](/rxjs/schedulers/)** - Test RxJS code
2. **[RxJS Patterns](/rxjs/angular-patterns/)** - Common patterns
3. **[Testing](/testing/unit-testing/)** - Test your code

---

**Pro Tip**: **switchMap** is your default choice! Use it for 80% of cases. Only switch to others when you have a specific need (parallel, sequential, or ignore duplicates)! 🎯
