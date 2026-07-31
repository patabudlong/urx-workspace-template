<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';

	export type FormComboboxOption = {
		value: string;
		label: string;
		keywords?: string[];
	};

	let {
		value = $bindable(''),
		options,
		id,
		disabled = false,
		placeholder = 'Select an option',
		searchPlaceholder = 'Search...',
		emptyText = 'No results found.',
		class: className
	}: {
		value?: string;
		options: readonly FormComboboxOption[];
		id?: string;
		disabled?: boolean;
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		class?: string;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? '');

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} {disabled}>
		{#snippet child({ props })}
			<Button
				{...props}
				{id}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				{disabled}
				class={cn(
					'h-8 w-full justify-between px-2.5 font-normal',
					!selectedLabel && 'text-muted-foreground',
					className
				)}
			>
				<span class="truncate">{selectedLabel || placeholder}</span>
				<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-(--bits-popover-anchor-width) p-0" align="start" sideOffset={4}>
		<Command.Root class="rounded-lg p-0 shadow-none">
			<Command.Input placeholder={searchPlaceholder} />
			<Command.List>
				<Command.Empty>{emptyText}</Command.Empty>
				<Command.Group>
					{#each options as option (option.value)}
						<Command.Item
							value={option.label}
							keywords={option.keywords ?? [option.value]}
							onSelect={() => {
								value = option.value;
								closeAndFocusTrigger();
							}}
						>
							{option.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
