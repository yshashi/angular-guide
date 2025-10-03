---
title: Bundle Optimization 📦
description: Reduce bundle sizes and optimize Angular applications for production deployment
sidebar:
  order: 10
---

Bundle optimization reduces application size, improves load times, and enhances user experience. Master techniques to create lean, fast-loading Angular applications.

## 🎯 Bundle Size Fundamentals

**Key Concepts:**
- **Initial Bundle** - Code loaded on first page load
- **Lazy Bundles** - Code loaded on demand
- **Vendor Bundle** - Third-party libraries
- **Runtime Bundle** - Webpack runtime code
- **Polyfills** - Browser compatibility code

**Target Sizes:**
- Initial bundle: < 200KB (gzipped)
- Total JavaScript: < 500KB (gzipped)
- First Load JS: < 100KB (ideal)

## 🚀 Production Build Optimization

### Build Configuration

```json
// angular.json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "aot": true,
      "extractLicenses": true,
      "buildOptimizer": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        }
      ]
    }
  }
}
```

### Tree Shaking

```typescript
// ✅ Import only what you need
import { map, filter } from 'rxjs/operators';

// ❌ Avoid importing everything
import * as rxjs from 'rxjs';

// ✅ Specific lodash imports
import debounce from 'lodash-es/debounce';

// ❌ Avoid full lodash
import _ from 'lodash';
```

## 🎨 Optimization Techniques

### 1. **Lazy Loading**

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];
```

### 2. **Code Splitting**

```typescript
// Dynamic imports for heavy libraries
async loadChart() {
  const { Chart } = await import('chart.js');
  // Use Chart.js only when needed
}

async loadEditor() {
  const { Editor } = await import('tinymce');
  // Load editor on demand
}
```

### 3. **Remove Unused Code**

```typescript
// ✅ Use standalone components
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule] // Only import what's needed
})

// ❌ Avoid importing entire modules
import { BrowserModule } from '@angular/platform-browser';
```

## 📊 Bundle Analysis

### Webpack Bundle Analyzer

```bash
# Install
npm install --save-dev webpack-bundle-analyzer

# Build with stats
ng build --stats-json

# Analyze
npx webpack-bundle-analyzer dist/stats.json
```

### Source Map Explorer

```bash
# Install
npm install --save-dev source-map-explorer

# Build with source maps
ng build --source-map

# Analyze
npx source-map-explorer dist/**/*.js
```

## ✅ Best Practices

### 1. **Lazy Load Routes**

```typescript
// ✅ Lazy load feature modules
{
  path: 'dashboard',
  loadChildren: () => import('./dashboard/routes')
}

// ❌ Avoid eager loading everything
import { DashboardModule } from './dashboard';
```

### 2. **Use Production Mode**

```bash
# ✅ Always build for production
ng build --configuration production

# ❌ Avoid development builds
ng build
```

### 3. **Optimize Images**

```typescript
// ✅ Use NgOptimizedImage
<img ngSrc="/hero.jpg" width="1200" height="600" priority>

// ✅ Use WebP format
<img ngSrc="/hero.webp" width="1200" height="600">
```

### 4. **Remove Console Logs**

```typescript
// ✅ Remove in production
if (!environment.production) {
  console.log('Debug info');
}

// Or use build optimizer to strip them
```

### 5. **Use Differential Loading**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022" // Modern browsers
  }
}
```

## 🎯 Optimization Checklist

- [ ] Enable production mode
- [ ] Implement lazy loading
- [ ] Use tree shaking
- [ ] Optimize images
- [ ] Remove unused dependencies
- [ ] Enable compression (gzip/brotli)
- [ ] Set bundle budgets
- [ ] Analyze bundle size
- [ ] Use CDN for assets
- [ ] Enable caching headers

## 🎓 Learning Checklist

- [ ] Understand bundle composition
- [ ] Configure production builds
- [ ] Implement lazy loading
- [ ] Use bundle analyzers
- [ ] Optimize third-party libraries
- [ ] Set and monitor budgets
- [ ] Enable compression
- [ ] Optimize assets

## 🚀 Next Steps

1. **[Performance Optimization](/advanced/performance/)** - Optimize runtime performance
2. **[Memory Management](/advanced/memory-management/)** - Prevent memory leaks
3. **[Micro Frontends](/advanced/micro-frontends/)** - Scale your architecture

---

**Pro Tip**: Monitor bundle sizes continuously! Set strict budgets in angular.json and use bundle analyzers regularly. Every kilobyte counts for user experience! 📦
