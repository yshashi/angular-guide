---
title: Component Communication 💬
description: Learn different ways components can communicate in Angular
sidebar:
  order: 2
---

Component communication is essential for building complex Angular applications. Master the various patterns for sharing data and coordinating behavior between components using modern Angular signals and functions.

## 🎯 Communication Patterns

- **Parent to Child** - Signal inputs
- **Child to Parent** - Signal outputs
- **Sibling Components** - Shared services with signals
- **ViewChild/ContentChild** - Direct component access
- **Template Reference Variables** - Template-based communication
- **State Management** - Signal-based centralized state

## 📥 Parent to Child Communication

### Using Signal Inputs
```typescript
// child.component.ts
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class.premium]="user().isPremium">
      <img [src]="user().avatar" [alt]="user().name">
      <h3>{{user().name}}</h3>
      <p>{{user().email}}</p>
      @if (user().isPremium) {
        <span>Premium</span>
      }
      @if (showActions()) {
        <div>
          <button (click)="onEdit()">Edit</button>
          <button (click)="onDelete()">Delete</button>
        </div>
      }
    </div>
  `
})
export class UserCardComponent {
  user = input.required<User>();
  showActions = input(false);
  
  edit = output<User>();
  delete = output<User>();

  onEdit() {
    this.edit.emit(this.user());
  }

  onDelete() {
    this.delete.emit(this.user());
  }
}

// parent.component.ts
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserCardComponent],
  template: `
    <div>
      <h2>Team Members</h2>
      
      @for (user of users(); track user.id) {
        <app-user-card
          [user]="user"
          [showActions]="currentUser().isAdmin"
          (edit)="editUser($event)"
          (delete)="deleteUser($event)">
        </app-user-card>
      }
    </div>
  `
})
export class UserListComponent {
  users = signal<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: '/avatars/john.jpg', isPremium: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: '/avatars/jane.jpg', isPremium: false }
  ]);

  currentUser = signal({ isAdmin: true });

  editUser(user: User) {
    console.log('Edit user:', user);
  }

  deleteUser(user: User) {
    this.users.update(users => users.filter(u => u.id !== user.id));
  }
}
```

### Input Transforms and Computed Values
```typescript
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div>{{label()}} ({{clampedProgress()}}%)</div>
      <div>
        <div 
          [style.width.%]="clampedProgress()"
          [class.complete]="isComplete()">
        </div>
      </div>
    </div>
  `
})
export class ProgressBarComponent {
  label = input('Progress');
  progress = input(0);
  
  // Computed values for derived state
  clampedProgress = computed(() => Math.max(0, Math.min(100, this.progress())));
  isComplete = computed(() => this.clampedProgress() >= 100);
}

// Usage
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-progress-bar 
      label="Upload Progress" 
      [progress]="uploadProgress()">
    </app-progress-bar>
    
    <app-progress-bar 
      label="Invalid Progress" 
      [progress]="150">  <!-- Will be clamped to 100 -->
    </app-progress-bar>
  `
})
export class UploadComponent {
  uploadProgress = signal(75);
}
```

## 📤 Child to Parent Communication

### Using Signal Outputs
```typescript
// search.component.ts
@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div>
        <input 
          type="text"
          [value]="searchTerm()"
          (input)="updateSearchTerm($event)"
          (keyup.enter)="onSearch()"
          placeholder="Search users...">
        <button (click)="onSearch()" [disabled]="!searchTerm().trim()">
          Search
        </button>
      </div>
      
      @if (suggestions().length > 0 && showSuggestions()) {
        <div>
          @for (suggestion of suggestions(); track suggestion) {
            <div (click)="selectSuggestion(suggestion)">
              {{suggestion}}
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SearchComponent {
  suggestions = input<string[]>([]);
  
  search = output<string>();
  suggestionSelected = output<string>();
  searchChange = output<string>();

  searchTerm = signal('');
  showSuggestions = signal(false);

  updateSearchTerm(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchChange.emit(value);
    this.showSuggestions.set(value.length > 0);
  }

  onSearch() {
    const term = this.searchTerm().trim();
    if (term) {
      this.search.emit(term);
      this.showSuggestions.set(false);
    }
  }

  selectSuggestion(suggestion: string) {
    this.searchTerm.set(suggestion);
    this.suggestionSelected.emit(suggestion);
    this.showSuggestions.set(false);
  }
}

// parent.component.ts
@Component({
  selector: 'app-user-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchComponent],
  template: `
    <div>
      <h2>User Search</h2>
      
      <app-search
        [suggestions]="searchSuggestions()"
        (search)="performSearch($event)"
        (searchChange)="updateSuggestions($event)"
        (suggestionSelected)="performSearch($event)">
      </app-search>
      
      @if (isLoading()) {
        <div>Searching...</div>
      }
      
      @if (searchResults().length > 0) {
        <div>
          <h3>Search Results ({{searchResults().length}})</h3>
          @for (user of searchResults(); track user.id) {
            <div>
              <strong>{{user.name}}</strong> - {{user.email}}
            </div>
          }
        </div>
      } @else if (hasSearched() && !isLoading()) {
        <div>No users found</div>
      }
    </div>
  `
})
export class UserSearchComponent {
  searchSuggestions = signal<string[]>(['John', 'Jane', 'Admin', 'Manager']);
  searchResults = signal<User[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);

  updateSuggestions(term: string) {
    const allSuggestions = ['John Doe', 'Jane Smith', 'Admin User', 'Manager Bob'];
    this.searchSuggestions.set(
      allSuggestions.filter(s => s.toLowerCase().includes(term.toLowerCase()))
    );
  }

  performSearch(term: string) {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.searchResults.set(this.mockSearch(term));
      this.isLoading.set(false);
    }, 1000);
  }

  private mockSearch(term: string): User[] {
    const allUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Admin User', email: 'admin@example.com' }
    ];
    
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
    );
  }
}
```

## 🔗 Sibling Communication via Services

### Signal-Based Service Pattern
```typescript
// notification.service.ts
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private currentNotification = signal<Notification | null>(null);
  private notificationHistory = signal<Notification[]>([]);

  // Public read-only signals
  notification = this.currentNotification.asReadonly();
  history = this.notificationHistory.asReadonly();

  showSuccess(message: string, duration = 3000) {
    this.showNotification({
      id: Date.now(),
      type: 'success',
      message,
      duration
    });
  }

  showError(message: string, duration = 5000) {
    this.showNotification({
      id: Date.now(),
      type: 'error',
      message,
      duration
    });
  }

  showWarning(message: string, duration = 4000) {
    this.showNotification({
      id: Date.now(),
      type: 'warning',
      message,
      duration
    });
  }

  private showNotification(notification: Notification) {
    this.notificationHistory.update(history => [...history, notification]);
    this.currentNotification.set(notification);
    
    if (notification.duration > 0) {
      setTimeout(() => {
        this.clearNotification();
      }, notification.duration);
    }
  }

  clearNotification() {
    this.currentNotification.set(null);
  }
}

// notification-display.component.ts
@Component({
  selector: 'app-notification-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notificationService.notification()) {
      <div [class]="'notification-' + notificationService.notification()!.type">
        <div>
          <span>{{notificationService.notification()!.message}}</span>
          <button (click)="close()">×</button>
        </div>
      </div>
    }
  `
})
export class NotificationDisplayComponent {
  notificationService = inject(NotificationService);

  close() {
    this.notificationService.clearNotification();
  }
}

// action-buttons.component.ts
@Component({
  selector: 'app-action-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="showSuccess()">Show Success</button>
      <button (click)="showError()">Show Error</button>
      <button (click)="showWarning()">Show Warning</button>
    </div>
  `
})
export class ActionButtonsComponent {
  private notificationService = inject(NotificationService);

  showSuccess() {
    this.notificationService.showSuccess('Operation completed successfully!');
  }

  showError() {
    this.notificationService.showError('An error occurred while processing your request.');
  }

  showWarning() {
    this.notificationService.showWarning('Please review your input before proceeding.');
  }
}
```

## 🎯 ViewChild and Template References

### Modern ViewChild with Signals
```typescript
@Component({
  selector: 'app-modal-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="openModal()">Open Modal</button>
      
      <app-modal #modal [isOpen]="isModalOpen()" (close)="closeModal()">
        <h2>Modal Content</h2>
        <p>This is modal content</p>
      </app-modal>
    </div>
  `
})
export class ModalManagerComponent {
  modal = viewChild<ModalComponent>('modal');
  
  isModalOpen = signal(false);

  openModal() {
    this.isModalOpen.set(true);
    // Direct access to child component
    this.modal()?.focus();
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
}

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div (click)="onClose()">
        <div #modalContent (click)="$event.stopPropagation()">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  modalContent = viewChild<ElementRef>('modalContent');
  
  isOpen = input(false);
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  focus() {
    this.modalContent()?.nativeElement.focus();
  }
}
```

:::caution[Legacy Syntax]
In older Angular versions, `@ViewChild` and `@ContentChild` decorators were used for querying elements:
```ts
@ViewChild('modal') modal!: ModalComponent;
@ViewChild('modalContent') modalContent!: ElementRef;
```
Modern Angular uses signal-based queries like `viewChild()` and `contentChild()` instead, which return signals.
:::

## 🌐 Advanced Communication Patterns

### Event Bus Pattern with Signals
```typescript
// event-bus.service.ts
@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private events = signal<Map<string, any>>(new Map());

  emit<T>(eventName: string, data: T) {
    this.events.update(events => {
      const newEvents = new Map(events);
      newEvents.set(eventName, { data, timestamp: Date.now() });
      return newEvents;
    });
  }

  on<T>(eventName: string): Signal<T | undefined> {
    return computed(() => {
      const event = this.events().get(eventName);
      return event?.data;
    });
  }
}

// Usage in components
@Component({
  selector: 'app-publisher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="publishEvent()">Publish Event</button>
  `
})
export class PublisherComponent {
  private eventBus = inject(EventBusService);
  private counter = signal(0);

  publishEvent() {
    this.counter.update(c => c + 1);
    this.eventBus.emit('user-action', {
      action: 'button-clicked',
      count: this.counter()
    });
  }
}

@Component({
  selector: 'app-subscriber',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Event Subscriber</h3>
      @if (eventData()) {
        <p>Received: {{eventData()?.action}} ({{eventData()?.count}})</p>
      }
    </div>
  `
})
export class SubscriberComponent {
  private eventBus = inject(EventBusService);
  
  eventData = this.eventBus.on<{action: string, count: number}>('user-action');
}
```

## ✅ Best Practices

### 1. **Use Signals for Reactive State**
```typescript
// ✅ Good - Signal-based state
export class ComponentA {
  data = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  
  // Computed derived state
  hasSelection = computed(() => this.selectedUser() !== null);
}

// ❌ Avoid - Traditional reactive patterns when signals suffice
export class ComponentB {
  private dataSubject = new BehaviorSubject<User[]>([]);
  data$ = this.dataSubject.asObservable();
}
```

### 2. **Prefer input()/output() Functions**
```typescript
// ✅ Good - Modern signal functions
export class ModernComponent {
  user = input.required<User>();
  userSelected = output<User>();
}

// ❌ Avoid - Decorator-based approach
export class OldComponent {
  @Input({ required: true }) user!: User;
  @Output() userSelected = new EventEmitter<User>();
}
```

### 3. **Use OnPush Change Detection**
```typescript
// ✅ Always use OnPush with signals
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

## 🎯 Quick Checklist

- [ ] Use `input()` and `output()` functions instead of decorators
- [ ] Implement `ChangeDetectionStrategy.OnPush` for all components
- [ ] Use signals for component state management
- [ ] Use `computed()` for derived state
- [ ] Use `inject()` function for dependency injection
- [ ] Prefer signal-based services over Observable-based ones
- [ ] Use native control flow (`@if`, `@for`) in templates
- [ ] Avoid `ngClass` and `ngStyle`, use direct bindings
- [ ] Keep components focused on single responsibility
- [ ] Use ViewChild for direct component access when needed

## 🚀 Next Steps

1. **[Lifecycle Hooks](/intermediate/lifecycle-hooks/)** - Understand component lifecycle with signals
2. **[Reactive Forms](/intermediate/reactive-forms/)** - Build complex forms with signals
3. **[State Management](/intermediate/state-management/)** - Advanced state patterns

---

**Remember**: Modern Angular communication patterns with signals provide better performance, simpler mental models, and more predictable state management! 💬
