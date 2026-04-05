---
title: Blog Platform - Part 2 (Components)
description: Build reusable components with Tailwind CSS for the blog platform
sidebar:
  order: 4
---

This is **Part 2** of the Blog Platform project. We'll create all the reusable components with clean Tailwind CSS styling.

**Previous:** [Part 1: Setup & Service](/projects/blog/)

## 📦 Components Overview

In this part, we'll create:

1. Header Component - Navigation bar
2. Search Bar Component - Search and filter
3. Post Card Component - Display post preview
4. Home Page - List all posts

## 🎨 Step 3: Create Header Component

Create `src/app/components/header/header.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white shadow-sm">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <a routerLink="/" class="flex items-center">
              <span class="text-2xl font-bold text-blue-600">📝 Blog</span>
            </a>
            
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                routerLink="/"
                routerLinkActive="border-blue-500 text-gray-900"
                [routerLinkActiveOptions]="{exact: true}"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </a>
              <a
                routerLink="/create"
                routerLinkActive="border-blue-500 text-gray-900"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Create Post
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent {}
```

**Key features:**
- Simple navigation with RouterLink
- Active link highlighting
- Responsive design with Tailwind
- Minimalistic styling

## 🔍 Step 4: Create Search Bar Component

Create `src/app/components/search-bar/search-bar.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row gap-4 mb-8">
      <div class="flex-1">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search posts..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
      </div>
      
      <select
        [(ngModel)]="selectedCategory"
        (ngModelChange)="onCategoryChange($event)"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        @for (category of blogService.categories(); track category) {
          <option [value]="category">
            {{ category === 'all' ? 'All Categories' : category }}
          </option>
        }
      </select>
    </div>
  `
})
export class SearchBarComponent {
  blogService = inject(BlogService);
  
  searchTerm = '';
  selectedCategory = 'all';

  onSearchChange(query: string): void {
    this.blogService.setSearchQuery(query);
  }

  onCategoryChange(category: string): void {
    this.blogService.setCategory(category);
  }
}
```

**Key features:**
- Real-time search filtering
- Category dropdown
- Two-way data binding with ngModel
- Responsive layout

## 🎴 Step 5: Create Post Card Component

Create `src/app/components/post-card/post-card.component.ts`:

```typescript
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogPost } from '../../models/blog.model';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, DatePipe],
  template: `
    <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        [src]="post().imageUrl"
        [alt]="post().title"
        class="w-full h-48 object-cover"
      >
      
      <div class="p-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {{ post().category }}
          </span>
          <span class="text-sm text-gray-500">
            {{ post().publishedAt | date:'MMM d, y' }}
          </span>
        </div>
        
        <h2 class="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
          <a [routerLink]="['/post', post().id]">
            {{ post().title }}
          </a>
        </h2>
        
        <p class="text-gray-600 mb-4 line-clamp-3">
          {{ post().excerpt }}
        </p>
        
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">
            By {{ post().author }}
          </span>
          
          <a
            [routerLink]="['/post', post().id]"
            class="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Read more →
          </a>
        </div>
        
        <div class="flex flex-wrap gap-2 mt-4">
          @for (tag of post().tags; track tag) {
            <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              #{{ tag }}
            </span>
          }
        </div>
      </div>
    </article>
  `
})
export class PostCardComponent {
  post = input.required<BlogPost>();
}
```

**Key features:**
- Card-based design
- Image with hover effect
- Category badge
- Tags display
- Clean, minimalistic styling

## 🏠 Step 6: Create Home Page

Create `src/app/pages/home/home.component.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';

@Component({
  selector: 'app-home',
  imports: [PostCardComponent, SearchBarComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Our Blog
        </h1>
        <p class="text-gray-600">
          Discover articles, tutorials, and insights
        </p>
      </div>

      <app-search-bar />

      @if (blogService.isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (blogService.filteredPosts().length === 0) {
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">No posts found</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (post of blogService.filteredPosts(); track post.id) {
            <app-post-card [post]="post" />
          }
        </div>
      }

      @if (!blogService.isLoading() && blogService.filteredPosts().length > 0) {
        <div class="flex justify-center mt-8 gap-2">
          <button
            (click)="previousPage()"
            [disabled]="currentPage() === 1"
            [class.opacity-50]="currentPage() === 1"
            [class.cursor-not-allowed]="currentPage() === 1"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:hover:bg-blue-600"
          >
            Previous
          </button>
          
          <span class="px-4 py-2 bg-gray-100 rounded-lg">
            Page {{ currentPage() }}
          </span>
          
          <button
            (click)="nextPage()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      }
    </div>
  `
})
export class HomeComponent implements OnInit {
  blogService = inject(BlogService);
  currentPage = signal(1);
  pageSize = 9;

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.blogService.getPosts(this.currentPage(), this.pageSize).subscribe();
  }

  nextPage(): void {
    this.currentPage.update(page => page + 1);
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.loadPosts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
```

**Key features:**
- Grid layout for posts
- Loading spinner
- Empty state message
- Pagination controls
- Smooth scrolling

## 🚀 Next Steps

Continue to **[Part 3: Detail & Form Pages](/projects/blog-part3/)** to complete the application!

---

**What's in Part 3:**
- Post Detail Page
- Post Form (Create/Edit)
- Routes Configuration
- App Component
- Running the app
