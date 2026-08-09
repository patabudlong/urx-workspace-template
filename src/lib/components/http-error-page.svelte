<script lang="ts">
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { HttpErrorPresentation } from '$lib/shared/http-errors';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import type { Component } from 'svelte';

	let {
		status,
		presentation
	}: {
		status: number;
		presentation: HttpErrorPresentation;
	} = $props();

	const iconByStatus: Record<number, Component> = {
		403: ShieldAlertIcon,
		404: FileQuestionIcon
	};

	const StatusIcon = $derived(iconByStatus[status] ?? CircleAlertIcon);
</script>

<StandalonePageShell href="/" mainClass="flex items-center justify-center px-4 py-10 sm:px-6">
	{#snippet actions()}
		<ThemeToggle iconClass="size-5" />
	{/snippet}

	<div class="w-full max-w-lg text-center">
		<div
			class="bg-muted text-muted-foreground mx-auto mb-6 flex size-14 items-center justify-center rounded-full"
		>
			<StatusIcon class="size-7" aria-hidden="true" />
		</div>

		<p class="text-primary text-sm font-semibold tracking-wide uppercase">{status}</p>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">{presentation.title}</h1>
		<p class="text-muted-foreground mt-3 text-sm leading-relaxed">
			{presentation.description}
		</p>

		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<Button href={presentation.primaryAction.href} class="min-w-40">
				{presentation.primaryAction.label}
			</Button>
			{#if presentation.secondaryAction}
				{#if presentation.secondaryAction.method === 'POST'}
					<form method="POST" action={presentation.secondaryAction.href} class="contents">
						<Button
							type="submit"
							variant={presentation.secondaryAction.variant ?? 'outline'}
							class="min-w-40"
						>
							{presentation.secondaryAction.label}
						</Button>
					</form>
				{:else}
					<Button
						href={presentation.secondaryAction.href}
						variant={presentation.secondaryAction.variant ?? 'outline'}
						class="min-w-40"
					>
						{presentation.secondaryAction.label}
					</Button>
				{/if}
			{/if}
		</div>
	</div>
</StandalonePageShell>
