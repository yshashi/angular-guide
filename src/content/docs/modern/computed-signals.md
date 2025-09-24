---
title: Computed Signals
description: Master computed signals for derived reactive state
sidebar:
  order: 3
---

# Computed Signals ⚡

Computed signals are read-only signals that derive their value from other signals. They automatically recalculate when their dependencies change, providing efficient reactive derived state in Angular applications.

## 🎯 What are Computed Signals?

A computed signal is a special type of signal that derives its value from other signals. It's **read-only** and **automatically updates** when any of its dependencies change.

```typescript
import { signal, computed } from '@angular/core';

const firstName = signal('John');
const lastName = signal('Doe');

// Computed signal that depends on firstName and lastName
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

firstName.set('Jane');
console.log(fullName()); // "Jane Doe" - automatically updated!
```

## 🔄 How Computed Signals Work

### Automatic Dependency Tracking
```typescript
@Component({
  template: `
    <div>
      <p>Items: {{ items().length }}</p>
      <p>Total Price: {{ totalPrice() | currency }}</p>
      <p>Average Price: {{ averagePrice() | currency }}</p>
      <p>Status: {{ status() }}</p>
    </div>
  `
})
export class ShoppingCartComponent {
  items = signal<CartItem[]>([
    { id: 1, name: 'Laptop', price: 999.99, quantity: 1 },
    { id: 2, name: 'Mouse', price: 29.99, quantity: 2 }
  ]);

  // Computed signals automatically track dependencies
  totalPrice = computed(() => 
    this.items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  averagePrice = computed(() => {
    const items = this.items();
    return items.length > 0 ? this.totalPrice() / items.length : 0;
  });

  status = computed(() => {
    const total = this.totalPrice();
    if (total === 0) return 'Empty Cart';
    if (total < 50) return 'Small Order';
    if (total < 200) return 'Medium Order';
    return 'Large Order';
  });
}
```

### Lazy Evaluation
```typescript
export class DataProcessingComponent {
  rawData = signal<number[]>([1, 2, 3, 4, 5]);
  
  // Only calculated when accessed
  expensiveCalculation = computed(() => {
    console.log('Computing expensive calculation...');
    return this.rawData()
      .map(x => x * x)
      .filter(x => x > 10)
      .reduce((sum, x) => sum + x, 0);
  });
  
  // This won't trigger the computation
  updateData() {
    this.rawData.set([6, 7, 8, 9, 10]);
    // expensiveCalculation hasn't been accessed yet, so no computation
  }
  
  // Only when we access it, the computation runs
  getResult() {
    return this.expensiveCalculation(); // Now it computes
  }
}
```

## 🏗️ Creating Computed Signals

### Basic Computed Signal
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="profile">
      <h2>{{ displayName() }}</h2>
      <p>{{ greeting() }}</p>
      <p>Account Status: {{ accountStatus() }}</p>
      <p>Membership Level: {{ membershipLevel() }}</p>
    </div>
  `
})
export class UserProfileComponent {
  firstName = signal('John');
  lastName = signal('Doe');
  age = signal(25);
  isActive = signal(true);
  points = signal(1250);

  // Simple computed signal
  displayName = computed(() => 
    `${this.firstName()} ${this.lastName()}`
  );

  // Computed with conditional logic
  greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.firstName();
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 18) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  });

  // Computed based on multiple signals
  accountStatus = computed(() => {
    if (!this.isActive()) return 'Inactive';
    if (this.age() < 18) return 'Minor Account';
    return 'Active';
  });

  // Computed with complex logic
  membershipLevel = computed(() => {
    const points = this.points();
    if (points < 500) return 'Bronze';
    if (points < 1000) return 'Silver';
    if (points < 2000) return 'Gold';
    return 'Platinum';
  });
}
```

### Computed with Array Operations
```typescript
@Component({
  template: `
    <div>
      <h3>Todo Statistics</h3>
      <p>Total: {{ totalTodos() }}</p>
      <p>Completed: {{ completedTodos() }}</p>
      <p>Pending: {{ pendingTodos() }}</p>
      <p>Completion Rate: {{ completionRate() }}%</p>
      
      <h3>Filtered Todos</h3>
      <div *ngFor="let todo of urgentTodos()">
        {{ todo.title }} - {{ todo.priority }}
      </div>
    </div>
  `
})
export class TodoStatsComponent {
  todos = signal<Todo[]>([
    { id: 1, title: 'Learn Angular', completed: false, priority: 'high' },
    { id: 2, title: 'Build App', completed: true, priority: 'medium' },
    { id: 3, title: 'Deploy', completed: false, priority: 'high' }
  ]);

  totalTodos = computed(() => this.todos().length);

  completedTodos = computed(() => 
    this.todos().filter(todo => todo.completed).length
  );

  pendingTodos = computed(() => 
    this.todos().filter(todo => !todo.completed).length
  );

  completionRate = computed(() => {
    const total = this.totalTodos();
    const completed = this.completedTodos();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  urgentTodos = computed(() => 
    this.todos().filter(todo => 
      !todo.completed && todo.priority === 'high'
    )
  );
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}
```

## 🔗 Chaining Computed Signals

### Building Complex Derivations
```typescript
@Component({
  template: `
    <div class="dashboard">
      <h2>Sales Dashboard</h2>
      
      <div class="metrics">
        <div class="metric">
          <h3>Revenue</h3>
          <p>{{ formattedRevenue() }}</p>
        </div>
        
        <div class="metric">
          <h3>Growth</h3>
          <p>{{ growthIndicator() }}</p>
        </div>
        
        <div class="metric">
          <h3>Performance</h3>
          <p>{{ performanceRating() }}</p>
        </div>
      </div>
      
      <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
          <li *ngFor="let rec of recommendations()">{{ rec }}</li>
        </ul>
      </div>
    </div>
  `
})
export class SalesDashboardComponent {
  sales = signal<Sale[]>([
    { month: 'Jan', amount: 10000, target: 12000 },
    { month: 'Feb', amount: 15000, target: 13000 },
    { month: 'Mar', amount: 8000, target: 14000 }
  ]);

  // Base computed signals
  totalRevenue = computed(() => 
    this.sales().reduce((sum, sale) => sum + sale.amount, 0)
  );

  totalTarget = computed(() => 
    this.sales().reduce((sum, sale) => sum + sale.target, 0)
  );

  // Computed signals based on other computed signals
  targetAchievement = computed(() => 
    this.totalRevenue() / this.totalTarget()
  );

  formattedRevenue = computed(() => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.totalRevenue())
  );

  growthIndicator = computed(() => {
    const achievement = this.targetAchievement();
    const percentage = Math.round(achievement * 100);
    const trend = achievement >= 1 ? '📈' : '📉';
    return `${trend} ${percentage}%`;
  });

  performanceRating = computed(() => {
    const achievement = this.targetAchievement();
    if (achievement >= 1.2) return '🌟 Excellent';
    if (achievement >= 1.0) return '✅ Good';
    if (achievement >= 0.8) return '⚠️ Fair';
    return '❌ Poor';
  });

  recommendations = computed(() => {
    const achievement = this.targetAchievement();
    const recommendations: string[] = [];
    
    if (achievement < 0.8) {
      recommendations.push('Focus on lead generation');
      recommendations.push('Review pricing strategy');
    } else if (achievement < 1.0) {
      recommendations.push('Optimize conversion funnel');
      recommendations.push('Increase customer retention');
    } else {
      recommendations.push('Scale successful strategies');
      recommendations.push('Explore new markets');
    }
    
    return recommendations;
  });
}

interface Sale {
  month: string;
  amount: number;
  target: number;
}
```

## 🎨 Computed Signals in Templates

### Conditional Rendering
```typescript
@Component({
  template: `
    <div class="weather-app">
      <h2>Weather Dashboard</h2>
      
      <!-- Conditional classes based on computed signals -->
      <div class="temperature" [ngClass]="temperatureClass()">
        {{ temperature() }}°{{ unit() }}
      </div>
      
      <!-- Conditional content -->
      <div *ngIf="showWarning()" class="warning">
        {{ warningMessage() }}
      </div>
      
      <!-- Dynamic styling -->
      <div class="comfort-meter" [style.background-color]="comfortColor()">
        Comfort Level: {{ comfortLevel() }}
      </div>
      
      <!-- Computed lists -->
      <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
          <li *ngFor="let item of clothingRecommendations()">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .temperature.hot { color: red; }
    .temperature.cold { color: blue; }
    .temperature.mild { color: green; }
    .warning { background: yellow; padding: 1rem; }
    .comfort-meter { padding: 1rem; margin: 1rem 0; }
  `]
})
export class WeatherDashboardComponent {
  temperature = signal(22);
  humidity = signal(65);
  windSpeed = signal(10);
  unit = signal<'C' | 'F'>('C');

  // Computed for CSS classes
  temperatureClass = computed(() => {
    const temp = this.temperature();
    if (temp > 30) return 'hot';
    if (temp < 10) return 'cold';
    return 'mild';
  });

  // Computed for conditional display
  showWarning = computed(() => 
    this.temperature() > 35 || this.humidity() > 80 || this.windSpeed() > 50
  );

  warningMessage = computed(() => {
    const temp = this.temperature();
    const humidity = this.humidity();
    const wind = this.windSpeed();
    
    if (temp > 35) return 'Extreme heat warning!';
    if (humidity > 80) return 'High humidity alert!';
    if (wind > 50) return 'Strong wind advisory!';
    return '';
  });

  // Computed for styling
  comfortColor = computed(() => {
    const comfort = this.comfortLevel();
    if (comfort === 'Very Comfortable') return '#4CAF50';
    if (comfort === 'Comfortable') return '#8BC34A';
    if (comfort === 'Uncomfortable') return '#FF9800';
    return '#F44336';
  });

  comfortLevel = computed(() => {
    const temp = this.temperature();
    const humidity = this.humidity();
    
    if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 60) {
      return 'Very Comfortable';
    }
    if (temp >= 18 && temp <= 28 && humidity >= 30 && humidity <= 70) {
      return 'Comfortable';
    }
    if (temp >= 15 && temp <= 32 && humidity >= 20 && humidity <= 80) {
      return 'Uncomfortable';
    }
    return 'Very Uncomfortable';
  });

  clothingRecommendations = computed(() => {
    const temp = this.temperature();
    const recommendations: string[] = [];
    
    if (temp < 10) {
      recommendations.push('Heavy coat', 'Warm hat', 'Gloves');
    } else if (temp < 20) {
      recommendations.push('Light jacket', 'Long pants');
    } else if (temp < 30) {
      recommendations.push('T-shirt', 'Light pants');
    } else {
      recommendations.push('Light clothing', 'Sun hat', 'Sunglasses');
    }
    
    return recommendations;
  });
}
```

## 🔄 Computed Signals with Forms

### Form Validation and Status
```typescript
@Component({
  template: `
    <form class="user-form">
      <h2>User Registration</h2>
      
      <div class="field">
        <label>Email:</label>
        <input 
          type="email" 
          [(ngModel)]="email"
          [class.invalid]="emailError()"
        >
        <div *ngIf="emailError()" class="error">{{ emailError() }}</div>
      </div>
      
      <div class="field">
        <label>Password:</label>
        <input 
          type="password" 
          [(ngModel)]="password"
          [class.invalid]="passwordError()"
        >
        <div *ngIf="passwordError()" class="error">{{ passwordError() }}</div>
      </div>
      
      <div class="field">
        <label>Confirm Password:</label>
        <input 
          type="password" 
          [(ngModel)]="confirmPassword"
          [class.invalid]="confirmPasswordError()"
        >
        <div *ngIf="confirmPasswordError()" class="error">
          {{ confirmPasswordError() }}
        </div>
      </div>
      
      <div class="password-strength">
        <div class="strength-meter" [style.width.%]="passwordStrength()">
        </div>
        <span>{{ passwordStrengthText() }}</span>
      </div>
      
      <div class="form-summary">
        <p>Form Status: {{ formStatus() }}</p>
        <p>Completion: {{ formCompletion() }}%</p>
      </div>
      
      <button 
        type="submit" 
        [disabled]="!isFormValid()"
        [class.valid]="isFormValid()"
      >
        {{ submitButtonText() }}
      </button>
    </form>
  `,
  styles: [`
    .field { margin: 1rem 0; }
    .error { color: red; font-size: 0.8rem; }
    .invalid { border: 2px solid red; }
    .strength-meter { 
      height: 4px; 
      background: linear-gradient(to right, red, yellow, green);
      transition: width 0.3s;
    }
    button:disabled { opacity: 0.5; }
    button.valid { background: green; color: white; }
  `]
})
export class UserRegistrationComponent {
  // Form field signals
  email = signal('');
  password = signal('');
  confirmPassword = signal('');

  // Email validation
  emailError = computed(() => {
    const email = this.email();
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email';
    }
    return '';
  });

  // Password validation
  passwordError = computed(() => {
    const password = this.password();
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain a number';
    return '';
  });

  // Confirm password validation
  confirmPasswordError = computed(() => {
    const password = this.password();
    const confirm = this.confirmPassword();
    if (!confirm) return 'Please confirm your password';
    if (password !== confirm) return 'Passwords do not match';
    return '';
  });

  // Password strength calculation
  passwordStrength = computed(() => {
    const password = this.password();
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/(?=.*[a-z])/.test(password)) strength += 25;
    if (/(?=.*[A-Z])/.test(password)) strength += 25;
    if (/(?=.*\d)/.test(password)) strength += 25;
    
    return strength;
  });

  passwordStrengthText = computed(() => {
    const strength = this.passwordStrength();
    if (strength === 0) return 'Very Weak';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  });

  // Form validation status
  isFormValid = computed(() => 
    !this.emailError() && 
    !this.passwordError() && 
    !this.confirmPasswordError()
  );

  formStatus = computed(() => 
    this.isFormValid() ? 'Valid' : 'Invalid'
  );

  formCompletion = computed(() => {
    let completed = 0;
    if (this.email()) completed++;
    if (this.password()) completed++;
    if (this.confirmPassword()) completed++;
    return Math.round((completed / 3) * 100);
  });

  submitButtonText = computed(() => 
    this.isFormValid() ? 'Create Account' : 'Please Fix Errors'
  );

  // Update signals when form fields change
  updateEmail(value: string) {
    this.email.set(value);
  }

  updatePassword(value: string) {
    this.password.set(value);
  }

  updateConfirmPassword(value: string) {
    this.confirmPassword.set(value);
  }
}
```

## ⚡ Performance Optimization

### Memoization and Caching
```typescript
@Component({
  template: `
    <div class="data-processor">
      <h2>Data Processing Dashboard</h2>
      
      <div class="controls">
        <button (click)="addData()">Add Random Data</button>
        <button (click)="clearData()">Clear Data</button>
      </div>
      
      <div class="results">
        <p>Data Points: {{ dataCount() }}</p>
        <p>Sum: {{ sum() }}</p>
        <p>Average: {{ average() }}</p>
        <p>Median: {{ median() }}</p>
        <p>Standard Deviation: {{ standardDeviation() }}</p>
        <p>Expensive Calculation: {{ expensiveResult() }}</p>
      </div>
    </div>
  `
})
export class DataProcessorComponent {
  data = signal<number[]>([1, 2, 3, 4, 5]);

  // Simple computed signals
  dataCount = computed(() => this.data().length);

  sum = computed(() => 
    this.data().reduce((acc, val) => acc + val, 0)
  );

  average = computed(() => {
    const count = this.dataCount();
    return count > 0 ? this.sum() / count : 0;
  });

  // More expensive computations
  sortedData = computed(() => [...this.data()].sort((a, b) => a - b));

  median = computed(() => {
    const sorted = this.sortedData();
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  });

  standardDeviation = computed(() => {
    const avg = this.average();
    const data = this.data();
    const squaredDiffs = data.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    return Math.sqrt(avgSquaredDiff);
  });

  // Very expensive computation - only runs when data changes
  expensiveResult = computed(() => {
    console.log('Running expensive calculation...');
    const data = this.data();
    
    // Simulate expensive computation
    let result = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < 1000; j++) {
        result += Math.sin(data[i] * j) * Math.cos(data[i] * j);
      }
    }
    
    return result.toFixed(2);
  });

  addData() {
    this.data.update(current => [...current, Math.random() * 100]);
  }

  clearData() {
    this.data.set([]);
  }
}
```

## 🧪 Testing Computed Signals

### Unit Testing
```typescript
import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';

describe('Computed Signals', () => {
  it('should update when dependencies change', () => {
    const firstName = signal('John');
    const lastName = signal('Doe');
    const fullName = computed(() => `${firstName()} ${lastName()}`);

    expect(fullName()).toBe('John Doe');

    firstName.set('Jane');
    expect(fullName()).toBe('Jane Doe');

    lastName.set('Smith');
    expect(fullName()).toBe('Jane Smith');
  });

  it('should handle complex computations', () => {
    const numbers = signal([1, 2, 3, 4, 5]);
    const sum = computed(() => numbers().reduce((a, b) => a + b, 0));
    const average = computed(() => sum() / numbers().length);

    expect(sum()).toBe(15);
    expect(average()).toBe(3);

    numbers.set([10, 20, 30]);
    expect(sum()).toBe(60);
    expect(average()).toBe(20);
  });

  it('should not recompute unnecessarily', () => {
    let computationCount = 0;
    const data = signal([1, 2, 3]);
    const expensiveComputation = computed(() => {
      computationCount++;
      return data().reduce((a, b) => a + b, 0);
    });

    // First access
    expect(expensiveComputation()).toBe(6);
    expect(computationCount).toBe(1);

    // Second access - should not recompute
    expect(expensiveComputation()).toBe(6);
    expect(computationCount).toBe(1);

    // Change data - should recompute
    data.set([4, 5, 6]);
    expect(expensiveComputation()).toBe(15);
    expect(computationCount).toBe(2);
  });
});
```

### Component Testing
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShoppingCartComponent } from './shopping-cart.component';

describe('ShoppingCartComponent', () => {
  let component: ShoppingCartComponent;
  let fixture: ComponentFixture<ShoppingCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingCartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should calculate total price correctly', () => {
    component.items.set([
      { id: 1, name: 'Item 1', price: 10, quantity: 2 },
      { id: 2, name: 'Item 2', price: 15, quantity: 1 }
    ]);

    expect(component.totalPrice()).toBe(35);
  });

  it('should update status based on total price', () => {
    component.items.set([]);
    expect(component.status()).toBe('Empty Cart');

    component.items.set([{ id: 1, name: 'Item', price: 25, quantity: 1 }]);
    expect(component.status()).toBe('Small Order');

    component.items.set([{ id: 1, name: 'Item', price: 100, quantity: 1 }]);
    expect(component.status()).toBe('Medium Order');

    component.items.set([{ id: 1, name: 'Item', price: 250, quantity: 1 }]);
    expect(component.status()).toBe('Large Order');
  });
});
```

## 🎯 Best Practices

### 1. Keep Computations Pure
```typescript
// ✅ Good - Pure computation
const fullName = computed(() => `${firstName()} ${lastName()}`);

// ❌ Avoid - Side effects in computed signals
const badComputed = computed(() => {
  const result = firstName() + ' ' + lastName();
  console.log(result); // Side effect!
  localStorage.setItem('name', result); // Side effect!
  return result;
});
```

### 2. Avoid Expensive Operations
```typescript
// ✅ Good - Cache expensive operations
const sortedData = computed(() => [...data()].sort());
const median = computed(() => {
  const sorted = sortedData(); // Reuse cached sorted data
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid];
});

// ❌ Avoid - Repeated expensive operations
const badMedian = computed(() => {
  const sorted = [...data()].sort(); // Sorting again!
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid];
});
```

### 3. Use Computed for Template Logic
```typescript
// ✅ Good - Move complex template logic to computed signals
@Component({
  template: `
    <div [ngClass]="cssClasses()">
      {{ displayText() }}
    </div>
  `
})
export class MyComponent {
  isActive = signal(true);
  isHighlighted = signal(false);
  text = signal('Hello');

  cssClasses = computed(() => ({
    'active': this.isActive(),
    'highlighted': this.isHighlighted(),
    'empty': !this.text()
  }));

  displayText = computed(() => 
    this.text() || 'No content available'
  );
}
```

## 🎓 Learning Outcomes

After mastering computed signals, you'll be able to:
- [ ] Create computed signals that derive from other signals
- [ ] Build complex reactive calculations with automatic dependency tracking
- [ ] Optimize performance with lazy evaluation and memoization
- [ ] Chain computed signals for complex derived state
- [ ] Use computed signals effectively in templates
- [ ] Test computed signal behavior thoroughly
- [ ] Apply computed signals best practices

## 🚀 What's Next?

Now that you understand computed signals:

1. **[Effects API](/modern/effects/)** - Handle side effects with signals
2. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns
3. **[Control Flow](/modern/control-flow/)** - New template syntax with signals

---

**Pro Tip**: Use computed signals to move complex logic out of templates and into reactive, testable functions. They're perfect for derived state that needs to stay in sync! ⚡
