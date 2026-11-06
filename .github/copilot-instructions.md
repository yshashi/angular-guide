# Copilot Instructions

## Project

NG Guide (`https://ng-guide.letsprogram.in`) is an Astro 5 + Starlight documentation site, not an Angular application. Documentation lives in `src/content/docs/` as Markdown or MDX. Angular examples must follow [best-practice.md](../best-practice.md) and target Angular 22.2 unless a page is explicitly about an older version.

## Commands

```bash
npm run dev       # Start at localhost:4321
npm run build     # Production build into dist/
npm run preview   # Preview the production build
```

There is no repository test or lint script configured. The production build validates Starlight content and routes.

## Site structure

- `astro.config.mjs` configures Astro, Starlight, integrations and UI overrides.
- `src/sidebar.mjs` is the shared source of truth for sidebar and AI content ordering. Adding a page requires an entry here.
- `src/content/docs/` contains the guide pages; file paths map to routes.
- `src/components/` contains Starlight component overrides and page actions.
- `src/pages/` contains generated Markdown and AI endpoints such as `/llms.txt`.
- `skills/ng-guide/SKILL.md` provides downloadable agent instructions.
- `ai-backend/` is the optional Node service for the site's Ask AI widget. Never commit API keys.
- `src/styles/custom.css` contains Starlight theme overrides.
- `src/content/docs/index.mdx` is the splash page and uses Starlight components.

## Documentation conventions

Every page needs `title` and `description` frontmatter. Use an emoji in the title, set `sidebar.order` within the section and do not duplicate the title as a body-level H1. Use concise, progressive explanations, working examples, short version notes and internal links with trailing slashes.

When writing Angular examples, verify Angular APIs and stability against the installed package declarations or the official Angular documentation. Label developer-preview and experimental APIs. Do not claim a framework API is stable merely because it appears in a release note.

## Angular example baseline

- Standalone by default; never add redundant `standalone: true`.
- Angular 22 defaults components to OnPush; do not add `changeDetection` boilerplate.
- Prefer `input()`, `output()`, `model()`, `inject()`, signals and `computed()`.
- Use native control flow (`@if`, `@for` with `track`, `@switch`) and class/style bindings.
- Use `@Service()` for suitable new root-provided services; use `@Injectable()` for cases where it fits better or for older-version compatibility.
- Signal Forms use `FormField` and `[formField]`.
- Use `provideHttpClient()`; Fetch is already the default in Angular 22.
- Use Vitest for newly created Angular projects.
- Use the `host` metadata instead of `@HostBinding`/`@HostListener`.

See [best-practice.md](../best-practice.md) and the [NG Guide agent skill](../skills/ng-guide/SKILL.md) for the full conventions.
