---
title: Micro Frontends 🏗️
description: Build scalable micro frontend architectures with Angular - Module Federation and independent deployments
sidebar:
  order: 7
---

Micro frontends extend microservices principles to frontend development, allowing teams to build, deploy, and scale features independently. Build modular, maintainable applications at scale.

## 🎯 What are Micro Frontends?

Micro frontends are **independently deployable frontend applications** that work together as a single cohesive product.

**Benefits:**
- **🔄 Independent Deployment** - Deploy features separately
- **👥 Team Autonomy** - Teams own complete features
- **⚡ Faster Development** - Parallel development
- **🎯 Technology Flexibility** - Mix frameworks if needed
- **📦 Smaller Bundles** - Load only what's needed

**Approaches:**
- Module Federation (requires Webpack — see note below)
- Native Federation (works with esbuild)
- Web Components
- iFrames
- Server-side composition

> **Note:** Angular uses `@angular/build:application` (**esbuild + Vite**) as the default builder, and the older Webpack builders are deprecated in Angular 22. Classic Webpack Module Federation requires a custom Webpack builder. For modern Angular 22 projects on the default esbuild builder, prefer **Native Federation** (`@angular-architects/native-federation`) or **Angular Elements** (`@angular/elements`) web components.

## 🚀 Module Federation Setup

### Host Configuration

```typescript
// webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        dashboard: 'dashboard@http://localhost:4201/remoteEntry.js',
        profile: 'profile@http://localhost:4202/remoteEntry.js'
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true }
      }
    })
  ]
};
```

### Remote Configuration

```typescript
// webpack.config.js (Remote)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/app/dashboard/dashboard.routes.ts'
      },
      shared: {
        '@angular/core': { singleton: true },
        '@angular/common': { singleton: true }
      }
    })
  ]
};
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Micro frontends require careful planning and team coordination.</p>
</blockquote>

### 1. **Complete Shell Application**

Let's create a comprehensive shell application that manages multiple micro frontends.

```typescript
// shell/app.component.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Enterprise Portal</h1>
        <nav>
          <a routerLink="/" routerLinkActive="active">Home</a>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/profile" routerLinkActive="active">Profile</a>
          <a routerLink="/analytics" routerLinkActive="active">Analytics</a>
        </nav>
      </header>
      
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="app-footer">
        <p>© 2024 Enterprise Portal</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-header {
      background: #1976d2;
      color: white;
      padding: 1rem;
    }
    .app-header nav {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .app-header a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }
    .app-header a.active {
      background: rgba(255,255,255,0.2);
    }
    .app-content {
      flex: 1;
      padding: 2rem;
    }
  `]
})
export class AppComponent {}

// shell/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('dashboard/Module')
      .then(m => m.DASHBOARD_ROUTES)
      .catch(() => import('./fallback/fallback.routes')
        .then(m => m.FALLBACK_ROUTES))
  },
  {
    path: 'profile',
    loadChildren: () => import('profile/Module')
      .then(m => m.PROFILE_ROUTES)
      .catch(() => import('./fallback/fallback.routes')
        .then(m => m.FALLBACK_ROUTES))
  },
  {
    path: 'analytics',
    loadChildren: () => import('analytics/Module')
      .then(m => m.ANALYTICS_ROUTES)
      .catch(() => import('./fallback/fallback.routes')
        .then(m => m.FALLBACK_ROUTES))
  }
];
```

### 2. **Remote Dashboard Micro Frontend**

Let's create a complete remote micro frontend for dashboard.

```typescript
// dashboard/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  output: {
    uniqueName: 'dashboard',
    publicPath: 'auto'
  },
  optimization: {
    runtimeChunk: false
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/app/dashboard/dashboard.routes.ts'
      },
      shared: {
        '@angular/core': { 
          singleton: true, 
          strictVersion: true,
          requiredVersion: 'auto'
        },
        '@angular/common': { 
          singleton: true, 
          strictVersion: true,
          requiredVersion: 'auto'
        },
        '@angular/router': { 
          singleton: true, 
          strictVersion: true,
          requiredVersion: 'auto'
        }
      }
    })
  ]
};

// dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
];

// dashboard/dashboard.component.ts
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-value">{{ totalUsers() }}</p>
        </div>
        
        <div class="stat-card">
          <h3>Revenue</h3>
          <p class="stat-value">{{ revenue() }}</p>
        </div>
        
        <div class="stat-card">
          <h3>Active Sessions</h3>
          <p class="stat-value">{{ activeSessions() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #1976d2;
    }
  `]
})
export class DashboardComponent {
  totalUsers = signal(1234);
  revenue = signal('$45,678');
  activeSessions = signal(89);
}
```

### 3. **Communication Between Micro Frontends**

Let's implement cross-micro-frontend communication.

```typescript
// shared/event-bus.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface MicroFrontendEvent {
  type: string;
  source: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private eventSubject = new Subject<MicroFrontendEvent>();

  emit(type: string, source: string, payload: any) {
    this.eventSubject.next({ type, source, payload });
  }

  on(eventType: string): Observable<any> {
    return this.eventSubject.pipe(
      filter(event => event.type === eventType),
      map(event => event.payload)
    );
  }

  onFromSource(eventType: string, source: string): Observable<any> {
    return this.eventSubject.pipe(
      filter(event => event.type === eventType && event.source === source),
      map(event => event.payload)
    );
  }
}

// Usage in Dashboard
@Component({
  selector: 'app-dashboard',
})
export class DashboardComponent {
  private eventBus = inject(EventBusService);

  notifyUserAction() {
    this.eventBus.emit('user-action', 'dashboard', {
      action: 'button-clicked',
      timestamp: Date.now()
    });
  }

  constructor() {
    // Listen to events from other micro frontends
    this.eventBus.on('profile-updated').subscribe(data => {
      console.log('Profile updated:', data);
      this.refreshDashboard();
    });
  }
}
```

### 4. **Shared State Management**

Let's create a shared state service for micro frontends.

```typescript
// shared/shared-state.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class SharedStateService {
  // Shared user state
  private currentUser = signal<User | null>(null);
  
  // Shared app settings
  private appSettings = signal({
    theme: 'light',
    language: 'en',
    notifications: true
  });

  // Public readonly signals
  user = this.currentUser.asReadonly();
  settings = this.appSettings.asReadonly();
  
  // Computed values
  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role ?? 'guest');

  setUser(user: User) {
    this.currentUser.set(user);
  }

  updateSettings(settings: Partial<typeof this.appSettings>) {
    this.appSettings.update(current => ({ ...current, ...settings }));
  }

  logout() {
    this.currentUser.set(null);
  }
}

// Usage in any micro frontend
@Component({
  selector: 'app-profile',
})
export class ProfileComponent {
  private sharedState = inject(SharedStateService);
  
  user = this.sharedState.user;
  isAuthenticated = this.sharedState.isAuthenticated;

  updateProfile(name: string) {
    const currentUser = this.user();
    if (currentUser) {
      this.sharedState.setUser({ ...currentUser, name });
    }
  }
}
```

### 5. **Dynamic Remote Loading**

Let's implement dynamic loading of micro frontends at runtime.

```typescript
// shared/dynamic-federation.service.ts
import { Injectable } from '@angular/core';

export interface RemoteConfig {
  name: string;
  url: string;
  exposedModule: string;
}

@Injectable({ providedIn: 'root' })
export class DynamicFederationService {
  private loadedRemotes = new Map<string, any>();

  async loadRemoteModule(config: RemoteConfig) {
    // Check if already loaded
    if (this.loadedRemotes.has(config.name)) {
      return this.loadedRemotes.get(config.name);
    }

    // Load remote container
    await this.loadRemoteContainer(config.url);

    // Import the exposed module
    const container = (window as any)[config.name];
    await container.init(__webpack_share_scopes__.default);
    
    const factory = await container.get(config.exposedModule);
    const module = factory();
    
    this.loadedRemotes.set(config.name, module);
    return module;
  }

  private loadRemoteContainer(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${url}`));
      
      document.head.appendChild(script);
    });
  }
}

// Usage in routes
export const routes: Routes = [
  {
    path: 'dynamic/:moduleName',
    loadChildren: async () => {
      const federationService = inject(DynamicFederationService);
      const moduleName = inject(ActivatedRoute).snapshot.params['moduleName'];
      
      const config = {
        name: moduleName,
        url: `http://localhost:${getPortForModule(moduleName)}/remoteEntry.js`,
        exposedModule: './Module'
      };
      
      const module = await federationService.loadRemoteModule(config);
      return module.ROUTES;
    }
  }
];
```

## ✅ Best Practices

### 1. **Shared Dependencies**

```typescript
// ✅ Share common libraries
shared: {
  '@angular/core': { singleton: true },
  '@angular/router': { singleton: true }
}
```

### 2. **Version Management**

```typescript
// ✅ Strict version control
shared: {
  '@angular/core': { 
    singleton: true, 
    strictVersion: true,
    requiredVersion: '^18.0.0'
  }
}
```

### 3. **Error Boundaries**

```typescript
// ✅ Handle remote loading errors
loadChildren: () => 
  import('remote/Module')
    .catch(() => import('./fallback/fallback.routes'))
```

## 🎯 Architecture Patterns

- **Shell Pattern** - Central shell loads remotes
- **Composite Pattern** - Multiple shells
- **Federated Modules** - Shared module federation
- **Micro Apps** - Fully independent apps

## 🎓 Learning Checklist

- [ ] Understand micro frontend concepts
- [ ] Set up Module Federation
- [ ] Configure shared dependencies
- [ ] Handle version conflicts
- [ ] Implement error boundaries
- [ ] Deploy independently
- [ ] Monitor performance

## 🚀 Next Steps

1. **[Bundle Optimization](/advanced/bundle-optimization/)** - Reduce bundle sizes
2. **[Performance Optimization](/advanced/performance/)** - Optimize applications
3. **[Angular Elements](/advanced/elements/)** - Create web components

---

**Pro Tip**: Start small with micro frontends! Begin with one remote module and gradually expand. Ensure proper communication patterns and shared state management! 🏗️
