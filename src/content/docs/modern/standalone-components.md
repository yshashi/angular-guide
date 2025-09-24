---
title: Standalone Components
description: Learn about Angular standalone components - the future of Angular architecture
sidebar:
  order: 1
---

# Standalone Components 🏗️

Standalone components represent a revolutionary shift in Angular architecture, eliminating the need for NgModules in many scenarios and making Angular applications simpler, more modular, and easier to understand.

## 🎯 What are Standalone Components?

Standalone components are Angular components that can be used independently without being declared in an NgModule. They manage their own dependencies and can be imported directly where needed.

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  standalone: true, // 🔑 This makes it standalone
  imports: [CommonModule, FormsModule], // Direct imports
  template: `
    <div class="profile">
      <h1>{{ user.name }}</h1>
      <input [(ngModel)]="user.email" placeholder="Email">
      <button (click)="save()">Save</button>
    </div>
  `
})
export class UserProfileComponent {
  user = { name: 'John Doe', email: 'john@example.com' };
  
  save() {
    console.log('Saving user:', this.user);
  }
}
```

## 🆚 Traditional vs Standalone Approach

### Traditional NgModule Approach
```typescript
// user.module.ts
@NgModule({
  declarations: [
    UserProfileComponent,
    UserListComponent,
    UserCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [UserProfileComponent]
})
export class UserModule { }

// user-profile.component.ts
@Component({
  selector: 'app-user-profile',
  template: `<div>User Profile</div>`
})
export class UserProfileComponent { }

// app.module.ts
@NgModule({
  imports: [UserModule],
  // ... other config
})
export class AppModule { }
```

### Modern Standalone Approach
```typescript
// user-profile.component.ts
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<div>User Profile</div>`
})
export class UserProfileComponent { }

// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserProfileComponent], // Direct import
  template: `<app-user-profile></app-user-profile>`
})
export class AppComponent { }
```

## 🚀 Creating Standalone Components

### Using Angular CLI
```bash
# Generate a standalone component
ng generate component user-profile --standalone

# Generate with inline template and styles
ng generate component user-card --standalone --inline-template --inline-style

# Generate in a specific directory
ng generate component features/user/profile --standalone
```

### Manual Creation
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="counter">
      <h2>Count: {{ count }}</h2>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `,
  styles: [`
    .counter {
      text-align: center;
      padding: 2rem;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    button {
      margin: 0 0.5rem;
      padding: 0.5rem 1rem;
    }
  `]
})
export class CounterComponent {
  count = 0;
  
  increment() { this.count++; }
  decrement() { this.count--; }
  reset() { this.count = 0; }
}
```

## 📦 Importing Dependencies

### Common Imports
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    // Angular built-in modules
    CommonModule,        // *ngIf, *ngFor, pipes
    FormsModule,         // Template-driven forms
    ReactiveFormsModule, // Reactive forms
    RouterModule,        // Router directives
    HttpClientModule,    // HTTP client
    
    // Other standalone components
    HeaderComponent,
    FooterComponent,
    
    // Third-party components
    MatButtonModule,
    MatInputModule,
  ],
  template: `...`
})
export class ExampleComponent { }
```

### Conditional Imports
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dynamic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <button (click)="loadFeature()">Load Feature</button>
      <div *ngIf="featureLoaded">
        <!-- Feature content -->
      </div>
    </div>
  `
})
export class DynamicComponent {
  private router = inject(Router);
  featureLoaded = false;
  
  async loadFeature() {
    // Lazy load a standalone component
    const { FeatureComponent } = await import('./feature.component');
    this.featureLoaded = true;
  }
}
```

## 🔧 Standalone Directives and Pipes

### Standalone Directive
```typescript
import { Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  private el = inject(ElementRef);
  
  @Input() set appHighlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color || 'yellow';
  }
}

// Usage in component
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [HighlightDirective],
  template: `
    <p appHighlight="lightblue">This text is highlighted</p>
  `
})
export class ExampleComponent { }
```

### Standalone Pipe
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50): string {
    if (!value) return '';
    return value.length > limit 
      ? value.substring(0, limit) + '...' 
      : value;
  }
}

// Usage in component
@Component({
  selector: 'app-article',
  standalone: true,
  imports: [TruncatePipe],
  template: `
    <p>{{ article.content | truncate:100 }}</p>
  `
})
export class ArticleComponent {
  article = {
    content: 'This is a very long article content that needs to be truncated...'
  };
}
```

## 🌐 Routing with Standalone Components

### Route Configuration
```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'users',
    loadChildren: () => import('./users/user.routes').then(m => m.userRoutes)
  }
];
```

### Main Application Bootstrap
```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // Other providers
  ]
});
```

### App Component
```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/about">About</a>
      <a routerLink="/users">Users</a>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent { }
```

## 🏗️ Feature Modules with Standalone

### Lazy-loaded Feature Routes
```typescript
// users/user.routes.ts
import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];
```

### Shared Utilities
```typescript
// shared/utils.ts
export const SHARED_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  RouterModule
] as const;

export const MATERIAL_IMPORTS = [
  MatButtonModule,
  MatInputModule,
  MatCardModule,
  MatIconModule
] as const;

// Usage in components
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [...SHARED_IMPORTS, ...MATERIAL_IMPORTS],
  template: `...`
})
export class UserFormComponent { }
```

## 🔄 Migration from NgModules

### Step 1: Convert Components
```typescript
// Before (with NgModule)
@Component({
  selector: 'app-user-card',
  template: `<div>{{ user.name }}</div>`
})
export class UserCardComponent {
  @Input() user!: User;
}

// After (standalone)
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: `<div>{{ user.name }}</div>`
})
export class UserCardComponent {
  @Input() user!: User;
}
```

### Step 2: Update Imports
```typescript
// Before
@NgModule({
  declarations: [UserListComponent],
  imports: [CommonModule, UserCardComponent]
})
export class UserModule { }

// After
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  template: `
    <app-user-card 
      *ngFor="let user of users" 
      [user]="user">
    </app-user-card>
  `
})
export class UserListComponent {
  users: User[] = [];
}
```

### Step 3: Angular CLI Migration
```bash
# Use Angular CLI schematic to convert
ng generate @angular/core:standalone

# Convert specific component
ng generate @angular/core:standalone --mode=convert-to-standalone --component=src/app/user/user.component.ts
```

## 🧪 Testing Standalone Components

### Unit Testing
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent] // Import the standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should increment count', () => {
    component.increment();
    expect(component.count).toBe(1);
  });
});
```

### Integration Testing
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from '../services/user.service';
import { of } from 'rxjs';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['getUsers']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should load users', () => {
    const mockUsers = [{ id: 1, name: 'John' }];
    userService.getUsers.and.returnValue(of(mockUsers));
    
    component.ngOnInit();
    
    expect(component.users).toEqual(mockUsers);
  });
});
```

## ⚡ Performance Benefits

### Tree Shaking
```typescript
// Only imports what's needed
@Component({
  selector: 'app-simple',
  standalone: true,
  imports: [CommonModule], // Only CommonModule, not entire feature modules
  template: `<div *ngIf="show">Content</div>`
})
export class SimpleComponent {
  show = true;
}
```

### Lazy Loading
```typescript
// Lazy load standalone components
const routes: Routes = [
  {
    path: 'feature',
    loadComponent: () => import('./feature.component').then(m => m.FeatureComponent)
  }
];
```

### Bundle Size Optimization
```typescript
// Before: Large NgModule with many components
@NgModule({
  declarations: [
    Component1, Component2, Component3, // All loaded together
    Component4, Component5, Component6
  ]
})

// After: Load only what you need
@Component({
  imports: [Component1] // Only load Component1
})
```

## 🎯 Best Practices

### 1. Organize Imports
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    // Angular modules first
    CommonModule,
    FormsModule,
    
    // Third-party modules
    MatButtonModule,
    
    // Custom components
    HeaderComponent,
    FooterComponent
  ],
  template: `...`
})
export class ExampleComponent { }
```

### 2. Create Shared Import Arrays
```typescript
// shared/imports.ts
export const COMMON_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule
] as const;

export const MATERIAL_IMPORTS = [
  MatButtonModule,
  MatInputModule,
  MatCardModule
] as const;

// Usage
@Component({
  standalone: true,
  imports: [...COMMON_IMPORTS, ...MATERIAL_IMPORTS],
  template: `...`
})
export class MyComponent { }
```

### 3. Use Dependency Injection
```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `...`
})
export class UserListComponent {
  private userService = inject(UserService); // Modern injection
  
  // Or traditional constructor injection
  constructor(private userService2: UserService) {}
}
```

## 🚀 Real-World Example

### Complete Todo App with Standalone Components
```typescript
// todo-item.component.ts
@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="todo-item" [class.completed]="todo.completed">
      <input 
        type="checkbox" 
        [checked]="todo.completed"
        (change)="toggleComplete()"
      >
      <span>{{ todo.text }}</span>
      <button (click)="delete()">Delete</button>
    </div>
  `,
  styles: [`
    .todo-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
    .completed span {
      text-decoration: line-through;
      opacity: 0.6;
    }
  `]
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  @Output() toggle = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();
  
  toggleComplete() {
    this.toggle.emit(this.todo.id);
  }
  
  delete() {
    this.remove.emit(this.todo.id);
  }
}

// todo-list.component.ts
@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TodoItemComponent],
  template: `
    <div class="todo-app">
      <h1>Todo List</h1>
      
      <form (ngSubmit)="addTodo()" #form="ngForm">
        <input 
          [(ngModel)]="newTodoText" 
          name="newTodo"
          placeholder="Add a todo..."
          required
        >
        <button type="submit" [disabled]="!form.valid">Add</button>
      </form>
      
      <div class="todos">
        <app-todo-item
          *ngFor="let todo of todos"
          [todo]="todo"
          (toggle)="toggleTodo($event)"
          (remove)="removeTodo($event)"
        ></app-todo-item>
      </div>
      
      <div class="stats">
        Total: {{ todos.length }} | 
        Completed: {{ completedCount }} | 
        Remaining: {{ remainingCount }}
      </div>
    </div>
  `,
  styles: [`
    .todo-app {
      max-width: 500px;
      margin: 2rem auto;
      padding: 1rem;
    }
    form {
      display: flex;
      margin-bottom: 1rem;
    }
    input {
      flex: 1;
      padding: 0.5rem;
      margin-right: 0.5rem;
    }
    .stats {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class TodoListComponent {
  todos: Todo[] = [
    { id: 1, text: 'Learn Angular Standalone Components', completed: false },
    { id: 2, text: 'Build a Todo App', completed: false }
  ];
  
  newTodoText = '';
  
  get completedCount() {
    return this.todos.filter(todo => todo.completed).length;
  }
  
  get remainingCount() {
    return this.todos.length - this.completedCount;
  }
  
  addTodo() {
    if (this.newTodoText.trim()) {
      this.todos.push({
        id: Date.now(),
        text: this.newTodoText.trim(),
        completed: false
      });
      this.newTodoText = '';
    }
  }
  
  toggleTodo(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }
  
  removeTodo(id: number) {
    this.todos = this.todos.filter(t => t.id !== id);
  }
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}
```

## 🎓 Learning Outcomes

After mastering standalone components, you'll be able to:
- [ ] Create standalone components, directives, and pipes
- [ ] Eliminate NgModules in most scenarios
- [ ] Implement lazy loading with standalone components
- [ ] Migrate existing NgModule-based apps to standalone
- [ ] Optimize bundle size and improve tree shaking
- [ ] Test standalone components effectively
- [ ] Apply standalone architecture best practices

## 🚀 What's Next?

Now that you understand standalone components:

1. **[Angular Signals](/modern/signals/)** - Modern reactivity with standalone components
2. **[Computed Signals](/modern/computed-signals/)** - Derived state in standalone apps
3. **[Control Flow](/modern/control-flow/)** - New template syntax with standalone components

---

**Pro Tip**: Start new projects with standalone components from day one. They're simpler, more modular, and represent the future of Angular architecture! 🌟
