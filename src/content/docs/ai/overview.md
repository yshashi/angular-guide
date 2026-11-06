---
title: Angular + AI 🤖
description: How Angular 22 works with AI — build AI-powered features into your apps, and develop Angular faster with AI assistants, MCP, rules files and skills.
sidebar:
  order: 1
---

"Angular and AI" means two different things, and this section covers both:

1. **Building AI features _into_ your Angular app** — a chat box, a "summarize this" button, smart search, generated recipes. Your users talk to a model through your app.
2. **Using AI _to build_ your Angular app** — GitHub Copilot, Cursor, Claude Code, Gemini CLI and friends writing, testing and debugging Angular code with you.

Angular 22 ships real tooling for both halves: signal-based async APIs that fit streaming AI responses, an **MCP server inside the Angular CLI**, generated **AI rules files**, official **agent skills**, experimental **WebMCP** support so in-browser agents can use your app, and **in-page AI debugging tools** in dev mode.

## What you'll learn in this section

- How to call an LLM safely from Angular (without leaking API keys) and stream the answer into the UI with signals
- How to connect your editor's AI assistant to the Angular CLI through the MCP server
- How to generate `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` rules files and install Angular agent skills
- How to expose your app's features as tools to browser AI agents with WebMCP
- How AI agents can inspect a running Angular app (DI graph, signal graph)
- A practical prompting workflow and a review checklist for AI-generated Angular code

## Half 1: Building AI-powered features

Your Angular app runs in the browser. A model provider (Gemini, OpenAI, Anthropic, a local Ollama model…) runs somewhere else and usually needs a **secret API key**. The core rule is simple:

:::danger[Never ship a model API key to the browser]
Anything in your Angular bundle — including `environment.ts` — can be read by anyone who opens DevTools. Call the model from a **server** (Angular SSR's `server.ts`, a Cloud Function, a Genkit flow…) or use a client SDK that is designed for the browser and protected by attestation, such as **Firebase AI Logic with App Check**.
:::

Once the request is safe, Angular's reactivity does the rest:

| Need | Angular tool |
| --- | --- |
| Run a request only when the user submits | A "submitted prompt" signal used as `params` of a `resource` |
| Show tokens as they arrive | `resource({ stream })` or a signal you append to |
| Loading / error / retry UI | `isLoading()`, `error()`, `reload()` on resources |
| Typed JSON answers (structured output) | `httpResource` with a `parse` function |
| Accumulate chat history | `signal<Message[]>` or `linkedSignal` |

👉 Full walkthrough with an end-to-end streaming example: [Build AI Features](/ai/build-ai-features/).

## Half 2: Developing Angular with AI

AI assistants are trained on years of older Angular code. Left alone they often write `standalone: true`, `*ngIf`, `@Input()`, constructor injection or APIs that were **removed** in v22. Angular gives you several ways to steer them:

| Tool | What it does | Page |
| --- | --- | --- |
| **Angular CLI MCP server** (`ng mcp`) | Lets the assistant search angular.dev, load version-matched best practices, list projects, build, test and run the dev server | [Angular MCP Server](/ai/mcp-server/) |
| **AI config / rules files** (`ng generate ai-config`) | Writes `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` plus the MCP config for your tool | [AI Config, Rules & Skills](/ai/ai-config-and-skills/) |
| **Agent skills** (`angular-developer`, `angular-new-app`) | Task-specific instructions agents load on demand | [AI Config, Rules & Skills](/ai/ai-config-and-skills/#agent-skills) |
| **AI tutor** | An interactive Angular course run by your assistant through the MCP server | [AI Config, Rules & Skills](/ai/ai-config-and-skills/#the-angular-ai-tutor) |

And for the running app:

| Tool | What it does | Page |
| --- | --- | --- |
| **WebMCP** (experimental) | Your app registers tools (e.g. `searchCatalog`, a Signal Form) that an AI agent in the browser can call | [WebMCP Tools](/ai/webmcp/) |
| **AI runtime debugging tools** (dev mode) | Agents can read your app's live DI graph and signal graph through Chrome DevTools | [AI Runtime Debugging](/ai/ai-debugging/) |

## Map of this section

1. **[Overview](/ai/overview/)** — you are here.
2. **[Build AI Features](/ai/build-ai-features/)** — architecture, streaming with `resource`, a chat UI, structured output, Genkit and Firebase AI Logic.
3. **[Angular MCP Server](/ai/mcp-server/)** — `ng mcp` setup for VS Code, Cursor, Claude Code, Gemini CLI, JetBrains, Codex and Antigravity, plus every tool it offers.
4. **[AI Config, Rules & Skills](/ai/ai-config-and-skills/)** — `ng new --ai-config`, `ng generate ai-config`, best-practice prompts, agent skills, the AI tutor.
5. **[WebMCP Tools](/ai/webmcp/)** — expose app features to in-browser agents (experimental).
6. **[AI Runtime Debugging](/ai/ai-debugging/)** — the `angular:di_graph` and `angular:signal_graph` in-page tools.
7. **[Prompting Best Practices](/ai/prompting-best-practices/)** — a daily workflow and a checklist of common AI mistakes in Angular code.
8. **[Use NG Guide with AI](/ai/use-ng-guide-with-ai/)** — feed this site to your assistant via `llms.txt`.

## Key takeaways

- Keep model API keys on the server; the browser only talks to **your** endpoint (or to Firebase AI Logic protected by App Check).
- Signals and `resource` are a natural fit for slow, streaming, sometimes-failing AI responses.
- Give your coding assistant Angular 22 context: the **MCP server** + a **rules file** + **skills** fix most "old Angular" output.
- WebMCP is **experimental** — great to explore, not yet something to depend on in production.

## Next steps

- Build your first streaming AI feature: [Build AI Features](/ai/build-ai-features/)
- Connect your editor to Angular: [Angular MCP Server](/ai/mcp-server/)
- Refresh the basics the examples rely on: [Signals](/modern/signals/) and [Resource API](/modern/resource-api/)
