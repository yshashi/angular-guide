import type { APIRoute } from 'astro';
import skill from '../../skills/ng-guide/SKILL.md?raw';

// AGENTS.md variant of the NG Guide skill (same rules, without the skill frontmatter).
export const GET: APIRoute = () => {
	const body = skill.replace(/^---[\s\S]*?---\s*/, '');
	const header = '<!-- NG Guide agent rules — https://ng-guide.letsprogram.in/ai/use-ng-guide-with-ai/ -->\n\n';
	return new Response(header + body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
