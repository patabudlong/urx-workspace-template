import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true
	},
	build: {
		rolldownOptions: {
			// SvelteKit guard plugins routinely dominate CPU time; suppress noisy timing report.
			checks: {
				pluginTimings: false
			}
		}
	},
	resolve: {
		alias: {
			// sveltekit-superforms/adapters re-exports Vine; stub it so the client build
			// never analyzes node:dns/promises from @vinejs/vine (Zod-only app).
			'@vinejs/vine': fileURLToPath(new URL('./src/lib/stubs/vinejs.ts', import.meta.url))
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Coolify / Nixpacks — Node server (see nixpacks.toml)
			adapter: adapter()
		})
	]
});
