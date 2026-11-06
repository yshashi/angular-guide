# NG Guide — "Ask AI" backend

A tiny, dependency-free Node.js (>= 22) service that powers the **Ask AI** button on
[ng-guide.letsprogram.in](https://ng-guide.letsprogram.in).

How it works:

1. Downloads the whole guide from `https://ng-guide.letsprogram.in/llms-full.txt` (refreshed every 6 hours).
2. Splits it into sections and ranks them for each question with BM25 keyword search. The current page gets a small boost; questions about "this page" or "this topic" prioritize excerpts from it.
3. Sends the best excerpts plus the question to any **OpenAI-compatible** Chat Completions API and streams the answer back.

API keys stay on the server. The browser only talks to this service.

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_API_KEY` | ✅ | — | API key for your LLM provider. |
| `LLM_MODEL` | ✅ | — | Model name, e.g. a current GPT, Gemini or Llama model. |
| `LLM_BASE_URL` | | `https://api.openai.com/v1` | Any OpenAI-compatible base URL (see below). |
| `ALLOWED_ORIGINS` | | `https://ng-guide.letsprogram.in,http://localhost:4321` | Comma-separated CORS allow-list. |
| `DOCS_URL` | | `https://ng-guide.letsprogram.in/llms-full.txt` | Where to load the guide from. |
| `RATE_LIMIT_PER_10_MIN` | | `20` | Max questions per IP per 10 minutes. |
| `PORT` | | `8787` | HTTP port. |

OpenAI-compatible providers you can use via `LLM_BASE_URL`:

| Provider | `LLM_BASE_URL` |
|---|---|
| OpenAI | `https://api.openai.com/v1` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` |
| Groq | `https://api.groq.com/openai/v1` |
| Ollama (local) | `http://localhost:11434/v1` |

## Run locally

```bash
cp ai-backend/.env.example ai-backend/.env   # fill in your LLM_API_KEY
npm run ai:server                            # starts backend on http://localhost:8787
```

In a second terminal, run the docs site (`.env` in the repo root sets `PUBLIC_ASK_AI_ENDPOINT=http://localhost:8787/ask`):

```bash
cp .env.example .env
npm run dev                                  # http://localhost:4321 with the "Ask AI" widget enabled
```

> **Note:** Both `.env` and `ai-backend/.env` are gitignored so your API keys are never committed. If `dist/llms-full.txt` exists locally (after `npm run build`), the backend indexes it directly and falls back to `DOCS_URL` otherwise.

Run the backend regression test with `node --test ai-backend/server.test.mjs`. It uses a local mock model and does not need an API key.

## Enable it on the website

Set `PUBLIC_ASK_AI_ENDPOINT` (for example `https://api.interviewhelper.in/ng-guide/ask`) in the site's build
environment. When this variable is empty, the Ask AI button is not rendered at all.

When enabled, visitors can open the assistant from the floating **Ask AI** button or from
**Ask AI about this page → Open NG Guide assistant**. The conversation remains available when
the drawer is closed and reopened, but is kept only in the current page's browser memory and
is lost on navigation or reload. **New chat** clears the current conversation.

## API contract

`POST /ask` with JSON:

```json
{ "question": "How do I use httpResource?", "page": "modern/http-resource-api", "history": [{ "role": "user", "content": "..." }] }
```

The response is `application/x-ndjson`, with one JSON event per line:

```text
{"type":"sources","sources":[{"title":"HttpResource API 🌐","url":"https://ng-guide.letsprogram.in/modern/http-resource-api/"}]}
{"type":"delta","text":"`httpResource` lets you ..."}
{"type":"done"}
```

On failure the stream ends with `{"type":"error","message":"..."}`.

`GET /health` returns `{ "ok": true, "chunks": <indexed chunk count> }`.

## Deploy

Any Node 22+ host works (Render, Fly.io, Railway, a VM or a container). Example Dockerfile:

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY server.mjs package.json ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
```

Put it behind HTTPS. If you run behind a proxy, make sure `X-Forwarded-For` is set so rate limiting works per client.
