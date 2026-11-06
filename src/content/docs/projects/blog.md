---
title: Blog Platform - Part 1 (Setup & Data) 📝
description: Start a 3-part Angular 22 blog project. Set up Tailwind CSS, a fake REST API with json-server, typed models, a service, and your first httpResource page.
sidebar:
  order: 3
---

In this 3-part series you build a **blog platform** with Angular 22, Tailwind CSS, and a real REST API that runs on your machine. By the end of Part 3 you can list, search, filter, read, create, edit, and delete posts, and you have tests too.

## The series at a glance

| Part | You build | Main Angular features |
|---|---|---|
| **1. Setup & Data** (this page) | Project, fake API, models, layout, first list page | `ng new --style=tailwind`, `@Service()`, `httpResource()`, lazy routes |
| [2. Components](/projects/blog-part2/) | Post cards, search, category filters, pagination | `input()`, `output()`, query params as inputs, `@let` |
| [3. Pages & Forms](/projects/blog-part3/) | Post page, create/edit form, delete, unsaved-changes guard, tests | Signal Forms, `linkedSignal()`, `CanDeactivateFn`, Vitest |

At the end of each part the app compiles and runs.

## What you'll learn in Part 1

- How to create an Angular 22 app with **Tailwind CSS** already set up
- How to run a **fake REST API** with `json-server` so you have real data to work with
- How to describe API data with TypeScript **interfaces**
- When to use **`httpResource()`** (reading data) and when to use **`HttpClient`** (changing data)
- How to set up the router with **lazy-loaded** pages and **component input binding**

## Prerequisites

- **Node.js** `^22.22.3`, `^24.15.0`, or `^26` (required by Angular 22)
- The [Todo App](/projects/todo-app/) project, or the basics of components and signals
- New to the setup? Read [Prerequisites](/prerequisites/) and [Setup](/setup/) first.

## Step 1: Create the project with Tailwind CSS

```bash
npm install -g @angular/cli@22
ng new blog-platform --style=tailwind --ssr=false --ai-config=none
cd blog-platform
```

`--style=tailwind` does the whole Tailwind setup for you:

- installs `tailwindcss`, `@tailwindcss/postcss`, and `postcss`
- creates `.postcssrc.json` with the Tailwind PostCSS plugin
- adds `@import 'tailwindcss';` to `src/styles.css`

You don't need a `tailwind.config.js`. Tailwind v4 finds the classes in your templates automatically. Components still use plain `.css` files.

:::note[Adding Tailwind to an existing project]
If your project already exists, run `ng add tailwindcss`. It makes the same three changes.
:::

## Step 2: Add a fake REST API

You need data to build a blog. [json-server](https://www.npmjs.com/package/json-server) turns a JSON file into a full REST API with filtering, sorting, and pagination.

```bash
npm install --save-dev json-server
```

Create `db.json` in the **project root** (next to `package.json`, not inside `src/`):

```json title="db.json"
{
  "posts": [
    {
      "id": "1",
      "title": "Getting started with signals",
      "excerpt": "Learn signal, computed and effect in ten minutes.",
      "content": "Signals are values that tell Angular when they change.\n\nUse signal() for state, computed() for derived values and effect() for side effects.",
      "author": "Asha",
      "category": "Angular",
      "tags": ["signals", "basics"],
      "coverUrl": "https://picsum.photos/seed/signals/800/400",
      "publishedAt": "2026-10-02T09:00:00.000Z"
    },
    {
      "id": "2",
      "title": "Signal Forms in practice",
      "excerpt": "Build a typed, validated form with form() and [formField].",
      "content": "Signal Forms keep your form model in a signal.\n\nValidation rules live in a schema function next to the model.",
      "author": "Ben",
      "category": "Angular",
      "tags": ["forms", "signals"],
      "coverUrl": "https://picsum.photos/seed/forms/800/400",
      "publishedAt": "2026-10-09T09:00:00.000Z"
    },
    {
      "id": "3",
      "title": "TypeScript utility types you will use daily",
      "excerpt": "Partial, Pick, Omit and Record explained with examples.",
      "content": "Utility types transform existing types.\n\nOmit<Post, 'id'> is perfect for create payloads.",
      "author": "Chen",
      "category": "TypeScript",
      "tags": ["types"],
      "coverUrl": "https://picsum.photos/seed/typescript/800/400",
      "publishedAt": "2026-10-12T09:00:00.000Z"
    },
    {
      "id": "4",
      "title": "Modern CSS layout with grid",
      "excerpt": "Responsive card grids without media queries.",
      "content": "CSS grid with auto-fill and minmax() creates responsive layouts.\n\nTailwind exposes the same ideas as utility classes.",
      "author": "Dana",
      "category": "CSS",
      "tags": ["layout", "grid"],
      "coverUrl": "https://picsum.photos/seed/grid/800/400",
      "publishedAt": "2026-10-16T09:00:00.000Z"
    },
    {
      "id": "5",
      "title": "Routing with component input binding",
      "excerpt": "Read route and query parameters as plain component inputs.",
      "content": "withComponentInputBinding() passes route params, query params and data to inputs.\n\nNo ActivatedRoute subscription needed.",
      "author": "Asha",
      "category": "Angular",
      "tags": ["routing"],
      "coverUrl": "https://picsum.photos/seed/routing/800/400",
      "publishedAt": "2026-10-20T09:00:00.000Z"
    },
    {
      "id": "6",
      "title": "Fetching data with httpResource",
      "excerpt": "Reactive HTTP requests that re-run when signals change.",
      "content": "httpResource() turns a URL function into a resource with value, error and isLoading signals.\n\nIt re-fetches whenever a signal it reads changes.",
      "author": "Ben",
      "category": "Angular",
      "tags": ["http", "signals"],
      "coverUrl": "https://picsum.photos/seed/http/800/400",
      "publishedAt": "2026-10-24T09:00:00.000Z"
    },
    {
      "id": "7",
      "title": "Writing your first developer blog post",
      "excerpt": "Tips for sharing what you learn.",
      "content": "Write about the problem you just solved.\n\nShort, focused posts help more people than long ones.",
      "author": "Chen",
      "category": "Career",
      "tags": ["writing"],
      "coverUrl": "https://picsum.photos/seed/writing/800/400",
      "publishedAt": "2026-10-28T09:00:00.000Z"
    }
  ]
}
```

Add an `api` script to `package.json`:

```json title="package.json" ins={6}
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "api": "json-server db.json",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  }
}
```

Start the API in its **own terminal** and leave it running:

```bash
npm run api
```

Open these URLs in your browser to see what the API can do. We use every one of them in this series:

| Request | Returns |
|---|---|
| `GET /posts?_sort=-publishedAt` | All posts, newest first |
| `GET /posts?_page=1&_per_page=6` | One page: `{ first, prev, next, last, pages, items, data: [...] }` |
| `GET /posts?category=CSS` | Posts in one category |
| `GET /posts?title:contains=signal` | Posts whose title contains "signal" (case-insensitive) |
| `GET /posts/2` | One post (404 if it doesn't exist) |
| `POST /posts` · `PATCH /posts/2` · `DELETE /posts/2` | Create, update, delete |

json-server **writes changes back to `db.json`**. Make a copy of the file if you want to reset the data later.

:::caution[json-server v1 is labelled beta]
This series was tested with `json-server@1.0.0-beta.15` (the `latest` version on npm). Version 1 uses the query syntax above (`_per_page`, `title:contains`). The older `0.17.x` uses a different syntax (`_limit`, `q`). If a newer release breaks something, install the tested version: `npm install --save-dev json-server@1.0.0-beta.15`.
:::

## Step 3: Plan the files

This is how the app looks at the end of Part 3. In this part you create the files marked ★:

```text
blog-platform/
├── db.json                         ★ fake database
└── src/
    ├── styles.css                  (generated, contains @import 'tailwindcss')
    └── app/
        ├── app.ts                  ★ layout: header + <router-outlet />
        ├── app.config.ts           ★ router + HttpClient
        ├── app.routes.ts           ★ lazy routes
        ├── not-found.ts            ★ 404 page
        ├── layout/
        │   └── site-header.ts      ★
        ├── shared/
        │   └── field-errors.ts       (Part 3)
        └── posts/
            ├── post.ts             ★ types
            ├── posts-api.ts        ★ API URL + write operations
            ├── post-list.ts        ★ home page (simple now, upgraded in Part 2)
            ├── post-card.ts          (Part 2)
            ├── search-box.ts         (Part 2)
            ├── post-detail.ts        (Part 3)
            ├── post-editor.ts        (Part 3)
            └── unsaved-changes.guard.ts (Part 3)
```

## Step 4: Describe the data

Create `src/app/posts/post.ts`:

```ts title="src/app/posts/post.ts"
export const CATEGORIES = ['Angular', 'TypeScript', 'CSS', 'Career'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: Category;
  tags: string[];
  coverUrl: string;
  publishedAt: string; // ISO date string, e.g. "2026-10-02T09:00:00.000Z"
}

/** Everything the editor form can change. The server creates `id`. */
export type PostInput = Omit<Post, 'id' | 'publishedAt'>;

/** A paginated response from json-server: GET /posts?_page=1&_per_page=6 */
export interface Page<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}
```

- `CATEGORIES … as const` keeps the exact strings. `Category` then becomes the union type `'Angular' | 'TypeScript' | 'CSS' | 'Career'`.
- `publishedAt` is a `string`, not a `Date`. JSON has no date type, so the API sends a string. Angular's `date` pipe formats ISO strings just fine.
- `PostInput` uses `Omit<>` so the create/edit form can't accidentally send an `id`.
- `Page<T>` matches exactly what json-server returns for paginated requests.

## Step 5: The API service

Create `src/app/posts/posts-api.ts`:

```ts title="src/app/posts/posts-api.ts"
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Post, PostInput } from './post';

export const API_URL = 'http://localhost:3000';
export const PAGE_SIZE = 6;

/** Write operations. Reads use httpResource() directly in components. */
@Service()
export class PostsApi {
  private readonly http = inject(HttpClient);

  create(input: PostInput): Promise<Post> {
    const body = { ...input, publishedAt: new Date().toISOString() };
    return firstValueFrom(this.http.post<Post>(`${API_URL}/posts`, body));
  }

  update(id: string, input: PostInput): Promise<Post> {
    return firstValueFrom(this.http.patch<Post>(`${API_URL}/posts/${id}`, input));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_URL}/posts/${id}`));
  }
}
```

This service only handles **writes**, because Angular has two tools for HTTP and each has its own job:

| Task | Use | Why |
|---|---|---|
| **Read** data for the screen | `httpResource()` in the component | It re-fetches when signals change, cancels outdated requests, and gives you `value()`, `isLoading()`, and `error()` as signals |
| **Change** data (POST, PATCH, DELETE) | `HttpClient` in a service | It runs once, exactly when you call it. `httpResource` is not meant for mutations. |

`firstValueFrom()` (from RxJS) turns the `Observable` from `HttpClient` into a `Promise`. Then components can simply `await api.create(...)`. It also fits the `async` submit action of Signal Forms in Part 3.

:::note[Angular 21 and earlier]
For Angular 21 and earlier, use `@Injectable({ providedIn: 'root' })`; `@Service()` was added in Angular 22. `@Injectable()` remains valid in v22 when a service needs constructor injection or advanced provider configuration.
:::

## Step 6: App config

Replace `src/app/app.config.ts`:

```ts title="src/app/app.config.ts"
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(), // route params, query params and data -> component inputs
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }), // scroll to top on navigation
    ),
    provideHttpClient(),
  ],
};
```

- **`withComponentInputBinding()`** passes route parameters (`/posts/:id`) and query parameters (`?page=2`) to component `input()`s. We rely on this in all three parts.
- **`withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })`** scrolls to the top when you open a new page, and restores the old position when you go back.
- **`provideHttpClient()`** sets up HTTP. Since v21, `HttpClient` can be injected even without it. But this is the place to add interceptors later, so we keep it. Angular uses the browser's `fetch` API by default, so you don't need `withFetch()` (it is deprecated).

## Step 7: Layout, header, and 404 page

Create `src/app/layout/site-header.ts`:

```ts title="src/app/layout/site-header.ts"
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3" aria-label="Main">
        <a routerLink="/" class="text-xl font-bold text-blue-600">📝 NG Blog</a>
        <a
          routerLink="/posts/new"
          routerLinkActive="ring-2 ring-blue-300"
          ariaCurrentWhenActive="page"
          class="ml-auto rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          New post
        </a>
      </nav>
    </header>
  `,
})
export class SiteHeader {}
```

Create `src/app/not-found.ts`:

```ts title="src/app/not-found.ts"
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="py-16 text-center">
      <h1 class="text-3xl font-bold">Page not found</h1>
      <p class="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <a routerLink="/" class="mt-6 inline-block text-blue-600 hover:underline">← Back to all posts</a>
    </div>
  `,
})
export class NotFound {}
```

Replace `src/app/app.ts`. It uses an inline template, so **delete** `src/app/app.html` and `src/app/app.css`. Also delete `src/app/app.spec.ts`: it checks for the CLI welcome page, which is gone. You write real tests in Part 3.

```ts title="src/app/app.ts"
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './layout/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader],
  host: { class: 'block min-h-screen bg-gray-50 text-gray-900' },
  template: `
    <app-site-header />
    <main class="mx-auto max-w-5xl px-4 py-8">
      <router-outlet />
    </main>
    <footer class="py-8 text-center text-sm text-gray-500">
      Built with Angular and Tailwind CSS
    </footer>
  `,
})
export class App {}
```

The `host` property puts Tailwind classes on the `<app-root>` element itself. That is the modern replacement for `@HostBinding`. Remember that components are **OnPush by default since v22**, so you never need to set `changeDetection`.

## Step 8: Your first page with `httpResource`

Create `src/app/posts/post-list.ts`. This is a simple version. In Part 2 you add cards, search, filters, and pagination.

```ts title="src/app/posts/post-list.ts"
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { Post } from './post';
import { API_URL } from './posts-api';

@Component({
  selector: 'app-post-list',
  imports: [DatePipe],
  template: `
    <h1 class="mb-6 text-3xl font-bold">Latest posts</h1>

    @if (posts.hasValue()) {
      <ul class="space-y-4">
        @for (post of posts.value(); track post.id) {
          <li class="rounded-lg bg-white p-5 shadow-sm">
            <h2 class="text-xl font-semibold">{{ post.title }}</h2>
            <p class="text-sm text-gray-500">
              {{ post.author }} · {{ post.publishedAt | date: 'mediumDate' }}
            </p>
            <p class="mt-2 text-gray-700">{{ post.excerpt }}</p>
          </li>
        } @empty {
          <li class="text-gray-500">No posts yet.</li>
        }
      </ul>
    } @else if (posts.error()) {
      <p role="alert" class="rounded-md bg-red-50 p-4 text-red-700">
        Could not load posts. Is the API running? Start it with <code>npm run api</code>.
      </p>
    } @else {
      <p class="text-gray-500">Loading posts…</p>
    }
  `,
})
export class PostList {
  // Sends GET http://localhost:3000/posts?_sort=-publishedAt as soon as the component is created.
  protected readonly posts = httpResource<Post[]>(() => `${API_URL}/posts?_sort=-publishedAt`);
}
```

How it works:

1. `httpResource<Post[]>(() => url)` sends the request **as soon as the component is created**. You don't need `ngOnInit` or `subscribe()`.
2. The template checks the resource's state: `hasValue()` → show posts, `error()` → show a message, otherwise → loading.
3. Inside `@if (posts.hasValue())`, TypeScript knows that `posts.value()` is a `Post[]` and not `undefined`.

:::tip[Always guard `value()`]
Reading `value()` while a resource is in the error state **throws**. Check `hasValue()` first, as shown above.
:::

Now replace `src/app/app.routes.ts`:

```ts title="src/app/app.routes.ts"
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'NG Blog',
    loadComponent: () => import('./posts/post-list').then((m) => m.PostList),
  },
  {
    path: '**',
    title: 'Page not found · NG Blog',
    loadComponent: () => import('./not-found').then((m) => m.NotFound),
  },
];
```

`loadComponent` loads each page **lazily**: the page's code is downloaded the first time someone visits it. The `title` property sets the browser tab title.

## Step 9: Run it

You need **two terminals**:

```bash
# Terminal 1: the API on http://localhost:3000
npm run api
```

```bash
# Terminal 2: Angular on http://localhost:4200
ng serve
```

Open `http://localhost:4200`. You should see seven posts, newest first. Things to try:

- Stop the API (`Ctrl+C` in terminal 1) and refresh. You see the red "Could not load posts" message.
- Visit `http://localhost:4200/anything`. You see the 404 page.
- Click **New post**. For now you also see the 404 page. You build the editor in Part 3.

## Common mistakes

| Problem | Fix |
|---|---|
| "Could not load posts" | Start the API with `npm run api`, and check that `db.json` is in the project root. |
| Tailwind classes have no effect | Check that `src/styles.css` contains `@import 'tailwindcss';` and that `.postcssrc.json` exists. Restart `ng serve`. |
| `ng test` fails with "Hello, blog-platform" | Delete the generated `src/app/app.spec.ts` (Step 7). |
| Using `httpResource` to POST or DELETE | Use `HttpClient` for mutations, as in `PostsApi`. |
| `post.publishedAt.getFullYear()` crashes | The API returns a **string**. Use the `date` pipe, or call `new Date(post.publishedAt)` first. |

## Key takeaways

- `ng new --style=tailwind` sets up Tailwind v4 for you. You don't need a config file.
- **Reads** go through `httpResource()` (reactive, gives you status signals), and **writes** go through `HttpClient` (imperative).
- `@Service()` creates a shared, app-wide service in one line.
- `withComponentInputBinding()` lets routes pass parameters straight into `input()`s.

## Next steps

Continue with **[Part 2: Components](/projects/blog-part2/)**. You turn the list into a card grid with search, category filters, and pagination, all driven by the URL.

Related guides: [httpResource](/modern/http-resource-api/) · [Routing](/beginner/routing/) · [Services](/beginner/services/) · [HTTP](/beginner/http/)
