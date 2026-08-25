<script lang="ts">
	let {
		workspaceName,
		referenceNumber = null,
		periodLabel = null,
		class: className = ''
	}: {
		workspaceName: string;
		referenceNumber?: string | null;
		periodLabel?: string | null;
		class?: string;
	} = $props();
</script>

<div class="text-right {className}">
	<p class="truncate text-base font-semibold">{workspaceName}</p>
	{#if referenceNumber}
		<p class="text-muted-foreground text-xs">Reference: {referenceNumber}</p>
	{/if}
	{#if periodLabel}
		<p class="text-muted-foreground text-xs">{periodLabel}</p>
	{/if}
</div>
