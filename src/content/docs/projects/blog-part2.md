---
title: Blog Platform - Part 2 (Components) 🧩
description: Build reusable post cards, a search box, category filters and pagination for the Angular 22 blog, with all list state stored in URL query params.
sidebar:
  order: 4
---

This is **Part 2** of the Blog Platform series. You turn the simple list from Part 1 into a real home page: a grid of post cards with search, category filters, and pagination. All of this state lives in the **URL**, so every view can be shared, bookmarked, and reached with the Back button.

**Previous:** [Part 1: Setup & Data](/projects/blog/) · **Next:** [Part 3: Pages & Forms](/projects/blog-part3/)

## What you'll learn

- How to build a **presentational component** with `input.required()`
- How to send events to the parent with **`output()`**
- How to read **query parameters as inputs** (`?q=…&category=…&page=…`), including default values and transforms
- How to build an `httpResource()` request with **reactive query params**
- How to update the URL with `routerLink` + `queryParamsHandling` and with `Router.navigate()`
- How to name a value in the template with **`@let`**

## Before you start

Make sure the API and the dev server from Part 1 are running:

```bash
npm run api   # terminal 1
ng serve      # terminal 2
```

## Step 1: The post card

A card shows one post. It only receives data through an input and has no logic of its own. Create `src/app/posts/post-card.ts`:

```ts title="src/app/posts/post-card.ts"
import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from './post';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, DatePipe],
  host: { class: 'block' },
  template: `
    <article
      class="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <img
        [src]="post().coverUrl"
        alt=""
        width="800"
        height="400"
        loading="lazy"
        class="h-44 w-full object-cover"
      />
      <div class="flex flex-1 flex-col gap-2 p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {{ post().category }}
        </p>
        <h2 class="text-lg font-bold">
          <a [routerLink]="['/posts', post().id]" class="hover:text-blue-600">{{ post().title }}</a>
        </h2>
        <p class="flex-1 text-gray-600">{{ post().excerpt }}</p>
        <p class="text-sm text-gray-500">
          {{ post().author }} ·
          <time [attr.datetime]="post().publishedAt">{{ post().publishedAt | date: 'mediumDate' }}</time>
        </p>
      </div>
    </article>
  `,
})
export class PostCard {
  readonly post = input.required<Post>();
}
```

- `input.required<Post>()` means the parent must pass a post. Reading it is a signal call: `post().title`.
- `[routerLink]="['/posts', post().id]"` builds `/posts/2`. That page comes in Part 3. Until then, you see the 404 page.
- `host: { class: 'block' }` makes the `<app-post-card>` element a block, so cards fill their grid cell.
- `width`, `height`, and `loading="lazy"` on the image prevent layout jumps and delay loading images that are off screen.
- `<time [attr.datetime]>` gives screen readers and search engines the exact date.

## Step 2: The search box

Create `src/app/posts/search-box.ts`. It shows the current search, and it emits a new search term when the user submits:

```ts title="src/app/posts/search-box.ts"
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-box',
  template: `
    <form role="search" class="flex gap-2" (submit)="onSubmit($event, box.value)">
      <input
        #box
        type="search"
        [value]="query()"
        placeholder="Search titles…"
        aria-label="Search posts by title"
        class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
      />
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  `,
})
export class SearchBox {
  readonly query = input('');
  readonly search = output<string>();

  protected onSubmit(event: Event, value: string): void {
    event.preventDefault(); // stop the browser from reloading the page
    this.search.emit(value.trim());
  }
}
```

- `query = input('')` is an input with a default value. The parent passes the current `?q=`.
- `search = output<string>()` is a custom event. The parent listens with `(search)="…"`.
- `#box` is a template reference to the `<input>`, so `box.value` reads what the user typed. One field doesn't need a form library.
- `role="search"` marks this as a search landmark for screen readers.

:::tip[Why submit instead of searching on every key press?]
Searching on submit is simple and sends one request per search. If you want live search later, add a debounce. Note that the `debounced()` signal helper is still **experimental** in Angular 22.
:::

## Step 3: The upgraded home page

Now replace `src/app/posts/post-list.ts` with the full version:

```ts title="src/app/posts/post-list.ts"
import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, Page, Post } from './post';
import { PostCard } from './post-card';
import { API_URL, PAGE_SIZE } from './posts-api';
import { SearchBox } from './search-box';

@Component({
  selector: 'app-post-list',
  imports: [PostCard, SearchBox, RouterLink],
  template: `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-bold">Latest posts</h1>
      <app-search-box class="sm:w-80" [query]="q()" (search)="search($event)" />
    </div>

    <nav aria-label="Categories" class="mb-6 flex flex-wrap gap-2">
      <a
        routerLink="/"
        [queryParams]="{ category: null, page: null }"
        queryParamsHandling="merge"
        [class]="chip(!category())"
      >
        All
      </a>
      @for (name of categories; track name) {
        <a
          routerLink="/"
          [queryParams]="{ category: name, page: null }"
          queryParamsHandling="merge"
          [class]="chip(category() === name)"
        >
          {{ name }}
        </a>
      }
    </nav>

    @if (posts.hasValue()) {
      @let result = posts.value();
      @if (q()) {
        <p class="mb-4 text-sm text-gray-600">{{ result.items }} result(s) for “{{ q() }}”</p>
      }

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (post of result.data; track post.id) {
          <app-post-card [post]="post" />
        } @empty {
          <p class="col-span-full py-12 text-center text-gray-500">No posts found.</p>
        }
      </div>

      @if (result.pages > 1) {
        <nav aria-label="Pagination" class="mt-8 flex items-center justify-center gap-4">
          @if (result.prev) {
            <a
              routerLink="/"
              [queryParams]="{ page: result.prev }"
              queryParamsHandling="merge"
              class="rounded-md border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100"
            >
              ← Newer
            </a>
          }
          <span class="text-sm text-gray-600">
            Page {{ (result.prev ?? 0) + 1 }} of {{ result.pages }}
          </span>
          @if (result.next) {
            <a
              routerLink="/"
              [queryParams]="{ page: result.next }"
              queryParamsHandling="merge"
              class="rounded-md border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100"
            >
              Older →
            </a>
          }
        </nav>
      }
    } @else if (posts.error()) {
      <p role="alert" class="rounded-md bg-red-50 p-4 text-red-700">
        Could not load posts. Is the API running? Start it with <code>npm run api</code>.
      </p>
    } @else {
      <p class="py-12 text-center text-gray-500">Loading posts…</p>
    }
  `,
})
export class PostList {
  private readonly router = inject(Router);

  // Bound from the query string by withComponentInputBinding(): /?q=forms&category=Angular&page=2
  readonly q = input('', { transform: (value: string | undefined) => value ?? '' });
  readonly category = input<string>();
  readonly page = input(1, { transform: toPageNumber });

  protected readonly categories = CATEGORIES;

  // Re-runs automatically whenever q, category or page changes.
  protected readonly posts = httpResource<Page<Post>>(() => {
    const params: Record<string, string | number> = {
      _page: this.page(),
      _per_page: PAGE_SIZE,
      _sort: '-publishedAt',
    };
    const category = this.category();
    if (category) params['category'] = category;
    const q = this.q().trim();
    if (q) params['title:contains'] = q;

    return { url: `${API_URL}/posts`, params };
  });

  protected search(q: string): void {
    void this.router.navigate(['/'], {
      queryParams: { q: q || null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected chip(active: boolean): string {
    const base = 'rounded-full px-3 py-1 text-sm font-medium';
    return active
      ? `${base} bg-blue-600 text-white`
      : `${base} bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100`;
  }
}

function toPageNumber(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
```

This is the most important file in Part 2. Let's go through it piece by piece.

### Query parameters become inputs

Because Part 1 added `withComponentInputBinding()`, the router copies query params into inputs **with the same name**:

| URL | `q()` | `category()` | `page()` |
|---|---|---|---|
| `/` | `''` | `undefined` | `1` |
| `/?q=signal` | `'signal'` | `undefined` | `1` |
| `/?category=CSS&page=2` | `''` | `'CSS'` | `2` |
| `/?page=abc` | `''` | `undefined` | `1` |

When a query param is **missing**, the router sets the input to `undefined`. That's why:

- `category = input<string>()` has the type `string | undefined`.
- `q` and `page` use a **`transform`** that turns `undefined` (or bad values like `abc`) into a safe default. Query params are always strings, so `toPageNumber` also converts `'2'` into the number `2`.

### A reactive request

`httpResource()` accepts a function that returns **a request object** (`{ url, params }`). It calls `this.page()`, `this.category()`, and `this.q()`, so the resource **re-fetches automatically** whenever any of them changes. When a new request starts, the old one is cancelled. You never call `subscribe()` or `unsubscribe()`.

The params map to the json-server queries from Part 1:

| Param | Meaning |
|---|---|
| `_page`, `_per_page` | Which page, and how many posts per page (`PAGE_SIZE = 6`) |
| `_sort: '-publishedAt'` | Newest first |
| `category` | Only added when a category is selected |
| `title:contains` | Only added when there is a search term |

### Updating the URL

The component never stores filter state in its own signals. It **changes the URL**, and the inputs follow:

- **Category chips and pagination** are links: `routerLink="/"` + `[queryParams]` + `queryParamsHandling="merge"`. *Merge* keeps the other params, so picking a category keeps your search. Setting a param to `null` removes it from the URL. For example, `page: null` jumps back to page 1 when the filter changes.
- **Search** comes from an event, so it uses code: `router.navigate(['/'], { queryParams, queryParamsHandling: 'merge' })`. An empty search sets `q: null` and removes it from the URL.

### Template details

- `@let result = posts.value();` stores the value under a short name for the rest of the block. `@let` is read-only and only exists inside its block.
- The page number is calculated from the response: `(result.prev ?? 0) + 1`. json-server corrects pages that are out of range (for example `?page=99` returns the last page), so the response is more reliable than the input.
- `[class]="chip(...)"` swaps between two sets of Tailwind classes. Use `[class]` or `[class.x]` bindings, not `ngClass`.

:::note[Why the URL and not a signal?]
A signal would work, but its state disappears on refresh, and you can't share it in a link. When state belongs in the URL (filters, search, page), let the router own it and read it as inputs. Use signals for state that doesn't belong in the URL, like "is this menu open?".
:::

## Step 4: Try it

Refresh `http://localhost:4200`. You should see a grid of 6 cards and "Page 1 of 2". Then:

1. Click **Older →**. The URL becomes `/?page=2` and shows one post.
2. Click **CSS**. The URL becomes `/?category=CSS` and the page resets to 1.
3. Click **All**, type `signal` in the search box, and press **Search**. You see "2 result(s) for “signal”".
4. While searching, click **Angular**. The URL becomes `/?q=signal&category=Angular`. Both filters apply.
5. Press the browser **Back** button. Each step is undone, because each one is a navigation.
6. Copy the URL into a new tab. You get exactly the same view.

## Your project so far

```text
src/app/
├── app.ts · app.config.ts · app.routes.ts · not-found.ts
├── layout/site-header.ts
└── posts/
    ├── post.ts
    ├── posts-api.ts
    ├── post-list.ts      ← upgraded
    ├── post-card.ts      ← new
    └── search-box.ts     ← new
```

`app.routes.ts` hasn't changed since Part 1.

## Common mistakes

| Problem | Fix |
|---|---|
| Inputs stay at their defaults | `withComponentInputBinding()` is missing from `provideRouter()` in `app.config.ts`. |
| Type error: `string \| undefined` is not assignable | The router sets missing params to `undefined`. Include it in the type, or use a `transform` with a default. |
| `page()` is the string `'2'`, not the number `2` | Query params are always strings. Convert them with a `transform`. |
| Choosing a category clears the search | Add `queryParamsHandling="merge"` to the link. |
| Card links show "Page not found" | That's expected. The post page is built in Part 3. |
| Posts flash to "Loading…" on each filter change | The resource has no value while a new request is loading. That's fine here. Keep a separate `linkedSignal` of the last result if you want to keep old data on screen. |

## Key takeaways

- Small components with `input()` and `output()` are easy to reuse and test.
- **The URL is state.** With `withComponentInputBinding()`, query params arrive as inputs, so you don't need `ActivatedRoute` subscriptions.
- `httpResource(() => ({ url, params }))` re-fetches whenever a signal it reads changes, and it cancels outdated requests.
- Use `queryParamsHandling: 'merge'` to change one param without losing the others, and `null` to remove one.

## Next steps

Continue with **[Part 3: Pages & Forms](/projects/blog-part3/)**. You build the post page, a create/edit form with Signal Forms, delete, an unsaved-changes guard, and tests.

Related guides: [Component Communication](/intermediate/component-communication/) · [Advanced Routing](/intermediate/advanced-routing/) · [httpResource](/modern/http-resource-api/) · [Template Syntax](/modern/template-syntax/)
