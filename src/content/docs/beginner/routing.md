---
title: Routing Basics 🗺️
description: Learn Angular routing fundamentals for navigation
sidebar:
  order: 8
---

Routing enables navigation between different views in Angular applications. It allows you to create single-page applications (SPAs) with multiple views and URL-based navigation.

## 🎯 What is Angular Routing?

Angular Router helps you:
- **Navigate between components** based on URL
- **Pass data** between routes
- **Guard routes** with authentication
- **Load components lazily** for better performance
- **Handle browser history** and bookmarking

## 🛠️ Basic Router Setup

### 1. Configure Routes
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' } // Wildcard route for 404
];
```

### 2. Bootstrap with Router
```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
});
```

### 3. Add Router Outlet
```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
      <a routerLink="/about" routerLinkActive="active">About</a>
      <a routerLink="/contact" routerLinkActive="active">Contact</a>
    </nav>
    
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  title = 'routing-app';
}
```

## 🔗 Navigation Methods

### 1. RouterLink Directive
```html
<!-- Basic navigation -->
<a routerLink="/about">About Us</a>
<a routerLink="/contact">Contact</a>

<!-- With parameters -->
<a [routerLink]="['/user', userId]">User Profile</a>

<!-- With query parameters -->
<a [routerLink]="['/products']" [queryParams]="{category: 'electronics', sort: 'price'}">
  Electronics
</a>

<!-- Relative navigation -->
<a routerLink="../sibling">Sibling Route</a>
<a routerLink="./child">Child Route</a>
```

### 2. Programmatic Navigation
```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  template: `
    <button (click)="goToAbout()">Go to About</button>
    <button (click)="goToUser(123)">Go to User 123</button>
    <button (click)="goToProducts()">Go to Products</button>
    <button (click)="goBack()">Go Back</button>
  `
})
export class NavigationComponent {
  private router = inject(Router);

  goToAbout() {
    this.router.navigate(['/about']);
  }

  goToUser(userId: number) {
    this.router.navigate(['/user', userId]);
  }

  goToProducts() {
    this.router.navigate(['/products'], {
      queryParams: { category: 'electronics' },
      fragment: 'top'
    });
  }

  goBack() {
    window.history.back();
  }
}
```

## 📊 Route Parameters

### 1. Route Parameters
```typescript
// Route configuration
{ path: 'user/:id', component: UserComponent }
{ path: 'product/:category/:id', component: ProductComponent }
```

```typescript
// Reading route parameters
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user',
  template: `
    <h2>User Profile</h2>
    <p>User ID: {{userId}}</p>
    <p>Tab: {{activeTab}}</p>
  `
})
export class UserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  userId: string = '';
  activeTab: string = '';

  ngOnInit() {
    // Get route parameters
    this.userId = this.route.snapshot.params['id'];
    
    // Subscribe to parameter changes
    this.route.params.subscribe(params => {
      this.userId = params['id'];
    });

    // Get query parameters
    this.route.queryParams.subscribe(queryParams => {
      this.activeTab = queryParams['tab'] || 'profile';
    });
  }
}
```

### 2. Query Parameters and Fragments
```typescript
// Navigation with query params and fragment
this.router.navigate(['/products'], {
  queryParams: { 
    category: 'electronics', 
    sort: 'price',
    page: 1 
  },
  fragment: 'results'
});

// Reading query parameters
this.route.queryParams.subscribe(params => {
  const category = params['category'];
  const sort = params['sort'];
  const page = +params['page'] || 1;
});

// Reading fragment
this.route.fragment.subscribe(fragment => {
  if (fragment) {
    document.getElementById(fragment)?.scrollIntoView();
  }
});
```

## 🏗️ Nested Routes

```typescript
// Parent-child route configuration
export const routes: Routes = [
  {
    path: 'products',
    component: ProductsComponent,
    children: [
      { path: '', component: ProductListComponent },
      { path: 'category/:name', component: CategoryComponent },
      { path: 'detail/:id', component: ProductDetailComponent }
    ]
  }
];
```

```typescript
// Parent component with nested router-outlet
@Component({
  selector: 'app-products',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="products-layout">
      <aside class="sidebar">
        <h3>Categories</h3>
        <nav>
          <a routerLink="/products">All Products</a>
          <a routerLink="/products/category/electronics">Electronics</a>
          <a routerLink="/products/category/books">Books</a>
        </nav>
      </aside>
      
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class ProductsComponent { }
```

## 🛡️ Route Guards

### 1. CanActivate Guard
```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

// Using the guard
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

### 2. CanDeactivate Guard
```typescript
// unsaved-changes.guard.ts
import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};

// Component implementing the interface
@Component({
  selector: 'app-edit-form',
  template: `
    <form>
      <input [(ngModel)]="formData.name" (input)="hasUnsavedChanges = true">
      <button (click)="save()">Save</button>
    </form>
  `
})
export class EditFormComponent implements CanComponentDeactivate {
  hasUnsavedChanges = false;
  formData = { name: '' };

  canDeactivate(): boolean {
    if (this.hasUnsavedChanges) {
      return confirm('You have unsaved changes. Do you want to leave?');
    }
    return true;
  }

  save() {
    // Save logic
    this.hasUnsavedChanges = false;
  }
}
```

## 🎨 Practical Example: Blog Application

```typescript
// blog.routes.ts
export const blogRoutes: Routes = [
  {
    path: 'blog',
    component: BlogLayoutComponent,
    children: [
      { path: '', component: BlogListComponent },
      { path: 'post/:slug', component: BlogPostComponent },
      { path: 'category/:category', component: CategoryPostsComponent },
      { path: 'author/:authorId', component: AuthorPostsComponent }
    ]
  }
];

// blog-layout.component.ts
@Component({
  selector: 'app-blog-layout',
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="blog-layout">
      <header class="blog-header">
        <h1><a routerLink="/blog">My Blog</a></h1>
        <nav>
          <a routerLink="/blog" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            All Posts
          </a>
          <a routerLink="/blog/category/tech" routerLinkActive="active">Tech</a>
          <a routerLink="/blog/category/lifestyle" routerLinkActive="active">Lifestyle</a>
        </nav>
      </header>
      
      <main class="blog-content">
        <router-outlet></router-outlet>
      </main>
      
      <aside class="blog-sidebar">
        <h3>Recent Posts</h3>
        <ul>
          @for (post of recentPosts; track post.id) {
            <li>
              <a [routerLink]="['/blog/post', post.slug]">{{post.title}}</a>
            </li>
          }
        </ul>
      </aside>
    </div>
  `
})
export class BlogLayoutComponent {
  recentPosts = [
    { id: 1, slug: 'getting-started-angular', title: 'Getting Started with Angular' },
    { id: 2, slug: 'typescript-tips', title: 'TypeScript Tips and Tricks' },
    { id: 3, slug: 'web-performance', title: 'Web Performance Optimization' }
  ];
}

// blog-post.component.ts
@Component({
  selector: 'app-blog-post',
  imports: [CommonModule, RouterLink],
  template: `
    @if (post) {
      <article class="blog-post">
        <header>
          <h1>{{post.title}}</h1>
          <div class="post-meta">
            <span>By <a [routerLink]="['/blog/author', post.authorId]">{{post.author}}</a></span>
            <span>{{post.publishDate | date}}</span>
            <span>
              <a [routerLink]="['/blog/category', post.category]">{{post.category}}</a>
            </span>
          </div>
        </header>
        
        <div class="post-content">
          {{post.content}}
        </div>
        
        <footer>
          <a routerLink="/blog">← Back to all posts</a>
        </footer>
      </article>
    } @else {
      <div class="loading">Loading post...</div>
    }
  `
})
export class BlogPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  post: any = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadPost(slug);
    });
  }

  private loadPost(slug: string) {
    // Simulate API call
    setTimeout(() => {
      const posts = [
        {
          slug: 'getting-started-angular',
          title: 'Getting Started with Angular',
          author: 'John Doe',
          authorId: 1,
          category: 'tech',
          publishDate: new Date('2024-01-15'),
          content: 'Angular is a powerful framework for building web applications...'
        }
      ];
      
      this.post = posts.find(p => p.slug === slug);
      
      if (!this.post) {
        this.router.navigate(['/blog']);
      }
    }, 500);
  }
}
```

## 🚀 Lazy Loading

```typescript
// Lazy loading routes
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'shop',
    loadChildren: () => import('./shop/shop.routes').then(m => m.shopRoutes)
  }
];

// admin.routes.ts (separate module)
export const adminRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'users', component: UserManagementComponent },
  { path: 'settings', component: AdminSettingsComponent }
];
```

## ✅ Best Practices

### 1. **Use Meaningful URLs**
```typescript
// ✅ Good URLs
{ path: 'products/:category/:id', component: ProductComponent }
{ path: 'user/:id/profile', component: UserProfileComponent }

// ❌ Avoid generic URLs
{ path: 'page/:id', component: GenericComponent }
```

### 2. **Handle 404 Routes**
```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', component: NotFoundComponent } // Always last
];
```

### 3. **Use Route Guards Appropriately**
```typescript
// Protect sensitive routes
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, adminGuard]
}
```

### 4. **Implement Loading States**
```typescript
@Component({
  template: `
    @if (loading) {
      <div class="loading">Loading...</div>
    } @else {
      <div class="content">{{data}}</div>
    }
  `
})
export class DataComponent implements OnInit {
  loading = true;
  data: any;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loading = true;
      this.loadData(params['id']).then(data => {
        this.data = data;
        this.loading = false;
      });
    });
  }
}
```

## 🎯 Quick Checklist

- [ ] Configure routes in `app.routes.ts`
- [ ] Add `provideRouter()` to bootstrap
- [ ] Use `<router-outlet>` for component rendering
- [ ] Navigate with `routerLink` directive
- [ ] Handle route parameters with `ActivatedRoute`
- [ ] Implement route guards for protection
- [ ] Use lazy loading for large modules
- [ ] Handle 404 routes with wildcard
- [ ] Provide loading states for async operations
- [ ] Use meaningful and SEO-friendly URLs

## 🚀 Next Steps

1. **[HTTP Client](/beginner/http/)** - Fetch data for your routes
2. **[Advanced Routing](/intermediate/advanced-routing/)** - Resolvers, guards, and complex patterns
3. **[State Management](/intermediate/state-management/)** - Manage data across routes

---

**Remember**: Good routing creates intuitive navigation and improves user experience. Plan your route structure carefully and always handle edge cases! 🗺️
