# NG Guide

**A one-stop, beginner-friendly guide to modern Angular.**

Learn Angular 22 from the first component through signals, Signal Forms, routing, HTTP, RxJS, testing, server rendering, deployment and complete projects. The site also covers Angular's CLI MCP server and practical ways to use AI tools safely.

🌐 **Read the guide:** [ng-guide.letsprogram.in](https://ng-guide.letsprogram.in/)

## What this repository contains

- **Astro + Starlight** documentation site. Content is authored in `src/content/docs/`.
- **Shared sidebar and AI index** in `src/sidebar.mjs`.
- **Markdown endpoints** for each page, plus `/llms.txt` and `/llms-full.txt` for AI tools.
- **Per-page actions** to copy Markdown or open the page in an AI assistant.
- **Downloadable Angular agent skill** at `/skills/ng-guide/SKILL.md`.
- An optional **Ask AI** widget backed by `ai-backend/`; it is disabled unless `PUBLIC_ASK_AI_ENDPOINT` is configured.

## Run the site locally

Requirements: Node.js supported by the installed Astro version and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build and preview

```bash
npm run build
npm run preview
```

The site builds statically into `dist/`.

## Add or update a documentation page

1. Add or edit a `.md` / `.mdx` file under `src/content/docs/`.
2. Include `title` and `description` frontmatter.
3. Add the page's label and slug to `src/sidebar.mjs`.
4. Follow [best-practice.md](./best-practice.md) for Angular examples.
5. Run `npm run build`.

The sidebar also controls the ordering used by `/llms.txt` and `/llms-full.txt`.

## Optional Ask AI service

The widget stays hidden unless the build environment defines `PUBLIC_ASK_AI_ENDPOINT`. The backend is a small Node.js service that retrieves relevant text from the guide and calls an OpenAI-compatible LLM API. Configure it using [ai-backend/README.md](./ai-backend/README.md).

**Never place an LLM API key in `PUBLIC_` variables or browser code.** Set `LLM_API_KEY` only in the backend's environment or secret manager.

## Deploy the complete project

Use the root Dockerfile and Docker Compose configuration to run the static site and
private chat backend together. Follow the [Coolify deployment guide](./deployment/README.md)
for runtime secrets, domains, HTTPS, verification, and the alternative of keeping the
frontend on Vercel.

## Angular version baseline

Content targets Angular 22.2 and includes short notes for older versions when behavior differs. Angular's release cadence and APIs change; version-specific claims should be rechecked against official release notes before future updates.

## Contributing

Keep examples accurate, accessible and self-contained. Prefer internal guide links and clearly label preview or experimental APIs. Pull requests that update version-sensitive facts should include the source used for verification.
