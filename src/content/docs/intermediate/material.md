---
title: Angular Material 🎨
description: Add Angular Material to an Angular application, use standalone Material components and build accessible, themeable interfaces.
sidebar:
  order: 9
---

Angular Material is the official component library for Angular. It provides prebuilt UI components designed around Material Design, with keyboard interaction and accessibility support. Your application is still responsible for meaningful labels, content, responsive layout and end-to-end accessibility.

## Install and configure

Use the CLI schematic so the installed package version matches the workspace:

```bash
ng add @angular/material
```

Follow the prompts to choose a theme and configure global typography and browser animations as supported by that Material release. Review the generated changes in `angular.json`, global styles and package manifests.

## Import components into a standalone component

Import only the Material entry points used by the component:

```ts
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-account-card',
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Account</mat-card-title>
        <mat-card-subtitle>Manage your profile</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>{{ status() }}</p>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button type="button" (click)="refresh()">Refresh</button>
      </mat-card-actions>
    </mat-card>
  `,
})
export class AccountCard {
  readonly status = signal('Your account is up to date.');

  refresh() {
    this.status.set('Your account is up to date.');
  }
}
```

Standalone Material components and NgModules are both supported. Import a module or standalone symbol that matches the exact API exposed by your installed Material version; avoid importing unrelated components into a shared global module.

## Form fields

Form-field components need a label and the appropriate input directive:

```ts
import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field>
      <mat-label>Email address</mat-label>
      <input matInput type="email" autocomplete="email" />
      <mat-hint>Use the address associated with your account.</mat-hint>
    </mat-form-field>
  `,
})
export class EmailField {}
```

Connect inputs to Angular Forms when collecting values, provide visible validation messages, and associate help and errors with the control. See [Forms](/beginner/forms/).

## Data tables (`MatTable`)

`MatTableModule` renders structured rows with column definitions (`matColumnDef`), header cells (`mat-header-cell`) and data cells (`mat-cell`). Pair it with signals for reactive filtering or sorting:

```ts title="invoice-table.ts"
import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending';
}

@Component({
  selector: 'app-invoice-table',
  imports: [MatTableModule, CurrencyPipe],
  template: `
    <table mat-table [dataSource]="filteredInvoices()">
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>Invoice</th>
        <td mat-cell *matCellDef="let row">{{ row.id }}</td>
      </ng-container>

      <ng-container matColumnDef="customer">
        <th mat-header-cell *matHeaderCellDef>Customer</th>
        <td mat-cell *matCellDef="let row">{{ row.customer }}</td>
      </ng-container>

      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef>Amount</th>
        <td mat-cell *matCellDef="let row">{{ row.amount | currency:'USD' }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  `,
})
export class InvoiceTable {
  protected readonly displayedColumns = ['id', 'customer', 'amount'] as const;
  protected readonly statusFilter = signal<'all' | 'paid' | 'pending'>('all');
  protected readonly invoices = signal<Invoice[]>([
    { id: 'INV-101', customer: 'Acme Corp', amount: 420, status: 'paid' },
    { id: 'INV-102', customer: 'Globex', amount: 180, status: 'pending' },
  ]);

  protected readonly filteredInvoices = computed(() => {
    const filter = this.statusFilter();
    return filter === 'all'
      ? this.invoices()
      : this.invoices().filter((item) => item.status === filter);
  });
}
```

## Dialogs and notifications (`MatDialog` and `MatSnackBar`)

Inject `MatDialog` to open modal dialogs and `MatSnackBar` to announce brief status updates:

```ts title="delete-project-button.ts"
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete {{ data.name }}?</h2>
    <mat-dialog-content>This action cannot be undone.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button type="button" (click)="dialogRef.close(true)">Delete</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);
  protected readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-delete-project-button',
  imports: [MatButtonModule],
  template: `<button mat-button type="button" (click)="confirmDelete()">Delete project</button>`,
})
export class DeleteProjectButton {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected confirmDelete() {
    const ref = this.dialog.open(ConfirmDialog, { data: { name: 'Q4 Roadmap' } });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackBar.open('Project deleted', 'Dismiss', { duration: 3000 });
      }
    });
  }
}
```

## Headless accessible widgets with `@angular/aria`

When you want **complete control over HTML and CSS** (for example with Tailwind CSS or a custom design system) while still getting keyboard navigation, focus management and ARIA attributes out of the box, use **`@angular/aria`** — stable in Angular 22. It ships headless directives for patterns such as Accordion, Tabs, Menu, Listbox, Combobox, Toolbar, Tree and Grid.

## Theming (Material 3)

Angular Material uses a Sass-based Material 3 theme (`mat.theme(...)`) and exposes CSS custom properties (`--mat-sys-*`) so your own components can match the active palette and light/dark mode:

```scss title="styles.scss"
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$azure-palette,
    typography: Roboto,
    density: 0,
  ));
}
```

Keep application-specific layout and component styles in your own stylesheets. Do not rely on Material's internal DOM structure or private CSS classes (`mdc-*`); use `mat.*-overrides(...)` mixins or `--mat-sys-*` tokens instead.

## Accessibility and responsive design

- Use native elements (`<button mat-button>`, `<a mat-button>`) and provide visible labels or `aria-label` on icon-only controls.
- Preserve keyboard navigation and visible focus indicators.
- Check color contrast in every theme and state, including disabled and error states.
- Test dialogs, menus, tabs and other overlays with keyboard and assistive technology.
- Use responsive layout around components; Material widgets do not automatically make a page responsive.

## Testing with Component Harnesses

For interaction tests, prefer Angular Material **component harnesses** (`@angular/cdk/testing` + `@angular/material/*/testing`). Harnesses interact with widgets through their supported public API (`MatButtonHarness`, `MatInputHarness`, `MatDialogHarness`) rather than brittle CSS selectors:

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { AccountCard } from './account-card';

it('clicks the refresh button via its harness', async () => {
  const fixture = TestBed.createComponent(AccountCard);
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const button = await loader.getHarness(MatButtonHarness.with({ text: 'Refresh' }));
  await button.click();
  expect(fixture.componentInstance.status()).toBe('Your account is up to date.');
});
```

See [Component Testing](/testing/component-testing/) for more testing patterns.

## Further reading

- [Angular Material documentation](https://material.angular.dev/)
- [Angular CDK](https://material.angular.dev/cdk/categories)
- [Forms Introduction](/beginner/forms/)
