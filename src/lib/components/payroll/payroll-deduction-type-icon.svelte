<script lang="ts">
	import {
		resolvePhDeductionIconUrlFromMap,
		type PhDeductionIconKey
	} from '$lib/shared/payroll/deduction-icon-names';

	let {
		name,
		iconUrls,
		class: className = 'size-8 shrink-0 rounded-md object-contain bg-muted/40 p-0.5'
	}: {
		name: string;
		iconUrls: Partial<Record<PhDeductionIconKey, string>>;
		class?: string;
	} = $props();

	const iconUrl = $derived(resolvePhDeductionIconUrlFromMap(name, iconUrls));
</script>

{#if iconUrl}
	<img src={iconUrl} alt="" class={className} loading="lazy" decoding="async" />
{/if}
