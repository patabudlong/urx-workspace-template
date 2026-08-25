<script lang="ts">
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import GradientButton from '$lib/components/gradient-button.svelte';
	import GradientText from '$lib/components/gradient-text.svelte';
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getHttpErrorGradientTone } from '$lib/shared/brand-gradients';
	import type { HttpErrorPresentation } from '$lib/shared/http-errors';
	import { cn } from '$lib/utils.js';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import ServerCrashIcon from '@lucide/svelte/icons/server-crash';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import type { Component } from 'svelte';

	let {
		status,
		presentation
	}: {
		status: number;
		presentation: HttpErrorPresentation;
	} = $props();

	const gradientTone = $derived(getHttpErrorGradientTone(status));
	const isServerError = $derived(status >= 500);
	const isForbidden = $derived(status === 403);
	const isNotFound = $derived(status === 404);

	const statusLabel = $derived(
		isServerError
			? 'Server error'
			: isForbidden
				? 'Access denied'
				: isNotFound
					? 'Not found'
					: 'Error'
	);

	const iconByStatus: Record<number, Component> = {
		403: ShieldAlertIcon,
		404: FileQuestionIcon
	};

	const StatusIcon = $derived(
		isServerError ? ServerCrashIcon : (iconByStatus[status] ?? TriangleAlertIcon)
	);

	const secondaryActionIcon = $derived(
		presentation.secondaryAction?.label === 'Try again'
			? RotateCcwIcon
			: presentation.secondaryAction?.method === 'POST'
				? LogOutIcon
				: null
	);
</script>

<StandalonePageShell
	href="/"
	mainClass="relative isolate flex items-center justify-center overflow-hidden px-4 py-12 sm:px-6"
>
	{#snippet actions()}
		<ThemeToggle iconClass="size-5" />
	{/snippet}

	<div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class={cn(
				'absolute -top-32 left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl',
				isServerError
					? 'bg-destructive/12'
					: isNotFound
						? 'bg-primary/10'
						: 'bg-secondary/10'
			)}
		></div>
		<div
			class="bg-muted/50 absolute -right-16 bottom-0 size-64 rounded-full blur-3xl"
		></div>
		<div
			class="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(color-mix(in_srgb,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:1.25rem_1.25rem] dark:opacity-[0.2]"
		></div>
	</div>

	<div
		class="relative z-10 grid w-full max-w-4xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14"
	>
		<div class="relative hidden min-h-56 items-center justify-center lg:flex">
			<GradientText
				tone={gradientTone}
				direction="vertical"
				as="p"
				class="select-none text-[clamp(5.5rem,14vw,9.5rem)] leading-none font-semibold tracking-tighter"
			>
				{status}
			</GradientText>
			<div
				class={cn(
					'absolute right-8 bottom-8 flex size-14 items-center justify-center rounded-2xl shadow-lg ring-1 backdrop-blur-md',
					isServerError
						? 'bg-destructive/12 text-destructive ring-destructive/20'
						: 'bg-background/80 text-primary ring-border/60'
				)}
			>
				<StatusIcon class="size-7" aria-hidden="true" />
			</div>
		</div>

		<section
			class="bg-card/75 animate-in fade-in slide-in-from-bottom-4 border-border/60 relative overflow-hidden rounded-2xl border p-8 shadow-xl ring-1 ring-foreground/5 backdrop-blur-xl duration-500 sm:p-10"
		>
			<div
				aria-hidden="true"
				class={cn(
					'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
					isServerError
						? 'via-destructive/40'
						: isForbidden
							? 'via-amber-500/35'
							: 'via-primary/35'
				)}
			></div>

			<div class="flex flex-col items-start gap-6 text-left">
				<div class="flex flex-wrap items-center gap-3">
					<Badge
						variant={isServerError ? 'destructive' : 'secondary'}
						class="gap-1.5 uppercase tracking-wide"
					>
						<StatusIcon class="size-3.5" aria-hidden="true" />
						{statusLabel}
					</Badge>
					<GradientText
						tone={gradientTone}
						as="span"
						class="text-sm font-semibold lg:hidden"
					>
						{status}
					</GradientText>
				</div>

				<div class="space-y-2">
					<GradientText
						tone={gradientTone}
						as="h1"
						class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
					>
						{presentation.title}
					</GradientText>
					<p class="text-muted-foreground max-w-prose text-sm leading-relaxed text-pretty">
						{presentation.description}
					</p>
				</div>

				<Separator class="bg-border/70" />

				<div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
					<GradientButton
						href={presentation.primaryAction.href}
						tone={gradientTone}
						class={cn(AUTH_ACTION_BUTTON_CLASS, 'sm:w-auto')}
					>
						<LayoutDashboardIcon class="size-4" aria-hidden="true" />
						{presentation.primaryAction.label}
					</GradientButton>
					{#if presentation.secondaryAction}
						{#if presentation.secondaryAction.method === 'POST'}
							<form method="POST" action={presentation.secondaryAction.href} class="contents">
								<GradientButton
									type="submit"
									tone={gradientTone}
									appearance="outline"
									class={cn(AUTH_ACTION_BUTTON_CLASS, 'sm:w-auto')}
								>
									{#if secondaryActionIcon}
										{@const Icon = secondaryActionIcon}
										<Icon class="size-4" aria-hidden="true" />
									{/if}
									{presentation.secondaryAction.label}
								</GradientButton>
							</form>
						{:else}
							<GradientButton
								href={presentation.secondaryAction.href}
								tone={gradientTone}
								appearance="outline"
								class={cn(AUTH_ACTION_BUTTON_CLASS, 'sm:w-auto')}
							>
								{#if secondaryActionIcon}
									{@const Icon = secondaryActionIcon}
									<Icon class="size-4" aria-hidden="true" />
								{/if}
								{presentation.secondaryAction.label}
							</GradientButton>
						{/if}
					{/if}
				</div>

				{#if presentation.hint}
					<p class="text-muted-foreground text-xs leading-relaxed">{presentation.hint}</p>
				{/if}
			</div>
		</section>
	</div>
</StandalonePageShell>
