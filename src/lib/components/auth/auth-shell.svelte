<script lang="ts">
	import AuthWorkspaceHeadline from '$lib/components/auth/auth-workspace-headline.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import { URIXOFT_SOCIAL } from '$lib/shared/site-meta';
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';

	const features = [
		'Business: Run your Workspace',
		'Email & SMS: Stay connected',
		'Schedule: Plan jobs & Visits',
		'Files: Docs in one place',
		'Jobs: Track every task',
		'Team: Clients and staff'
	];

	let { children }: { children: Snippet } = $props();

	const year = new Date().getFullYear();
</script>

<div class="grid h-svh overflow-hidden lg:grid-cols-2">
	<aside
		class="relative hidden h-svh overflow-hidden bg-[linear-gradient(155deg,color-mix(in_srgb,var(--primary)_32%,var(--brand-deep))_0%,color-mix(in_srgb,var(--primary)_55%,var(--brand-deep))_38%,var(--primary)_68%,color-mix(in_srgb,var(--secondary)_88%,var(--primary))_100%)] lg:flex lg:flex-col lg:p-10 xl:p-14"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,var(--primary)_70%,var(--brand-deep)),transparent_62%)]"
		></div>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_52%)]"
		></div>
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:3rem_3rem]"
		></div>

		<div class="relative z-10 flex flex-1 flex-col items-center justify-center py-8">
			<div class="w-full max-w-md space-y-10 text-left">
				<UrixoftLogo variant="white" class="size-12 shrink-0" />

				<div class="space-y-4">
					<AuthWorkspaceHeadline />
					<p class="text-base leading-relaxed text-primary-foreground/80 xl:text-lg">
						Manage Jobs, Clients, and your Team in one place.
					</p>
				</div>

				<ul class="space-y-3">
					{#each features as feature}
						<li class="flex items-start gap-3 text-sm text-primary-foreground/90">
							<span
								class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20"
							>
								<CheckIcon class="size-3" />
							</span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="relative z-10 flex shrink-0 items-center justify-between gap-6">
			<p class="text-sm text-primary-foreground/60">
				© {year} Urixoft Workspace. All rights reserved.
			</p>
			<div class="flex shrink-0 items-center gap-4">
				<a
					href={URIXOFT_SOCIAL.facebook}
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
					aria-label="Urixoft on Facebook"
				>
					<svg class="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97H15.83c-1.49 0-1.954.93-1.954 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
						/>
					</svg>
				</a>
				<a
					href={URIXOFT_SOCIAL.linkedin}
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
					aria-label="Urixoft on LinkedIn"
				>
					<svg class="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
						/>
					</svg>
				</a>
			</div>
		</div>
	</aside>

	<div class="bg-background flex h-svh min-h-0 flex-col overflow-y-auto">
		{@render children?.()}
	</div>
</div>
