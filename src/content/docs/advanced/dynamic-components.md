---
title: Dynamic Components 🔄
description: Render components chosen at runtime in Angular 22 with @defer, NgComponentOutlet, ViewContainerRef.createComponent, createComponent() and the bindings API.
sidebar:
  order: 2
---

Most of the time you know which component to show, so you put `<app-user-card />` in a template. Sometimes the component is only known **at runtime**: a dashboard built from user settings, a CMS that returns "render a `hero` block here", a toast or dialog opened from a service, or a plugin loaded later. That's what dynamic components are for.

Angular 22 gives you several tools for this. Picking the right one is half the job.

## What you'll learn

- Which API to use: `@defer`, `@switch`, `NgComponentOutlet`, `ViewContainerRef` or `createComponent()`
- Passing inputs, content and injectors to `NgComponentOutlet`
- Creating components from code with `ViewContainerRef.createComponent()`
- The bindings API: `inputBinding()`, `outputBinding()`, `twoWayBinding()` and `directives`
- Rendering outside the component tree (toasts, overlays) with `createComponent()`
- Lazy loading, cleanup and error handling

## Choosing the right tool

| You want to... | Use |
| --- | --- |
| Lazy load a component you already know about | [`@defer`](/modern/control-flow/) |
| Pick one of a few known components | `@if` / `@switch` in the template |
| Render a component **type** stored in a variable, declaratively | `NgComponentOutlet` |
| Create, insert, move or remove components from TypeScript at a specific place | `ViewContainerRef.createComponent()` |
| Render a component **outside** any view (attached to `document.body`) | `createComponent()` + `ApplicationRef.attachView()` |
| Ship a component to non-Angular pages | [Angular Elements](/advanced/elements/) |

:::caution[`ComponentFactoryResolver` was removed in v22]
`ComponentFactoryResolver` and `ComponentFactory` no longer exist in Angular 22. Pass the component class directly instead:

```ts del={1,2} ins={3}
const factory = this.resolver.resolveComponentFactory(Alert);
const ref = this.vcr.createComponent(factory);
const ref = this.vcr.createComponent(Alert);
```

Outside of a view container, use the standalone `createComponent()` function (shown [below](#rendering-outside-the-component-tree-with-createcomponent)).
:::

## Start simple: `@defer` and `@switch`

If the set of components is known, you don't need any dynamic API. Choose with control flow, and let `@defer` split the code into a lazy chunk:

```html
@switch (block().type) {
  @case ('hero') { <app-hero-block [data]="block()" /> }
  @case ('gallery') {
    @defer (on viewport) {
      <app-gallery-block [data]="block()" />
    } @placeholder {
      <div class="gallery-skeleton"></div>
    }
  }
}
```

Everything inside `@defer` is loaded only when the trigger fires, and the bindings stay normal, type-checked template bindings. Use the APIs below only when the component **type itself** comes from data or code.

## `NgComponentOutlet`: dynamic component in a template

`NgComponentOutlet` (from `@angular/common`) renders whatever component type you give it.

```ts title="profile-card.ts"
import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AdminBio } from './admin-bio';
import { StandardBio } from './standard-bio';
import { User } from './user';

@Component({
  selector: 'app-profile-card',
  imports: [NgComponentOutlet],
  template: `
    <h2>{{ user().name }}</h2>
    <ng-container *ngComponentOutlet="bioComponent(); inputs: { user: user() }" />
  `,
})
export class ProfileCard {
  readonly user = input.required<User>();
  protected readonly bioComponent = computed(() => (this.user().isAdmin ? AdminBio : StandardBio));
}
```

```ts title="admin-bio.ts"
import { Component, input } from '@angular/core';
import { User } from './user';

@Component({
  selector: 'app-admin-bio',
  template: `<p>👑 {{ user().name }} is an administrator.</p>`,
})
export class AdminBio {
  readonly user = input.required<User>();
}
```

When `bioComponent()` changes, the old component is destroyed and the new one is created. When the `inputs` object changes, the inputs are updated on the existing instance.

### All the options

| Microsyntax key | Input | Purpose |
| --- | --- | --- |
| (main value) | `ngComponentOutlet` | Component class (or `null` to render nothing) |
| `inputs` | `ngComponentOutletInputs` | Object of input values (`{ name: value }`) |
| `injector` | `ngComponentOutletInjector` | Custom parent injector |
| `environmentInjector` | `ngComponentOutletEnvironmentInjector` | Custom environment injector |
| `content` | `ngComponentOutletContent` | Projected nodes: `Node[][]`, one array per `<ng-content>` slot |
| `ngModule` | `ngComponentOutletNgModule` | Legacy: NgModule to load with the component |

Here's an example that uses `injector`, `content` and the exported instance:

```ts title="outlet-options.ts"
import {
  Component, InjectionToken, Injector, TemplateRef, ViewContainerRef,
  computed, inject, signal, viewChild,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

export const THEME = new InjectionToken<'light' | 'dark'>('THEME', { factory: () => 'light' });

@Component({
  selector: 'app-panel',
  template: `<section [class]="theme"><ng-content /></section>`,
})
export class Panel {
  protected readonly theme = inject(THEME);
}

@Component({
  selector: 'app-counter',
  template: `<p>Count: {{ count() }}</p>`,
})
export class Counter {
  readonly count = signal(0);
  increment() {
    this.count.update((c) => c + 1);
  }
}

@Component({
  selector: 'app-outlet-options',
  imports: [NgComponentOutlet],
  template: `
    <!-- custom injector + projected content -->
    <ng-container *ngComponentOutlet="panel; injector: darkInjector; content: panelContent()" />
    <ng-template #panelBody><p>Projected into the panel</p></ng-template>

    <!-- grab the created instance with exportAs -->
    <ng-container [ngComponentOutlet]="counter" #outlet="ngComponentOutlet" />
    <button (click)="outlet.componentInstance?.increment()">+1</button>
  `,
})
export class OutletOptions {
  private readonly vcr = inject(ViewContainerRef);
  protected readonly panel = Panel;
  protected readonly counter = Counter;

  protected readonly darkInjector = Injector.create({
    providers: [{ provide: THEME, useValue: 'dark' }],
    parent: inject(Injector),
  });

  private readonly panelBody = viewChild.required<TemplateRef<unknown>>('panelBody');
  protected readonly panelContent = computed(() => [
    this.vcr.createEmbeddedView(this.panelBody()).rootNodes,
  ]);
}
```

:::note
`NgComponentOutlet` has no option for **outputs**. If you need to listen to a dynamic component's events, use `ViewContainerRef.createComponent()` with `outputBinding()` (next section), or share state through a service.
:::

## `ViewContainerRef.createComponent()`: create from code

A **view container** is a spot in the DOM where Angular can insert views. Any directive or component can inject `ViewContainerRef` for its own location, or you can query one from the template with `read: ViewContainerRef`. New components are inserted **after** the anchor element, in order.

```ts title="alert-host.ts"
import { Component, input, output, viewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    <div class="alert" [class]="'alert--' + type()">
      {{ message() }}
      <button (click)="closed.emit()">✕</button>
    </div>
  `,
})
export class Alert {
  readonly message = input.required<string>();
  readonly type = input<'info' | 'error'>('info');
  readonly closed = output<void>();
}

@Component({
  selector: 'app-alert-host',
  template: `
    <button (click)="show()">Show alert</button>
    <ng-container #alerts />
  `,
})
export class AlertHost {
  private readonly alerts = viewChild.required('alerts', { read: ViewContainerRef });

  show() {
    const ref = this.alerts().createComponent(Alert);
    ref.setInput('message', 'Saved successfully!'); // works for signal inputs and marks the view for check
    ref.setInput('type', 'info');

    const sub = ref.instance.closed.subscribe(() => ref.destroy());
    ref.onDestroy(() => sub.unsubscribe());
  }
}
```

Useful `ViewContainerRef` and `ComponentRef` members:

| API | What it does |
| --- | --- |
| `vcr.createComponent(Cmp, options?)` | Create and insert. Options: `index`, `injector`, `environmentInjector`, `projectableNodes`, `bindings`, `directives`, `onError` |
| `vcr.clear()` / `vcr.remove(i)` | Destroy all views / the view at index `i` |
| `vcr.move(viewRef, i)` / `vcr.indexOf(viewRef)` / `vcr.length` | Reorder and inspect |
| `vcr.detach(i)` / `vcr.insert(viewRef, i)` | Move a view without destroying it |
| `ref.setInput(name, value)` | Set an input by its public name |
| `ref.instance` | The component instance |
| `ref.location` | `ElementRef` of the host element |
| `ref.destroy()` / `ref.onDestroy(fn)` | Destroy / run code on destroy |

:::tip
Always use `ref.setInput()` instead of assigning `ref.instance.someInput = ...`. Signal inputs are read-only, and `setInput()` also schedules change detection. That matters for OnPush components (the default since v22) and in zoneless apps.
:::

## The bindings API: template-like bindings from code

Instead of calling `setInput()` and subscribing to outputs by hand, pass a `bindings` array when you create the component. These helpers come from `@angular/core`:

| Helper | Template equivalent |
| --- | --- |
| `inputBinding('name', () => value)` | `[name]="value"`, re-evaluated during change detection, so a signal keeps it in sync |
| `outputBinding<T>('name', (event: T) => ...)` | `(name)="handler($event)"`, unsubscribed automatically on destroy |
| `twoWayBinding('name', writableSignal)` | `[(name)]="writableSignal"` for `model()` inputs |

You can also attach **directives** to the new component's host element with `directives`, each with its own bindings.

```ts title="warning-host.ts"
import {
  Component, ComponentRef, Directive, ViewContainerRef, input, inputBinding, model, output,
  outputBinding, signal, twoWayBinding, viewChild,
} from '@angular/core';

@Component({
  selector: 'app-warning',
  template: `
    @if (expanded()) {
      <section>
        <p>{{ text() }}</p>
        <button (click)="expanded.set(false)">Collapse</button>
        <button (click)="dismissed.emit('user')">Dismiss</button>
      </section>
    }
  `,
})
export class Warning {
  readonly text = input.required<string>();
  readonly expanded = model(true);
  readonly dismissed = output<string>();
}

@Directive({
  selector: '[appTheme]',
  host: { '[attr.data-theme]': 'appTheme()' },
})
export class Theme {
  readonly appTheme = input('light');
}

@Component({
  selector: 'app-warning-host',
  template: `<ng-container #slot />`,
})
export class WarningHost {
  private readonly slot = viewChild.required('slot', { read: ViewContainerRef });

  readonly text = signal('Disk almost full');
  readonly expanded = signal(true);
  private ref?: ComponentRef<Warning>;

  show() {
    this.ref?.destroy();
    this.ref = this.slot().createComponent(Warning, {
      bindings: [
        inputBinding('text', this.text),            // a signal is a () => value function
        twoWayBinding('expanded', this.expanded),   // stays in sync both ways
        outputBinding<string>('dismissed', (reason) => {
          console.log('Dismissed by', reason);
          this.ref?.destroy();
        }),
      ],
      directives: [{ type: Theme, bindings: [inputBinding('appTheme', () => 'warning')] }],
    });
  }

  updateText() {
    this.text.set('Disk full!'); // the Warning component updates automatically
  }
}
```

Binding names are strings, so they aren't type-checked like template bindings. In development mode a misspelled input name throws a runtime error (NG0315), so keep these calls close to the component they target.

## Rendering outside the component tree with `createComponent()`

Toasts, dialogs and overlays often need to live directly under `<body>`. The standalone `createComponent()` function creates a component that isn't attached to any view. You decide where the host element goes, and you register the view with `ApplicationRef` so change detection runs for it.

```ts title="toast.service.ts"
import {
  ApplicationRef, Component, DOCUMENT, EnvironmentInjector, Service,
  createComponent, inject, input, inputBinding, output, outputBinding,
} from '@angular/core';

@Component({
  selector: 'app-toast',
  host: { role: 'status', class: 'toast' },
  template: `{{ message() }} <button (click)="closed.emit()">Close</button>`,
})
export class Toast {
  readonly message = input.required<string>();
  readonly closed = output<void>();
}

@Service()
export class ToastService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT); // SSR-safe access to document

  show(message: string, durationMs = 3000) {
    const host = this.document.createElement('div');
    this.document.body.appendChild(host);

    const ref = createComponent(Toast, {
      environmentInjector: this.injector, // required: where services come from
      hostElement: host,                  // optional: otherwise Angular creates an element
      bindings: [
        inputBinding('message', () => message),
        outputBinding('closed', () => close()),
      ],
    });
    this.appRef.attachView(ref.hostView); // include it in change detection

    const close = () => {
      clearTimeout(timer);
      if (!ref.hostView.destroyed) {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        host.remove();
      }
    };
    const timer = setTimeout(close, durationMs);
    return close;
  }
}
```

```ts
// anywhere in the app
private readonly toasts = inject(ToastService);
save() {
  this.toasts.show('Profile saved');
}
```

:::tip
For production dialogs, menus and overlays, the Angular CDK (`@angular/cdk/overlay`, `@angular/cdk/dialog`) and Angular Material already handle positioning, focus trapping, scroll blocking and accessibility on top of these same APIs.
:::

## Lazy loading dynamic components

Every dynamic API accepts a component **class**, so you can load that class with a dynamic `import()`. The bundler puts it into its own chunk.

```ts title="dashboard.ts"
import { Component, Type, ViewContainerRef, reflectComponentType, viewChild } from '@angular/core';

type WidgetLoader = () => Promise<Type<unknown>>;

// A registry: the keys could come from user settings or a CMS
const WIDGETS: Record<string, WidgetLoader> = {
  weather: () => import('./widgets/weather').then((m) => m.Weather),
  stocks: () => import('./widgets/stocks').then((m) => m.Stocks),
};

@Component({
  selector: 'app-dashboard',
  template: `
    @for (name of widgetNames; track name) {
      <button (click)="add(name)">Add {{ name }}</button>
    }
    <ng-container #grid />
  `,
})
export class Dashboard {
  private readonly grid = viewChild.required('grid', { read: ViewContainerRef });
  protected readonly widgetNames = Object.keys(WIDGETS);

  async add(name: string) {
    const component = await WIDGETS[name]();
    const ref = this.grid().createComponent(component);

    // Inspect the component's public API before setting inputs
    const mirror = reflectComponentType(component);
    if (mirror?.inputs.some((i) => i.templateName === 'title')) {
      ref.setInput('title', name);
    }
  }
}
```

The same works declaratively with a signal and `NgComponentOutlet`:

```ts title="admin-settings.ts"
import { Component, Type, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-admin-settings',
  imports: [NgComponentOutlet],
  template: `
    @if (advanced(); as cmp) {
      <ng-container *ngComponentOutlet="cmp" />
    } @else {
      <button (click)="loadAdvanced()">Load advanced settings</button>
    }
  `,
})
export class AdminSettings {
  protected readonly advanced = signal<Type<unknown> | null>(null);

  async loadAdvanced() {
    const { AdvancedSettings } = await import('./advanced-settings');
    this.advanced.set(AdvancedSettings);
  }
}
```

If the component is known at build time, `@defer (on interaction)` does the same thing with less code.

## Handling rendering errors

:::caution[Developer preview]
The `onError` option and its `ErrorDetails` argument are in developer preview (v22.2). They are the programmatic equivalent of the template `@boundary` / `@error` blocks.
:::

```ts
const ref = this.grid().createComponent(component, {
  onError: (error, details) => {
    console.error('Widget failed while rendering', error, details.declarationType);
    ref.destroy();
  },
});
```

`onError` catches errors thrown during change detection and lifecycle hooks of the created component. Errors thrown in its constructor are still thrown synchronously from `createComponent()`.

## Common mistakes

- **Using `ComponentFactoryResolver`.** It was removed in v22. Pass the class directly.
- **Assigning inputs with `ref.instance.x = value`.** This doesn't work for signal inputs and doesn't trigger change detection. Use `setInput()` or `inputBinding()`.
- **Forgetting `appRef.attachView()`** after `createComponent()`. The component renders once and never updates.
- **Leaking components.** Call `ref.destroy()` or `vcr.clear()` when they're no longer needed. Components inside a `ViewContainerRef` are destroyed with their parent; components attached to `ApplicationRef` are not.
- **Reaching for dynamic APIs too early.** `@if`, `@switch` and `@defer` cover most cases with full type checking.
- **Using `document` directly.** Inject `DOCUMENT` so the code also works during server-side rendering.

## Key takeaways

- Prefer templates (`@switch`, `@defer`). Use dynamic APIs when the component type is data.
- `NgComponentOutlet` handles inputs, injector and content declaratively. It doesn't support outputs.
- `ViewContainerRef.createComponent(Cmp, { bindings, directives })` is the imperative workhorse.
- `createComponent()` plus `ApplicationRef.attachView()` renders anywhere in the DOM.
- `inputBinding`, `outputBinding` and `twoWayBinding` give you template-like, auto-cleaned bindings from code.

## Next steps

- [Content Projection](/advanced/content-projection/): `ng-template`, `ngTemplateOutlet` and projection slots
- [Custom Directives](/advanced/custom-directives/): structural directives use the same `ViewContainerRef`
- [Angular Elements](/advanced/elements/): turn components into framework-agnostic custom elements
- [Memory Management](/advanced/memory-management/): clean up what you create
