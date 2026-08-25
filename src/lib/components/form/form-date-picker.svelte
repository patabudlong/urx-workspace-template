<script lang="ts">
	import {
		getLocalTimeZone,
		parseDate,
		type CalendarDate,
		type DateValue
	} from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { tick } from 'svelte';

	let {
		value = $bindable(''),
		id,
		name,
		disabled = false,
		placeholder = 'Select date',
		class: className,
		minValue,
		maxValue,
		'aria-invalid': ariaInvalid,
		'aria-describedby': ariaDescribedBy
	}: {
		value?: string;
		id?: string;
		name?: string;
		disabled?: boolean;
		placeholder?: string;
		class?: string;
		minValue?: DateValue;
		maxValue?: DateValue;
		'aria-invalid'?: boolean | 'true' | 'false';
		'aria-describedby'?: string;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let selected = $state<CalendarDate | undefined>();

	function parsePayrollDate(value: string): CalendarDate | undefined {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return undefined;
		}

		try {
			return parseDate(value);
		} catch {
			return undefined;
		}
	}

	$effect(() => {
		const next = parsePayrollDate(value);

		if ((next?.toString() ?? '') !== (selected?.toString() ?? '')) {
			selected = next;
		}
	});

	const displayLabel = $derived(
		selected
			? new Intl.DateTimeFormat(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				}).format(selected.toDate(getLocalTimeZone()))
			: placeholder
	);

	function closeAndFocusTrigger() {
		open = false;

		void tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}
	<Popover.Trigger bind:ref={triggerRef} {disabled}>
		{#snippet child({ props })}
			<Button
				{...props}
				{id}
				variant="outline"
				{disabled}
				aria-invalid={ariaInvalid}
				aria-describedby={ariaDescribedBy}
				class={cn(
					'h-10 w-full justify-between px-3 font-normal',
					!selected && 'text-muted-foreground',
					'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
					className
				)}
			>
				<span class="flex min-w-0 items-center gap-2 truncate">
					<CalendarIcon class="size-4 shrink-0 opacity-50" aria-hidden="true" />
					{displayLabel}
				</span>
				<ChevronDownIcon class="size-4 shrink-0 opacity-50" aria-hidden="true" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto overflow-hidden p-0" align="start" sideOffset={4}>
		<Calendar
			type="single"
			bind:value={selected}
			captionLayout="dropdown"
			{minValue}
			{maxValue}
			onValueChange={(next) => {
				value = next?.toString() ?? '';
				closeAndFocusTrigger();
			}}
		/>
	</Popover.Content>
</Popover.Root>
