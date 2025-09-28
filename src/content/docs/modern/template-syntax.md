---
title: New Template Syntax (@let) 📝
description: Explore the new @let template syntax in Angular
sidebar:
  order: 9
---

The new `@let` template syntax is like having a smart notepad in your templates - you can create temporary variables, store complex calculations, and make your templates cleaner and more readable. Think of it as giving your templates the power to remember things locally.

## 🎯 What is @let?

**The `@let` directive allows you to create local template variables** that can store values, expressions, or complex calculations. It's like having local variables in your templates, making them more powerful and expressive.

### 🔥 **The Case FOR @let**

**Key Benefits:**
- **Cleaner Templates** - Avoid repeating complex expressions
- **Better Performance** - Calculate once, use multiple times
- **Solves Falsy Value Issues** - No more problems with `0`, `""`, `null`, `undefined`
- **Improved Readability** - Give meaningful names to complex logic
- **Local Scope** - Variables are scoped to their template block

**The Falsy Value Problem (SOLVED):**
```typescript
// ❌ Old way - fails with falsy values like 0, "", null
<div *ngIf="userName$ | async as userName">
  <h1>Welcome, {{ userName }}</h1>
</div>

// ✅ New way - works with all values
<div>
  @let userName = (userName$ | async) ?? 'Guest';
  <h1>Welcome, {{ userName }}</h1>
</div>
```

### ❄️ **The Case AGAINST @let**

**Potential Concerns:**
- **Increased Cognitive Load** - Another concept for developers to learn
- **Risk of Misuse** - Can lead to overly complex templates if overused
- **Existing Solutions Work** - Signals and computed values handle most cases
- **Template Complexity** - Nested `@let` blocks can reduce readability

**Example of Potential Complexity:**
```typescript
// ⚠️ This can get hard to read quickly
<div>
  @let firstName = user?.firstName;
  @let lastName = user?.lastName;
  @let fullName = `${firstName} ${lastName}`;
  <p>{{ fullName }}</p>
  @if (user?.address) {
    @let street = user.address.street;
    @let city = user.address.city;
    <p>{{ street }}, {{ city }}</p>
  }
</div>
```

## 🎯 When to Use @let (Best Practices)

**✅ Good Use Cases:**
- Avoiding repeated complex expressions
- Handling falsy values gracefully
- Creating readable variable names for complex logic
- One-time calculations used multiple times

**❌ Avoid When:**
- Simple expressions that are only used once
- Logic that belongs in the component class
- Creating deeply nested variable chains
- Replacing proper computed signals

## 📝 Real-World Example: Dynamic Table

**A practical comparison showing @let in action:**

### ✅ With @let (Cleaner)

```typescript
<table mat-table [dataSource]="dataSource">
  @for (columnDef of columnDefs; track columnDef.name) {
    @let property = columnDef.propertyName;
    
    <ng-container [matColumnDef]="columnDef.name">
      <th mat-header-cell *matHeaderCellDef>{{ columnDef.header }}</th>
      <td mat-cell *matCellDef="let element">
        @let cellValue = element[property];
        
        @if (columnDef.cellType === 'link') {
          <a [routerLink]="cellValue?.routerLink">{{ cellValue?.value }}</a>
        } @else {
          {{ cellValue }}
        }
      </td>
    </ng-container>
  }
</table>
```

### ❌ Without @let (Repetitive)

```typescript
<table mat-table [dataSource]="dataSource">
  <ng-container *ngFor="let columnDef of columnDefs">
    <ng-container [matColumnDef]="columnDef.name">
      <th mat-header-cell *matHeaderCellDef>{{ columnDef.header }}</th>
      <td mat-cell *matCellDef="let element">
        @if (columnDef.cellType === 'link') {
          <a [routerLink]="element[columnDef.propertyName]?.routerLink">
            {{ element[columnDef.propertyName]?.value }}
          </a>
        } @else {
          {{ element[columnDef.propertyName] }}
        }
      </td>
    </ng-container>
  </ng-container>
</table>
```

**Notice how @let eliminates the repetitive `element[columnDef.propertyName]` expressions!**

## 📝 Basic @let Usage

### Simple Variable Assignment

**Think of @let like creating a sticky note** - you write something down once and refer to it multiple times.

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile">
      <!-- Create local variables with @let -->
      @let userName = user()?.name || 'Anonymous';
      @let userEmail = user()?.email || 'No email provided';
      @let isAdmin = user()?.role === 'admin';
      @let profileComplete = user()?.name && user()?.email && user()?.bio;

      <div class="profile-header">
        <h3>Welcome, {{ userName }}!</h3>
        
        @if (isAdmin) {
          <span class="admin-badge">👑 Administrator</span>
        }
      </div>

      <div class="profile-details">
        <div class="detail-row">
          <label>Email:</label>
          <span>{{ userEmail }}</span>
        </div>

        <div class="detail-row">
          <label>Profile Status:</label>
          <span [class]="profileComplete ? 'complete' : 'incomplete'">
            {{ profileComplete ? '✅ Complete' : '⚠️ Incomplete' }}
          </span>
        </div>

        @if (!profileComplete) {
          <div class="profile-warning">
            <h4>Complete Your Profile</h4>
            <p>Hello {{ userName }}, please complete your profile to unlock all features.</p>
          </div>
        }
      </div>

      <!-- Use variables in event handlers -->
      <div class="profile-actions">
        <button (click)="editProfile(userName)">
          Edit Profile
        </button>
        
        @if (isAdmin) {
          <button (click)="openAdminPanel()">
            Admin Panel
          </button>
        }
      </div>
    </div>
  `
})
export class UserProfileComponent {
  user = signal<User | null>({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    bio: 'Software developer'
  });

  editProfile(userName: string) {
    console.log(`Editing profile for ${userName}`);
  }

  openAdminPanel() {
    console.log('Opening admin panel');
  }
}
```

## 🧮 Simple Calculations with @let

**Calculate once, use multiple times:**

```typescript
@Component({
  template: `
    <div class="shopping-cart">
      @let itemCount = cartItems().length;
      @let subtotal = cartItems().reduce((sum, item) => sum + item.price, 0);
      @let total = subtotal * 1.08; <!-- Add tax -->
      
      <h3>Cart ({{ itemCount }} items)</h3>
      <p>Subtotal: ${{ subtotal.toFixed(2) }}</p>
      <p>Total: ${{ total.toFixed(2) }}</p>
      
      @for (item of cartItems(); track item.id) {
        @let itemTotal = item.price * item.quantity;
        <div class="cart-item">
          <span>{{ item.name }}</span>
          <span>${{ itemTotal.toFixed(2) }}</span>
        </div>
      }
    </div>
  `
})
export class ShoppingCartComponent {
  cartItems = signal([/* cart items */]);
}
```

## 🎨 Async Data with @let

**Handle async data and falsy values elegantly:**

```typescript
@Component({
  template: `
    <div class="user-profile">
      @let userName = (userName$ | async) ?? 'Guest';
      @let userScore = (userScore$ | async) ?? 0;
      @let isOnline = (userStatus$ | async) ?? false;
      
      <h3>Welcome, {{ userName }}!</h3>
      <p>Score: {{ userScore }}</p>
      <p>Status: {{ isOnline ? 'Online' : 'Offline' }}</p>
      
      @if (userScore > 100) {
        <div class="achievement">High Scorer! 🏆</div>
      }
    </div>
  `
})
export class UserProfileComponent {
  userName$ = this.userService.getUserName();
  userScore$ = this.userService.getUserScore();
  userStatus$ = this.userService.getUserStatus();
}
```

## ✅ Best Practices for @let

### 1. **Use Meaningful Variable Names**

```typescript
// ✅ Good - Clear, descriptive names
@let userDisplayName = user()?.firstName + ' ' + user()?.lastName;
@let isVipUser = user()?.membershipLevel === 'VIP';
@let totalPrice = items().reduce((sum, item) => sum + item.price, 0);
```

### 2. **Perfect for Falsy Value Handling**

```typescript
// ✅ Handle falsy values elegantly
@let score = (gameScore$ | async) ?? 0;
@let playerName = (playerName$ | async) ?? 'Anonymous';
@let isGameActive = (gameStatus$ | async) ?? false;

<div>
  <h3>Player: {{ playerName }}</h3>
  <p>Score: {{ score }}</p>
  @if (isGameActive) {
    <button>Continue Game</button>
  }
</div>
```

### 3. **Calculate Once, Use Multiple Times**

```typescript
// ✅ Avoid repeated calculations
@let expensiveResult = performComplexCalculation(data());
<div>Result: {{ expensiveResult }}</div>
<div>Formatted: {{ expensiveResult | currency }}</div>
<div>Status: {{ expensiveResult > 100 ? 'High' : 'Low' }}</div>
```

## 🎯 Quick Checklist

- [ ] Use @let for repeated complex expressions
- [ ] Handle falsy values with nullish coalescing (??)
- [ ] Give variables meaningful, descriptive names
- [ ] Calculate expensive operations once, use multiple times
- [ ] Combine @let with other control flow directives
- [ ] Keep @let expressions simple and readable
- [ ] Test all @let variable scenarios

## 🚀 Next Steps

1. **[Incremental Hydration](/modern/incremental-hydration/)** - SSR optimization
2. **[HttpResource API](/modern/http-resource-api/)** - Specialized HTTP handling
3. **[Signal Forms](/modern/signal-forms/)** - Modern form patterns

---

**Remember**: The `@let` directive is your template's smart notepad - use it to eliminate repetition, handle falsy values, and make your templates cleaner and more performant! 📝
