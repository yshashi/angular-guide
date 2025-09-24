---
title: Angular Architecture 🏗️
description: Understanding Angular's architecture and core concepts
sidebar:
  order: 2
---


Angular follows a component-based architecture where everything is organized around components, services, and modules. Here's how it all fits together.

## 🏗️ Application Structure

**V19 and below**
```
src/
├── app/
│   ├── app.component.ts    # Root component
│   ├── app.component.html  # Root template
│   ├── app.component.css   # Root styles
│   ├── app.config.ts       # App configuration
│   └── main.ts            # Bootstrap file
├── assets/                # Static files
└── environments/          # Environment configs
```

**V20 and above**
```
src/
├── app/
│   ├── app.ts    # Root component
│   ├── app.css   # Root styles
│   ├── app.html  # Root template
│   ├── app.config.ts      # App configuration
│   ├── app.routes.ts      # App routes
│   └── main.ts            # Bootstrap file
├── assets/                # Static files
└── environments/          # Environment configs
```

## 🧩 Core Building Blocks

### Components
- **Purpose**: UI building blocks that combine HTML, CSS, and TypeScript
- **Structure**: Each component has a class, template, and optional styles
- **Example**: A header, sidebar, or product card

### Services
- **Purpose**: Share data and logic across components
- **Structure**: Injectable classes that handle business logic
- **Example**: API calls, data storage, authentication

### Modules (Traditional)
- **Purpose**: Group related components, services, and other code
- **Structure**: `@NgModule` decorator with imports, declarations, providers
- **Note**: Being replaced by standalone components

### Standalone Components (Modern)
- **Purpose**: Self-contained components without modules
- **Structure**: `standalone: true` with direct imports and latest version we don't need to specify `standalone: true` whatever component we create it will be standalone by default
- **Benefit**: Simpler, more flexible architecture

## 🔄 Data Flow

```
Parent Component
       ↓ @Input()
Child Component
       ↑ @Output()
Parent Component
```

**Modern Approach with Signals**
```
Parent Component
       ↓ input()
Child Component
       ↑ output()
Parent Component
```

- **Input**: Data flows down from parent to child
- **Output**: Events flow up from child to parent
- **Services**: Share data between any components

## ⚡ Change Detection

Angular automatically updates the UI when data changes:

1. **Trigger**: User clicks, HTTP responses, timers
2. **Check**: Angular scans for data changes
3. **Update**: DOM updates reflect new data

## 🚀 Bootstrap Process

1. `main.ts` starts the application
2. Root component loads
3. Component tree builds
4. Change detection begins

## 📝 Key Concepts

- **Dependency Injection**: Angular provides services to components automatically
- **Decorators**: `@Component`, `@Injectable`, `@Input`, `@Output`
- **Lifecycle Hooks**: `ngOnInit`, `ngOnDestroy`, etc.
- **Templates**: HTML with Angular syntax for data binding

## ✅ Quick Checklist

- [ ] Understand component-based architecture
- [ ] Know the difference between modules and standalone components
- [ ] Grasp input/output data flow
- [ ] Recognize the role of services
- [ ] Understand change detection basics

## 🎯 Next Steps

1. **[Your First App](/beginner/first-app/)** - Build a simple Angular app
2. **[Components Basics](/beginner/components/)** - Deep dive into components
3. **[Services & DI](/beginner/services/)** - Learn dependency injection
