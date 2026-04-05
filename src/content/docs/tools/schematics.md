---
title: Angular Schematics 🏭
description: Automate code generation and project transformations with Angular schematics
sidebar:
  order: 7
---

Angular Schematics are code generators and transformers that power the Angular CLI. Every time you run `ng generate component` or `ng add @angular/material`, you're using schematics behind the scenes. You can also create your own custom schematics to automate repetitive tasks, enforce team conventions, and scaffold complex feature structures.

## 🎯 What Are Schematics?

A schematic is a template-based code generator that:

- **Creates files** — Generates new components, services, modules, etc.
- **Transforms existing code** — Modifies files, updates imports, adds configuration
- **Runs migrations** — Updates your codebase when libraries change APIs

Schematics operate on a **virtual file system** (called a Tree), which means changes are staged and applied atomically. If a schematic fails partway through, no files are modified.

## 🏗️ Built-in Schematics

The Angular CLI ships with schematics for all common code generation tasks:

### Generation Schematics

```bash
# Components
ng generate component features/user-profile
ng g c shared/ui/button --inline-template --skip-tests

# Services
ng generate service core/services/auth

# Directives
ng generate directive shared/directives/highlight

# Pipes
ng generate pipe shared/pipes/truncate

# Guards
ng generate guard core/guards/auth

# Interceptors
ng generate interceptor core/interceptors/logging

# Interfaces and Enums
ng generate interface models/user
ng generate enum models/role

# Environment files
ng generate environments
```

### Common Options

Most generation schematics share these options:

| Option | Description |
|--------|-------------|
| `--dry-run` / `-d` | Preview without writing files |
| `--skip-tests` | Don't generate `.spec.ts` file |
| `--flat` | Don't create a subdirectory |
| `--inline-template` / `-t` | Put template in the `.ts` file |
| `--inline-style` / `-s` | Put styles in the `.ts` file |
| `--prefix` | Override selector prefix |

:::tip
Always use `--dry-run` first to preview what files will be created or modified:
```bash
ng g component features/dashboard --dry-run
```
:::

## 📦 Using Third-Party Schematics

The `ng add` command installs a package **and** runs its schematic to configure your project:

```bash
ng add @angular/material
```

This goes beyond `npm install` — it modifies `angular.json`, updates `styles.css`, adds imports, and sets up theming.

### Popular Third-Party Schematics

| Package | What it does |
|---------|-------------|
| `@angular/material` | Sets up Material Design components and theming |
| `@angular/pwa` | Adds Progressive Web App support (service worker, manifest) |
| `@angular-eslint/schematics` | Adds ESLint configuration |
| `@ngrx/store` | Sets up NgRx state management |
| `@nx/angular` | Adds Nx workspace tools |

## 🔧 Creating Custom Schematics

Custom schematics let you automate your team's specific patterns. Let's walk through the process.

### Setup

Install the schematics CLI and create a new collection:

```bash
npm install -g @angular-devkit/schematics-cli
schematics blank --name=my-schematics
cd my-schematics
```

This generates a project structure:

```
my-schematics/
├── src/
│   ├── my-schematics/
│   │   ├── index.ts          # Schematic entry point
│   │   └── index_spec.ts     # Tests
│   └── collection.json        # Schematic collection definition
├── package.json
└── tsconfig.json
```

### Collection Schema

The `collection.json` file defines all schematics in your package:

```json
{
  "$schema": "../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "feature": {
      "description": "Generate a feature module scaffold",
      "factory": "./feature/index#feature",
      "schema": "./feature/schema.json"
    },
    "api-service": {
      "description": "Generate an API service with CRUD methods",
      "factory": "./api-service/index#apiService",
      "schema": "./api-service/schema.json"
    }
  }
}
```

### Rule and Tree Concepts

Schematics are built around two core concepts:

- **Tree** — A virtual file system representing your project. You read, create, modify, and delete files in the Tree. Changes are only applied after the schematic succeeds.
- **Rule** — A function that takes a Tree and returns a Tree (or an Observable/Promise of a Tree). Rules are the building blocks of schematics.

```typescript
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function mySchematic(options: MyOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Read a file
    const content = tree.read('src/app/app.config.ts');

    // Create a file
    tree.create('src/app/new-file.ts', 'export const value = 42;');

    // Modify a file
    const recorder = tree.beginUpdate('src/app/app.config.ts');
    recorder.insertRight(offset, newContent);
    tree.commitUpdate(recorder);

    // Delete a file
    tree.delete('src/app/old-file.ts');

    return tree;
  };
}
```

### Schema Definition

Define the options your schematic accepts in `schema.json`:

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "MyFeatureSchema",
  "title": "Feature Schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the feature",
      "$default": {
        "$source": "argv",
        "index": 0
      },
      "x-prompt": "What is the name of the feature?"
    },
    "path": {
      "type": "string",
      "description": "The path to create the feature in",
      "default": "src/app/features"
    }
  },
  "required": ["name"]
}
```

## 🏗️ Practical Example: Feature Scaffold

Here's a schematic that generates a complete feature scaffold:

### File Templates

Create template files in `src/feature/files/__name@dasherize__/`:

**`__name@dasherize__.component.ts.template`:**

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { <%= classify(name) %>Service } from './<%= dasherize(name) %>.service';

@Component({
  selector: 'app-<%= dasherize(name) %>',
  templateUrl: './<%= dasherize(name) %>.component.html',
  styleUrl: './<%= dasherize(name) %>.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <%= classify(name) %>Component {
  readonly items = signal<any[]>([]);
}
```

**`__name@dasherize__.service.ts.template`:**

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class <%= classify(name) %>Service {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>('/api/<%= dasherize(name) %>');
  }
}
```

**`__name@dasherize__.routes.ts.template`:**

```typescript
import { Routes } from '@angular/router';
import { <%= classify(name) %>Component } from './<%= dasherize(name) %>.component';

export const <%= camelize(name) %>Routes: Routes = [
  { path: '', component: <%= classify(name) %>Component },
];
```

### Schematic Implementation

```typescript
import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  template,
  move,
  mergeWith,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

export function feature(options: { name: string; path: string }): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
      template({
        ...options,
        ...strings,  // dasherize, classify, camelize, etc.
      }),
      move(options.path),
    ]);

    return mergeWith(templateSource);
  };
}
```

### Running the Custom Schematic

```bash
# Build the schematic
npm run build

# Run it (from an Angular project)
schematics ./path-to-my-schematics:feature --name=user-management

# Or link it locally for ng generate
npm link
ng generate my-schematics:feature user-management
```

Output:

```
CREATE src/app/features/user-management/user-management.component.ts
CREATE src/app/features/user-management/user-management.component.html
CREATE src/app/features/user-management/user-management.component.scss
CREATE src/app/features/user-management/user-management.service.ts
CREATE src/app/features/user-management/user-management.routes.ts
```

## 🧪 Testing Schematics

Test your schematics using the `SchematicTestRunner`:

```typescript
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('feature schematic', () => {
  const runner = new SchematicTestRunner('my-schematics', collectionPath);

  it('should create feature files', async () => {
    const tree = await runner.runSchematic('feature', {
      name: 'user-profile',
      path: 'src/app/features',
    });

    expect(tree.files).toContain(
      '/src/app/features/user-profile/user-profile.component.ts'
    );
    expect(tree.files).toContain(
      '/src/app/features/user-profile/user-profile.service.ts'
    );
    expect(tree.files).toContain(
      '/src/app/features/user-profile/user-profile.routes.ts'
    );
  });

  it('should generate correct component content', async () => {
    const tree = await runner.runSchematic('feature', {
      name: 'user-profile',
      path: 'src/app/features',
    });

    const content = tree.readContent(
      '/src/app/features/user-profile/user-profile.component.ts'
    );
    expect(content).toContain('UserProfileComponent');
    expect(content).toContain('ChangeDetectionStrategy.OnPush');
  });
});
```

:::tip
Schematics are powerful for enforcing consistency across a team. If your team follows specific patterns — like always creating a component + service + routes together — a custom schematic ensures everyone generates the same structure every time.
:::
