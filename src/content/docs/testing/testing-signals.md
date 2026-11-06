---
title: Testing Signals 📡
description: Test Angular signals, computed values, effects, resources and Signal Forms with Vitest and Angular's TestBed utilities.
sidebar:
  order: 6
---

Signals are synchronous reactive values. Test their public behavior—what a component displays or a service returns—instead of inspecting Angular's internal dependency graph.

## Test signals and computed values

```ts
import { Service, computed, signal } from '@angular/core';

@Service()
export class Cart {
  private readonly itemsState = signal<{ price: number; quantity: number }[]>([]);
  readonly total = computed(() =>
    this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  add(price: number) {
    this.itemsState.update((items) => [...items, { price, quantity: 1 }]);
  }
}
```

```ts
const cart = TestBed.inject(Cart);
expect(cart.total()).toBe(0);
cart.add(12);
expect(cart.total()).toBe(12);
```

Computed signals are lazy and synchronous; reading the computed value after changing its source returns the updated value.

## Test component signals

Use `fixture.componentRef.setInput()` for inputs, perform a user action, then wait for rendering:

```ts
const fixture = TestBed.createComponent(QuantityPicker);
fixture.componentRef.setInput('quantity', 3);
await fixture.whenStable();
expect(fixture.nativeElement.textContent).toContain('3');
```

Avoid reaching into private state just to force a desired component state. Test through inputs, outputs and visible behavior.

## Test effects

Effects run in an Angular injection context. `TestBed.tick()` flushes pending effects and synchronizes change detection when needed.

```ts
import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

const value = signal('initial');
const writes: string[] = [];

TestBed.runInInjectionContext(() => effect(() => writes.push(value())));
TestBed.tick();
value.set('updated');
TestBed.tick();

expect(writes).toContain('updated');
```

Prefer asserting an effect's observable outcome, such as a saved preference or a collaborator call. Do not assert exact execution counts unless that is part of the contract.

## Test resources and forms

Resources expose status, value, error and loading state as signals. Test those public states and control the async operation with a fake promise or `HttpTestingController` for HTTP resources. Use `await fixture.whenStable()` when rendered output depends on asynchronous work.

For Signal Forms, test valid and invalid input, field state and submission behavior. Await asynchronous validators before checking their result; do not use arbitrary timer sleeps.

## Timers and debounce

Use Vitest fake timers (`vi.useFakeTimers()` and `vi.advanceTimersByTimeAsync()`) only when the code explicitly uses timers. The `debounced()` resource is experimental in Angular 22; check its current API before writing version-sensitive tests.

## Next steps

- [Angular Signals](/modern/signals/)
- [Resource API](/modern/resource-api/)
- [Signal Forms](/modern/signal-forms/)
- [Mocking & Spies](/testing/mocking/)
