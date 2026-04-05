---
title: Advanced DI Patterns 🔧
description: Master advanced dependency injection patterns in Angular - providers, injection tokens, and hierarchical DI
sidebar:
  order: 4
---

Dependency Injection (DI) is Angular's powerful mechanism for managing dependencies. Master advanced patterns to build flexible, testable, and maintainable applications.

## 🎯 What is Dependency Injection?

DI is a design pattern where a class receives its dependencies from external sources rather than creating them itself. Angular's DI system provides dependencies to components and services automatically.

**Benefits:**
- **🧪 Testability** - Easy to mock dependencies
- **🔄 Reusability** - Share services across the app
- **🎯 Maintainability** - Centralized dependency management
- **⚡ Flexibility** - Swap implementations easily

## 🚀 Modern Injection with inject()

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-profile',
  template: `
    <div>
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>
    </div>
  `
})
export class UserProfileComponent {
  // ✅ Modern inject() function
  private userService = inject(UserService);
  
  user = this.userService.currentUser;
}
```

### Multiple Injections

```typescript
@Component({
  selector: 'app-dashboard',
})
export class DashboardComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  // All dependencies injected cleanly
}
```

## 🎨 Provider Patterns

### 1. **Root-Level Providers**

```typescript
// ✅ Singleton service available app-wide
@Injectable({ providedIn: 'root' })
export class DataService {
  private data = signal<Data[]>([]);
  
  getData() {
    return this.data.asReadonly();
  }
}
```

### 2. **Component-Level Providers**

```typescript
// ✅ New instance for each component
@Component({
  selector: 'app-user-form',
  providers: [FormStateService],  // Component-specific instance
  template: `...`
})
export class UserFormComponent {
  private formState = inject(FormStateService);
}
```

### 3. **Feature-Level Providers**

```typescript
// ✅ Scoped to a feature module
@Injectable({ providedIn: 'any' })
export class FeatureService {
  // New instance per lazy-loaded module
}
```

## 🔑 Injection Tokens

### String Tokens (Legacy)

```typescript
// ❌ Avoid - Not type-safe
const API_URL = 'API_URL';

providers: [
  { provide: API_URL, useValue: 'https://api.example.com' }
]
```

### InjectionToken (Modern)

```typescript
// ✅ Good - Type-safe tokens
import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

// Provide values
providers: [
  { provide: API_URL, useValue: 'https://api.example.com' },
  { 
    provide: API_CONFIG, 
    useValue: { 
      baseUrl: 'https://api.example.com',
      timeout: 5000 
    } 
  }
]

// Inject with type safety
export class ApiService {
  private apiUrl = inject(API_URL);
  private config = inject(API_CONFIG);
}
```

### Token with Default Value

```typescript
export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>(
  'Feature Flags',
  {
    providedIn: 'root',
    factory: () => ({
      newUI: false,
      darkMode: true,
      analytics: true
    })
  }
);

// Use anywhere
export class AppComponent {
  private flags = inject(FEATURE_FLAGS);
}
```

## 🎨 Real-World Examples



### 1. **Configuration Service Pattern**

Let's create a flexible configuration system using injection tokens.

```typescript
// Configuration interface
export interface AppConfig {
  apiUrl: string;
  environment: 'dev' | 'staging' | 'prod';
  features: {
    analytics: boolean;
    darkMode: boolean;
  };
}

// Injection token
export const APP_CONFIG = new InjectionToken<AppConfig>('App Configuration');

// Provide in main.ts
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        apiUrl: environment.apiUrl,
        environment: environment.name,
        features: {
          analytics: true,
          darkMode: false
        }
      }
    }
  ]
});

// Use in services
@Injectable({ providedIn: 'root' })
export class ApiService {
  private config = inject(APP_CONFIG);
  private http = inject(HttpClient);
  
  getData() {
    return this.http.get(`${this.config.apiUrl}/data`);
  }
}
```

### 2. **Factory Providers**

Let's create a logger service with different implementations based on environment.

```typescript
// Logger interface
export interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

// Console logger implementation
export class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(message);
  }
  
  error(message: string) {
    console.error(message);
  }
  
  warn(message: string) {
    console.warn(message);
  }
}

// Remote logger implementation
export class RemoteLogger implements Logger {
  private http = inject(HttpClient);
  
  log(message: string) {
    this.http.post('/api/logs', { level: 'info', message }).subscribe();
  }
  
  error(message: string) {
    this.http.post('/api/logs', { level: 'error', message }).subscribe();
  }
  
  warn(message: string) {
    this.http.post('/api/logs', { level: 'warn', message }).subscribe();
  }
}

// Injection token
export const LOGGER = new InjectionToken<Logger>('Logger');

// Factory function
export function loggerFactory(config: AppConfig): Logger {
  return config.environment === 'prod' 
    ? new RemoteLogger() 
    : new ConsoleLogger();
}

// Provide with factory
providers: [
  {
    provide: LOGGER,
    useFactory: loggerFactory,
    deps: [APP_CONFIG]
  }
]

// Use in components
@Component({
  selector: 'app-dashboard',
})
export class DashboardComponent {
  private logger = inject(LOGGER);
  
  ngOnInit() {
    this.logger.log('Dashboard initialized');
  }
}
```

### 3. **Multi Providers Pattern**

Let's create a plugin system using multi providers.

```typescript
// Plugin interface
export interface Plugin {
  name: string;
  initialize(): void;
  execute(data: any): void;
}

// Injection token for multiple plugins
export const PLUGINS = new InjectionToken<Plugin[]>('Plugins');

// Plugin implementations
@Injectable()
export class AnalyticsPlugin implements Plugin {
  name = 'Analytics';
  
  initialize() {
    console.log('Analytics plugin initialized');
  }
  
  execute(data: any) {
    console.log('Tracking event:', data);
  }
}

@Injectable()
export class LoggingPlugin implements Plugin {
  name = 'Logging';
  
  initialize() {
    console.log('Logging plugin initialized');
  }
  
  execute(data: any) {
    console.log('Logging data:', data);
  }
}

// Provide multiple plugins
providers: [
  { provide: PLUGINS, useClass: AnalyticsPlugin, multi: true },
  { provide: PLUGINS, useClass: LoggingPlugin, multi: true }
]

// Plugin manager service
@Injectable({ providedIn: 'root' })
export class PluginManager {
  private plugins = inject(PLUGINS);
  
  initializeAll() {
    this.plugins.forEach(plugin => plugin.initialize());
  }
  
  executeAll(data: any) {
    this.plugins.forEach(plugin => plugin.execute(data));
  }
}
```

### 4. **Optional Dependencies**

Let's handle optional dependencies gracefully.

```typescript
import { inject, Optional } from '@angular/core';

@Component({
  selector: 'app-feature',
})
export class FeatureComponent {
  // Optional dependency - may not be provided
  private analytics = inject(AnalyticsService, { optional: true });
  
  trackEvent(event: string) {
    // Only track if analytics service is available
    this.analytics?.track(event);
  }
}

// Or with default value
@Component({
  selector: 'app-config',
})
export class ConfigComponent {
  private config = inject(APP_CONFIG, { 
    optional: true 
  }) ?? DEFAULT_CONFIG;
}
```

### 5. **Self and SkipSelf Patterns**

Let's control dependency resolution in component hierarchy.

```typescript
// Parent component with its own service
@Component({
  selector: 'app-parent',
  providers: [StateService],
  template: `
    <app-child></app-child>
  `
})
export class ParentComponent {
  private state = inject(StateService);  // Gets parent's instance
}

// Child component
@Component({
  selector: 'app-child',
  providers: [StateService]
})
export class ChildComponent {
  // Get own instance
  private ownState = inject(StateService, { self: true });
  
  // Get parent's instance
  private parentState = inject(StateService, { skipSelf: true });
  
  // Get parent's instance or null
  private optionalParentState = inject(StateService, { 
    skipSelf: true, 
    optional: true 
  });
}
```

### 6. **Abstract Class Providers**

Let's use abstract classes for flexible implementations.

```typescript
// Abstract storage interface
export abstract class StorageService {
  abstract save(key: string, value: any): void;
  abstract load(key: string): any;
  abstract remove(key: string): void;
}

// LocalStorage implementation
export class LocalStorageService extends StorageService {
  save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  load(key: string) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  
  remove(key: string) {
    localStorage.removeItem(key);
  }
}

// SessionStorage implementation
export class SessionStorageService extends StorageService {
  save(key: string, value: any) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  
  load(key: string) {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  
  remove(key: string) {
    sessionStorage.removeItem(key);
  }
}

// Provide implementation
providers: [
  { provide: StorageService, useClass: LocalStorageService }
]

// Use abstract class
@Component({
  selector: 'app-settings',
})
export class SettingsComponent {
  private storage = inject(StorageService);  // Gets LocalStorageService
  
  saveSettings(settings: any) {
    this.storage.save('settings', settings);
  }
}
```

## 🏗️ Hierarchical Dependency Injection

### Understanding the Injector Tree

```typescript
// Root level - singleton
@Injectable({ providedIn: 'root' })
export class AppService {}

// Component level - new instance per component
@Component({
  selector: 'app-feature',
  providers: [FeatureService]
})
export class FeatureComponent {
  private feature = inject(FeatureService);  // Component instance
}

// Child inherits parent's providers
@Component({
  selector: 'app-child',
})
export class ChildComponent {
  private feature = inject(FeatureService);  // Same instance as parent
}
```

### Provider Scope Example

```typescript
// Shared state service
@Injectable()
export class FormStateService {
  private formData = signal<any>({});
  
  updateField(field: string, value: any) {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
  
  getData() {
    return this.formData.asReadonly();
  }
}

// Parent form component
@Component({
  selector: 'app-multi-step-form',
  providers: [FormStateService],  // Scoped to this component tree
  template: `
    <app-step-one></app-step-one>
    <app-step-two></app-step-two>
    <app-step-three></app-step-three>
  `
})
export class MultiStepFormComponent {}

// All steps share the same FormStateService instance
@Component({
  selector: 'app-step-one',
})
export class StepOneComponent {
  private formState = inject(FormStateService);  // Shared instance
}
```

## ✅ Best Practices

### 1. **Use inject() Over Constructor Injection**

```typescript
// ✅ Good - Modern inject() function
export class MyComponent {
  private service = inject(MyService);
  private router = inject(Router);
}

:::caution[Legacy Syntax]
In older Angular versions, dependencies were injected via the constructor:
```ts
export class MyComponent {
  constructor(
    private service: MyService,
    private router: Router
  ) {}
}
```
This syntax is still supported but not recommended for new projects.
:::
```

### 2. **Use InjectionToken for Primitives**

```typescript
// ✅ Good - Type-safe token
export const API_URL = new InjectionToken<string>('API_URL');

// ❌ Avoid - String token
const API_URL = 'API_URL';
```

### 3. **Prefer providedIn: 'root'**

```typescript
// ✅ Good - Tree-shakeable
@Injectable({ providedIn: 'root' })
export class DataService {}

// ❌ Avoid - Manual registration
@Injectable()
export class DataService {}

providers: [DataService]  // In module
```

### 4. **Use Optional for Optional Dependencies**

```typescript
// ✅ Good - Explicit optional
private analytics = inject(AnalyticsService, { optional: true });

// ❌ Avoid - Will throw if not provided
private analytics = inject(AnalyticsService);
```

### 5. **Scope Services Appropriately**

```typescript
// ✅ Good - Root for app-wide singletons
@Injectable({ providedIn: 'root' })
export class AuthService {}

// ✅ Good - Component-level for isolated state
@Component({
  providers: [FormStateService]
})
export class FormComponent {}
```

## 🎯 Common Patterns

### Environment-Based Providers

```typescript
export const environmentProviders = [
  {
    provide: API_URL,
    useValue: environment.production 
      ? 'https://api.prod.com' 
      : 'http://localhost:3000'
  },
  {
    provide: LOGGER,
    useClass: environment.production 
      ? RemoteLogger 
      : ConsoleLogger
  }
];
```

### Testing with DI

```typescript
// Easy to mock for testing
TestBed.configureTestingModule({
  providers: [
    { provide: UserService, useValue: mockUserService },
    { provide: API_URL, useValue: 'http://test-api.com' }
  ]
});
```

## 🎓 Learning Checklist

- [ ] Use inject() function for dependency injection
- [ ] Create and use InjectionTokens
- [ ] Understand provider scopes (root, component, module)
- [ ] Implement factory providers
- [ ] Use multi providers for plugin systems
- [ ] Handle optional dependencies
- [ ] Use self and skipSelf for hierarchical DI
- [ ] Implement abstract class providers
- [ ] Understand the injector tree

## 🚀 Next Steps

1. **[Custom Decorators](/advanced/decorators/)** - Create custom decorators
2. **[Dynamic Components](/advanced/dynamic-components/)** - Load components dynamically
3. **[Performance Optimization](/advanced/performance/)** - Optimize your applications

---

**Pro Tip**: Master DI to build flexible, testable applications! Use inject() for cleaner code, InjectionTokens for type safety, and scope your services appropriately. The DI system is one of Angular's most powerful features! 🔧
