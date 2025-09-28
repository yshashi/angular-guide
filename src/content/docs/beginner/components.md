---
title: Components Basics 🧩
description: Master Angular components - the building blocks of your application
sidebar:
  order: 4
---

Components are the building blocks of Angular applications. Each component controls a part of the screen and combines HTML template, TypeScript logic, and CSS styles.

## 🎯 What is a Component?

A component consists of:
- **Template** (HTML) - What the user sees
- **Class** (TypeScript) - Logic and data
- **Styles** (CSS) - How it looks
- **Metadata** (Decorator) - Configuration

```typescript
@Component({
  selector: 'app-user-card',
  template: `<h2>{{user.name}}</h2>`,
  styles: [`h2 { color: blue; }`]
})
export class UserCard {
  user = { name: 'John Doe' };
}
```

## 🛠️ Creating Components

### Using Angular CLI (Recommended)
```bash
# Generate a new component
ng generate component user-profile

# Short form
ng g c user-profile

# Generate in specific folder
ng g c components/user-profile
```

### Manual Creation
Create three files:

**user-profile.ts**
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfile {
  userName = 'Jane Smith';
  userEmail = 'jane@example.com';
  
  showProfile() {
    alert(`User: ${this.userName}`);
  }
}
```

**user-profile.html**
```html
<div class="profile-card">
  <h2>{{userName}}</h2>
  <p>{{userEmail}}</p>
  <button (click)="showProfile()">Show Profile</button>
</div>
```

**user-profile.css**
```css
.profile-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  max-width: 300px;
}

h2 {
  color: #333;
  margin-top: 0;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
```

## 🔧 Component Decorator Options

```typescript
@Component({
  selector: 'app-example',              // How to use: <app-example>
  templateUrl: './example.html',        // External template
  template: `<h1>Inline template</h1>`, // Inline template
  styleUrls: ['./example.css'],         // External styles
  styles: [`h1 { color: red; }`],       // Inline styles
  imports: [CommonModule, FormsModule]  // Required imports
})
```

## 📊 Component Properties and Methods

```typescript
export class Product {
  // Properties
  productName = 'iPhone 15';
  price = 999;
  inStock = true;
  tags = ['electronics', 'mobile', 'apple'];
  
  // Computed property (getter)
  get formattedPrice(): string {
    return `$${this.price.toFixed(2)}`;
  }
  
  // Methods
  addToCart(): void {
    console.log(`Added ${this.productName} to cart`);
  }
  
  toggleStock(): void {
    this.inStock = !this.inStock;
  }
  
  // Private method
  private calculateDiscount(): number {
    return this.price * 0.1;
  }
}
```

## 🎨 Using Components

### In Templates
```html
<!-- Using the component -->
<app-user-profile></app-user-profile>

<!-- Multiple instances -->
<div class="users">
  <app-user-profile></app-user-profile>
  <app-user-profile></app-user-profile>
</div>
```

### Component Selector Types
```typescript
// Element selector (most common)
selector: 'app-header'
// Usage: <app-header></app-header>

// Attribute selector
selector: '[app-highlight]'
// Usage: <div app-highlight></div>

// Class selector
selector: '.app-widget'
// Usage: <div class="app-widget"></div>
```

## 🔄 Component Lifecycle

Components have lifecycle hooks that let you tap into key moments:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

export class MyComponent implements OnInit, OnDestroy {
  
  ngOnInit(): void {
    // Called after component initialization
    console.log('Component initialized');
  }
  
  ngOnDestroy(): void {
    // Called before component is destroyed
    console.log('Component destroyed');
  }
}
```

### Key Lifecycle Hooks
- **ngOnInit** - Component initialized
- **ngOnChanges** - Input properties changed
- **ngOnDestroy** - Component about to be destroyed
- **ngAfterViewInit** - View fully initialized

## 📡 Component Communication

### Parent to Child (@Input) [Learn about the new Signal input in modern section]
```typescript
// Child component
export class ChildComponent {
  @Input() message: string = '';
  @Input() count: number = 0;
}
```

```html
<!-- Parent template -->
<app-child [message]="parentMessage" [count]="5"></app-child>
```

### Child to Parent (@Output) [Learn about the new Signal output in modern section]
```typescript
// Child component
import { Output, EventEmitter } from '@angular/core';

export class ChildComponent {
  @Output() notify = new EventEmitter<string>();
  
  sendMessage(): void {
    this.notify.emit('Hello from child!');
  }
}
```

```html
<!-- Parent template -->
<app-child (notify)="handleMessage($event)"></app-child>
```

## 🏗️ Standalone Components (Modern)

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-counter',
  standalone: true, // not required from v19 and above
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h3>Counter: {{count}}</h3>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
    </div>
  `
})
export class Counter {
  count = 0;
  
  increment(): void {
    this.count++;
  }
  
  decrement(): void {
    this.count--;
  }
}
```

## 🎯 Practical Example: Product Card

Let's build a reusable product card component:

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

@Component({
  selector: 'app-product-card',
  imports: [CommonModule],
  template: `
    <div class="product-card" [class.out-of-stock]="!product.inStock">
      <img [src]="product.image" [alt]="product.name">
      <div class="product-info">
        <h3>{{product.name}}</h3>
        <p class="price">\${{product.price}}</p>
        <p class="stock" *ngIf="!product.inStock">Out of Stock</p>
        <button 
          (click)="onAddToCart()" 
          [disabled]="!product.inStock"
          class="add-btn">
          Add to Cart
        </button>
      </div>
    </div>
  `,
})
export class ProductCard {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  
  onAddToCart(): void {
    if (this.product.inStock) {
      this.addToCart.emit(this.product);
    }
  }
}
```

**Usage:**
```html
<app-product-card 
  [product]="selectedProduct"
  (addToCart)="handleAddToCart($event)">
</app-product-card>
```

## ✅ Best Practices

### 1. **Single Responsibility**
Each component should have one clear purpose.

### 2. **Small and Focused**
Keep components small and focused on their specific task.

### 3. **Reusable Design**
Design components to be reusable across different parts of your app.

### 4. **Clear Naming**
Use descriptive names that indicate the component's purpose.

### 5. **Input Validation**
Always validate inputs and provide defaults.

```typescript
@Input() set count(value: number) {
  this._count = value >= 0 ? value : 0;
}
get count(): number {
  return this._count;
}
private _count = 0;
```

## 🎯 Quick Checklist

- [ ] Understand component structure (template, class, styles, metadata)
- [ ] Know how to create components with CLI
- [ ] Use @Input() for parent-to-child communication
- [ ] Use @Output() for child-to-parent communication
- [ ] Implement lifecycle hooks when needed
- [ ] Create reusable, focused components
- [ ] Use standalone components for modern Angular

## 🚀 Next Steps

1. **[Templates & Data Binding](/beginner/templates/)** - Master template syntax
2. **[Directives](/beginner/directives/)** - Learn built-in and custom directives
3. **[Services & DI](/beginner/services/)** - Share data between components

---

**Remember**: Components are the heart of Angular applications. Master them, and you'll build better, more maintainable apps! 🎯
