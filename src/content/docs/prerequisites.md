---
title: Prerequisites & Setup 📋
description: Everything you need to know before starting your Angular learning journey
sidebar:
  order: 2
---

Before diving into Angular development, let's ensure you have the foundational knowledge and tools needed to get the most out of this comprehensive tutorial.

## 🎯 Required Knowledge

### JavaScript/TypeScript Fundamentals

You should be comfortable with:

**JavaScript ES6+ Features:**
- Arrow functions and function expressions
- Destructuring assignment
- Template literals
- Modules (import/export)
- Promises and async/await
- Classes and object-oriented programming

**TypeScript Basics:**
- Type annotations and interfaces
- Generics (basic understanding)
- Union types and optional properties
- Working with TypeScript in Angular projects

### Web Development Fundamentals

**HTML & CSS:**
- Semantic HTML elements and structure
- CSS selectors, flexbox, and grid
- Responsive design principles
- Basic understanding of SCSS/Sass (helpful)

**HTTP & Web APIs:**
- Understanding of REST APIs
- HTTP methods (GET, POST, PUT, DELETE)
- JSON data format
- Basic authentication concepts

### Angular Knowledge (Optional)

**If you're new to Angular, don't worry!** We'll teach you everything from scratch. However, if you have some experience:

**Helpful Angular Concepts:**
- **Components**: Basic component structure
- **Templates**: Data binding and event handling
- **Services**: Dependency injection basics
- **Modules**: NgModules (we'll transition to standalone)
- **CLI**: Angular CLI commands

**Advanced Concepts (We'll Cover These):**
- RxJS and Observables
- Reactive forms and validation
- Advanced routing patterns
- State management
- Testing strategies

## 🛠️ Development Environment

### Required Software

**Node.js (Version 18+)**
```bash
# Check your Node.js version
node --version

# Should output v18.0.0 or higher
```

**Angular CLI (Latest Version)**
```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Check version
ng version
```

**Code Editor**
We recommend **Visual Studio Code** with these extensions:
- Angular Language Service
- TypeScript Importer
- Prettier - Code formatter
- Auto Rename Tag
- Bracket Pair Colorizer

### Optional but Helpful

**Browser Extensions:**
- Angular DevTools (Chrome/Firefox)
- Redux DevTools (for state debugging)

**Online Development:**
- StackBlitz account (for running examples online)
- CodeSandbox account (alternative online IDE)

## 🧠 Conceptual Prerequisites

### Reactive Programming Basics

While not strictly required, understanding these concepts will help:

**State Management:**
- What is application state?
- The difference between local and global state
- Why state management matters in complex applications

**Reactive Programming:**
- The concept of "reactive" updates
- Push vs pull-based systems
- The observer pattern (basic understanding)

### Angular's Evolution

**Understanding Angular's Journey:**
- Why Angular introduced signals
- The relationship between RxJS and Signals
- The concept of "fine-grained reactivity"

## ✅ Knowledge Check

Before proceeding, assess your readiness:

### JavaScript/TypeScript Fundamentals
- [ ] Create and use arrow functions
- [ ] Destructure objects and arrays
- [ ] Use template literals for string interpolation
- [ ] Work with Promises and async/await
- [ ] Understand basic TypeScript types (optional)

### Web Development Basics
- [ ] Create HTML structure and forms
- [ ] Style elements with CSS
- [ ] Understand HTTP requests and responses
- [ ] Work with JSON data
- [ ] Basic understanding of web security

### Development Environment
- [ ] Have Node.js 18+ installed
- [ ] Have Angular CLI installed globally
- [ ] Can create a new Angular project
- [ ] Have a code editor with extensions
- [ ] Comfortable with terminal/command line

## 🚀 Quick Setup Test

Let's verify your environment is ready:

```bash
# Create a test Angular project
ng new angular-test --routing=true --style=scss --skip-git

# Navigate to the project
cd angular-test

# Serve the application
ng serve
```

If you can see the default Angular welcome page at `http://localhost:4200`, you're ready to go!

## 📚 Learning Resources

If you need to strengthen any prerequisites:

**JavaScript/TypeScript:**
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JavaScript.info](https://javascript.info/) - Comprehensive JS tutorial

**Web Development Fundamentals:**
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web) - HTML, CSS, HTTP
- [CSS-Tricks](https://css-tricks.com/) - CSS techniques and patterns
- [REST API Tutorial](https://restfulapi.net/) - Understanding REST APIs

**Angular Preparation:**
- [Angular Official Docs](https://angular.dev/) - Latest documentation
- [Angular Tutorial](https://angular.dev/tutorials/learn-angular) - Official tutorial
- [TypeScript for Angular](https://angular.dev/guide/typescript-configuration) - TS in Angular

## 🎯 Don't Meet All Prerequisites?

**No problem!** This course is designed to be inclusive:

### Complete Beginner Path
- **New to Programming?** Start with basic JavaScript tutorials first
- **New to Web Development?** Learn HTML/CSS basics, then return here
- **New to TypeScript?** We'll teach you TypeScript as we go

### Experienced Developer Path
- **Coming from React/Vue?** You'll pick up Angular concepts quickly
- **Backend Developer?** Focus on frontend concepts, we'll handle the rest
- **Experienced Angular?** Skip to [Modern Angular Features](/modern/standalone-components/)

### Learning Support
- **Struggling with concepts?** Each section includes additional resources
- **Need practice?** Every lesson has hands-on exercises
- **Want community help?** Join our Discord for real-time support

## 🚀 Ready to Start?

Choose your path based on your current level:

### Path 1: Complete Beginner
1. **[Development Environment Setup](/setup/)** - Get your tools ready
2. **[Learning Path Guide](/learning-path/)** - Plan your 20-week journey
3. **[What is Angular?](/beginner/what-is-angular/)** - Start from the beginning

### Path 2: Some Experience
1. **[Development Environment Setup](/setup/)** - Ensure you have the latest tools
2. **[Angular Architecture](/beginner/architecture/)** - Understand Angular's structure
3. **[Modern Angular Features](/modern/standalone-components/)** - Jump to latest features

### Path 3: Experienced Developer
1. **[Learning Path Guide](/learning-path/)** - Choose your focus areas
2. **[Modern Angular Features](/modern/standalone-components/)** - Latest Angular patterns
3. **[Advanced Topics](/advanced/custom-directives/)** - Deep dive into complex concepts

---

**Remember:** Learning is a journey, not a race. Take your time, practice consistently, and don't hesitate to ask for help when needed! 🌟
