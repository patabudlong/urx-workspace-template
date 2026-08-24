<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { DTR_DAY_STATUS_LABELS, type DtrDayStatus } from '$lib/shared/dtr/status';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_LOCKED_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		status,
		dayOfMonth,
		holidayName = null,
		locked = false,
		selected = false,
		isToday = false,
		interactive = false,
		onclick
	}: {
		status: DtrDayStatus;
		dayOfMonth: number;
		holidayName?: string | null;
		locked?: boolean;
		selected?: boolean;
		isToday?: boolean;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();

	const title = $derived(
		locked
			? `${DTR_DAY_STATUS_LABELS[status]} · Locked for payroll`
			: holidayName
				? `${DTR_DAY_STATUS_LABELS[status]} · ${holidayName}`
				: DTR_DAY_STATUS_LABELS[status]
	);

	const cellClasses = $derived(
		holidayName ? DTR_DAY_HOLIDAY_CELL_CLASSES : DTR_DAY_STATUS_CELL_CLASSES[status]
	);

	const sharedClasses = $derived(
		cn(
			'relative flex h-11 w-full min-w-8 flex-col items-center justify-center rounded-lg text-xs font-medium transition-[color,box-shadow,transform]',
			cellClasses,
			locked && DTR_DAY_LOCKED_CELL_CLASSES,
			isToday && !selected && 'ring-primary/40 ring-1 ring-inset',
			selected && 'ring-primary shadow-sm ring-2 ring-offset-2 ring-offset-background',
			interactive && 'hover:brightness-[1.03] active:scale-[0.97]'
		)
	);
</script>

{#if interactive}
	<button type="button" class={cn(sharedClasses, 'cursor-pointer')} title={title} {onclick}>
		{#if locked}
			<LockIcon
				class="absolute top-1 right-1 size-3 opacity-70"
				aria-hidden="true"
			/>
		{/if}
		{#if holidayName}
			<span class="leading-none">{dayOfMonth}</span>
			<span class="text-[10px] leading-none opacity-90">Holiday</span>
		{:else}
			{dayOfMonth}
		{/if}
	</button>
{:else}
	<div class={sharedClasses} title={title}>
		{#if locked}
			<LockIcon
				class="absolute top-1 right-1 size-3 opacity-70"
				aria-hidden="true"
			/>
		{/if}
		{#if holidayName}
			<span class="leading-none">{dayOfMonth}</span>
			<span class="text-[10px] leading-none opacity-90">Holiday</span>
		{:else}
			{dayOfMonth}
		{/if}
	</div>
{/if}
