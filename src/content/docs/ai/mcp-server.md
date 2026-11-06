---
title: Angular MCP Server 🔌
description: Set up the Angular CLI MCP server (ng mcp) for VS Code Copilot, Cursor, Claude Code, Gemini CLI, JetBrains, Codex and Antigravity, and learn every tool it provides.
sidebar:
  order: 3
---

The Angular CLI has a built-in **Model Context Protocol (MCP) server**. Once your AI assistant is connected to it, the assistant can search the official docs, load Angular best practices that match **your project's Angular version**, discover the projects in your workspace, and build, test and serve your app — through safe, structured tools instead of guessing shell commands.

## What you'll learn

- What MCP is and what the Angular CLI MCP server adds to your assistant
- How to connect it in VS Code (Copilot), Cursor, Claude Code, Gemini CLI, JetBrains IDEs, OpenAI Codex and Antigravity
- Every tool the server offers in Angular 22.2 and when the agent uses it
- The `--read-only`, `--local-only` and `--root` options
- Typical agent workflows (feature + tests, OnPush/zoneless migration, learning)

## What is MCP?

**MCP (Model Context Protocol)** is an open standard that lets AI assistants call **tools** provided by external programs. Your editor or CLI agent (the _host_) starts an MCP server, asks which tools it has, and the model can then call those tools with structured arguments.

The Angular CLI's server runs locally over stdio. You don't start it yourself — your AI tool starts it with this command:

```bash
npx -y @angular/cli mcp
```

:::note
If you run `ng mcp` directly in a terminal, it doesn't start a server; it prints a sample configuration and exits. The server only runs when an MCP host launches it. Inside a project that has `@angular/cli` installed, `npx` uses that local CLI version.
:::

## Fastest setup: let the CLI write the config

The CLI can generate the right MCP config file (and a rules file) for your tool:

```bash
# new project
ng new my-app --ai-config=vscode

# existing project
ng generate ai-config --tool=cursor
```

Choices are `claude-code`, `cursor`, `gemini-cli`, `open-ai-codex`, `vscode` (or `none`). Details are on [AI Config, Rules & Skills](/ai/ai-config-and-skills/). If you prefer to set things up by hand, use the snippets below.

## Manual setup per tool

All tools run the same command; only the config file and its format differ.

### VS Code (GitHub Copilot)

Create `.vscode/mcp.json` in your project. VS Code uses a **`servers`** key:

```json title=".vscode/mcp.json"
{
  "servers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

VS Code shows a **Start** button above the server entry when you open the file. To check it's running, open the Command Palette and run **MCP: List Running Servers** — `angular-cli` should be listed. In Copilot Chat, use **Agent** mode so it can call tools.

### Cursor

Create `.cursor/mcp.json` in the project root (or `~/.cursor/mcp.json` for all projects):

```json title=".cursor/mcp.json"
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### Claude Code

Claude Code reads project servers from `.mcp.json` in the project root:

```json title=".mcp.json"
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

Or add it from the terminal (`--scope project` writes the `.mcp.json` above so your team shares it):

```bash
claude mcp add --transport stdio --scope project angular-cli -- npx -y @angular/cli mcp
```

Run `/mcp` inside Claude Code to confirm the server is connected.

### Gemini CLI

Create `.gemini/settings.json` in the project:

```json title=".gemini/settings.json"
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### JetBrains IDEs (WebStorm, IntelliJ IDEA…)

Open **Settings | Tools | AI Assistant | Model Context Protocol (MCP)**, click **Add**, choose the JSON option and paste:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### OpenAI Codex

Codex uses TOML. Add this to `.codex/config.toml` in the project (or to your global `~/.codex/config.toml`):

```toml title=".codex/config.toml"
[mcp_servers.angular-cli]
command = "npx"
args = ["-y", "@angular/cli", "mcp"]
```

### Antigravity

Create `.antigravity/mcp.json` in the project root:

```json title=".antigravity/mcp.json"
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

## Available tools (Angular 22.2)

Every tool below is enabled by default.

| Tool | What it does | Changes files / runs code? | Needs internet? |
| --- | --- | --- | --- |
| `list_projects` | Reads `angular.json` files to list workspaces, applications and libraries, their builders, test framework and paths. Agents are told to call this **first**. | No | No |
| `get_best_practices` | Returns the Angular best-practices guide. Given a workspace path, it loads the guide shipped with **that project's installed `@angular/core`**, so advice matches your version. | No | No |
| `search_documentation` | Searches the official Angular documentation (angular.dev) and returns the best matches. | No | **Yes** |
| `ai_tutor` | Loads the Angular AI Tutor curriculum and persona, turning the assistant into an interactive tutor. | No | No |
| `onpush_zoneless_migration` | Analyzes a file or directory and returns the **next single step** to migrate to `OnPush` change detection / zoneless. Call repeatedly until done. | No (the agent applies the step) | No |
| `run_target` | Runs a configured target such as `build`, `test`, `lint` or `e2e` (tests run headless, no watch). | **Yes** | No |
| `devserver_start` | Starts `ng serve` in the background and returns immediately. | **Yes** | No |
| `devserver_wait_for_build` | Waits for the current dev-server build and returns its logs (errors included). The agent calls it after each edit. | No | No |
| `devserver_stop` | Stops the dev server and returns the full log. | **Yes** | No |

The server also exposes the best-practices guide as an MCP **resource** (`instructions://best-practices`) for hosts that support resources.

:::note[Older CLI versions]
The tool list has changed between releases. Earlier CLI versions (v20–v21) included tools such as `find_examples` and `modernize` that are not part of the 22.2 server. If your assistant mentions a tool that doesn't exist, check your CLI version with `ng version`.
:::

## Command options

Add options to the end of the `args` array.

| Option | Effect |
| --- | --- |
| `--read-only` | Registers only tools that don't modify the project or run commands (drops `run_target` and `devserver_start`/`devserver_stop`). Good for "review only" agents. |
| `--local-only` | Registers only tools that work offline (drops `search_documentation`). |
| `--root <path>` | (22.2) Directory the server may read and search. Repeat it for several roots. |

```json
"args": ["-y", "@angular/cli", "mcp", "--read-only"]
```

```json
"args": ["-y", "@angular/cli", "mcp", "--root", "/home/me/work/shop", "--root", "/home/me/work/admin"]
```

**How file access is limited:** the server only touches files inside its allowed roots. By default that's the folder the host started it in. `--root` replaces that default. If your host shares its workspace folders with the server (the MCP "roots" feature, supported by VS Code and others), those folders are used instead. Paths outside the roots are rejected with "Access denied".

:::note[Experimental tools]
The server also has a hidden `--experimental-tool` (`-E`) option for switching on experimental tools when a CLI release includes some. In 22.2 every tool is stable and enabled by default, so you don't need it.
:::

## How agents use the tools: three workflows

### 1. Build a feature with tests

1. `list_projects` → find the project, its test runner (Vitest by default in new projects) and paths.
2. `get_best_practices` → load the rules for your Angular version.
3. `search_documentation` → look up an API it isn't sure about (for example `@defer` triggers).
4. `devserver_start`, then edit code and call `devserver_wait_for_build` after each change to catch compile errors.
5. Write a spec and run it with `run_target` (`target: "test"`).
6. `devserver_stop` when finished.

Example prompt:

```text
Using the angular-cli MCP tools, add a "favorites" page to the shop app.
Follow get_best_practices for this workspace, keep the dev server running
and fix any build errors, then add Vitest tests and run them.
```

### 2. Migrate to OnPush / zoneless

1. `list_projects` to find the project.
2. Run any prerequisite schematics (for example signal inputs/queries migrations).
3. `onpush_zoneless_migration` with the absolute path of a component or folder → returns one actionable change.
4. Apply it, run tests with `run_target`, and call `onpush_zoneless_migration` again until it reports completion.

Since v22, components are OnPush by default, and this tool also understands `ChangeDetectionStrategy.Eager`. See [Zoneless](/modern/zoneless/).

### 3. Learn Angular with the AI tutor

Ask "launch the Angular AI tutor" in a new project. The agent calls `ai_tutor`, then guides you through building a "Smart Recipe Box" app, checking your files after each exercise. More in [AI Config, Rules & Skills](/ai/ai-config-and-skills/#the-angular-ai-tutor).

## Security tips

- MCP tools run **on your machine with your permissions**. Only add servers you trust.
- `run_target` and the dev-server tools execute your project's build/test/serve targets. Use `--read-only` for agents that should only read and advise.
- Use `--root` (or your host's workspace roots) so the server only sees the project folders it needs.
- Review what the agent changed before committing — the tools help it verify its work, but you're still the reviewer.

## Combine MCP with rules and skills

The MCP server gives the agent **actions** (search, build, test). A rules file and **agent skills** give it **knowledge** of how you want code written. Together they produce the best results — see [AI Config, Rules & Skills](/ai/ai-config-and-skills/).

## Key takeaways

- Configure your host to run `npx -y @angular/cli mcp`; `ng generate ai-config` can write the config for you.
- VS Code uses a `servers` key; Cursor, Claude Code, Gemini CLI, JetBrains and Antigravity use `mcpServers`; Codex uses TOML `[mcp_servers.angular-cli]`.
- 22.2 ships nine tools: `list_projects`, `get_best_practices`, `search_documentation`, `ai_tutor`, `onpush_zoneless_migration`, `run_target` and three `devserver_*` tools.
- `--read-only`, `--local-only` and `--root` limit what the server can do and see.

## Next steps

- Generate rules files and install skills: [AI Config, Rules & Skills](/ai/ai-config-and-skills/)
- Learn to prompt and review effectively: [Prompting Best Practices](/ai/prompting-best-practices/)
- Let agents inspect your running app: [AI Runtime Debugging](/ai/ai-debugging/)
