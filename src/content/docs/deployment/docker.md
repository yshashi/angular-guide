---
title: Docker & Containers 🐳
description: Containerize Angular applications with Docker - multi-stage builds, optimization, and orchestration
sidebar:
  order: 2
---

Containerize your Angular applications with Docker for consistent, portable, and scalable deployments. Learn Docker best practices, multi-stage builds, and container orchestration.

## 🎯 Why Docker for Angular?

**Benefits:**
- **🔄 Consistency** - Same environment everywhere
- **📦 Portability** - Run anywhere Docker runs
- **⚡ Isolation** - No dependency conflicts
- **🚀 Scalability** - Easy horizontal scaling
- **🔧 DevOps Ready** - CI/CD integration

**Use Cases:**
- Production deployments
- Development environments
- Microservices architecture
- Cloud-native applications
- Kubernetes deployments

## 🚀 Basic Dockerfile

### Simple Production Dockerfile

```dockerfile
# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist/your-app-name/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## 🎨 Optimized Multi-Stage Build

### Production-Ready Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY . .

# Build with production configuration
RUN npm run build -- --configuration production --output-hashing=all

# Stage 2: Production
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist/your-app-name/browser /usr/share/nginx/html

# Add non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Run as non-root user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Always use multi-stage builds to minimize image size.</p>
</blockquote>

### 1. **Development Docker Setup**

Let's create a Docker setup for development with hot reload.

```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 4200

# Start development server
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]
```

**docker-compose.yml for Development:**

```yaml
version: '3.8'

services:
  angular-app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "4200:4200"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm start -- --host 0.0.0.0 --poll 2000
```

**Usage:**

```bash
# Start development environment
docker-compose up

# Rebuild and start
docker-compose up --build

# Stop
docker-compose down
```

### 2. **Production Docker Compose**

Let's create a complete production setup with nginx and backend.

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  backend:
    image: your-backend-image:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - app-network
    depends_on:
      - database

  database:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

### 3. **Environment-Specific Builds**

Let's create Dockerfiles for different environments.

```dockerfile
# Dockerfile.staging
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build for staging
RUN npm run build -- --configuration staging

FROM nginx:alpine

COPY --from=build /app/dist/your-app-name/browser /usr/share/nginx/html
COPY nginx.staging.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build Script:**

```bash
#!/bin/bash
# build-docker.sh

ENV=${1:-production}

case $ENV in
  development)
    docker build -f Dockerfile.dev -t myapp:dev .
    ;;
  staging)
    docker build -f Dockerfile.staging -t myapp:staging .
    ;;
  production)
    docker build -f Dockerfile -t myapp:prod .
    ;;
  *)
    echo "Usage: ./build-docker.sh [development|staging|production]"
    exit 1
    ;;
esac

echo "✅ Built image: myapp:$ENV"
```

### 4. **Docker with Build Arguments**

Let's use build arguments for flexible configurations.

```dockerfile
# Dockerfile with build args
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS build

ARG CONFIGURATION=production
ARG API_URL
ARG APP_VERSION

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Pass build args to Angular
RUN npm run build -- \
    --configuration ${CONFIGURATION} \
    --base-href / \
    --deploy-url /

# Replace environment variables in built files
RUN sed -i "s|API_URL_PLACEHOLDER|${API_URL}|g" /app/dist/*/browser/main*.js

FROM nginx:alpine

LABEL version="${APP_VERSION}"
LABEL description="Angular Application"

COPY --from=build /app/dist/your-app-name/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build with Arguments:**

```bash
# Build with custom arguments
docker build \
  --build-arg NODE_VERSION=20 \
  --build-arg CONFIGURATION=production \
  --build-arg API_URL=https://api.example.com \
  --build-arg APP_VERSION=1.0.0 \
  -t myapp:1.0.0 \
  .
```

### 5. **Kubernetes Deployment**

Let's create Kubernetes manifests for deploying the containerized app.

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: angular-app
  labels:
    app: angular-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: angular-app
  template:
    metadata:
      labels:
        app: angular-app
    spec:
      containers:
      - name: angular-app
        image: your-registry/angular-app:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: angular-app-service
spec:
  selector:
    app: angular-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: angular-app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: angular-app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: angular-app-service
            port:
              number: 80
```

## ✅ Best Practices

### 1. **Use Multi-Stage Builds**

```dockerfile
# ✅ Good - Multi-stage build
FROM node:20-alpine AS build
# Build stage...

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# ❌ Avoid - Single stage with build tools
FROM node:20
RUN npm install && npm run build
# Includes unnecessary build dependencies
```

### 2. **Minimize Image Size**

```dockerfile
# ✅ Good - Alpine base, clean cache
FROM node:20-alpine
RUN npm ci && npm cache clean --force

# ❌ Avoid - Full node image
FROM node:20
RUN npm install
```

### 3. **Use .dockerignore**

```bash
# .dockerignore
node_modules
dist
.git
.gitignore
*.md
.angular
.vscode
coverage
e2e
```

### 4. **Security Best Practices**

```dockerfile
# ✅ Good - Run as non-root user
FROM nginx:alpine
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser
USER appuser

# ✅ Good - Health checks
HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1
```

### 5. **Optimize Layer Caching**

```dockerfile
# ✅ Good - Copy package files first
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ Avoid - Copy everything first
COPY . .
RUN npm ci
```

## 🎯 Docker Commands Cheat Sheet

```bash
# Build image
docker build -t myapp:latest .

# Run container
docker run -p 8080:80 myapp:latest

# Run in background
docker run -d -p 8080:80 --name myapp myapp:latest

# View logs
docker logs myapp
docker logs -f myapp  # Follow logs

# Stop container
docker stop myapp

# Remove container
docker rm myapp

# Remove image
docker rmi myapp:latest

# Execute command in container
docker exec -it myapp sh

# View running containers
docker ps

# View all containers
docker ps -a

# Clean up
docker system prune -a
```

## 🎓 Learning Checklist

- [ ] Understand Docker basics
- [ ] Create multi-stage Dockerfiles
- [ ] Optimize image size
- [ ] Configure nginx for Angular
- [ ] Use docker-compose
- [ ] Implement health checks
- [ ] Deploy to Kubernetes
- [ ] Follow security best practices

## 🚀 Next Steps

1. **[CI/CD Pipelines](/deployment/ci-cd/)** - Automate Docker builds
2. **[Deployment Strategies](/deployment/strategies/)** - Choose deployment approach
3. **[Performance Optimization](/advanced/performance/)** - Optimize before containerizing

---

**Pro Tip**: Always use multi-stage builds to keep images small! Use Alpine-based images, implement health checks, and run containers as non-root users for security! 🐳
