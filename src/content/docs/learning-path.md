---
title: Learning Path Guide 🗺️
description: A structured roadmap through NG Guide — from your first component to signals, testing, SSR, deployment, real projects and AI tooling with Angular 22.
sidebar:
  order: 4
---

This page turns the whole guide into a clear plan. Follow it from top to bottom as a
**~20-week course** (about 6–10 hours a week), or jump to the phase that matches what you already
know. Every link below points to a page on this site.

## What you'll learn

- Where to start based on your current experience
- The order to read the guide in, phase by phase
- Which project to build at the end of each phase
- How to plan your study time

## Where should you start?

| Your experience | Start here |
| --- | --- |
| New to Angular (and maybe to frameworks) | [What is Angular?](/beginner/what-is-angular/) |
| You know React, Vue or Svelte | [Angular Architecture](/beginner/architecture/) → [Your First App](/beginner/first-app/) |
| You used Angular before signals/standalone (v16 or older) | [Standalone Components](/modern/standalone-components/) → [Signals](/modern/signals/) |
| You know modern Angular and want depth | [Advanced Topics](/advanced/custom-directives/), [Testing](/testing/unit-testing/), [SSR](/ssr/introduction/) |
| You need to upgrade an existing app | [Version Upgrades](/migration/version-upgrade/) → [Modernization](/migration/modernization/) |

:::tip[Before you begin]
Make sure you've read [Prerequisites](/prerequisites/) and set up your
[Development Environment](/setup/). You need Node.js 22.22.3+, 24.15+ or 26 and Angular CLI 22.
:::

## Phase 1 — Foundations (weeks 1–4) 🌱

Learn the building blocks every Angular app uses.

**Week 1: Getting started**

- [ ] [What is Angular?](/beginner/what-is-angular/)
- [ ] [Angular Architecture](/beginner/architecture/)
- [ ] [Your First App](/beginner/first-app/) — build a task manager

**Week 2: Components and templates**

- [ ] [Components Basics](/beginner/components/)
- [ ] [Templates & Data Binding](/beginner/templates/)
- [ ] [Directives](/beginner/directives/)

**Week 3: Services and data**

- [ ] [Services & DI](/beginner/services/)
- [ ] [HTTP Client](/beginner/http/)

**Week 4: Navigation and input**

- [ ] [Routing Basics](/beginner/routing/)
- [ ] [Forms Introduction](/beginner/forms/)

🏁 **Milestone project:** a small multi-page app (list + detail + form) that loads data over HTTP.
The [Todo App with Signals](/projects/todo-app/) project is a great guided option.

## Phase 2 — Intermediate skills (weeks 5–8) 🚀

Make components talk to each other, handle complex forms and navigation, and manage state.

**Week 5: Components in depth**

- [ ] [Advanced Components](/intermediate/advanced-components/)
- [ ] [Component Communication](/intermediate/component-communication/)
- [ ] [Lifecycle Hooks](/intermediate/lifecycle-hooks/)

**Week 6: Forms and pipes**

- [ ] [Reactive Forms](/intermediate/reactive-forms/)
- [ ] [Pipes & Custom Pipes](/intermediate/pipes/)

**Week 7: Routing and UI**

- [ ] [Advanced Routing](/intermediate/advanced-routing/) — lazy loading, guards, resolvers
- [ ] [Angular Material](/intermediate/material/)

**Week 8: Reactive data and state**

- [ ] [RxJS & Observables](/intermediate/rxjs/)
- [ ] [State Management](/intermediate/state-management/)

🏁 **Milestone project:** [Blog Platform — Part 1](/projects/blog/),
[Part 2](/projects/blog-part2/) and [Part 3](/projects/blog-part3/).

## Phase 3 — Modern Angular (weeks 9–12) ⚡

Master the APIs that define Angular today. Everything in this phase is **stable** in Angular 22.

**Week 9: Standalone and signals**

- [ ] [Standalone Components](/modern/standalone-components/)
- [ ] [Angular Signals](/modern/signals/)
- [ ] [Computed Signals](/modern/computed-signals/)

**Week 10: Reactive patterns**

- [ ] [Effects API](/modern/effects/)
- [ ] [Linked Signals](/modern/linked-signals/)
- [ ] [Resource API](/modern/resource-api/)
- [ ] [HttpResource API](/modern/http-resource-api/)

**Week 11: Templates and forms**

- [ ] [Control Flow (`@if`, `@for`, `@switch`)](/modern/control-flow/)
- [ ] [New Template Syntax (`@let`)](/modern/template-syntax/)
- [ ] [Signal Forms](/modern/signal-forms/)

**Week 12: Performance foundations**

- [ ] [Zoneless Angular](/modern/zoneless/)
- [ ] [Incremental Hydration](/modern/incremental-hydration/)

🏁 **Milestone project:** the [Admin Dashboard](/projects/dashboard/) — put signals and the modern
APIs to work in a real-world UI.

## Phase 4 — Advanced topics & RxJS (weeks 13–16) 🏗️

Go deeper into Angular's internals and reactive programming.

**Week 13: Building reusable UI**

- [ ] [Custom Directives](/advanced/custom-directives/)
- [ ] [Dynamic Components](/advanced/dynamic-components/)
- [ ] [Content Projection](/advanced/content-projection/)

**Week 14: Architecture**

- [ ] [Advanced DI Patterns](/advanced/dependency-injection/)
- [ ] [Custom Decorators](/advanced/decorators/)
- [ ] [Angular Elements](/advanced/elements/)
- [ ] [Micro Frontends](/advanced/micro-frontends/)

**Week 15: Performance**

- [ ] [Performance Optimization](/advanced/performance/)
- [ ] [Memory Management](/advanced/memory-management/)
- [ ] [Bundle Optimization](/advanced/bundle-optimization/)

**Week 16: RxJS in depth** (read alongside the other weeks if you prefer)

- [ ] [RxJS Fundamentals](/rxjs/fundamentals/) · [Observables & Observers](/rxjs/observables/) · [Subjects & BehaviorSubject](/rxjs/subjects/)
- [ ] [Transformation](/rxjs/transformation-operators/) · [Filtering](/rxjs/filtering-operators/) · [Combination](/rxjs/combination-operators/) operators
- [ ] [Error Handling](/rxjs/error-handling/) · [Higher-Order Observables](/rxjs/higher-order-observables/) · [Schedulers & Testing](/rxjs/schedulers/)
- [ ] [RxJS Patterns in Angular](/rxjs/angular-patterns/)

🏁 **Milestone project:** the [E-commerce Store](/projects/ecommerce/).

## Phase 5 — Testing & quality (weeks 17–18) 🧪

New Angular projects use **Vitest** by default. Learn to test everything you've built.

**Week 17: Unit and component tests**

- [ ] [Unit Testing Deep Dive](/testing/unit-testing/)
- [ ] [Component Testing](/testing/component-testing/)
- [ ] [Service Testing](/testing/service-testing/)
- [ ] [Testing Signals](/testing/testing-signals/)

**Week 18: Beyond unit tests**

- [ ] [Mocking & Spies](/testing/mocking/)
- [ ] [Integration Testing](/testing/integration-testing/)
- [ ] [E2E Testing with Playwright](/testing/e2e-testing/)
- [ ] [Code Coverage](/testing/coverage/)

🏁 **Milestone:** add unit, component and E2E tests to one of your projects and run them in CI.

## Phase 6 — SSR, deployment & production (weeks 19–20) 🌐

Make your app fast to load, search-engine friendly and running in production.

**Week 19: Server-side rendering**

- [ ] [SSR Introduction](/ssr/introduction/)
- [ ] [Render Modes](/ssr/render-modes/)
- [ ] [Static Site Generation](/ssr/static-generation/)
- [ ] [Hydration](/ssr/hydration/)
- [ ] [Event Replay](/ssr/event-replay/)

**Week 20: Shipping**

- [ ] [Deployment Strategies](/deployment/strategies/)
- [ ] [Docker & Containers](/deployment/docker/)
- [ ] [CI/CD Pipelines](/deployment/ci-cd/)

🏁 **Final projects:** the real-time [Chat App](/projects/chat-app/) and an installable
[Progressive Web App](/projects/pwa/) — then deploy one of them.

## Bonus tracks (any time) 🎁

**🤖 Angular + AI** — make your AI assistant write modern Angular code, and add AI features to
your apps: [Overview](/ai/overview/) · [Angular MCP Server](/ai/mcp-server/) ·
[AI Config, Rules & Skills](/ai/ai-config-and-skills/) · [Build AI Features](/ai/build-ai-features/)

**🛠️ Developer tools** — sharpen your workflow:
[Angular CLI](/tools/angular-cli/) · [VS Code Setup](/tools/vscode/) ·
[Angular DevTools](/tools/devtools/) · [Debugging](/tools/debugging/) · [ESLint](/tools/eslint/) ·
[Prettier](/tools/prettier/) · [Schematics](/tools/schematics/) · [Git Hooks](/tools/git-hooks/)

**🔄 Migration** — working on an older codebase?
[Version Upgrades](/migration/version-upgrade/) · [Standalone Migration](/migration/standalone/) ·
[Signals Migration](/migration/signals/) · [Modernization](/migration/modernization/)

**📚 Keep handy** — [Best Practices](/resources/best-practices/) ·
[Design Patterns](/resources/patterns/) · [Cheat Sheet](/resources/cheat-sheet/) ·
[Performance Checklist](/resources/performance-checklist/) ·
[Troubleshooting](/resources/troubleshooting/)

## Fast tracks

Short on time? These condensed routes cover the essentials.

| Goal | Route |
| --- | --- |
| **Ship a first real app in 2 weeks** | First App → Components → Templates → Services → Routing → HTTP → Signals → [Todo App](/projects/todo-app/) |
| **Modern Angular refresher (1 week)** | Standalone → Signals → Computed → Linked Signals → Resource API → Control Flow → Signal Forms → Zoneless |
| **Testing crash course (1 week)** | Unit Testing → Component Testing → Service Testing → Mocking → E2E |
| **Performance & SEO (1 week)** | Performance → Bundle Optimization → SSR Introduction → Render Modes → Hydration |

## Planning your study time

| Pace | Hours / week | Full course |
| --- | --- | --- |
| Relaxed | 4–6 | ~6 months |
| Steady (recommended) | 6–10 | ~20 weeks |
| Intensive | 15–20 | ~8–10 weeks |

A simple weekly rhythm that works well:

1. **Read** the week's pages and run every example (2–3 hours).
2. **Practise** — change the examples and try the challenges (2–3 hours).
3. **Build** — add the week's ideas to your current project (2–4 hours).
4. **Review** — write down what you learned and what is still unclear (30 minutes).

## Tips for success

- **Build while you learn.** Reading alone won't make it stick.
- **Use the type checker.** Angular's strict templates show many mistakes before you even run the app.
- **Inspect with Angular DevTools** to see your component tree and signal values live.
- **Read the error message.** Angular errors include a code (like `NG0950`) you can search for.
- **Join the community** — see [Community](/resources/community/) and
  [Further Reading](/resources/further-reading/).

## Key takeaways

- The guide is organised in six phases: foundations → intermediate → modern Angular → advanced &
  RxJS → testing → SSR & deployment, with projects after each phase.
- Start where your experience fits — you don't have to read everything in order.
- The bonus tracks (AI, tools, migration, resources) can be used at any time.

## Next steps

Ready? Start with [What is Angular?](/beginner/what-is-angular/), or if you already know the basics,
jump straight into [Your First App](/beginner/first-app/). 🚀
