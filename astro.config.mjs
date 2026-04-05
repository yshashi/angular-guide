// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://ng-guide.letsprogram.in',
	integrations: [
		sitemap(),
		starlight({
			title: 'NG Guide',
			description: 'Master Angular from beginner to advanced - comprehensive guide covering all latest features including Angular 19, 20, and 21',
			favicon: '/favicon.svg',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'NG Guide',
				replacesTitle: false,
			},
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: '',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'theme-color',
						content: '#dd0031',
					},
				},
				{
					tag: 'script',
					attrs: {
						defer: true,
						src: 'https://umami.letsprogram.in/script.js',
						'data-website-id': 'eb25091e-601c-4062-b04b-44aa2229d2bd',
					},
				},
			],
			customCss: [
				'./src/styles/custom.css',
			],
			expressiveCode: {
				themes: ['dracula', 'github-light'],
				styleOverrides: {
					borderRadius: '0.75rem',
					codePaddingBlock: '0.875rem',
					codePaddingInline: '1rem',
				},
			},
			// social: [
			// 	{ icon: 'github', label: 'GitHub', href: 'https://github.com/yshashi' }
			// ],
			sidebar: [
				{
					label: '🚀 Getting Started',
					items: [
						{ label: 'Welcome & Course Overview', slug: 'introduction' },
						{ label: 'Prerequisites & Setup', slug: 'prerequisites' },
						{ label: 'Development Environment', slug: 'setup' },
						{ label: 'Learning Path Guide', slug: 'learning-path' },
					],
				},
				{
					label: '🌱 Beginner Level',
					collapsed: false,
					items: [
						{ label: 'What is Angular?', slug: 'beginner/what-is-angular' },
						{ label: 'Angular Architecture', slug: 'beginner/architecture' },
						{ label: 'Your First App', slug: 'beginner/first-app' },
						{ label: 'Components Basics', slug: 'beginner/components' },
						{ label: 'Templates & Data Binding', slug: 'beginner/templates' },
						{ label: 'Directives', slug: 'beginner/directives' },
						{ label: 'Services & DI', slug: 'beginner/services' },
						{ label: 'Routing Basics', slug: 'beginner/routing' },
						{ label: 'Forms Introduction', slug: 'beginner/forms' },
						{ label: 'HTTP Client', slug: 'beginner/http' },
					],
				},
				{
					label: '🚀 Intermediate Level',
					collapsed: true,
					items: [
						{ label: 'Advanced Components', slug: 'intermediate/advanced-components' },
						{ label: 'Component Communication', slug: 'intermediate/component-communication' },
						{ label: 'Lifecycle Hooks', slug: 'intermediate/lifecycle-hooks' },
						{ label: 'Reactive Forms', slug: 'intermediate/reactive-forms' },
						{ label: 'Advanced Routing', slug: 'intermediate/advanced-routing' },
						{ label: 'RxJS & Observables', slug: 'intermediate/rxjs' },
						{ label: 'State Management', slug: 'intermediate/state-management' },
						{ label: 'Pipes & Custom Pipes', slug: 'intermediate/pipes' },
						{ label: 'Angular Material', slug: 'intermediate/material' },
						// { label: 'Testing Fundamentals', slug: 'intermediate/testing' },
					],
				},
				{
					label: '⚡ Modern Angular',
					collapsed: true,
					items: [
						{ label: 'Standalone Components', slug: 'modern/standalone-components' },
						{ label: 'Angular Signals', slug: 'modern/signals' },
						{ label: 'Computed Signals', slug: 'modern/computed-signals' },
						{ label: 'Effects API', slug: 'modern/effects' },
						{ label: 'Linked Signals', slug: 'modern/linked-signals' },
						{ label: 'Resource API', slug: 'modern/resource-api' },
						{ label: 'Control Flow (@if, @for, @switch)', slug: 'modern/control-flow' },
						{ label: 'Zoneless Angular', slug: 'modern/zoneless' },
						{ label: 'New Template Syntax (@let)', slug: 'modern/template-syntax' },
						{ label: 'Incremental Hydration', slug: 'modern/incremental-hydration' },
						{ label: 'HttpResource API', slug: 'modern/http-resource-api' },
						{ label: 'Signal Forms', slug: 'modern/signal-forms' },
					],
				},
				{
					label: '🏗️ Advanced Topics',
					collapsed: true,
					items: [
						{ label: 'Custom Directives', slug: 'advanced/custom-directives' },
						{ label: 'Dynamic Components', slug: 'advanced/dynamic-components' },
						{ label: 'Content Projection', slug: 'advanced/content-projection' },
						{ label: 'Advanced DI Patterns', slug: 'advanced/dependency-injection' },
						{ label: 'Custom Decorators', slug: 'advanced/decorators' },
						{ label: 'Angular Elements', slug: 'advanced/elements' },
						{ label: 'Micro Frontends', slug: 'advanced/micro-frontends' },
						{ label: 'Performance Optimization', slug: 'advanced/performance' },
						{ label: 'Memory Management', slug: 'advanced/memory-management' },
						{ label: 'Bundle Optimization', slug: 'advanced/bundle-optimization' },
					],
				},
				{
					label: '🔄 RxJS for Angular',
					collapsed: true,
					items: [
						{ label: 'RxJS Fundamentals', slug: 'rxjs/fundamentals' },
						{ label: 'Observables & Observers', slug: 'rxjs/observables' },
						{ label: 'Subjects & BehaviorSubject', slug: 'rxjs/subjects' },
						{ label: 'Operators - Transformation', slug: 'rxjs/transformation-operators' },
						{ label: 'Operators - Filtering', slug: 'rxjs/filtering-operators' },
						{ label: 'Operators - Combination', slug: 'rxjs/combination-operators' },
						{ label: 'Error Handling', slug: 'rxjs/error-handling' },
						{ label: 'Higher-Order Observables', slug: 'rxjs/higher-order-observables' },
						{ label: 'Schedulers & Testing', slug: 'rxjs/schedulers' },
						{ label: 'RxJS Patterns in Angular', slug: 'rxjs/angular-patterns' },
					],
				},
				{
					label: '🧪 Testing & Quality',
					collapsed: true,
					items: [
						{ label: 'Unit Testing Deep Dive', slug: 'testing/unit-testing' },
						{ label: 'Component Testing', slug: 'testing/component-testing' },
						{ label: 'Service Testing', slug: 'testing/service-testing' },
						{ label: 'Integration Testing', slug: 'testing/integration-testing' },
						{ label: 'E2E Testing with Playwright', slug: 'testing/e2e-testing' },
						{ label: 'Testing Signals', slug: 'testing/testing-signals' },
						{ label: 'Mocking & Spies', slug: 'testing/mocking' },
						{ label: 'Code Coverage', slug: 'testing/coverage' },
					],
				},
				{
					label: '🌐 Server-Side Rendering',
					collapsed: true,
					items: [
						{ label: 'SSR Introduction', slug: 'ssr/introduction' },
						// { label: 'Angular Universal', slug: 'ssr/universal' },
						{ label: 'Static Site Generation', slug: 'ssr/static-generation' },
						{ label: 'Hydration Strategies', slug: 'ssr/hydration' },
						// { label: 'SEO Optimization', slug: 'ssr/seo' },
					],
				},
				{
					label: '🚀 Deployment & Production',
					collapsed: true,
					items: [
						// { label: 'Build & Optimization', slug: 'deployment/build' },
						{ label: 'Deployment Strategies', slug: 'deployment/strategies' },
						{ label: 'Docker & Containers', slug: 'deployment/docker' },
						{ label: 'CI/CD Pipelines', slug: 'deployment/ci-cd' },
						// { label: 'Monitoring & Analytics', slug: 'deployment/monitoring' },
					],
				},
				{
					label: '💼 Projects',
					collapsed: true,
					items: [
						{ label: 'Todo App with Signals', slug: 'projects/todo-app' },
						{ label: 'Blog Platform - Part 1', slug: 'projects/blog' },
						{ label: 'Blog Platform - Part 2', slug: 'projects/blog-part2' },
						{ label: 'Blog Platform - Part 3', slug: 'projects/blog-part3' },
					],
				},
				{
					label: '🔄 Migration Guides',
					collapsed: true,
					items: [
						{ label: 'Version Upgrades', slug: 'migration/version-upgrade' },
						{ label: 'Standalone Migration', slug: 'migration/standalone' },
						{ label: 'Signals Migration', slug: 'migration/signals' },
						{ label: 'Modernization', slug: 'migration/modernization' },
					],
				},
				{
					label: '🛠️ Developer Tools',
					collapsed: true,
					items: [
						{ label: 'Angular CLI', slug: 'tools/angular-cli' },
						{ label: 'VS Code Setup', slug: 'tools/vscode' },
						{ label: 'Angular DevTools', slug: 'tools/devtools' },
						{ label: 'Debugging', slug: 'tools/debugging' },
						{ label: 'ESLint', slug: 'tools/eslint' },
						{ label: 'Prettier', slug: 'tools/prettier' },
						{ label: 'Schematics', slug: 'tools/schematics' },
						{ label: 'Git Hooks', slug: 'tools/git-hooks' },
					],
				},
				{
					label: '📚 Resources',
					collapsed: true,
					items: [
						{ label: 'Best Practices', slug: 'resources/best-practices' },
						{ label: 'Design Patterns', slug: 'resources/patterns' },
						{ label: 'Cheat Sheet', slug: 'resources/cheat-sheet' },
						{ label: 'Performance Checklist', slug: 'resources/performance-checklist' },
						{ label: 'Troubleshooting', slug: 'resources/troubleshooting' },
						{ label: 'Community', slug: 'resources/community' },
						{ label: 'Further Reading', slug: 'resources/further-reading' },
					],
				},
			],
		}),
	],
});
