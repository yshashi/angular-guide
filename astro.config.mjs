// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://learn-angular.dev',
	integrations: [
		starlight({
			title: 'Complete Angular Guide',
			description: 'Master Angular from beginner to advanced - comprehensive guide covering all latest features including Angular 18, 19, and 20',
			// social: [
			// 	{ icon: 'github', label: 'GitHub', href: 'https://github.com/yshashi' }
			// ],
			sidebar: [
				{
					label: 'Getting Started',
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
						{ label: 'Linked Signals (v19)', slug: 'modern/linked-signals' },
						{ label: 'Resource API', slug: 'modern/resource-api' },
						{ label: 'Control Flow (@if, @for, @switch)', slug: 'modern/control-flow' },
						{ label: 'Zoneless Angular', slug: 'modern/zoneless' },
						{ label: 'New Template Syntax (@let)', slug: 'modern/template-syntax' },
						{ label: 'Incremental Hydration', slug: 'modern/incremental-hydration' },
						{ label: 'HttpResource API', slug: 'modern/http-resource-api' },
						{ label: 'Signal Forms (V21)', slug: 'modern/signal-forms' },
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
			],
		}),
	],
});
