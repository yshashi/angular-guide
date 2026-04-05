---
title: Angular Elements 🧩
description: Create reusable web components with Angular Elements - framework-agnostic custom elements
sidebar:
  order: 6
---

Angular Elements allows you to package Angular components as **custom elements** (web components) that work in any HTML page, even outside Angular applications. Build once, use everywhere!

## 🎯 What are Angular Elements?

Angular Elements are **Angular components packaged as custom elements** - standard web components that work with any JavaScript framework or vanilla HTML.

**Key Features:**
- **🌐 Framework Agnostic** - Use in React, Vue, or vanilla JS
- **📦 Self-Contained** - All dependencies bundled
- **🔄 Reusable** - Share across projects
- **⚡ Lightweight** - Tree-shakeable bundles

**Use Cases:**
- Widget libraries for multiple frameworks
- Micro frontends architecture
- CMS content widgets
- Third-party embeddable components

## 🚀 Getting Started

### Installation

```bash
ng add @angular/elements
```

This installs:
- `@angular/elements` - Angular Elements package
- `document-register-element` - Polyfill for older browsers

### Basic Custom Element

```typescript
import { Component, input } from '@angular/core';
import { createCustomElement } from '@angular/elements';

@Component({
  selector: 'app-hello',
  template: `<h1>Hello, {{ name() }}!</h1>`
})
export class HelloComponent {
  name = input<string>('World');
}

// Register as custom element
const HelloElement = createCustomElement(HelloComponent, {
  injector: inject(Injector)
});

customElements.define('hello-widget', HelloElement);
```

**Usage in HTML:**

```html
<hello-widget name="Angular"></hello-widget>
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Angular Elements work with both standalone and module-based components.</p>
</blockquote>

### 1. **Counter Widget**

Let's create a reusable counter widget.

```typescript
import { Component, signal, Injector, inject } from '@angular/core';
import { createCustomElement } from '@angular/elements';

@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <button (click)="decrement()">-</button>
      <span>{{ count() }}</span>
      <button (click)="increment()">+</button>
    </div>
  `,
  styles: [`
    .counter {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    button {
      padding: 8px 16px;
      font-size: 18px;
      cursor: pointer;
    }
    span {
      font-size: 24px;
      min-width: 40px;
      text-align: center;
    }
  `]
})
export class CounterComponent {
  count = signal(0);
  
  increment() {
    this.count.update(c => c + 1);
  }
  
  decrement() {
    this.count.update(c => c - 1);
  }
}

// Register in main.ts or app config
export function registerCounterElement() {
  const injector = inject(Injector);
  const CounterElement = createCustomElement(CounterComponent, { injector });
  customElements.define('counter-widget', CounterElement);
}
```

**Usage:**

```html
<!DOCTYPE html>
<html>
<head>
  <script src="counter-widget.js"></script>
</head>
<body>
  <h1>My Page</h1>
  <counter-widget></counter-widget>
</body>
</html>
```

### 2. **User Card Widget**

Let's create a user card component with inputs and outputs.

```typescript
import { Component, input, output, Injector, inject } from '@angular/core';
import { createCustomElement } from '@angular/elements';

interface User {
  name: string;
  email: string;
  avatar: string;
}

@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <img [src]="user().avatar" [alt]="user().name">
      <div class="info">
        <h3>{{ user().name }}</h3>
        <p>{{ user().email }}</p>
        <button (click)="onContact()">Contact</button>
      </div>
    </div>
  `,
  styles: [`
    .user-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      max-width: 400px;
    }
    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }
    .info {
      flex: 1;
    }
    button {
      margin-top: 8px;
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class UserCardComponent {
  user = input.required<User>();
  contact = output<User>();
  
  onContact() {
    this.contact.emit(this.user());
  }
}

// Register element
export function registerUserCardElement() {
  const injector = inject(Injector);
  const UserCardElement = createCustomElement(UserCardComponent, { injector });
  customElements.define('user-card', UserCardElement);
}
```

**Usage:**

```html
<user-card id="userCard"></user-card>

<script>
  const userCard = document.getElementById('userCard');
  
  // Set input
  userCard.user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatar.jpg'
  };
  
  // Listen to output
  userCard.addEventListener('contact', (event) => {
    console.log('Contact user:', event.detail);
  });
</script>
```

### 3. **Chart Widget**

Let's create a chart widget that can be embedded anywhere.

```typescript
import { Component, input, effect, ElementRef, inject } from '@angular/core';
import { createCustomElement } from '@angular/elements';

@Component({
  selector: 'app-chart',
  template: `<canvas #canvas></canvas>`,
  styles: [`
    canvas {
      max-width: 100%;
      height: 300px;
    }
  `]
})
export class ChartComponent {
  private el = inject(ElementRef);
  
  data = input.required<number[]>();
  type = input<'bar' | 'line'>('bar');
  
  constructor() {
    effect(() => {
      this.renderChart();
    });
  }
  
  private renderChart() {
    const canvas = this.el.nativeElement.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    // Simple chart rendering (use Chart.js in production)
    const data = this.data();
    const max = Math.max(...data);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    data.forEach((value, index) => {
      const height = (value / max) * canvas.height;
      const x = (index * canvas.width) / data.length;
      const width = canvas.width / data.length - 10;
      
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(x, canvas.height - height, width, height);
    });
  }
}

// Register element
export function registerChartElement() {
  const injector = inject(Injector);
  const ChartElement = createCustomElement(ChartComponent, { injector });
  customElements.define('chart-widget', ChartElement);
}
```

**Usage:**

```html
<chart-widget id="chart" type="bar"></chart-widget>

<script>
  const chart = document.getElementById('chart');
  chart.data = [10, 20, 30, 25, 40];
</script>
```

## 🏗️ Building for Production

### Build Configuration

```typescript
// main.ts
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { CounterComponent } from './counter.component';

createApplication({
  providers: []
}).then(appRef => {
  const CounterElement = createCustomElement(CounterComponent, {
    injector: appRef.injector
  });
  
  customElements.define('counter-widget', CounterElement);
});
```

### Angular.json Configuration

```json
{
  "projects": {
    "elements": {
      "architect": {
        "build": {
          "options": {
            "outputHashing": "none",
            "scripts": [],
            "styles": []
          },
          "configurations": {
            "production": {
              "optimization": true,
              "buildOptimizer": true
            }
          }
        }
      }
    }
  }
}
```

### Bundle Single File

```bash
# Build the project
ng build --configuration production

# Concatenate files (using concat or similar tool)
cat dist/elements/runtime.js \
    dist/elements/polyfills.js \
    dist/elements/main.js > widget.js
```

## 🔧 Advanced Patterns

### Multiple Elements in One Package

```typescript
// elements.module.ts
import { Injector, inject } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CounterComponent } from './counter.component';
import { UserCardComponent } from './user-card.component';
import { ChartComponent } from './chart.component';

export function registerAllElements() {
  const injector = inject(Injector);
  
  const elements = [
    { component: CounterComponent, tag: 'counter-widget' },
    { component: UserCardComponent, tag: 'user-card' },
    { component: ChartComponent, tag: 'chart-widget' }
  ];
  
  elements.forEach(({ component, tag }) => {
    const element = createCustomElement(component, { injector });
    customElements.define(tag, element);
  });
}
```

### Lazy Loading Elements

```typescript
export async function loadCounterWidget() {
  const { CounterComponent } = await import('./counter.component');
  const injector = inject(Injector);
  
  const CounterElement = createCustomElement(CounterComponent, { injector });
  customElements.define('counter-widget', CounterElement);
}

// Usage
document.getElementById('loadBtn').addEventListener('click', () => {
  loadCounterWidget();
});
```

### Communication Between Elements

```typescript
// Event bus service
@Injectable({ providedIn: 'root' })
export class EventBusService {
  private events = new Subject<{ type: string; data: any }>();
  
  emit(type: string, data: any) {
    this.events.next({ type, data });
  }
  
  on(type: string) {
    return this.events.pipe(
      filter(event => event.type === type),
      map(event => event.data)
    );
  }
}

// Widget A
@Component({
  selector: 'app-sender',
})
export class SenderComponent {
  private eventBus = inject(EventBusService);
  
  sendMessage() {
    this.eventBus.emit('message', { text: 'Hello!' });
  }
}

// Widget B
@Component({
  selector: 'app-receiver',
})
export class ReceiverComponent {
  private eventBus = inject(EventBusService);
  
  constructor() {
    this.eventBus.on('message').subscribe(data => {
      console.log('Received:', data);
    });
  }
}
```

## ✅ Best Practices

### 1. **Keep Elements Self-Contained**

```typescript
// ✅ Good - All dependencies included
@Component({
  selector: 'app-widget',
  imports: [CommonModule, FormsModule],
  template: `...`
})
export class WidgetComponent {}
```

### 2. **Use Attribute Inputs for Primitives**

```typescript
// ✅ Good - Simple attributes
<my-widget count="5" title="Hello"></my-widget>

// For complex objects, use properties
const widget = document.querySelector('my-widget');
widget.data = { complex: 'object' };
```

### 3. **Emit Custom Events**

```typescript
// ✅ Good - Use CustomEvent
this.clicked.emit(data);

// Translates to:
element.dispatchEvent(new CustomEvent('clicked', { detail: data }));
```

### 4. **Handle Styles Properly**

```typescript
// ✅ Good - Encapsulated styles
@Component({
  selector: 'app-widget',
  styles: [`
    :host {
      display: block;
      /* Styles scoped to element */
    }
  `]
})
```

### 5. **Provide Fallback Content**

```html
<!-- ✅ Good - Fallback for unsupported browsers -->
<my-widget>
  <p>Your browser doesn't support custom elements.</p>
</my-widget>
```

## 🎯 Common Use Cases

- **Widget Libraries** - Reusable UI components
- **Micro Frontends** - Independent deployable modules
- **CMS Integration** - Embeddable content widgets
- **Third-Party Widgets** - Analytics, chat, forms
- **Cross-Framework Components** - Use in React/Vue apps
- **Legacy App Migration** - Gradual Angular adoption
- **Marketing Widgets** - Embeddable promotional content

## 🎓 Learning Checklist

- [ ] Understand Angular Elements and web components
- [ ] Create custom elements from Angular components
- [ ] Handle inputs and outputs in custom elements
- [ ] Build and bundle elements for production
- [ ] Register multiple elements in one package
- [ ] Implement lazy loading for elements
- [ ] Handle cross-element communication
- [ ] Deploy elements to CDN or npm

## 🚀 Next Steps

1. **[Micro Frontends](/advanced/micro-frontends/)** - Build micro frontend architectures
2. **[Performance Optimization](/advanced/performance/)** - Optimize your applications
3. **[Bundle Optimization](/advanced/bundle-optimization/)** - Reduce bundle sizes

---

**Pro Tip**: Angular Elements are perfect for creating framework-agnostic widgets! Use them to build reusable components that work anywhere. Keep elements self-contained and well-documented for maximum reusability! 🧩
