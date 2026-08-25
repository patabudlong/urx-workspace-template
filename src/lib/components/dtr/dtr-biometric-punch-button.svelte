<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		label,
		action = 'in',
		disabled = false,
		loading = false,
		complete = false,
		currentTime,
		onpunch
	}: {
		label: string;
		action?: 'in' | 'out';
		disabled?: boolean;
		loading?: boolean;
		complete?: boolean;
		currentTime: string;
		onpunch: () => void | Promise<void>;
	} = $props();

	let scanning = $state(false);
	let success = $state(false);

	const ActionIcon = $derived(action === 'in' ? LogInIcon : LogOutIcon);

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

<div class="flex flex-col items-center gap-6">
	<div class="text-center">
		<p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">Current time</p>
		<p class="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">{currentTime}</p>
	</div>

	<div class="relative flex items-center justify-center">
		<div
			class={cn(
				'pointer-events-none absolute size-56 rounded-full border transition-all duration-700 sm:size-64',
				scanning
					? 'border-primary/50 scale-110 opacity-100'
					: complete
						? 'border-emerald-500/30 scale-100 opacity-60'
						: 'border-primary/20 scale-100 opacity-80'
			)}
			aria-hidden="true"
		></div>
		<div
			class={cn(
				'pointer-events-none absolute size-48 rounded-full border transition-all duration-500 sm:size-56',
				scanning
					? 'border-primary/30 animate-ping'
					: 'border-primary/10 opacity-60'
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
				scanning && 'border-primary bg-primary/5 shadow-primary/20',
				success && 'border-emerald-500 bg-emerald-500/10',
				complete && 'opacity-70',
				!scanning && !success && !complete && 'hover:border-primary hover:bg-primary/5 hover:shadow-primary/10'
			)}
			aria-label={label}
		>
			<span class="flex flex-col items-center gap-3">
				{#if loading || scanning}
					<Loader2Icon class="text-primary size-14 animate-spin sm:size-16" aria-hidden="true" />
				{:else if success}
					<CheckIcon class="size-14 text-emerald-600 sm:size-16" aria-hidden="true" />
				{:else if complete}
					<CheckIcon class="text-muted-foreground size-14 sm:size-16" aria-hidden="true" />
				{:else}
					<FingerprintIcon class="text-primary size-14 sm:size-16" aria-hidden="true" />
				{/if}
				<span class="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
					<ActionIcon class="size-3.5" aria-hidden="true" />
					{scanning ? 'Scanning…' : success ? 'Recorded' : complete ? 'Complete' : 'Tap to scan'}
				</span>
			</span>

			{#if scanning}
				<span
					class="from-primary/0 via-primary/30 to-primary/0 absolute inset-2 overflow-hidden rounded-full"
					aria-hidden="true"
				>
					<span class="animate-[spin_1.2s_linear_infinite] absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,currentColor_90deg,transparent_180deg)] opacity-70"></span>
				</span>
			{/if}
		</Button>
	</div>

	<div class="max-w-sm text-center">
		<p class="text-lg font-semibold">{label}</p>
		<p class="text-muted-foreground mt-1 text-sm">
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
