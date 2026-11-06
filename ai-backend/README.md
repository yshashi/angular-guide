# NG Guide — "Ask AI" backend

A tiny, dependency-free Node.js (>= 22) service that powers the **Ask AI** button on
[ng-guide.letsprogram.in](https://ng-guide.letsprogram.in).

How it works:

1. Downloads the whole guide from `https://ng-guide.letsprogram.in/llms-full.txt` (refreshed every 6 hours).
2. Splits it into sections and ranks them for each question with BM25 keyword search. The current page gets a small boost.
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
cd ai-backend
cp .env.example .env   # fill in LLM_API_KEY and LLM_MODEL
node --env-file=.env server.mjs
```

Then, in the site root:

```bash
PUBLIC_ASK_AI_ENDPOINT=http://localhost:8787/ask npm run dev
```

## Enable it on the website

Set `PUBLIC_ASK_AI_ENDPOINT` (for example `https://api.interviewhelper.in/ng-guide/ask`) in the site's build
environment. When this variable is empty, the Ask AI button is not rendered at all.

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
