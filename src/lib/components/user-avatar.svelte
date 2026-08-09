<script lang="ts">
	import PresenceStatusIndicator from '$lib/components/presence-status-indicator.svelte';
	import type { PresenceStatus } from '$lib/shared/presence';
	import { cn } from '$lib/utils.js';

	let {
		avatarUrl = null,
		initials = '?',
		presenceStatus = null,
		class: className = 'size-8'
	}: {
		avatarUrl?: string | null;
		initials?: string;
		presenceStatus?: PresenceStatus | null;
		class?: string;
	} = $props();

	let imageError = $state(false);

	$effect(() => {
		avatarUrl;
		imageError = false;
	});

	const showImage = $derived(Boolean(avatarUrl) && !imageError);
	const showPresence = $derived(presenceStatus != null);
</script>

<div class={cn('relative inline-flex shrink-0', showPresence && 'size-fit')}>
	{#if showImage}
		<img
			src={avatarUrl}
			alt=""
			class={cn('ring-border shrink-0 rounded-full object-cover ring-1', className)}
			width="32"
			height="32"
			referrerpolicy="no-referrer"
			onerror={() => {
				imageError = true;
			}}
		/>
	{:else}
		<span
			class={cn(
				'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full text-xs font-semibold',
				className
			)}
			aria-hidden="true"
		>
			{initials}
		</span>
	{/if}
	{#if showPresence && presenceStatus}
		<PresenceStatusIndicator
			status={presenceStatus}
			class="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4"
		/>
	{/if}
</div>
