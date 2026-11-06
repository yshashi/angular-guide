---
title: Signals Migration 🔄
description: Migrate to signals in Angular 22 — schematics for input(), output(), signal queries and inject(), plus patterns for replacing BehaviorSubject, async pipe and ngOnChanges.
sidebar:
  order: 3
---

Signals are Angular's reactive primitive: synchronous values that tell Angular exactly what changed. Signal inputs, outputs and queries are stable, and with **OnPush as the default in v22** and **zoneless as the default for new apps**, signal-based components are the way Angular apps are written today. This page shows how to migrate existing code — first with the **official schematics**, then by hand for patterns the tools can't rewrite.

**What you'll learn**

- The exact `ng generate` commands for inputs, outputs, queries and `inject()` — and their options
- What each schematic changes and what it skips
- How to replace `BehaviorSubject`, `combineLatest`, the `async` pipe and `ngOnChanges` with signals
- When to keep RxJS and how to bridge with `toSignal()`/`toObservable()`

## Automated migrations

| Migrates | Command | Aliases |
|---|---|---|
| `@Input()` → `input()` | `ng g @angular/core:signal-input-migration` | `signal-inputs`, `signal-input` |
| `@Output()` → `output()` | `ng g @angular/core:output-migration` | `outputs` |
| `@ViewChild`/`@ViewChildren`/`@ContentChild`/`@ContentChildren` → signal queries | `ng g @angular/core:signal-queries-migration` | `signal-queries`, `signal-query` |
| All three above in one run | `ng g @angular/core:signals` | — |
| Constructor injection → `inject()` | `ng g @angular/core:inject` | (`inject-migration`) |
| Unused standalone `imports` | `ng g @angular/core:cleanup-unused-imports` | — |

A good order:

```bash
ng g @angular/core:inject          # 1. constructor DI → inject()
ng g @angular/core:signals         # 2. inputs + outputs + queries
ng g @angular/core:cleanup-unused-imports
npx ng build && npx ng test --no-watch
```

:::tip[Also available in VS Code]
With the Angular Language Service extension installed, click an `@Input`, `@ViewChild` (etc.) field or a component class and use the lightbulb **refactor** action to run the input or query migration on just that code.
:::

### Shared options

| Option | Applies to | Effect |
|---|---|---|
| `--path=src/app/feature` | all | Only migrate files in this folder |
| `--analysis-dir=src/app` | inputs, outputs, queries, `signals` | Limit which files are **analysed** for references (faster in big repos, but references outside are silently skipped) |
| `--best-effort-mode` | inputs, queries, `signals` | Also migrate cases that *might* break the build |
| `--insert-todos` | inputs, queries, `signals` | Leave a `// TODO: Skipped for migration because: …` comment on skipped members |
| `--migrations=inputs,queries` | `signals` | Pick which of `inputs`, `outputs`, `queries` to run |

```bash
ng g @angular/core:signals --path=src/app/checkout --insert-todos
```

### Signal inputs

```ts title="Before"
@Component({
  selector: 'app-user',
  template: `Name: {{ name ?? '' }}`,
})
export class UserComponent {
  @Input() name: string | undefined = undefined;

  someMethod(): number {
    if (this.name) {
      return this.name.length;
    }
    return -1;
  }
}
```

```ts title="After"
@Component({
  selector: 'app-user',
  template: `Name: {{ name() ?? '' }}`,
})
export class UserComponent {
  readonly name = input<string>();

  someMethod(): number {
    const name = this.name();
    if (name) {
      return name.length;
    }
    return -1;
  }
}
```

The migration updates **every reference** — templates, host bindings and TypeScript — to call the signal. It **skips** inputs it can't migrate safely, most commonly inputs your own code **writes to** (`this.name = …`), because signal inputs are read-only. Use `--insert-todos` to see why, then refactor them (often to `model()` or `linkedSignal()`, shown below).

### Outputs

```ts title="Before"
export class SearchBox {
  @Output() search = new EventEmitter<string>();

  submit(value: string): void {
    this.search.emit(value);
  }
}
```

```ts title="After"
export class SearchBox {
  readonly search = output<string>();

  submit(value: string): void {
    this.search.emit(value);
  }
}
```

The migration also turns `.next(value)` into `.emit(value)` and removes `.complete()` calls. It **skips** outputs that your code treats as an Observable (for example `this.search.pipe(...)`) outside tests. In test files it rewrites such usages to `outputToObservable(this.search).pipe(...)` — but it only recognises a test file by an import path containing `jasmine` or `catalyst`, so in **Vitest** specs those outputs are skipped and you convert them by hand.

### Signal queries

```ts title="Before"
export class Panel {
  @ContentChild('header') header: ElementRef | undefined = undefined;
  @ViewChildren(Tab) tabs!: QueryList<Tab>;
}
```

```ts title="After"
export class Panel {
  readonly header = contentChild<ElementRef>('header');
  readonly tabs = viewChildren(Tab);
}
```

Signal queries return signals (`this.tabs()` is a plain array, not a `QueryList`), so code in `ngAfterViewInit` usually moves to `afterNextRender()` or a `computed()`. Queries your code assigns to are skipped.

### `inject()`

```ts title="Before"
@Component({ template: '' })
export class MyComp {
  constructor(
    private service: MyService,
    @Inject(DI_TOKEN) @Optional() readonly token: string,
  ) {}
}
```

```ts title="After"
@Component({ template: '' })
export class MyComp {
  private service = inject(MyService);
  readonly token = inject(DI_TOKEN, { optional: true });
}
```

| Option | Use when |
|---|---|
| `--migrate-abstract-classes` | You also want abstract classes migrated (not validated by Angular, may need manual fixes) |
| `--backwards-compatible-constructors` | Subclasses call `super(...)` with arguments — keeps a `constructor(...args: unknown[])` signature |
| `--non-nullable-optional` | Adds `!` after `inject(X, { optional: true })` to keep the old (non-null) type and avoid new compile errors |

Running `inject` first also unblocks the [`@Injectable` → `@Service` migration](/migration/modernization/#injectable--service), which skips classes with constructor injection.

## Manual patterns: from RxJS-style state to signals

The schematics change *declarations*. Your component and service **state** still needs a human. Here are the common rewrites.

### `BehaviorSubject` in a service → `signal()` + `computed()`

```ts title="Before"
@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();
  count$ = this.items$.pipe(map((items) => items.length));

  add(item: CartItem) {
    this.itemsSubject.next([...this.itemsSubject.value, item]);
  }
}
```

```ts title="After: cart-store.ts"
import { Service, computed, signal } from '@angular/core';

export interface CartItem {
  id: number;
  name: string;
  price: number;
}

@Service()
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();      // public, read-only
  readonly count = computed(() => this._items().length);
  readonly subtotal = computed(() => this._items().reduce((sum, i) => sum + i.price, 0));

  add(item: CartItem): void {
    this._items.update((items) => [...items, item]); // new array, never mutate
  }

  remove(id: number): void {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }
}
```

Templates read `store.items()` instead of `items$ | async`.

### `combineLatest` + `map` → `computed()`

```ts title="Before"
total$ = combineLatest([this.cart.items$, this.pricing.taxRate$]).pipe(
  map(([items, tax]) => items.reduce((s, i) => s + i.price, 0) * (1 + tax)),
);
```

```ts title="After"
@Component({
  selector: 'app-order-summary',
  template: `<p>Total: {{ total() }}</p>`,
})
export class OrderSummary {
  private readonly cart = inject(CartStore);
  private readonly pricing = inject(PricingStore);
  protected readonly total = computed(() => this.cart.subtotal() * (1 + this.pricing.taxRate()));
}
```

### Observable + `async` pipe → `httpResource()` / `rxResource()`

```ts title="Before"
@Component({
  template: `
    <div *ngIf="user$ | async as user">
      <h1>{{ user.name }}</h1>
    </div>
  `,
})
export class Profile implements OnChanges {
  @Input() userId!: number;
  user$!: Observable<User>;
  constructor(private api: UserApi) {}
  ngOnChanges() {
    this.user$ = this.api.getUser(this.userId);
  }
}
```

```ts title="After: httpResource re-fetches whenever userId changes"
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p>Could not load the user.</p>
    } @else if (user.hasValue()) {
      <h1>{{ user.value().name }}</h1>
      <p>{{ user.value().email }}</p>
    }
  `,
})
export class Profile {
  readonly userId = input.required<number>();
  protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```

Want to keep an existing Observable-returning service? Use `rxResource`:

```ts
protected readonly user = rxResource({
  params: () => this.userId(),
  stream: ({ params: id }) => this.api.getUser(id),
});
```

Both are stable in v22. See [httpResource](/modern/http-resource-api/) and [Resource API](/modern/resource-api/).

### `ngOnChanges` → `computed()`

```ts title="After"
@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ displayName() }}!</h1>`,
})
export class Greeting {
  readonly name = input('');
  readonly title = input('');
  readonly size = input(16, { transform: numberAttribute });

  protected readonly displayName = computed(() =>
    this.title() ? `${this.title()} ${this.name()}` : this.name(),
  );
}
```

Derived values go in `computed()`. Side effects that must react to an input (logging, syncing to `localStorage`, imperative third-party APIs) go in `effect()` — never use `effect()` to copy one signal into another.

### Inputs your code writes to → `linkedSignal()` or `model()`

The input migration skips inputs that the component assigns. Two common fixes:

- **Local, resettable state** derived from an input → `linkedSignal()`:

```ts
@Component({
  selector: 'app-picker',
  template: `<p>{{ selected() }}</p>`,
})
export class Picker {
  readonly options = input<string[]>([]);
  // Writable, but resets to the first option whenever `options` changes
  protected readonly selected = linkedSignal(() => this.options()[0] ?? '');
}
```

- **Two-way binding** (`@Input() value` + `@Output() valueChange`) → `model()`:

```ts
@Component({
  selector: 'app-rating',
  template: `<button (click)="value.set(value() + 1)">{{ value() }} ★</button>`,
})
export class Rating {
  readonly value = model(0); // parent: <app-rating [(value)]="stars" />
}
```

### `ngAfterViewInit` + `@ViewChild` → `viewChild()` + `afterNextRender()`

```ts
@Component({
  selector: 'app-canvas',
  template: `<canvas #canvas width="400" height="300"></canvas>`,
})
export class Canvas {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => {
      this.canvas().nativeElement.getContext('2d')?.fillRect(10, 10, 100, 100);
    });
  }
}
```

## Keep RxJS where it shines — and bridge

| Use case | Best tool |
|---|---|
| Component/service state, flags, selections | `signal()` |
| Values derived from other state | `computed()` |
| Loading data that depends on signals | `httpResource()`, `resource()`, `rxResource()` |
| Event streams: debounce, retry, race, websockets, polling | RxJS |
| Router events, form `valueChanges`, third-party Observables | RxJS → `toSignal()` for the template |

`toSignal()` turns an Observable into a signal (subscribes immediately, unsubscribes on destroy; call it in an injection context):

```ts
@Component({
  selector: 'app-product',
  template: `<h1>Product {{ productId() }}</h1>`,
})
export class ProductPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
}
```

(With `withComponentInputBinding()` you can simply declare `readonly id = input<string>()` instead.)

`toObservable()` goes the other way — perfect for debounced search:

```ts
@Component({
  selector: 'app-live-search',
  template: `
    <input #box [value]="term()" (input)="term.set(box.value)" />
    @for (r of results(); track r) {
      <p>{{ r }}</p>
    }
  `,
})
export class LiveSearch {
  private readonly api = inject(SearchApi);
  protected readonly term = signal('');
  protected readonly results = toSignal(
    toObservable(this.term).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((t) => this.api.search(t)),
    ),
    { initialValue: [] },
  );
}
```

## A gradual plan

1. **New code is signal-first** — `input()`, `output()`, `model()`, signal queries, `signal`/`computed`, `@Service()`.
2. **Run the schematics** (`inject`, then `signals`) folder by folder with `--path`, committing each step.
3. **Convert shared services** from `BehaviorSubject` to signals — consumers get simpler automatically.
4. **Tackle complex components** (`ngOnChanges`, manual subscriptions) with `computed`, `linkedSignal`, resources and `effect`.
5. **Drop `ChangeDetectionStrategy.Eager`** from components whose state is now in signals, and move on to [zoneless](/migration/modernization/#zonejs--zoneless).

## Migration checklist

- [ ] `ng g @angular/core:inject` run and reviewed
- [ ] `ng g @angular/core:signals` run; skipped members (TODOs) handled
- [ ] Outputs used as Observables converted with `outputToObservable()` where needed
- [ ] `BehaviorSubject` state replaced by `signal()` + `computed()`
- [ ] `async` pipe data loading replaced by `httpResource()`/`rxResource()`/`toSignal()`
- [ ] `ngOnChanges` replaced by `computed()`, `linkedSignal()` or `effect()`
- [ ] RxJS kept only for real event streams
- [ ] Build and tests pass

## Key takeaways

- `ng g @angular/core:signals` migrates inputs, outputs and queries in one go; `ng g @angular/core:inject` converts constructor DI.
- Schematics skip unsafe cases — use `--insert-todos` to find them.
- Inputs you write to become `linkedSignal()` or `model()`.
- Use resources for async data and `toSignal()`/`toObservable()` at the RxJS boundary.

## Next steps

1. **[Codebase Modernization](/migration/modernization/)** — control flow, OnPush, zoneless, Vitest and more
2. **[Signals](/modern/signals/)** — signals in depth
3. **[Linked Signals](/modern/linked-signals/)** — resettable derived state
