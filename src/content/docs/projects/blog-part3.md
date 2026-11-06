---
title: Blog Platform - Part 3 (Pages & Forms) ✍️
description: Finish the Angular 22 blog with a post page, a create/edit form built with Signal Forms, delete, an unsaved-changes guard, route titles, and Vitest tests.
sidebar:
  order: 5
---

This is the final part of the Blog Platform series. You add the **post page**, one **editor** that handles both creating and editing (built with Signal Forms), **delete**, a guard that warns about **unsaved changes**, and **tests**. At the end you have a complete CRUD app.

**Previous:** [Part 2: Components](/projects/blog-part2/)

## What you'll learn

- How to read a **route parameter** (`/posts/:id`) as a required input and load data with `httpResource()`
- How to build a **create + edit form** with Signal Forms: a `linkedSignal()` model, a validation schema, `[formRoot]`, and an async `submission.action`
- How to show **server errors** from a submit action
- How to stop users from losing work with a **`CanDeactivateFn`** guard
- How to update the **browser tab title** with an `effect()`
- How to test HTTP code with `HttpTestingController` and routed components with `RouterTestingHarness`

## Step 1: A reusable error component

Every form field shows its errors the same way, so we put that logic in a small component. Create `src/app/shared/field-errors.ts`:

```ts title="src/app/shared/field-errors.ts"
import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/** Shows a field's validation messages after the user has touched it. */
@Component({
  selector: 'app-field-errors',
  template: `
    @let state = field()();
    @if (state.touched() && state.invalid()) {
      @for (error of state.errors(); track error.kind) {
        <p class="mt-1 text-sm text-red-600">{{ error.message }}</p>
      }
    }
  `,
})
export class FieldErrors {
  readonly field = input.required<FieldTree<unknown>>();
}
```

In Signal Forms, `postForm.title` is a **field** (a `FieldTree`). **Calling** it, as in `field()()`, gives you its state: `touched()`, `invalid()`, `errors()`, and more. Each error has a `kind` (such as `'required'`) and the `message` you write in the schema. Errors only appear after the user has touched the field, so a fresh form doesn't look broken.

## Step 2: The post page

Create `src/app/posts/post-detail.ts`:

```ts title="src/app/posts/post-detail.ts"
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Post } from './post';
import { API_URL, PostsApi } from './posts-api';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, DatePipe],
  template: `
    @if (post.hasValue()) {
      @let p = post.value();
      <article class="overflow-hidden rounded-xl bg-white shadow-sm">
        <img [src]="p.coverUrl" alt="" width="800" height="400" class="h-72 w-full object-cover" />
        <div class="p-8">
          <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">{{ p.category }}</p>
          <h1 class="mt-2 text-4xl font-bold">{{ p.title }}</h1>
          <p class="mt-2 text-gray-500">
            By {{ p.author }} ·
            <time [attr.datetime]="p.publishedAt">{{ p.publishedAt | date: 'longDate' }}</time>
          </p>

          <div class="mt-6 whitespace-pre-line leading-relaxed text-gray-800">{{ p.content }}</div>

          <ul class="mt-6 flex flex-wrap gap-2">
            @for (tag of p.tags; track tag) {
              <li class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">#{{ tag }}</li>
            }
          </ul>

          <div class="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
            <a routerLink="/" class="text-blue-600 hover:underline">← All posts</a>
            <a
              [routerLink]="['/posts', p.id, 'edit']"
              class="ml-auto rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Edit
            </a>
            <button
              type="button"
              (click)="remove(p)"
              [disabled]="deleting()"
              class="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {{ deleting() ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </article>
    } @else if (post.error()) {
      <div class="py-16 text-center">
        <h1 class="text-2xl font-bold">We couldn't load this post</h1>
        <p class="mt-2 text-gray-600">It may have been deleted, or the API is not running.</p>
        <a routerLink="/" class="mt-6 inline-block text-blue-600 hover:underline">← Back to all posts</a>
      </div>
    } @else {
      <p class="py-16 text-center text-gray-500">Loading post…</p>
    }
  `,
})
export class PostDetail {
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  // Bound from the :id route parameter by withComponentInputBinding().
  readonly id = input.required<string>();

  protected readonly post = httpResource<Post>(() => `${API_URL}/posts/${this.id()}`);
  protected readonly deleting = signal(false);

  constructor() {
    // Show the post title in the browser tab once it has loaded.
    effect(() => {
      if (this.post.hasValue()) {
        this.title.setTitle(`${this.post.value().title} · NG Blog`);
      }
    });
  }

  protected async remove(post: Post): Promise<void> {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    this.deleting.set(true);
    try {
      await this.api.delete(post.id);
      await this.router.navigateByUrl('/');
    } catch {
      alert('Could not delete the post. Please try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
```

- **`id = input.required<string>()`**: the router fills it in from `/posts/:id` (thanks to `withComponentInputBinding()`). When you go from one post to another, `id` changes and `httpResource` loads the new post on its own.
- **`@let p = post.value();`** gives the post a short name for the rest of the template.
- **`whitespace-pre-line`** keeps the blank lines from the post content. We show the content as plain text, so Angular escapes it, and there is no XSS risk.
- **Delete** uses `PostsApi` (an `HttpClient` mutation), then navigates home. The `deleting` signal disables the button so nobody clicks twice.
- **`effect()`** sets the tab title once the post has loaded. Effects are for side effects like this one: syncing signal values with something outside Angular's templates.
- A missing post returns HTTP 404, so `post.error()` is set, and we show a friendly message.

## Step 3: The editor (Signal Forms)

One component handles both `/posts/new` and `/posts/:id/edit`. Create `src/app/posts/post-editor.ts`:

```ts title="src/app/posts/post-editor.ts"
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { FieldErrors } from '../shared/field-errors';
import { CATEGORIES, Category, Post, PostInput } from './post';
import { API_URL, PostsApi } from './posts-api';

/** The form model: like PostInput, but tags are edited as one comma-separated string. */
interface PostFormModel {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: Category;
  coverUrl: string;
  tags: string;
}

const EMPTY_POST: PostFormModel = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  category: 'Angular',
  coverUrl: '',
  tags: '',
};

@Component({
  selector: 'app-post-editor',
  imports: [FormField, FormRoot, FieldErrors, RouterLink],
  template: `
    <h1 class="mb-6 text-3xl font-bold">{{ id() ? 'Edit post' : 'New post' }}</h1>

    @if (existing.isLoading()) {
      <p class="text-gray-500">Loading post…</p>
    } @else if (existing.error()) {
      <p role="alert" class="rounded-md bg-red-50 p-4 text-red-700">This post could not be loaded.</p>
    } @else {
      <form [formRoot]="postForm" class="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label for="title" class="mb-1 block font-medium">Title</label>
          <input id="title" [formField]="postForm.title" class="w-full rounded-md border border-gray-300 px-3 py-2" />
          <app-field-errors [field]="postForm.title" />
        </div>

        <div>
          <label for="excerpt" class="mb-1 block font-medium">Summary</label>
          <textarea id="excerpt" rows="2" [formField]="postForm.excerpt" class="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
          <app-field-errors [field]="postForm.excerpt" />
        </div>

        <div>
          <label for="content" class="mb-1 block font-medium">Content</label>
          <textarea id="content" rows="10" [formField]="postForm.content" class="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
          <app-field-errors [field]="postForm.content" />
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="author" class="mb-1 block font-medium">Author</label>
            <input id="author" [formField]="postForm.author" class="w-full rounded-md border border-gray-300 px-3 py-2" />
            <app-field-errors [field]="postForm.author" />
          </div>

          <div>
            <label for="category" class="mb-1 block font-medium">Category</label>
            <select id="category" [formField]="postForm.category" class="w-full rounded-md border border-gray-300 px-3 py-2">
              @for (name of categories; track name) {
                <option [value]="name">{{ name }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label for="coverUrl" class="mb-1 block font-medium">Cover image URL</label>
          <input id="coverUrl" type="url" placeholder="https://picsum.photos/seed/my-post/800/400" [formField]="postForm.coverUrl" class="w-full rounded-md border border-gray-300 px-3 py-2" />
          <app-field-errors [field]="postForm.coverUrl" />
        </div>

        <div>
          <label for="tags" class="mb-1 block font-medium">Tags <span class="font-normal text-gray-500">(comma-separated)</span></label>
          <input id="tags" placeholder="signals, forms" [formField]="postForm.tags" class="w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>

        @for (error of postForm().errors(); track error.kind) {
          <p role="alert" class="rounded-md bg-red-50 p-3 text-red-700">{{ error.message }}</p>
        }

        <div class="flex items-center gap-3">
          <button
            type="submit"
            [disabled]="postForm().submitting()"
            class="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ postForm().submitting() ? 'Saving…' : 'Save post' }}
          </button>
          <a [routerLink]="id() ? ['/posts', id()] : ['/']" class="text-gray-600 hover:underline">Cancel</a>
        </div>
      </form>
    }
  `,
})
export class PostEditor {
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);

  // From the :id route parameter. Undefined on /posts/new.
  readonly id = input<string>();

  protected readonly categories = CATEGORIES;

  // Only fetches when there is an id. Returning undefined keeps the resource idle.
  protected readonly existing = httpResource<Post>(() => {
    const id = this.id();
    return id ? `${API_URL}/posts/${id}` : undefined;
  });

  // Starts empty and resets to the loaded post as soon as it arrives.
  protected readonly model = linkedSignal<PostFormModel>(() =>
    this.existing.hasValue() ? toFormModel(this.existing.value()) : { ...EMPTY_POST },
  );

  protected readonly postForm = form(
    this.model,
    (path) => {
      required(path.title, { message: 'Give your post a title.' });
      maxLength(path.title, 120, { message: 'Keep the title under 120 characters.' });
      required(path.excerpt, { message: 'Write a one-line summary.' });
      maxLength(path.excerpt, 200, { message: 'Keep the summary under 200 characters.' });
      required(path.content, { message: 'The post needs some content.' });
      minLength(path.content, 50, { message: 'Write at least 50 characters.' });
      required(path.author, { message: 'Who wrote this post?' });
      required(path.coverUrl, { message: 'Add a cover image URL.' });
      pattern(path.coverUrl, /^https?:\/\/\S+$/, { message: 'Use a full http(s):// URL.' });
    },
    {
      submission: {
        action: async (field) => {
          const input = toPostInput(field().value());
          const id = this.id();
          try {
            const saved = id ? await this.api.update(id, input) : await this.api.create(input);
            field().reset(); // clear "dirty" so the unsaved-changes guard lets us leave
            await this.router.navigate(['/posts', saved.id]);
            return undefined;
          } catch {
            return { kind: 'server', message: 'Could not save the post. Is the API running?' };
          }
        },
      },
    },
  );

  /** Read by unsavedChangesGuard before leaving the page. */
  readonly hasUnsavedChanges = computed(() => this.postForm().dirty());
}

function toFormModel(post: Post): PostFormModel {
  const { title, excerpt, content, author, category, coverUrl } = post;
  return { title, excerpt, content, author, category, coverUrl, tags: post.tags.join(', ') };
}

function toPostInput(model: PostFormModel): PostInput {
  return {
    ...model,
    title: model.title.trim(),
    tags: model.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
  };
}
```

Let's go through it piece by piece.

### 1. The form model is a `linkedSignal`

`form()` needs a **writable signal** that holds the form value. We need two things from it:

- On `/posts/new`, it should start empty.
- On `/posts/2/edit`, it should fill itself in **after** the post loads.

`linkedSignal()` does both. It is a writable signal (the form can update it while the user types), but it **recomputes** whenever its source changes. Here the source is `existing.value()`. When the post arrives, the model resets to the post's values.

The form model doesn't have to match the API type. Tags are easier to edit as one string (`"signals, forms"`), so `PostFormModel.tags` is a `string`. `toPostInput()` turns it back into an array when you save.

### 2. A conditional `httpResource`

```ts
return id ? `${API_URL}/posts/${id}` : undefined;
```

When the request function returns `undefined`, the resource stays **idle** and sends nothing. On `/posts/new`, no request is made.

### 3. The validation schema

The second argument of `form()` lists the rules. Each one points at a field path:

| Rule | Field | Error message |
|---|---|---|
| `required()` | title, excerpt, content, author, coverUrl | "Give your post a title." and so on |
| `maxLength()` | title (120), excerpt (200) | "Keep the title under 120 characters." |
| `minLength()` | content (50) | "Write at least 50 characters." |
| `pattern()` | coverUrl | "Use a full http(s):// URL." |

Rules re-run whenever the value changes. `required`, `minLength`, and `maxLength` also set the matching HTML attributes, which helps accessibility.

### 4. Binding fields

`[formField]="postForm.title"` works on `<input>`, `<textarea>`, and `<select>`. It keeps the value, touched and dirty state, and disabled state in sync, in both directions. You don't need `FormsModule`, `ReactiveFormsModule`, or `formControlName`.

### 5. Submitting

`[formRoot]="postForm"` on the `<form>`:

1. adds `novalidate` and stops the page from reloading,
2. marks every field as touched, so all errors become visible,
3. runs `submission.action` **only if the form is valid**.

While the async action runs, `postForm().submitting()` is `true`. We use it to disable the button and show "Saving…".

Inside the action:

- **On success**, `field().reset()` clears the *dirty* flag (so the guard in Step 4 lets you leave), and then we navigate to the saved post.
- **On failure**, we **return an error object** `{ kind: 'server', message }`. Signal Forms attaches it to the form, and the template shows it through `postForm().errors()`. It clears itself as soon as the user edits the form again.

:::note[Angular 21 and earlier]
Signal Forms are **stable in Angular 22**. In v21 they were experimental, and some APIs were different. On older versions, build this form with [Reactive Forms](/intermediate/reactive-forms/) instead.
:::

## Step 4: The unsaved-changes guard

Create `src/app/posts/unsaved-changes.guard.ts`:

```ts title="src/app/posts/unsaved-changes.guard.ts"
import { CanDeactivateFn } from '@angular/router';
import type { PostEditor } from './post-editor';

export const unsavedChangesGuard: CanDeactivateFn<PostEditor> = (editor) =>
  !editor.hasUnsavedChanges() || confirm('You have unsaved changes. Leave this page anyway?');
```

A `CanDeactivateFn` runs before the router leaves a route. It receives the component instance, so it can ask `editor.hasUnsavedChanges()`. That is a `computed()` of `postForm().dirty()`, which is `true` once the user has changed any field. If the guard returns `false`, the navigation is cancelled.

`import type` matters here. The routes file imports this guard right away, but we only need `PostEditor` as a **type**. With `import type`, the editor's code stays in its own lazy-loaded chunk.

:::tip
A guard only protects navigation **inside** the app. To warn users who close the tab, also listen to the browser's `beforeunload` event (for example, with `host: { '(window:beforeunload)': '…' }`).
:::

## Step 5: The final routes

Replace `src/app/app.routes.ts`:

```ts title="src/app/app.routes.ts"
import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './posts/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'NG Blog',
    loadComponent: () => import('./posts/post-list').then((m) => m.PostList),
  },
  {
    path: 'posts/new', // must come before 'posts/:id'
    title: 'New post · NG Blog',
    loadComponent: () => import('./posts/post-editor').then((m) => m.PostEditor),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'posts/:id',
    title: 'Post · NG Blog',
    loadComponent: () => import('./posts/post-detail').then((m) => m.PostDetail),
  },
  {
    path: 'posts/:id/edit',
    title: 'Edit post · NG Blog',
    loadComponent: () => import('./posts/post-editor').then((m) => m.PostEditor),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: '**',
    title: 'Page not found · NG Blog',
    loadComponent: () => import('./not-found').then((m) => m.NotFound),
  },
];
```

- **Order matters.** The router uses the first route that matches. `posts/new` has to come before `posts/:id`. Otherwise "new" would be treated as an id.
- The same component (`PostEditor`) serves two routes. Its `id` input is `undefined` on `/posts/new`.
- `title` sets the tab title for each route. The post page replaces it with the real post title (Step 2).

## Step 6: Try the whole app

With `npm run api` and `ng serve` running:

1. Open a post from the home page. The tab title shows the post title.
2. Click **Edit**. The form fills in, and tags appear as `forms, signals`.
3. Change the title, then click **Cancel**. The guard asks if you want to leave. Choose **Cancel** to stay.
4. Change the category and click **Save post**. You land on the updated post.
5. Click **New post** and then **Save post** without typing anything. Every required field shows its message.
6. Enter `not-a-url` as the cover image URL. You see "Use a full http(s):// URL."
7. Fill in the form correctly (try tags `a, b, , c`, and the empty tag is removed) and save. You land on the new post.
8. Click **Delete** and confirm. You are back on the home page, and the post is gone (check `db.json`).
9. Stop the API and try to save a post. The form shows "Could not save the post. Is the API running?"

## Step 7: Tests with Vitest

### Testing the API service

Create `src/app/posts/posts-api.spec.ts`:

```ts title="src/app/posts/posts-api.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PostInput } from './post';
import { API_URL, PostsApi } from './posts-api';

const input: PostInput = {
  title: 'Hello',
  excerpt: 'Summary',
  content: 'Content',
  author: 'Asha',
  category: 'Angular',
  coverUrl: 'https://picsum.photos/seed/hello/800/400',
  tags: ['intro'],
};

describe('PostsApi', () => {
  let api: PostsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PostsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify()); // fail if a request was not handled

  it('creates a post with a publish date', async () => {
    const saved = api.create(input);

    const req = httpTesting.expectOne(`${API_URL}/posts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ title: 'Hello', publishedAt: expect.any(String) });

    req.flush({ ...req.request.body, id: '42' });
    await expect(saved).resolves.toMatchObject({ id: '42', title: 'Hello' });
  });

  it('updates a post with PATCH', async () => {
    const saved = api.update('42', input);

    const req = httpTesting.expectOne(`${API_URL}/posts/42`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...input, id: '42', publishedAt: '2026-10-02T09:00:00.000Z' });

    await expect(saved).resolves.toMatchObject({ id: '42' });
  });
});
```

- `provideHttpClientTesting()` swaps the real backend for a fake. No network calls are made.
- `httpTesting.expectOne(url)` checks that exactly one request was sent and returns it, so you can inspect it and `flush()` a fake response.
- `httpTesting.verify()` in `afterEach` fails the test if any request was left unhandled.

### Testing a routed component

Create `src/app/posts/post-detail.spec.ts`:

```ts title="src/app/posts/post-detail.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Post } from './post';
import { PostDetail } from './post-detail';
import { API_URL } from './posts-api';

const post: Post = {
  id: '1',
  title: 'Getting started with signals',
  excerpt: 'Summary',
  content: 'Content',
  author: 'Asha',
  category: 'Angular',
  coverUrl: 'https://picsum.photos/seed/signals/800/400',
  tags: ['signals'],
  publishedAt: '2026-10-02T09:00:00.000Z',
};

describe('PostDetail', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'posts/:id', component: PostDetail }], withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('loads the post whose id is in the URL', async () => {
    const harness = await RouterTestingHarness.create('/posts/1');
    const httpTesting = TestBed.inject(HttpTestingController);

    httpTesting.expectOne(`${API_URL}/posts/1`).flush(post);
    await harness.fixture.whenStable();

    const heading = harness.routeNativeElement?.querySelector('h1');
    expect(heading?.textContent).toContain('Getting started with signals');
  });
});
```

`RouterTestingHarness.create('/posts/1')` really navigates. So this test checks the whole chain: URL → `id` input → `httpResource` request → rendered title. `await harness.fixture.whenStable()` waits for the zoneless app to render.

Run the tests:

```bash
ng test
```

You should see `Test Files  2 passed` and `Tests  3 passed`.

## The finished project

```text
blog-platform/
├── db.json
└── src/app/
    ├── app.ts · app.config.ts · app.routes.ts · not-found.ts
    ├── layout/site-header.ts
    ├── shared/field-errors.ts
    └── posts/
        ├── post.ts                  types
        ├── posts-api.ts             API_URL + create/update/delete
        ├── post-list.ts             home: search, filters, pagination
        ├── post-card.ts
        ├── search-box.ts
        ├── post-detail.ts           read + delete
        ├── post-editor.ts           create + edit (Signal Forms)
        ├── unsaved-changes.guard.ts
        ├── posts-api.spec.ts
        └── post-detail.spec.ts
```

## What you used, and where

| Feature | Where |
|---|---|
| `@Service()` + `inject()` | `PostsApi`, every component |
| `httpResource()` | `PostList`, `PostDetail`, `PostEditor` |
| `withComponentInputBinding()` | `id`, `q`, `category`, `page` inputs |
| `input()` / `output()` | `PostCard`, `SearchBox`, `FieldErrors` |
| `computed()` / `effect()` / `linkedSignal()` | `hasUnsavedChanges`, tab title, editor model |
| Signal Forms | `PostEditor`, `FieldErrors` |
| Control flow `@if` / `@for` / `@let` | every template |
| Lazy routes + route `title` + `CanDeactivateFn` | `app.routes.ts` |
| Vitest + `HttpTestingController` + `RouterTestingHarness` | spec files |

## Common mistakes

| Problem | Fix |
|---|---|
| `/posts/new` shows "We couldn't load this post" | `posts/:id` is listed before `posts/new`. Put `posts/new` first. |
| The edit form stays empty | Use `linkedSignal(() => …existing.value()…)` for the model, not `signal()`. A plain signal never sees the loaded post. |
| The guard warns even after saving | Call `field().reset()` in the action before you navigate. |
| The submit button does nothing | Check that `FormRoot` is in `imports` and that `form()` was given a `submission` option. |
| An error is thrown when reading `post.value()` | Check `post.hasValue()` first. `value()` throws while the resource is in the error state. |
| Using `ngModel` or `formControlName` with `[formField]` | Don't mix the form systems on the same control. Use only `[formField]`. |

## Ideas to extend the project

1. **Markdown content**: render `content` as Markdown with a sanitising library.
2. **Comments**: add a `comments` collection to `db.json` and load it with ``httpResource(() => `${API_URL}/comments?postId=${this.id()}`)``.
3. **Authentication**: add a login page and a `CanActivateFn` that protects `/posts/new` and `/posts/:id/edit`.
4. **SEO and speed**: add server-side rendering and prerendering with `ng add @angular/ssr`. See [SSR Introduction](/ssr/introduction/) and [Static Generation](/ssr/static-generation/).
5. **Image optimisation**: use `NgOptimizedImage` (`ngSrc`) for the cover images.
6. **Deploy**: build with `ng build` and host the app (see [Deployment Strategies](/deployment/strategies/)). You also need a real API, because json-server is only for development.

## Key takeaways

- **Route params are inputs.** `input.required<string>()` and `httpResource()` together load the right data every time the URL changes.
- **Signal Forms** = model signal + schema rules + `[formField]` bindings + `[formRoot]` with an async `submission.action`.
- **`linkedSignal()`** is the right model for an edit form: it is writable, and it resets when the loaded data changes.
- Return errors from the submit action to show **server errors** in the form.
- **Guards** protect users from losing work. **Tests** with `HttpTestingController` and `RouterTestingHarness` don't need a real server.

## Next steps

🎉 **Congratulations!** You've built a complete blog platform with modern Angular 22.

- [Signal Forms](/modern/signal-forms/): async validation, cross-field rules, and custom controls
- [Linked Signals](/modern/linked-signals/) · [Effects](/modern/effects/)
- [Advanced Routing](/intermediate/advanced-routing/): resolvers, more guards, and nested routes
- [Component Testing](/testing/component-testing/) · [Service Testing](/testing/service-testing/)
- Next project: [Admin Dashboard](/projects/dashboard/)
