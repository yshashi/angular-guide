---
title: Advanced Routing 🗺️
description: Master advanced Angular routing patterns and techniques
sidebar:
  order: 5
---

Advanced routing patterns enable sophisticated navigation, data loading, and user experience optimization. Master guards, resolvers, and lazy loading for production-ready applications.

## 🎯 Advanced Concepts

- **Route Guards** - Protect and control navigation
- **Resolvers** - Pre-load data before navigation
- **Lazy Loading** - Load modules on demand
- **Route Data** - Pass static data to routes
- **Auxiliary Routes** - Multiple router outlets

## 🛡️ Route Guards

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

// admin.guard.ts
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.hasRole('admin')) {
    return true;
  }
  
  router.navigate(['/unauthorized']);
  return false;
};

// unsaved-changes.guard.ts
export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (component.hasUnsavedChanges()) {
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  }
  return true;
};

interface CanDeactivateComponent {
  hasUnsavedChanges(): boolean;
}
```

## 📊 Route Resolvers

```typescript
// user.resolver.ts
export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  const userId = route.params['id'];
  
  return userService.getUser(userId).pipe(
    catchError(() => of(null))
  );
};

// posts.resolver.ts
export const postsResolver: ResolveFn<Post[]> = () => {
  const postService = inject(PostService);
  
  return postService.getPosts().pipe(
    catchError(() => of([]))
  );
};

// Route configuration
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserDetailComponent,
    resolve: { user: userResolver },
    canActivate: [authGuard]
  },
  {
    path: 'posts',
    component: PostListComponent,
    resolve: { posts: postsResolver }
  }
];

// Component using resolved data
@Component({
  selector: 'app-user-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user()) {
      <div>
        <h2>{{user()!.name}}</h2>
        <p>{{user()!.email}}</p>
      </div>
    } @else {
      <div>User not found</div>
    }
  `
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  user = signal<User | null>(null);

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user.set(data['user']);
    });
  }
}
```

## 🚀 Lazy Loading

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'products',
    loadChildren: () => import('./products/products.routes').then(m => m.productRoutes)
  }
];

// admin.routes.ts
export const adminRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'users', component: UserManagementComponent },
  { path: 'settings', component: AdminSettingsComponent }
];

// products.routes.ts
export const productRoutes: Routes = [
  { path: '', component: ProductListComponent },
  { path: ':id', component: ProductDetailComponent, resolve: { product: productResolver } },
  { path: 'category/:category', component: CategoryProductsComponent }
];
```

## 🎨 Advanced Navigation Patterns

```typescript
@Component({
  selector: 'app-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav>
      <button (click)="navigateToUser(123)">User 123</button>
      <button (click)="navigateWithQuery()">Search Products</button>
      <button (click)="navigateRelative()">Relative Navigation</button>
      <button (click)="openInNewTab()">Open in New Tab</button>
    </nav>
  `
})
export class NavigationComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  navigateToUser(userId: number) {
    this.router.navigate(['/user', userId]);
  }

  navigateWithQuery() {
    this.router.navigate(['/products'], {
      queryParams: { 
        category: 'electronics',
        sort: 'price',
        page: 1 
      },
      fragment: 'results'
    });
  }

  navigateRelative() {
    // Navigate relative to current route
    this.router.navigate(['../sibling'], { relativeTo: this.route });
  }

  openInNewTab() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/products'])
    );
    window.open(url, '_blank');
  }
}
```

## 📱 Route Data and Configuration

```typescript
// Route with static data
export const routes: Routes = [
  {
    path: 'about',
    component: AboutComponent,
    data: { 
      title: 'About Us',
      breadcrumb: 'About',
      showSidebar: false 
    }
  },
  {
    path: 'contact',
    component: ContactComponent,
    data: { 
      title: 'Contact',
      breadcrumb: 'Contact',
      requiresAuth: false 
    }
  }
];

// Component accessing route data
@Component({
  selector: 'app-page-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1>{{pageTitle()}}</h1>
      
      @if (showSidebar()) {
        <aside>Sidebar content</aside>
      }
      
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class PageWrapperComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  pageTitle = signal('');
  showSidebar = signal(true);

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.pageTitle.set(data['title'] || 'Default Title');
      this.showSidebar.set(data['showSidebar'] !== false);
    });
  }
}
```

## 🔄 Auxiliary Routes

```typescript
// Multiple router outlets
@Component({
  selector: 'app-layout',
  template: `
    <div>
      <header>
        <router-outlet name="header"></router-outlet>
      </header>
      
      <main>
        <router-outlet></router-outlet>
      </main>
      
      <aside>
        <router-outlet name="sidebar"></router-outlet>
      </aside>
    </div>
  `
})
export class LayoutComponent { }

// Route configuration with auxiliary routes
export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'header', component: DashboardHeaderComponent, outlet: 'header' },
      { path: 'sidebar', component: DashboardSidebarComponent, outlet: 'sidebar' }
    ]
  }
];

// Navigation to auxiliary routes
@Component({
  template: `
    <button (click)="showDashboard()">Show Dashboard</button>
    <button (click)="showProfile()">Show Profile</button>
  `
})
export class NavigationComponent {
  private router = inject(Router);

  showDashboard() {
    this.router.navigate([{
      outlets: {
        primary: 'dashboard',
        header: 'dashboard/header',
        sidebar: 'dashboard/sidebar'
      }
    }]);
  }

  showProfile() {
    this.router.navigate([{
      outlets: {
        primary: 'profile',
        header: null,
        sidebar: 'profile/sidebar'
      }
    }]);
  }
}
```

## 🎯 Route Animations

```typescript
// route-animations.ts
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ left: '-100%' })
    ], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ left: '100%' }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ left: '0%' }))
      ], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true })
  ])
]);

// Component with animations
@Component({
  selector: 'app-animated-outlet',
  template: `
    <div [@routeAnimations]="getRouteAnimationData()">
      <router-outlet></router-outlet>
    </div>
  `,
  animations: [routeAnimations]
})
export class AnimatedOutletComponent {
  private router = inject(Router);

  getRouteAnimationData() {
    return this.router.routerState.root.firstChild?.snapshot.data?.['animation'];
  }
}

// Route with animation data
{
  path: 'page1',
  component: Page1Component,
  data: { animation: 'page1' }
}
```

## ✅ Best Practices

### 1. **Use Functional Guards**
```typescript
// ✅ Good - Functional guard
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};

// ❌ Avoid - Class-based guard (deprecated)
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate() { /* ... */ }
}
```

### 2. **Preload Strategies**
```typescript
// ✅ Good - Custom preload strategy
@Injectable()
export class CustomPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}

// Bootstrap with preloading
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(CustomPreloadStrategy))
  ]
});
```

### 3. **Error Handling**
```typescript
// ✅ Good - Handle resolver errors
export const dataResolver: ResolveFn<Data> = () => {
  const service = inject(DataService);
  
  return service.getData().pipe(
    catchError(error => {
      console.error('Failed to load data:', error);
      return of(null);
    })
  );
};
```

## 🎯 Quick Checklist

- [ ] Use functional guards instead of class-based
- [ ] Implement resolvers for data preloading
- [ ] Configure lazy loading for feature modules
- [ ] Handle navigation errors gracefully
- [ ] Use route data for configuration
- [ ] Implement proper preloading strategies
- [ ] Add route animations for better UX
- [ ] Test guard and resolver logic
- [ ] Use auxiliary routes when needed

## 🚀 Next Steps

1. **[RxJS & Observables](/intermediate/rxjs/)** - Reactive patterns in routing
2. **[State Management](/intermediate/state-management/)** - Route-based state
3. **[Testing](/intermediate/testing/)** - Testing routing logic

---

**Remember**: Advanced routing patterns enable sophisticated navigation and data management. Use them to create seamless, performant user experiences! 🗺️
