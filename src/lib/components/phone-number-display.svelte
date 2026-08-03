<script lang="ts">
	import { displayContactPhone } from '$lib/shared/phone-country-codes';
	import { cn } from '$lib/utils.js';

	let {
		phoneNumber,
		class: className
	}: {
		phoneNumber: string | null | undefined;
		class?: string;
	} = $props();

	const display = $derived(displayContactPhone(phoneNumber));
</script>

{#if display}
	<span class={cn('inline-flex items-center gap-1.5', className)}>
		<span aria-hidden="true">{display.flag}</span>
		<span class="tabular-nums">{display.formatted}</span>
	</span>
{/if}
