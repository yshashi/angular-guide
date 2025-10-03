---
title: Dynamic Components 🔄
description: Load and manage components dynamically at runtime in Angular
sidebar:
  order: 2
---

Dynamic components allow you to load components at runtime based on user actions, data, or application state. This powerful feature enables flexible, data-driven UIs and plugin architectures.

## 🎯 What are Dynamic Components?

Dynamic components are components that are **created and inserted into the DOM at runtime**, rather than being declared in templates at compile time. They're perfect for:

- **Modal dialogs** - Show different content based on context
- **Tab systems** - Load tab content on demand
- **Plugin architectures** - Load features dynamically
- **Dashboard widgets** - User-configurable layouts
- **Form builders** - Dynamic form fields
- **Notification systems** - Different notification types

## 🚀 Basic Dynamic Component Loading

### Using ViewContainerRef

```typescript
import { Component, ViewContainerRef, inject } from '@angular/core';
import { WelcomeComponent } from './welcome.component';

@Component({
  selector: 'app-container',
  standalone: true,
  template: `
    <div class="container">
      <h2>Dynamic Component Container</h2>
      <button (click)="loadComponent()">Load Component</button>
      <button (click)="clear()">Clear</button>
    </div>
  `
})
export class ContainerComponent {
  private viewContainer = inject(ViewContainerRef);

  loadComponent() {
    // Clear existing components
    this.viewContainer.clear();
    
    // Create and insert the component
    const componentRef = this.viewContainer.createComponent(WelcomeComponent);
    
    // Optionally set inputs
    componentRef.setInput('username', 'John Doe');
  }

  clear() {
    this.viewContainer.clear();
  }
}
```

### Component to Load

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-welcome',
  standalone: true,
  template: `
    <div class="welcome">
      <h3>Welcome, {{ username() }}!</h3>
      <p>This component was loaded dynamically.</p>
    </div>
  `
})
export class WelcomeComponent {
  username = input<string>('Guest');
}
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Warning:</strong> For Angular versions 19 and above, you can remove the <code>standalone: true</code> property from your dynamic component directives.</p>
</blockquote>

### 1. **Dynamic Modal System**

Let's build a flexible modal system that can display different content dynamically.

**Modal Service:**

```typescript
import { Injectable, inject, signal, Type } from '@angular/core';

export interface ModalConfig {
  component: Type<any>;
  data?: any;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modalConfig = signal<ModalConfig | null>(null);
  
  isOpen = signal(false);
  config = this.modalConfig.asReadonly();

  open(config: ModalConfig) {
    this.modalConfig.set(config);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    setTimeout(() => this.modalConfig.set(null), 300); // Animation delay
  }
}
```

**Modal Container Component:**

```typescript
import { Component, ViewContainerRef, effect, inject } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  template: `
    @if (modalService.isOpen()) {
      <div class="modal-overlay" (click)="modalService.close()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ modalService.config()?.title || 'Modal' }}</h3>
            <button (click)="modalService.close()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Dynamic component loads here -->
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalContainerComponent {
  modalService = inject(ModalService);
  private viewContainer = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const config = this.modalService.config();
      
      if (config && this.modalService.isOpen()) {
        this.loadComponent(config);
      } else {
        this.viewContainer.clear();
      }
    });
  }

  private loadComponent(config: ModalConfig) {
    this.viewContainer.clear();
    const componentRef = this.viewContainer.createComponent(config.component);
    
    // Pass data to the component
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        componentRef.setInput(key, config.data[key]);
      });
    }
  }
}
```

**Example Modal Content Components:**

```typescript
// Confirmation Modal
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <div class="confirm-content">
      <p>{{ message() }}</p>
      <div class="actions">
        <button (click)="onConfirm()">Confirm</button>
        <button (click)="onCancel()">Cancel</button>
      </div>
    </div>
  `
})
export class ConfirmModalComponent {
  private modalService = inject(ModalService);
  
  message = input<string>('Are you sure?');
  onConfirmCallback = input<() => void>(() => {});

  onConfirm() {
    this.onConfirmCallback()();
    this.modalService.close();
  }

  onCancel() {
    this.modalService.close();
  }
}

// User Details Modal
@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  template: `
    <div class="user-details">
      <img [src]="user().avatar" [alt]="user().name">
      <h4>{{ user().name }}</h4>
      <p>{{ user().email }}</p>
      <p>{{ user().bio }}</p>
    </div>
  `
})
export class UserDetailsModalComponent {
  user = input.required<User>();
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ModalContainerComponent],
  template: `
    <div class="dashboard">
      <button (click)="showConfirmation()">Delete Item</button>
      <button (click)="showUserDetails()">View Profile</button>
    </div>
    
    <app-modal-container />
  `
})
export class DashboardComponent {
  private modalService = inject(ModalService);

  showConfirmation() {
    this.modalService.open({
      component: ConfirmModalComponent,
      title: 'Confirm Deletion',
      data: {
        message: 'Are you sure you want to delete this item?',
        onConfirmCallback: () => this.deleteItem()
      }
    });
  }

  showUserDetails() {
    this.modalService.open({
      component: UserDetailsModalComponent,
      title: 'User Profile',
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          avatar: '/assets/avatar.jpg',
          bio: 'Software Developer'
        }
      }
    });
  }

  deleteItem() {
    console.log('Item deleted!');
  }
}
```

### 2. **Dynamic Tab System**

Let's create a tab system that loads tab content dynamically.

**Tab Configuration:**

```typescript
import { Type } from '@angular/core';

export interface TabConfig {
  id: string;
  label: string;
  component: Type<any>;
  data?: any;
}
```

**Tab Container Component:**

```typescript
import { Component, input, signal, ViewContainerRef, effect, inject } from '@angular/core';
import { TabConfig } from './tab-config';

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: `
    <div class="tabs">
      <div class="tab-headers">
        @for (tab of tabs(); track tab.id) {
          <button 
            class="tab-header"
            [class.active]="activeTabId() === tab.id"
            (click)="selectTab(tab.id)">
            {{ tab.label }}
          </button>
        }
      </div>
      
      <div class="tab-content">
        <!-- Dynamic tab content loads here -->
      </div>
    </div>
  `,
})
export class TabsComponent {
  private viewContainer = inject(ViewContainerRef);
  
  tabs = input.required<TabConfig[]>();
  activeTabId = signal<string>('');

  constructor() {
    // Set first tab as active by default
    effect(() => {
      const tabsList = this.tabs();
      if (tabsList.length > 0 && !this.activeTabId()) {
        this.activeTabId.set(tabsList[0].id);
      }
    });

    // Load component when active tab changes
    effect(() => {
      const activeId = this.activeTabId();
      const tab = this.tabs().find(t => t.id === activeId);
      
      if (tab) {
        this.loadTabContent(tab);
      }
    });
  }

  selectTab(tabId: string) {
    this.activeTabId.set(tabId);
  }

  private loadTabContent(tab: TabConfig) {
    this.viewContainer.clear();
    const componentRef = this.viewContainer.createComponent(tab.component);
    
    // Pass data to the tab component
    if (tab.data) {
      Object.keys(tab.data).forEach(key => {
        componentRef.setInput(key, tab.data[key]);
      });
    }
  }
}
```

**Example Tab Content Components:**

```typescript
// Profile Tab
@Component({
  selector: 'app-profile-tab',
  standalone: true,
  template: `
    <div class="profile">
      <h3>Profile Information</h3>
      <p>Name: {{ user().name }}</p>
      <p>Email: {{ user().email }}</p>
    </div>
  `
})
export class ProfileTabComponent {
  user = input.required<User>();
}

// Settings Tab
@Component({
  selector: 'app-settings-tab',
  standalone: true,
  template: `
    <div class="settings">
      <h3>Settings</h3>
      <label>
        <input type="checkbox" [checked]="notifications()">
        Enable Notifications
      </label>
    </div>
  `
})
export class SettingsTabComponent {
  notifications = input<boolean>(true);
}

// Activity Tab
@Component({
  selector: 'app-activity-tab',
  standalone: true,
  template: `
    <div class="activity">
      <h3>Recent Activity</h3>
      @for (activity of activities(); track activity.id) {
        <div class="activity-item">
          <span>{{ activity.action }}</span>
          <span>{{ activity.timestamp }}</span>
        </div>
      }
    </div>
  `
})
export class ActivityTabComponent {
  activities = input.required<Activity[]>();
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [TabsComponent],
  template: `
    <app-tabs [tabs]="tabConfigs()" />
  `
})
export class UserDashboardComponent {
  private user = signal({
    name: 'John Doe',
    email: 'john@example.com'
  });

  tabConfigs = signal<TabConfig[]>([
    {
      id: 'profile',
      label: 'Profile',
      component: ProfileTabComponent,
      data: { user: this.user() }
    },
    {
      id: 'settings',
      label: 'Settings',
      component: SettingsTabComponent,
      data: { notifications: true }
    },
    {
      id: 'activity',
      label: 'Activity',
      component: ActivityTabComponent,
      data: {
        activities: [
          { id: 1, action: 'Logged in', timestamp: '2 hours ago' },
          { id: 2, action: 'Updated profile', timestamp: '1 day ago' }
        ]
      }
    }
  ]);
}
```

### 3. **Dynamic Form Builder**

Let's build a dynamic form system that creates form fields based on configuration.

**Form Field Configuration:**

```typescript
export type FieldType = 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface FieldConfig {
  type: FieldType;
  name: string;
  label: string;
  value?: any;
  required?: boolean;
  options?: { label: string; value: any }[];
  placeholder?: string;
}
```

**Field Components:**

```typescript
// Text Input Component
@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-field">
      <label [for]="config().name">
        {{ config().label }}
        @if (config().required) {
          <span class="required">*</span>
        }
      </label>
      <input 
        [id]="config().name"
        [type]="config().type"
        [formControl]="control()"
        [placeholder]="config().placeholder || ''"
      />
    </div>
  `
})
export class TextFieldComponent {
  config = input.required<FieldConfig>();
  control = input.required<FormControl>();
}

// Select Component
@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-field">
      <label [for]="config().name">{{ config().label }}</label>
      <select [id]="config().name" [formControl]="control()">
        <option value="">Select...</option>
        @for (option of config().options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </div>
  `
})
export class SelectFieldComponent {
  config = input.required<FieldConfig>();
  control = input.required<FormControl>();
}
```

**Dynamic Form Component:**

```typescript
import { Component, input, signal, ViewContainerRef, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-fields">
        <!-- Dynamic fields load here -->
      </div>
      
      <button type="submit" [disabled]="form.invalid">
        Submit
      </button>
    </form>
  `
})
export class DynamicFormComponent {
  private fb = inject(FormBuilder);
  private viewContainer = inject(ViewContainerRef);
  
  fields = input.required<FieldConfig[]>();
  form!: FormGroup;

  constructor() {
    effect(() => {
      this.buildForm();
      this.loadFields();
    });
  }

  private buildForm() {
    const group: any = {};
    
    this.fields().forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      group[field.name] = [field.value || '', validators];
    });
    
    this.form = this.fb.group(group);
  }

  private loadFields() {
    this.viewContainer.clear();
    
    this.fields().forEach(fieldConfig => {
      const component = this.getComponentForType(fieldConfig.type);
      const componentRef = this.viewContainer.createComponent(component);
      
      componentRef.setInput('config', fieldConfig);
      componentRef.setInput('control', this.form.get(fieldConfig.name));
    });
  }

  private getComponentForType(type: FieldType) {
    const componentMap = {
      text: TextFieldComponent,
      email: TextFieldComponent,
      number: TextFieldComponent,
      select: SelectFieldComponent,
      checkbox: CheckboxFieldComponent,
      textarea: TextareaFieldComponent
    };
    
    return componentMap[type];
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    }
  }
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [DynamicFormComponent],
  template: `
    <h2>User Registration</h2>
    <app-dynamic-form [fields]="formFields()" />
  `
})
export class RegistrationComponent {
  formFields = signal<FieldConfig[]>([
    {
      type: 'text',
      name: 'firstName',
      label: 'First Name',
      required: true,
      placeholder: 'Enter your first name'
    },
    {
      type: 'text',
      name: 'lastName',
      label: 'Last Name',
      required: true
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email',
      required: true,
      placeholder: 'your@email.com'
    },
    {
      type: 'select',
      name: 'country',
      label: 'Country',
      required: true,
      options: [
        { label: 'United States', value: 'us' },
        { label: 'United Kingdom', value: 'uk' },
        { label: 'Canada', value: 'ca' }
      ]
    }
  ]);
}
```

### 4. **Dynamic Dashboard Widgets**

Let's create a customizable dashboard where users can add/remove widgets.

**Widget Configuration:**

```typescript
export interface WidgetConfig {
  id: string;
  type: string;
  component: Type<any>;
  title: string;
  data?: any;
  position?: { row: number; col: number };
}
```

**Dashboard Component:**

```typescript
import { Component, signal, ViewContainerRef, inject } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>My Dashboard</h2>
        <button (click)="addWidget()">Add Widget</button>
      </div>
      
      <div class="widget-grid">
        @for (widget of widgets(); track widget.id) {
          <div class="widget-container">
            <div class="widget-header">
              <h3>{{ widget.title }}</h3>
              <button (click)="removeWidget(widget.id)">&times;</button>
            </div>
            <div class="widget-content" #widgetContent></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent {
  widgets = signal<WidgetConfig[]>([
    {
      id: '1',
      type: 'stats',
      component: StatsWidgetComponent,
      title: 'Statistics',
      data: { value: 1234, label: 'Total Users' }
    },
    {
      id: '2',
      type: 'chart',
      component: ChartWidgetComponent,
      title: 'Sales Chart',
      data: { chartData: [10, 20, 30, 40] }
    }
  ]);

  addWidget() {
    const newWidget: WidgetConfig = {
      id: Date.now().toString(),
      type: 'stats',
      component: StatsWidgetComponent,
      title: 'New Widget',
      data: { value: 0, label: 'New Metric' }
    };
    
    this.widgets.update(w => [...w, newWidget]);
  }

  removeWidget(id: string) {
    this.widgets.update(w => w.filter(widget => widget.id !== id));
  }
}
```

## ✅ Best Practices

### 1. **Use Signals for State Management**

```typescript
// ✅ Good - Signals for reactive state
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  activeComponent = signal<Type<any> | null>(null);
  componentData = signal<any>(null);
}

// ❌ Avoid - Plain properties
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  activeComponent: Type<any> | null = null;
  componentData: any = null;
}
```

### 2. **Clean Up Component References**

```typescript
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  private componentRef?: ComponentRef<any>;

  loadComponent(component: Type<any>) {
    // Clean up previous component
    this.componentRef?.destroy();
    
    this.componentRef = this.viewContainer.createComponent(component);
  }

  ngOnDestroy() {
    this.componentRef?.destroy();
  }
}
```

### 3. **Type-Safe Component Data**

```typescript
// ✅ Good - Type-safe configuration
interface ComponentConfig<T = any> {
  component: Type<T>;
  data: T extends { data: infer D } ? D : any;
}

// ❌ Avoid - Untyped data
interface ComponentConfig {
  component: any;
  data: any;
}
```

### 4. **Use inject() Function**

```typescript
// ✅ Good - inject() function
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  private viewContainer = inject(ViewContainerRef);
  private componentFactoryResolver = inject(ComponentFactoryResolver);
}

// ❌ Avoid - Constructor injection
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  constructor(
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}
}
```

### 5. **Handle Component Lifecycle**

```typescript
@Component({
  selector: 'app-container',
  standalone: true
})
export class ContainerComponent {
  private componentRef?: ComponentRef<any>;

  loadComponent(component: Type<any>) {
    const ref = this.viewContainer.createComponent(component);
    
    // Subscribe to component outputs
    if (ref.instance.closed) {
      ref.instance.closed.subscribe(() => {
        this.removeComponent();
      });
    }
    
    this.componentRef = ref;
  }

  removeComponent() {
    this.componentRef?.destroy();
    this.componentRef = undefined;
  }
}
```

## 🎯 Common Use Cases

- **Modal/Dialog Systems** - Show different content types
- **Wizard/Stepper Forms** - Load steps dynamically
- **Plugin Architecture** - Load features on demand
- **Dashboard Widgets** - User-customizable layouts
- **Notification System** - Different notification types
- **Content Management** - Dynamic page builders
- **A/B Testing** - Load variants dynamically
- **Feature Flags** - Conditional component loading

## 🎓 Learning Checklist

- [ ] Understand ViewContainerRef and component creation
- [ ] Load components dynamically at runtime
- [ ] Pass data to dynamic components using setInput()
- [ ] Handle component lifecycle and cleanup
- [ ] Build reusable dynamic component systems
- [ ] Implement modal and tab systems
- [ ] Create dynamic forms
- [ ] Manage component references properly

## 🚀 Next Steps

1. **[Content Projection](/advanced/content-projection/)** - Create flexible component APIs
2. **[Advanced DI Patterns](/advanced/dependency-injection/)** - Master dependency injection
3. **[Custom Directives](/advanced/custom-directives/)** - Add behavior to elements

---

**Pro Tip**: Dynamic components are powerful but add complexity. Use them when you truly need runtime flexibility. For most cases, structural directives like `@if` and `@switch` are simpler and more performant! 🎯
