---
title: Advanced Components 🧩
description: Master advanced Angular component patterns and techniques
sidebar:
  order: 1
---

Advanced components unlock powerful patterns for building scalable, reusable, and maintainable Angular applications. Master content projection, dynamic components, and advanced patterns.

## 🎯 What You'll Learn

- **Content Projection** - Single and multi-slot projection
- **Dynamic Components** - Runtime component creation
- **Component Inheritance** - Extending component functionality
- **View Encapsulation** - Styling strategies
- **Change Detection** - Performance optimization
- **Advanced Patterns** - HOCs, mixins, and composition

## 🔄 Content Projection

### Single-Slot Projection
```typescript
// card.component.ts
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div>
        <h3>{{title()}}</h3>
      </div>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  title = input('');
}

// Usage
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card title="User Profile">
      <p>This content is projected into the card body.</p>
      <button>Edit Profile</button>
    </app-card>
  `
})
export class ParentComponent { }
```

### Multi-Slot Projection
```typescript
// modal.component.ts
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div (click)="close()">
      <div (click)="$event.stopPropagation()">
        <div>
          <ng-content select="[slot=header]"></ng-content>
          <button (click)="close()">×</button>
        </div>
        
        <div>
          <ng-content select="[slot=body]"></ng-content>
        </div>
        
        <div>
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  closeModal = output<void>();

  close() {
    this.closeModal.emit();
  }
}

// Usage
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showModal()) {
      <app-modal (closeModal)="showModal.set(false)">
        <h2 slot="header">Confirm Action</h2>
        
        <div slot="body">
          <p>Are you sure you want to delete this item?</p>
          <p>This action cannot be undone.</p>
        </div>
        
        <div slot="footer">
          <button (click)="showModal.set(false)">Cancel</button>
          <button (click)="confirmDelete()">Delete</button>
        </div>
      </app-modal>
    }
  `
})
export class ParentComponent {
  showModal = signal(false);

  confirmDelete() {
    // Delete logic
    this.showModal.set(false);
  }
}
```

## 🚀 Dynamic Components

### Modern Dynamic Components
```typescript
// dynamic-host.directive.ts
@Directive({
  selector: '[appDynamicHost]'
})
export class DynamicHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}

// dynamic-component-loader.service.ts
@Injectable({
  providedIn: 'root'
})
export class DynamicComponentLoaderService {
  private componentRegistry = signal(new Map<string, Type<any>>());

  registerComponent(name: string, component: Type<any>) {
    this.componentRegistry.update(registry => {
      const newRegistry = new Map(registry);
      newRegistry.set(name, component);
      return newRegistry;
    });
  }

  createComponent(name: string, viewContainerRef: ViewContainerRef, data?: any) {
    const componentType = this.componentRegistry().get(name);
    if (!componentType) {
      throw new Error(`Component ${name} not found`);
    }

    const componentRef = viewContainerRef.createComponent(componentType);
    
    if (data && componentRef.instance) {
      Object.assign(componentRef.instance, data);
    }

    return componentRef;
  }
}

// Dynamic components
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'alert-' + type()">
      <strong>{{title()}}</strong>
      <p>{{message()}}</p>
    </div>
  `
})
export class AlertComponent {
  type = input<'success' | 'error' | 'warning'>('success');
  title = input('');
  message = input('');
}

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>{{title()}}</h3>
      <div>
        Chart data: {{data() | json}}
      </div>
    </div>
  `
})
export class ChartComponent {
  title = input('');
  data = input<any[]>([]);
}

// Main component
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicHostDirective],
  template: `
    <div>
      <h2>Dynamic Dashboard</h2>
      
      <div>
        <button (click)="addAlert()">Add Alert</button>
        <button (click)="addChart()">Add Chart</button>
        <button (click)="clearAll()">Clear All</button>
      </div>
      
      <div>
        <ng-template appDynamicHost></ng-template>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(DynamicHostDirective, {static: true}) 
  dynamicHost!: DynamicHostDirective;

  private loader = inject(DynamicComponentLoaderService);

  ngOnInit() {
    // Register components
    this.loader.registerComponent('alert', AlertComponent);
    this.loader.registerComponent('chart', ChartComponent);
  }

  ngAfterViewInit() {
    // Initial content
    this.addAlert();
  }

  addAlert() {
    const data = {
      type: Math.random() > 0.5 ? 'success' : 'warning',
      title: 'Dynamic Alert',
      message: `Alert created at ${new Date().toLocaleTimeString()}`
    };

    this.loader.createComponent('alert', this.dynamicHost.viewContainerRef, data);
  }

  addChart() {
    const data = {
      title: 'Sales Chart',
      data: [
        { month: 'Jan', sales: 100 },
        { month: 'Feb', sales: 150 },
        { month: 'Mar', sales: 120 }
      ]
    };

    this.loader.createComponent('chart', this.dynamicHost.viewContainerRef, data);
  }

  clearAll() {
    this.dynamicHost.viewContainerRef.clear();
  }
}
```

## 🧬 Component Inheritance

### Modern Base Component Pattern
```typescript
// base-form.component.ts
export abstract class BaseFormComponent {
  disabled = input(false);
  loading = input(false);
  formSubmit = output<any>();
  formCancel = output<void>();

  protected formGroup!: FormGroup;
  protected fb = inject(FormBuilder);

  abstract buildForm(): void;
  abstract onSubmit(): void;

  ngOnInit() {
    this.buildForm();
  }

  handleSubmit() {
    if (this.formGroup.valid && !this.loading) {
      this.onSubmit();
    }
  }

  handleCancel() {
    this.formCancel.emit();
  }

  markAllAsTouched() {
    this.formGroup.markAllAsTouched();
  }

  resetForm() {
    this.formGroup.reset();
  }
}

// user-form.component.ts
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="handleSubmit()">
      <div class="form-group">
        <label for="name">Name:</label>
        <input 
          id="name" 
          type="text" 
          formControlName="name"
          [disabled]="disabled">
        @if (formGroup.get('name')?.invalid && formGroup.get('name')?.touched) {
          <div class="error">Name is required</div>
        }
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          id="email" 
          type="email" 
          formControlName="email"
          [disabled]="disabled">
        @if (formGroup.get('email')?.invalid && formGroup.get('email')?.touched) {
          <div class="error">Valid email is required</div>
        }
      </div>

      <div class="form-actions">
        <button type="button" (click)="handleCancel()">Cancel</button>
        <button 
          type="submit" 
          [disabled]="formGroup.invalid || loading">
          {{loading ? 'Saving...' : 'Save'}}
        </button>
      </div>
    </form>
  `
})
export class UserFormComponent extends BaseFormComponent {
  @Input() initialData?: any;

  buildForm() {
    this.formGroup = this.fb.group({
      name: [this.initialData?.name || '', Validators.required],
      email: [this.initialData?.email || '', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    const formData = this.formGroup.value;
    this.formSubmit.emit(formData);
  }
}
```

## 🎨 View Encapsulation

### Encapsulation Strategies
```typescript
// Default: ViewEncapsulation.Emulated
@Component({
  selector: 'app-emulated',
  template: `<div class="container">Emulated Encapsulation</div>`,
  styles: [`
    .container {
      background: lightblue;
      padding: 20px;
    }
  `],
  encapsulation: ViewEncapsulation.Emulated // Default
})
export class EmulatedComponent { }

// ViewEncapsulation.None - Global styles
@Component({
  selector: 'app-none',
  template: `<div class="global-container">No Encapsulation</div>`,
  styles: [`
    .global-container {
      background: lightcoral;
      padding: 20px;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class NoneComponent { }

// ViewEncapsulation.ShadowDom - True Shadow DOM
@Component({
  selector: 'app-shadow',
  template: `<div class="shadow-container">Shadow DOM</div>`,
  styles: [`
    .shadow-container {
      background: lightgreen;
      padding: 20px;
    }
  `],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class ShadowComponent { }
```

## ⚡ Change Detection Optimization

### OnPush Strategy
```typescript
// Optimized component with OnPush
@Component({
  selector: 'app-optimized-list',
  imports: [CommonModule],
  template: `
    <div class="list-container">
      <h3>{{title}} ({{items.length}} items)</h3>
      <div class="last-updated">Last updated: {{lastUpdated | date:'medium'}}</div>
      
      @for (item of items; track item.id) {
        <div class="list-item" [class.selected]="item.id === selectedId">
          <span>{{item.name}}</span>
          <button (click)="selectItem(item.id)">Select</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-container {
      border: 1px solid #ddd;
      padding: 16px;
      border-radius: 4px;
    }
    
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    
    .list-item.selected {
      background: #e3f2fd;
    }
    
    .last-updated {
      font-size: 12px;
      color: #666;
      margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedListComponent {
  @Input() title = '';
  @Input() items: any[] = [];
  @Input() selectedId?: number;
  @Output() itemSelected = new EventEmitter<number>();

  lastUpdated = new Date();

  selectItem(id: number) {
    this.itemSelected.emit(id);
  }
}
```

## ✅ Best Practices

### 1. **Use Content Projection Wisely**
```typescript
// ✅ Good - Flexible and reusable
@Component({
  template: `
    <div class="card">
      <ng-content select="[slot=header]"></ng-content>
      <ng-content></ng-content>
      <ng-content select="[slot=footer]"></ng-content>
    </div>
  `
})

// ❌ Avoid - Too many specific inputs
@Component({
  template: `
    <div class="card">
      <div>{{headerText}}</div>
      <div>{{bodyText}}</div>
      <div>{{footerText}}</div>
    </div>
  `
})
```

### 2. **Optimize Change Detection**
```typescript
// ✅ Use OnPush for performance
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ Use immutable updates
addItem(item: Item) {
  this.items = [...this.items, item];
}

// ❌ Avoid mutable updates with OnPush
addItem(item: Item) {
  this.items.push(item); // Won't trigger change detection
}
```

## 🎯 Quick Checklist

- [ ] Use content projection for flexible components
- [ ] Implement multi-slot projection when needed
- [ ] Create dynamic components for runtime flexibility
- [ ] Use component inheritance for shared functionality
- [ ] Choose appropriate view encapsulation strategy
- [ ] Optimize with OnPush change detection
- [ ] Implement immutable update patterns
- [ ] Clean up dynamic components properly
- [ ] Test component interactions thoroughly

## 🚀 Next Steps

1. **[Component Communication](/intermediate/component-communication/)** - Master component interaction patterns
2. **[Lifecycle Hooks](/intermediate/lifecycle-hooks/)** - Understand component lifecycle
3. **[Reactive Forms](/intermediate/reactive-forms/)** - Build complex forms

---

**Remember**: Advanced component patterns provide powerful tools, but use them thoughtfully. Focus on reusability, performance, and maintainability! 🧩
