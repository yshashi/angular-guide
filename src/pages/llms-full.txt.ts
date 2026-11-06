import type { APIRoute } from 'astro';
import { getOrderedDocSections, toMarkdown, SITE_URL } from '../lib/ai-docs';

export const GET: APIRoute = async () => {
	const sections = await getOrderedDocSections();
	const parts: string[] = [
		`# NG Guide — complete content\n\nThe one-stop Angular 22 guide. Source: ${SITE_URL}/\n`,
	];
	for (const section of sections) {
		for (const doc of section.docs) {
			parts.push(toMarkdown(doc));
		}
	}
	return new Response(parts.join('\n---\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
