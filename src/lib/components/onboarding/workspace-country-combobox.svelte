<script lang="ts">
	import FormCombobox from '$lib/components/form/form-combobox.svelte';

	let {
		value = $bindable(''),
		countries,
		id,
		disabled = false,
		placeholder = 'Select a country',
		class: className,
		'aria-invalid': ariaInvalid
	}: {
		value?: string;
		countries: readonly string[];
		id?: string;
		disabled?: boolean;
		placeholder?: string;
		class?: string;
		'aria-invalid'?: boolean | 'true' | 'false';
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
	aria-invalid={ariaInvalid}
	searchPlaceholder="Search country..."
	emptyText="No country found."
/>
