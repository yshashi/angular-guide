---
title: Effects API
description: Handle side effects with Angular Effects API
sidebar:
  order: 4
---

# Effects API 🎭

The Effects API in Angular provides a way to perform side effects in response to signal changes. Effects run automatically when their signal dependencies change, making them perfect for tasks like logging, API calls, DOM manipulation, and synchronization.

## 🎯 What are Effects?

Effects are functions that run automatically when their signal dependencies change. Unlike computed signals which return values, effects are designed for side effects - operations that interact with the outside world.

```typescript
import { Component, signal, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()">+</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);

  constructor() {
    // Effect runs whenever count changes
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }
}
```

## 🔄 How Effects Work

### Automatic Dependency Tracking
```typescript
@Component({
  template: `
    <div>
      <input [(ngModel)]="searchTerm" placeholder="Search...">
      <p>Results: {{ results().length }}</p>
    </div>
  `
})
export class SearchComponent {
  searchTerm = signal('');
  results = signal<string[]>([]);

  constructor() {
    // Effect automatically tracks searchTerm dependency
    effect(() => {
      const term = this.searchTerm();
      if (term.length > 2) {
        this.performSearch(term);
      } else {
        this.results.set([]);
      }
    });
  }

  private async performSearch(term: string) {
    // Simulate API call
    const mockResults = [
      `Result 1 for "${term}"`,
      `Result 2 for "${term}"`,
      `Result 3 for "${term}"`
    ];
    
    // Simulate delay
    setTimeout(() => {
      this.results.set(mockResults);
    }, 300);
  }
}
```

### Multiple Dependencies
```typescript
@Component({
  template: `
    <div class="user-dashboard">
      <h2>{{ user().name }}</h2>
      <p>Theme: {{ theme() }}</p>
      <p>Language: {{ language() }}</p>
    </div>
  `
})
export class UserDashboardComponent {
  user = signal({ id: 1, name: 'John', preferences: {} });
  theme = signal('light');
  language = signal('en');

  constructor() {
    // Effect with multiple dependencies
    effect(() => {
      const currentUser = this.user();
      const currentTheme = this.theme();
      const currentLanguage = this.language();
      
      // Save user preferences to localStorage
      localStorage.setItem('userPreferences', JSON.stringify({
        userId: currentUser.id,
        theme: currentTheme,
        language: currentLanguage
      }));
      
      console.log('User preferences saved');
    });
  }
}
```

## 🛠️ Creating Effects

### Basic Effect Creation
```typescript
import { Component, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-data-sync',
  template: `
    <div>
      <button (click)="updateData()">Update Data</button>
      <p>Last sync: {{ lastSync() }}</p>
    </div>
  `
})
export class DataSyncComponent {
  private http = inject(HttpClient);
  
  data = signal({ id: 1, value: 'initial' });
  lastSync = signal<Date | null>(null);

  constructor() {
    // Effect for API synchronization
    effect(() => {
      const currentData = this.data();
      
      // Sync data to server
      this.http.post('/api/sync', currentData).subscribe({
        next: () => {
          this.lastSync.set(new Date());
          console.log('Data synced successfully');
        },
        error: (error) => {
          console.error('Sync failed:', error);
        }
      });
    });
  }

  updateData() {
    this.data.update(current => ({
      ...current,
      value: `updated-${Date.now()}`
    }));
  }
}
```

### Effect with Cleanup
```typescript
@Component({
  selector: 'app-websocket',
  template: `
    <div>
      <p>Connection Status: {{ connectionStatus() }}</p>
      <p>Messages: {{ messageCount() }}</p>
    </div>
  `
})
export class WebSocketComponent {
  connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  messageCount = signal(0);
  private websocket: WebSocket | null = null;

  constructor() {
    effect((onCleanup) => {
      const status = this.connectionStatus();
      
      if (status === 'connecting') {
        // Create WebSocket connection
        this.websocket = new WebSocket('ws://localhost:8080');
        
        this.websocket.onopen = () => {
          this.connectionStatus.set('connected');
        };
        
        this.websocket.onmessage = () => {
          this.messageCount.update(count => count + 1);
        };
        
        this.websocket.onerror = () => {
          this.connectionStatus.set('disconnected');
        };
        
        // Cleanup function
        onCleanup(() => {
          if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            console.log('WebSocket connection closed');
          }
        });
      }
    });
  }

  connect() {
    this.connectionStatus.set('connecting');
  }

  disconnect() {
    this.connectionStatus.set('disconnected');
  }
}
```

## 🎨 DOM Manipulation with Effects

### Dynamic Styling
```typescript
@Component({
  selector: 'app-theme-manager',
  template: `
    <div class="theme-controls">
      <button (click)="toggleTheme()">Toggle Theme</button>
      <button (click)="changeAccentColor()">Change Accent</button>
      <p>Current theme: {{ theme() }}</p>
      <p>Accent color: {{ accentColor() }}</p>
    </div>
  `
})
export class ThemeManagerComponent {
  theme = signal<'light' | 'dark'>('light');
  accentColor = signal('#007bff');

  constructor() {
    // Effect for theme application
    effect(() => {
      const currentTheme = this.theme();
      const accent = this.accentColor();
      
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.documentElement.style.setProperty('--accent-color', accent);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', 
          currentTheme === 'dark' ? '#1a1a1a' : '#ffffff'
        );
      }
    });
  }

  toggleTheme() {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  changeAccentColor() {
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'];
    const currentIndex = colors.indexOf(this.accentColor());
    const nextIndex = (currentIndex + 1) % colors.length;
    this.accentColor.set(colors[nextIndex]);
  }
}
```

### Focus Management
```typescript
@Component({
  selector: 'app-focus-manager',
  template: `
    <div>
      <button (click)="showModal()">Show Modal</button>
      
      <div *ngIf="isModalOpen()" class="modal" #modal>
        <div class="modal-content">
          <h2>Modal Title</h2>
          <input #firstInput type="text" placeholder="First input">
          <input type="text" placeholder="Second input">
          <button (click)="closeModal()">Close</button>
        </div>
      </div>
    </div>
  `
})
export class FocusManagerComponent {
  isModalOpen = signal(false);

  constructor() {
    // Effect for focus management
    effect(() => {
      if (this.isModalOpen()) {
        // Focus first input when modal opens
        setTimeout(() => {
          const firstInput = document.querySelector('.modal input') as HTMLInputElement;
          if (firstInput) {
            firstInput.focus();
          }
        }, 0);
        
        // Trap focus within modal
        const modal = document.querySelector('.modal');
        if (modal) {
          this.trapFocus(modal as HTMLElement);
        }
      }
    });
  }

  showModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  private trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }
}
```

## 📡 API Integration with Effects

### Data Fetching
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-profile',
  template: `
    <div>
      <select [(ngModel)]="selectedUserId">
        <option value="1">User 1</option>
        <option value="2">User 2</option>
        <option value="3">User 3</option>
      </select>
      
      <div *ngIf="loading()">Loading...</div>
      <div *ngIf="error()">Error: {{ error() }}</div>
      <div *ngIf="user()">
        <h2>{{ user()?.name }}</h2>
        <p>{{ user()?.email }}</p>
      </div>
    </div>
  `
})
export class UserProfileComponent {
  private http = inject(HttpClient);
  
  selectedUserId = signal('1');
  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Effect for user data fetching
    effect(() => {
      const userId = this.selectedUserId();
      
      this.loading.set(true);
      this.error.set(null);
      
      this.http.get<User>(`/api/users/${userId}`).subscribe({
        next: (userData) => {
          this.user.set(userData);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load user data');
          this.loading.set(false);
          this.user.set(null);
        }
      });
    });
  }
}
```

### Real-time Updates
```typescript
@Component({
  selector: 'app-live-data',
  template: `
    <div>
      <h2>Live Data Dashboard</h2>
      <button (click)="toggleUpdates()">
        {{ isLive() ? 'Stop' : 'Start' }} Updates
      </button>
      
      <div class="metrics">
        <div class="metric">
          <h3>CPU Usage</h3>
          <p>{{ metrics().cpu }}%</p>
        </div>
        <div class="metric">
          <h3>Memory</h3>
          <p>{{ metrics().memory }}%</p>
        </div>
        <div class="metric">
          <h3>Active Users</h3>
          <p>{{ metrics().activeUsers }}</p>
        </div>
      </div>
    </div>
  `
})
export class LiveDataComponent {
  private http = inject(HttpClient);
  
  isLive = signal(false);
  metrics = signal({
    cpu: 0,
    memory: 0,
    activeUsers: 0
  });
  
  private intervalId: number | null = null;

  constructor() {
    // Effect for live data updates
    effect((onCleanup) => {
      if (this.isLive()) {
        // Start polling
        this.intervalId = window.setInterval(() => {
          this.fetchMetrics();
        }, 2000);
        
        // Initial fetch
        this.fetchMetrics();
        
        // Cleanup interval
        onCleanup(() => {
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
        });
      }
    });
  }

  toggleUpdates() {
    this.isLive.update(current => !current);
  }

  private fetchMetrics() {
    this.http.get<any>('/api/metrics').subscribe({
      next: (data) => {
        this.metrics.set(data);
      },
      error: (error) => {
        console.error('Failed to fetch metrics:', error);
      }
    });
  }
}
```

## 🔄 Effect Patterns

### Debounced Effects
```typescript
@Component({
  selector: 'app-search-with-debounce',
  template: `
    <div>
      <input 
        [(ngModel)]="searchQuery" 
        placeholder="Search..."
        class="search-input"
      >
      <div *ngIf="isSearching()">Searching...</div>
      <ul>
        <li *ngFor="let result of searchResults()">{{ result }}</li>
      </ul>
    </div>
  `
})
export class SearchWithDebounceComponent {
  searchQuery = signal('');
  searchResults = signal<string[]>([]);
  isSearching = signal(false);
  
  private searchTimeoutId: number | null = null;

  constructor() {
    // Debounced search effect
    effect((onCleanup) => {
      const query = this.searchQuery();
      
      // Clear previous timeout
      if (this.searchTimeoutId) {
        clearTimeout(this.searchTimeoutId);
      }
      
      if (query.length > 2) {
        this.isSearching.set(true);
        
        // Debounce search by 500ms
        this.searchTimeoutId = window.setTimeout(() => {
          this.performSearch(query);
        }, 500);
        
        onCleanup(() => {
          if (this.searchTimeoutId) {
            clearTimeout(this.searchTimeoutId);
          }
        });
      } else {
        this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });
  }

  private async performSearch(query: string) {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockResults = [
        `Result 1 for "${query}"`,
        `Result 2 for "${query}"`,
        `Result 3 for "${query}"`
      ];
      
      this.searchResults.set(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }
}
```

### Conditional Effects
```typescript
@Component({
  selector: 'app-conditional-effects',
  template: `
    <div>
      <label>
        <input 
          type="checkbox" 
          [(ngModel)]="enableTracking"
        >
        Enable Analytics Tracking
      </label>
      
      <div class="user-actions">
        <button (click)="performAction('click')">Click Action</button>
        <button (click)="performAction('view')">View Action</button>
        <button (click)="performAction('share')">Share Action</button>
      </div>
      
      <p>Actions performed: {{ actionCount() }}</p>
    </div>
  `
})
export class ConditionalEffectsComponent {
  enableTracking = signal(true);
  lastAction = signal<string | null>(null);
  actionCount = signal(0);

  constructor() {
    // Conditional effect - only runs when tracking is enabled
    effect(() => {
      if (this.enableTracking() && this.lastAction()) {
        const action = this.lastAction();
        
        // Send analytics event
        this.sendAnalyticsEvent(action!);
        
        console.log(`Analytics: ${action} tracked`);
      }
    });
    
    // Always-running effect for action counting
    effect(() => {
      const action = this.lastAction();
      if (action) {
        this.actionCount.update(count => count + 1);
      }
    });
  }

  performAction(actionType: string) {
    this.lastAction.set(actionType);
  }

  private sendAnalyticsEvent(action: string) {
    // Simulate analytics API call
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: action,
        timestamp: new Date().toISOString(),
        userId: 'user123'
      })
    }).catch(error => {
      console.error('Analytics failed:', error);
    });
  }
}
```

## 🧪 Testing Effects

### Unit Testing Effects
```typescript
import { TestBed } from '@angular/core/testing';
import { signal, effect } from '@angular/core';

describe('Effects', () => {
  it('should run when signal changes', () => {
    const spy = jasmine.createSpy('effect');
    const count = signal(0);
    
    TestBed.runInInjectionContext(() => {
      effect(() => {
        spy(count());
      });
    });
    
    // Initial run
    expect(spy).toHaveBeenCalledWith(0);
    
    // After signal change
    count.set(1);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should handle cleanup properly', () => {
    const cleanupSpy = jasmine.createSpy('cleanup');
    const isActive = signal(true);
    
    TestBed.runInInjectionContext(() => {
      effect((onCleanup) => {
        if (isActive()) {
          onCleanup(cleanupSpy);
        }
      });
    });
    
    // Change signal to trigger cleanup
    isActive.set(false);
    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```

### Component Testing with Effects
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should trigger search effect when search term changes', async () => {
    spyOn(component as any, 'performSearch');
    
    component.searchTerm.set('test query');
    
    // Wait for effect to run
    await fixture.whenStable();
    
    expect((component as any).performSearch).toHaveBeenCalledWith('test query');
  });

  it('should not search for short terms', async () => {
    spyOn(component as any, 'performSearch');
    
    component.searchTerm.set('ab');
    
    await fixture.whenStable();
    
    expect((component as any).performSearch).not.toHaveBeenCalled();
    expect(component.results()).toEqual([]);
  });
});
```

## 🎯 Best Practices

### 1. Keep Effects Simple
```typescript
// ✅ Good - Simple, focused effect
effect(() => {
  const theme = this.theme();
  document.body.className = `theme-${theme}`;
});

// ❌ Avoid - Complex logic in effects
effect(() => {
  const user = this.user();
  const settings = this.settings();
  const permissions = this.permissions();
  
  // Too much logic in one effect
  if (user && settings && permissions) {
    // Complex business logic...
    this.processUserData(user, settings, permissions);
    this.updateUI();
    this.sendAnalytics();
    this.cacheData();
  }
});
```

### 2. Use Cleanup for Resources
```typescript
// ✅ Good - Proper cleanup
effect((onCleanup) => {
  const intervalId = setInterval(() => {
    this.fetchData();
  }, 1000);
  
  onCleanup(() => {
    clearInterval(intervalId);
  });
});

// ❌ Avoid - No cleanup
effect(() => {
  setInterval(() => {
    this.fetchData(); // Memory leak!
  }, 1000);
});
```

### 3. Handle Errors Gracefully
```typescript
// ✅ Good - Error handling
effect(() => {
  try {
    const data = this.processData();
    this.updateUI(data);
  } catch (error) {
    console.error('Effect error:', error);
    this.handleError(error);
  }
});
```

## 🎓 Learning Outcomes

After mastering the Effects API, you'll be able to:
- [ ] Create effects that respond to signal changes
- [ ] Handle side effects like API calls and DOM manipulation
- [ ] Implement proper cleanup to prevent memory leaks
- [ ] Use effects for real-time data synchronization
- [ ] Apply debouncing and conditional effect patterns
- [ ] Test effects effectively in your applications
- [ ] Follow effects best practices for maintainable code

## 🚀 What's Next?

Now that you understand the Effects API:

1. **[Linked Signals](/modern/linked-signals/)** - Advanced signal patterns
2. **[Resource API](/modern/resource-api/)** - Async data handling with signals
3. **[Control Flow](/modern/control-flow/)** - New template syntax with signals

---

**Pro Tip**: Effects are perfect for bridging the gap between Angular's reactive signals and the imperative world of DOM APIs, third-party libraries, and external services! 🎭
