---
title: Zoneless Angular ⚡
description: Learn about zoneless change detection in Angular
sidebar:
  order: 8
---

Zoneless Angular is like upgrading from a gas-powered car to an electric vehicle - you get better performance, more efficiency, and a smoother experience. Think of it as removing the middleman (Zone.js) and letting Angular's signals handle change detection directly.

## 🎯 What is Zoneless Angular?

**Zoneless Angular removes the dependency on Zone.js** for change detection, relying instead on signals and modern reactive patterns. Zone.js has been quietly monkey-patching browser APIs like `setTimeout`, `Promise`, and `addEventListener` to track async operations, but this can trigger unnecessary change detection cycles.

**Key Benefits:**
- **Better Performance** - No more unnecessary change detection cycles
- **Smaller Bundle Size** - No Zone.js means less JavaScript to download
- **Predictable Behavior** - Explicit change detection triggers
- **Better Debugging** - Clearer understanding of when updates happen
- **Future-Ready** - Aligns with modern web development patterns

## 🔧 What Triggers Change Detection in Zoneless Mode?

**Only these specific events trigger change detection:**
- DOM events bound in templates (e.g., `(click)`)
- Signal updates
- The `async` pipe usage
- Input changes via `ComponentRef.setInput()`
- Manual `ChangeDetectorRef.markForCheck()` calls
- Component creation or destruction

> **Angular 20 Update**: Zoneless is now in **Developer Preview** with improved SSR support and global error handling!

## ⚡ Enabling Zoneless Mode

### Basic Setup

**Think of enabling zoneless mode like switching to eco-mode** - you're optimizing for efficiency and performance.

```typescript
// main.ts - Angular 20+
import { bootstrapApplication } from '@angular/platform-browser';
import { 
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners 
} from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Enable zoneless change detection
    provideZonelessChangeDetection(),
    // Handle global errors in zoneless mode
    provideBrowserGlobalErrorListeners(),
    // Your other providers...
  ]
}).catch(err => console.error(err));
```

> **Important**: Remove Zone.js polyfill from `angular.json` when using zoneless mode. Angular will warn you in the console if you forget!

## 🔍 Zoneless vs Zone.js: What Works and What Doesn't

**Understanding these scenarios helps you migrate successfully:**

### ✅ What Works in Zoneless Mode

```typescript
// ✅ Click handlers - work perfectly
<button (click)="count = count + 1">Update</button>

// ✅ Signal updates - the preferred way
count = signal(0);
increment() { this.count.update(c => c + 1); }

// ✅ HTTP with async pipe - still works
<pre>{{ posts$ | async | json }}</pre>

// ✅ Manual change detection - when needed
this.data = newValue;
this.cdRef.markForCheck();
```

### ❌ What Doesn't Work in Zoneless Mode

```typescript
// ❌ HTTP with subscribe - no automatic change detection
this.http.get('/api/posts').subscribe(data => {
  this.data = data; // Won't trigger UI update
});

// ❌ Timer-based updates - won't update UI
setInterval(() => {
  this.count++; // Won't trigger change detection
}, 1000);

// ✅ Fix: Use signals instead
setInterval(() => {
  this.count.update(c => c + 1); // Works!
}, 1000);
```

## 🚀 How to Prepare for Zoneless Mode

### 1. Go All-In on OnPush

**If your app works well with OnPush, you're ready for zoneless!**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Your component will work smoothly in zoneless mode
})
```

### 2. Use Signals for Everything

**Signals are the cheat code for zoneless Angular:**

```typescript
// Convert Observables to Signals
const posts = toSignal(this.postService.getPosts());

// Use signals for all reactive state
count = signal(0);
items = signal<Item[]>([]);
```

### Component Optimization for Zoneless

**Think of this like tuning your car for maximum efficiency** - every component needs to be optimized for the new system.

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <div class="counter-app">
      <h3>Zoneless Counter</h3>
      
      <!-- Signal-based reactive UI -->
      <div class="counter-display">
        <div class="count-value">{{ count() }}</div>
        <p>Double: {{ doubleCount() }}</p>
        <p>Is Even: {{ isEven() ? 'Yes' : 'No' }}</p>
      </div>

      <!-- Controls -->
      <div class="counter-controls">
        <button (click)="decrement()" [disabled]="count() <= 0">-</button>
        <button (click)="increment()">+</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush // Important for zoneless
})
export class CounterComponent {
  // Signals for reactive state
  count = signal(0);

  // Computed signals automatically update
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);

  increment() {
    this.count.update(c => c + 1);
  }

  decrement() {
    this.count.update(c => Math.max(0, c - 1));
  }

  reset() {
    this.count.set(0);
  }
}
```

## ⚡ Hybrid Scheduling (Angular 18+)

**The best of both worlds** - signals work even outside Angular's zone!

```typescript
// This now works perfectly in Angular 18+
ngZone.runOutsideAngular(() => {
  setInterval(() => {
    this.count.set(this.count() + 1); // Signal updates trigger change detection!
  }, 1000);
});
```

**Before Angular 18**: Signal updates outside the zone wouldn't update the UI.  
**After Angular 18**: Signal updates always schedule change detection, no matter where they happen.

## 🔄 Simple Data Fetching in Zoneless Mode

**Convert Observables to Signals for seamless reactivity:**

```typescript
@Component({
  template: `
    <div class="data-loader">
      <h3>Zoneless Data Fetching</h3>
      
      @if (isLoading()) {
        <p>Loading posts...</p>
      }
      
      @if (posts(); as postList) {
        @for (post of postList; track post.id) {
          <div class="post">
            <h4>{{ post.title }}</h4>
            <p>{{ post.content }}</p>
          </div>
        }
      }
      
      <button (click)="refreshPosts()">Refresh</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataLoaderComponent {
  private http = inject(HttpClient);
  
  // Convert Observable to Signal - the zoneless way!
  posts = toSignal(this.http.get<Post[]>('/api/posts'), { initialValue: [] });
  isLoading = signal(false);

  async refreshPosts() {
    this.isLoading.set(true);
    try {
      const newPosts = await firstValueFrom(this.http.get<Post[]>('/api/posts'));
      // Update signal to trigger UI update
      this.posts.set(newPosts);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## ✅ Best Practices for Zoneless Angular

### 1. Use OnPush Change Detection

```typescript
// ✅ Good - Always use OnPush in zoneless mode
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Your component will work smoothly
})
```

### 2. **Prefer Signals Over Traditional State**

```typescript
// ✅ Good - Use signals for reactive state
class MyComponent {
  count = signal(0);
  items = signal<Item[]>([]);
}

// ❌ Avoid - Traditional properties won't trigger updates
class MyComponent {
  count = 0;
  items: Item[] = [];
}
```

### 3. **Handle Async Operations Properly**

```typescript
// ✅ Good - Use signals with async operations
async loadData() {
  this.loading.set(true);
  try {
    const data = await this.service.getData();
    this.data.set(data);
  } finally {
    this.loading.set(false);
  }
}

// ❌ Avoid - Direct property assignment won't trigger UI updates
async loadData() {
  this.loading = true;
  this.data = await this.service.getData(); // Won't update UI in zoneless mode
  this.loading = false;
}
```

## 🎯 Quick Checklist

- [ ] Enable zoneless change detection in bootstrap
- [ ] Use OnPush change detection strategy
- [ ] Replace properties with signals
- [ ] Use computed signals for derived state
- [ ] Handle async operations with signals
- [ ] Test thoroughly in zoneless mode
- [ ] Monitor bundle size improvements
- [ ] Verify performance gains

## 🚀 Next Steps

1. **[New Template Syntax](/modern/template-syntax/)** - @let and more features
2. **[Signal Forms](/modern/signal-forms/)** - Modern form handling
3. **[Incremental Hydration](/modern/incremental-hydration/)** - SSR optimization

---

**Remember**: Zoneless Angular is like switching to a high-performance electric engine - you get better efficiency, cleaner code, and improved user experience. Embrace signals and reactive patterns for the best results! ⚡
