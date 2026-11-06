// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { sidebar } from './src/sidebar.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://ng-guide.letsprogram.in',
	integrations: [
		sitemap(),
		starlight({
			title: 'NG Guide',
			description: 'The one-stop Angular guide: learn Angular 22 from beginner to advanced with signals, Signal Forms, SSR, testing with Vitest, real projects and AI-assisted development.',
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
			components: {
				PageTitle: './src/components/PageTitle.astro',
				Footer: './src/components/Footer.astro',
			},
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
			sidebar,
		}),
	],
});
