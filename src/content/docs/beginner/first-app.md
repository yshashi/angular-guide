---
title: Your First Angular App 🚀
description: Build a complete task manager with Angular 22 step by step — signals, computed values, @for/@if, a child component with input() and output(), effects and Vitest tests.
sidebar:
  order: 3
---

Time to build something real! In this tutorial you'll create a **Task Manager** from scratch with
Angular 22. Along the way you'll use the most important Angular features: components, templates,
signals, `computed()`, the built-in control flow, inputs and outputs, an `effect()` and unit tests.

## What you'll build

A task manager where you can:

- ✅ Add new tasks
- ✅ Mark tasks as done (and undo)
- ✅ Delete tasks
- ✅ Filter tasks: **all**, **active**, **done**
- ✅ See how many tasks are left and clear completed ones
- ✅ Keep your tasks after a page refresh

## What you'll learn

- How to create and run an Angular project
- How to hold state in **signals** and derive values with **`computed()`**
- Template syntax: interpolation, property, event and class bindings, `@for`, `@if`, `@let`
- How to split the UI into a **child component** with `input()` and `output()`
- How to run side effects with **`effect()`**
- How to test your app with **Vitest** and build it for production

:::tip[Before you start]
You need Node.js 22.22.3+, 24.15+ or 26 and the Angular CLI 22. See
[Development Environment](/setup/) if you haven't set them up yet.
:::

## Step 1: Create the project

```bash
ng new task-manager --style=css --ssr=false --ai-config=none
cd task-manager
ng serve
```

The flags answer the setup questions for you (plain CSS, no server-side rendering, no AI files).
Open `http://localhost:4200` — you should see the Angular welcome page. Keep `ng serve` running:
the page updates every time you save a file.

## Step 2: Plan the app

Before writing code, split the UI into components:

```text
App  (src/app/app.ts) — owns the list of tasks and the current filter
├── <form>            — type a task and press Enter or "Add"
├── filter buttons    — all / active / done
├── TaskItem × n      (src/app/task-item/task-item.ts) — shows ONE task
│     ├── checkbox    → tells App "toggle me"   (output)
│     └── ✕ button    → tells App "delete me"   (output)
└── footer            — "2 tasks left", "Clear completed"
```

`App` owns the data. `TaskItem` only **displays** a task it receives (an **input**) and **reports**
clicks back to `App` (an **output**). This "smart parent, simple child" pattern keeps components
small and easy to test.

## Step 3: Describe a task

Create a new file `src/app/task.ts`. A TypeScript **interface** describes the shape of a task, and
a **union type** lists the allowed filters:

```ts title="src/app/task.ts"
export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export type Filter = 'all' | 'active' | 'done';
```

## Step 4: Create the TaskItem component

Let the CLI generate the component files:

```bash
ng generate component task-item
```

This creates `src/app/task-item/` with `task-item.ts`, `task-item.html`, `task-item.css` and
`task-item.spec.ts`. Replace the contents of the first three files:

```ts title="src/app/task-item/task-item.ts"
import { Component, input, output } from '@angular/core';
import { Task } from '../task';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.html',
  styleUrl: './task-item.css',
  host: {
    '[class.done]': 'task().done',
  },
})
export class TaskItem {
  readonly task = input.required<Task>();
  readonly toggled = output<void>();
  readonly removed = output<void>();
}
```

- `input.required<Task>()` declares an **input**: the parent must pass a task. Read it like a
  signal: `task()`.
- `output<void>()` declares an **output** (an event). Calling `toggled.emit()` notifies the parent.
- `host` adds a binding to the component's own element (`<app-task-item>`): it gets the CSS class
  `done` when the task is done.

```html title="src/app/task-item/task-item.html"
<label>
  <input type="checkbox" [checked]="task().done" (change)="toggled.emit()" />
  <span class="title">{{ task().title }}</span>
</label>
<button
  type="button"
  class="delete"
  [attr.aria-label]="'Delete ' + task().title"
  (click)="removed.emit()"
>
  ✕
</button>
```

- `[checked]="task().done"` is a **property binding**: it sets the checkbox's `checked` property.
- `(change)="toggled.emit()"` is an **event binding**: it runs when the checkbox changes.
- `[attr.aria-label]` sets an HTML attribute, so screen readers announce "Delete Learn about signals"
  instead of just "✕".

```css title="src/app/task-item/task-item.css"
:host {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
}

label {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

:host(.done) .title {
  color: #9ca3af;
  text-decoration: line-through;
}

.delete {
  border: none;
  background: none;
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
}
```

`:host` styles the component's own element, and `:host(.done)` applies when the `done` class from
the `host` binding is present. These styles are **scoped**: they only affect `TaskItem`.

## Step 5: Build the App component

Replace `src/app/app.ts`:

```ts title="src/app/app.ts"
import { Component, computed, signal } from '@angular/core';
import { Filter, Task } from './task';
import { TaskItem } from './task-item/task-item';

@Component({
  selector: 'app-root',
  imports: [TaskItem],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly tasks = signal<Task[]>([
    { id: 1, title: 'Install the Angular CLI', done: true },
    { id: 2, title: 'Build my first Angular app', done: false },
    { id: 3, title: 'Learn about signals', done: false },
  ]);
  protected readonly filter = signal<Filter>('all');
  protected readonly filters: Filter[] = ['all', 'active', 'done'];

  protected readonly remaining = computed(() => this.tasks().filter((task) => !task.done).length);

  protected readonly visibleTasks = computed(() => {
    const tasks = this.tasks();
    switch (this.filter()) {
      case 'active':
        return tasks.filter((task) => !task.done);
      case 'done':
        return tasks.filter((task) => task.done);
      default:
        return tasks;
    }
  });

  protected addTask(event: SubmitEvent, input: HTMLInputElement) {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) {
      return;
    }
    this.tasks.update((tasks) => [...tasks, { id: Date.now(), title, done: false }]);
    input.value = '';
  }

  protected toggleTask(id: number) {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  protected removeTask(id: number) {
    this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  protected clearCompleted() {
    this.tasks.update((tasks) => tasks.filter((task) => !task.done));
  }
}
```

Let's unpack the important parts:

- **`signal<Task[]>([...])`** holds the list of tasks. A signal is a value that notifies Angular
  when it changes. Read it by calling it — `this.tasks()`.
- **`computed(...)`** creates a value derived from other signals. `remaining` and `visibleTasks`
  recalculate automatically whenever `tasks` or `filter` change — you never update them by hand.
- **`this.tasks.update(...)`** changes the list by returning a **new array**. We never `push` into
  the existing array — creating new arrays/objects (`[...tasks, newTask]`, `{ ...task, done: true }`)
  is how the signal knows something changed.
- **`protected`** members are available to the component's template but hidden from other code —
  a good default for anything only the template needs.
- `imports: [TaskItem]` makes `<app-task-item>` available in this component's template.

:::note
There is no `changeDetection: ChangeDetectionStrategy.OnPush` here — `OnPush` is the default
since Angular 22, and signals tell Angular exactly when to update.
:::

## Step 6: Write the template

Replace **everything** in `src/app/app.html` (the placeholder welcome page) with:

```html title="src/app/app.html"
<main class="app">
  <h1>📝 My Tasks</h1>

  <form class="new-task" (submit)="addTask($event, titleInput)">
    <input #titleInput placeholder="What needs to be done?" aria-label="New task" />
    <button type="submit">Add</button>
  </form>

  <nav class="filters" aria-label="Filter tasks">
    @for (option of filters; track option) {
      <button type="button" [class.active]="filter() === option" (click)="filter.set(option)">
        {{ option }}
      </button>
    }
  </nav>

  <ul class="task-list">
    @for (task of visibleTasks(); track task.id) {
      <li>
        <app-task-item
          [task]="task"
          (toggled)="toggleTask(task.id)"
          (removed)="removeTask(task.id)"
        />
      </li>
    } @empty {
      <li class="empty">Nothing to show here 🎉</li>
    }
  </ul>

  <footer>
    @let count = remaining();
    <span>{{ count }} {{ count === 1 ? 'task' : 'tasks' }} left</span>

    @if (tasks().length > count) {
      <button type="button" (click)="clearCompleted()">Clear completed</button>
    }
  </footer>
</main>
```

New template syntax in this file:

| Syntax | What it does |
| --- | --- |
| `#titleInput` | A **template reference variable** — a handle to the `<input>` element you can pass to methods |
| `(submit)="addTask($event, titleInput)"` | Runs `addTask` when the form is submitted (Enter key or the Add button). `$event` is the DOM event |
| `@for (… ; track task.id)` | Repeats a block for each item. `track` gives each item a stable identity so Angular only updates what changed |
| `@empty` | Shown when the list is empty |
| `[class.active]="…"` | Adds/removes a CSS class based on a condition |
| `(click)="filter.set(option)"` | Calls a signal's `set()` directly from the template |
| `@let count = remaining();` | Declares a local template variable you can reuse |
| `@if (…) { … }` | Shows a block only when the condition is true |
| `{{ … }}` | **Interpolation** — displays a value as text |

Notice that `addTask()` calls `event.preventDefault()`: without it, the browser would try to
submit the form to a server and reload the page.

## Step 7: Add styles

Replace `src/app/app.css`:

```css title="src/app/app.css"
.app {
  max-width: 32rem;
  margin: 3rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}

h1 {
  text-align: center;
}

.new-task {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.new-task input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.new-task input:focus {
  outline: none;
  border-color: #6d28d9;
}

button {
  padding: 0.5rem 1rem;
  border: 2px solid #6d28d9;
  border-radius: 0.5rem;
  background: #fff;
  color: #6d28d9;
  font: inherit;
  cursor: pointer;
}

.new-task button,
.filters button.active {
  background: #6d28d9;
  color: #fff;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  text-transform: capitalize;
}

.task-list {
  display: grid;
  gap: 0.5rem;
  padding: 0;
  list-style: none;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  color: #4b5563;
}
```

And give the whole page a soft background in the global stylesheet `src/styles.css`:

```css title="src/styles.css"
body {
  margin: 0;
  background: #f9fafb;
  color: #111827;
}
```

Check your browser — you have a working task manager! Add a task, tick it off, switch filters and
clear completed tasks. 🎉

## Step 8: Remember tasks after a refresh

Right now, refreshing the page resets the list. Let's save tasks in the browser's `localStorage`
with an **`effect()`** — a function that runs whenever the signals it reads change.

Update `src/app/app.ts` — the highlighted lines are new or changed:

```ts title="src/app/app.ts" ins={1,5-16,25,43-47}
import { Component, computed, effect, signal } from '@angular/core';
import { Filter, Task } from './task';
import { TaskItem } from './task-item/task-item';

const STORAGE_KEY = 'my-tasks';

const STARTER_TASKS: Task[] = [
  { id: 1, title: 'Install the Angular CLI', done: true },
  { id: 2, title: 'Build my first Angular app', done: false },
  { id: 3, title: 'Learn about signals', done: false },
];

function loadTasks(): Task[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as Task[]) : STARTER_TASKS;
}

@Component({
  selector: 'app-root',
  imports: [TaskItem],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly tasks = signal<Task[]>(loadTasks());
  protected readonly filter = signal<Filter>('all');
  protected readonly filters: Filter[] = ['all', 'active', 'done'];

  protected readonly remaining = computed(() => this.tasks().filter((task) => !task.done).length);

  protected readonly visibleTasks = computed(() => {
    const tasks = this.tasks();
    switch (this.filter()) {
      case 'active':
        return tasks.filter((task) => !task.done);
      case 'done':
        return tasks.filter((task) => task.done);
      default:
        return tasks;
    }
  });

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks()));
    });
  }

  protected addTask(event: SubmitEvent, input: HTMLInputElement) {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) {
      return;
    }
    this.tasks.update((tasks) => [...tasks, { id: Date.now(), title, done: false }]);
    input.value = '';
  }

  protected toggleTask(id: number) {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  protected removeTask(id: number) {
    this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  protected clearCompleted() {
    this.tasks.update((tasks) => tasks.filter((task) => !task.done));
  }
}
```

- `loadTasks()` reads saved tasks (or falls back to the starter tasks) when the component is created.
- The `effect()` reads `this.tasks()`, so Angular re-runs it every time the task list changes —
  saving the latest list automatically.

Refresh the page: your tasks are still there.

:::caution
`localStorage` only exists in the browser. This is fine for this app, but if you later enable
server-side rendering (SSR), code like this must only run in the browser — see
[SSR Introduction](/ssr/introduction/).
:::

## Step 9: Test your app

New Angular projects use **Vitest** for unit tests. Because we changed the app, update the
generated tests too.

Replace `src/app/app.spec.ts`:

```ts title="src/app/app.spec.ts"
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('shows the starter tasks', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('app-task-item');
    expect(items.length).toBe(3);
  });

  it('adds a new task', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    const input = page.querySelector<HTMLInputElement>('.new-task input')!;
    input.value = 'Write my first test';
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(page.textContent).toContain('Write my first test');
    expect(page.querySelectorAll('app-task-item').length).toBe(4);
  });
});
```

Replace `src/app/task-item/task-item.spec.ts`. `TaskItem` has a **required** input, so the test
must set it with `setInput()` before rendering:

```ts title="src/app/task-item/task-item.spec.ts"
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskItem } from './task-item';

describe('TaskItem', () => {
  let fixture: ComponentFixture<TaskItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskItem],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskItem);
    fixture.componentRef.setInput('task', { id: 1, title: 'Test task', done: false });
    await fixture.whenStable();
  });

  it('shows the task title', () => {
    expect(fixture.nativeElement.textContent).toContain('Test task');
  });

  it('emits "removed" when the delete button is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.removed.subscribe(spy);

    fixture.nativeElement.querySelector('button.delete').click();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

Run the tests:

```bash
ng test
```

```text
 Test Files  2 passed (2)
      Tests  4 passed (4)
```

`ng test` keeps watching your files and re-runs tests when you save. Press <kbd>q</kbd> to quit, or
run `ng test --watch=false` for a single run. Learn more in
[Unit Testing Deep Dive](/testing/unit-testing/).

## Step 10: Build for production

```bash
ng build
```

The optimised app is written to `dist/task-manager/browser/`. Those static files can be hosted on
any web server — see [Deployment Strategies](/deployment/strategies/).

## The finished project

```text
src/
├── app/
│   ├── task-item/
│   │   ├── task-item.css
│   │   ├── task-item.html
│   │   ├── task-item.spec.ts
│   │   └── task-item.ts
│   ├── app.config.ts      (unchanged)
│   ├── app.css
│   ├── app.html
│   ├── app.routes.ts      (unchanged — we'll use routing later)
│   ├── app.spec.ts
│   ├── app.ts
│   └── task.ts
├── index.html             (unchanged)
├── main.ts                (unchanged)
└── styles.css
```

## How it all works together

```text
user types "Buy milk" + Enter
  → (submit) runs addTask()
  → tasks.update(...) sets a NEW array in the signal
  → computed signals visibleTasks and remaining recalculate
  → the effect saves the list to localStorage
  → Angular re-renders only the parts of the template that read those signals
```

## Common mistakes

- **Forgetting the parentheses on a signal.** `{{ tasks.length }}` is wrong; use
  `{{ tasks().length }}`. A signal is a function — call it to read the value.
- **Mutating the array in place.** `this.tasks().push(task)` changes the array but doesn't notify
  Angular. Use `this.tasks.update((tasks) => [...tasks, task])`.
- **Forgetting `track` in `@for`.** It's required. Track a unique id (`track task.id`).
- **Forgetting to import the child component.** If `<app-task-item>` isn't in `App`'s `imports`,
  the compiler reports `'app-task-item' is not a known element`.
- **Using the input name instead of reading it.** Inside `TaskItem`, `task` is a signal: use
  `task().title`, not `task.title`.
- **Leaving the default tests unchanged.** The generated tests check for the welcome page — update
  them when you change the UI, as in Step 9.

## What you learned

| Concept | Where you used it |
| --- | --- |
| Components & selectors | `App`, `TaskItem` (`<app-task-item>`) |
| Signals & `computed()` | `tasks`, `filter`, `remaining`, `visibleTasks` |
| `effect()` | Saving tasks to `localStorage` |
| Inputs & outputs | `input.required<Task>()`, `output<void>()` |
| Template bindings | `{{ }}`, `[checked]`, `(click)`, `[class.active]`, `[attr.aria-label]` |
| Control flow | `@for` + `track` + `@empty`, `@if`, `@let` |
| Host bindings | `host: { '[class.done]': 'task().done' }` |
| Testing | `TestBed`, `fixture.whenStable()`, `setInput()`, `vi.fn()` |
| CLI | `ng new`, `ng generate component`, `ng serve`, `ng test`, `ng build` |

## Challenges 🏆

Try these on your own to practise:

1. **Priorities** — add `priority: 'low' | 'medium' | 'high'` to `Task` and show a coloured badge.
2. **Edit a task** — double-click a title to edit it (hint: a `model()` or an output with the new title).
3. **Search** — add a search box and filter `visibleTasks` by title.
4. **"Mark all as done"** button — one `update()` call with `map()`.
5. **Move state into a service** — create a `TaskStore` with `ng generate service task-store` and
   inject it into `App` (see [Services & DI](/beginner/services/)).

## Next steps

1. **[Components Basics](/beginner/components/)** — everything about components
2. **[Templates & Data Binding](/beginner/templates/)** — master template syntax
3. **[Services & DI](/beginner/services/)** — move your task logic into a service
4. **[Todo App with Signals](/projects/todo-app/)** — a bigger project using the same ideas
