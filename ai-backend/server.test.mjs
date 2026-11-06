import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

async function listen(server) {
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const address = server.address();
	assert.ok(address && typeof address !== 'string');
	return address.port;
}

async function close(server) {
	await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

test('page context grounds page-specific questions without replacing the question', { timeout: 15_000 }, async (t) => {
	const directory = await mkdtemp(join(tmpdir(), 'ng-guide-ai-test-'));
	const docsFile = join(directory, 'guide.txt');
	let backend;
	let provider;
	t.after(async () => {
		if (backend && backend.exitCode === null && backend.signalCode === null) {
			const exited = once(backend, 'exit');
			backend.kill('SIGTERM');
			await exited;
		}
		if (provider?.listening) await close(provider);
		await unlink(docsFile);
		await rmdir(directory);
	});

	const distractors = Array.from({ length: 8 }, (_, index) => `
---
# Routing Reference ${index}
Source: https://ng-guide.letsprogram.in/reference/routing-${index}/

## Routing Basics
Routing basics cover routing basics and routing basics. Learn Angular routing basics in this reference.
`).join('');
	await writeFile(
		docsFile,
		`# Welcome to NG Guide
Source: https://ng-guide.letsprogram.in/

## Overview
Welcome to the Angular guide. Start learning the foundations and follow the learning path.

---
# Routing Basics
Source: https://ng-guide.letsprogram.in/beginner/routing/

Angular routing maps URLs to components and provides navigation in a single-page application.

## Overview
Configure routes to connect URLs with components and enable navigation within the application.

---
# Angular Signals
Source: https://ng-guide.letsprogram.in/modern/signals/

## Overview
Angular signals hold reactive state. Read signals with a function call and update signal values.
${distractors}`,
	);

	const requests = [];
	provider = createServer(async (req, res) => {
		let body = '';
		for await (const chunk of req) body += chunk;
		requests.push(JSON.parse(body));
		res.writeHead(200, { 'Content-Type': 'text/event-stream' });
		res.end(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Test answer.' } }] })}\n\ndata: [DONE]\n\n`);
	});
	const providerPort = await listen(provider);
	backend = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
		env: {
			LLM_API_KEY: 'test-placeholder',
			LLM_MODEL: 'test-model',
			LLM_BASE_URL: `http://127.0.0.1:${providerPort}/v1`,
			DOCS_FILE: docsFile,
			PORT: '0',
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	let output = '';
	let errors = '';
	let backendPort;
	backend.stderr.setEncoding('utf8').on('data', (chunk) => (errors += chunk));
	await new Promise((resolve, reject) => {
		backend.once('error', reject);
		backend.once('exit', (code) => reject(new Error(`Backend exited (${code}): ${errors}`)));
		backend.stdout.setEncoding('utf8').on('data', (chunk) => {
			output += chunk;
			const match = output.match(/NG Guide Ask AI backend listening on http:\/\/localhost:(\d+)/);
			if (match) {
				backendPort = Number(match[1]);
				resolve();
			}
		});
	});
	assert.ok(backendPort > 0);

	async function ask(question, page) {
		const response = await fetch(`http://127.0.0.1:${backendPort}/ask`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ question, page, history: [] }),
		});
		assert.equal(response.status, 200);
		const events = (await response.text()).trim().split('\n').map((line) => JSON.parse(line));
		assert.deepEqual(events.map((event) => event.type), ['sources', 'delta', 'done']);
		return { sources: events[0].sources, request: requests.at(-1) };
	}

	const contextual = await ask('Explain this page in simple terms.', 'beginner/routing');
	assert.equal(contextual.sources[0].title, 'Routing Basics');
	assert.match(contextual.request.messages[0].content, /reader is viewing the NG Guide page "Routing Basics"/);
	assert.match(contextual.request.messages[0].content, /beginner\/routing\//);
	assert.match(contextual.request.messages[0].content, /Angular routing maps URLs to components/);
	assert.equal(contextual.request.messages.at(-1).content, 'Explain this page in simple terms.');

	const unrelated = await ask('What are Angular signals?', 'beginner/routing');
	assert.equal(unrelated.sources[0].title, 'Angular Signals');
	assert.match(unrelated.request.messages[0].content, /Answer unrelated questions on their own terms/);

	const home = await ask('Explain this page.', 'index');
	assert.equal(home.sources[0].title, 'Welcome to NG Guide');
	assert.match(home.request.messages[0].content, /reader is viewing the NG Guide page "Welcome to NG Guide"/);
});
