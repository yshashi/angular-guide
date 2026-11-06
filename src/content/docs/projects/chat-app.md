---
title: Real-time Chat App 💬
description: Build an Angular 22 chat interface with signals, optimistic messages, a typed API boundary, accessible controls and a mock reply service.
sidebar:
  order: 5
---

This tutorial builds a small chat UI with a mock reply service. It demonstrates message state, optimistic updates and a clean boundary for connecting a real WebSocket or hosted chat API later.

:::note[Scope]
The mock service below simulates replies locally; it is not a real multi-user chat server. A real-time production chat needs an authenticated backend, authorization checks, message persistence, rate limits and a WebSocket or server-sent event transport.
:::

## 1. Create a project

```bash
ng new ng-chat --routing --style=css
cd ng-chat
ng serve
```

Generate a feature component with `ng generate component chat/chat-room`, or use the root app component for this small demo.

## 2. Define messages and a mock service

```ts title="src/app/chat/chat.service.ts"
import { Service, signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  author: 'you' | 'assistant';
  text: string;
  createdAt: Date;
  pending?: boolean;
}

@Service()
export class ChatService {
  readonly messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      author: 'assistant',
      text: 'Hi! Send a message to try the chat.',
      createdAt: new Date(),
    },
  ]);
  readonly sending = signal(false);

  async send(text: string): Promise<void> {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      author: 'you',
      text,
      createdAt: new Date(),
      pending: true,
    };
    this.messages.update((messages) => [...messages, message]);
    this.sending.set(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      this.messages.update((messages) => [
        ...messages.map((item) => item.id === message.id ? { ...item, pending: false } : item),
        {
          id: crypto.randomUUID(),
          author: 'assistant',
          text: `You said: ${text}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      this.sending.set(false);
    }
  }
}
```

The service owns the message list so the component can stay focused on the form and presentation. In a real app, replace the simulated delay with a typed API or RxJS `webSocket()` stream and handle server acknowledgements, reconnects and duplicate messages.

## 3. Build the chat component

```ts title="src/app/chat/chat-room.ts"
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat-room',
  imports: [FormsModule],
  template: `
    <main class="chat">
      <h1>Angular Guide Chat</h1>
      <ol aria-label="Conversation" class="messages">
        @for (message of chat.messages(); track message.id) {
          <li [class.from-you]="message.author === 'you'">
            <p><strong>{{ message.author === 'you' ? 'You' : 'Assistant' }}</strong></p>
            <p>{{ message.text }}</p>
            @if (message.pending) { <span aria-label="Sending">Sending…</span> }
          </li>
        }
      </ol>
      <form (submit)="send($event)">
        <label for="message">Message</label>
        <textarea
          id="message"
          name="message"
          [value]="draft()"
          (input)="updateDraft($event)"
          maxlength="1000"
          required
        ></textarea>
        <button type="submit" [disabled]="!draft().trim() || chat.sending()">
          {{ chat.sending() ? 'Sending…' : 'Send' }}
        </button>
      </form>
    </main>
  `,
  styles: [`
    .chat { max-width: 42rem; margin: 2rem auto; padding: 1rem; }
    .messages { display: grid; gap: 1rem; padding: 0; list-style: none; }
    .messages li { max-width: 85%; padding: 0.75rem; border-radius: 0.75rem; background: #f1f1f5; }
    .messages li.from-you { justify-self: end; background: #fce4ec; }
    .messages p { margin: 0.25rem 0; }
    form { display: grid; gap: 0.5rem; }
    textarea { min-height: 5rem; }
  `],
})
export class ChatRoom {
  protected readonly chat = inject(ChatService);
  protected readonly draft = signal('');

  protected updateDraft(event: Event) {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async send(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text || this.chat.sending()) return;
    this.draft.set('');
    await this.chat.send(text);
  }
}
```

`track message.id` keeps list rendering stable. The native form, labelled text area, status text and disabled button provide a keyboard-friendly baseline.

## 4. Connect a real transport

For a real-time service, keep the same message model and replace `ChatService.send()` with an API call. A WebSocket connection can be wrapped with RxJS `webSocket()` and connected to signals using `toSignal()` or an explicit subscription managed with `takeUntilDestroyed()`.

The server must validate the user and message, authorize room access, limit payload sizes and apply rate limits. Never trust a client-supplied author ID.

## 5. Add tests

Test the service's optimistic update and completion behavior with Vitest. Use fake timers for the simulated delay, and test the component's visible conversation and disabled state separately. See [Testing Signals](/testing/testing-signals/) and [Mocking & Spies](/testing/mocking/).

## Next steps

- [Angular Signals](/modern/signals/)
- [RxJS Patterns in Angular](/rxjs/angular-patterns/)
- [Unit Testing with Vitest](/testing/unit-testing/)
