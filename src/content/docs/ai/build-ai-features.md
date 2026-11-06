---
title: Build AI Features 🧠
description: Add LLM-powered features to Angular 22 apps safely — server endpoints, streaming responses with resource and signals, a chat UI, structured output, Genkit and Firebase AI Logic.
sidebar:
  order: 2
---

This page shows how to put a large language model (LLM) behind a feature in your Angular app — and how to do it **securely**, with a **responsive streaming UI** built from signals. The code is provider-agnostic in spirit: the examples use Google's Gemini API through the `@google/genai` SDK, but the same architecture works with OpenAI, Anthropic, Mistral, a self-hosted model, or a framework like Genkit or the Vercel AI SDK.

## What you'll learn

- Which architecture to pick (server endpoint, Genkit, Firebase AI Logic) and why API keys never go in the browser
- How to build an end-to-end example: an Angular SSR `server.ts` endpoint that streams model output, plus a component that renders it live
- How to stream into the UI with `resource({ stream })`
- How to build a chat UI with history, a Stop button and error handling
- How to get typed JSON back (structured output) and validate it with `httpResource`
- Design patterns for slow, non-deterministic AI responses

## Step 1: Choose an architecture

Model providers authenticate with a **secret API key**. Whoever has the key can spend your money. So the first decision is _where the model call happens_.

| Option | Where the model is called | Good for | Key safety |
| --- | --- | --- | --- |
| **Your own server endpoint** (Angular SSR `server.ts`, Express, Cloud Run, Cloud Functions…) | Server | Any provider, full control, extra logic (auth, rate limits, RAG) | Key in env var / secret manager ✅ |
| **Genkit flows** | Server (Node) | Multi-provider apps, tool calling, flows you can test and trace | Key in env var ✅ |
| **Firebase AI Logic** (`firebase/ai`) | Browser, via Firebase's proxy | Client-only apps, quick prototypes, mobile + web | No model key in the app; protect with **App Check** ✅ |
| Calling the provider directly from Angular with a key | Browser | Nothing — don't | Key is public ❌ |

:::danger[Never put a model API key in Angular code]
`environment.ts`, `environment.prod.ts`, `app.config.ts`, a JSON file in `public/` — all of it ends up in the browser bundle. Keep secrets in **environment variables** or a **secret manager** on the server (for example Firebase App Hosting secrets, Google Secret Manager, or your platform's secret settings), and add `.env` files to `.gitignore`.
:::

If you already use [Angular SSR](/ssr/introduction/), you already have a Node server (`src/server.ts`), so a server endpoint is the easiest start. That's what we build next.

## Step 2: End-to-end example — streaming answers

We'll build an "Ask the AI" box. The browser posts a prompt to `/api/generate`; the server calls the model and **streams** plain text back; the component shows the text as it arrives.

```text
Browser (Angular)                 Your server (server.ts)            Model provider
AskAi component  ── POST /api/generate ──▶  validates input  ── SDK call (secret key) ──▶  LLM
   ▲  resource({stream})   ◀── text chunks ──  res.write(chunk)  ◀── token stream ──────────┘
```

### 2a. Create the project

```bash
ng new my-ai-app --ssr
cd my-ai-app
npm install @google/genai
```

`--ssr` adds `src/server.ts` (an Express app using `AngularNodeAppEngine`). The Angular CLI dev server also runs this file, so your API routes work with plain `ng serve`.

### 2b. Add the server endpoint

Add the API route **before** the catch-all handler that renders Angular. Here is the complete `server.ts` (the parts the CLI generated are unchanged):

```ts title="src/server.ts"
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// 🔐 The key lives only on the server (env var / secret manager). It never reaches the browser.
const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] });
const MODEL = process.env['GEMINI_MODEL'] ?? 'gemini-3.8-flash';

app.use('/api', express.json({ limit: '50kb' }));

/** POST /api/generate  { prompt: string }  →  streamed plain text */
app.post('/api/generate', async (req, res) => {
  const prompt: unknown = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
    res.status(400).send('Please send a prompt of up to 4000 characters.');
    return;
  }

  // Stop paying for tokens if the browser goes away (tab closed, new prompt, Stop button).
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a friendly Angular tutor. Answer in plain text, briefly.',
        abortSignal: controller.signal,
      },
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    for await (const chunk of stream) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    console.error('AI request failed:', error); // log details on the server only
    if (res.headersSent) res.end();
    else res.status(502).send('The AI service is unavailable. Please try again.');
  }
});

app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
```

What matters here:

- **The key comes from `process.env`**, never from Angular code.
- **Validate input** (type and size). The endpoint is public — anyone can call it, not only your UI.
- **Stream** with `generateContentStream` and `res.write()`; the browser receives text as soon as the model produces it.
- **Abort** the model call when the client disconnects, so cancelled requests stop costing tokens.
- **Hide internal errors** from users; log them on the server.

:::note[About the model name]
Model names change often. `gemini-3.8-flash` is the example used by the current `@google/genai` README; reading it from `GEMINI_MODEL` lets you switch models without a code change. Check your provider's model list for current names.
:::

Run it with the key in your environment (never commit it):

```bash
# development
GEMINI_API_KEY=your-key-here ng serve

# production build + run
ng build
GEMINI_API_KEY=your-key-here node dist/my-ai-app/server/server.mjs
```

:::tip[Swapping providers]
Only the server changes when you switch providers. For example, with the Vercel AI SDK (`ai` + `@ai-sdk/google`, or the OpenAI/Anthropic provider packages) the loop becomes `for await (const text of streamText({ model, prompt }).textStream) res.write(text);`. The Angular side stays exactly the same because it only reads plain text.
:::

### 2c. A tiny helper to read streamed text in the browser

`fetch()` gives you `response.body`, a `ReadableStream` of bytes. This helper decodes it into text chunks:

```ts title="src/app/ai/read-text-stream.ts"
/** Reads a streamed text response and calls `onChunk` for every piece of text. */
export async function readTextStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  const rest = decoder.decode(); // flush any half-received character
  if (rest) onChunk(rest);
}
```

:::note[Why `fetch` and not `HttpClient`?]
`HttpClient` delivers a response body only when it is complete. For token-by-token streaming, use `fetch()` (or an SDK client such as Genkit's `streamFlow`). For normal, non-streamed JSON calls, `HttpClient` / `httpResource` is still the best choice — see [structured output](#step-4-structured-output-typed-json) below.
:::

### 2d. The component: `resource` with a `stream` loader

A `resource` normally uses a `loader` that resolves **once**. With `stream`, the loader returns a **signal** that you keep updating — ideal for AI responses. Each update is a `ResourceStreamItem<T>`: either `{ value }` or `{ error }`.

```ts title="src/app/ask-ai/ask-ai.ts"
import { Component, ResourceStreamItem, resource, signal } from '@angular/core';
import { readTextStream } from '../ai/read-text-stream';

interface Answer {
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-ask-ai',
  template: `
    <form (submit)="ask($event)">
      <label for="prompt">Ask anything</label>
      <textarea id="prompt" #box [value]="draft()" (input)="draft.set(box.value)"></textarea>
      <button type="submit" [disabled]="!draft().trim()">Ask</button>
    </form>

    @if (answer.isLoading()) {
      <p>Thinking…</p>
    } @else if (answer.error()) {
      <p role="alert">
        Something went wrong.
        <button type="button" (click)="answer.reload()">Try again</button>
      </p>
    } @else if (answer.hasValue()) {
      <p class="answer" [attr.aria-busy]="!answer.value().done">
        {{ answer.value().text }}
        @if (!answer.value().done) {
          <span class="cursor">▍</span>
        }
      </p>
    }
  `,
})
export class AskAi {
  /** What the user is typing (changes on every keystroke). */
  protected readonly draft = signal('');
  /** What the user actually submitted (only changes on submit). */
  private readonly prompt = signal<string | undefined>(undefined);

  protected readonly answer = resource({
    // `undefined` keeps the resource idle (no request on page load or during SSR).
    params: () => this.prompt(),
    stream: async ({ params, abortSignal }) => {
      const result = signal<ResourceStreamItem<Answer>>({ value: { text: '', done: false } });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: params }),
        signal: abortSignal, // a new prompt cancels the old request
      });
      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      readTextStream(response.body, (chunk) =>
        result.update((prev) =>
          'value' in prev ? { value: { text: prev.value.text + chunk, done: false } } : prev,
        ),
      )
        .then(() =>
          result.update((prev) => ('value' in prev ? { value: { ...prev.value, done: true } } : prev)),
        )
        .catch((error: unknown) => {
          if (!abortSignal.aborted) {
            result.set({ error: error instanceof Error ? error : new Error(String(error)) });
          }
        });

      return result;
    },
  });

  protected ask(event: Event) {
    event.preventDefault();
    this.prompt.set(this.draft().trim());
  }
}
```

How it flows:

1. **Two signals.** `draft` changes on every keystroke; `prompt` changes only on submit. Because `params` reads `prompt`, the model is called **only when the user submits** — not on every key press.
2. **Idle until needed.** `prompt` starts as `undefined`, so the resource stays `idle` — nothing runs on page load or during server-side rendering.
3. **Loading → streaming.** `isLoading()` is `true` until the server starts responding. After the loader returns the `result` signal, the resource has a value, and every `result.update()` re-renders the text. We track `done` ourselves to show a typing cursor.
4. **Cancellation for free.** Submitting a new prompt changes `params`; Angular aborts the previous `abortSignal`, `fetch` cancels, and the server's `close` handler aborts the model call.
5. **Errors and retry.** A thrown error (or a `{ error }` item) puts the resource in the `error` state; `reload()` runs the same prompt again.

OnPush is the default for components since v22, and this works perfectly with it: every change flows through signals.

:::tip
`resource` and its `stream` option are stable in Angular 22. Read more about statuses, `reload()`, `set()` and `hasValue()` in [Resource API](/modern/resource-api/).
:::

## Step 3: A chat UI with history

A chat is different from a one-shot question: you keep a **history**, append the user's message, then fill an assistant bubble while tokens arrive. Plain signals in a service are the clearest way to model that.

The server endpoint receives the whole history (models are stateless — you send the conversation every time):

```ts title="src/server.ts (add next to /api/generate)"
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

function isChatHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 50 &&
    value.every(
      (m) =>
        (m?.role === 'user' || m?.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.length <= 4000,
    )
  );
}

/** POST /api/chat  { messages: ChatMessage[] }  →  streamed plain text */
app.post('/api/chat', async (req, res) => {
  const messages: unknown = req.body?.messages;
  if (!isChatHistory(messages)) {
    res.status(400).send('Invalid chat history.');
    return;
  }

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: {
        systemInstruction: 'You help developers with Angular 22. Prefer signals and standalone APIs.',
        abortSignal: controller.signal,
      },
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    for await (const chunk of stream) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    console.error('Chat request failed:', error);
    if (res.headersSent) res.end();
    else res.status(502).send('The AI service is unavailable.');
  }
});
```

The client keeps the conversation in a service:

```ts title="src/app/chat/chat.ts"
import { Service, computed, signal } from '@angular/core';
import { readTextStream } from '../ai/read-text-stream';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Service()
export class Chat {
  private readonly _messages = signal<ChatMessage[]>([]);
  readonly messages = this._messages.asReadonly();
  readonly status = signal<'idle' | 'streaming' | 'error'>('idle');
  readonly isStreaming = computed(() => this.status() === 'streaming');

  private controller: AbortController | undefined;

  async send(text: string): Promise<void> {
    this.controller?.abort();
    const controller = (this.controller = new AbortController());

    const history: ChatMessage[] = [...this._messages(), { role: 'user', text }];
    // Show the user's message plus an empty bubble that we fill while streaming.
    this._messages.set([...history, { role: 'model', text: '' }]);
    this.status.set('streaming');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }
      await readTextStream(response.body, (chunk) => this.appendToLastMessage(chunk));
      this.status.set('idle');
    } catch {
      if (!controller.signal.aborted) this.status.set('error');
    }
  }

  stop(): void {
    this.controller?.abort();
    this.status.set('idle');
  }

  private appendToLastMessage(chunk: string): void {
    this._messages.update((messages) =>
      messages.map((m, i) => (i === messages.length - 1 ? { ...m, text: m.text + chunk } : m)),
    );
  }
}
```

`@Service()` (new in v22) makes `Chat` an app-wide singleton, like `@Injectable({ providedIn: 'root' })`. The component is just a view over those signals:

```ts title="src/app/chat/chat-window.ts"
import { Component, inject, signal } from '@angular/core';
import { Chat } from './chat';

@Component({
  selector: 'app-chat',
  template: `
    <ol class="messages" aria-live="polite">
      @for (message of chat.messages(); track $index) {
        <li [class.from-user]="message.role === 'user'">{{ message.text }}</li>
      } @empty {
        <li class="hint">Ask me anything about Angular.</li>
      }
    </ol>

    @if (chat.status() === 'error') {
      <p role="alert">The assistant is unavailable right now. Please try again.</p>
    }

    <form (submit)="send($event)">
      <input #box aria-label="Message" [value]="draft()" (input)="draft.set(box.value)" />
      @if (chat.isStreaming()) {
        <button type="button" (click)="chat.stop()">Stop</button>
      } @else {
        <button type="submit" [disabled]="!draft().trim()">Send</button>
      }
    </form>
  `,
})
export class ChatWindow {
  protected readonly chat = inject(Chat);
  protected readonly draft = signal('');

  protected send(event: Event) {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text) return;
    this.draft.set('');
    void this.chat.send(text);
  }
}
```

:::caution[Rendering model output safely]
Interpolation (`{{ message.text }}`) is always safe: Angular escapes it. If you render the model's **Markdown as HTML**, convert it with a Markdown library and still let Angular's sanitizer handle `[innerHTML]` — never call `bypassSecurityTrustHtml()` on model output. Treat AI text like any other untrusted user input.
:::

:::tip[resource or plain signals?]
Use `resource({ stream })` when the AI output is **derived from inputs** (a prompt, a selected document) and should restart when they change. Use **plain signals in a service** for a **conversation**, where each send appends to history.
:::

## Step 4: Structured output (typed JSON)

Often you don't want prose — you want data you can render: a recipe, a list of tags, a form pre-fill. Most providers support **structured output**: you send a JSON Schema and the model replies with matching JSON.

Server side with `@google/genai`:

```ts title="src/server.ts (add next to the other routes)"
/** POST /api/recipe  { dish: string }  →  JSON that matches a schema */
app.post('/api/recipe', async (req, res) => {
  const dish: unknown = req.body?.dish;
  if (typeof dish !== 'string' || !dish.trim() || dish.length > 100) {
    res.status(400).json({ error: 'Please send a dish name.' });
    return;
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Suggest a simple recipe for: ${dish}`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          minutes: { type: 'number' },
          ingredients: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'minutes', 'ingredients'],
      },
    },
  });

  res.type('application/json').send(response.text ?? '{}');
});
```

On the client, a normal JSON response means you can use `httpResource` (it needs `provideHttpClient()` in your app config). Still **validate** the shape with `parse` — models can and do return surprises:

```ts title="src/app/recipe-idea/recipe-idea.ts"
import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

export interface Recipe {
  title: string;
  minutes: number;
  ingredients: string[];
}

/** Never trust model output blindly: check the shape before using it. */
function parseRecipe(raw: unknown): Recipe {
  const r = raw as Partial<Recipe> | null;
  if (
    !r ||
    typeof r.title !== 'string' ||
    typeof r.minutes !== 'number' ||
    !Array.isArray(r.ingredients) ||
    !r.ingredients.every((i) => typeof i === 'string')
  ) {
    throw new Error('The AI returned an unexpected format.');
  }
  return { title: r.title, minutes: r.minutes, ingredients: r.ingredients };
}

@Component({
  selector: 'app-recipe-idea',
  template: `
    <input #dish aria-label="Dish" placeholder="e.g. pancakes" />
    <button type="button" (click)="request.set(dish.value)">Suggest recipe</button>

    @if (recipe.isLoading()) {
      <p>Cooking up an idea…</p>
    } @else if (recipe.error()) {
      <p role="alert">Could not create a recipe. <button (click)="recipe.reload()">Retry</button></p>
    } @else if (recipe.hasValue()) {
      <h2>{{ recipe.value().title }} ({{ recipe.value().minutes }} min)</h2>
      <ul>
        @for (item of recipe.value().ingredients; track item) {
          <li>{{ item }}</li>
        }
      </ul>
    }
  `,
})
export class RecipeIdea {
  protected readonly request = signal<string | undefined>(undefined);

  protected readonly recipe = httpResource(
    () => {
      const dish = this.request()?.trim();
      return dish ? { url: '/api/recipe', method: 'POST', body: { dish } } : undefined;
    },
    { parse: parseRecipe },
  );
}
```

Returning `undefined` from the request function keeps `httpResource` idle until the user asks. For a schema library approach (Zod, Valibot…), call `schema.parse(raw)` inside `parse`. See [httpResource](/modern/http-resource-api/) for all options.

## Alternative: Genkit flows

[Genkit](https://genkit.dev) is an open-source, model-agnostic framework (Google, OpenAI, Anthropic, Ollama and more through plugins) for server-side AI logic: flows, tool calling, structured output, tracing and a local developer UI. It runs nicely inside Angular SSR's Express server.

```bash
npm install genkit @genkit-ai/google-genai @genkit-ai/express
```

```ts title="src/server.ts (excerpt)"
import express from 'express';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { expressHandler } from '@genkit-ai/express';

const app = express();

// Reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment.
const ai = genkit({ plugins: [googleAI()] });

export const explainFlow = ai.defineFlow(
  {
    name: 'explain',
    inputSchema: z.string().max(200),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (topic, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-3.8-flash'),
      prompt: `Explain "${topic}" to an Angular beginner in 3 short paragraphs.`,
    });
    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }
    return (await response).text;
  },
);

app.use(express.json());
app.post('/api/explain', expressHandler(explainFlow));
```

In Angular, Genkit's client helpers (`runFlow` and `streamFlow` from `genkit/beta/client`) call the flow. `streamFlow` returns an async iterable `stream`, which plugs straight into `resource({ stream })`:

```ts title="src/app/explain/explain.ts"
import { Component, ResourceStreamItem, resource, signal } from '@angular/core';
import { streamFlow } from 'genkit/beta/client';

@Component({
  selector: 'app-explain',
  template: `
    <button type="button" (click)="topic.set('signals')">Explain signals</button>
    @if (explanation.hasValue()) {
      <p>{{ explanation.value() }}</p>
    }
  `,
})
export class Explain {
  protected readonly topic = signal<string | undefined>(undefined);

  protected readonly explanation = resource({
    params: () => this.topic(),
    stream: async ({ params, abortSignal }) => {
      const text = signal<ResourceStreamItem<string>>({ value: '' });
      const result = streamFlow<string, string>({ url: '/api/explain', input: params, abortSignal });

      (async () => {
        try {
          for await (const chunk of result.stream) {
            text.update((prev) => ('value' in prev ? { value: prev.value + chunk } : prev));
          }
        } catch (error) {
          if (!abortSignal.aborted) text.set({ error: error as Error });
        }
      })();

      return text;
    },
  });
}
```

## Alternative: Firebase AI Logic (client-side)

If you don't want to run a server, **Firebase AI Logic** lets the browser call Gemini models through Firebase. There is no model API key in your app; Firebase holds it. To stop other websites from using your quota, enable **Firebase App Check** (reCAPTCHA Enterprise on the web) and turn on enforcement for AI Logic in the Firebase console.

```bash
npm install firebase
```

```ts title="src/app/ai/summarizer.ts"
import { Service, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { ReCaptchaEnterpriseProvider, initializeAppCheck } from 'firebase/app-check';
import { GoogleAIBackend, getAI, getGenerativeModel } from 'firebase/ai';

// Your Firebase web config (from the Firebase console). These values identify the project;
// they are not a model API key. App Check is what stops other sites from using your quota.
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_WEB_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  appId: 'YOUR_APP_ID',
};

const firebaseApp = initializeApp(firebaseConfig);

initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaEnterpriseProvider('YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY'),
  isTokenAutoRefreshEnabled: true,
});

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-3.8-flash' });

@Service()
export class Summarizer {
  readonly summary = signal('');

  async summarize(text: string): Promise<void> {
    this.summary.set('');
    const result = await model.generateContentStream(`Summarize in 3 bullet points:\n\n${text}`);
    for await (const chunk of result.stream) {
      this.summary.update((s) => s + chunk.text());
    }
  }
}
```

`GoogleAIBackend` uses the Gemini Developer API; use `new AgentPlatformBackend('us-central1')` instead for the Agent Platform Gemini API (formerly Vertex AI Gemini API). App Check still can't tell a real user from a scripted one using your real site, so add per-user limits (for example, require Firebase Auth) for anything expensive.

## Design patterns for AI features

AI calls are **slow**, **expensive** and **non-deterministic**. These patterns keep the UI pleasant and the bill predictable.

### Trigger on submit, not on every change

Keep the live input (`draft`) separate from the submitted value (`prompt`) and use only the submitted one in `params`, as in the `AskAi` example. Other signals you only _read_ inside the loader (like a `sessionId`) don't re-trigger the request.

### Accumulate results with `linkedSignal`

`linkedSignal` can see its previous value, which makes it handy for "append the new parts" patterns such as a story that grows, or keeping old content on screen while new content generates:

```ts
import { Component, linkedSignal, resource, signal } from '@angular/core';

@Component({
  selector: 'app-story',
  template: `@for (part of storyParts(); track $index) { <p>{{ part }}</p> }`,
})
export class Story {
  private readonly nextInput = signal<string | undefined>(undefined);

  private readonly storyResource = resource({
    params: () => this.nextInput(),
    defaultValue: [] as string[],
    loader: async ({ params, abortSignal }) => {
      const res = await fetch('/api/story', {
        method: 'POST',
        body: JSON.stringify({ input: params }),
        headers: { 'Content-Type': 'application/json' },
        signal: abortSignal,
      });
      return (await res.json()) as string[];
    },
  });

  protected readonly storyParts = linkedSignal<string[], string[]>({
    source: () => this.storyResource.value(),
    computation: (newParts, previous) => [...(previous?.value ?? []), ...newParts],
  });

  continueWith(input: string) {
    this.nextInput.set(input);
  }
}
```

More on this API in [Linked Signals](/modern/linked-signals/).

### Keep loading scoped

Put the `resource` in the component that shows the AI content. Only that part of the page re-renders while tokens stream. If several components need the same data, move it into a service.

### SSR: render the page, generate later

With SSR, render the page shell on the server and generate AI content **in the browser** after hydration (start resources with `undefined` params, trigger from a user action, or wrap the AI widget in `@defer`). An LLM call during server rendering would delay the whole page.

### Always plan for failure

- Show a clear loading state (`isLoading()`), an error state (`error()`) and a **Retry** button (`reload()`).
- Save the user's prompt so they don't have to retype it after an outage.
- Don't show raw provider errors to users; log them on the server.
- Lower the model's `temperature` when you need more predictable answers; use structured output when you need parseable answers.
- For important actions, keep a **human in the loop**: let the user confirm before the app acts on AI output.

### Tool calling (function calling)

To build agent-like features ("add these items to my cart"), give the model **tools**: functions your server declares with a name, description and JSON Schema. The model asks to call a tool; **your code decides** whether to run it and sends the result back. Expose only the operations you're comfortable letting a model trigger, and re-check permissions inside each tool. Genkit (`ai.defineTool`) and the provider SDKs all support this.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| API key in `environment.ts` | Move the call to a server endpoint; read the key from `process.env` or a secret manager |
| Calling the model on every keystroke | Use a separate "submitted" signal as `params` |
| Using `HttpClient` and wondering why text doesn't stream | Use `fetch` + a stream reader, or an SDK's streaming client |
| No input limits on the endpoint | Validate type and length; add auth and rate limiting for public apps |
| Binding model HTML with `bypassSecurityTrustHtml` | Use interpolation, or sanitized `[innerHTML]` |
| Trusting JSON from the model | Validate with `parse` (or a schema library) before using it |
| Calling the LLM during SSR | Generate in the browser after hydration |

## Key takeaways

- Model calls with secret keys belong on the **server** — Angular SSR's `server.ts` is a ready-made place for them. Firebase AI Logic + App Check is the client-side alternative.
- Stream text with `res.write()` on the server and `fetch` + `resource({ stream })` in Angular.
- Use plain signals in a `@Service()` for chat history; use `httpResource` + `parse` for structured output.
- Design for slowness and failure: loading, error, retry, cancel, validation.

## Next steps

- Let your coding assistant help build these features: [Angular MCP Server](/ai/mcp-server/)
- Let browser agents use your app directly: [WebMCP Tools](/ai/webmcp/)
- Learn more about the APIs used here: [Resource API](/modern/resource-api/), [httpResource](/modern/http-resource-api/), [Angular SSR](/ssr/introduction/)
