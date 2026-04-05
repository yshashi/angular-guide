---
title: Memory Management 🧠
description: Prevent memory leaks and manage memory effectively in Angular applications
sidebar:
  order: 9
---

Effective memory management prevents memory leaks, reduces application bloat, and ensures smooth performance. Learn to identify and fix memory issues in Angular applications.

## 🎯 Understanding Memory Leaks

**Common Causes:**
- Unsubscribed observables
- Event listeners not removed
- Timers not cleared
- Detached DOM references
- Circular references
- Global variables

**Symptoms:**
- Increasing memory usage over time
- Slow performance
- Browser crashes
- Unresponsive UI

## 🚀 Subscription Management

### Manual Unsubscribe

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-data',
})
export class DataComponent implements OnDestroy {
  private subscription = new Subscription();
  
  ngOnInit() {
    // Add subscriptions
    this.subscription.add(
      this.dataService.getData().subscribe(data => {
        console.log(data);
      })
    );
    
    this.subscription.add(
      this.userService.getUser().subscribe(user => {
        console.log(user);
      })
    );
  }
  
  ngOnDestroy() {
    // ✅ Clean up all subscriptions
    this.subscription.unsubscribe();
  }
}
```

### takeUntilDestroyed (Modern)

```typescript
import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-modern',
})
export class ModernComponent {
  constructor() {
    // ✅ Automatically unsubscribes on destroy
    this.dataService.getData()
      .pipe(takeUntilDestroyed())
      .subscribe(data => console.log(data));
  }
}
```

### Async Pipe (Best)

```typescript
@Component({
  selector: 'app-users',
  imports: [AsyncPipe],
  template: `
    @if (users$ | async; as users) {
      @for (user of users; track user.id) {
        <div>{{ user.name }}</div>
      }
    }
  `
})
export class UsersComponent {
  users$ = this.userService.getUsers();
  // ✅ Async pipe handles subscription automatically
}
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Always clean up resources to prevent memory leaks.</p>
</blockquote>

### 1. **Event Listener Cleanup**

Let's properly manage DOM event listeners.

```typescript
import { Component, ElementRef, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-scroll-tracker',
})
export class ScrollTrackerComponent implements OnDestroy {
  private el = inject(ElementRef);
  private scrollHandler = this.onScroll.bind(this);
  
  ngOnInit() {
    // ✅ Store reference to remove later
    window.addEventListener('scroll', this.scrollHandler);
  }
  
  onScroll() {
    console.log('Scrolled');
  }
  
  ngOnDestroy() {
    // ✅ Remove event listener
    window.removeEventListener('scroll', this.scrollHandler);
  }
}
```

### 2. **Timer Cleanup**

Let's manage setInterval and setTimeout properly.

```typescript
@Component({
  selector: 'app-timer',
})
export class TimerComponent implements OnDestroy {
  private intervalId?: number;
  private timeoutId?: number;
  
  ngOnInit() {
    // ✅ Store timer IDs
    this.intervalId = window.setInterval(() => {
      console.log('Tick');
    }, 1000);
    
    this.timeoutId = window.setTimeout(() => {
      console.log('Delayed');
    }, 5000);
  }
  
  ngOnDestroy() {
    // ✅ Clear timers
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
```

### 3. **Detached DOM References**

Let's avoid holding references to removed DOM elements.

```typescript
@Component({
  selector: 'app-dynamic',
})
export class DynamicComponent implements OnDestroy {
  private elementRef?: HTMLElement;
  
  createElement() {
    this.elementRef = document.createElement('div');
    document.body.appendChild(this.elementRef);
  }
  
  ngOnDestroy() {
    // ✅ Remove DOM element and clear reference
    if (this.elementRef) {
      this.elementRef.remove();
      this.elementRef = undefined;
    }
  }
}
```

### 4. **WeakMap for Caching**

Let's use WeakMap to prevent memory leaks in caches.

```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  // ✅ WeakMap allows garbage collection
  private cache = new WeakMap<object, any>();
  
  set(key: object, value: any) {
    this.cache.set(key, value);
  }
  
  get(key: object) {
    return this.cache.get(key);
  }
  
  // When key object is garbage collected,
  // the cache entry is automatically removed
}
```

## ✅ Best Practices

### 1. **Always Unsubscribe**

```typescript
// ✅ Good - Use takeUntilDestroyed
this.data$.pipe(takeUntilDestroyed()).subscribe();

// ✅ Good - Use async pipe
template: `{{ data$ | async }}`

// ❌ Avoid - Naked subscription
this.data$.subscribe(); // Memory leak!
```

### 2. **Clean Up Event Listeners**

```typescript
// ✅ Good - Remove listeners
ngOnDestroy() {
  window.removeEventListener('resize', this.handler);
}

// ❌ Avoid - Leaving listeners
ngOnDestroy() {
  // No cleanup - memory leak!
}
```

### 3. **Clear Timers**

```typescript
// ✅ Good - Clear all timers
ngOnDestroy() {
  clearInterval(this.intervalId);
  clearTimeout(this.timeoutId);
}
```

### 4. **Use WeakMap/WeakSet**

```typescript
// ✅ Good - Allows garbage collection
private cache = new WeakMap();

// ❌ Avoid - Prevents garbage collection
private cache = new Map();
```

### 5. **Avoid Global Variables**

```typescript
// ✅ Good - Scoped to component
private data: Data[];

// ❌ Avoid - Global pollution
window.myData = [];
```

## 🔍 Detecting Memory Leaks

### Chrome DevTools Memory Profiler

```typescript
// 1. Open Chrome DevTools
// 2. Go to Memory tab
// 3. Take heap snapshot
// 4. Perform actions
// 5. Take another snapshot
// 6. Compare snapshots
// 7. Look for detached DOM nodes
// 8. Identify growing objects
```

### Angular DevTools

```typescript
// 1. Install Angular DevTools extension
// 2. Open DevTools
// 3. Go to Angular tab
// 4. Check component tree
// 5. Look for components not destroyed
// 6. Monitor change detection cycles
```

## 🎯 Memory Optimization Checklist

- [ ] Use takeUntilDestroyed() for subscriptions
- [ ] Prefer async pipe over manual subscriptions
- [ ] Remove event listeners in ngOnDestroy
- [ ] Clear all timers and intervals
- [ ] Remove detached DOM references
- [ ] Use WeakMap/WeakSet for caching
- [ ] Avoid global variables
- [ ] Profile memory usage regularly
- [ ] Fix circular references
- [ ] Clean up third-party library instances

## 🎓 Learning Checklist

- [ ] Understand common memory leak causes
- [ ] Use takeUntilDestroyed for subscriptions
- [ ] Implement proper cleanup in ngOnDestroy
- [ ] Remove event listeners correctly
- [ ] Clear timers and intervals
- [ ] Use WeakMap for caching
- [ ] Profile memory with Chrome DevTools
- [ ] Identify and fix memory leaks

## 🚀 Next Steps

1. **[Performance Optimization](/advanced/performance/)** - Optimize your applications
2. **[Bundle Optimization](/advanced/bundle-optimization/)** - Reduce bundle sizes
3. **[Micro Frontends](/advanced/micro-frontends/)** - Scale your architecture

---

**Pro Tip**: Memory leaks are silent killers! Use Chrome DevTools Memory Profiler regularly to catch leaks early. Always clean up subscriptions, event listeners, and timers in ngOnDestroy! 🧠
