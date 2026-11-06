---
title: Mocking & Spies 🎭
description: Use Vitest mocks and Angular provider overrides to replace dependencies, spy on behavior, fake timers and isolate Angular tests.
sidebar:
  order: 7
---

Mock a boundary when a test would otherwise depend on a network, clock, browser API or expensive service. Keep the system under test real so the test still verifies useful behavior.

## Vitest mock functions

```ts
import { describe, expect, it, vi } from 'vitest';

describe('save button', () => {
  it('calls the callback with the record id', () => {
    const save = vi.fn<(id: number) => void>();
    save(42);

    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(42);
  });
});
```

Use `vi.fn()` to create a mock function and `vi.spyOn(object, 'method')` to observe or replace an existing method. Restore spies after each test when they should not leak.

## Replace an injected dependency

```ts
const analytics = { track: vi.fn() };

TestBed.configureTestingModule({
  providers: [
    ReportService,
    { provide: Analytics, useValue: analytics },
  ],
});
```

For a component provider, use `TestBed.overrideComponent()` before creating the fixture:

```ts
TestBed.configureTestingModule({ imports: [CheckoutPage] })
  .overrideComponent(CheckoutPage, {
    remove: { providers: [PaymentService] },
    add: { providers: [{ provide: PaymentService, useValue: paymentFake }] },
  });
```

TestBed configuration freezes after the first `inject()` or `createComponent()` call, so configure and override providers first.

## Mock HTTP requests

Do not replace `HttpClient` methods directly. Use `provideHttpClient()` with `provideHttpClientTesting()`, then use `HttpTestingController` to check requests and supply responses. This exercises the real Angular HTTP layer without network access; see [Service Testing](/testing/service-testing/).

## Module-level mocks

Use `vi.mock()` when a module boundary must be replaced, such as an SDK imported directly by the code under test. Keep mocks small and reset them between tests. For Angular dependencies, provider overrides are usually clearer.

```ts
import { vi } from 'vitest';

vi.mock('./clock', () => ({
  now: vi.fn(() => new Date('2026-01-01T00:00:00Z')),
}));
```

Vitest hoists `vi.mock()` calls; consult the Vitest docs when changing mock behavior per test.

## Fake timers

```ts
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.useRealTimers());

it('waits before running a delayed callback', async () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  setTimeout(callback, 250);
  await vi.advanceTimersByTimeAsync(250);
  expect(callback).toHaveBeenCalledOnce();
});
```

Use fake timers for code that schedules timers, such as a debounce or retry delay. For ordinary Angular rendering, prefer `await fixture.whenStable()`.

## Choose the simplest test double

- **Stub:** returns a fixed value.
- **Spy:** records calls, optionally delegating to the original method.
- **Fake:** a small working implementation of a dependency's contract.
- **Mock:** programmable behavior with interaction assertions.

Prefer a fake for stateful behavior and a spy for a simple interaction. Avoid duplicating a service's full implementation inside its mock.

## Jasmine migration note

New Angular projects use Vitest. Use `vi.fn()` and `vi.spyOn()` rather than Jasmine's `jasmine.createSpyObj()`. See [Unit Testing with Vitest](/testing/unit-testing/).

## Next steps

- [Component Testing](/testing/component-testing/)
- [Service Testing](/testing/service-testing/)
- [Unit Testing with Vitest](/testing/unit-testing/)
