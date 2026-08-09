<script lang="ts">
	import { getWorkspaceInitials } from '$lib/shared/workspace-context';
	import { cn } from '$lib/utils.js';

	let {
		workspaceName,
		brandLogoUrl = null,
		class: className = 'size-8'
	}: {
		workspaceName: string;
		brandLogoUrl?: string | null;
		class?: string;
	} = $props();

	let imageError = $state(false);

	const initials = $derived(getWorkspaceInitials(workspaceName));

	$effect(() => {
		brandLogoUrl;
		imageError = false;
	});

	const showImage = $derived(Boolean(brandLogoUrl) && !imageError);
</script>

{#if showImage}
	<img
		src={brandLogoUrl}
		alt=""
		class={cn('ring-border shrink-0 rounded-lg object-cover ring-1', className)}
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
			'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
			className
		)}
		aria-hidden="true"
	>
		{initials}
	</span>
{/if}
