---
title: Component Testing 🧩
description: Test Angular components with Vitest and TestBed, set signal inputs, interact with templates and verify user-visible behavior.
sidebar:
  order: 2
---

An Angular component test checks the class and its rendered template together. Test observable behavior—what a user sees and does—instead of private implementation details.

## Create a fixture

`TestBed.createComponent()` renders a component and returns a fixture containing the instance, DOM and change-detection controls.

```ts title="greeting.spec.ts"
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Greeting } from './greeting';

describe('Greeting', () => {
  it('renders the supplied name', async () => {
    await TestBed.configureTestingModule({ imports: [Greeting] }).compileComponents();
    const fixture = TestBed.createComponent(Greeting);
    fixture.componentRef.setInput('name', 'Ada');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Hello, Ada');
  });
});
```

Use `fixture.componentRef.setInput()` to assign signal inputs. It triggers Angular's input handling and change detection; do not assign an input signal directly.

## Test interactions

Query elements by accessible role or label where possible. Trigger the same action a user performs, then wait for Angular to stabilize before asserting.

```ts
const fixture = TestBed.createComponent(Counter);
await fixture.whenStable();
const button: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Increment"]');
button.click();
await fixture.whenStable();
expect(fixture.nativeElement.textContent).toContain('1');
```

If a control is difficult to identify by its role or label, improve the component's semantics before relying on internal CSS classes.

## Test inputs, outputs and conditional UI

Set inputs through `setInput()`, then assert the rendered response. For outputs, prefer triggering the UI that emits the event and checking the resulting behavior. `@if`, `@for` and `@switch` can be tested by changing public inputs or state through the UI and asserting the visible branch.

For `@defer`, Angular's test utilities expose `fixture.getDeferBlocks()` and a `DeferBlockFixture` with a `render()` method. Use the `DeferBlockState` enum to render placeholder, loading, complete or error states when testing each state explicitly.

## Asynchronous rendering

For zoneless Angular apps, `await fixture.whenStable()` is usually the clearest way to wait for asynchronous rendering. Call `fixture.detectChanges()` after directly changing ordinary, non-signal state. Avoid arbitrary `setTimeout()` sleeps; they make tests slow and flaky.

## Component harnesses

Reusable widgets can expose a testing harness so tests do not depend on internal DOM structure. Angular Material and CDK provide harnesses for their components. See the [CDK component harness guide](https://material.angular.dev/cdk/testing/overview).

## Common mistakes

- Testing only the class when the template behavior matters.
- Setting input properties directly instead of using `setInput()`.
- Querying generated CSS classes that can change during refactoring.
- Asserting before asynchronous rendering or validation has settled.
- Reproducing framework implementation details in the test.

## Next steps

- [Unit Testing with Vitest](/testing/unit-testing/)
- [Service Testing](/testing/service-testing/)
- [Integration Testing](/testing/integration-testing/)
