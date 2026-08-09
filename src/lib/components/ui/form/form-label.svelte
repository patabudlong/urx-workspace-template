<script lang="ts">
	import * as FormPrimitive from "formsnap";
	import { getFormField } from "formsnap";
	import { Label } from "$lib/components/ui/label/index.js";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		children,
		class: className,
		required,
		...restProps
	}: WithoutChild<FormPrimitive.LabelProps> & {
		required?: boolean;
	} = $props();

	const field = getFormField({});
	const showRequired = $derived(required ?? field.constraints?.required === true);
</script>

<FormPrimitive.Label {...restProps} bind:ref>
	{#snippet child({ props })}
		<Label
			{...props}
			data-slot="form-label"
			class={cn("data-[fs-error]:text-destructive", className)}
		>
			<span class="inline-flex items-baseline gap-1.5">
				{@render children?.()}
				{#if showRequired}
					<span
						class="text-muted-foreground text-[0.65rem] font-normal tracking-wide uppercase"
						aria-hidden="true"
					>
						Required
					</span>
				{/if}
			</span>
		</Label>
	{/snippet}
</FormPrimitive.Label>
