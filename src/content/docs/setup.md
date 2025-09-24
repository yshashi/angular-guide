---
title: Development Environment
description: Complete setup guide for Angular development with latest tools and best practices
sidebar:
  order: 3
---

# Development Environment Setup 🛠️

Let's set up your development environment to build modern Angular applications with the latest features, tools, and best practices. This guide ensures you have everything needed for our comprehensive Angular tutorial.

## 🚀 Quick Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Angular CLI installed globally
- [ ] Code editor with Angular extensions
- [ ] Git configured
- [ ] Browser with Angular DevTools

## 📦 Required Software

### Node.js (Version 18+)

Angular requires Node.js for development. Install the latest LTS version:

```bash
# Check your Node.js version
node --version

# Should output v18.0.0 or higher
```

**Installation:**
- **Windows/Mac**: Download from [nodejs.org](https://nodejs.org/)
- **Linux**: Use your package manager or Node Version Manager (nvm)

### Angular CLI (Latest Version)

The Angular CLI is essential for creating and managing Angular projects:

```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Check version
ng version

# Should show Angular CLI 17+ for latest features
```

### Package Manager

Choose your preferred package manager:

```bash
# npm (comes with Node.js)
npm --version

# Or yarn (optional)
npm install -g yarn
yarn --version

# Or pnpm (fastest)
npm install -g pnpm
pnpm --version
```

## 🎨 Code Editor Setup

### Visual Studio Code (Recommended)

Download from [code.visualstudio.com](https://code.visualstudio.com/)

**Essential Extensions:**
```json
{
  "recommendations": [
    "angular.ng-template",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

**VS Code Settings for Angular:**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.suggest.autoImports": true,
  "angular.experimental-ivy": true
}
```

### Alternative Editors

- **WebStorm**: Full-featured IDE with excellent Angular support
- **Sublime Text**: Lightweight with Angular packages
- **Vim/Neovim**: With coc-angular or similar plugins

## 🌐 Browser Setup

### Chrome/Edge (Recommended)

Install Angular DevTools extension:
- [Chrome Web Store](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)

### Firefox

- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)

## 🔧 Development Tools

### Git Configuration

```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### Terminal Setup

**Windows:**
- Windows Terminal (recommended)
- PowerShell 7+
- Git Bash

**Mac:**
- iTerm2 (recommended)
- Built-in Terminal
- Oh My Zsh for enhanced experience

**Linux:**
- Your distribution's default terminal
- Terminator or Tilix for advanced features

## 🧪 Verify Installation

Let's create a test project to verify everything works:

```bash
# Create a new Angular project
ng new angular-test-app --routing=true --style=scss --package-manager=npm

# Navigate to the project
cd angular-test-app

# Start the development server
ng serve

# Open browser to http://localhost:4200
```

You should see the Angular welcome page! 🎉

## ⚙️ Optional Enhancements

### Angular Schematics

Install useful schematics for faster development:

```bash
# Angular Material
ng add @angular/material

# PWA support
ng add @angular/pwa

# Angular Elements
ng add @angular/elements
```

### Global Packages

Useful global packages for Angular development:

```bash
# Angular DevKit
npm install -g @angular-devkit/schematics-cli

# TypeScript compiler
npm install -g typescript

# Prettier for code formatting
npm install -g prettier

# ESLint for code quality
npm install -g eslint
```

### Performance Tools

```bash
# Bundle analyzer
npm install -g webpack-bundle-analyzer

# Lighthouse CLI
npm install -g lighthouse

# Angular CLI analytics (optional)
ng analytics on
```

## 🔍 Troubleshooting

### Common Issues

**Node.js version conflicts:**
```bash
# Use Node Version Manager (nvm)
nvm install 18
nvm use 18
```

**Angular CLI installation issues:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@latest
```

**Permission errors (Mac/Linux):**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Verification Commands

```bash
# Check all versions
node --version
npm --version
ng version
git --version

# Test Angular CLI
ng help
ng new --help
```

## 📱 Mobile Development (Optional)

For mobile app development with Ionic:

```bash
# Install Ionic CLI
npm install -g @ionic/cli

# Verify installation
ionic --version
```

## 🐳 Docker Setup (Optional)

For containerized development:

```dockerfile
# Dockerfile for Angular development
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0"]
```

## ✅ Setup Complete!

Congratulations! Your development environment is now ready for modern Angular development with all the latest tools and best practices.

## 🎯 What's Next?

Now that your environment is ready, choose your learning path:

### For Complete Beginners
1. **[Learning Path Guide](/learning-path/)** - Plan your 20-week journey
2. **[What is Angular?](/beginner/what-is-angular/)** - Start with Angular fundamentals
3. **[Angular Architecture](/beginner/architecture/)** - Understand how Angular works

### For Experienced Developers
1. **[Learning Path Guide](/learning-path/)** - Choose your focus areas
2. **[Modern Angular Features](/modern/standalone-components/)** - Jump to latest features
3. **[Advanced Topics](/advanced/custom-directives/)** - Deep dive into complex patterns

### Quick Start Options
- **Build Your First App**: Follow our [First App Tutorial](/beginner/first-app/)
- **Explore Modern Features**: Try [Standalone Components](/modern/standalone-components/)
- **See Real Examples**: Check out our [Project Gallery](/projects/)

## 🆘 Need Help?

If you encounter any setup issues:

- **Common Problems**: Check our [troubleshooting section](#-troubleshooting) above
- **Community Support**: Join our [Discord community](https://discord.gg/angular-learners)
- **GitHub Issues**: Report problems in our [repository](https://github.com/complete-angular-guide)
- **Documentation**: Visit [Angular.dev](https://angular.dev/) for official docs

---

**Ready to become an Angular expert?** Let's start your journey with the [Learning Path Guide](/learning-path/) to plan your route to mastery! 🚀
