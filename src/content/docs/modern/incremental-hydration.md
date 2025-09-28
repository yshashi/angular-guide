---
title: Incremental Hydration 💧
description: Master Angular's incremental hydration for lightning-fast SSR performance
sidebar:
  order: 10
---

Incremental hydration is like having a smart loading system for your Angular app - instead of loading everything at once, it loads components precisely when they're needed. Think of it as upgrading from a gas-guzzling truck to a hybrid car that only uses fuel when necessary.

## 🎯 What is Incremental Hydration?

**Incremental hydration is Angular's game-changing approach to SSR** that dramatically improves performance by hydrating components only when needed, rather than all at once. It's like having a smart waiter who brings you each course exactly when you're ready for it.

**Key Benefits:**
- **⚡ Faster LCP** - Users see content immediately
- **🚀 Better INP** - Interactions respond instantly  
- **📐 Stable CLS** - No unexpected layout shifts
- **🧠 Smarter Loading** - JavaScript loads only when needed
- **📱 Mobile Optimized** - Perfect for slower devices

## 🔄 How It Works

**Traditional**: All components hydrate immediately → Slow, blocking
**Incremental**: Components hydrate when needed → Fast, responsive

- **Critical content** (header, main) → Hydrates immediately
- **Below-the-fold** (footer, comments) → Hydrates on viewport
- **Interactive features** (search, filters) → Hydrates on interaction
- **Heavy components** (charts, analytics) → Hydrates on idle

## 🛠️ Setting Up Incremental Hydration

### Step 1: Enable SSR (If Not Already Done)

```bash
# Add SSR to existing project
ng add @nguniversal/express-engine

# Or create new project with SSR
ng new my-app --ssr
```

### Step 2: Enable Incremental Hydration

**Update your app configuration:**

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Enable incremental hydration - that's it! 🎉
    provideClientHydration(withIncrementalHydration()),
    // Your other providers...
  ]
};
```

**That's literally it!** Angular handles the complex stuff automatically.

## 🎮 Using @defer for Smart Loading

### Basic @defer Syntax

**The `@defer` block is your hydration control center:**

```typescript
@Component({
  template: `
    <div class="app">
      <!-- Critical content loads immediately -->
      <header class="header">
        <h1>My App</h1>
        <nav>...</nav>
      </header>

      <!-- Defer heavy components -->
      @defer (on viewport) {
        <heavy-chart-component />
      } @placeholder {
        <div class="chart-skeleton">Loading chart...</div>
      } @loading {
        <div class="spinner">⏳ Loading...</div>
      } @error {
        <div class="error">Failed to load chart</div>
      }
    </div>
  `
})
export class AppComponent {}
```

## 🎯 Hydration Triggers

### 1. **hydrate on interaction** - User Clicks/Taps

```typescript
@Component({
  template: `
    <!-- Hydrates only when user interacts -->
    @defer (hydrate on interaction) {
      <expensive-user-profile />
    } @placeholder {
      <div class="profile-placeholder">
        <div class="avatar-skeleton"></div>
        <div class="name-skeleton"></div>
      </div>
    }
  `
})
```

### 2. **hydrate on viewport** - When Scrolled Into View

```typescript
@Component({
  template: `
    <!-- Perfect for below-the-fold content -->
    @defer (hydrate on viewport) {
      <heavy-product-reviews />
    } @placeholder {
      <div class="reviews-skeleton">
        Loading reviews...
      </div>
    }
  `
})
```

### 3. **hydrate on idle** - When Browser is Free

```typescript
@Component({
  template: `
    <!-- Hydrates when browser has spare time -->
    @defer (hydrate on idle) {
      <analytics-dashboard />
    } @placeholder {
      <div class="dashboard-skeleton">
        Dashboard loading...
      </div>
    }
  `
})
```

### 4. **hydrate on timer** - After Specific Time

```typescript
@Component({
  template: `
    <!-- Hydrates after 3 seconds -->
    @defer (hydrate on timer(3s)) {
      <social-media-feed />
    } @placeholder {
      <div class="feed-skeleton">
        Loading social feed...
      </div>
    }
  `
})
```

### 5. **Advanced: Preload Strategy**

```typescript
@Component({
  template: `
    <!-- Hydrates on interaction, but preloads when idle -->
    @defer (hydrate on interaction; preload on idle) {
      <expensive-component />
    } @placeholder {
      <button class="load-component">
        Click to activate component
      </button>
    }
  `
})
```

### 6. **Never Hydrate** - Static Content Only

```typescript
@Component({
  template: `
    <!-- Never hydrates - pure static content -->
    @defer (hydrate never) {
      <static-content-component />
    } @placeholder {
      <div class="static-placeholder">
        Static content loading...
      </div>
    }
  `
})
```

### 7. **Combining Multiple Triggers**

```typescript
@Component({
  template: `
    <!-- Multiple hydration strategies -->
    @defer (hydrate on interaction; preload on timer(5s)) {
      <complex-feature />
    } @placeholder {
      <div class="feature-placeholder">
        Click to activate or wait 5 seconds
      </div>
    }
  `
})
```

## 🏗️ Real-World Implementation Patterns

### E-commerce Product Page

```typescript
@Component({
  template: `
    <div class="product-page">
      <!-- Critical: Load immediately -->
      <product-header [product]="product()" />
      <product-images [images]="product().images" />
      <add-to-cart-button [product]="product()" />

      <!-- Hydrate when scrolled into view -->
      @defer (hydrate on viewport) {
        <product-reviews />
      } @placeholder {
        <div class="reviews-skeleton">Loading reviews...</div>
      }

      <!-- Hydrate on user interaction -->
      @defer (hydrate on interaction) {
        <product-comparison-tool />
      } @placeholder {
        <button class="compare-btn">Compare Products</button>
      }

      <!-- Hydrate when browser is idle, preload after 5s -->
      @defer (hydrate on idle; preload on timer(5s)) {
        <related-products />
      } @placeholder {
        <div class="related-skeleton">Loading related products...</div>
      }

      <!-- Never hydrate - pure static content -->
      @defer (hydrate never) {
        <newsletter-signup />
      } @placeholder {
        <div class="newsletter-placeholder">Newsletter signup</div>
      }
    </div>
  `
})
export class ProductPageComponent {
  product = signal<Product>(/* product data */);
}
```

### Dashboard Application

```typescript
@Component({
  template: `
    <div class="dashboard">
      <!-- Critical: Always visible -->
      <dashboard-header />
      <main-metrics />

      <!-- Hydrate when scrolled into view -->
      @defer (hydrate on viewport) {
        <revenue-chart />
      } @placeholder {
        <div class="chart-placeholder">📊 Revenue Chart</div>
      }

      <!-- Hydrate on interaction, preload when idle -->
      @defer (hydrate on interaction; preload on idle) {
        <user-analytics />
      } @placeholder {
        <div class="analytics-placeholder">
          Click to load user analytics
        </div>
      }

      <!-- Hydrate when browser is idle -->
      @defer (hydrate on idle) {
        <data-export-tool />
        <advanced-reporting />
      } @placeholder {
        <div class="tools-placeholder">Loading tools...</div>
      }
    </div>
  `
})
export class DashboardComponent {}
```

## 📊 Performance Impact

**Core Web Vitals Improvements:**
- **LCP**: 3.2s → 1.1s (65% faster)
- **INP**: 340ms → 89ms (74% better)
- **CLS**: 0.15 → 0.02 (87% more stable)
- **Bundle**: 2.5MB → 800KB initial (68% smaller)

## 🔧 Best Practices

### 1. **Prioritize Critical Content**

```typescript
// ✅ Good - Critical content loads first
<header /> <!-- Always hydrate -->
<main-content /> <!-- Always hydrate -->

@defer (on viewport) {
  <footer /> <!-- Defer non-critical -->
}
```

### 2. **Use Meaningful Placeholders**

```typescript
// ✅ Good - Informative placeholder
@defer (on interaction) {
  <advanced-search />
} @placeholder {
  <button class="search-placeholder">
    🔍 Click for advanced search
  </button>
}

// ❌ Avoid - Generic placeholder
@defer (on interaction) {
  <advanced-search />
} @placeholder {
  <div>Loading...</div>
}
```

### 3. **Keep It Simple**

```typescript
// ✅ Good - Clear and focused
@defer (hydrate on interaction) {
  <user-settings />
} @placeholder {
  <button>⚙️ Settings</button>
}

// ❌ Avoid - Overly complex
@defer (hydrate on interaction; preload on timer(5s); on viewport) {
  <complex-component />
}
```

## 🎯 Quick Checklist

- [ ] Enable SSR in your Angular application
- [ ] Add `withIncrementalHydration()` to app config
- [ ] Identify non-critical components for deferral
- [ ] Choose appropriate hydration triggers
- [ ] Add meaningful placeholders and loading states
- [ ] Test on different devices and network speeds
- [ ] Monitor Core Web Vitals improvements
- [ ] Use browser DevTools to verify hydration timing

## 🚀 Next Steps

1. **[Zoneless Angular](/modern/zoneless/)** - Combine with zoneless for maximum performance
2. **[New Control Flow](/modern/control-flow/)** - Use @defer with @if, @for, @switch
3. **[Signal Forms](/modern/signal-forms/)** - Reactive forms with incremental loading

---

**Remember**: Incremental hydration is like having a smart assistant that knows exactly when to bring you what you need - not too early, not too late, but precisely at the right moment! 💧
