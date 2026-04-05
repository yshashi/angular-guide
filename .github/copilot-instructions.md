# Copilot Instructions

## Project Overview

This is **NG Guide** (`ng-guide.letsprogram.in`) — a comprehensive Angular learning documentation site built with [Astro Starlight](https://starlight.astro.build/). It is a content-focused site, not an Angular application itself. All content is authored in Markdown/MDX.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
```

No test or lint tooling is configured.

## Architecture

- **`astro.config.mjs`** — Central config defining site metadata, integrations (Starlight, sitemap, React), and the **complete sidebar navigation structure**. This is the most important file for understanding site organization.
- **`src/content/docs/`** — All documentation content as `.md`/`.mdx` files. File paths map to URL routes (e.g., `beginner/components.md` → `/beginner/components/`).
- **`src/config.js`** — Runtime config for API URL (environment-aware) and Google Analytics measurement ID.
- **`src/styles/custom.css`** — Starlight theme overrides.
- **`src/content/docs/index.mdx`** — Splash landing page using Starlight components (`Card`, `CardGrid`).

## Content Conventions

### Frontmatter

Every doc page must include `title` and `description` in YAML frontmatter. Use `sidebar.order` to control sort order within a section:

```yaml
---
title: Page Title 🚀
description: Brief description for SEO and Starlight metadata
sidebar:
  order: 1
---
```

### Sidebar Management

The sidebar is **manually defined** in `astro.config.mjs` using `label` + `slug` pairs. Adding a new doc file requires a corresponding sidebar entry — files are not auto-discovered.

### Content Organization

Docs are grouped into topic directories under `src/content/docs/`:
`beginner/`, `intermediate/`, `modern/`, `advanced/`, `rxjs/`, `testing/`, `ssr/`, `deployment/`, `projects/`, `migration/`, `tools/`, `resources/`

### Writing Style

- Use emoji in `title` frontmatter values (e.g., `🧩`, `🚀`)
- Include working Angular code examples with TypeScript syntax highlighting
- Structure content progressively — each section builds on prior knowledge

## Angular Code Examples in Content

When writing or editing Angular code examples within documentation, follow the conventions in `best-practice.md`:

- Use **standalone components** (do NOT set `standalone: true` — it's the default)
- Use `input()`/`output()` functions instead of `@Input`/`@Output` decorators
- Use `inject()` function instead of constructor injection
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`/`*ngFor`/`*ngSwitch`
- Use **signals** for state, `computed()` for derived state
- Use `ChangeDetectionStrategy.OnPush` in component decorators
- Use `class` bindings instead of `ngClass`, `style` bindings instead of `ngStyle`
- Use `providedIn: 'root'` for singleton services
- Do NOT use `@HostBinding`/`@HostListener` — use the `host` property in decorators
