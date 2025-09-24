---
title: Directives 🎯
description: Learn about Angular directives - built-in and custom directives
sidebar:
  order: 6
---

Directives are classes that add behavior to elements in Angular templates. They extend HTML with custom functionality and can manipulate the DOM, handle events, and modify element appearance.

## 🎯 What are Directives?

Directives are **instructions in the DOM** that tell Angular how to transform elements. There are three types:

1. **Component Directives** - Components with templates
2. **Structural Directives** - Change DOM layout (`*ngIf`, `*ngFor`) Replaced by `@if`, `@for` in Angular 17+
3. **Attribute Directives** - Change element appearance or behavior

## 🏗️ Built-in Structural Directives

### Legacy Structural Directives (Still Supported)

#### *ngIf
```html
<div *ngIf="isVisible">This is visible</div>
<div *ngIf="user; else noUser">Hello {{user.name}}</div>
<ng-template #noUser>Please log in</ng-template>
```

#### *ngFor
```html
<li *ngFor="let item of items; index as i; trackBy: trackByFn">
  {{i}}: {{item.name}}
</li>
```

#### *ngSwitch
```html
<div [ngSwitch]="status">
  <div *ngSwitchCase="'loading'">Loading...</div>
  <div *ngSwitchCase="'error'">Error occurred</div>
  <div *ngSwitchDefault>Content</div>
</div>
```

## 🎨 Built-in Attribute Directives

### ngClass (Replaced by `class` binding in Angular 19+)
```html
<!-- Object syntax -->
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">Content</div>

<!-- Array syntax -->
<div [ngClass]="['btn', 'btn-primary', extraClass]">Button</div>

<!-- String syntax -->
<div [ngClass]="'btn btn-' + buttonType">Button</div>

<!-- Method call -->
<div [ngClass]="getClasses()">Content</div>
```

### ngStyle (Replaced by `style` binding in Angular 19+)
```html
<!-- Object syntax -->
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">Text</div>

<!-- Method call -->
<div [ngStyle]="getStyles()">Styled content</div>
```

### Modern Class and Style Binding (Recommended)
```html
<!-- Individual class binding -->
<div [class.active]="isActive" [class.disabled]="isDisabled">Content</div>

<!-- Individual style binding -->
<div [style.color]="textColor" [style.font-size.px]="fontSize">Text</div>

<!-- Multiple styles -->
<div 
  [style.color]="textColor"
  [style.background-color]="bgColor"
  [style.padding.px]="padding">
  Styled content
</div>
```

### Modern Control Flow (Angular 17+)

#### @if Directive
```html
<!-- Simple condition -->
@if (isLoggedIn) {
  <div>Welcome back!</div>
}

<!-- With else -->
@if (user.isAdmin) {
  <div>Admin Panel</div>
} @else {
  <div>User Dashboard</div>
}

<!-- Multiple conditions -->
@if (loading) {
  <div>Loading...</div>
} @else if (error) {
  <div>Error: {{error}}</div>
} @else {
  <div>Content loaded!</div>
}
```

#### @for Directive
```html
<!-- Basic loop -->
@for (item of items; track item.id) {
  <div>{{item.name}}</div>
}

<!-- With empty state -->
@for (product of products; track product.id) {
  <div class="product">{{product.name}}</div>
} @empty {
  <div>No products available</div>
}

<!-- With index and variables -->
@for (user of users; track user.id; let i = $index, first = $first, last = $last) {
  <div [class.first]="first" [class.last]="last">
    {{i + 1}}. {{user.name}}
  </div>
}
```

#### @switch Directive
```html
@switch (userRole) {
  @case ('admin') {
    <div>Admin Controls</div>
  }
  @case ('user') {
    <div>User Dashboard</div>
  }
  @case ('guest') {
    <div>Guest View</div>
  }
  @default {
    <div>Unknown Role</div>
  }
}
```

## 🔧 Creating Custom Attribute Directives

### Basic Attribute Directive
```typescript
import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input() appHighlight = 'yellow';
  @Input() defaultColor = 'transparent';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.highlight(this.appHighlight || this.defaultColor);
  }

  private highlight(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
  }
}
```

### Usage
```html
<!-- Basic usage -->
<p appHighlight>Highlighted with default yellow</p>

<!-- With custom color -->
<p [appHighlight]="'lightblue'">Blue highlighted text</p>

<!-- With default color -->
<p appHighlight defaultColor="lightgreen">Green highlighted text</p>
```

### Interactive Directive with Events
```typescript
import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHoverHighlight]'
})
export class HoverHighlightDirective {
  @Input() hoverColor = 'lightblue';
  @Input() defaultColor = 'transparent';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.hoverColor);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(this.defaultColor);
  }

  private highlight(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
  }
}
```

### Advanced Directive with Multiple Features
```typescript
import { Directive, ElementRef, Input, Output, EventEmitter, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appClickTracker]'
})
export class ClickTrackerDirective {
  @Input() trackingId: string = '';
  @Input() highlightOnClick = true;
  @Output() clicked = new EventEmitter<{id: string, timestamp: Date}>();

  private clickCount = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    this.clickCount++;
    
    // Emit tracking data
    this.clicked.emit({
      id: this.trackingId,
      timestamp: new Date()
    });

    // Visual feedback
    if (this.highlightOnClick) {
      this.flashHighlight();
    }

    // Add click count attribute
    this.renderer.setAttribute(
      this.el.nativeElement, 
      'data-click-count', 
      this.clickCount.toString()
    );
  }

  private flashHighlight() {
    const originalBg = this.el.nativeElement.style.backgroundColor;
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', 'yellow');
    
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', originalBg);
    }, 200);
  }
}
```

### Usage
```html
<button 
  appClickTracker 
  trackingId="header-cta"
  (clicked)="onButtonClicked($event)">
  Track My Clicks
</button>
```

## 🎯 Practical Example: Form Validation Directive

```typescript
import { Directive, ElementRef, Input, Renderer2, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appValidationStyle]'
})
export class ValidationStyleDirective implements OnInit {
  @Input() errorClass = 'error';
  @Input() successClass = 'success';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private control: NgControl
  ) {}

  ngOnInit() {
    if (this.control) {
      this.control.statusChanges?.subscribe(status => {
        this.updateStyles(status);
      });
    }
  }

  private updateStyles(status: string) {
    // Remove existing classes
    this.renderer.removeClass(this.el.nativeElement, this.errorClass);
    this.renderer.removeClass(this.el.nativeElement, this.successClass);

    // Add appropriate class
    if (status === 'INVALID' && this.control.touched) {
      this.renderer.addClass(this.el.nativeElement, this.errorClass);
    } else if (status === 'VALID' && this.control.touched) {
      this.renderer.addClass(this.el.nativeElement, this.successClass);
    }
  }
}
```

### Usage
```html
<form>
  <input 
    type="email" 
    [(ngModel)]="email" 
    required 
    email
    appValidationStyle
    errorClass="input-error"
    successClass="input-success">
</form>
```

## 🏗️ Creating Custom Structural Directives

### Simple Structural Directive
```typescript
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appUnless]'
})
export class UnlessDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
```

### Usage
```html
<!-- Shows content when condition is false -->
<div *appUnless="isLoggedIn">
  <p>Please log in to continue</p>
</div>
```

### Advanced Structural Directive with Context
```typescript
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appRepeat]'
})
export class RepeatDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set appRepeat(count: number) {
    this.viewContainer.clear();
    
    for (let i = 0; i < count; i++) {
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: i,
        index: i,
        first: i === 0,
        last: i === count - 1,
        even: i % 2 === 0,
        odd: i % 2 === 1
      });
    }
  }
}
```

### Usage
```html
<div *appRepeat="3; let i = index; let isFirst = first">
  <p>Item {{i}} {{isFirst ? '(First)' : ''}}</p>
</div>
```

## ✅ Best Practices

### 1. **Use Modern Control Flow**
```html
<!-- ✅ Modern -->
@if (condition) {
  <div>Content</div>
}

<!-- ❌ Legacy (still works) -->
<div *ngIf="condition">Content</div>
```

### 2. **Prefer Individual Bindings**
```html
<!-- ✅ Better performance -->
<div [class.active]="isActive" [style.color]="textColor">

<!-- ❌ Less efficient -->
<div [ngClass]="{'active': isActive}" [ngStyle]="{'color': textColor}">
```

### 3. **Use Renderer2 for DOM Manipulation**
```typescript
// ✅ Safe and universal
this.renderer.setStyle(element, 'color', 'red');

// ❌ Direct DOM access
element.style.color = 'red';
```

### 4. **Always Use TrackBy with Loops**
```html
@for (item of items; track item.id) {
  <div>{{item.name}}</div>
}
```

### 5. **Handle Cleanup in Directives**
```typescript
export class MyDirective implements OnDestroy {
  private subscription?: Subscription;

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

## 🎯 Quick Checklist

- [ ] Understand the three types of directives
- [ ] Use modern control flow (`@if`, `@for`, `@switch`)
- [ ] Know built-in attribute directives (`ngClass`, `ngStyle`)
- [ ] Prefer individual class/style bindings
- [ ] Create custom attribute directives with `@Directive`
- [ ] Use `HostListener` for event handling
- [ ] Use `Renderer2` for safe DOM manipulation
- [ ] Understand structural directive creation
- [ ] Always use `trackBy` with loops
- [ ] Handle cleanup properly

## 🚀 Next Steps

1. **[Services & DI](/beginner/services/)** - Share data between components
2. **[Forms Introduction](/beginner/forms/)** - Handle user input and validation
3. **[Routing Basics](/beginner/routing/)** - Navigate between components

---

**Remember**: Directives are powerful tools for extending HTML functionality. Use built-in directives efficiently and create custom ones when you need reusable DOM manipulation! 🎯
