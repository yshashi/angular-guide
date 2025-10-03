---
title: Content Projection 📤
description: Master Angular content projection patterns - single slot, multi-slot, and conditional projection
sidebar:
  order: 3
---

Content projection (also known as transclusion) allows you to create flexible, reusable components by passing content from parent to child components. It's like creating slots where parent components can inject their own content.

## 🎯 What is Content Projection?

Content projection lets you **insert content from a parent component into a child component's template**. Think of it as creating customizable "slots" in your components.

**Benefits:**
- **🔄 Reusability** - Create flexible component templates
- **🎨 Customization** - Let parents control child content
- **📦 Composition** - Build complex UIs from simple parts
- **🧩 Flexibility** - Support multiple content variations

## 🚀 Basic Content Projection

### Single-Slot Projection

```typescript
// Card component that accepts any content
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {}
```

**Usage:**

```html
<app-card>
  <h2>Card Title</h2>
  <p>This content is projected into the card!</p>
</app-card>
```

### With Default Content

```typescript
@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <div class="panel">
      <ng-content>
        <p>Default content when nothing is projected</p>
      </ng-content>
    </div>
  `
})
export class PanelComponent {}
```

## 🎨 Multi-Slot Projection

Use `select` attribute to project content into specific slots.

### Named Slots Example

```typescript
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select="[card-header]"></ng-content>
      </div>
      
      <div class="card-body">
        <ng-content select="[card-body]"></ng-content>
      </div>
      
      <div class="card-footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {}
```

**Usage:**

```html
<app-card>
  <div card-header>
    <h3>Card Title</h3>
  </div>
  
  <div card-body>
    <p>Main content goes here</p>
  </div>
  
  <div card-footer>
    <button>Action</button>
  </div>
</app-card>
```

### Using CSS Selectors

```typescript
@Component({
  selector: 'app-layout',
  standalone: true,
  template: `
    <header>
      <ng-content select="header"></ng-content>
    </header>
    
    <main>
      <ng-content select=".main-content"></ng-content>
    </main>
    
    <aside>
      <ng-content select="#sidebar"></ng-content>
    </aside>
    
    <footer>
      <ng-content select="footer"></ng-content>
    </footer>
  `
})
export class LayoutComponent {}
```

**Usage:**

```html
<app-layout>
  <header>
    <h1>My App</h1>
  </header>
  
  <div class="main-content">
    <p>Main content area</p>
  </div>
  
  <div id="sidebar">
    <nav>Navigation</nav>
  </div>
  
  <footer>
    <p>&copy; 2024</p>
  </footer>
</app-layout>
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> For Angular versions 19 and above, you can remove the <code>standalone: true</code> property from your components.</p>
</blockquote>

### 1. **Reusable Dialog Component**

Let's build a flexible dialog component with header, body, and footer slots.

```typescript
@Component({
  selector: 'app-dialog',
  standalone: true,
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <ng-content select="[dialog-header]"></ng-content>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>
        
        <div class="dialog-body">
          <ng-content select="[dialog-body]"></ng-content>
        </div>
        
        <div class="dialog-footer">
          <ng-content select="[dialog-footer]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class DialogComponent {
  close = output<void>();
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [DialogComponent],
  template: `
    @if (showDialog()) {
      <app-dialog (close)="showDialog.set(false)">
        <div dialog-header>
          <h2>User Profile</h2>
        </div>
        
        <div dialog-body>
          <p>Name: {{ user().name }}</p>
          <p>Email: {{ user().email }}</p>
        </div>
        
        <div dialog-footer>
          <button (click)="save()">Save</button>
          <button (click)="showDialog.set(false)">Cancel</button>
        </div>
      </app-dialog>
    }
  `
})
export class UserProfileComponent {
  showDialog = signal(false);
  user = signal({ name: 'John Doe', email: 'john@example.com' });
  
  save() {
    console.log('Saving user...');
    this.showDialog.set(false);
  }
}
```

### 2. **Accordion Component**

Let's create an accordion with flexible content projection.

```typescript
// Accordion Item Component
@Component({
  selector: 'app-accordion-item',
  standalone: true,
  template: `
    <div class="accordion-item">
      <button 
        class="accordion-header" 
        (click)="toggle()"
        [class.active]="isOpen()">
        <ng-content select="[accordion-title]"></ng-content>
        <span class="icon">{{ isOpen() ? '−' : '+' }}</span>
      </button>
      
      @if (isOpen()) {
        <div class="accordion-content">
          <ng-content select="[accordion-content]"></ng-content>
        </div>
      }
    </div>
  `
})
export class AccordionItemComponent {
  isOpen = signal(false);
  
  toggle() {
    this.isOpen.update(v => !v);
  }
}

// Accordion Container
@Component({
  selector: 'app-accordion',
  standalone: true,
  template: `
    <div class="accordion">
      <ng-content></ng-content>
    </div>
  `
})
export class AccordionComponent {}
```

**Usage:**

```html
<app-accordion>
  <app-accordion-item>
    <h3 accordion-title>What is Angular?</h3>
    <div accordion-content>
      <p>Angular is a platform for building web applications.</p>
    </div>
  </app-accordion-item>
  
  <app-accordion-item>
    <h3 accordion-title>What are Signals?</h3>
    <div accordion-content>
      <p>Signals are Angular's new reactivity primitive.</p>
    </div>
  </app-accordion-item>
</app-accordion>
```

### 3. **Tab Component with Projection**

Let's build a tab system using content projection.

```typescript
// Tab Component
@Component({
  selector: 'app-tab',
  standalone: true,
  template: `
    @if (active()) {
      <div class="tab-panel">
        <ng-content></ng-content>
      </div>
    }
  `
})
export class TabComponent {
  label = input.required<string>();
  active = input<boolean>(false);
}

// Tabs Container
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TabComponent],
  template: `
    <div class="tabs">
      <div class="tab-headers">
        @for (tab of tabs(); track $index) {
          <button 
            class="tab-header"
            [class.active]="activeIndex() === $index"
            (click)="selectTab($index)">
            {{ tab.label() }}
          </button>
        }
      </div>
      
      <div class="tab-content">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class TabsComponent {
  @ContentChildren(TabComponent) tabs = contentChildren<TabComponent>();
  activeIndex = signal(0);
  
  selectTab(index: number) {
    this.activeIndex.set(index);
    
    // Update active state of tabs
    this.tabs().forEach((tab, i) => {
      tab.active.set(i === index);
    });
  }
}
```

**Usage:**

```html
<app-tabs>
  <app-tab label="Profile">
    <h3>Profile Information</h3>
    <p>User profile content here</p>
  </app-tab>
  
  <app-tab label="Settings">
    <h3>Settings</h3>
    <p>Settings content here</p>
  </app-tab>
  
  <app-tab label="Activity">
    <h3>Recent Activity</h3>
    <p>Activity feed here</p>
  </app-tab>
</app-tabs>
```

### 4. **Alert Component with Icon Slot**

Let's create an alert component with customizable icon and content.

```typescript
@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <div class="alert" [class]="'alert-' + type()">
      <div class="alert-icon">
        <ng-content select="[alert-icon]"></ng-content>
      </div>
      
      <div class="alert-content">
        <ng-content></ng-content>
      </div>
      
      @if (dismissible()) {
        <button class="alert-close" (click)="dismiss.emit()">
          &times;
        </button>
      }
    </div>
  `
})
export class AlertComponent {
  type = input<'success' | 'warning' | 'error' | 'info'>('info');
  dismissible = input<boolean>(false);
  dismiss = output<void>();
}
```

**Usage:**

```html
<app-alert type="success" [dismissible]="true">
  <svg alert-icon><!-- Success icon --></svg>
  <strong>Success!</strong> Your changes have been saved.
</app-alert>

<app-alert type="error">
  <svg alert-icon><!-- Error icon --></svg>
  <strong>Error!</strong> Something went wrong.
</app-alert>
```

### 5. **List Component with Custom Item Template**

Let's create a list component that accepts custom item templates.

```typescript
@Component({
  selector: 'app-list',
  standalone: true,
  template: `
    <ul class="list">
      @for (item of items(); track trackBy($index, item)) {
        <li class="list-item">
          <ng-content></ng-content>
        </li>
      }
    </ul>
  `
})
export class ListComponent<T> {
  items = input.required<T[]>();
  trackBy = input<(index: number, item: T) => any>((i, item) => i);
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ListComponent],
  template: `
    <app-list [items]="users()">
      @for (user of users(); track user.id) {
        <div class="user-item">
          <img [src]="user.avatar" [alt]="user.name">
          <div>
            <h4>{{ user.name }}</h4>
            <p>{{ user.email }}</p>
          </div>
        </div>
      }
    </app-list>
  `
})
export class UserListComponent {
  users = signal([
    { id: 1, name: 'John', email: 'john@example.com', avatar: '/avatar1.jpg' },
    { id: 2, name: 'Jane', email: 'jane@example.com', avatar: '/avatar2.jpg' }
  ]);
}
```

## 🔍 Advanced Patterns

### Conditional Projection

Check if content was projected using `@ContentChild`:

```typescript
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      @if (hasHeader()) {
        <div class="card-header">
          <ng-content select="[card-header]"></ng-content>
        </div>
      }
      
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  @ContentChild('[card-header]') headerContent?: ElementRef;
  
  hasHeader = computed(() => !!this.headerContent);
}
```

### NgTemplateOutlet for Dynamic Content

```typescript
@Component({
  selector: 'app-container',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="container">
      <ng-container *ngTemplateOutlet="template(); context: { $implicit: data() }">
      </ng-container>
    </div>
  `
})
export class ContainerComponent {
  template = input.required<TemplateRef<any>>();
  data = input<any>();
}
```

**Usage:**

```html
<app-container [template]="customTemplate" [data]="userData">
</app-container>

<ng-template #customTemplate let-user>
  <div>
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>
</ng-template>
```

## ✅ Best Practices

### 1. **Use Semantic Selectors**

```typescript
// ✅ Good - Clear, semantic selectors
<ng-content select="[card-header]"></ng-content>
<ng-content select="[card-body]"></ng-content>
<ng-content select="[card-footer]"></ng-content>

// ❌ Avoid - Generic selectors
<ng-content select=".slot1"></ng-content>
<ng-content select=".slot2"></ng-content>
```

### 2. **Provide Default Content**

```typescript
// ✅ Good - Default content for empty slots
<ng-content select="[header]">
  <h2>Default Header</h2>
</ng-content>

// ❌ Avoid - Empty slots without defaults
<ng-content select="[header]"></ng-content>
```

### 3. **Document Projection Slots**

```typescript
/**
 * Card component with content projection
 * 
 * @slot [card-header] - Header content
 * @slot [card-body] - Main content (default slot)
 * @slot [card-footer] - Footer actions
 */
@Component({
  selector: 'app-card',
  standalone: true,
  template: `...`
})
export class CardComponent {}
```

### 4. **Use ContentChild/ContentChildren**

```typescript
// ✅ Good - Access projected content
@Component({
  selector: 'app-tabs',
  standalone: true
})
export class TabsComponent {
  tabs = contentChildren(TabComponent);
  
  ngAfterContentInit() {
    // Work with projected tabs
    this.tabs()[0]?.activate();
  }
}
```

### 5. **Handle Missing Content**

```typescript
// ✅ Good - Check for projected content
@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    @if (hasContent()) {
      <div class="panel">
        <ng-content></ng-content>
      </div>
    } @else {
      <div class="empty-state">
        No content provided
      </div>
    }
  `
})
export class PanelComponent {
  @ContentChild(TemplateRef) content?: TemplateRef<any>;
  
  hasContent = computed(() => !!this.content);
}
```

## 🎯 Common Use Cases

- **Layout Components** - Headers, footers, sidebars
- **Card/Panel Components** - Flexible content containers
- **Dialog/Modal Components** - Customizable dialogs
- **Tab/Accordion Components** - Dynamic content sections
- **List Components** - Custom item templates
- **Form Components** - Custom form layouts
- **Alert/Notification Components** - Flexible messaging
- **Wrapper Components** - Add behavior to projected content

## 🎓 Learning Checklist

- [ ] Understand single-slot projection with `<ng-content>`
- [ ] Use multi-slot projection with `select` attribute
- [ ] Project content using CSS selectors
- [ ] Access projected content with `@ContentChild`
- [ ] Work with multiple projections using `@ContentChildren`
- [ ] Provide default content for empty slots
- [ ] Use `NgTemplateOutlet` for dynamic templates
- [ ] Handle conditional projection

## 🚀 Next Steps

1. **[Advanced DI Patterns](/advanced/dependency-injection/)** - Master dependency injection
2. **[Dynamic Components](/advanced/dynamic-components/)** - Load components dynamically
3. **[Custom Directives](/advanced/custom-directives/)** - Add behavior to elements

---

**Pro Tip**: Content projection is perfect for creating reusable UI components! Use it to build flexible layouts, dialogs, cards, and any component that needs customizable content. Keep projection slots well-documented and provide sensible defaults! 📤
