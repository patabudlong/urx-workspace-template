<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import IdCardIcon from '@lucide/svelte/icons/id-card';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	let {
		label,
		employeeId = null,
		action = 'in',
		disabled = false,
		loading = false,
		complete = false,
		currentTime,
		onpunch
	}: {
		label: string;
		employeeId?: string | null;
		action?: 'in' | 'out';
		disabled?: boolean;
		loading?: boolean;
		complete?: boolean;
		currentTime: string;
		onpunch: () => void | Promise<void>;
	} = $props();

	let scanning = $state(false);
	let success = $state(false);

	async function handlePress() {
		if (disabled || loading || scanning || complete) {
			return;
		}

		scanning = true;
		success = false;

		await new Promise((resolve) => setTimeout(resolve, 900));

		try {
			await onpunch();
			success = true;
			await new Promise((resolve) => setTimeout(resolve, 700));
		} finally {
			scanning = false;
			success = false;
		}
	}
</script>

<div class="flex flex-col items-center">
	{#if employeeId}
		<div class="mb-8 flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
			<IdCardIcon class="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
			<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Employee ID</span>
			<span class="text-sm font-semibold tabular-nums">{employeeId}</span>
		</div>
	{/if}

	<div class="mb-10 text-center">
		<p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">Current time</p>
		<p class="mt-2 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">{currentTime}</p>
	</div>

	<div class="relative mb-10 flex items-center justify-center py-2">
		<div
			class={cn(
				'pointer-events-none absolute size-56 rounded-full border transition-all duration-700 sm:size-64',
				scanning
					? 'scale-110 border-border/50 opacity-100'
					: complete
						? 'scale-100 border-border/40 opacity-50'
						: 'scale-100 border-border/40 opacity-70'
			)}
			aria-hidden="true"
		></div>
		<div
			class={cn(
				'pointer-events-none absolute size-48 rounded-full border transition-all duration-500 sm:size-56',
				scanning ? 'animate-ping border-border/40' : 'border-border/30 opacity-60'
			)}
			aria-hidden="true"
		></div>

		<Button
			type="button"
			variant="outline"
			disabled={disabled || loading || complete}
			onclick={handlePress}
			class={cn(
				'relative z-10 size-40 rounded-full border-2 p-0 shadow-lg transition-all duration-300 sm:size-48',
				'border-emerald-500/70 shadow-[0_0_24px_rgba(52,211,153,0.45)]',
				scanning &&
					'border-emerald-400 bg-emerald-500/10 shadow-[0_0_36px_rgba(52,211,153,0.65)]',
				success && 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_32px_rgba(52,211,153,0.55)]',
				complete && 'border-emerald-500/40 opacity-70 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
				!scanning &&
					!success &&
					!complete &&
					'hover:border-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_32px_rgba(52,211,153,0.55)]'
			)}
			aria-label={label}
		>
			<span class="flex flex-col items-center gap-3">
				{#if loading || scanning}
					<Loader2Icon
						class="size-14 animate-spin text-emerald-600 sm:size-16 dark:text-emerald-400"
						aria-hidden="true"
					/>
				{:else if success}
					<CheckIcon class="size-14 text-emerald-600 sm:size-16" aria-hidden="true" />
				{:else if complete}
					<CheckIcon class="text-muted-foreground size-14 sm:size-16" aria-hidden="true" />
				{:else}
					<FingerprintIcon
						class="size-14 text-emerald-600 sm:size-16 dark:text-emerald-400"
						aria-hidden="true"
					/>
				{/if}
				<span class="text-xs font-semibold tracking-wide uppercase">
					{scanning ? 'Scanning…' : success ? 'Recorded' : complete ? 'Complete' : 'Tap to scan'}
				</span>
			</span>

			{#if scanning}
				<span class="absolute inset-2 overflow-hidden rounded-full" aria-hidden="true">
					<span
						class="absolute inset-0 animate-[spin_1.2s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(52,211,153,0.45)_90deg,transparent_180deg)] opacity-80"
					></span>
				</span>
			{/if}
		</Button>
	</div>

	<div class="max-w-sm text-center">
		<p class="text-lg font-semibold">{label}</p>
		<p class="text-muted-foreground mt-2 text-sm">
			{#if complete}
				All punches for today are recorded.
			{:else if scanning}
				Hold still while we verify your fingerprint…
			{:else}
				Press the scanner to emulate a biometric clock {action === 'in' ? 'in' : 'out'}.
			{/if}
		</p>
	</div>
</div>
