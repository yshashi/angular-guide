import type { APIRoute } from 'astro';
import { getOrderedDocSections, markdownUrl, SITE_URL } from '../lib/ai-docs';

export const GET: APIRoute = async () => {
	const sections = await getOrderedDocSections();
	const lines: string[] = [
		'# NG Guide',
		'',
		'> The one-stop Angular guide. Learn Angular 22 (latest stable) from beginner to advanced: components, signals, Signal Forms, routing, HTTP, RxJS, testing with Vitest, SSR & hydration, deployment, real projects and AI-assisted development.',
		'',
		'All code follows modern Angular 22 conventions: standalone components (no `standalone: true`), OnPush by default, `@Service()` + `inject()`, `input()`/`output()`/`model()`, signals, native control flow (`@if`, `@for`, `@switch`), Signal Forms and Vitest.',
		'',
		`- Full content in one file: ${SITE_URL}/llms-full.txt`,
		`- Agent rules (AGENTS.md): ${SITE_URL}/AGENTS.md`,
		`- Agent skill: ${SITE_URL}/skills/ng-guide/SKILL.md`,
		'',
	];
	for (const section of sections) {
		lines.push(`## ${section.label.replace(/^\S+\s/, '')}`, '');
		for (const doc of section.docs) {
			const description = doc.data.description ? `: ${doc.data.description}` : '';
			lines.push(`- [${doc.data.title}](${markdownUrl(doc.id)})${description}`);
		}
		lines.push('');
	}
	return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
