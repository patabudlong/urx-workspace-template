<script lang="ts">
	import LockIcon from '@lucide/svelte/icons/lock';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<LockIcon class={cn('text-muted-foreground opacity-90', className)} aria-hidden="true" />
