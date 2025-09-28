---
title: Computed Signals ⚡
description: Master computed signals for derived reactive state
sidebar:
  order: 3
---

Computed signals are like smart calculators that automatically update their results whenever their inputs change. Think of them as Excel formulas - when you change a cell, all dependent formulas update automatically!

## 🎯 What are Computed Signals?

**Computed signals are read-only signals that derive their value from other signals.** They automatically recalculate when their dependencies change, giving you efficient reactive derived state.

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

// ✅ Computed signal automatically updates
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe" - automatically updated!
```

## 🚀 Real-World Examples

### 1. **Shopping Cart Totals**

```typescript
@Component({
  template: `
    <div>
      <p>Items: {{ items().length }}</p>
      <p>Total: {{ total() | currency }}</p>
      <p>Tax: {{ tax() | currency }}</p>
      <p>Final: {{ finalTotal() | currency }}</p>
    </div>
  `
})
export class CartComponent {
  items = signal<CartItem[]>([
    { name: 'Laptop', price: 999, quantity: 1 },
    { name: 'Mouse', price: 29, quantity: 2 }
  ]);

  // ✅ All computed signals update automatically
  total = computed(() => 
    this.items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  tax = computed(() => this.total() * 0.08);
  
  finalTotal = computed(() => this.total() + this.tax());
}
```

### 2. **User Profile Status**

```typescript
@Component({
  template: `
    <div>
      <h3>{{ user().name }}</h3>
      <p class="{{ statusClass() }}">{{ statusMessage() }}</p>
      <div class="progress-bar">
        <div [style.width.%]="completionPercentage()"></div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  user = signal({
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '',
    bio: '',
    phone: '555-1234'
  });

  // ✅ Computed signals for derived state
  completionPercentage = computed(() => {
    const user = this.user();
    const fields = [user.name, user.email, user.avatar, user.bio, user.phone];
    const completed = fields.filter(field => field && field.trim()).length;
    return Math.round((completed / fields.length) * 100);
  });

  statusMessage = computed(() => {
    const percentage = this.completionPercentage();
    if (percentage === 100) return 'Profile Complete! 🎉';
    if (percentage >= 75) return 'Almost done! 👍';
    if (percentage >= 50) return 'Making progress... 📝';
    return 'Just getting started 🚀';
  });

  statusClass = computed(() => {
    const percentage = this.completionPercentage();
    if (percentage === 100) return 'status-complete';
    if (percentage >= 75) return 'status-good';
    if (percentage >= 50) return 'status-progress';
    return 'status-start';
  });
}
```

### 3. **Search & Filter**

```typescript
@Component({
  template: `
    <div>
      <input [value]="searchTerm()" (input)="updateSearch($event)" />
      <select [value]="categoryFilter()" (change)="updateCategory($event)">
        <option value="">All Categories</option>
        <option value="tech">Tech</option>
        <option value="books">Books</option>
      </select>
      
      <p>Showing {{ filteredItems().length }} of {{ allItems().length }}</p>
      
      @for (item of filteredItems(); track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </div>
  `
})
export class SearchComponent {
  searchTerm = signal('');
  categoryFilter = signal('');
  
  allItems = signal([
    { id: 1, name: 'MacBook Pro', category: 'tech' },
    { id: 2, name: 'JavaScript Book', category: 'books' },
    { id: 3, name: 'iPhone', category: 'tech' }
  ]);

  // ✅ Computed signal handles complex filtering
  filteredItems = computed(() => {
    const items = this.allItems();
    const search = this.searchTerm().toLowerCase();
    const category = this.categoryFilter();

    return items.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search);
      const matchesCategory = !category || item.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  updateCategory(event: Event) {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }
}
```

## ✅ Best Practices

### 1. **Keep Computations Pure**

```typescript
// ✅ Good - Pure function, no side effects
const total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

// ❌ Avoid - Side effects in computed signals
const badComputed = computed(() => {
  console.log('Computing...'); // Side effect!
  return this.items().length;
});
```

### 2. **Use for Derived State**

```typescript
// ✅ Good - Perfect for derived state
const isFormValid = computed(() => 
  this.email().includes('@') && this.password().length >= 8
);

// ❌ Avoid - Use regular signals for independent state
const currentTime = computed(() => Date.now()); // This won't update!
```

### 3. **Chain Computed Signals**

```typescript
// ✅ Good - Chain computations for complex logic
const subtotal = computed(() => 
  this.items().reduce((sum, item) => sum + item.price, 0)
);

const tax = computed(() => this.subtotal() * 0.08);

const total = computed(() => this.subtotal() + this.tax());
```

## 🎯 Quick Checklist

- [ ] Use computed signals for derived state that depends on other signals
- [ ] Keep computation functions pure (no side effects)
- [ ] Chain computed signals for complex calculations
- [ ] Use computed signals in templates for reactive UI updates
- [ ] Prefer computed over manual calculations in effects
- [ ] Test computed signals by testing their inputs and outputs

## 🚀 Next Steps

1. **[Effects API](/modern/effects/)** - Handle side effects with signals
2. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns
3. **[Control Flow](/modern/control-flow/)** - New template syntax with signals

---

**Remember**: Use computed signals to move complex logic out of templates and into reactive, testable functions. They're perfect for derived state that needs to stay in sync! ⚡
