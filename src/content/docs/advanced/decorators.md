---
title: Custom Decorators 🏷️
description: Create custom decorators in Angular - method, property, class, and parameter decorators
sidebar:
  order: 5
---

Decorators are a TypeScript feature that allows you to add metadata and modify classes, methods, properties, and parameters. Learn to create custom decorators for cleaner, more maintainable Angular code.

## 🎯 What are Decorators?

Decorators are **special functions that can modify or annotate** classes, methods, properties, or parameters. They use the `@` symbol and are executed at runtime.

**Common Angular Decorators:**
- `@Component()` - Define components
- `@Injectable()` - Mark services for DI
- `@Input()` / `@Output()` - Component communication (modern alternative: `input()` / `output()` signal functions)
- `@ViewChild()` - Query DOM elements (modern alternative: `viewChild()` signal query)

**Benefits:**
- **🎨 Clean Code** - Reduce boilerplate
- **🔄 Reusability** - Share logic across classes
- **📝 Metadata** - Add information to classes
- **🛡️ Validation** - Enforce rules automatically

## 🚀 Decorator Types

### 1. **Class Decorators**

```typescript
function Component(config: any) {
  return function(target: any) {
    // Modify or annotate the class
    target.prototype.componentConfig = config;
  };
}

@Component({ selector: 'app-example' })
class ExampleComponent {}
```

### 2. **Method Decorators**

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return originalMethod.apply(this, args);
  };
}

class MyClass {
  @Log
  myMethod(value: string) {
    return value;
  }
}
```

### 3. **Property Decorators**

```typescript
function ReadOnly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false
  });
}

class MyClass {
  @ReadOnly
  name = 'Angular';
}
```

### 4. **Parameter Decorators**

```typescript
function Required(target: any, propertyKey: string, parameterIndex: number) {
  // Store metadata about required parameters
  const requiredParams = Reflect.getMetadata('required', target, propertyKey) || [];
  requiredParams.push(parameterIndex);
  Reflect.defineMetadata('required', requiredParams, target, propertyKey);
}
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Custom decorators work with both modern and legacy Angular patterns.</p>
</blockquote>

### 1. **@Debounce Decorator**

Let's create a debounce decorator for method calls.

```typescript
export function Debounce(delay: number = 300) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let timeoutId: any;

    descriptor.value = function(...args: any[]) {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-search',
  template: `
    <input (input)="onSearch($event)" placeholder="Search...">
  `
})
export class SearchComponent {
  @Debounce(500)
  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('Searching for:', value);
    // API call here
  }
}
```

### 2. **@Memoize Decorator**

Let's create a memoization decorator for expensive computations.

```typescript
export function Memoize() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, any>();

    descriptor.value = function(...args: any[]) {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        console.log('Returning cached result');
        return cache.get(key);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-calculator',
})
export class CalculatorComponent {
  @Memoize()
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
  
  calculate() {
    console.log(this.fibonacci(40)); // Cached after first call
  }
}
```

### 3. **@Loading Decorator**

Let's create a loading state decorator for async methods.

```typescript
export function Loading(loadingProperty: string = 'isLoading') {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      this[loadingProperty] = true;
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        this[loadingProperty] = false;
      }
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-data-loader',
  template: `
    @if (isLoading) {
      <div>Loading...</div>
    } @else {
      <div>{{ data() }}</div>
    }
    <button (click)="loadData()">Load Data</button>
  `
})
export class DataLoaderComponent {
  isLoading = false;
  data = signal<any>(null);
  
  @Loading('isLoading')
  async loadData() {
    const response = await fetch('/api/data');
    const result = await response.json();
    this.data.set(result);
  }
}
```

### 4. **@Retry Decorator**

Let's create a retry decorator for failed operations.

```typescript
export function Retry(maxAttempts: number = 3, delay: number = 1000) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed, retrying...`);
          
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  
  @Retry(3, 2000)
  async fetchData(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
}
```

### 5. **@Validate Decorator**

Let's create a validation decorator for method parameters.

```typescript
export function Validate(validator: (value: any) => boolean, message: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      for (const arg of args) {
        if (!validator(arg)) {
          throw new Error(`Validation failed: ${message}`);
        }
      }
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-user-form',
})
export class UserFormComponent {
  @Validate(
    (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    'Invalid email format'
  )
  saveEmail(email: string) {
    console.log('Saving email:', email);
  }
  
  submitForm(email: string) {
    try {
      this.saveEmail(email);
    } catch (error) {
      console.error(error);
    }
  }
}
```

### 6. **@Throttle Decorator**

Let's create a throttle decorator to limit function execution frequency.

```typescript
export function Throttle(limit: number = 1000) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let lastRun = 0;
    let timeout: any;

    descriptor.value = function(...args: any[]) {
      const now = Date.now();
      
      if (now - lastRun >= limit) {
        originalMethod.apply(this, args);
        lastRun = now;
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          originalMethod.apply(this, args);
          lastRun = Date.now();
        }, limit - (now - lastRun));
      }
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-scroll-handler',
  template: `<div (scroll)="onScroll()">Scroll me</div>`
})
export class ScrollHandlerComponent {
  @Throttle(200)
  onScroll() {
    console.log('Scroll event handled');
  }
}
```

### 7. **@Deprecated Decorator**

Let's create a deprecation warning decorator.

```typescript
export function Deprecated(message?: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      console.warn(
        `⚠️ ${propertyKey} is deprecated. ${message || 'Use alternative method.'}`
      );
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-legacy',
})
export class LegacyComponent {
  @Deprecated('Use newMethod() instead')
  oldMethod() {
    console.log('Old method called');
  }
  
  newMethod() {
    console.log('New method called');
  }
}
```

## 🔧 Advanced Patterns

### Property Decorator with Metadata

```typescript
export function MinLength(length: number) {
  return function(target: any, propertyKey: string) {
    let value: string;

    const getter = () => value;
    const setter = (newValue: string) => {
      if (newValue.length < length) {
        throw new Error(`${propertyKey} must be at least ${length} characters`);
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
}
```

**Usage:**

```typescript
class User {
  @MinLength(3)
  username!: string;
  
  @MinLength(8)
  password!: string;
}

const user = new User();
user.username = 'ab'; // Throws error
user.username = 'john'; // OK
```

### Class Decorator Factory

```typescript
export function Singleton() {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    let instance: any;

    return class extends constructor {
      constructor(...args: any[]) {
        if (instance) {
          return instance;
        }
        super(...args);
        instance = this;
      }
    };
  };
}
```

**Usage:**

```typescript
@Singleton()
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config = { apiUrl: 'https://api.example.com' };
  
  getConfig() {
    return this.config;
  }
}
```

## ✅ Best Practices

### 1. **Use Decorator Factories**

```typescript
// ✅ Good - Configurable decorator
export function Cache(ttl: number = 60000) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Implementation
  };
}

// ❌ Avoid - Fixed behavior
export function Cache(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  // Implementation
}
```

### 2. **Preserve Method Context**

```typescript
// ✅ Good - Preserve 'this' context
descriptor.value = function(...args: any[]) {
  return originalMethod.apply(this, args);
};

// ❌ Avoid - Loses 'this' context
descriptor.value = (...args: any[]) => {
  return originalMethod(...args);
};
```

### 3. **Return Descriptor**

```typescript
// ✅ Good - Return modified descriptor
export function MyDecorator() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Modify descriptor
    return descriptor;
  };
}
```

### 4. **Handle Async Methods**

```typescript
// ✅ Good - Handle promises properly
descriptor.value = async function(...args: any[]) {
  try {
    return await originalMethod.apply(this, args);
  } catch (error) {
    // Handle error
    throw error;
  }
};
```

### 5. **Clean Up Resources**

```typescript
// ✅ Good - Clean up timers/subscriptions
descriptor.value = function(...args: any[]) {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    originalMethod.apply(this, args);
  }, delay);
};
```

## 🎯 Common Use Cases

- **Performance** - Memoization, debouncing, throttling
- **Logging** - Method call tracking, debugging
- **Validation** - Input validation, type checking
- **Error Handling** - Retry logic, error boundaries
- **State Management** - Loading states, caching
- **Security** - Authorization checks, rate limiting
- **Deprecation** - Warning messages for old APIs
- **Monitoring** - Performance metrics, analytics

## 🎓 Learning Checklist

- [ ] Understand decorator types (class, method, property, parameter)
- [ ] Create method decorators for cross-cutting concerns
- [ ] Implement decorator factories for configuration
- [ ] Preserve method context with apply()
- [ ] Handle async methods in decorators
- [ ] Use metadata for advanced patterns
- [ ] Clean up resources in decorators
- [ ] Combine multiple decorators effectively

## 🚀 Next Steps

1. **[Angular Elements](/advanced/elements/)** - Create web components
2. **[Micro Frontends](/advanced/micro-frontends/)** - Build micro frontend architectures
3. **[Performance Optimization](/advanced/performance/)** - Optimize your applications

---

**Pro Tip**: Decorators are powerful for reducing boilerplate and adding cross-cutting concerns! Use them for logging, caching, validation, and performance optimization. Keep decorators focused on a single responsibility! 🏷️
