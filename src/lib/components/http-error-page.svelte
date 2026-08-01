<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import type { HttpErrorPresentation } from '$lib/shared/http-errors';
	import { APP_NAME } from '$lib/shared/site-meta';
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

<div class="bg-background flex min-h-svh flex-col">
	<header class="border-border/60 border-b px-4 py-4 sm:px-6">
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-4">
			<a href="/" class="flex min-w-0 items-center gap-3">
				<UrixoftLogo class="size-8 shrink-0 rounded-sm" />
				<span class="truncate text-sm font-medium">{APP_NAME}</span>
			</a>
			<ThemeToggle iconClass="size-5" />
		</div>
	</header>

	<main class="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
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
	</main>
</div>
