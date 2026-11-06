---
title: Code Coverage 📊
description: Measure Angular unit-test coverage with the Vitest builder, understand reports and set useful coverage thresholds in CI.
sidebar:
  order: 8
---

Code coverage shows which executable lines, branches, functions and statements were exercised by tests. It can reveal untested areas, but a high percentage does not prove that tests check meaningful behavior.

## Generate a report

```bash
ng test --coverage
```

The Angular unit-test builder passes coverage collection to Vitest and writes a report to the configured output directory (commonly `coverage/`). Check `angular.json` and the schema for your installed CLI version for supported options and reporters.

## Prioritize useful code

Focus coverage on business rules, error handling, validation, state transitions and user-critical workflows. Avoid spending time testing trivial getters, generated code or implementation details that are not part of a behavior contract.

## Set thresholds deliberately

Vitest supports global and per-file coverage thresholds. First measure a baseline, then increase thresholds gradually as meaningful tests are added. Treat thresholds as regression guards—not a reason to write tests solely to raise a number.

Example Vitest coverage configuration:

```ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

Confirm the Angular CLI builder forwards the configuration for your installed Angular and Vitest versions before relying on it in CI.

## Coverage providers

Vitest coverage providers include V8 and Istanbul. The Angular CLI makes `istanbul-lib-instrument` an optional peer dependency; install it only if your selected provider requires it:

```bash
npm install --save-dev istanbul-lib-instrument
```

Use the provider and version documented for the Angular CLI builder in your project. Avoid adding a second coverage tool without a specific need.

## CI

```yaml
- run: npm ci
- run: npx ng test --coverage --no-watch
```

Upload the generated report using the CI provider's artifact or coverage action. Keep the test command deterministic and make CI fail when tests fail.

## Next steps

- [Unit Testing with Vitest](/testing/unit-testing/)
- [Mocking & Spies](/testing/mocking/)
- [CI/CD Pipelines](/deployment/ci-cd/)
