---
title: Resource API 🧪
description: Explore the Resource API for async data handling
sidebar:
  order: 6
---

The Resource API provides automatic loading states, error handling, and reactive updates for async data. Angular offers two types: `resource()` for Promises and `rxResource()` for Observables.

> The Resource API provides automatic loading states, error handling, and reactive updates for async data. Angular offers two types: `resource()` for Promises and `rxResource()` for Observables.

## 🎯 What are Resources?

**Resources automatically manage async data** with built-in loading, error, and success states. They integrate seamlessly with Angular signals.

**Key Benefits:**
- **Automatic Loading States** - Built-in `isLoading()` signal
- **Error Handling** - Built-in `error()` signal
- **Reactive Updates** - Refetches when parameters change
- **Race Condition Prevention** - Cancels previous requests

## 🔄 resource() - For Promises

**Use when working with Promises** (async/await, HTTP calls converted to Promises):

```typescript
@Component({
  template: `
    @if (booksResource.isLoading()) {
      <p>Loading...</p>
    }
    @if (booksResource.error(); as error) {
      <p>Error: {{ error.message }}</p>
    }
    @if (booksResource.value(); as books) {
      @for (book of books; track book.id) {
        <div>{{ book.title }}</div>
      }
    }
  `
})
export class BookListComponent {
  private bookService = inject(BookService);

  booksResource = resource({
    loader: () => this.bookService.getBooks() // Returns Promise<Book[]>
  });
}
```

### With Parameters

**Automatically refetches when parameters change:**

```typescript
@Component({
  template: `
    <input 
      [value]="searchQuery()"
      (input)="updateSearch($event)"
      placeholder="Search..."
    />
    @if (searchResource.value(); as books) {
      @for (book of books; track book.id) {
        <div>{{ book.title }}</div>
      }
    }
  `
})
export class SearchComponent {
  searchQuery = signal('');

  searchResource = resource({
    params: () => ({ query: this.searchQuery() }),
    loader: ({ params }) => this.bookService.search(params.query)
  });

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
```

## 📡 rxResource() - For Observables

**Use when working with Observables** (RxJS streams, HTTP calls):

```typescript
@Component({
  template: `
    @if (dataResource.isLoading()) {
      <p>Loading...</p>
    }
    @if (dataResource.value(); as data) {
      <div>{{ data.message }}</div>
    }
  `
})
export class LiveDataComponent {
  dataResource = rxResource({
    stream: () => {
      return timer(0, 1000).pipe(
        switchMap(() => this.dataService.getLiveData()) // Returns Observable
      );
    }
  });
}
```

### With Debouncing

**Debounce search to avoid too many requests:**

```typescript
@Component({
  template: `
    <input 
      [value]="searchQuery()"
      (input)="updateSearch($event)"
    />
    @if (searchResource.value(); as results) {
      @for (item of results; track item.id) {
        <div>{{ item.name }}</div>
      }
    }
  `
})
export class DebouncedSearchComponent {
  searchQuery = signal('');

  searchResource = rxResource({
    params: () => ({ query: this.searchQuery() }),
    stream: ({ params }) => {
      return of(params.query).pipe(
        debounceTime(300), // 300ms debounce
        switchMap((query) => this.searchService.search(query))
      );
    }
  });

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
```

## 🔧 Key Differences

| Feature | `resource()` | `rxResource()` |
|---------|-------------|----------------|
| **Input** | Promise | Observable |
| **Property** | `loader` | `stream` |
| **Parameters** | `params` | `params` |
| **Use Case** | async/await, HTTP → Promise | RxJS streams, HTTP → Observable |
| **Cancellation** | AbortSignal | Automatic unsubscribe |
| **Multiple Values** | Single value | Can emit multiple values |

## 🎯 Manual Loading

**Control when loading happens:**

```typescript
@Component({
  template: `
    <button (click)="loadData()">Load Data</button>
    @if (dataResource.value(); as data) {
      <div>{{ data.message }}</div>
    }
  `
})
export class ManualLoadComponent {
  shouldLoad = signal<boolean | undefined>(undefined);

  dataResource = resource({
    params: () => this.shouldLoad() ? {} : undefined, // undefined = don't load
    loader: () => this.dataService.getData()
  });

  loadData() {
    this.shouldLoad.set(true);
  }
}
```

## ✅ Best Practices

**1. Always handle all states:**
```typescript
@if (resource.isLoading()) { <p>Loading...</p> }
@if (resource.error(); as error) { <p>Error: {{ error.message }}</p> }
@if (resource.value(); as data) { <div>{{ data }}</div> }
```

**2. Provide default values:**
```typescript
booksResource = resource({
  loader: () => this.bookService.getBooks(),
  defaultValue: [] // Prevents undefined
});
```

**3. Use reload() for manual refresh:**
```typescript
<button (click)="booksResource.reload()">Refresh</button>
```

## 🎯 Quick Reference

- **`resource()`** → Promises (async/await)
- **`rxResource()`** → Observables (RxJS)
- **`params`** → Parameters that trigger refetch
- **`loader`** → Function that returns Promise (resource only)
- **`stream`** → Function that returns Observable (rxResource only)
- **`defaultValue`** → Initial value (prevents undefined)
- **`reload()`** → Manual refresh
- **`isLoading()`** → Loading state signal
- **`error()`** → Error state signal
- **`value()`** → Data signal
- **`status()`** → Resource status string (v20: 'idle', 'loading', 'reloading', 'error', 'resolved', 'local')

## 🚀 Next Steps

1. **[HttpResource API](/modern/http-resource-api/)** - Specialized HTTP handling
2. **[Control Flow](/modern/control-flow/)** - New template syntax
3. **[Zoneless Angular](/modern/zoneless/)** - Performance optimization

---

**Remember**: Resources handle loading states, errors, and race conditions automatically! 🧪
