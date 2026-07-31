<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
</script>

<Form.FieldErrors>
	{#snippet children({ errors, errorProps })}
		{#if errors[0]}
			<div {...errorProps}>{errors[0]}</div>
		{/if}
	{/snippet}
</Form.FieldErrors>
