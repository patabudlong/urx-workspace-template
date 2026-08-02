<script lang="ts">
	import { cn } from '$lib/utils.js';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';

	let { class: className }: { class?: string } = $props();
</script>

<a
	href="/team/roles"
	class={cn(
		'text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline',
		className
	)}
>
	<KeyRoundIcon class="size-3.5 shrink-0" aria-hidden="true" />
	Learn about roles
</a>
