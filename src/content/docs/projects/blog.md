---
title: Blog Platform
description: Build a full-featured blog platform with Angular Signals, routing, and Tailwind CSS
sidebar:
  order: 3
---

Build a modern, full-featured **Blog Platform** using **Angular Signals**, **standalone components**, **routing**, and **Tailwind CSS**. This project demonstrates real-world patterns for content management applications!

## 🎯 What You'll Build

A complete blog platform with:

- ✅ Blog post listing with pagination
- ✅ Individual post detail pages
- ✅ Create and edit posts
- ✅ Categories and tags
- ✅ Search functionality
- ✅ Responsive design with Tailwind CSS
- ✅ Routing with lazy loading
- ✅ Signal-based state management
- ✅ API integration (assuming APIs are ready)

## 📋 Prerequisites

Before starting this project, make sure you have:

- **Node.js** (v18 or higher) installed
- **Angular CLI** installed globally
- Basic understanding of TypeScript and Angular
- Familiarity with REST APIs

**For project setup instructions, please refer to:**

- [Prerequisites & Setup Guide](/getting-started/prerequisites/)
- [Creating Your First App](/getting-started/first-app/)

## 🚀 Project Setup

### Step 1: Create New Angular Project

```bash
ng new blog-platform --standalone --routing --style=css --strict
cd blog-platform
```

### Step 2: Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### Step 3: Configure Tailwind

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Project Structure

Create the following structure:

```text
src/app/
├── models/
│   └── blog.model.ts
├── services/
│   └── blog.service.ts
├── pages/
│   ├── home/
│   │   └── home.component.ts
│   ├── post-detail/
│   │   └── post-detail.component.ts
│   └── post-form/
│       └── post-form.component.ts
├── components/
│   ├── post-card/
│   │   └── post-card.component.ts
│   ├── header/
│   │   └── header.component.ts
│   └── search-bar/
│       └── search-bar.component.ts
└── app.routes.ts
```

## 📝 Step-by-Step Implementation

### Step 1: Create Models

Create `src/app/models/blog.model.ts`:

```typescript
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  imageUrl: string;
  publishedAt: Date;
  updatedAt: Date;
}

export interface CreatePostDto {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  imageUrl: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

**What we created:**
- `BlogPost` - Main interface for blog posts
- `CreatePostDto` - Data transfer object for creating/updating posts
- `PaginatedResponse` - Generic interface for paginated API responses

### Step 2: Create Blog Service

Create `src/app/services/blog.service.ts`:

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { BlogPost, CreatePostDto, PaginatedResponse } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/posts'; // Replace with your API

  // State
  private posts = signal<BlogPost[]>([]);
  private currentPost = signal<BlogPost | null>(null);
  private loading = signal(false);
  private searchQuery = signal('');
  private selectedCategory = signal<string>('all');

  // Public read-only signals
  allPosts = this.posts.asReadonly();
  post = this.currentPost.asReadonly();
  isLoading = this.loading.asReadonly();

  // Computed values
  filteredPosts = computed(() => {
    const posts = this.posts();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    let filtered = posts;

    if (category !== 'all') {
      filtered = filtered.filter(post => post.category === category);
    }

    if (query) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  categories = computed(() => {
    const posts = this.posts();
    const categorySet = new Set(posts.map(post => post.category));
    return ['all', ...Array.from(categorySet)];
  });

  // API Methods
  getPosts(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<BlogPost>> {
    this.loading.set(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<BlogPost>>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.posts.set(response.data);
        this.loading.set(false);
      })
    );
  }

  getPostById(id: string): Observable<BlogPost> {
    this.loading.set(true);
    return this.http.get<BlogPost>(`${this.apiUrl}/${id}`).pipe(
      tap(post => {
        this.currentPost.set(post);
        this.loading.set(false);
      })
    );
  }

  createPost(post: CreatePostDto): Observable<BlogPost> {
    this.loading.set(true);
    return this.http.post<BlogPost>(this.apiUrl, post).pipe(
      tap(newPost => {
        this.posts.update(posts => [newPost, ...posts]);
        this.loading.set(false);
      })
    );
  }

  updatePost(id: string, post: Partial<CreatePostDto>): Observable<BlogPost> {
    this.loading.set(true);
    return this.http.put<BlogPost>(`${this.apiUrl}/${id}`, post).pipe(
      tap(updatedPost => {
        this.posts.update(posts =>
          posts.map(p => p.id === id ? updatedPost : p)
        );
        this.currentPost.set(updatedPost);
        this.loading.set(false);
      })
    );
  }

  deletePost(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.posts.update(posts => posts.filter(p => p.id !== id));
        this.loading.set(false);
      })
    );
  }

  // Filter methods
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }
}
```

**Key features:**
- ✅ Signal-based state management
- ✅ Computed values for filtering
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Search and category filtering
- ✅ Loading state management

## 🚀 Next Steps

Continue to **[Part 2: Components](/projects/blog-part2/)** to build the UI components!

---

**What's in Part 2:**
- Header Component
- Search Bar Component  
- Post Card Component
- Home Page
- And more!
