---
title: Prerequisites & Setup 📋
description: What you should know before learning Angular 22 — the HTML, CSS, JavaScript and TypeScript basics, plus a quick checklist to test your setup.
sidebar:
  order: 2
---

You don't need to be an expert to start learning Angular, but a few basics will make the journey
much smoother. This page lists exactly what to know, gives you a quick TypeScript crash course,
and helps you check that your computer is ready.

## What you'll learn

- Which HTML, CSS and JavaScript skills Angular builds on
- The TypeScript features you will see on almost every Angular page
- Which tools you need (and which versions)
- How to check that everything works before you start

## Must-have knowledge

### HTML & CSS

- Common elements (`div`, `section`, `button`, `form`, `input`, `ul`/`li`) and attributes
- Semantic HTML (`header`, `main`, `nav`, `footer`) and accessible labels
- CSS selectors, the box model, Flexbox and Grid
- Basic responsive design (media queries)

Sass/SCSS or Tailwind CSS are optional — Angular supports both, and plain CSS is perfectly fine.

### JavaScript (ES2015+)

You should be comfortable reading and writing code like this:

```ts
// const/let, arrow functions and template literals
const greet = (name: string) => `Hello, ${name}!`;

// Destructuring and spread
const user = { name: 'Ada', role: 'admin', active: true };
const { name, ...rest } = user;
const updated = { ...user, active: false };
const numbers = [1, 2, 3];
const more = [...numbers, 4];

// Array methods you will use all the time
const evens = more.filter((n) => n % 2 === 0);
const doubled = more.map((n) => n * 2);
const total = more.reduce((sum, n) => sum + n, 0);

// Optional chaining and nullish coalescing
const city = (user as { address?: { city?: string } }).address?.city ?? 'Unknown';

// Promises and async/await
async function loadUsers() {
  const response = await fetch('/api/users');
  return response.json();
}

// Modules
// export function formatPrice(value: number) { ... }
// import { formatPrice } from './format-price';
```

:::tip[Why immutability matters]
Angular's signals notice changes when you give them a **new** value. Spreading
(`{ ...user, active: false }`, `[...list, item]`) instead of mutating objects in place is a habit you
will use constantly.
:::

### TypeScript basics

Angular is written in TypeScript and every Angular project uses it. If you know JavaScript, you
already know most of TypeScript — it adds **types** on top. These are the features you'll see most:

```ts
// 1. Type annotations
let title: string = 'My app';
let count = 0; // inferred as number

// 2. Interfaces and type aliases describe the shape of data
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string; // optional property
}

// 3. Union types — a value can be one of several options
type Status = 'idle' | 'loading' | 'success' | 'error';
let status: Status = 'idle';

// 4. Generics — reusable types with a "type parameter"
const products: Array<Product> = [];
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// 5. Classes with access modifiers and readonly fields
class Cart {
  private readonly items: Product[] = [];

  add(product: Product): void {
    this.items.push(product);
  }

  protected get size(): number {
    return this.items.length;
  }
}
```

In Angular you will also see **decorators** such as `@Component()` and `@Service()`. A decorator is
just a function that attaches extra information (metadata) to a class. You don't need to write your
own — you only use the ones Angular provides.

:::note
New Angular 22 projects use **TypeScript 6.0** in **strict mode**, so the compiler catches mistakes
such as possibly-`undefined` values early. That can feel strict at first, but it prevents many
bugs. The [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) is a great
free reference.
:::

### The command line

You will run commands like `ng serve` and `npm install` in a terminal. Know how to:

- Open a terminal (VS Code has one built in: <kbd>Ctrl</kbd>+<kbd>`</kbd>)
- Move between folders with `cd` and list files with `ls` (or `dir` on Windows)
- Stop a running command with <kbd>Ctrl</kbd>+<kbd>C</kbd>

### How the web works (basics)

- What HTTP requests and responses are (`GET`, `POST`, `PUT`, `DELETE`, status codes)
- What JSON looks like
- What a REST API is

## Nice to have (we'll teach these)

You **don't** need these before you start — the guide covers them:

- Reactive programming and [RxJS](/rxjs/fundamentals/) Observables
- [Signals](/modern/signals/) and fine-grained reactivity
- Testing with [Vitest](/testing/unit-testing/)
- Git (helpful for saving your progress — `ng new` initialises a Git repository for you)

If you already know another framework (React, Vue, Svelte), many ideas transfer directly:
components, props (Angular **inputs**), events (Angular **outputs**), and reactive state (Angular
**signals**).

## Tools and versions

| Tool | Version for Angular 22 | Check with |
| --- | --- | --- |
| Node.js | `^22.22.3`, `^24.15.0` or `>=26.0.0` | `node --version` |
| npm (comes with Node.js) — or pnpm, Yarn, Bun | any recent version | `npm --version` |
| Angular CLI | 22.x | `ng version` |
| Code editor | VS Code, WebStorm, or any editor with the Angular Language Service | — |
| Browser | A current Chrome, Edge or Firefox + Angular DevTools | — |

:::caution[Node.js 20 is not supported]
Angular 22 dropped support for Node.js 20. If `node --version` prints `v20.x` (or an older
22.x/24.x release), upgrade first — see [Development Environment](/setup/).
:::

You don't need to install TypeScript globally — every Angular project includes its own TypeScript
version in `package.json`.

## Quick readiness check

### Knowledge checklist

- [ ] I can write a function with an arrow function and a template literal
- [ ] I can use `map`, `filter` and spread (`...`) on arrays and objects
- [ ] I understand `async`/`await` and what a Promise is
- [ ] I can read a TypeScript `interface` and a union type like `'a' | 'b'`
- [ ] I can build a simple page with HTML and style it with CSS

### Environment test

Once you have installed Node.js and the Angular CLI (see [Development Environment](/setup/)), run:

```bash
# Create a test project with all the defaults (no questions asked)
ng new angular-test --defaults

# Move into the project and start the dev server
cd angular-test
ng serve
```

Open `http://localhost:4200` in your browser. If you see the Angular welcome page, you are ready! 🎉
Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal to stop the server.

## Want to brush up first?

- [MDN: JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) — the
  best free JavaScript reference
- [javascript.info](https://javascript.info/) — a friendly, complete JavaScript tutorial
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — official TS docs
- [MDN: Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) —
  HTML, CSS and HTTP from scratch

## Key takeaways

- You need basic HTML, CSS and modern JavaScript; TypeScript basics you can learn as you go.
- Angular 22 needs **Node.js 22.22.3+, 24.15+ or 26** and uses **TypeScript 6.0** in strict mode.
- `ng new` + `ng serve` is the quickest way to check your setup.

## Next steps

Pick the path that matches your experience:

**New to Angular**

1. [Development Environment](/setup/) — install and configure your tools
2. [Learning Path Guide](/learning-path/) — plan your journey
3. [What is Angular?](/beginner/what-is-angular/) — start from the beginning

**Used another framework**

1. [Development Environment](/setup/)
2. [Angular Architecture](/beginner/architecture/) — see how the pieces fit together
3. [Your First App](/beginner/first-app/) — build something real

**Used an older Angular version**

1. [Standalone Components](/modern/standalone-components/) and [Signals](/modern/signals/)
2. [Control Flow](/modern/control-flow/) and [Signal Forms](/modern/signal-forms/)
3. [Version Upgrades](/migration/version-upgrade/) — bring existing apps up to Angular 22
