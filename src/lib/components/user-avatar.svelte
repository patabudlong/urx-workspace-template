<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		avatarUrl = null,
		initials = '?',
		class: className = 'size-8'
	}: {
		avatarUrl?: string | null;
		initials?: string;
		class?: string;
	} = $props();

	let imageError = $state(false);

	$effect(() => {
		avatarUrl;
		imageError = false;
	});

	const showImage = $derived(Boolean(avatarUrl) && !imageError);
</script>

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
