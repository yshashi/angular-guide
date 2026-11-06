---
title: Use NG Guide with AI 🧭
description: Give coding agents and chat assistants accurate Angular 22 guidance with NG Guide's llms.txt, per-page Markdown, AGENTS.md rules and downloadable agent skill.
sidebar:
  order: 8
---

NG Guide pages are available as plain Markdown so coding agents can read the same explanations and examples as the website.

## Pick the right format

| Resource | Best for | Link |
|---|---|---|
| `llms.txt` | A concise index of the guide and links to every page | [Open llms.txt](/llms.txt) |
| `llms-full.txt` | Loading the full guide into tools that accept longer context | [Open the complete guide](/llms-full.txt) |
| Per-page Markdown | Keeping context focused on one topic | Open any page and choose **View as Markdown**, or append `.md` to its path |
| `AGENTS.md` | Repository-level instructions for an AI coding agent | [Download AGENTS.md](/AGENTS.md) |
| Agent skill | On-demand Angular conventions for compatible coding agents | [Download the NG Guide skill](/skills/ng-guide/SKILL.md) |

For example, the website version `/modern/signals/` is available as [`/modern/signals.md`](/modern/signals.md).

## Add the rules to your project

Download [AGENTS.md](/AGENTS.md) and place it at the root of your application repository. Commit the file so teammates and supported agents use the same guidance. Read through it first: remove conventions that do not match your project and add your own commands, architecture notes and testing requirements.

For a compatible agent-skills client, install the skill from the website URL. With the Vercel Skills CLI, for example:

```bash
npx skills add https://ng-guide.letsprogram.in/skills/ng-guide/SKILL.md
```

The CLI's source support can change; if the URL form is not recognized, download the skill file and place it in the agent's documented skills directory.

## Use the page actions

Each documentation page has:

- **Copy page** to copy its Markdown content.
- **Open in ChatGPT** and **Open in Claude** to start a conversation with a link to the page.
- **View as Markdown** for use with other assistants and tools.

The AI services apply their own account, privacy and context policies. Review those policies before sharing private code or data.

## Use the MCP server for repository-aware help

NG Guide's Markdown files give an assistant learning content. The [Angular CLI MCP server](/ai/mcp-server/) provides a separate integration for Angular documentation and project-aware tooling. Use both when useful: the MCP server for Angular CLI context, and NG Guide pages for a structured learning explanation.

## Updating the guide in an agent workflow

Treat copied or indexed guide content as a snapshot. Check the `title`, version notes and publication date on the page, and verify version-sensitive APIs against the project's installed Angular packages before applying code. Do not give an AI assistant secrets, production data or access it does not need.

## Next steps

- [Prompting Best Practices](/ai/prompting-best-practices/)
- [Angular MCP Server](/ai/mcp-server/)
- [Build AI Features](/ai/build-ai-features/)
