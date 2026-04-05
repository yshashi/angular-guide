---
title: Your First Angular App 🚀
description: Build your first Angular application step by step
sidebar:
  order: 3
---

Let's build a simple **Task Manager** app to learn Angular fundamentals. You'll create, display, and manage tasks with a clean, interactive interface.

## 🎯 What We'll Build

A task manager with:
- Add new tasks
- Mark tasks as complete
- Delete tasks
- Filter tasks (All, Active, Completed)

## 🛠️ Step 1: Create New Project

```bash
# Create new Angular project
ng new task-manager --routing=false --style=css

# Navigate to project
cd task-manager

# Start development server
ng serve
```

Visit `http://localhost:4200` - you should see the Angular welcome page!

## 📁 Step 2: Project Structure

```
src/app/
├── app.ts      # Root component
├── app.html    # Root template
├── app.css     # Root styles
└── app.config.ts         # App configuration
```

## 🧹 Step 3: Clean Up App Component

Replace `app.html` content:

```html
<div class="app">
  <header>
    <h1>🎯 Task Manager</h1>
  </header>
  
  <main>
    <div class="task-input">
      <input 
        type="text" 
        placeholder="Add a new task..."
        [(ngModel)]="newTask"
        (keyup.enter)="addTask()">
      <button (click)="addTask()">Add Task</button>
    </div>

    <div class="filters">
      <button 
        [class.active]="filter === 'all'"
        (click)="setFilter('all')">
        All ({{tasks.length}})
      </button>
      <button 
        [class.active]="filter === 'active'"
        (click)="setFilter('active')">
        Active ({{activeTasks.length}})
      </button>
      <button 
        [class.active]="filter === 'completed'"
        (click)="setFilter('completed')">
        Completed ({{completedTasks.length}})
      </button>
    </div>

    <div class="task-list">
      @for (task of filteredTasks; track task.id) {
        <div 
          class="task-item"
          [class.completed]="task.completed">
          
          <input 
            type="checkbox" 
            [checked]="task.completed"
            (change)="toggleTask(task.id)">
          
          <span class="task-text">{{task.text}}</span>
          
          <button 
            class="delete-btn"
            (click)="deleteTask(task.id)">
            ❌
          </button>
        </div>
      } @empty {
        <p class="empty-state">No tasks match the current filter</p>
      }
    </div>

    <div class="empty-state">
      @if(tasks.length === 0) {
        <p>No tasks yet. Add one above! 👆</p>
      }
    </div>
  </main>
</div>
```

## 💻 Step 4: Add Component Logic

Update `app.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  newTask = '';
  filter: 'all' | 'active' | 'completed' = 'all';
  
  tasks: Task[] = [
    { id: 1, text: 'Learn Angular basics', completed: false },
    { id: 2, text: 'Build first app', completed: false },
    { id: 3, text: 'Deploy to production', completed: false }
  ];

  get activeTasks(): Task[] {
    return this.tasks.filter(task => !task.completed);
  }

  get completedTasks(): Task[] {
    return this.tasks.filter(task => task.completed);
  }

  get filteredTasks(): Task[] {
    switch (this.filter) {
      case 'active':
        return this.activeTasks;
      case 'completed':
        return this.completedTasks;
      default:
        return this.tasks;
    }
  }

  addTask(): void {
    if (this.newTask.trim()) {
      const newId = Math.max(...this.tasks.map(t => t.id), 0) + 1;
      this.tasks.push({
        id: newId,
        text: this.newTask.trim(),
        completed: false
      });
      this.newTask = '';
    }
  }

  toggleTask(id: number): void {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  }

  deleteTask(id: number): void {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter = filter;
  }
}
```

## 🎨 Step 5: Add Styles

Update `app.css`:

```css
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

header h1 {
  color: #333;
  margin: 0;
}

.task-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.task-input input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.task-input input:focus {
  outline: none;
  border-color: #007bff;
}

.task-input button {
  padding: 12px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.task-input button:hover {
  background: #0056b3;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filters button {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.filters button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.task-list {
  space-y: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
}

.task-item.completed {
  background: #f8f9fa;
  opacity: 0.7;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #6c757d;
}

.task-text {
  flex: 1;
  font-size: 16px;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
}

.delete-btn:hover {
  background: #fee;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  margin-top: 40px;
}

.empty-state p {
  font-size: 18px;
}
```

## 🚀 Step 6: Test Your App

Your app should now:
- ✅ Display sample tasks
- ✅ Add new tasks when you type and press Enter
- ✅ Toggle task completion with checkboxes
- ✅ Delete tasks with the ❌ button
- ✅ Filter between All, Active, and Completed tasks
- ✅ Show task counts in filter buttons

## 🎓 What You Learned

### Angular Concepts
- **Components**: Created a standalone component
- **Templates**: Used Angular template syntax
- **Data Binding**: Two-way binding with `[(ngModel)]`
- **Event Binding**: Handled clicks with `(click)`
- **Property Binding**: Dynamic classes with `[class]`
- **Control Flow**: `@for` and `@if`
- **Interpolation**: Displayed data with `{{}}`

### TypeScript Features
- **Interfaces**: Defined `Task` interface
- **Arrays**: Managed task collections
- **Methods**: Created component methods
- **Getters**: Computed properties for filtered data

## 🎯 Next Steps

1. **[Components Basics](/beginner/components/)** - Deep dive into components
2. **[Templates & Data Binding](/beginner/templates/)** - Master template syntax
3. **[Services & DI](/beginner/services/)** - Move data logic to services

## 🏆 Challenges

Try enhancing your app:
- Add task priorities (High, Medium, Low)
- Add due dates
- Save tasks to localStorage
- Add task categories/tags
- Implement task search

---

**Congratulations!** 🎉 You've built your first Angular application with real functionality. You're now ready to dive deeper into Angular concepts!
