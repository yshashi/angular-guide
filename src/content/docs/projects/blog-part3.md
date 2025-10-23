---
title: Blog Platform - Part 3 (Pages & Config)
description: Complete the blog platform with detail page, form, and routing
sidebar:
  order: 5
---

This is **Part 3** of the Blog Platform project. We'll create the detail page, form page, configure routing, and complete the app!

**Previous:** [Part 2: Components](/projects/blog-part2/)

## 📄 Pages Overview

In this part, we'll create:

1. Post Detail Page - View individual post
2. Post Form Page - Create/Edit posts
3. Routes Configuration
4. App Component
5. Run the application

## 📖 Step 7: Create Post Detail Page

Create `src/app/pages/post-detail/post-detail.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      @if (blogService.isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (blogService.post(); as post) {
        <article class="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            [src]="post.imageUrl"
            [alt]="post.title"
            class="w-full h-96 object-cover"
          >
          
          <div class="p-8">
            <div class="flex items-center gap-2 mb-4">
              <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                {{ post.category }}
              </span>
              <span class="text-gray-500">
                {{ post.publishedAt | date:'MMMM d, y' }}
              </span>
            </div>
            
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              {{ post.title }}
            </h1>
            
            <div class="flex items-center gap-4 mb-6 pb-6 border-b">
              <span class="text-gray-600">
                By <span class="font-semibold">{{ post.author }}</span>
              </span>
            </div>
            
            <div class="prose max-w-none mb-6">
              <p class="text-gray-700 leading-relaxed whitespace-pre-line">
                {{ post.content }}
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-6">
              @for (tag of post.tags; track tag) {
                <span class="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  #{{ tag }}
                </span>
              }
            </div>
            
            <div class="flex gap-4 pt-6 border-t">
              <a
                routerLink="/"
                class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ← Back to Home
              </a>
              
              <button
                (click)="editPost(post.id)"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Post
              </button>
              
              <button
                (click)="deletePost(post.id)"
                class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">Post not found</p>
          <a routerLink="/" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Home
          </a>
        </div>
      }
    </div>
  `
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  blogService = inject(BlogService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.blogService.getPostById(id).subscribe();
    }
  }

  editPost(id: string): void {
    this.router.navigate(['/edit', id]);
  }

  deletePost(id: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.blogService.deletePost(id).subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }
}
```

**Key features:**
- Full post display
- Edit and delete buttons
- Loading and error states
- Clean typography

## ✏️ Step 8: Create Post Form Page

Create `src/app/pages/post-form/post-form.component.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { CreatePostDto } from '../../models/blog.model';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">
          {{ isEditMode() ? 'Edit Post' : 'Create New Post' }}
        </h1>

        <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                formControlName="title"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter post title"
              >
              @if (postForm.get('title')?.invalid && postForm.get('title')?.touched) {
                <p class="mt-1 text-sm text-red-600">Title is required</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Excerpt *
              </label>
              <textarea
                formControlName="excerpt"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your post"
              ></textarea>
              @if (postForm.get('excerpt')?.invalid && postForm.get('excerpt')?.touched) {
                <p class="mt-1 text-sm text-red-600">Excerpt is required</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                formControlName="content"
                rows="12"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your post content here..."
              ></textarea>
              @if (postForm.get('content')?.invalid && postForm.get('content')?.touched) {
                <p class="mt-1 text-sm text-red-600">Content is required</p>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  formControlName="category"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Technology"
                >
                @if (postForm.get('category')?.invalid && postForm.get('category')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Category is required</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  formControlName="imageUrl"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                >
                @if (postForm.get('imageUrl')?.invalid && postForm.get('imageUrl')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Valid image URL is required</p>
                }
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                formControlName="tagsInput"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="angular, typescript, web-development"
              >
            </div>
          </div>

          <div class="flex gap-4 mt-8">
            <button
              type="submit"
              [disabled]="postForm.invalid || blogService.isLoading()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isEditMode() ? 'Update Post' : 'Create Post' }}
            </button>
            
            <a
              routerLink="/"
              class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  blogService = inject(BlogService);

  isEditMode = signal(false);
  postId = signal<string | null>(null);

  postForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required],
    category: ['', Validators.required],
    imageUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    tagsInput: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.postId.set(id);
      this.loadPost(id);
    }
  }

  loadPost(id: string): void {
    this.blogService.getPostById(id).subscribe(post => {
      this.postForm.patchValue({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        imageUrl: post.imageUrl,
        tagsInput: post.tags.join(', ')
      });
    });
  }

  onSubmit(): void {
    if (this.postForm.valid) {
      const formValue = this.postForm.value;
      const postData: CreatePostDto = {
        title: formValue.title,
        excerpt: formValue.excerpt,
        content: formValue.content,
        category: formValue.category,
        imageUrl: formValue.imageUrl,
        tags: formValue.tagsInput
          ? formValue.tagsInput.split(',').map((tag: string) => tag.trim())
          : []
      };

      if (this.isEditMode() && this.postId()) {
        this.blogService.updatePost(this.postId()!, postData).subscribe(() => {
          this.router.navigate(['/post', this.postId()]);
        });
      } else {
        this.blogService.createPost(postData).subscribe(post => {
          this.router.navigate(['/post', post.id]);
        });
      }
    }
  }
}
```

**Key features:**
- Reactive forms with validation
- Create and edit modes
- Form validation messages
- Clean form layout

## 🛣️ Step 9: Configure Routes

Update `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./pages/post-detail/post-detail.component').then(m => m.PostDetailComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/post-form/post-form.component').then(m => m.PostFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/post-form/post-form.component').then(m => m.PostFormComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

**Key features:**
- Lazy loading for all routes
- Dynamic route parameters
- Wildcard route for 404

## 🎯 Step 10: Update App Component

Update `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header />
      <main>
        <router-outlet />
      </main>
      <footer class="bg-white border-t mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p class="text-center text-gray-500 text-sm">
            © 2024 Blog Platform. Built with Angular & Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {}
```

Update `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

## 🚀 Running the Application

### Start Development Server

```bash
ng serve
```

Open your browser to `http://localhost:4200`

### Build for Production

```bash
ng build
```

## ✅ Testing Your App

Try these features:

1. **View posts** - Browse the home page
2. **Search** - Use the search bar
3. **Filter** - Select categories
4. **View details** - Click on a post
5. **Create post** - Click "Create Post"
6. **Edit post** - Click "Edit" on detail page
7. **Delete post** - Click "Delete" (with confirmation)
8. **Pagination** - Navigate between pages

## 🎯 Key Concepts Demonstrated

### ✅ Angular Best Practices

- **Standalone components** - No NgModules
- **Signals for state** - Reactive state management
- **Computed values** - Derived state
- **inject() function** - Modern DI
- **input() function** - Component inputs
- **Lazy loading** - Route-level code splitting
- **Native control flow** - @if, @for, @else

### ✅ Tailwind CSS

- **Utility-first** - No custom CSS files
- **Responsive design** - Mobile-first approach
- **Minimalistic** - Clean, simple styling
- **Hover states** - Interactive elements
- **Focus states** - Accessibility

### ✅ Architecture Patterns

- **Service layer** - Business logic separation
- **Component composition** - Reusable components
- **Reactive forms** - Form validation
- **HTTP integration** - API communication
- **Routing** - Navigation and lazy loading

## 🚀 Enhancement Ideas

Take your blog platform further:

1. **Add rich text editor** - Use Quill or TinyMCE
2. **Add image upload** - Integrate with cloud storage
3. **Add comments** - User engagement
4. **Add likes/reactions** - Social features
5. **Add user authentication** - Login/signup
6. **Add author profiles** - User pages
7. **Add bookmarks** - Save favorite posts
8. **Add sharing** - Social media integration
9. **Add SEO** - Meta tags and SSR
10. **Add analytics** - Track views and engagement

## 📚 Related Topics

- [Signals Guide](/modern/signals/)
- [Reactive Forms](/intermediate/reactive-forms/)
- [Routing](/intermediate/advanced-routing/)
- [HTTP Client](/beginner/http/)
- [Services & DI](/beginner/services/)

---

**Congratulations!** 🎉 You've built a complete Blog Platform using modern Angular best practices with Tailwind CSS! This project demonstrates real-world patterns for building content management applications.
