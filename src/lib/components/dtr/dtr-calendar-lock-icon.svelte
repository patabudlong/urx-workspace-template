<script lang="ts">
	import DtrLockIcon from '$lib/components/dtr/dtr-lock-icon.svelte';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<DtrLockIcon class={cn('absolute top-2 right-2 size-5', className)} />
