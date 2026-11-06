---
title: Service Testing 🧰
description: Test Angular services with Vitest and TestBed, replace injected dependencies and verify HttpClient requests with HttpTestingController.
sidebar:
  order: 3
---

Services have no template, so most tests focus on their public methods and state. Use `TestBed` when the service relies on Angular dependency injection.

## Test a service with a fake dependency

```ts title="price-service.spec.ts"
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from './logger';
import { PriceService } from './price-service';

describe('PriceService', () => {
  it('calculates tax and logs the operation', () => {
    const logger = { info: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: Logger, useValue: logger }],
    });

    const service = TestBed.inject(PriceService);

    expect(service.withTax(10)).toBe(11);
    expect(logger.info).toHaveBeenCalledWith('Calculating tax');
  });
});
```

Configure providers before the first call to `TestBed.inject()`. A root `@Service()` is registered automatically; override its collaborator in the testing module.

## Test HTTP requests

Use `provideHttpClient()` and `provideHttpClientTesting()` with `HttpTestingController` to inspect and flush requests without making a network call.

```ts title="catalog-api.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogApi } from './catalog-api';

describe('CatalogApi', () => {
  let api: CatalogApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CatalogApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the catalog', async () => {
    const result = firstValueFrom(api.getProducts());
    const request = http.expectOne('/api/products');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, name: 'Keyboard' }]);

    await expect(result).resolves.toEqual([{ id: 1, name: 'Keyboard' }]);
  });
});
```

Add `provideHttpClientTesting()` after `provideHttpClient()` so the testing backend replaces the real backend. Use `expectOne()` to check URL and method, then `flush()` with the response.

## Test errors and request data

`request.flush()` can simulate an HTTP error:

```ts
const result = firstValueFrom(api.getProduct(42));
const request = http.expectOne('/api/products/42');
request.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
await expect(result).rejects.toMatchObject({ status: 503 });
```

You can also assert query parameters through `request.request.params`, headers through `request.request.headers`, and the request body through `request.request.body`.

## Test `httpResource`

An `httpResource()` uses Angular's HTTP infrastructure. Create it inside an Angular injection context, then use `HttpTestingController` to inspect and answer its request. Assert the resource's public status, value or error after the response is flushed and Angular has stabilized. See [Testing Signals](/testing/testing-signals/).

## Keep tests deterministic

Do not call a live API from a unit test. Use `HttpTestingController` for Angular HTTP or provide a fake at the service boundary. This keeps tests fast and avoids failures caused by network or server changes.

## Next steps

- [Unit Testing with Vitest](/testing/unit-testing/)
- [Mocking & Spies](/testing/mocking/)
- [Integration Testing](/testing/integration-testing/)
