# Deploy NG Guide on Coolify

This deploys the entire project: the static Astro site and the streaming Ask AI backend.
The existing Node HTTP server is a long-running service, not a Vercel Function. Deploying
the frontend to Vercel alone does not deploy this backend.

## Architecture

```text
Browser -- HTTPS --> Coolify proxy --> web:8080 (Nginx)
                                       |-- /             built Astro site
                                       |-- /api/ask ---> api:8787/ask
                                       `-- /health ----> api:8787/health
```

- `Dockerfile` has `web` and `api` targets, both using the same documentation build.
- `docker-compose.yaml` runs both services. Only `web` receives a public Coolify domain.
- The frontend is built with `PUBLIC_ASK_AI_ENDPOINT=/api/ask`. No separate API domain
  or frontend environment variable is needed for this full-stack deployment.
- The backend reads the bundled `llms-full.txt`; it does not depend on the old Vercel
  deployment for retrieval. Rebuilding the images updates the documentation snapshot.
- Nginx refreshes the API address through Docker's internal DNS after container replacement.
- Both services run as non-root users. The backend key is injected at runtime, never
  copied into an image or passed as a Docker build argument.
- No database, persistent volume, or host port mapping is needed. Chat history stays in
  browser memory for the current page; rate-limit state resets when the API restarts.

## 1. Prepare credentials and the server

1. Rotate any API key previously shared in chat or saved in a tracked file/checkpoint.
2. Have a VPS connected to a running Coolify installation. Allow HTTP/HTTPS traffic
   on ports 80 and 443 and keep access to the Coolify dashboard restricted appropriately.
3. Use a server with sufficient memory for `npm ci` and the Astro build; 4 GB RAM is
   a reasonable starting point when building on the deployment server.
4. Have access to DNS for `ng-guide.letsprogram.in`.

Do not commit either `.env` or `ai-backend/.env`. The Docker build context uses an
allowlist and excludes environment files, Git history, local dependencies and build output.

## 2. Push the deployment files

Push the commit containing `Dockerfile`, `.dockerignore`, `docker-compose.yaml` and
`deployment/nginx.conf` to the branch Coolify will deploy.

Do not select a standalone Dockerfile deployment for the complete stack: the default
Dockerfile target is only the web image. Use **Docker Compose** so the API also runs.

## 3. Create a Git-based Coolify application

1. Open a Coolify project and its production environment.
2. Select **+ New** and connect the GitHub repository `yshashi/angular-guide` through
   a GitHub App, deploy key, or public repository URL.
3. Select the destination server and deployment branch, normally `main`.
4. Under **General > Build pipeline**, choose **Compose** as the build strategy.
   Older Coolify versions call this the **Docker Compose** build pack.
5. Set **Base Directory** to `/`.
6. Set **Docker Compose Location** to `/docker-compose.yaml`.
7. Save/load the configuration and confirm that Coolify detects `web` and `api`.

Use the repository-backed application rather than pasting this into **Docker Compose
Empty**: the build needs the Dockerfile and source files from Git.

## 4. Set runtime environment variables

Open the application's **Environment Variables** and supply:

| Variable | Value |
|---|---|
| `LLM_API_KEY` | Your newly rotated provider key. Lock/mask it in Coolify. |
| `LLM_MODEL` | `gpt-5.6-sol`, if that is the model your provider supports. |
| `LLM_BASE_URL` | `https://gatify.letsprogram.in/v1` for the provider used in local setup; otherwise your provider's OpenAI-compatible `/v1` URL. |
| `ALLOWED_ORIGINS` | `https://ng-guide.letsprogram.in` |
| `RATE_LIMIT_PER_10_MIN` | `20`, or your chosen per-IP limit. |

Set these variables to **available at runtime**, with **build-time availability disabled**.
The Compose file references the API variables only under the `api` service's `environment`.
Do not add `LLM_API_KEY` to `PUBLIC_` variables, build arguments, frontend settings, or Git.

`LLM_BASE_URL` defaults to `https://api.openai.com/v1` if omitted. The model must match
the selected provider; a provider-specific model name may not work with OpenAI directly.
If a secret contains `$`, use Coolify's literal-value setting to avoid interpolation.

Origins are comma-separated, with no trailing slash or URL path. If testing through a
temporary hostname, include that origin as well. Leave `PORT` and `DOCS_URL` alone:
the stack uses internal port 8787 and the documentation included in the image.

## 5. Configure the public domain

1. Open **Domains > Add domain** and select the **web** service.
2. Enter `https://ng-guide.letsprogram.in:8080`.
3. Do not assign a public domain to `api`, and do not publish port 8787.
4. Do not use `docker-compose.local.yaml` in Coolify.

The `:8080` suffix tells Coolify which **internal container port** to route to.
Visitors still use `https://ng-guide.letsprogram.in`, without `:8080`.
Some versions offer a separate internal-port field; select port 8080 there instead.
Coolify's proxy terminates HTTPS; Nginx listens for HTTP internally.

For a low-downtime migration, first use a temporary hostname pointed at the server,
include it in `ALLOWED_ORIGINS`, and verify the deployment before switching the main
domain. Canonical URLs and sitemap URLs intentionally still use `ng-guide.letsprogram.in`.
If permanently changing that hostname, also update `site` in `astro.config.mjs` and
`SITE_URL` in `src/lib/ai-docs.ts`.

## 6. Point DNS at the Coolify server

1. Set the hostname's A record to the VPS's public IPv4 address.
2. Remove/replace a conflicting Vercel CNAME for the same hostname when cutting over.
3. Only publish an AAAA record if the VPS and ingress actually support that IPv6 address.
4. Wait for DNS propagation and ensure Coolify can issue its HTTPS certificate.
5. Keep ports 80/443 reachable for routing and certificate validation.

If using a CDN, bypass caching and interactive browser challenges for `/api/ask`.
The Nginx configuration disables response buffering for chat; any outer proxy must
also allow long-lived streaming responses.

## 7. Deploy

1. Select **Deploy**.
2. Watch **Deployment Logs** for both image builds.
3. Confirm `api` becomes healthy before `web` starts.
4. Check **Runtime Logs** for both services if startup fails.
5. Confirm the domain has a valid HTTPS certificate.

The health checks require a non-empty documentation index, not just a listening process.
Keep one API replica initially: the built-in rate limiter is in-memory, not distributed.

## 8. Verify the public deployment

Check backend readiness:

```bash
curl --fail-with-body https://ng-guide.letsprogram.in/health
```

Expect JSON with `"ok":true` and a positive `chunks` count. This checks the running
backend and index, not the validity of your provider credentials.

Test a real streamed answer, which makes a billable request to your configured provider:

```bash
curl --fail-with-body --no-buffer https://ng-guide.letsprogram.in/api/ask \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://ng-guide.letsprogram.in' \
  --data '{"question":"Show a tiny Angular signal example.","page":"modern/signals","history":[]}'
```

Expect `sources`, one or more `delta` events, then `done`. An `error` event means the
answer failed even if the HTTP status is 200.

Then verify in the browser:

1. Load `/modern/signals/` and open **Ask AI**.
2. Send a question, check streaming and related guide links, then ask a follow-up.
3. Confirm `/llms-full.txt` and `/modern/signals.md` return readable documentation.
4. Confirm an unknown page returns HTTP 404 rather than the homepage.
5. Check browser Network requests: chat must use `/api/ask`, never localhost.

## 9. Protect and maintain the service

- Add a provider spending cap and suitable ingress/WAF rate limits before opening the
  assistant to unrestricted public traffic. CORS is not authentication; the existing
  in-memory per-IP limiter is only a basic safeguard.
- Keep API access private to the application network. Nginx trusts forwarded client
  addresses only from private reverse-proxy networks and sends a normalized address
  to the backend. Review those trusted ranges if using a custom network/proxy.
- After content/code updates, push and redeploy. Enable GitHub webhooks/automatic
  deployments in Coolify if desired.
- After changing runtime credentials, recreate/restart the application through Coolify.
  Build-time frontend changes require a new deployment, not just a restart.
- Use Coolify's previous deployment/rollback flow if a release fails.

## Keep the frontend on Vercel instead

You can keep the current frontend deployment and use this same Coolify stack as its
backend host:

1. Deploy the stack above, but assign `https://ng-guide-api.letsprogram.in:8080` to
   `web` and point only that API hostname's DNS at the VPS.
2. Keep the main site's DNS pointing to Vercel.
3. Set Coolify's `ALLOWED_ORIGINS` to the frontend's actual origin,
   `https://ng-guide.letsprogram.in`. Add exact preview origins if needed.
4. In the Vercel frontend project's environment variables, set
   `PUBLIC_ASK_AI_ENDPOINT=https://ng-guide-api.letsprogram.in/api/ask`.
5. Apply it to the relevant Vercel environments and **redeploy** the frontend.
   Astro embeds this value at build time.
6. Keep the existing Vercel build command `npm run build` and output directory `dist`.
7. Test a browser question and the API hostname's `/health` endpoint.

This option also serves a copy of the static docs on the API hostname; the main site
remains on Vercel. Do not put the LLM key in Vercel's frontend environment variables.

## Optional: test Docker locally

Fill in your ignored `ai-backend/.env` using its safe example. Never run
`docker compose config` without `--quiet` when using real credentials: it prints
resolved environment values.

```bash
docker compose --env-file ai-backend/.env \
  -f docker-compose.yaml -f docker-compose.local.yaml config --quiet

docker compose --env-file ai-backend/.env \
  -f docker-compose.yaml -f docker-compose.local.yaml up --build -d

curl --fail-with-body http://localhost:8080/health
```

Open `http://localhost:8080`. Set `NG_GUIDE_LOCAL_PORT` to another port if 8080 is
already used. The local override publishes only the web service on loopback.

Stop just this stack with:

```bash
docker compose --env-file ai-backend/.env \
  -f docker-compose.yaml -f docker-compose.local.yaml down
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Ask AI is missing on Vercel | Set `PUBLIC_ASK_AI_ENDPOINT` and redeploy the frontend. |
| HTTP 403 for chat | Match `ALLOWED_ORIGINS` to the browser's exact origin, not Coolify's internal-port notation. |
| HTTP 502 / unhealthy stack | Inspect `api` logs, required variables and index health. Do not bypass the health check. |
| Stream has an `error` event | Verify provider URL, model, rotated key, quota and billing. |
| Answer arrives all at once | Check buffering/caching in the outer proxy or CDN. |
| HTTP 429 affects everyone | Check trusted proxy/client-IP forwarding and ingress limits. |
| Content remains old | Rebuild/redeploy both images; the backend indexes the bundled build. |

Coolify references: [Git-based Docker Compose](https://coolify.io/docs/applications/builds/docker-compose)
and [environment variables](https://coolify.io/docs/applications/configuration/environment-variables).
