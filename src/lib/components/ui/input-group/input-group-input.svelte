<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> & {
			type?: InputType;
			"data-slot"?: string;
		}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		class: className,
		"data-slot": dataSlot = "input-group-control",
		...restProps
	}: Props = $props();
</script>

<input
	bind:this={ref}
	data-slot={dataSlot}
	{type}
	class={cn(
		"h-8 w-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 py-1 text-base shadow-none outline-none ring-0 transition-colors placeholder:text-muted-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-0 focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent md:text-sm dark:bg-transparent dark:disabled:bg-transparent aria-invalid:ring-0 [-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] [-webkit-autofill]:shadow-[inset_0_0_0_1000px_transparent] [-webkit-autofill:focus]:shadow-[inset_0_0_0_1000px_transparent]",
		className
	)}
	bind:value
	{...restProps}
/>
