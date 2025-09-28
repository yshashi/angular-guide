---
title: HttpResource API 🌐
description: Master Angular's reactive HttpResource API for seamless data fetching with signals
sidebar:
  order: 11
---

Angular's HttpResource API transforms HTTP requests into reactive signals with automatic state management, caching, and error handling.

## 🎯 What is HttpResource?

**HttpResource** is Angular's reactive wrapper around HttpClient that provides:

- **Signal-Based** - Automatic reactivity with signals
- **Declarative** - Define what data you need, not how to fetch it
- **Smart Caching** - Request deduplication and optimization
- **Built-in States** - Loading, error, and success states

## 🆚 Before vs After

### ❌ Traditional HttpClient

```typescript
export class UserComponent {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  loadUsers() {
    this.loading = true;
    this.http.get<User[]>('/api/users').subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
```

### ✅ HttpResource

```typescript
import { httpResource } from '@angular/common/http';

export class UserComponent {
  users = httpResource<User[]>(() => '/api/users');
  
  // Available states:
  // users.value() - data
  // users.isLoading() - loading
  // users.error() - error
  // users.hasValue() - success
}
```

## 🚀 Basic Examples

### Simple User Profile

```typescript
import { Component, signal, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user.isLoading()) {
      <div>Loading...</div>
    } @else if (user.error()) {
      <div>Error: {{ user.error()?.message }}</div>
      <button (click)="user.reload()">Retry</button>
    } @else if (user.hasValue()) {
      <div>
        <h2>{{ user.value().name }}</h2>
        <p>{{ user.value().email }}</p>
      </div>
    }
  `
})
export class UserProfileComponent {
  userId = signal(1);
  
  user = httpResource<User>(() => `/api/users/${this.userId()}`);
  
  loadUser(id: number) {
    this.userId.set(id);
  }
}
```

### Advanced Configuration

```typescript
@Component({
  selector: 'app-secure-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data.hasValue()) {
      <pre>{{ data.value() | json }}</pre>
    }
  `
})
export class SecureDataComponent {
  authToken = signal('bearer-token-123');
  
  data = httpResource(() => ({
    url: '/api/secure/data',
    headers: {
      'Authorization': `Bearer ${this.authToken()}`,
      'Content-Type': 'application/json'
    },
    params: { format: 'detailed' }
  }));
}
```

## 🔄 Reactive Patterns

### Dynamic Search

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-product-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input 
      [value]="searchQuery()" 
      (input)="searchQuery.set($event.target.value)" 
      placeholder="Search products..." />
    
    @if (products.isLoading()) {
      <div>Searching...</div>
    } @else if (products.hasValue()) {
      @for (product of products.value(); track product.id) {
        <div>{{ product.name }} - {{ product.price | currency }}</div>
      }
    }
  `
})
export class ProductSearchComponent {
  searchQuery = signal('');
  
  products = httpResource<Product[]>(() => {
    const query = this.searchQuery();
    return query ? `/api/products/search?q=${query}` : undefined;
  });
}
```

### Dependent Resources

```typescript
@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (post.hasValue()) {
      <article>
        <h1>{{ post.value().title }}</h1>
        <div>{{ post.value().content }}</div>
        
        @if (author.hasValue()) {
          <div>By: {{ author.value().name }}</div>
        }
      </article>
    }
  `
})
export class BlogPostComponent {
  postId = signal(1);
  
  post = httpResource<BlogPost>(() => `/api/posts/${this.postId()}`);
  
  // Only loads when post is available
  author = httpResource<Author>(() => {
    const postData = this.post.value();
    return postData ? `/api/authors/${postData.authorId}` : undefined;
  });
}
```

## 📊 Response Types

### Different Response Formats

```typescript
@Component({
  selector: 'app-file-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (textFile.hasValue()) {
      <pre>{{ textFile.value() }}</pre>
    }
    
    @if (imageFile.hasValue()) {
      <img [src]="imageUrl()" alt="File" />
    }
  `
})
export class FileViewerComponent {
  fileId = signal(1);
  
  // Text response
  textFile = httpResource.text(() => `/api/files/${this.fileId()}/content`);
  
  // Blob response
  imageFile = httpResource.blob(() => `/api/files/${this.fileId()}/image`);
  
  imageUrl = computed(() => {
    const blob = this.imageFile.value();
    return blob ? URL.createObjectURL(blob) : '';
  });
}
```

## ⚡ Performance

### Request Deduplication

```typescript
// Multiple components using same resource - automatically deduplicated
@Component({
  selector: 'app-user-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user.hasValue()) {
      <div>{{ user.value().name }}</div>
    }
  `
})
export class UserWidgetComponent {
  userId = input.required<number>();
  
  // Same request shared across all instances
  user = httpResource(() => `/api/users/${this.userId()}`);
}
```

### Conditional Loading

```typescript
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs">
      @for (tab of tabs; track tab) {
        <button 
          (click)="activeTab.set(tab)"
          [class.active]="activeTab() === tab">
          {{ tab }}
        </button>
      }
    </div>
    
    @switch (activeTab()) {
      @case ('profile') {
        @if (profileData.hasValue()) {
          <div>{{ profileData.value() | json }}</div>
        }
      }
      @case ('settings') {
        @if (settingsData.hasValue()) {
          <div>{{ settingsData.value() | json }}</div>
        }
      }
    }
  `
})
export class TabsComponent {
  activeTab = signal('profile');
  tabs = ['profile', 'settings', 'analytics'];
  
  // Only load when tab is active
  profileData = httpResource(() => 
    this.activeTab() === 'profile' ? '/api/profile' : undefined
  );
  
  settingsData = httpResource(() => 
    this.activeTab() === 'settings' ? '/api/settings' : undefined
  );
}
```

## ✅ Best Practices

### Centralized Data Service

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserId = signal(1);
  
  user = httpResource(() => `/api/users/${this.currentUserId()}`);
  notifications = httpResource(() => `/api/users/${this.currentUserId()}/notifications`);
  
  setUserId(id: number) {
    this.currentUserId.set(id);
  }
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  userService = inject(UserService);
  
  user = this.userService.user;
  notifications = this.userService.notifications;
}
```

### Error Handling

```typescript
@Component({
  selector: 'app-error-boundary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasErrors()) {
      <div class="error">
        <h3>Unable to load data</h3>
        <button (click)="retryAll()">Retry All</button>
      </div>
    } @else {
      <!-- Normal content -->
    }
  `
})
export class ErrorBoundaryComponent {
  user = httpResource(() => '/api/user');
  posts = httpResource(() => '/api/posts');
  
  hasErrors = computed(() => 
    this.user.error() || this.posts.error()
  );
  
  retryAll() {
    this.user.reload();
    this.posts.reload();
  }
}
```

### Type Safety

```typescript
interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeSafeComponent {
  users = httpResource<ApiResponse<User[]>>(() => '/api/users');
  
  userCount = computed(() => this.users.value()?.total ?? 0);
  firstUser = computed(() => this.users.value()?.data[0]);
}
```

## 🚀 Next Steps

1. **[Angular Signals](/modern/signals/)** - Master the foundation
2. **[Effects API](/modern/effects/)** - Handle side effects
3. **[Computed Signals](/modern/computed-signals/)** - Derived state

---

**HttpResource** is experimental but represents the future of data fetching in Angular! 🌐
