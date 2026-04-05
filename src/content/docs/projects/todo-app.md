---
title: Todo App with Signals
description: Build a complete todo application using Angular Signals, standalone components, and modern best practices
sidebar:
  order: 1
---

Build a fully functional Todo App using **Angular Signals**, **standalone components**, and **modern Angular best practices**. This project covers CRUD operations, local storage, filtering, and more!

## 🎯 What You'll Build

A modern Todo application with:

- ✅ Add, edit, delete, and toggle todos
- ✅ Filter by status (All, Active, Completed)
- ✅ Mark all as complete
- ✅ Clear completed todos
- ✅ Persist data in localStorage
- ✅ Responsive design
- ✅ TypeScript strict mode
- ✅ Signal-based state management

## 📋 Prerequisites

Before starting this project, make sure you have:

- **Node.js** (v18 or higher) installed
- **Angular CLI** installed globally
- Basic understanding of TypeScript
- Familiarity with Angular components and signals

**For project setup instructions, please refer to:**
- [Prerequisites & Setup Guide](/getting-started/prerequisites/)
- [Creating Your First App](/getting-started/first-app/)

## 🚀 Project Setup

### Step 1: Create New Angular Project

```bash
ng new todo-app --routing=false --style=css --strict
cd todo-app
```

**Options explained:**
- `--routing=false` - We don't need routing for this simple app
- `--style=css` - Use CSS for styling
- `--strict` - Enable strict TypeScript checking

### Step 2: Project Structure

Create the following folder structure:

```
src/app/
├── components/
│   ├── todo-list/
│   │   └── todo-list.component.ts
│   ├── todo-item/
│   │   └── todo-item.component.ts
│   ├── todo-form/
│   │   └── todo-form.component.ts
│   └── todo-filters/
│       └── todo-filters.component.ts
├── models/
│   └── todo.model.ts
├── services/
│   └── todo.service.ts
└── app.component.ts
```

## 📝 Step-by-Step Implementation

### Step 1: Create the Todo Model

Create `src/app/models/todo.model.ts`:

```typescript
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';
```

### Step 2: Create the Todo Service

Create `src/app/services/todo.service.ts`:

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Todo, FilterType } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  // State
  private todos = signal<Todo[]>(this.loadFromStorage());
  private filter = signal<FilterType>('all');

  // Public read-only signals
  allTodos = this.todos.asReadonly();
  currentFilter = this.filter.asReadonly();

  // Computed values
  filteredTodos = computed(() => {
    const todos = this.todos();
    const filterType = this.filter();

    switch (filterType) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  });

  activeCount = computed(() => 
    this.todos().filter(todo => !todo.completed).length
  );

  completedCount = computed(() => 
    this.todos().filter(todo => todo.completed).length
  );

  // Actions
  addTodo(title: string): void {
    if (!title.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: new Date()
    };

    this.todos.update(todos => [...todos, newTodo]);
    this.saveToStorage();
  }

  toggleTodo(id: string): void {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
    this.saveToStorage();
  }

  deleteTodo(id: string): void {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
    this.saveToStorage();
  }

  updateTodo(id: string, title: string): void {
    if (!title.trim()) return;

    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, title: title.trim() } : todo
      )
    );
    this.saveToStorage();
  }

  toggleAll(): void {
    const allCompleted = this.todos().every(todo => todo.completed);
    
    this.todos.update(todos =>
      todos.map(todo => ({ ...todo, completed: !allCompleted }))
    );
    this.saveToStorage();
  }

  clearCompleted(): void {
    this.todos.update(todos => todos.filter(todo => !todo.completed));
    this.saveToStorage();
  }

  setFilter(filter: FilterType): void {
    this.filter.set(filter);
  }

  // LocalStorage
  private saveToStorage(): void {
    localStorage.setItem('todos', JSON.stringify(this.todos()));
  }

  private loadFromStorage(): Todo[] {
    const stored = localStorage.getItem('todos');
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return parsed.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt)
      }));
    } catch {
      return [];
    }
  }
}
```

### Step 3: Create Todo Form Component

Create `src/app/components/todo-form/todo-form.component.ts`:

```typescript
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-form',
  imports: [FormsModule],
  template: `
    <form (submit)="onSubmit($event)" class="todo-form">
      <input
        type="text"
        [(ngModel)]="newTodoTitle"
        placeholder="What needs to be done?"
        class="todo-input"
        [disabled]="isSubmitting()"
      >
    </form>
  `,
  styles: [`
    .todo-form {
      margin-bottom: 20px;
    }

    .todo-input {
      width: 100%;
      padding: 16px;
      font-size: 24px;
      border: none;
      border-bottom: 1px solid #ededed;
      outline: none;
      box-sizing: border-box;
    }

    .todo-input::placeholder {
      font-style: italic;
      color: #e6e6e6;
    }

    .todo-input:disabled {
      opacity: 0.6;
    }
  `]
})
export class TodoFormComponent {
  private todoService = inject(TodoService);
  
  newTodoTitle = '';
  isSubmitting = signal(false);

  onSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.newTodoTitle.trim()) return;

    this.isSubmitting.set(true);
    this.todoService.addTodo(this.newTodoTitle);
    this.newTodoTitle = '';
    this.isSubmitting.set(false);
  }
}
```

### Step 4: Create Todo Item Component

Create `src/app/components/todo-item/todo-item.component.ts`:

```typescript
import { Component, input, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-item',
  imports: [FormsModule],
  template: `
    <li [class.completed]="todo().completed" [class.editing]="isEditing()">
      <div class="view">
        <input
          type="checkbox"
          class="toggle"
          [checked]="todo().completed"
          (change)="onToggle()"
        >
        <label (dblclick)="startEdit()">{{ todo().title }}</label>
        <button class="destroy" (click)="onDelete()"></button>
      </div>
      
      @if (isEditing()) {
        <input
          #editInput
          type="text"
          class="edit"
          [(ngModel)]="editTitle"
          (blur)="finishEdit()"
          (keyup.enter)="finishEdit()"
          (keyup.escape)="cancelEdit()"
        >
      }
    </li>
  `,
  styles: [`
    li {
      position: relative;
      font-size: 24px;
      border-bottom: 1px solid #ededed;
      list-style: none;
    }

    li:last-child {
      border-bottom: none;
    }

    li.editing {
      border-bottom: none;
      padding: 0;
    }

    li.editing .view {
      display: none;
    }

    li.completed label {
      color: #d9d9d9;
      text-decoration: line-through;
    }

    .view {
      display: flex;
      align-items: center;
      padding: 15px;
    }

    .toggle {
      width: 40px;
      height: 40px;
      margin-right: 15px;
      cursor: pointer;
    }

    label {
      flex: 1;
      cursor: pointer;
      word-break: break-all;
    }

    .destroy {
      width: 40px;
      height: 40px;
      margin-left: auto;
      border: none;
      background: none;
      font-size: 30px;
      color: #cc9a9a;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .destroy:after {
      content: '×';
    }

    li:hover .destroy {
      opacity: 1;
    }

    .edit {
      width: 100%;
      padding: 12px 16px;
      font-size: 24px;
      border: 1px solid #999;
      box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
    }
  `]
})
export class TodoItemComponent {
  private todoService = inject(TodoService);
  
  todo = input.required<Todo>();
  
  isEditing = signal(false);
  editTitle = '';

  onToggle(): void {
    this.todoService.toggleTodo(this.todo().id);
  }

  onDelete(): void {
    this.todoService.deleteTodo(this.todo().id);
  }

  startEdit(): void {
    this.editTitle = this.todo().title;
    this.isEditing.set(true);
  }

  finishEdit(): void {
    if (this.isEditing()) {
      this.todoService.updateTodo(this.todo().id, this.editTitle);
      this.isEditing.set(false);
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }
}
```

### Step 5: Create Todo Filters Component

Create `src/app/components/todo-filters/todo-filters.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { FilterType } from '../../models/todo.model';

@Component({
  selector: 'app-todo-filters',
  template: `
    <footer class="footer">
      <span class="todo-count">
        <strong>{{ todoService.activeCount() }}</strong>
        {{ todoService.activeCount() === 1 ? 'item' : 'items' }} left
      </span>

      <ul class="filters">
        <li>
          <a
            [class.selected]="todoService.currentFilter() === 'all'"
            (click)="setFilter('all')"
          >
            All
          </a>
        </li>
        <li>
          <a
            [class.selected]="todoService.currentFilter() === 'active'"
            (click)="setFilter('active')"
          >
            Active
          </a>
        </li>
        <li>
          <a
            [class.selected]="todoService.currentFilter() === 'completed'"
            (click)="setFilter('completed')"
          >
            Completed
          </a>
        </li>
      </ul>

      @if (todoService.completedCount() > 0) {
        <button class="clear-completed" (click)="clearCompleted()">
          Clear completed
        </button>
      }
    </footer>
  `,
  styles: [`
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      color: #777;
      border-top: 1px solid #e6e6e6;
    }

    .todo-count {
      text-align: left;
    }

    .filters {
      display: flex;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .filters a {
      padding: 3px 7px;
      border: 1px solid transparent;
      border-radius: 3px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .filters a:hover {
      border-color: rgba(175, 47, 47, 0.1);
    }

    .filters a.selected {
      border-color: rgba(175, 47, 47, 0.2);
    }

    .clear-completed {
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      color: inherit;
    }

    .clear-completed:hover {
      text-decoration: underline;
    }
  `]
})
export class TodoFiltersComponent {
  todoService = inject(TodoService);

  setFilter(filter: FilterType): void {
    this.todoService.setFilter(filter);
  }

  clearCompleted(): void {
    this.todoService.clearCompleted();
  }
}
```

### Step 6: Create Todo List Component

Create `src/app/components/todo-list/todo-list.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { TodoItemComponent } from '../todo-item/todo-item.component';

@Component({
  selector: 'app-todo-list',
  imports: [TodoItemComponent],
  template: `
    <section class="main">
      @if (todoService.allTodos().length > 0) {
        <input
          id="toggle-all"
          class="toggle-all"
          type="checkbox"
          [checked]="allCompleted()"
          (change)="toggleAll()"
        >
        <label for="toggle-all">Mark all as complete</label>
      }

      <ul class="todo-list">
        @for (todo of todoService.filteredTodos(); track todo.id) {
          <app-todo-item [todo]="todo" />
        }
      </ul>
    </section>
  `,
  styles: [`
    .main {
      position: relative;
      border-top: 1px solid #e6e6e6;
    }

    .toggle-all {
      width: 1px;
      height: 1px;
      border: none;
      opacity: 0;
      position: absolute;
    }

    .toggle-all + label {
      width: 60px;
      height: 34px;
      font-size: 0;
      position: absolute;
      top: -52px;
      left: -13px;
      transform: rotate(90deg);
    }

    .toggle-all + label:before {
      content: '❯';
      font-size: 22px;
      color: #e6e6e6;
      padding: 10px 27px;
    }

    .toggle-all:checked + label:before {
      color: #737373;
    }

    .todo-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `]
})
export class TodoListComponent {
  todoService = inject(TodoService);

  allCompleted(): boolean {
    const todos = this.todoService.allTodos();
    return todos.length > 0 && todos.every(todo => todo.completed);
  }

  toggleAll(): void {
    this.todoService.toggleAll();
  }
}
```

### Step 7: Update Main App Component

Update `src/app/app.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { TodoFormComponent } from './components/todo-form/todo-form.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoFiltersComponent } from './components/todo-filters/todo-filters.component';
import { TodoService } from './services/todo.service';

@Component({
  selector: 'app-root',
  imports: [
    TodoFormComponent,
    TodoListComponent,
    TodoFiltersComponent
  ],
  template: `
    <div class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <app-todo-form />
      </header>

      @if (todoService.allTodos().length > 0) {
        <app-todo-list />
        <app-todo-filters />
      }
    </div>

    <footer class="info">
      <p>Double-click to edit a todo</p>
      <p>Created with Angular Signals</p>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #4d4d4d;
      background: #f5f5f5;
      min-height: 100vh;
    }

    .todoapp {
      background: #fff;
      margin: 130px auto 40px;
      max-width: 550px;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
                  0 25px 50px 0 rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 100px;
      font-weight: 100;
      text-align: center;
      color: rgba(175, 47, 47, 0.15);
      margin: 0;
      padding: 20px 0;
    }

    .info {
      margin: 65px auto 0;
      color: #bfbfbf;
      font-size: 10px;
      text-align: center;
    }

    .info p {
      line-height: 1;
    }
  `]
})
export class AppComponent {
  todoService = inject(TodoService);
}
```

### Step 8: Update Global Styles

Update `src/styles.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4em;
  background: #f5f5f5;
  color: #4d4d4d;
  font-weight: 300;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-size: 100%;
  vertical-align: baseline;
  font-family: inherit;
  font-weight: inherit;
  color: inherit;
}

button:focus {
  outline: none;
}
```

## 🚀 Running the Application

```bash
# Start development server
ng serve

# Open browser to
http://localhost:4200
```

## ✅ Testing Your App

Try these features:

1. **Add todos** - Type and press Enter
2. **Toggle completion** - Click checkbox
3. **Edit todo** - Double-click on todo text
4. **Delete todo** - Click × button
5. **Filter todos** - Click All/Active/Completed
6. **Toggle all** - Click the down arrow
7. **Clear completed** - Click "Clear completed" button
8. **Refresh page** - Data persists in localStorage!

## 🎯 Key Concepts Demonstrated

### ✅ Angular Best Practices

- **Standalone components** - No NgModules needed
- **Signals for state** - Reactive state management
- **Computed values** - Derived state automatically updates
- **inject() function** - Modern dependency injection
- **input() and output()** - Modern component API
- **Native control flow** - @if, @for instead of directives

### ✅ TypeScript Best Practices

- **Strict mode** - Type safety everywhere
- **Interfaces** - Clear data structures
- **Type inference** - Let TypeScript infer types
- **Readonly signals** - Expose read-only state

### ✅ Architecture Patterns

- **Service layer** - Business logic separated
- **Component composition** - Small, focused components
- **Unidirectional data flow** - Predictable state changes
- **LocalStorage persistence** - Data survives refresh

## 🚀 Next Steps

Enhance your Todo app with:

1. **Add categories/tags** to todos
2. **Add due dates** with date picker
3. **Add priority levels** (high, medium, low)
4. **Add search functionality**
5. **Add animations** with Angular animations
6. **Add dark mode** toggle
7. **Add backend API** integration
8. **Add user authentication**
9. **Add unit tests** with Vitest (the default test runner since Angular 19)
10. **Deploy to production** (Netlify, Vercel, etc.)

## 📚 Related Topics

- [Signals Guide](/modern/signals/)
- [Reactive Forms](/intermediate/reactive-forms/)
- [Services & DI](/basics/services/)
- [Component Communication](/basics/component-communication/)
- [Testing](/testing/unit-testing/)

---

**Congratulations!** 🎉 You've built a complete Todo app using modern Angular best practices! This project demonstrates signals, standalone components, and clean architecture patterns.
