<script lang="ts">
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
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

<div class="grid min-h-svh lg:grid-cols-2">
	<aside
		class="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14"
		aria-hidden="true"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
		></div>
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:3rem_3rem]"
		></div>

		<div class="relative z-10 flex flex-col gap-10">
			<UrixoftLogo variant="white" class="size-12 shrink-0" />

			<div class="space-y-4">
				<h1 class="max-w-md text-3xl font-semibold tracking-tight text-primary-foreground xl:text-4xl">
					Your service business workspace, made simple.
				</h1>
				<p class="max-w-md text-base leading-relaxed text-primary-foreground/80 xl:text-lg">
					Manage Jobs, Clients, and your Team in one place.
				</p>
			</div>

			<ul class="max-w-md space-y-3">
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

		<p class="relative z-10 text-sm text-primary-foreground/60">© {year} Urixoft Platform. All rights reserved.</p>
	</aside>

	<div class="bg-background flex min-h-svh flex-col">
		{@render children?.()}
	</div>
</div>
