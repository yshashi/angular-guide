---
title: Testing Fundamentals 🧪
description: Learn how to choose between Angular unit, component, integration and end-to-end tests, and find the detailed Vitest guides.
sidebar:
  order: 10
---

Testing gives you evidence that an Angular feature behaves as intended. Start by writing the smallest test that exercises the behavior, then add broader tests for important user flows.

## Choose the right test

| Test type | What it covers | Guide |
|---|---|---|
| Unit | A pure function, pipe or service method | [Unit Testing with Vitest](/testing/unit-testing/) |
| Component | A component's class, template and user interaction | [Component Testing](/testing/component-testing/) |
| Integration | Several Angular parts working together, such as router, form and HTTP | [Integration Testing](/testing/integration-testing/) |
| End-to-end | A running application in a real browser | [E2E Testing with Playwright](/testing/e2e-testing/) |

Most test suites should have many focused unit and component tests, fewer integration tests, and a small set of end-to-end tests for the most important user journeys.

## Angular's default test runner

New Angular projects use Vitest by default since Angular 21:

```bash
ng test
```

Use Vitest APIs such as `describe`, `it`, `expect`, `vi.fn()` and `vi.spyOn()`. Older projects may still use Karma and Jasmine; Angular CLI migrations can help update them. See [Unit Testing with Vitest](/testing/unit-testing/).

## A good test is observable

Prefer checking public behavior: the value returned by a service, the content rendered by a component, a request sent to an API, or an accessible control that a user can operate. Avoid asserting private implementation details that may change without changing behavior.

## Related guides

- [Testing Services](/testing/service-testing/)
- [Testing Signals](/testing/testing-signals/)
- [Mocking & Spies](/testing/mocking/)
- [Code Coverage](/testing/coverage/)
