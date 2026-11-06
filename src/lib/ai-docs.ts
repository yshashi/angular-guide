import { getCollection, type CollectionEntry } from 'astro:content';
import { sidebar } from '../sidebar.mjs';

export const SITE_URL = 'https://ng-guide.letsprogram.in';

type DocEntry = CollectionEntry<'docs'>;
type SidebarItem = { label: string; slug: string };
type SidebarGroup = { label: string; items: SidebarItem[] };

export interface DocSection {
	label: string;
	docs: DocEntry[];
}

/** Docs grouped and ordered exactly like the sidebar. Pages not in the sidebar are excluded. */
export async function getOrderedDocSections(): Promise<DocSection[]> {
	const docs = await getCollection('docs');
	const byId = new Map(docs.map((doc) => [doc.id, doc]));
	return (sidebar as SidebarGroup[]).map((group) => ({
		label: group.label,
		docs: group.items.map((item) => byId.get(item.slug)).filter((doc): doc is DocEntry => !!doc),
	}));
}

export function pageUrl(id: string): string {
	return id === 'index' ? `${SITE_URL}/` : `${SITE_URL}/${id}/`;
}

export function markdownUrl(id: string): string {
	return `${SITE_URL}/${id}.md`;
}

/** Strips MDX-only syntax (top-level imports/exports/JSX component tags) outside code fences. */
function stripMdx(body: string): string {
	const out: string[] = [];
	let inFence = false;
	for (const line of body.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
		if (!inFence && (/^(import|export)\s/.test(line) || /^\s*<\/?[A-Z][\w.]*(\s[^>]*)?\/?>\s*$/.test(line))) {
			continue;
		}
		out.push(line);
	}
	return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Starlight asides (`:::note[Title]`) become blockquotes, which every LLM and Markdown viewer understands. */
function convertAsides(body: string): string {
	const out: string[] = [];
	let inAside = false;
	let inFence = false;
	for (const line of body.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
		const open = !inFence && line.match(/^:::(note|tip|caution|danger)(?:\[(.+?)\])?\s*$/);
		if (open) {
			const label = open[2] ?? open[1].charAt(0).toUpperCase() + open[1].slice(1);
			out.push(`> **${label}**`, '>');
			inAside = true;
		} else if (!inFence && inAside && /^:::\s*$/.test(line)) {
			inAside = false;
		} else {
			out.push(inAside ? (line ? `> ${line}` : '>') : line);
		}
	}
	return out.join('\n');
}

export function toMarkdown(doc: DocEntry): string {
	const title = doc.data.title;
	const description = doc.data.description ? `\n\n> ${doc.data.description}` : '';
	const source = `\n\nSource: ${pageUrl(doc.id)}`;
	const raw = doc.body ?? '';
	const body = convertAsides(doc.filePath?.endsWith('.mdx') ? stripMdx(raw) : raw.trim());
	return `# ${title}${description}${source}\n\n${body}\n`;
}
