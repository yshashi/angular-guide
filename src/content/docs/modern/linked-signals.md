---
title: Linked Signals 🔗
description: Master linked signals — writable computed signals stable since Angular 19
sidebar:
  order: 5
---

Linked signals are like having a smart assistant that automatically updates one piece of information whenever related information changes, but unlike computed signals, you can also manually override the values when needed. Think of it as a computed signal that you can write to!

## 🎯 What Are Linked Signals?

**LinkedSignal** creates writable signals derived from other signals. Introduced in Angular 19 and now stable, it's similar to `computed()`, but the key difference is that `computed()` returns a read-only signal, whereas `linkedSignal()` returns a writable signal.

**Key Benefits:**
- **Writable Computed** - Derive values but still allow manual updates
- **Signal Input Support** - Perfect for working with input signals
- **Conditional Logic** - Handle complex state synchronization
- **Previous State Access** - Access both current and previous values
- **Multiple Sources** - Combine multiple signals into one

## 🔗 LinkedSignal vs Computed

**The key difference explained:**

```typescript
// ❌ Computed - Read-only signal
const itemCount = computed(() => this.items().length);
// itemCount.set(5); // ❌ Error! Cannot write to computed

// ✅ LinkedSignal - Writable signal  
const itemCount = linkedSignal(() => this.items().length);
itemCount.set(5); // ✅ Works! Can override the derived value
```

## 📝 Two Syntax Forms

### 1. **Short Form** - Simple Derivation

```typescript
// Simple syntax - like computed but writable
const itemCount = linkedSignal(() => this.items().length);
```

### 2. **Object Form** - Advanced Control

```typescript
// Object syntax - more control over computation
const itemCount = linkedSignal({
  source: this.items,
  computation: (items, previous) => {
    // Access both current items and previous state
    return items.length;
  }
});
```

## 🎯 Real-World Use Cases
### Use Case 1: Volume Control with Default

**Perfect for audio components that have default volume but allow user overrides:**

```typescript
@Component({
  selector: 'app-audio-player',
  template: `
    <div class="audio-player">
      <h3>🎵 Music Player</h3>
      
      <div class="controls">
        <button (click)="togglePlay()">
          {{ isPlaying() ? '⏸️ Pause' : '▶️ Play' }}
        </button>
        
        <div class="volume-control">
          <label>Volume: {{ currentVolume() }}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            [value]="currentVolume()" 
            (input)="adjustVolume($event)"
          />
          <button (click)="resetToDefault()">Reset</button>
        </div>
      </div>
    </div>
  `
})
export class AudioPlayerComponent {
  // ✅ Signal input - parent can set default volume
  readonly defaultVolume = input(50);
  
  // ✅ LinkedSignal - starts with default but user can override
  currentVolume = linkedSignal(() => this.defaultVolume());
  
  isPlaying = signal(false);
  
  adjustVolume(event: Event) {
    const volume = (event.target as HTMLInputElement).valueAsNumber;
    this.currentVolume.set(volume);
  }
  
  resetToDefault() {
    // Reset to the original default volume
    this.currentVolume.set(this.defaultVolume());
  }
  
  togglePlay() {
    this.isPlaying.update(playing => !playing);
  }
}

// Usage:
// <app-audio-player [defaultVolume]="75" />  <!-- Starts at 75% -->
// <app-audio-player [defaultVolume]="25" />  <!-- Starts at 25% -->
```

### Use Case 2: Smart Theme Switcher

**Perfect for theme management that adapts to system preferences but allows user overrides:**

```typescript
@Component({
  selector: 'app-theme-switcher',
  template: `
    <div class="theme-controls">
      <h3>🎨 Theme Settings</h3>
      
      <div class="current-theme">
        Current Theme: <strong>{{ currentTheme() }}</strong>
      </div>
      
      <div class="theme-buttons">
        <button (click)="setTheme('light')">☀️ Light</button>
        <button (click)="setTheme('dark')">🌙 Dark</button>
        <button (click)="followSystem()">🖥️ Follow System</button>
      </div>
      
      <p class="system-info">
        System prefers: {{ systemTheme() }}
      </p>
    </div>
  `
})
export class ThemeSwitcherComponent implements OnInit {
  // System theme detection
  systemTheme = signal<'light' | 'dark'>('light');
  
  // ✅ LinkedSignal with object syntax for smart theme management
  currentTheme = linkedSignal<'light' | 'dark', 'light' | 'dark'>({
    source: this.systemTheme,
    computation: (systemTheme, previous) => {
      // If user has manually set a theme, keep it
      if (previous?.value && this.userHasOverridden) {
        return previous.value;
      }
      // Otherwise, follow system theme
      return systemTheme;
    }
  });
  
  private userHasOverridden = false;
  
  ngOnInit() {
    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemTheme.set(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      this.systemTheme.set(e.matches ? 'dark' : 'light');
    });
  }
  
  setTheme(theme: 'light' | 'dark') {
    this.userHasOverridden = true;
    this.currentTheme.set(theme);
  }
  
  followSystem() {
    this.userHasOverridden = false;
    // Reset to follow system theme
    this.currentTheme.set(this.systemTheme());
  }
}
```

## 🎭 Advanced Patterns

### Multiple Sources - Shopping Cart Total

**Combine price, quantity, and discount signals into smart total calculation:**

```typescript
@Component({
  selector: 'app-cart-item',
  template: `
    <div class="cart-item">
      <h4>{{ productName() }}</h4>
      
      <div class="price-controls">
        <label>Price: $</label>
        <input 
          type="number" 
          [value]="basePrice()" 
          (input)="updatePrice($event)"
          step="0.01"
        />
      </div>
      
      <div class="quantity-controls">
        <label>Quantity:</label>
        <button (click)="decreaseQty()">-</button>
        <span>{{ quantity() }}</span>
        <button (click)="increaseQty()">+</button>
      </div>
      
      <div class="discount-controls">
        <label>Discount %:</label>
        <input 
          type="number" 
          [value]="discountPercent()" 
          (input)="updateDiscount($event)"
          min="0" 
          max="100"
        />
      </div>
      
      <div class="totals">
        <p>Subtotal: ${{ subtotal().toFixed(2) }}</p>
        <p>Discount: -${{ discountAmount().toFixed(2) }}</p>
        <p><strong>Final Total: ${{ finalTotal().toFixed(2) }}</strong></p>
        <button (click)="applyCustomTotal()">Apply Custom Total</button>
      </div>
    </div>
  `
})
export class CartItemComponent {
  productName = signal('Wireless Headphones');
  basePrice = signal(99.99);
  quantity = signal(1);
  discountPercent = signal(0);

  // ✅ LinkedSignal combining multiple sources
  finalTotal = linkedSignal<
    { price: number; qty: number; discount: number }, // Source type
    number                                           // Return type
  >({
    source: () => ({
      price: this.basePrice(),
      qty: this.quantity(),
      discount: this.discountPercent()
    }),
    computation: (data) => {
      const subtotal = data.price * data.qty;
      const discountAmount = subtotal * (data.discount / 100);
      return subtotal - discountAmount;
    }
  });

  // Computed helpers for display
  subtotal = computed(() => this.basePrice() * this.quantity());
  discountAmount = computed(() => this.subtotal() * (this.discountPercent() / 100));

  updatePrice(event: Event) {
    const price = (event.target as HTMLInputElement).valueAsNumber || 0;
    this.basePrice.set(price);
  }

  updateDiscount(event: Event) {
    const discount = (event.target as HTMLInputElement).valueAsNumber || 0;
    this.discountPercent.set(Math.max(0, Math.min(100, discount)));
  }

  increaseQty() {
    this.quantity.update(qty => qty + 1);
  }

  decreaseQty() {
    this.quantity.update(qty => Math.max(1, qty - 1));
  }

  applyCustomTotal() {
    // ✅ Override the calculated total with a custom value
    this.finalTotal.set(49.99);
  }
}
```

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

@Component({
  selector: 'app-smart-cart',
  template: `
    <div class="smart-cart">
      <h3>Smart Shopping Cart</h3>
      
      <!-- Cart items -->
      <div class="cart-items">
        @for (item of cartItems(); track item.id) {
          <div class="cart-item">
            <span>{{ item.name }}</span>
            <span>\${{ item.price }} x {{ item.quantity }}</span>
            <button (click)="removeItem(item.id)">Remove</button>
          </div>
        }
      </div>

      <!-- Automatically calculated totals -->
      <div class="cart-summary">
        <p>Subtotal: \${{ subtotal() }}</p>
        <p>Tax: \${{ tax() }}</p>
        <p>Shipping: \${{ shippingCost() }}</p>
        <h4>Total: \${{ finalTotal() }}</h4>
      </div>

      <!-- Smart recommendations -->
      <div class="recommendations">
        <h4>Smart Suggestions</h4>
        @for (suggestion of smartSuggestions(); track suggestion) {
          <p class="suggestion">{{ suggestion }}</p>
        }
      </div>

      <!-- Loyalty points -->
      <div class="loyalty">
        <p>Points Earned: {{ pointsEarned() }}</p>
        <p>Loyalty Tier: {{ loyaltyTier() }}</p>
      </div>
    </div>
  `
})
export class SmartCartComponent {
  // Source signal - the cart items
  cartItems = signal<CartItem[]>([
    { id: '1', name: 'Laptop', price: 999, quantity: 1, category: 'Electronics' },
    { id: '2', name: 'Mouse', price: 25, quantity: 2, category: 'Electronics' }
  ]);

  // Linked signal - automatically calculates subtotal
  subtotal = linkedSignal(() => {
    return this.cartItems().reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
  });

  // Linked signal - calculates tax based on subtotal
  tax = linkedSignal(() => {
    return Math.round(this.subtotal() * 0.08 * 100) / 100;
  });

  // Linked signal - smart shipping calculation
  shippingCost = linkedSignal(() => {
    const subtotal = this.subtotal();
    const itemCount = this.cartItems().length;
    
    if (subtotal > 100) return 0; // Free shipping
    if (itemCount > 3) return 5;  // Bulk discount
    return 10; // Standard shipping
  });

  // Linked signal - final total
  finalTotal = linkedSignal(() => {
    return Math.round((this.subtotal() + this.tax() + this.shippingCost()) * 100) / 100;
  });

  // Linked signal - smart suggestions based on cart content
  smartSuggestions = linkedSignal(() => {
    const items = this.cartItems();
    const categories = new Set(items.map(item => item.category));
    const total = this.subtotal();
    const suggestions: string[] = [];

    if (categories.has('Electronics') && !items.some(item => item.name.includes('Cable'))) {
      suggestions.push('📱 Add cables for your electronics');
    }

    if (total > 50 && total < 100) {
      suggestions.push(`💰 Add $${(100 - total).toFixed(2)} more for free shipping!`);
    }

    if (items.length === 1) {
      suggestions.push('🛍️ Bundle items for better deals');
    }

    return suggestions;
  });

  // Linked signal - loyalty points calculation
  pointsEarned = linkedSignal(() => {
    return Math.floor(this.subtotal() / 10); // 1 point per $10
  });

  // Linked signal - loyalty tier based on points
  loyaltyTier = linkedSignal(() => {
    const points = this.pointsEarned();
    if (points >= 100) return 'Gold 🥇';
    if (points >= 50) return 'Silver 🥈';
    return 'Bronze 🥉';
  });

  removeItem(id: string) {
    this.cartItems.update(items => items.filter(item => item.id !== id));
    // All linked signals automatically recalculate!
  }

  addItem(item: CartItem) {
    this.cartItems.update(items => [...items, item]);
  }
}
```
## ✅ Best Practices

### 1. **Keep Linked Signals Pure**
```typescript
// ✅ Good - Pure function
const doubledValue = linkedSignal(() => this.baseValue() * 2);

// ❌ Avoid - Side effects
const impureSignal = linkedSignal(() => {
  console.log('Computing...'); // Side effect!
  return this.baseValue() * 2;
});
```

### 2. **Use Meaningful Names**
```typescript
// ✅ Good - Descriptive names
const totalPrice = linkedSignal(() => this.calculateTotal());
const isFormValid = linkedSignal(() => this.validateForm());

// ❌ Avoid - Generic names
const result = linkedSignal(() => this.calculate());
const flag = linkedSignal(() => this.check());
```

### 3. **Optimize Complex Calculations**
```typescript
// ✅ Good - Memoized expensive operations
const expensiveCalculation = linkedSignal(() => {
  const data = this.sourceData();
  // Only recalculates when sourceData changes
  return this.performComplexOperation(data);
});
```

## 🎯 Quick Checklist

- [ ] Use linked signals for derived state
- [ ] Keep linked signal functions pure (no side effects)
- [ ] Use descriptive names for linked signals
- [ ] Leverage automatic dependency tracking
- [ ] Combine with other signals for complex workflows
- [ ] Test linked signal behavior thoroughly
- [ ] Document complex linked signal relationships
- [ ] Use TypeScript for type safety

## 🚀 Next Steps

1. **[Resource API](/modern/resource-api/)** - Async data handling with signals
2. **[Control Flow](/modern/control-flow/)** - New template syntax patterns
3. **[Zoneless Angular](/modern/zoneless/)** - Performance optimization

---

**Remember**: Linked signals are like having a smart assistant that keeps everything in sync automatically. Use them to create reactive, maintainable applications where data flows naturally! 🔗
