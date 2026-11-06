---
title: Integration Testing 🔗
description: Test Angular features combining routing, forms, HTTP and dependency injection using Vitest, TestBed and RouterTestingHarness.
sidebar:
  order: 4
---

An integration test checks that multiple real Angular parts work together. Keep components, routing and forms real; replace external boundaries such as a remote HTTP service.

## Test navigation with `RouterTestingHarness`

The router harness provides a test host with a `RouterOutlet`, navigates to a URL and returns the activated component.

```ts title="product-route.spec.ts"
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ProductPage } from './product-page';

describe('product route', () => {
  it('binds a route parameter to the component input', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'products/:id', component: ProductPage }],
          withComponentInputBinding(),
        ),
      ],
    });

    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/products/42', ProductPage);

    expect(page.id()).toBe('42');
  });
});
```

The component in this example declares `readonly id = input.required<string>();`, and the test router enables `withComponentInputBinding()` just like the application router.

## Test guards and resolvers through the router

Register the same route configuration as the app and navigate to both allowed and denied URLs. Assert which component becomes active or which redirect occurs. For a resolver, provide a deterministic dependency and verify the resolved data reaches the route component.

Functional guards and resolvers may call `inject()`, so they need an injection context. Exercise them through the router harness or use `TestBed.runInInjectionContext()` with their required providers.

## Test HTTP at the edge

Use the real service and replace only the network backend:

```ts
TestBed.configureTestingModule({
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/products');
const http = TestBed.inject(HttpTestingController);
http.expectOne('/api/products').flush([{ id: 1, name: 'Keyboard' }]);
await harness.fixture.whenStable();
http.verify();
```

Add `provideHttpClientTesting()` after `provideHttpClient()`. Verify no unexpected requests remain in `afterEach()`.

## Test form flows

Render the actual form component, enter values, submit and assert on validation messages or the submitted result. For asynchronous Signal Forms validation, wait for the pending validation to settle before asserting.

## Keep integration tests useful

- Test a real user flow rather than internal method calls.
- Replace external systems at their boundary; do not mock every component.
- Keep each test's setup isolated.
- Use only a few E2E tests for the most important browser journeys.

## Next steps

- [Component Testing](/testing/component-testing/)
- [Service Testing](/testing/service-testing/)
- [E2E Testing with Playwright](/testing/e2e-testing/)
