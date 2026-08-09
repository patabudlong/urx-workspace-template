<script lang="ts">
	import type { PresenceStatus } from '$lib/shared/presence';
	import { cn } from '$lib/utils.js';

	let {
		status,
		class: className = ''
	}: {
		status: PresenceStatus;
		class?: string;
	} = $props();

	const statusClass = $derived(
		{
			online: 'bg-emerald-500',
			away: 'bg-amber-500',
			busy: 'bg-destructive',
			offline: 'bg-muted-foreground/50'
		}[status]
	);
</script>

<span
	class={cn('ring-background size-2.5 shrink-0 rounded-full ring-2', statusClass, className)}
	aria-hidden="true"
></span>
