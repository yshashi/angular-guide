---
title: Effects API 🎭
description: Handle side effects with Angular Effects API
sidebar:
  order: 4
---

Effects are like having a smart assistant that automatically does things when your data changes. Think of them as "reactive side effects" - they run automatically when signals change, perfect for logging, API calls, or DOM updates.

## 🎯 What are Effects?

**Effects run code automatically when signals change.** Unlike computed signals that return values, effects are for side effects - talking to APIs, updating the DOM, or logging data.

```typescript
@Component({
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()">+</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);

  constructor() {
    // ✅ Effect runs automatically when count changes
    effect(() => {
      console.log(`Count is now: ${this.count()}`);
      // Save to localStorage, send analytics, etc.
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }
}
```

## 🚀 Common Use Cases

### 1. **Auto-Save Data**

```typescript
@Component({
  template: `<input [value]="text()" (input)="updateText($event)" />`
})
export class AutoSaveComponent {
  text = signal('');

  constructor() {
    effect(() => {
      // Auto-save whenever text changes
      localStorage.setItem('draft', this.text());
    });
  }

  updateText(event: Event) {
    this.text.set((event.target as HTMLInputElement).value);
  }
}
```

### 2. **DOM Event Listeners**

```typescript
@Component({
  template: `<p>Window width: {{ windowWidth() }}px</p>`
})
export class WindowTrackerComponent {
  windowWidth = signal(window.innerWidth);

  constructor() {
    effect((onCleanup) => {
      const handleResize = () => {
        this.windowWidth.set(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);
      
      // ✅ Cleanup when component destroys
      onCleanup(() => {
        window.removeEventListener('resize', handleResize);
      });
    });
  }
}
```

### 3. **API Calls & Data Sync**

```typescript
@Component({
  template: `
    <div>
      <input [value]="searchTerm()" (input)="updateSearch($event)" />
      <div>Results: {{ results().length }}</div>
    </div>
  `
})
export class SearchComponent {
  searchTerm = signal('');
  results = signal<any[]>([]);
  
  constructor() {
    effect(() => {
      const term = this.searchTerm();
      if (term.length > 2) {
        // ✅ Automatically search when term changes
        this.searchAPI(term);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  async searchAPI(term: string) {
    const response = await fetch(`/api/search?q=${term}`);
    const data = await response.json();
    this.results.set(data);
  }
}
```

## ✅ Best Practices

### 1. **Keep Effects Simple**

```typescript
// ✅ Good - Simple, focused effect
effect(() => {
  localStorage.setItem('theme', this.theme());
});

// ❌ Avoid - Complex logic in effects
effect(() => {
  if (this.user() && this.settings() && this.preferences()) {
    // Too much logic here...
  }
});
```

### 2. **Always Clean Up**

```typescript
// ✅ Good - Proper cleanup
effect((onCleanup) => {
  const interval = setInterval(() => {
    this.updateTime();
  }, 1000);
  
  onCleanup(() => clearInterval(interval));
});
```

### 3. **Use for Side Effects Only**

```typescript
// ✅ Good - Side effects (logging, API calls, DOM updates)
effect(() => {
  console.log('User logged in:', this.user().name);
  this.trackUserActivity(this.user().id);
});

// ❌ Avoid - Use computed() for derived values instead
effect(() => {
  this.fullName.set(this.firstName() + ' ' + this.lastName()); // Wrong!
});

// ✅ Better - Use computed for derived values
fullName = computed(() => this.firstName() + ' ' + this.lastName());
```

## 🎯 Quick Checklist

- [ ] Use effects for side effects (API calls, DOM updates, logging)
- [ ] Keep effect functions simple and focused
- [ ] Always clean up resources (event listeners, intervals, subscriptions)
- [ ] Use computed() for derived values, not effects
- [ ] Test effects by testing their side effects, not the effect itself

## 🚀 Next Steps

1. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns
2. **[Resource API](/modern/resource-api/)** - Async data handling with signals
3. **[Control Flow](/modern/control-flow/)** - New template syntax with signals

---

**Remember**: Effects are perfect for bridging the gap between Angular's reactive signals and the imperative world of DOM APIs, third-party libraries, and external services! 🎭
