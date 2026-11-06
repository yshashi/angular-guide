---
title: Pipes & Custom Pipes 🔧
description: Format values in Angular templates with built-in pipes, compose transformations and create reusable custom pipes.
sidebar:
  order: 8
---

A pipe transforms a value for display in a template. Pipes keep presentation formatting out of component logic and can be reused across templates.

The expression to the left of `|` is the input; the name to the right selects the pipe:

```html
<p>{{ customerName() | uppercase }}</p>
```

Pipes are Angular template syntax, not the JavaScript bitwise OR operator. They format displayed values; they do not change the original value.

## Built-in pipes

Angular provides these pipes in `@angular/common`:

| Pipe name | Import | Common use |
| --- | --- | --- |
| `uppercase`, `lowercase`, `titlecase` | `UpperCasePipe`, `LowerCasePipe`, `TitleCasePipe` | Format text |
| `number`, `percent`, `currency` | `DecimalPipe`, `PercentPipe`, `CurrencyPipe` | Format numbers using locale rules |
| `date` | `DatePipe` | Format dates and times |
| `slice` | `SlicePipe` | Display part of a string or array |
| `keyvalue` | `KeyValuePipe` | Iterate over an object or map as key-value entries |
| `i18nPlural`, `i18nSelect` | `I18nPluralPipe`, `I18nSelectPipe` | Select a message using a count or key |
| `json` | `JsonPipe` | Inspect an object while debugging |
| `async` | `AsyncPipe` | Display the latest Observable or Promise value |

Import the pipes used by a standalone component:

```ts
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, PercentPipe, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ order().customerName | uppercase }}</h2>
    <p>Placed: {{ order().createdAt | date:'mediumDate':'UTC' }}</p>
    <p>Items: {{ order().itemCount | number }}</p>
    <p>Total: {{ order().total | currency:'USD':'symbol':'1.2-2' }}</p>
    <p>Discount: {{ order().discount | percent }}</p>
  `,
})
export class OrderSummary {
  readonly order = signal({
    customerName: 'Ada Lovelace',
    createdAt: new Date('2026-01-02T12:00:00Z'),
    itemCount: 3,
    total: 125.5,
    discount: 0.25,
  });
}
```

With the default `en-US` locale, the total is `$125.50` and the discount is `25%`. The percent pipe treats `0.25` as 25%, not 0.25%. Date output can also depend on the timezone; this example explicitly uses UTC.

## Pipe parameters and chaining

Pass parameters after a colon. Pipes can be chained from left to right:

```html
<p>{{ publishedAt() | date:'longDate':'UTC' }}</p>
<p>{{ subtotal() | currency:currencyCode():'symbol':'1.2-2' }}</p>
<p>{{ description() | slice:0:160 }}…</p>
```

Keep chains readable. When formatting becomes conditional or domain-specific, use a custom pipe or compute the display value in the component.

For number and currency pipes, a digits argument such as `1.2-2` means at least one integer digit and between two and two fraction digits. The currency code is separate from the locale: use `currency:'EUR'` when the amount is in euros, rather than relying on a locale to convert currencies.

Parenthesize a conditional before piping its result:

```html
<p>{{ (isAdmin() ? 'access granted' : 'access denied') | uppercase }}</p>
```

Without parentheses, the pipe applies to the last branch of this conditional, not necessarily to the whole expression.

### Plurals and object entries

The plural pipe chooses a message for a count; `#` in the selected message is replaced by the count. `keyvalue` turns an object or map into entries that a template can loop over:

```ts
import { I18nPluralPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-file-settings',
  imports: [I18nPluralPipe, KeyValuePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>{{ files().length | i18nPlural:fileMessages }}</p>
    @for (entry of settings | keyvalue; track entry.key) {
      <p>{{ entry.key }}: {{ entry.value }}</p>
    }
  `,
})
export class FileSettings {
  readonly files = signal(['report.pdf', 'photo.jpg']);
  readonly fileMessages = { '=0': 'No files', '=1': 'One file', other: '# files' };
  readonly settings = { pageSize: 20, theme: 'dark' };
}
```

Plural categories depend on the configured locale. `keyvalue` uses its default key ordering unless you provide a comparison function; do not assume it always preserves insertion order.

## Locale and timezone

Number, date and currency pipes use Angular locale data. Angular includes `en-US` by default; register the data for another locale and provide `LOCALE_ID` in the application configuration:

```ts
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';

registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
};
```

Formatting uses the chosen locale; it does not translate your application text or perform currency conversion. When a timezone is not specified, `DatePipe` uses its configured default or the local system timezone. For server-rendered applications, use an explicit timezone when the server and browser must produce the same date and time.

Outside a template, use a formatting function instead of creating a component just to use a pipe:

```ts
import { formatDate } from '@angular/common';

const label = formatDate(new Date('2026-01-02T12:00:00Z'), 'mediumDate', 'en-US', 'UTC');
```

## Observable values with `AsyncPipe`

`AsyncPipe` subscribes to an Observable or Promise and renders its latest value. It unsubscribes from an Observable when the view is destroyed or the expression changes:

```ts
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { delay, of } from 'rxjs';

interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'app-product-list',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (products$ | async; as products) {
      @for (product of products; track product.id) {
        <p>{{ product.name }}</p>
      } @empty {
        <p>No products found.</p>
      }
    } @else {
      <p role="status">Loading products…</p>
    }
  `,
})
export class ProductList {
  readonly products$ = of<Product[]>([
    { id: 1, name: 'Notebook' },
    { id: 2, name: 'Pencil' },
  ]).pipe(delay(500));
}
```

The delay simulates an asynchronous source. For a real request, model loading and failure explicitly; an `@else` loading message does not by itself handle an Observable error. Keep the Observable reference stable rather than creating a new Observable on every template check.

If component logic also needs the latest value, consider converting an Observable once with `toSignal()`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map } from 'rxjs';

@Component({
  selector: 'app-elapsed-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Elapsed: {{ seconds() }} seconds</p>`,
})
export class ElapsedTime {
  readonly seconds = toSignal(
    interval(1000).pipe(map((tick) => tick + 1)),
    { initialValue: 0 },
  );
}
```

`toSignal()` subscribes immediately and normally cleans up with its injection context. If the Observable errors, reading the signal throws; handle the error in the stream or model an error state when needed. Use `AsyncPipe` when a value is only needed in the template; neither approach universally replaces the other.

## Create a custom pipe

Use `@Pipe` for a pure, reusable transformation. A pure pipe reruns when its input value or arguments change. Save this example as `truncate-pipe.ts`:

```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 80): string {
    if (!Number.isInteger(limit) || limit < 0) {
      throw new RangeError('The limit must be a non-negative integer.');
    }
    if (value == null) return '';
    if (value.length <= limit) return value;
    if (limit === 0) return '';
    return `${value.slice(0, limit - 1).trimEnd()}…`;
  }
}
```

The limit includes the ellipsis, so the returned string is never longer than the limit in JavaScript UTF-16 code units. Use a grapheme-aware approach such as `Intl.Segmenter` when truncating arbitrary user-visible text containing emoji or combining characters.

Use the pipe from a component that imports it:

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TruncatePipe } from './truncate-pipe';

@Component({
  selector: 'app-article-summary',
  imports: [TruncatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ summary() | truncate:20 }}</p>`,
})
export class ArticleSummary {
  readonly summary = signal('Angular pipes make values easier to read.');
}
```

### Example: file sizes

Another reusable presentation transformation is formatting file sizes. Save this example as `file-size.ts`. The pipe uses binary units: one KiB is 1,024 bytes.

```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, decimals = 1): string {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new RangeError('File size must be a non-negative safe integer.');
    }
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
      throw new RangeError('Decimals must be an integer from 0 to 4.');
    }
    if (bytes === 0) return '0 B';

    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(decimals)} ${units[index]}`;
  }
}
```

For example, `2048 | fileSize:1` displays `2.0 KiB`. Import `FileSizePipe` into the component that uses it. Validate external data before passing it to the pipe; invalid sizes or precision produce an explicit error rather than a misleading value.

## Pure and impure pipes

Custom pipes are **pure** by default. Angular reruns a pure pipe when a primitive argument changes or when an object, array or `Date` argument has a new reference. If a collection changes, replace it instead of mutating the existing array:

```ts
this.files.update((files) => [...files, newFile]);
```

An impure pipe (`pure: false`) can run whenever its view is checked, even if its inputs have the same references. It may be expensive, and it does not make an otherwise unchanged OnPush view check itself. `AsyncPipe` is intentionally impure because it manages asynchronous values; that does not make all impure pipes appropriate.

Keep custom pipes synchronous and side-effect free. Do not fetch data or mutate application state in `transform()`. For expensive derived state, consider a `computed()` signal and measure the result.

## Test a custom pipe

A pipe without injected dependencies can be tested as a normal class. For example, with Vitest:

```ts
import { describe, expect, it } from 'vitest';
import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('limits the output including the ellipsis', () => {
    expect(pipe.transform('Angular', 4)).toBe('Ang…');
    expect(pipe.transform('Angular', 0)).toBe('');
    expect(pipe.transform('Angular', 10)).toBe('Angular');
  });

  it('handles missing input and rejects an invalid limit', () => {
    expect(pipe.transform(null, 4)).toBe('');
    expect(() => pipe.transform('Angular', -1)).toThrow(RangeError);
  });
});
```

Also test the component that imports the pipe when you need to verify template wiring.

## Common pitfalls

- **Mutating an object in place:** A pure pipe may not rerun because the reference did not change. Replace the object or array instead.
- **Repeated expensive work:** Move complex calculations to a `computed()` signal or cache at the appropriate layer.
- **Missing locale:** Register locale data and set `LOCALE_ID` for supported locales beyond the default.
- **Timezone surprises:** Set a timezone when an application needs consistent server and browser output.
- **Using `JsonPipe` in production UI:** It is useful for debugging, not for presenting user-facing data.
- **Forgetting imports:** Standalone components must import each built-in or custom pipe they use.

Continue with [Template Control Flow](/modern/control-flow/), [Unit Testing](/testing/unit-testing/) and [Performance Optimization](/advanced/performance/).
