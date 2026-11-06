---
title: Welcome & Course Overview 🚀
description: Start here — what NG Guide covers, who it is for, how the course is organised and how to get the most out of it while learning Angular 22.
sidebar:
  order: 1
---

Welcome to **NG Guide**, a free and complete course for learning Angular. Whether you have never
written a line of Angular or you have used it for years and want to catch up with the latest
features, this guide takes you from the basics to production-ready apps — one small step at a time.

Everything here is written for **Angular 22** (the current stable release). When something worked
differently in older versions, you will see a short note so you can still read older code.

## What you'll learn on this page

- What Angular is, in one minute
- What "modern Angular" means and why it matters
- How the course is organised and who it is for
- What you need before you start

## Angular in one minute

Angular is an open-source **framework for building web applications**, maintained by a team at
Google. Instead of giving you only a UI library, Angular ships everything a real app needs:

| You need to… | Angular gives you… |
| --- | --- |
| Build the UI out of reusable pieces | **Components** with HTML templates and scoped CSS |
| Keep the screen in sync with your data | **Signals** — a fine-grained reactivity system |
| Share logic and data between screens | **Services** and **dependency injection** |
| Move between pages | The **Router** (lazy loading, guards, resolvers) |
| Collect and validate user input | **Forms** (Signal Forms, Reactive Forms, template-driven) |
| Talk to a backend | **HttpClient** and `httpResource()` |
| Create, run, test and build projects | The **Angular CLI** (`ng new`, `ng serve`, `ng test`, `ng build`) |
| Render on the server for speed and SEO | **SSR**, prerendering (SSG) and hydration |

Here is a complete Angular component. Don't worry about the details yet — you will learn every
line of it in the beginner section:

```ts title="counter.ts"
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>You clicked {{ count() }} times (double: {{ double() }})</p>
    <button type="button" (click)="increment()">Click me</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly double = computed(() => this.count() * 2);

  protected increment() {
    this.count.update((value) => value + 1);
  }
}
```

When you click the button, `count` changes and Angular updates exactly the parts of the page
that read it. That is the heart of modern Angular.

## What "modern Angular" means

Angular has changed a lot in the last few years. If you find an old tutorial online, it may look
very different from the code in this guide. Here is what changed:

| Older Angular | Modern Angular (what this guide teaches) |
| --- | --- |
| `NgModule`s everywhere | **Standalone components** (the default) |
| `*ngIf`, `*ngFor`, `*ngSwitch` | Built-in control flow: **`@if`, `@for`, `@switch`** |
| `@Input()` / `@Output()` decorators | **`input()`, `output()`, `model()`** functions |
| Constructor injection | The **`inject()`** function |
| `@Injectable({ providedIn: 'root' })` | The **`@Service()`** decorator (new in v22) |
| Plain class fields + zone.js | **Signals** + **zoneless** change detection |
| Karma + Jasmine tests | **Vitest** (the default test runner since v21) |
| `component.ts` / `app.component.ts` file names | Short names: `app.ts`, `user-card.ts` |

:::tip
You don't need to learn the "old way" first. Learn the modern way, then use our
[Migration Guides](/migration/version-upgrade/) when you meet older code at work.
:::

## How this course is organised

The course is split into sections that build on each other. The
[Learning Path Guide](/learning-path/) turns them into a week-by-week plan.

| Section | What you'll learn |
| --- | --- |
| 🚀 **Getting Started** | Prerequisites, tool setup and how to use this guide |
| 🌱 **Beginner** | Components, templates, directives, services, routing, forms, HTTP |
| 🚀 **Intermediate** | Component communication, lifecycle hooks, reactive forms, advanced routing, RxJS, state, pipes, Angular Material |
| ⚡ **Modern Angular** | Signals, `computed`, effects, `linkedSignal`, Resource API, `httpResource`, Signal Forms, control flow, `@let`, zoneless, hydration |
| 🏗️ **Advanced** | Custom directives, dynamic components, content projection, advanced DI, Angular Elements, micro frontends, performance |
| 🔄 **RxJS** | Observables, subjects, operators, error handling and RxJS patterns in Angular |
| 🧪 **Testing** | Unit, component, service and integration tests with Vitest, mocking, coverage, and Playwright E2E tests |
| 🌐 **SSR** | Server-side rendering, static generation, hydration, render modes and event replay |
| 🚀 **Deployment** | Hosting options, Docker and CI/CD pipelines |
| 💼 **Projects** | Todo app, blog platform, dashboard, e-commerce store, chat app and PWA |
| 🔄 **Migration** | Upgrading versions and moving to standalone, signals and other modern APIs |
| 🛠️ **Tools** | Angular CLI, VS Code, Angular DevTools, debugging, ESLint, Prettier, schematics, Git hooks |
| 🤖 **Angular + AI** | The Angular CLI MCP server, AI config files and agent skills — see [Angular + AI](/ai/overview/) |
| 📚 **Resources** | Best practices, patterns, cheat sheet, performance checklist, troubleshooting |

Every page follows the same shape: a short intro, **what you'll learn**, concepts with small
examples, **common mistakes** or best practices, **key takeaways**, and links to what to read next.

## Who this course is for

- **Complete beginners** who know some HTML, CSS and JavaScript and want to learn a framework.
- **Developers coming from React, Vue or Svelte** who want to understand how Angular does things.
- **Backend developers** moving into frontend work.
- **Angular developers** who learned an older version and want to catch up with signals,
  standalone components, Signal Forms, zoneless and Vitest.
- **Team leads** planning a new Angular project or modernising an existing one.

## What you need

**Knowledge:** basic HTML, CSS and JavaScript. TypeScript helps, but you can learn it as you go —
the [Prerequisites](/prerequisites/) page lists exactly what to know.

**Tools:**

- **Node.js** 22.22.3+, 24.15+ or 26 (Angular 22 does not support Node.js 20)
- **Angular CLI** 22 (`npm install -g @angular/cli`)
- **A code editor** — VS Code with the Angular Language Service extension is a great choice
- **A modern browser** with the Angular DevTools extension

The [Development Environment](/setup/) page walks you through installing all of them.

## How to get the most out of this guide

1. **Type the code yourself.** Copying is fine, but typing makes it stick.
2. **Change things and break things.** Then read the error message — Angular's errors are helpful.
3. **Build the projects.** The [Projects](/projects/todo-app/) section is where everything clicks.
4. **Don't rush.** Short daily sessions beat one long weekend session.

## Key takeaways

- Angular is a complete, TypeScript-first framework for building web apps.
- This guide teaches **Angular 22** with modern APIs: standalone components, signals,
  `inject()`, `input()`/`output()`, built-in control flow, `@Service()` and Vitest.
- The course goes from beginner to advanced, with testing, SSR, deployment, real projects and AI
  tooling along the way.

## Next steps

1. **[Prerequisites](/prerequisites/)** — check what you should know before you start
2. **[Development Environment](/setup/)** — install Node.js, the Angular CLI and your editor
3. **[Learning Path Guide](/learning-path/)** — choose a plan that fits your experience
4. **[What is Angular?](/beginner/what-is-angular/)** — begin the beginner section

---

## About the author

I believe knowledge should be accessible to everyone, so NG Guide is free and built from
real-world experience of shipping Angular apps.

**Connect with me:**

- [YouTube — Let's Program](https://youtube.com/@letsprogram30)
- [Blog](https://letsprogram.in)
- [Portfolio](https://sashikumar.dev)
- [LinkedIn](https://linkedin.com/in/sashikumar-yadav/)

Happy learning! 🚀
