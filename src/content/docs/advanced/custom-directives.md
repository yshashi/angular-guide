---
title: Custom Directives 🎯
description: Create powerful custom directives in Angular - attribute, structural, and host directives
sidebar:
  order: 1
---

Directives are classes that add behavior to elements in your Angular applications. While Angular provides built-in directives, custom directives let you create reusable behaviors tailored to your needs.

## 🎯 Types of Directives

### 1. **Attribute Directives**

Change the appearance or behavior of an element, component, or another directive.

### 2. **Structural Directives**

Change the DOM layout by adding or removing elements (less common with modern `@if`, `@for`).

### 3. **Host Directives**

Compose directives together for powerful reusability.

## 🚀 Attribute Directives

### Basic Highlight Directive

```typescript
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  private el = inject(ElementRef);

  constructor() {
    this.el.nativeElement.style.backgroundColor = 'yellow';
  }
}
```

**Usage:**

```html
<p appHighlight>This text will be highlighted!</p>
```

### Interactive Highlight with Input

```typescript
import { Directive, ElementRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  private el = inject(ElementRef);
  
  // Modern input signal
  appHighlight = input<string>('yellow');
  
  constructor() {
    effect(() => {
      this.el.nativeElement.style.backgroundColor = this.appHighlight();
    });
  }
}
```

**Usage:**

```html
<p appHighlight="lightblue">Custom color highlight</p>
<p [appHighlight]="dynamicColor">Dynamic color</p>
```

### Advanced: Hover Highlight

```typescript
import { Directive, ElementRef, input, inject } from '@angular/core';

@Directive({
  selector: '[appHoverHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()'
  }
})
export class HoverHighlightDirective {
  private el = inject(ElementRef);
  
  highlightColor = input<string>('yellow');
  defaultColor = input<string>('transparent');

  constructor() {
    this.el.nativeElement.style.backgroundColor = this.defaultColor();
  }

  onMouseEnter() {
    this.el.nativeElement.style.backgroundColor = this.highlightColor();
  }

  onMouseLeave() {
    this.el.nativeElement.style.backgroundColor = this.defaultColor();
  }
}
```

**Usage:**

```html
<div appHoverHighlight [highlightColor]="'lightgreen'">
  Hover over me!
</div>
```

## 🎨 Real-World Examples



### 1. **Click Outside Directive**

```typescript
import { Directive, ElementRef, output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class ClickOutsideDirective {
  private el = inject(ElementRef);
  clickOutside = output<void>();

  onClick(event: MouseEvent) {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
```

**Usage:**

```typescript
@Component({
  selector: 'app-dropdown',
  imports: [ClickOutsideDirective],
  template: `
    <div class="dropdown" appClickOutside (clickOutside)="close()">
      <button (click)="toggle()">Menu</button>
      @if (isOpen()) {
        <div class="dropdown-menu">
          <a href="#">Item 1</a>
          <a href="#">Item 2</a>
        </div>
      }
    </div>
  `
})
export class DropdownComponent {
  isOpen = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
  }

  close() {
    this.isOpen.set(false);
  }
}
```

### 2. **Auto Focus Directive**

```typescript
import { Directive, ElementRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocusDirective {
  private el = inject(ElementRef);
  
  appAutoFocus = input<boolean>(true);
  delay = input<number>(0);

  constructor() {
    effect(() => {
      if (this.appAutoFocus()) {
        setTimeout(() => {
          this.el.nativeElement.focus();
        }, this.delay());
      }
    });
  }
}
```

**Usage:**

```html
<input appAutoFocus [delay]="300" placeholder="Auto-focused after 300ms">
```

### 3. **Tooltip Directive**

```typescript
import { Directive, ElementRef, input, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()'
  }
})
export class TooltipDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  
  appTooltip = input.required<string>();
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  
  private tooltipElement?: HTMLElement;

  show() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.position()}`);
    
    const text = this.renderer.createText(this.appTooltip());
    this.renderer.appendChild(this.tooltipElement, text);
    this.renderer.appendChild(document.body, this.tooltipElement);
    
    this.positionTooltip();
  }

  hide() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }

  private positionTooltip() {
    if (!this.tooltipElement) return;
    
    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltipElement.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    switch (this.position()) {
      case 'top':
        top = hostPos.top - tooltipPos.height - 8;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'bottom':
        top = hostPos.bottom + 8;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - 8;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + 8;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }
}
```

**CSS:**

```css
.tooltip {
  position: fixed;
  background: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 9999;
  pointer-events: none;
}
```

**Usage:**

```html
<button appTooltip="Click to save" [position]="'top'">
  Save
</button>
```

### 4. **Lazy Load Image Directive**

```typescript
import { Directive, ElementRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
})
export class LazyLoadDirective {
  private el = inject(ElementRef);
  
  appLazyLoad = input.required<string>();
  placeholder = input<string>('data:image/svg+xml,...'); // Base64 placeholder
  
  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      this.setupObserver();
    });
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.observer?.disconnect();
        }
      });
    });

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage() {
    const img = this.el.nativeElement as HTMLImageElement;
    img.src = this.appLazyLoad();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
```

**Usage:**

```html
<img appLazyLoad="/assets/large-image.jpg" 
     [placeholder]="'data:image/svg+xml;base64,...'"
     alt="Lazy loaded image">
```

### 5. **Permission Directive**

```typescript
import { Directive, TemplateRef, ViewContainerRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  
  appHasPermission = input.required<string | string[]>();

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView() {
    const permissions = Array.isArray(this.appHasPermission()) 
      ? this.appHasPermission() as string[]
      : [this.appHasPermission() as string];
    
    const hasPermission = permissions.some(p => 
      this.authService.hasPermission(p)
    );

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

**Usage:**

```html
<button *appHasPermission="'admin'">Admin Only</button>
<div *appHasPermission="['editor', 'admin']">Editor or Admin</div>
```

### 6. **Debounce Click Directive**

```typescript
import { Directive, output, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[appDebounceClick]',
  host: {
    '(click)': 'onClick()'
  }
})
export class DebounceClickDirective {
  debounceClick = output<void>();
  private clicks = new Subject<void>();

  constructor() {
    this.clicks
      .pipe(debounceTime(300))
      .subscribe(() => this.debounceClick.emit());
  }

  onClick() {
    this.clicks.next();
  }

  ngOnDestroy() {
    this.clicks.complete();
  }
}
```

**Usage:**

```html
<button appDebounceClick (debounceClick)="save()">
  Save (debounced)
</button>
```

## 🏗️ Structural Directives

### Custom Unless Directive

```typescript
import { Directive, TemplateRef, ViewContainerRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appUnless]',
})
export class UnlessDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  
  appUnless = input.required<boolean>();

  constructor() {
    effect(() => {
      if (!this.appUnless()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
```

**Usage:**

```html
<div *appUnless="isHidden">
  This shows when isHidden is false
</div>
```

### Repeat Directive

```typescript
import { Directive, TemplateRef, ViewContainerRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appRepeat]',
})
export class RepeatDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  
  appRepeat = input.required<number>();

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      const count = this.appRepeat();
      
      for (let i = 0; i < count; i++) {
        this.viewContainer.createEmbeddedView(this.templateRef, {
          $implicit: i,
          index: i
        });
      }
    });
  }
}
```

**Usage:**

```html
<div *appRepeat="5; let i = index">
  Item {{ i }}
</div>
```

## 🎯 Host Directives

Compose multiple directives together for powerful reusability.

```typescript
// Base tooltip directive
@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective {
  tooltip = input<string>('');
  // ... tooltip implementation
}

// Highlight directive
@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  color = input<string>('yellow');
  // ... highlight implementation
}

// Component using host directives
@Component({
  selector: 'app-fancy-button',
  hostDirectives: [
    {
      directive: TooltipDirective,
      inputs: ['tooltip']
    },
    {
      directive: HighlightDirective,
      inputs: ['color: highlightColor']
    }
  ],
  template: `<button><ng-content /></button>`
})
export class FancyButtonComponent {}
```

**Usage:**

```html
<app-fancy-button 
  tooltip="Click me!" 
  highlightColor="lightblue">
  Fancy Button
</app-fancy-button>
```

## ✅ Best Practices

### 1. **Use Signals for Inputs**

```typescript
// ✅ Good - Modern signals
@Directive({
  selector: '[appDirective]',
})
export class MyDirective {
  value = input<string>('');
  config = input<Config>({ /* defaults */ });
}

:::caution[Legacy Syntax]
In older Angular versions, inputs used decorators:
```ts
@Input() value = '';
@Input() config: Config = { /* defaults */ };
```
This syntax is still supported but not recommended for new projects.
:::
```

### 2. **Use Host Object for Events**

```typescript
// ✅ Good - Host object
@Directive({
  selector: '[appDirective]',
  host: {
    '(click)': 'onClick($event)',
    '(mouseenter)': 'onMouseEnter()',
    '[class.active]': 'isActive()'
  }
})
export class MyDirective {
  isActive = signal(false);
  
  onClick(event: MouseEvent) { }
  onMouseEnter() { }
}

:::caution[Legacy Syntax]
In older Angular versions, host bindings used decorators:
```ts
@HostBinding('class.active') isActive = false;
@HostListener('click', ['$event']) onClick(e: MouseEvent) { }
```
This syntax is still supported but not recommended for new projects.
:::
```

### 3. **Use inject() Function**

```typescript
// ✅ Good - inject() function
@Directive({
  selector: '[appDirective]',
})
export class MyDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private service = inject(MyService);
}

:::caution[Legacy Syntax]
In older Angular versions, dependencies were injected via the constructor:
```ts
constructor(
  private el: ElementRef,
  private renderer: Renderer2,
  private service: MyService
) {}
```
This syntax is still supported but not recommended for new projects.
:::
```

### 4. **Clean Up Resources**

```typescript
@Directive({
  selector: '[appDirective]',
})
export class MyDirective {
  private subscription?: Subscription;
  private observer?: IntersectionObserver;

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.observer?.disconnect();
  }
}
```

### 5. **Use Descriptive Selectors**

```typescript
// ✅ Good - Clear, prefixed selectors
@Directive({ selector: '[appHighlight]' })
@Directive({ selector: '[appClickOutside]' })
@Directive({ selector: '[appLazyLoad]' })

// ❌ Avoid - Generic or unprefixed
@Directive({ selector: '[highlight]' })
@Directive({ selector: '[outside]' })
@Directive({ selector: '[lazy]' })
```

## 🎯 Common Use Cases

### Form Validation Directive

```typescript
import { Directive, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appMinValue]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: MinValueDirective,
    multi: true
  }]
})
export class MinValueDirective implements Validator {
  appMinValue = input.required<number>();

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return value < this.appMinValue() 
      ? { minValue: { min: this.appMinValue(), actual: value } }
      : null;
  }
}
```

**Usage:**

```html
<input type="number" [appMinValue]="18" [(ngModel)]="age">
```

## 🎓 Learning Checklist

- [ ] Understand the three types of directives
- [ ] Create attribute directives with signals
- [ ] Use host object for event binding
- [ ] Implement structural directives
- [ ] Compose directives with host directives
- [ ] Handle cleanup in ngOnDestroy
- [ ] Use inject() for dependency injection
- [ ] Follow naming conventions with prefixes

## 🚀 Next Steps

1. **[Dynamic Components](/advanced/dynamic-components/)** - Load components dynamically
2. **[Content Projection](/advanced/content-projection/)** - Create flexible component APIs
3. **[Advanced DI Patterns](/advanced/dependency-injection/)** - Master dependency injection

---

**Pro Tip**: Directives are perfect for cross-cutting concerns like logging, analytics, accessibility features, and DOM manipulation. Keep them focused on a single responsibility for maximum reusability! 🎯
