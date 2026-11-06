---
title: Todo App with Signals ✅
description: Build a complete Angular 22 todo app step by step with signals, an @Service store, Signal Forms, route-based filters, localStorage and Vitest tests.
sidebar:
  order: 1
---

In this project you build a complete **Todo app** with modern Angular 22, from `ng new` to passing tests. Every file is shown in full, so you can follow along from start to finish and end up with a working app.

## What you'll build

- ✅ Add todos with a validated **Signal Form**
- ✅ Toggle, edit (double-click), and delete todos
- ✅ "Mark all as complete" and "Clear completed"
- ✅ Filters **All / Active / Completed** that live in the URL (`/all`, `/active`, `/completed`)
- ✅ Todos saved to `localStorage`, so they survive a page refresh
- ✅ Unit tests with **Vitest**

## What you'll learn

- How to keep app state in a **signal store** made with `@Service()`, `signal()`, and `computed()`
- How to save state automatically with `effect()`
- How to build a form with **Signal Forms** (`form()`, `[formField]`, `[formRoot]`)
- How to split the UI into small components with `input()` and `output()`
- How to read a **route parameter as a component input** with `withComponentInputBinding()`
- How to test a store and a component with Vitest and `TestBed`

## Prerequisites

- **Node.js** `^22.22.3`, `^24.15.0`, or `^26` (required by Angular 22)
- Basic TypeScript, and a rough idea of what a component is
- New to the setup? Read [Prerequisites](/prerequisites/) and [Setup](/setup/) first.

## Step 1: Create the project

Install the Angular CLI (once), then create the app:

```bash
npm install -g @angular/cli@22
ng new todo-app --style=css --ssr=false --ai-config=none
cd todo-app
```

The flags skip the interactive questions. Routing is turned on by default, and we use it for the filters.

A new Angular 22 project already gives you the modern defaults:

| Default | What it means for this project |
|---|---|
| Standalone components | No NgModules anywhere |
| Zoneless change detection | No `zone.js`. Signals tell Angular what to update. |
| `OnPush` change detection | OnPush is the default since v22, so we never write `changeDetection` |
| Vitest | `ng test` runs Vitest |
| Strict TypeScript and strict templates | Template mistakes become build errors |

Start the dev server to check that everything works, then stop it with `Ctrl+C`:

```bash
ng serve
```

## Step 2: Plan the files

We put everything about todos in one folder. Each file has one job:

```text
src/
├── styles.css                 ← global styles (Step 10)
└── app/
    ├── app.ts                 ← root component: <router-outlet />
    ├── app.config.ts          ← providers (router)
    ├── app.routes.ts          ← /all, /active, /completed
    └── todos/
        ├── todo.ts            ← Todo type + helper functions
        ├── todo-store.ts      ← state + actions (signals)
        ├── todo-form.ts       ← "What needs to be done?" form
        ├── todo-item.ts       ← one todo row
        ├── todo-footer.ts     ← counter, filters, "Clear completed"
        ├── todo-page.ts       ← puts it all together
        ├── todo-store.spec.ts ← store tests
        └── todo-page.spec.ts  ← component test
```

Data flows in one direction. Components **read** signals from the store and **call** store methods. They never change the data directly.

```text
TodoForm ──add()──────────┐
TodoItem ──(outputs)──► TodoPage ──toggle()/remove()/rename()──► TodoStore
TodoFooter ──(output)─────┘                                         │
        ▲                                                           │
        └──────────── todos(), activeCount(), … (signals) ──────────┘
```

## Step 3: The Todo model

Create `src/app/todos/todo.ts`. It holds the `Todo` type, the filter type, and two small helper functions:

```ts title="src/app/todos/todo.ts"
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export type TodoFilter = 'all' | 'active' | 'completed';

export function toTodoFilter(value: string | undefined): TodoFilter {
  return value === 'active' || value === 'completed' ? value : 'all';
}

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}
```

- `toTodoFilter()` turns any text from the URL into a safe `TodoFilter`. Unknown values become `'all'`.
- `filterTodos()` is a **pure function**: same input, same output, no side effects. Pure functions are easy to test and easy to use inside `computed()`.

## Step 4: The store (state + actions)

The store is a service that owns the list of todos. Create `src/app/todos/todo-store.ts`:

```ts title="src/app/todos/todo-store.ts"
import { Service, computed, effect, signal } from '@angular/core';
import { Todo } from './todo';

const STORAGE_KEY = 'ng-guide-todos';

@Service()
export class TodoStore {
  // Private, writable state. Only this class can change it.
  private readonly _todos = signal<Todo[]>(loadTodos());

  // Public, read-only state and derived values.
  readonly todos = this._todos.asReadonly();
  readonly activeCount = computed(() => this._todos().filter((todo) => !todo.completed).length);
  readonly completedCount = computed(() => this._todos().length - this.activeCount());
  readonly allCompleted = computed(() => this._todos().length > 0 && this.activeCount() === 0);

  constructor() {
    // Runs once now and again every time `_todos` changes.
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._todos()));
    });
  }

  add(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    const todo: Todo = { id: crypto.randomUUID(), title: trimmed, completed: false };
    this._todos.update((todos) => [...todos, todo]);
  }

  toggle(id: string): void {
    this._todos.update((todos) =>
      todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }

  rename(id: string, title: string): void {
    const trimmed = title.trim();
    if (!trimmed) {
      this.remove(id);
      return;
    }
    this._todos.update((todos) =>
      todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo)),
    );
  }

  remove(id: string): void {
    this._todos.update((todos) => todos.filter((todo) => todo.id !== id));
  }

  toggleAll(): void {
    const completed = !this.allCompleted();
    this._todos.update((todos) => todos.map((todo) => ({ ...todo, completed })));
  }

  clearCompleted(): void {
    this._todos.update((todos) => todos.filter((todo) => !todo.completed));
  }
}

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Todo[]) : [];
  } catch {
    return [];
  }
}
```

Here is what each part does:

| Code | Why |
|---|---|
| `@Service()` | Makes one shared instance for the whole app (auto-provided in root). |
| `private readonly _todos = signal(...)` | The only writable state. Only the store can change it. |
| `this._todos.asReadonly()` | Components can read `todos()`, but they can't call `.set()` on it. |
| `computed(...)` | Derived values. They update automatically and are cached until `_todos` changes. |
| `effect(...)` in the constructor | Runs once, then runs again whenever `_todos` changes, and saves the list to `localStorage`. |
| `update(todos => [...])` | Always creates a **new** array or object. Signals compare by reference, so changing an array in place would not notify anyone. |

:::note[Angular 21 and earlier]
`@Service()` is new in Angular 22. On older versions, use `@Injectable({ providedIn: 'root' })` instead. The rest of the class stays the same.
:::

:::tip[Why not save in every method?]
With an `effect()`, saving happens in one place. When you add a new action later (for example `duplicate()`), it is saved automatically.
:::

## Step 5: The "new todo" form (Signal Forms)

Create `src/app/todos/todo-form.ts`:

```ts title="src/app/todos/todo-form.ts"
import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { TodoStore } from './todo-store';

@Component({
  selector: 'app-todo-form',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="todoForm">
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        aria-label="New todo"
        autocomplete="off"
        [formField]="todoForm.title"
      />
      @if (todoForm.title().touched() && todoForm.title().invalid()) {
        <p class="error" role="alert">{{ todoForm.title().errors()[0].message }}</p>
      }
    </form>
  `,
})
export class TodoForm {
  private readonly store = inject(TodoStore);

  protected readonly model = signal({ title: '' });

  protected readonly todoForm = form(
    this.model,
    (path) => {
      required(path.title, { message: 'Type something first.' });
      maxLength(path.title, 100, { message: 'Keep it under 100 characters.' });
    },
    {
      submission: {
        action: async (field) => {
          this.store.add(field.title().value());
          field().reset({ title: '' });
        },
      },
    },
  );
}
```

How Signal Forms work here:

1. **The model is a signal.** `model = signal({ title: '' })` is the single source of truth for the form's value.
2. **`form(model, schema, options)`** creates a *field tree*. `todoForm.title` is the field for `model().title`.
3. **The schema function** adds validation rules: `required()` and `maxLength()`, each with a friendly message.
4. **`[formField]="todoForm.title"`** connects the `<input>` to the field in both directions. You don't need `FormsModule` or `ngModel`.
5. **`[formRoot]="todoForm"`** on the `<form>` stops the page from reloading and calls `submit()` when the user presses <kbd>Enter</kbd>.
6. **`submission.action`** runs only when the form is valid. It adds the todo, then calls `field().reset({ title: '' })` to clear the value and the *touched* and *dirty* flags.
7. Calling a field gives you its state: `todoForm.title().touched()`, `.invalid()`, `.errors()`. We show the first error only after the user has touched the field.

:::note[Signal Forms are stable]
Signal Forms (`@angular/forms/signals`) are stable in Angular 22. In v21 they were experimental. Read the [Signal Forms guide](/modern/signal-forms/) to learn more.
:::

## Step 6: One todo row

Create `src/app/todos/todo-item.ts`. This is a **presentational** component. It gets a todo through an input and reports what the user did through outputs. It doesn't know the store exists.

```ts title="src/app/todos/todo-item.ts"
import {
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Todo } from './todo';

@Component({
  selector: 'app-todo-item',
  host: {
    '[class.completed]': 'todo().completed',
    '[class.editing]': 'editing()',
  },
  template: `
    @if (editing()) {
      <input
        #editInput
        class="edit"
        aria-label="Edit todo"
        [value]="todo().title"
        (keydown.enter)="save(editInput.value)"
        (keydown.escape)="cancel()"
        (blur)="save(editInput.value)"
      />
    } @else {
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          [checked]="todo().completed"
          [attr.aria-label]="'Toggle ' + todo().title"
          (change)="toggled.emit()"
        />
        <label (dblclick)="editing.set(true)">{{ todo().title }}</label>
        <button type="button" class="destroy" aria-label="Delete todo" (click)="removed.emit()">
          ×
        </button>
      </div>
    }
  `,
})
export class TodoItem {
  readonly todo = input.required<Todo>();

  readonly toggled = output<void>();
  readonly removed = output<void>();
  readonly renamed = output<string>();

  protected readonly editing = signal(false);
  private readonly editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  constructor() {
    // Focus the edit box as soon as it appears in the DOM.
    afterRenderEffect(() => this.editInput()?.nativeElement.focus());
  }

  protected save(title: string): void {
    if (!this.editing()) return; // already saved or cancelled
    this.editing.set(false);
    this.renamed.emit(title);
  }

  protected cancel(): void {
    this.editing.set(false);
  }
}
```

Things to notice:

- `input.required<Todo>()` means the parent **must** pass a todo. `todo()` reads it like any other signal.
- `output<void>()` and `output<string>()` create events. The parent listens with `(toggled)="…"`.
- The `host` object adds the CSS classes `completed` and `editing` to the `<app-todo-item>` element. Use `host` instead of `@HostBinding`.
- `#editInput` is a **template reference variable**. `save(editInput.value)` reads the text straight from the DOM element, so we don't need a form for one input.
- `viewChild()` is a **signal query**. It becomes the element once `@if (editing())` creates it. `afterRenderEffect()` runs after Angular updates the DOM, which makes it the right place to call `.focus()`.
- `save()` checks `editing()` first. When <kbd>Enter</kbd> saves and hides the input, the browser may also fire `blur`. The check stops the todo from being saved twice.

## Step 7: The footer (counter + filter links)

Create `src/app/todos/todo-footer.ts`:

```ts title="src/app/todos/todo-footer.ts"
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TodoFilter } from './todo';

@Component({
  selector: 'app-todo-footer',
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'footer' },
  template: `
    <span class="todo-count">
      <strong>{{ activeCount() }}</strong> {{ activeCount() === 1 ? 'item' : 'items' }} left
    </span>

    <nav class="filters" aria-label="Filter todos">
      @for (link of links; track link.filter) {
        <a [routerLink]="['/', link.filter]" routerLinkActive="selected" ariaCurrentWhenActive="page">
          {{ link.label }}
        </a>
      }
    </nav>

    @if (completedCount() > 0) {
      <button type="button" class="clear-completed" (click)="clearCompleted.emit()">
        Clear completed
      </button>
    }
  `,
})
export class TodoFooter {
  readonly activeCount = input.required<number>();
  readonly completedCount = input.required<number>();
  readonly clearCompleted = output<void>();

  protected readonly links: { filter: TodoFilter; label: string }[] = [
    { filter: 'all', label: 'All' },
    { filter: 'active', label: 'Active' },
    { filter: 'completed', label: 'Completed' },
  ];
}
```

The filters are plain links: `/all`, `/active`, `/completed`. `routerLinkActive="selected"` adds the `selected` class to the link for the current URL. `ariaCurrentWhenActive="page"` tells screen readers which filter is active. Because the filter lives in the URL, it survives a refresh, and the browser's Back button works too.

## Step 8: The page that puts it all together

Create `src/app/todos/todo-page.ts`:

```ts title="src/app/todos/todo-page.ts"
import { Component, computed, inject, input } from '@angular/core';
import { filterTodos, toTodoFilter, TodoFilter } from './todo';
import { TodoFooter } from './todo-footer';
import { TodoForm } from './todo-form';
import { TodoItem } from './todo-item';
import { TodoStore } from './todo-store';

@Component({
  selector: 'app-todo-page',
  imports: [TodoForm, TodoItem, TodoFooter],
  template: `
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <app-todo-form />
      </header>

      @if (store.todos().length > 0) {
        <section class="main">
          <label class="toggle-all">
            <input type="checkbox" [checked]="store.allCompleted()" (change)="store.toggleAll()" />
            Mark all as complete
          </label>

          <ul class="todo-list">
            @for (todo of visibleTodos(); track todo.id) {
              <li>
                <app-todo-item
                  [todo]="todo"
                  (toggled)="store.toggle(todo.id)"
                  (removed)="store.remove(todo.id)"
                  (renamed)="store.rename(todo.id, $event)"
                />
              </li>
            } @empty {
              <li class="empty">Nothing to show here.</li>
            }
          </ul>
        </section>

        <app-todo-footer
          [activeCount]="store.activeCount()"
          [completedCount]="store.completedCount()"
          (clearCompleted)="store.clearCompleted()"
        />
      }
    </section>
  `,
})
export class TodoPage {
  protected readonly store = inject(TodoStore);

  // Filled from the `:filter` route parameter by withComponentInputBinding().
  readonly filter = input<TodoFilter, string | undefined>('all', { transform: toTodoFilter });

  protected readonly visibleTodos = computed(() => filterTodos(this.store.todos(), this.filter()));
}
```

- `filter` is an **input that the router fills in**. When the URL is `/active`, the router sets `filter` to `'active'`. The `transform` checks the value and turns anything unexpected into `'all'`.
- `visibleTodos` is a `computed()` that combines two signals: the store's todos and the current filter. It updates when either one changes.
- `@for (…; track todo.id)` tells Angular how to recognise each row. Then only the rows that changed are re-rendered. `@empty` shows a message when the filtered list is empty.
- The page connects the item's outputs to store methods. For `(renamed)`, `$event` holds the new title.

## Step 9: Routes, config, and the root component

Replace `src/app/app.routes.ts`:

```ts title="src/app/app.routes.ts"
import { Routes } from '@angular/router';
import { TodoPage } from './todos/todo-page';

export const routes: Routes = [
  { path: '', redirectTo: 'all', pathMatch: 'full' },
  { path: ':filter', component: TodoPage, title: 'Todos' },
  { path: '**', redirectTo: 'all' },
];
```

The `:filter` segment is a **route parameter**. Visiting `/` redirects to `/all`.

Replace `src/app/app.config.ts`. The only change from the generated file is `withComponentInputBinding()`, which lets the router pass `:filter` to the `filter` input:

```ts title="src/app/app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

Replace `src/app/app.ts`. It now uses an inline template, so you can **delete** `src/app/app.html` and `src/app/app.css`. Also delete `src/app/app.spec.ts`: the generated test looks for a welcome heading that no longer exists, and we write our own tests in Step 12.

```ts title="src/app/app.ts"
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    <footer class="info">
      <p>Double-click a todo to edit it</p>
    </footer>
  `,
})
export class App {}
```

`src/main.ts` stays as the CLI generated it:

```ts title="src/main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

## Step 10: Styles

Replace `src/styles.css` with these global styles. We keep all the CSS in one file, so the components only contain logic and markup.

```css title="src/styles.css"
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font: 16px/1.4 system-ui, sans-serif;
  color: #333;
  background: #f5f5f5;
}

.todoapp {
  max-width: 550px;
  margin: 3rem auto 1rem;
  background: #fff;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.2), 0 25px 50px rgb(0 0 0 / 0.1);
}

.header h1 {
  margin: 0;
  padding: 1rem 0 0.5rem;
  font-size: 4rem;
  font-weight: 200;
  text-align: center;
  color: #b83f45;
}

.new-todo,
.edit {
  width: 100%;
  padding: 1rem;
  font: inherit;
  font-size: 1.25rem;
  border: none;
  border-bottom: 1px solid #eee;
}

.error {
  margin: 0;
  padding: 0.5rem 1rem;
  color: #b00020;
  font-size: 0.875rem;
}

.main {
  position: relative;
  border-top: 1px solid #eee;
}

.toggle-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #777;
  cursor: pointer;
}

.todo-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.todo-list li {
  border-bottom: 1px solid #eee;
}

.todo-list .empty {
  padding: 1rem;
  color: #999;
  text-align: center;
}

app-todo-item {
  display: block;
}

.view {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.view label {
  flex: 1;
  font-size: 1.25rem;
  word-break: break-word;
}

app-todo-item.completed label {
  color: #aaa;
  text-decoration: line-through;
}

.toggle {
  width: 1.5rem;
  height: 1.5rem;
}

.destroy {
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #b83f45;
  cursor: pointer;
  opacity: 0;
}

.view:hover .destroy,
.destroy:focus-visible {
  opacity: 1;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #777;
}

.filters {
  display: flex;
  gap: 0.25rem;
}

.filters a {
  padding: 0.125rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 4px;
  color: inherit;
  text-decoration: none;
}

.filters a.selected {
  border-color: #b83f45;
}

.clear-completed {
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.info {
  text-align: center;
  font-size: 0.75rem;
  color: #999;
}
```

## Step 11: Run the app

```bash
ng serve
```

Open `http://localhost:4200`. You are redirected to `/all`. Now try this:

1. Press <kbd>Enter</kbd> in the empty input. You see "Type something first."
2. Add a few todos. The input clears after each one.
3. Tick a checkbox. The counter goes down.
4. Click **Active** and **Completed**. The URL changes, and so does the list.
5. Double-click a todo, change the text, and press <kbd>Enter</kbd>. Press <kbd>Esc</kbd> to cancel an edit. If you clear the text and save, the todo is deleted.
6. Refresh the page. Your todos are still there (open DevTools → Application → Local Storage → `ng-guide-todos`).

## Step 12: Test it with Vitest

New Angular projects use **Vitest** for unit tests. Create `src/app/todos/todo-store.spec.ts`:

```ts title="src/app/todos/todo-store.spec.ts"
import { TestBed } from '@angular/core/testing';
import { TodoStore } from './todo-store';

describe('TodoStore', () => {
  let store: TodoStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(TodoStore);
  });

  it('adds a trimmed todo', () => {
    store.add('  Learn signals  ');

    expect(store.todos()).toEqual([
      expect.objectContaining({ title: 'Learn signals', completed: false }),
    ]);
    expect(store.activeCount()).toBe(1);
  });

  it('ignores blank titles', () => {
    store.add('   ');
    expect(store.todos()).toEqual([]);
  });

  it('toggles and clears completed todos', () => {
    store.add('A');
    store.add('B');
    store.toggle(store.todos()[0].id);

    expect(store.completedCount()).toBe(1);

    store.clearCompleted();
    expect(store.todos().map((todo) => todo.title)).toEqual(['B']);
  });

  it('saves todos to localStorage', () => {
    store.add('Persist me');
    TestBed.tick(); // flush pending effects

    const saved = JSON.parse(localStorage.getItem('ng-guide-todos') ?? '[]');
    expect(saved[0].title).toBe('Persist me');
  });
});
```

`TestBed.inject(TodoStore)` gives you a fresh store for each test. Effects don't run right away, so `TestBed.tick()` runs any pending effects before we check `localStorage`.

Now test the page component with a filter. Create `src/app/todos/todo-page.spec.ts`:

```ts title="src/app/todos/todo-page.spec.ts"
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TodoPage } from './todo-page';
import { TodoStore } from './todo-store';

describe('TodoPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('shows only completed todos for the "completed" filter', async () => {
    const store = TestBed.inject(TodoStore);
    store.add('Write code');
    store.add('Ship it');
    store.toggle(store.todos()[0].id);

    const fixture = TestBed.createComponent(TodoPage);
    fixture.componentRef.setInput('filter', 'completed');
    await fixture.whenStable();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('app-todo-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Write code');
  });
});
```

- `provideRouter([])` is needed because the footer uses `routerLink`.
- `fixture.componentRef.setInput('filter', 'completed')` sets the input just like the router would.
- `await fixture.whenStable()` waits until Angular has rendered. The app is zoneless, so you don't call `detectChanges()` by hand.

Run the tests:

```bash
ng test
```

You should see `Test Files  2 passed` and `Tests  5 passed`. Use `ng test --watch=false` to run them once, for example in CI. Learn more in [Unit Testing](/testing/unit-testing/) and [Testing Signals](/testing/testing-signals/).

## Common mistakes

| Mistake | Fix |
|---|---|
| `this._todos().push(todo)` | Changing the array in place does not notify signals. Use `update(todos => [...todos, todo])`. |
| Writing to `localStorage` in every method | Save in a single `effect()` that reads the state. |
| Forgetting `withComponentInputBinding()` | `filter` stays `'all'` on every URL. Add it to `provideRouter()`. |
| `[formField]` without importing `FormField` | Add `FormField` (and `FormRoot`) to the component's `imports`. |
| A test that changes a signal and then checks `localStorage` right away | Call `TestBed.tick()` first, so pending effects run. |
| `*ngFor` / `*ngIf` from old tutorials | Use `@for (…; track …)` and `@if`. The old directives are deprecated. |

## Ideas to extend the app

1. **Due dates**: add `dueDate?: string` to `Todo` and an `<input type="date" [formField]="…">` to the form.
2. **Undo delete**: keep the last deleted todo in a signal and show an "Undo" button.
3. **Search**: add a `?q=` query parameter as another input and filter in `visibleTodos`.
4. **Animations**: add `animate.enter="fade-in"` to each `<li>` and define the CSS class (see [Control Flow](/modern/control-flow/)).
5. **Backend sync**: load todos with `httpResource()` (see [httpResource](/modern/http-resource-api/)), or build the [Blog Platform](/projects/blog/) next.

## Key takeaways

- A **signal store** is a service: private writable signals, public read-only signals, `computed()` for derived values, and methods for actions.
- An `effect()` is the right tool to **sync state to the outside world**, such as `localStorage`.
- **Signal Forms** keep the form value in a signal and the validation rules in a schema function. `[formRoot]` and `submission.action` handle submitting.
- Keep presentational components simple: **data in through `input()`, events out through `output()`**.
- With `withComponentInputBinding()`, **route parameters become inputs**, so the URL can hold UI state like filters.

## Next steps

- [Blog Platform – Part 1](/projects/blog/): routing, `httpResource`, and a real REST API
- [Signals](/modern/signals/) · [Computed Signals](/modern/computed-signals/) · [Effects](/modern/effects/)
- [Signal Forms](/modern/signal-forms/)
- [Component Communication](/intermediate/component-communication/)
