---
title: Docker & Containers 🐳
description: Containerize Angular 22 apps — multi-stage Dockerfiles for static (nginx) and SSR (Node 24) builds, dev containers, PORT, allowed hosts and Kubernetes.
sidebar:
  order: 2
---

A container image bundles your built app with exactly the web server or Node.js runtime it needs, so it runs the same on your laptop, in CI and in production. This page gives you production-ready Dockerfiles for both kinds of Angular apps — **static (client-side rendered)** and **server-side rendered (SSR)** — plus a development container and a Kubernetes example.

**What you'll learn**

- Which Node.js versions Angular 22 supports (and which image to pick)
- A multi-stage Dockerfile for a static app served by nginx
- A multi-stage Dockerfile for an SSR app running on Node.js
- How `PORT`, `allowedHosts` and `NG_ALLOWED_HOSTS` work inside containers
- Build-once-deploy-many with runtime configuration
- Running `ng serve` in a dev container

:::note
If you haven't yet, read [Deployment Strategies](/deployment/strategies/) first — it explains the `dist/<app>/browser` and `dist/<app>/server` folders these Dockerfiles copy.
:::

## Pick the right Node.js image

Angular 22 requires **Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`**. Node 20 is no longer supported, so old `node:20-alpine` images will fail with an engine error.

| Image | Use it? |
|---|---|
| `node:24-alpine` | ✅ Recommended default (LTS, small) |
| `node:26-alpine` | ✅ Supported (newest LTS line) |
| `node:22-alpine` | ✅ Supported (make sure the image is 22.22.3 or newer) |
| `node:20-*` | ❌ Not supported by Angular 22 |

Pin a version in production (for example `node:24.15-alpine` or a digest) so rebuilds are reproducible. The examples below use `node:24-alpine` for readability.

## Start with a `.dockerignore`

Keep the build context small and avoid copying your local `node_modules` (which may contain binaries for the wrong OS):

```text title=".dockerignore"
node_modules
dist
.angular
.git
.vscode
coverage
playwright-report
test-results
*.log
Dockerfile*
docker-compose*.yml
```

## Static app: build with Node, serve with nginx

A **multi-stage build** compiles the app in a Node image, then copies only the output into a tiny nginx image. The final image contains no Node.js, no source code and no `node_modules`.

```dockerfile title="Dockerfile"
# ---- Stage 1: build ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached between builds
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG CONFIGURATION=production
RUN npx ng build --configuration=${CONFIGURATION}

# ---- Stage 2: serve ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy ONLY the browser folder
COPY --from=build /app/dist/my-app/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1/ || exit 1
```

:::caution[`npm ci`, not `npm ci --omit=dev`]
The Angular CLI, compiler and TypeScript are dev dependencies — the **build** stage needs them. Skipping dev dependencies there breaks `ng build`. They never reach the final image anyway.
:::

The nginx config adds the SPA fallback (so deep links work) and sensible caching:

```nginx title="nginx.conf"
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  # Hashed bundles: cache for a year
  location ~* \.(?:js|css|woff2?|ttf|svg|png|jpe?g|gif|webp|avif|ico)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  # Runtime config must always be fresh
  location = /config.json {
    add_header Cache-Control "no-cache";
  }

  # Everything else goes to Angular's router
  location / {
    add_header Cache-Control "no-cache";
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    try_files $uri $uri/ /index.html;
  }
}
```

Build and run it:

```bash
docker build -t my-app:1.0.0 .
docker run --rm -p 8080:80 my-app:1.0.0
# open http://localhost:8080
```

Build a different configuration with the build argument: `docker build --build-arg CONFIGURATION=staging -t my-app:staging .`

:::tip[Run nginx as a non-root user]
Swap the runtime image for `nginxinc/nginx-unprivileged:alpine`. It runs as a non-root user and listens on port **8080**, so change `listen 80;` to `listen 8080;` and `EXPOSE 8080`.
:::

:::note[Prerendered (SSG) apps]
With `"outputMode": "static"`, use `try_files $uri $uri/ /index.csr.html;` as the fallback — `index.html` there is the prerendered home page.
:::

## SSR app: build with Node, run with Node

An SSR build produces `dist/my-app/server/server.mjs`, an Express server that also serves the files in `dist/my-app/browser`. The server bundle already includes its npm dependencies (Express, `@angular/ssr`, …), so the runtime image only needs the `dist` folder.

```dockerfile title="Dockerfile"
# ---- Stage 1: build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

# ---- Stage 2: run ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000

# browser/ and server/ must stay side by side
COPY --from=build --chown=node:node /app/dist/my-app ./dist/my-app

# The official Node image ships a non-root "node" user
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:4000/healthz || exit 1
CMD ["node", "dist/my-app/server/server.mjs"]
```

The health check calls a `/healthz` endpoint. Add it to `src/server.ts` **before** the Angular handler (see [Deployment Strategies](/deployment/strategies/#deploying-an-ssr-app-on-nodejs)):

```ts title="src/server.ts (excerpt)"
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});
```

:::tip
If you used the `externalDependencies` build option to keep some packages out of the server bundle, also copy `package.json`/`package-lock.json` into the runtime stage and run `npm ci --omit=dev` there.
:::

### Allowed hosts: avoid `400 Bad Request`

The SSR engine only renders requests whose `Host` header is allow-listed (SSRF protection). Since Angular 22, unknown hosts get a **`400 Bad Request`** instead of silently falling back to client rendering. In a container, the easiest way is the `NG_ALLOWED_HOSTS` environment variable (comma-separated, wildcards allowed):

```bash
docker run --rm -p 4000:4000 \
  -e NG_ALLOWED_HOSTS="localhost,example.com,*.example.com" \
  my-ssr-app:1.0.0
```

You can instead hard-code them in `angular.json` under `build.options.security.allowedHosts` — those are always included. `NG_ALLOWED_HOSTS` is ignored if you pass `allowedHosts` directly to `new AngularNodeAppEngine({...})` in `server.ts`.

Running behind a load balancer or ingress that adds `X-Forwarded-Host`/`X-Forwarded-Proto`? Angular strips those headers unless you trust them:

```bash
-e NG_TRUST_PROXY_HEADERS="x-forwarded-host,x-forwarded-proto"
```

Only do this when the proxy in front of the container sets or validates these headers.

### `PORT` inside the container

The generated `server.ts` listens on `process.env.PORT` (default `4000`). The Dockerfile sets `PORT=4000`; platforms such as Cloud Run inject their own `PORT`, and the server picks it up automatically. Keep `EXPOSE` and your `-p host:container` mapping in sync with it.

## Build once, deploy many (runtime config)

Building a separate image per environment is slow and means the image you tested isn't the one you ship. Instead, build **one image** and supply environment-specific settings at runtime with a `config.json` loaded by `provideAppInitializer()` (code in [Deployment Strategies → Runtime configuration](/deployment/strategies/#runtime-configuration-build-once-deploy-many)).

Mount the file when starting the static container:

```bash
docker run --rm -p 8080:80 \
  -v "$(pwd)/config.staging.json:/usr/share/nginx/html/config.json:ro" \
  my-app:1.0.0
```

In Kubernetes, the same file usually comes from a `ConfigMap`.

## Development container

Want teammates to run the dev server without installing Node? Use a dev image and bind-mount the source:

```dockerfile title="Dockerfile.dev"
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 4200
# --host 0.0.0.0 makes the server reachable from outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]
```

```yaml title="compose.yaml"
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "4200:4200"
    environment:
      - PORT=4200
    volumes:
      - .:/app
      - /app/node_modules   # keep the container's own node_modules
```

```bash
docker compose up --build
```

Dev-server details worth knowing:

- **`PORT` wins.** Since Angular 22, `ng serve` gives the `PORT` environment variable the **highest priority** — it overrides `--port` and the `port` in `angular.json`. If the server starts on an unexpected port, check whether `PORT` is set in your container or shell.
- **File watching.** If changes on a mounted volume aren't detected (common on Windows/macOS hosts), add `--poll 2000`.
- **Allowed hosts.** The dev server (Vite) answers requests for `localhost` and IP addresses. If you reach it through another hostname — a compose service name like `http://web:4200`, or a tunnel — add it: `ng serve --host 0.0.0.0 --allowed-hosts web` or `"allowedHosts": ["web"]` in the `serve` options. Avoid `true` (allow everything).

:::caution
`ng serve` is for development only. Never use the dev container as your production image.
:::

## Compose: app + API

A typical local stack runs the SSR container next to a backend:

```yaml title="compose.yaml"
services:
  web:
    build: .
    ports:
      - "4000:4000"
    environment:
      NG_ALLOWED_HOSTS: "localhost"
    depends_on:
      - api
    restart: unless-stopped

  api:
    image: my-org/api:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
    restart: unless-stopped
```

Secrets like `DATABASE_URL` come from a `.env` file or your secret manager — never from Angular environment files.

## Kubernetes example (SSR)

```yaml title="k8s/web.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: web
          image: ghcr.io/my-org/my-app:1.0.0
          ports:
            - containerPort: 4000
          env:
            - name: NG_ALLOWED_HOSTS
              value: "app.example.com"
            - name: NG_TRUST_PROXY_HEADERS
              value: "x-forwarded-host,x-forwarded-proto"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 4000
          livenessProbe:
            httpGet:
              path: /healthz
              port: 4000
            periodSeconds: 20
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 4000
```

Expose the Service through your cluster's Ingress or Gateway, and only trust forwarding headers that your ingress controller actually sets.

## Best practices

- **Multi-stage builds** — build tools stay in the build stage; the final image only has nginx or Node plus `dist`.
- **Copy `package*.json` before the source** so `npm ci` is cached until dependencies change.
- **Use `npm ci`** for reproducible installs from the lock file.
- **Run as non-root** — `USER node` for Node, `nginx-unprivileged` for nginx.
- **Pin base images** and rebuild regularly to pick up security patches; scan images in CI.
- **One image for all environments** — inject settings via `config.json`, env vars and secrets.
- **Add health checks** so Docker, Kubernetes or your platform can restart unhealthy containers.

## Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `npm ci` fails with an engine error | `node:20` base image | Use `node:24-alpine` (or 22.22.3+/26) |
| `ng: not found` / build fails | Installed with `--omit=dev` in the build stage | Plain `npm ci` in the build stage |
| nginx shows its welcome page | Copied `dist/my-app` instead of `dist/my-app/browser` | Copy the `browser` folder |
| 404 on refresh | No `try_files ... /index.html` | Add the SPA fallback |
| SSR container returns `400` | Host not allow-listed | Set `NG_ALLOWED_HOSTS` or `security.allowedHosts` |
| Dev server on wrong port | `PORT` env var overrides `--port` (v22+) | Unset `PORT` or set it to the port you want |
| Image is huge | Single-stage build with `node_modules` and source | Multi-stage build |

## Docker cheat sheet

```bash
docker build -t my-app:1.0.0 .                  # build an image
docker run --rm -p 8080:80 my-app:1.0.0         # run (static)
docker run -d --name web -p 4000:4000 my-ssr-app:1.0.0   # run in background (SSR)
docker logs -f web                               # follow logs
docker exec -it web sh                           # shell into a container
docker compose up --build                        # start a compose stack
docker image ls && docker system prune           # list / clean up
```

## Key takeaways

- Angular 22 needs Node 22.22.3+, 24.15+ or 26 — `node:24-alpine` is a good default.
- Static apps: build in Node, copy `dist/<app>/browser` into nginx with an `index.html` fallback.
- SSR apps: copy `dist/<app>` into a slim Node image and run `node dist/<app>/server/server.mjs`.
- Configure `NG_ALLOWED_HOSTS` (and `NG_TRUST_PROXY_HEADERS` behind a proxy) or SSR answers `400`.
- In v22 the `PORT` env var takes priority over `--port` for `ng serve`.

## Next steps

1. **[CI/CD Pipelines](/deployment/ci-cd/)** — build and push images automatically
2. **[Deployment Strategies](/deployment/strategies/)** — static hosts, SSR and environments
3. **[Performance Optimization](/advanced/performance/)** — make the app fast before you ship it
