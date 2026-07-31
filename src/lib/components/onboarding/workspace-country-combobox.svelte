<script lang="ts">
	import FormCombobox from '$lib/components/form/form-combobox.svelte';

	let {
		value = $bindable(''),
		countries,
		id,
		disabled = false,
		placeholder = 'Select a country',
		class: className
	}: {
		value?: string;
		countries: readonly string[];
		id?: string;
		disabled?: boolean;
		placeholder?: string;
		class?: string;
	} = $props();

	const options = $derived(countries.map((country) => ({ value: country, label: country })));
</script>

<FormCombobox
	{id}
	{disabled}
	{placeholder}
	class={className}
	bind:value
	{options}
	searchPlaceholder="Search country..."
	emptyText="No country found."
/>
