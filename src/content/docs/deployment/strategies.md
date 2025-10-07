---
title: Deployment Strategies 🚀
description: Master Angular deployment strategies - static hosting, SSR, and cloud platforms
sidebar:
  order: 1
---

Deploy your Angular applications to production with confidence. Learn various deployment strategies, hosting platforms, and best practices for different scenarios.

## 🎯 Deployment Options

**Hosting Types:**

- **Static Hosting** - Netlify, Vercel, GitHub Pages
- **Cloud Platforms** - AWS, Azure, Google Cloud
- **Traditional Servers** - Apache, Nginx
- **Serverless** - AWS Lambda, Azure Functions
- **Container Platforms** - Docker, Kubernetes

**Rendering Strategies:**

- **Client-Side Rendering (CSR)** - Traditional SPA
- **Server-Side Rendering (SSR)** - Angular Universal
- **Static Site Generation (SSG)** - Pre-rendered pages
- **Incremental Static Regeneration (ISR)** - Hybrid approach

## 🚀 Static Hosting Deployment

### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build for production
ng build --configuration production

# Deploy
netlify deploy --prod --dir=dist/your-app-name/browser
```

**netlify.toml Configuration:**

```toml
[build]
  command = "ng build --configuration production"
  publish = "dist/your-app-name/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json Configuration:**

```json
{
  "buildCommand": "ng build --configuration production",
  "outputDirectory": "dist/your-app-name/browser",
  "devCommand": "ng serve",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### GitHub Pages Deployment

```bash
# Install angular-cli-ghpages
ng add angular-cli-ghpages

# Build and deploy
ng deploy --base-href=/your-repo-name/
```

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build -- --configuration production --base-href=/your-repo/
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/your-app-name/browser
```

## ☁️ Cloud Platform Deployment

### AWS S3 + CloudFront

```bash
# Build for production
ng build --configuration production

# Install AWS CLI
# Upload to S3
aws s3 sync dist/your-app-name/browser s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**S3 Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Azure Static Web Apps

```bash
# Install Azure CLI
az login

# Create static web app
az staticwebapp create \
  --name your-app-name \
  --resource-group your-resource-group \
  --source https://github.com/your-username/your-repo \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist/your-app-name/browser"
```

**staticwebapp.config.json:**

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{css,scss,js,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  }
}
```

### Google Cloud Platform (Firebase Hosting)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy --only hosting
```

**firebase.json:**

```json
{
  "hosting": {
    "public": "dist/your-app-name/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Always test deployments in staging before production.</p>
</blockquote>

### 1. **Multi-Environment Deployment**

Let's set up different environments for development, staging, and production.

```typescript
// angular.json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "configurations": {
            "development": {
              "optimization": false,
              "sourceMap": true,
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.development.ts"
                }
              ]
            },
            "staging": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.staging.ts"
                }
              ]
            },
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.production.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Environment Files:**

```typescript
// environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  enableDebug: true
};

// environment.staging.ts
export const environment = {
  production: false,
  apiUrl: 'https://staging-api.example.com/api',
  enableDebug: true
};

// environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  enableDebug: false
};
```

### 2. **Automated Deployment Script**

Let's create a deployment script with pre-deployment checks.

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Check if on correct branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Error: Must be on main branch to deploy"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Uncommitted changes detected"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Run linting
echo "🔍 Running linter..."
npm run lint

# Build for production
echo "📦 Building for production..."
npm run build -- --configuration production

# Check bundle size
echo "📊 Checking bundle size..."
npm run analyze

# Deploy
echo "🚀 Deploying to production..."
case "$1" in
  netlify)
    netlify deploy --prod --dir=dist/your-app/browser
    ;;
  vercel)
    vercel --prod
    ;;
  firebase)
    firebase deploy --only hosting
    ;;
  *)
    echo "Usage: ./deploy.sh [netlify|vercel|firebase]"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
```

### 3. **Progressive Web App (PWA) Deployment**

Let's configure PWA deployment with service worker.

```bash
# Add PWA support
ng add @angular/pwa
```

**ngsw-config.json:**

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": [
        "https://api.example.com/**"
      ],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    }
  ]
}
```

## ✅ Best Practices

### 1. **Use Environment Variables**

```typescript
// ✅ Good - Use environment files
import { environment } from './environments/environment';

const apiUrl = environment.apiUrl;

// ❌ Avoid - Hardcoded values
const apiUrl = 'https://api.example.com';
```

### 2. **Enable Production Mode**

```typescript
// main.ts
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
```

### 3. **Configure Caching Headers**

```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  try_files $uri $uri/ /index.html;
  add_header Cache-Control "no-cache";
}
```

### 4. **Use CDN for Assets**

```typescript
// angular.json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "deployUrl": "https://cdn.example.com/"
            }
          }
        }
      }
    }
  }
}
```

### 5. **Monitor Deployments**

```typescript
// app.component.ts
import { environment } from './environments/environment';

if (environment.production) {
  // Initialize error tracking
  Sentry.init({
    dsn: 'your-sentry-dsn',
    environment: 'production'
  });
  
  // Initialize analytics
  gtag('config', 'GA_MEASUREMENT_ID');
}
```

## 🎯 Deployment Checklist

- [ ] Run tests before deployment
- [ ] Build with production configuration
- [ ] Check bundle sizes
- [ ] Test in staging environment
- [ ] Configure environment variables
- [ ] Set up proper caching headers
- [ ] Enable HTTPS
- [ ] Configure CDN
- [ ] Set up monitoring and analytics
- [ ] Create rollback plan

## 🎓 Learning Checklist

- [ ] Understand different hosting options
- [ ] Configure production builds
- [ ] Set up environment files
- [ ] Deploy to static hosting
- [ ] Deploy to cloud platforms
- [ ] Configure caching strategies
- [ ] Implement PWA features
- [ ] Set up monitoring

## 🚀 Next Steps

1. **[Docker & Containers](/deployment/docker/)** - Containerize your application
2. **[CI/CD Pipelines](/deployment/ci-cd/)** - Automate deployments
3. **[Performance Optimization](/advanced/performance/)** - Optimize before deploying

---

**Pro Tip**: Always use a staging environment that mirrors production! Test deployments thoroughly before going live. Use automated deployment scripts to ensure consistency! 🚀
